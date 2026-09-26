import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { keccak256 } from 'ethers';
import { verifyAquaFork, OFFICIAL_AQUA } from '../services/full-apps/fork.mjs';
test('official mode rejects a plain chain, a changed fork and substituted code', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aqua-fork-'));
  const manifest = {
    chainId: 1,
    blockNumber: 100,
    blockHash: 'block',
    aqua: OFFICIAL_AQUA,
    codeHash: keccak256('0x1234'),
  };
  const path = join(dir, 'manifest.json');
  await writeFile(path, JSON.stringify(manifest));
  const provider = {
    send: async () => ({ forkConfig: { forkUrl: 'http://upstream', forkBlockNumber: 100 } }),
    getBlock: async () => ({ hash: 'block' }),
    getCode: async () => '0x1234',
  };
  try {
    assert.deepEqual(await verifyAquaFork(provider, path), manifest);
    await assert.rejects(verifyAquaFork({ ...provider, send: async () => ({ forkConfig: {} }) }, path));
    await assert.rejects(verifyAquaFork({ ...provider, getBlock: async () => ({ hash: 'other' }) }, path));
    await assert.rejects(verifyAquaFork({ ...provider, getCode: async () => '0x' }, path));
    await assert.rejects(verifyAquaFork({ ...provider, getCode: async () => '0x9999' }, path));
    await writeFile(
      path,
      JSON.stringify({ ...manifest, aqua: '0x0000000000000000000000000000000000000001' }),
    );
    await assert.rejects(verifyAquaFork(provider, path));
  } finally {
    await rm(dir, { recursive: true });
  }
});
