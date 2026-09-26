import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { JsonRpcProvider, Wallet, ContractFactory, Contract, parseEther } from 'ethers';
import { sendOnce } from '../../scripts/sepolia/transactions.mjs';

test('testnet deployment journal resumes without another transaction and rejects changed payloads', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bioagent-sepolia-journal-'));
  const probe = createServer();
  await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(
    process.env.ANVIL || path.join(os.homedir(), '.foundry/bin/anvil'),
    ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '11155111', '--silent'],
    { stdio: 'ignore' },
  );
  const provider = new JsonRpcProvider(`http://127.0.0.1:${port}`, undefined, { batchMaxCount: 1 });
  provider.pollingInterval = 50;
  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      if (child.exitCode !== null) throw Error('Own Anvil failed');
      try {
        await provider.send('eth_chainId', []);
        ready = true;
        break;
      } catch {
        await delay(50);
      }
    }
    assert.ok(ready);
    const wallet = Wallet.createRandom().connect(provider);
    await provider.send('anvil_setBalance', [wallet.address, '0x' + parseEther('0.1').toString(16)]);
    const artifact = JSON.parse(
      await fs.readFile('contracts/out/BioAgentRegistry.sol/BioAgentRegistry.json', 'utf8'),
    );
    const request = await new ContractFactory(artifact.abi, artifact.bytecode.object).getDeployTransaction();
    const args = { provider, wallet, directory, label: 'deployment', request };
    const first = await sendOnce(args),
      second = await sendOnce(args);
    assert.equal(first.hash, second.hash);
    assert.equal(first.contractAddress, second.contractAddress);
    assert.equal(
      Number(BigInt(await provider.send('eth_getTransactionCount', [wallet.address, 'latest']))),
      1,
    );
    assert.equal(await new Contract(first.contractAddress, artifact.abi, provider).nextAgentId(), 1n);
    await assert.rejects(sendOnce({ ...args, request: { data: '0x00' } }), /does not match/);
    assert.equal((await fs.stat(path.join(directory, 'deployment.json'))).mode & 0o777, 0o600);
  } finally {
    provider.destroy();
    child.kill('SIGTERM');
    await fs.rm(directory, { recursive: true, force: true });
  }
});
