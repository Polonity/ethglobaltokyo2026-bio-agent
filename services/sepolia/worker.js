import { batchedRpc } from '../worker/rpc-read.js';
import { registryRead } from '../worker/registry-read.js';
export { StimulusScheduler } from './scheduler.js';
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      env.STIMULUS_SENDER.getByName('sepolia-agent-1').fetch('https://scheduler.internal/tick', {
        method: 'POST',
      }),
    );
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/stimulus-scheduler' && request.method === 'GET') {
      if (!env.STIMULUS_SENDER) return Response.json({ enabled: false, intervalMinutes: 60, last: null });
      return env.STIMULUS_SENDER.getByName('sepolia-agent-1').fetch('https://scheduler.internal/status');
    }
    if (url.pathname === '/api/config' || url.pathname.startsWith('/api/chain/')) {
      const deployment = await (await env.ASSETS.fetch(new Request(new URL('/config.json', url)))).json();
      const config = {
        mode: 'sepolia',
        networkName: 'Sepolia',
        walletMode: 'browser',
        pollIntervalMs: 12000,
        localApps: false,
        chainId: String(deployment.chainId),
        registryAddress: deployment.registryAddress,
        deployBlock: deployment.blockNumber,
        modelHash: deployment.modelHash,
        agentIds: deployment.demoAgentIds || ['1'],
      };
      if (url.pathname === '/api/config') return Response.json(config);
      if (request.method !== 'GET')
        return Response.json({ error: 'Browser wallet required for writes' }, { status: 403 });
      try {
        const rpc = batchedRpc(env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com');
        if (BigInt(await rpc('eth_chainId', [])) !== BigInt(config.chainId)) throw Error('Wrong RPC chain');
        return (
          (await registryRead(request, config, rpc)) ||
          Response.json({ error: 'Browser wallet required for writes' }, { status: 403 })
        );
      } catch {
        return Response.json({ error: 'Chain input unavailable; retry shortly' }, { status: 503 });
      }
    }
    if (url.pathname.startsWith('/api/')) return Response.json({ error: 'Not found' }, { status: 404 });
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
    const asset = await env.ASSETS.fetch(request),
      result = new Response(asset.body, asset);
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    result.headers.set('Cache-Control', 'no-cache');
    result.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'",
    );
    return result;
  },
};
