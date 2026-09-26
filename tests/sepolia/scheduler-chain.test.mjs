import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { JsonRpcProvider, Wallet, ContractFactory, parseEther } from 'ethers';
import { StimulusScheduler, LIMITS } from '../../services/sepolia/scheduler.js';
import { registryRead } from '../../services/worker/registry-read.js';
import { batchedRpc } from '../../services/worker/rpc-read.js';

test('scheduler retries one signed TX, survives restart, and shares verified history reads', async () => {
  const probe = createServer();
  await new Promise((r) => probe.listen(0, '127.0.0.1', r));
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const child = spawn(
    process.env.ANVIL || path.join(os.homedir(), '.foundry/bin/anvil'),
    ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '11155111', '--silent'],
    { stdio: 'ignore' },
  );
  const rpcURL = `http://127.0.0.1:${port}`;
  const p = new JsonRpcProvider(rpcURL, undefined, { batchMaxCount: 1, cacheTimeout: -1 });
  p.pollingInterval = 20;
  try {
    for (let i = 0; i < 60; i++) {
      try {
        await p.send('eth_chainId', []);
        break;
      } catch {
        await delay(50);
      }
    }
    const wallet = Wallet.createRandom().connect(p);
    await p.send('anvil_setBalance', [wallet.address, '0x' + parseEther('0.1').toString(16)]);
    const artifact = JSON.parse(
      await fs.readFile('contracts/out/BioAgentRegistry.sol/BioAgentRegistry.json', 'utf8'),
    );
    const registry = await new ContractFactory(artifact.abi, artifact.bytecode.object, wallet).deploy();
    const deployed = await registry.deploymentTransaction().wait();
    const modelHash = '0x' + '11'.repeat(32);
    await (await registry.registerAgent(modelHash, 'test://shared-ui')).wait();
    const config = {
      chainId: 11155111,
      registryAddress: await registry.getAddress(),
      demoAgentId: '1',
      modelHash,
      deployBlock: deployed.blockNumber,
      agentIds: ['1'],
    };
    const rows = new Map();
    let failAfterPersist = true;
    const storage = {
      get: async (k) => structuredClone(rows.get(k)),
      put: async (k, v) => {
        rows.set(k, structuredClone(v));
        if (k.startsWith('tx:') && v.state === 'signed' && failAfterPersist) {
          failAfterPersist = false;
          throw Error('simulated interruption after durable write');
        }
      },
      list: async () =>
        new Map([...rows].filter(([k]) => k.startsWith('tx:')).map(([k, v]) => [k, structuredClone(v)])),
    };
    const env = {
      STIMULUS_ENABLED: 'true',
      SEPOLIA_SIGNER_KEY: wallet.privateKey,
      SEPOLIA_RPC_URL: rpcURL,
      ASSETS: { fetch: async () => Response.json(config) },
    };
    const scheduler = new StimulusScheduler({ storage }, env);
    const tick = () =>
      scheduler.fetch(new Request('https://internal/tick', { method: 'POST' })).then((r) => r.json());
    const initialNonce = await p.getTransactionCount(wallet.address);
    const interrupted = await tick();
    assert.equal(interrupted.state, 'skipped');
    const signed = [...rows].find(([k]) => k.startsWith('tx:'))[1];
    assert.equal(signed.state, 'signed');
    assert.equal(await p.getTransaction(signed.hash), null);
    await p.send('evm_setAutomine', [false]);
    const concurrent = await Promise.all([tick(), tick()]);
    assert.ok(concurrent.every((r) => r.transactionHash === signed.hash));
    assert.equal(await p.getTransactionCount(wallet.address, 'pending'), initialNonce + 1);
    const restarted = new StimulusScheduler({ storage }, env);
    assert.equal((await restarted.run()).transactionHash, signed.hash);
    await p.send('evm_mine', []);
    await p.send('evm_setAutomine', [true]);
    assert.equal((await restarted.run()).state, 'confirmed');
    assert.equal(await p.getTransactionCount(wallet.address), initialNonce + 1);
    // Previous slot still cannot permit a second TX less than one hour later.
    const slot = [...rows.keys()].find((k) => k.startsWith('tx:'));
    const record = rows.get(slot);
    rows.delete(slot);
    rows.set('tx:' + (Number(slot.slice(3)) - 1), record);
    assert.equal((await restarted.run()).state, 'interval-wait');
    const status = await (await restarted.fetch(new Request('https://internal/status'))).text();
    assert.ok(!status.includes(wallet.privateKey) && !status.includes(record.raw));
    let calls = 0;
    const read = batchedRpc(rpcURL, (...args) => {
      calls++;
      return fetch(...args);
    });
    const request = new Request('https://demo/api/chain/snapshot');
    const snapshot = await (await registryRead(request, config, read)).json();
    assert.equal(snapshot.events.length, 2);
    assert.equal(snapshot.agents[0].status.stimulus, 5500);
    assert.ok(snapshot.events.every((e) => e.receiptVerified));
    assert.ok(calls < 12, `reads were not batched: ${calls}`);
    const reverted = async (method, args) => {
      const value = await read(method, args);
      return method === 'eth_getTransactionReceipt' ? { ...value, status: '0x0' } : value;
    };
    await assert.rejects(registryRead(request, config, reverted), /Confirmed Registry receipt required/);
    const wrongBlock = async (method, args) => {
      const value = await read(method, args);
      return method === 'eth_getTransactionReceipt' ? { ...value, blockHash: '0x' + '00'.repeat(32) } : value;
    };
    await assert.rejects(registryRead(request, config, wrongBlock), /Confirmed Registry receipt required/);
    record.createdAt -= LIMITS.intervalMs;
    rows.set('tx:' + (Number(slot.slice(3)) - 1), record);
    const next = await restarted.run();
    assert.equal(next.state, 'submitted');
    assert.notEqual(next.transactionHash, signed.hash);
    assert.equal(await p.getTransactionCount(wallet.address), initialNonce + 2);
  } finally {
    p.destroy();
    child.kill('SIGTERM');
  }
});
