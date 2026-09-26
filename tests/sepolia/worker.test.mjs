import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { validReadRequest } from '../../services/sepolia/worker.js';
const registry = '0x1111111111111111111111111111111111111111';
const body = (method, params) => ({ jsonrpc: '2.0', id: 1, method, params });
test('public RPC admits only bounded Registry reads and refuses signing or other contracts', () => {
  assert.equal(
    validReadRequest(
      body('eth_call', [{ to: registry, data: '0x5c622a0e' + '0'.repeat(63) + '1' }, '0x123']),
      registry,
    ),
    true,
  );
  assert.equal(validReadRequest(body('eth_chainId', []), registry), true);
  assert.equal(validReadRequest(body('eth_getBlockByNumber', ['latest', false]), registry), true);
  for (const request of [
    body('eth_sendRawTransaction', ['0x00']),
    body('eth_sendTransaction', [{ to: registry }]),
    body('personal_sign', ['test']),
    [body('eth_chainId', [])],
    body('eth_call', [
      { to: '0x2222222222222222222222222222222222222222', data: '0x5c622a0e' + '0'.repeat(64) },
      'latest',
    ]),
    body('eth_call', [{ to: registry, data: '0x12345678' + '0'.repeat(64) }, 'latest']),
    body('eth_call', [{ to: registry, data: '0x5c622a0e' + '0'.repeat(64), value: '0x1' }, 'latest']),
    body('eth_getCode', [registry]),
    body('eth_getBlockByNumber', ['latest', true]),
    body('eth_call', [{ to: registry, data: '0x5c622a0e' + '0'.repeat(1000) }, 'latest']),
  ])
    assert.equal(validReadRequest(request, registry), false);
});
test('HTTP rejects cross-origin, malformed, oversized and signing requests before upstream', async () => {
  const env = { ASSETS: { fetch: async () => Response.json({ registryAddress: registry }) } };
  const req = (value, headers = {}) =>
    new Request('https://demo.example/api/sepolia/rpc', { method: 'POST', headers, body: value });
  assert.equal(
    (
      await worker.fetch(
        req(JSON.stringify(body('eth_chainId', [])), { origin: 'https://other.example' }),
        env,
      )
    ).status,
    403,
  );
  assert.equal((await worker.fetch(req('bad'), env)).status, 400);
  assert.equal((await worker.fetch(req('x'.repeat(5000)), env)).status, 413);
  assert.equal(
    (await worker.fetch(req(JSON.stringify(body('eth_sendRawTransaction', ['0x']))), env)).status,
    403,
  );
});
