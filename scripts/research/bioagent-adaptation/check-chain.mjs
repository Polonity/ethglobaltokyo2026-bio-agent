import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { JsonRpcProvider, ContractFactory } from 'ethers';
import { EvmBioAgentSource } from '../../../packages/bioagent-framework/src/evm-source.js';
import { LearningBioAgent, ChainDecisionRunner } from '../../../packages/bioagent-framework/src/index.js';
import { ForagingBackend, AquaBackend } from '../../../packages/bioagent-framework/src/adapters.js';
import { MALE_CNS } from '../../../packages/bio_agent/connectome/male-cns.js';
const out = 'artifacts/bioagent-adaptation-20260926';
const binary = (name) =>
  process.env[name.toUpperCase()] ||
  (existsSync(path.join(homedir(), '.foundry/bin', name))
    ? path.join(homedir(), '.foundry/bin', name)
    : name);
execFileSync(binary('forge'), ['build', '--root', 'contracts', '--offline'], { stdio: 'pipe' });
const probe = createServer();
await new Promise((resolve, reject) => {
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', resolve);
});
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const child = spawn(
  binary('anvil'),
  ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '31339', '--silent'],
  { stdio: 'ignore' },
);
let spawnError;
child.on('error', (e) => (spawnError = e));
const rpc = `http://127.0.0.1:${port}`,
  provider = new JsonRpcProvider(rpc);
provider.pollingInterval = 50;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (spawnError || child.exitCode !== null) throw spawnError || Error('Own Anvil failed to start');
    try {
      assert.equal(await provider.send('eth_chainId', []), '0x7a6b');
      ready = true;
      break;
    } catch {
      await delay(50);
    }
  }
  assert.ok(ready, 'Own Anvil startup');
  const signer = await provider.getSigner(0),
    owner = (await signer.getAddress()).toLowerCase();
  const artifact = JSON.parse(
    await fs.readFile('contracts/out/BioAgentRegistry.sol/BioAgentRegistry.json', 'utf8'),
  );
  const registry = await new ContractFactory(artifact.abi, artifact.bytecode.object, signer).deploy();
  await registry.waitForDeployment();
  await (await registry.registerAgent(MALE_CNS.graphSha256, 'local:framework-connectome')).wait();
  const config = { chainId: 31339, registry: await registry.getAddress(), agentId: '1', confirmations: 0 };
  const source = new EvmBioAgentSource(provider, config),
    identity = { id: 'framework-chain-1', owner };
  const agents = [
    new LearningBioAgent(identity, new ForagingBackend()),
    new LearningBioAgent(identity, new AquaBackend()),
  ];
  const runners = agents.map((a) => new ChainDecisionRunner(a, { ...config, minConfirmations: 0, source }));
  const traces = [];
  for (const [activity, energy, stimulus] of [
    [2, 7000, 1000],
    [0, 3500, 9000],
    [2, 9000, 2800],
  ]) {
    const status = await registry.getStatus(1),
      receipt = await (await registry.updateStatus(1, status.revision, activity, energy, stimulus)).wait();
    const observation = await source.read();
    assert.equal(observation.status.revision, (status.revision + 1n).toString());
    const outputs = [];
    for (const r of runners) {
      r.observe(observation);
      outputs.push(await r.decide());
    }
    assert.ok(
      outputs.every((o) => o.input.block.hash === receipt.blockHash && o.input.status.stimulus === stimulus),
    );
    traces.push({ transactionHash: receipt.hash, blockHash: receipt.blockHash, observation, outputs });
  }
  assert.notEqual(traces[0].outputs[1].decision.action, traces[1].outputs[1].decision.action);
  const cli = JSON.parse(
    execFileSync(
      process.execPath,
      [
        'packages/bioagent-framework/examples/read-chain.mjs',
        rpc,
        '31339',
        config.registry,
        '1',
        'aqua',
        '0',
      ],
      { encoding: 'utf8', timeout: 20000 },
    ),
  );
  assert.equal(cli.input.status.revision, '4');
  assert.equal(cli.decision.action, traces[2].outputs[1].decision.action);
  const snap = await provider.send('evm_snapshot', []);
  await (await registry.updateStatus(1, 4, 2, 8000, 8000)).wait();
  runners[0].observe(await source.read());
  await provider.send('evm_revert', [snap]);
  assert.throws(() => runners[0].observe(traces.at(-1).observation), /Rollback/);
  await assert.rejects(new EvmBioAgentSource(provider, { ...config, chainId: 1 }).read(), /Wrong RPC chain/);
  // Track the successful source read: only read RPC methods may be called.
  const calls = [],
    send = provider.send.bind(provider);
  provider.send = async (method, args) => {
    calls.push(method);
    return send(method, args);
  };
  await source.read();
  assert.ok(
    calls.every((m) => ['eth_chainId', 'eth_blockNumber', 'eth_getBlockByNumber', 'eth_call'].includes(m)),
    calls.join(','),
  );
  const result = {
    mode: 'isolated-anvil-real-contract',
    chainId: 31339,
    registry: config.registry,
    model: MALE_CNS.graphSha256,
    tasks: agents.map((a) => a.binding.task),
    traces,
    cliVerified: true,
    rollbackRejected: true,
    wrongChainRejected: true,
    sourceReadMethods: calls,
    noLiveChainWrites: true,
    scope:
      'Real local Registry transactions and read-only framework decisions; not a swap or mainnet execution',
  };
  await fs.writeFile(`${out}/chain.json`, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify({
      passed: true,
      transitions: traces.length,
      decisions: traces.length * 2,
      cliVerified: true,
      rollbackRejected: true,
      readMethods: [...new Set(calls)],
    }),
  );
} finally {
  provider.destroy();
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    if (child.exitCode !== null) resolve();
    else child.once('exit', resolve);
  });
}
