import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../services/sepolia/worker.js';
const deployment = {
  chainId: 11155111,
  registryAddress: '0x' + '11'.repeat(20),
  blockNumber: 1,
  modelHash: '0x' + '22'.repeat(32),
  demoAgentIds: ['1', '2', '3'],
};
const env = { ASSETS: { fetch: async () => Response.json(deployment) } };
test('shared public config changes only connection settings; signing routes are not public', async () => {
  const config = await (await worker.fetch(new Request('https://demo.example/api/config'), env)).json();
  assert.equal(config.mode, 'sepolia');
  assert.equal(config.walletMode, 'browser');
  assert.deepEqual(config.agentIds, ['1', '2', '3']);
  for (const route of ['/api/chain/status', '/api/sepolia/rpc', '/api/stimulus-scheduler', '/tick']) {
    const r = await worker.fetch(
      new Request('https://demo.example' + route, { method: 'POST', body: '{}' }),
      env,
    );
    assert.ok([403, 404, 405].includes(r.status));
  }
});
