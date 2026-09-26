import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyMaleCNSArtifact, verifyMaleCNSBytes } from '../src/model-integrity.js';
import { MALE_CNS } from '../../bio_agent/connectome/male-cns.js';
test('actual graph bytes match the declared model; changed bytes and unsupported model fail closed', async () => {
  assert.equal(await verifyMaleCNSArtifact(), MALE_CNS.graphSha256);
  const bytes = await readFile(new URL('../../bio_agent/connectome/male-cns-slice.json', import.meta.url));
  bytes[bytes.length - 1] ^= 1;
  await assert.rejects(verifyMaleCNSBytes(bytes), /digest mismatch/);
  await assert.rejects(verifyMaleCNSArtifact('0x' + '00'.repeat(32)), /Unsupported/);
});
