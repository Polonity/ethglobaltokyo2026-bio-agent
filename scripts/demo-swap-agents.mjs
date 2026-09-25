import { spawn, execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
import { JsonRpcProvider, ContractFactory, AbiCoder, id, sha256, toUtf8Bytes } from 'ethers';
import { readSwapReceipt } from '../services/backend/adapters/uniswap-swap.mjs';
import { UniswapSwapBioAgent } from '../packages/bio_agent/runtime/swap-agent.js';

// Separate Anvil process: never resets or modifies the existing GUI's chain.
execFileSync(process.env.FORGE || 'forge', ['build', '--root', 'contracts'], { stdio: 'pipe' });
const port = 18545;
// Abort on an occupied port before spawning; never send transactions to an existing service.
const { createServer } = await import('node:net');
await new Promise((resolve, reject) => {
  const probe = createServer();
  probe.once('error', reject);
  probe.listen(port, '127.0.0.1', () => probe.close(resolve));
});
const anvil = spawn(
  process.env.ANVIL || 'anvil',
  ['--host', '127.0.0.1', '--port', String(port), '--silent'],
  { stdio: 'ignore' },
);
let spawnError;
anvil.on('error', (error) => {
  spawnError = error;
});
const provider = new JsonRpcProvider(`http://127.0.0.1:${port}`, 31337, { staticNetwork: true });
provider.pollingInterval = 50;
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (spawnError) throw spawnError;
    if (anvil.exitCode !== null) throw new Error('Own Anvil failed to start');
    try {
      await provider.send('eth_chainId', []);
      ready = true;
      break;
    } catch {
      await delay(100);
    }
  }
  if (!ready) throw new Error('Anvil startup timeout');
  const signer = await provider.getSigner(0);
  const deploy = async (name) => {
    const artifact = JSON.parse(await readFile(`contracts/out/${name}.sol/${name}.json`, 'utf8'));
    const contract = await new ContractFactory(artifact.abi, artifact.bytecode.object, signer).deploy();
    await contract.waitForDeployment();
    return contract;
  };
  const registry = await deploy('BioAgentStimulusRegistry');
  const fixture = await deploy('SwapEventFixture');
  const pool = await fixture.getAddress();
  const market = { chainId: 31337, pool, confirmations: 1 };
  const agents = [];
  for (let i = 1; i <= 3; i++) {
    await (
      await registry.registerAgent(sha256(toUtf8Bytes('fixture-model-manifest')), `ipfs://fixture-${i}`)
    ).wait();
    agents.push(
      new UniswapSwapBioAgent(
        { id: String(i), owner: await signer.getAddress() },
        { ...market, seed: 2026 + i },
      ),
    );
  }
  const rounds = [];
  const schema = id('bioagent.uniswap-v3-swap.v1');
  for (const [label, sqrt] of [
    ['baseline', 2n ** 96n],
    ['up', (2n ** 96n * 11n) / 10n],
    ['down', 2n ** 96n],
  ]) {
    const receipt = await (await fixture.emitPrice(sqrt)).wait();
    // Avoid provider head cache while checking a just-mined receipt.
    const reader = {
      getNetwork: provider.getNetwork.bind(provider),
      getTransactionReceipt: provider.getTransactionReceipt.bind(provider),
      getBlock: provider.getBlock.bind(provider),
    };
    reader.getBlockNumber = async () => Number(BigInt(await provider.send('eth_blockNumber', [])));
    const [event] = await readSwapReceipt(reader, market, receipt.hash);
    assert.ok(event);
    const payload = AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'address', 'bytes32', 'bytes32', 'uint256', 'uint160'],
      [31337, pool, event.blockHash, event.transactionHash, event.logIndex, event.sqrtPriceX96],
    );
    const reactions = [];
    for (const [i, agent] of agents.entries()) {
      const nonce = await registry.stimulusNonce(i + 1);
      const accepted = await (await registry.submitStimulus(i + 1, nonce, schema, payload)).wait();
      const log = accepted.logs
        .map((l) => {
          try {
            return registry.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .find((l) => l?.name === 'BioAgentStimulusAccepted');
      assert.equal(log.args.payload, payload);
      const decoded = AbiCoder.defaultAbiCoder().decode(
        ['uint256', 'address', 'bytes32', 'bytes32', 'uint256', 'uint160'],
        log.args.payload,
      );
      assert.equal(decoded[0], BigInt(event.chainId));
      assert.equal(decoded[1].toLowerCase(), event.pool.toLowerCase());
      assert.equal(decoded[2], event.blockHash);
      assert.equal(decoded[3], event.transactionHash);
      assert.equal(decoded[4], BigInt(event.logIndex));
      assert.equal(decoded[5], BigInt(event.sqrtPriceX96));
      const result = agent.observe(event, event.observedAt);
      for (let tick = 0; tick < 20; tick++) agent.step(0.2, event.observedAt);
      assert.equal(result.reaction, label === 'up' ? 'curious' : label === 'down' ? 'cautious' : 'baseline');
      reactions.push({
        agentId: i + 1,
        reaction: result.reaction,
        deltaBps: result.deltaBps,
        inputTx: accepted.hash,
        snapshot: agent.snapshot(),
      });
    }
    rounds.push({ label, sourceTx: receipt.hash, event, reactions });
    console.log(
      `${label}: ${reactions.map((r) => `${r.agentId}=${r.reaction} (${r.deltaBps} bps)`).join(', ')}`,
    );
  }
  const evidence = {
    mode: 'ANVIL_EVENT_FIXTURE',
    actualUniswap: false,
    registry: await registry.getAddress(),
    eventFixture: pool,
    schema,
    rounds,
  };
  await mkdir('artifacts/swap-demo', { recursive: true });
  await writeFile('artifacts/swap-demo/evidence.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log('Verified 3 agents, 3 source events, 9 accepted input transactions. Not a real Uniswap swap.');
} finally {
  provider.destroy();
  anvil.kill('SIGTERM');
}
