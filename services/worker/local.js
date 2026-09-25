import { marketRoute } from './market.js';
// Local-only application API. This entrypoint is never used by wrangler.jsonc (public hosting).
import { Interface } from 'ethers/abi';
import abi from '../../contracts/abi/BioAgentRegistry.json';
import hosting from './index.js';
const contract = new Interface(abi);
const decimal = (value) => value.toString();
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
function statusJSON(status) {
  return {
    activity: Number(status.activity),
    energy: Number(status.energy),
    stimulus: Number(status.stimulus),
    revision: decimal(status.revision),
    updatedAt: decimal(status.updatedAt),
  };
}
function decode(log, env) {
  const event = contract.parseLog(log);
  if (!event) return null;
  const common = {
    schemaVersion: 1,
    chainId: '31337',
    registryAddress: env.REGISTRY_ADDRESS,
    blockNumber: decimal(BigInt(log.blockNumber)),
    blockHash: log.blockHash,
    transactionHash: log.transactionHash,
    transactionIndex: decimal(BigInt(log.transactionIndex)),
    logIndex: decimal(BigInt(log.logIndex)),
    name: event.name,
    agentId: decimal(event.args.agentId),
  };
  common.eventId = `31337:${env.REGISTRY_ADDRESS.toLowerCase()}:${log.blockHash}:${log.transactionHash}:${common.logIndex}`;
  if (event.name === 'BioAgentStatusUpdated')
    return { ...common, writer: event.args.writer, status: statusJSON(event.args) };
  if (event.name === 'BioAgentRegistered')
    return {
      ...common,
      owner: event.args.owner,
      modelHash: event.args.modelHash,
      metadataURI: event.args.metadataURI,
    };
  return null;
}
async function logs(env, from, to) {
  if (from > to) return [];
  const output = [];
  for (let start = from; start <= to; start += 1000n) {
    const end = start + 999n > to ? to : start + 999n;
    const result = await rpc(env, 'eth_getLogs', [
      { address: env.REGISTRY_ADDRESS, fromBlock: hex(start), toBlock: hex(end) },
    ]);
    output.push(...result.map((log) => decode(log, env)).filter(Boolean));
  }
  return output.sort(
    (a, b) =>
      Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)) ||
      Number(BigInt(a.transactionIndex) - BigInt(b.transactionIndex)) ||
      Number(BigInt(a.logIndex) - BigInt(b.logIndex)),
  );
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!loopback(url.hostname)) return json({ error: 'Local access only' }, 403);
    if (url.pathname === '/api/config') {
      return json({
        mode: 'anvil',
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
      url.pathname !== '/api/health'
    )
      return hosting.fetch(request, env);
    try {
      await validateChain(env);
      if (url.pathname.startsWith('/api/market/')) return await marketRoute(request, env, rpc);
      if (url.pathname === '/api/health')
        return json({
          status: 'ok',
          runtime: 'browser',
          mode: 'anvil',
          chainConnected: true,
          registryAddress: env.REGISTRY_ADDRESS,
        });
      if (url.pathname === '/api/chain/snapshot' && request.method === 'GET') {
        const tip = await rpc(env, 'eth_getBlockByNumber', ['latest', false]);
        const height = BigInt(tip.number);
        const events = await logs(env, BigInt(env.DEPLOYMENT_BLOCK), height);
        const agents = await Promise.all(
          ['1', '2', '3'].map(async (agentId) => {
            const [[agent], [status]] = await Promise.all([
              call(env, 'getAgent', [agentId], tip.number),
              call(env, 'getStatus', [agentId], tip.number),
            ]);
            if (agent.modelHash !== env.LOCAL_MODEL_HASH) throw new ApiError('Model hash mismatch', 409);
            const cause = events.findLast(
              (e) =>
                e.name === 'BioAgentStatusUpdated' &&
                e.agentId === agentId &&
                e.status.revision === decimal(status.revision),
            );
            if (!cause) throw new ApiError('Status event missing', 409);
            return {
              agentId,
              owner: agent.owner,
              modelHash: agent.modelHash,
              metadataURI: agent.metadataURI,
              status: statusJSON(status),
              cause,
            };
          }),
        );
        return json({ blockNumber: decimal(height), blockHash: tip.hash, agents });
      }
      if (url.pathname === '/api/chain/events' && request.method === 'GET') {
        const after = url.searchParams.get('after');
        const hash = url.searchParams.get('hash');
        if (!/^\d+$/.test(after || '') || !/^0x[0-9a-f]{64}$/i.test(hash || ''))
          throw new ApiError('Cursor and block hash required');
        const base = await rpc(env, 'eth_getBlockByNumber', [hex(after), false]);
        if (!base || base.hash !== hash) return json({ error: 'reorg', reset: true }, 409);
        const tip = await rpc(env, 'eth_getBlockByNumber', ['latest', false]);
        const events = await logs(env, BigInt(after) + 1n, BigInt(tip.number));
        return json({ blockNumber: decimal(BigInt(tip.number)), blockHash: tip.hash, events });
      }
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
      if (url.pathname === '/api/chain/receipt' && request.method === 'GET') {
        const hash = url.searchParams.get('hash');
        if (!/^0x[0-9a-f]{64}$/i.test(hash || '')) throw new ApiError('Invalid transaction hash');
        const receipt = await rpc(env, 'eth_getTransactionReceipt', [hash]);
        if (!receipt) return json({ stage: 'pending' });
        if (receipt.to?.toLowerCase() !== env.REGISTRY_ADDRESS.toLowerCase())
          throw new ApiError('Not a Registry transaction');
        return json({
          stage: receipt.status === '0x1' ? 'mined' : 'reverted',
          blockNumber: decimal(BigInt(receipt.blockNumber)),
          transactionHash: hash,
        });
      }
      return json({ error: 'not_found' }, 404);
    } catch (error) {
      return json(
        { error: error instanceof ApiError ? error.message : 'Local chain request failed' },
        error instanceof ApiError ? error.status : 503,
      );
    }
  },
};
