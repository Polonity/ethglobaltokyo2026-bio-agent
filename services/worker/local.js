import { registryRead } from './registry-read.js';
import { aquaRoute } from './aqua.js';
import { marketRoute } from './market.js';
// Local-only application API. This entrypoint is never used by wrangler.jsonc (public hosting).
import { Interface } from 'ethers/abi';
import abi from '../../contracts/abi/BioAgentRegistry.json';
import hosting from './index.js';
const contract = new Interface(abi);
const hex = (value) => `0x${BigInt(value).toString(16)}`;
const json = (value, status = 200) =>
  Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const loopback = (host) => host === '127.0.0.1' || host === 'localhost';
async function rpc(env, method, params = []) {
  const response = await fetch(env.ANVIL_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new ApiError('Anvil RPC is unavailable', 503);
  const result = await response.json();
  if (result.error) {
    let reason = result.error.message || 'RPC error';
    try {
      reason = contract.parseError(result.error.data)?.name || reason;
    } catch {}
    throw new ApiError(reason, 409);
  }
  return result.result;
}
async function validateChain(env) {
  if (env.LOCAL_ANVIL !== 'true' || !loopback(new URL(env.ANVIL_RPC_URL).hostname))
    throw new ApiError('Local Anvil configuration required', 403);
  const [chain, client] = await Promise.all([rpc(env, 'eth_chainId'), rpc(env, 'web3_clientVersion')]);
  if (BigInt(chain) !== 31337n || !client.toLowerCase().startsWith('anvil/'))
    throw new ApiError('Expected Anvil chain 31337', 503);
  const first = await rpc(env, 'eth_getBlockByNumber', [hex(env.DEPLOYMENT_BLOCK), false]);
  if (!first || first.hash !== env.DEPLOYMENT_BLOCK_HASH)
    throw new ApiError('Deployment changed. Restart npm run local:up', 503);
}
async function call(env, name, args, block = 'latest') {
  const data = contract.encodeFunctionData(name, args);
  return contract.decodeFunctionResult(
    name,
    await rpc(env, 'eth_call', [{ to: env.REGISTRY_ADDRESS, data }, block]),
  );
}
const localWorker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!loopback(url.hostname)) return json({ error: 'Local access only' }, 403);
    if (url.pathname.startsWith('/api/circuit/')) {
      if (!env.CIRCUIT_REGISTRY) return json({ error: 'Run npm run local:circuit first' }, 503);
      const suffix = url.pathname.slice('/api/circuit/'.length);
      if (!['config', 'snapshot', 'events', 'status', 'receipt'].includes(suffix))
        return json({ error: 'not_found' }, 404);
      url.pathname = suffix === 'config' ? '/api/config' : '/api/chain/' + suffix;
      return localWorker.fetch(new Request(url, request), {
        ...env,
        WORLD_INPUT: 'false',
        REGISTRY_ADDRESS: env.CIRCUIT_REGISTRY,
        LOCAL_MODEL_HASH: env.CIRCUIT_MODEL_HASH,
        DEPLOYMENT_BLOCK: env.CIRCUIT_DEPLOYMENT_BLOCK,
        DEPLOYMENT_BLOCK_HASH: env.CIRCUIT_DEPLOYMENT_BLOCK_HASH,
      });
    }
    if (url.pathname === '/api/config') {
      return json({
        mode: 'anvil',
        networkName: 'Anvil',
        walletMode: 'local',
        pollIntervalMs: 600,
        localApps: true,
        worldInput: env.WORLD_INPUT === 'true',
        chainId: '31337',
        registryAddress: env.REGISTRY_ADDRESS,
        deployBlock: env.DEPLOYMENT_BLOCK,
        modelHash: env.LOCAL_MODEL_HASH,
        agentIds: ['1', '2', '3'],
      });
    }
    if (
      !url.pathname.startsWith('/api/chain/') &&
      !url.pathname.startsWith('/api/market/') &&
      !url.pathname.startsWith('/api/aqua/') &&
      url.pathname !== '/api/health'
    )
      return hosting.fetch(request, env);
    try {
      await validateChain(env);
      if (url.pathname.startsWith('/api/aqua/')) return await aquaRoute(request, env, rpc);
      if (url.pathname.startsWith('/api/market/')) return await marketRoute(request, env, rpc);
      if (url.pathname === '/api/health')
        return json({
          status: 'ok',
          runtime: 'browser',
          mode: 'anvil',
          chainConnected: true,
          registryAddress: env.REGISTRY_ADDRESS,
        });
      const shared = await registryRead(
        request,
        {
          chainId: '31337',
          registryAddress: env.REGISTRY_ADDRESS,
          deployBlock: env.DEPLOYMENT_BLOCK,
          modelHash: env.LOCAL_MODEL_HASH,
          worldInput: env.WORLD_INPUT === 'true',
          agentIds: ['1', '2', '3'],
        },
        (m, p) => rpc(env, m, p),
      );
      if (shared) return shared;
      if (url.pathname === '/api/chain/status' && request.method === 'POST') {
        if (
          request.headers.get('Origin') !== url.origin ||
          request.headers.get('Content-Type')?.split(';')[0] !== 'application/json'
        )
          throw new ApiError('Same-origin JSON required', 403);
        const text = await request.text();
        if (text.length > 1024) throw new ApiError('Request too large', 413);
        const body = JSON.parse(text);
        if (!['1', '2', '3'].includes(body.agentId) || !/^\d+$/.test(body.expectedRevision || ''))
          throw new ApiError('Invalid agent or revision');
        if (!Number.isInteger(body.activity) || body.activity < 0 || body.activity > 2)
          throw new ApiError('Invalid activity');
        for (const key of ['energy', 'stimulus'])
          if (!Number.isInteger(body[key]) || body[key] < 0 || body[key] > 10000)
            throw new ApiError(`Invalid ${key}`);
        const [agent] = await call(env, 'getAgent', [body.agentId]);
        if (agent.owner.toLowerCase() !== env.LOCAL_OWNER.toLowerCase())
          throw new ApiError('Configured account is not the owner', 403);
        const tx = {
          from: env.LOCAL_OWNER,
          to: env.REGISTRY_ADDRESS,
          data: contract.encodeFunctionData('updateStatus', [
            body.agentId,
            body.expectedRevision,
            body.activity,
            body.energy,
            body.stimulus,
          ]),
        };
        // Local unlocked account only; no raw RPC proxy and no private keys in the GUI.
        await rpc(env, 'eth_call', [tx, 'latest']);
        const gas = await rpc(env, 'eth_estimateGas', [tx]);
        const transactionHash = await rpc(env, 'eth_sendTransaction', [
          { ...tx, gas: hex((BigInt(gas) * 12n) / 10n) },
        ]);
        return json({ transactionHash, agentId: body.agentId, stage: 'submitted' }, 202);
      }
      return json({ error: 'not_found' }, 404);
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : 'Local chain request failed' },
        error instanceof ApiError ? error.status : 503,
      );
    }
  },
};

export default localWorker;
