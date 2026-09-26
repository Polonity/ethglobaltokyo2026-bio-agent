const METHODS = new Set([
  'eth_chainId',
  'eth_blockNumber',
  'eth_getBlockByNumber',
  'eth_getCode',
  'eth_call',
  'eth_getTransactionReceipt',
]);
const address = (value) => typeof value === 'string' && /^0x[0-9a-f]{40}$/i.test(value);
const hash = (value) => typeof value === 'string' && /^0x[0-9a-f]{64}$/i.test(value);
export function validReadRequest(body, registry) {
  if (
    !address(registry) ||
    !body ||
    Array.isArray(body) ||
    body.jsonrpc !== '2.0' ||
    !METHODS.has(body.method) ||
    !Array.isArray(body.params) ||
    body.params.length > 2
  )
    return false;
  const p = body.params;
  if (['eth_chainId', 'eth_blockNumber'].includes(body.method)) return p.length === 0;
  if (body.method === 'eth_getBlockByNumber')
    return p.length === 2 && /^(latest|safe|finalized|0x[0-9a-f]+)$/i.test(p[0]) && p[1] === false;
  if (body.method === 'eth_getTransactionReceipt') return p.length === 1 && hash(p[0]);
  if (body.method === 'eth_getCode')
    return (
      p.length === 2 &&
      address(p[0]) &&
      p[0].toLowerCase() === registry.toLowerCase() &&
      typeof p[1] === 'string' &&
      /^(latest|0x[0-9a-f]+)$/i.test(p[1])
    );
  if (body.method === 'eth_call') {
    const call = p[0];
    return (
      p.length === 2 &&
      call &&
      address(call.to) &&
      call.to.toLowerCase() === registry.toLowerCase() &&
      typeof call.data === 'string' &&
      /^0x(2de5aaf7|5c622a0e)[0-9a-f]{64}$/i.test(call.data) &&
      !call.value &&
      Object.keys(call).every((k) => ['to', 'data'].includes(k)) &&
      typeof p[1] === 'string' &&
      /^(latest|0x[0-9a-f]+)$/i.test(p[1])
    );
  }
  return false;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/sepolia/rpc') {
      if (request.method !== 'POST') return Response.json({ error: 'POST required' }, { status: 405 });
      if (request.headers.get('origin') && request.headers.get('origin') !== url.origin)
        return Response.json({ error: 'Same-origin only' }, { status: 403 });
      const text = await request.text();
      if (text.length > 4096) return Response.json({ error: 'Request too large' }, { status: 413 });
      let body;
      try {
        body = JSON.parse(text);
      } catch {
        return Response.json({ error: 'Invalid JSON' }, { status: 400 });
      }
      const response = await env.ASSETS.fetch(new Request(new URL('/config.json', url)));
      const config = await response.json();
      if (!config.registryAddress) return Response.json({ error: 'Deployment pending' }, { status: 503 });
      if (!validReadRequest(body, config.registryAddress))
        return Response.json({ error: 'Read-only Registry RPC method required' }, { status: 403 });
      try {
        const upstream = await fetch(env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(12000),
        });
        if (!upstream.ok) throw Error('RPC unavailable');
        const value = await upstream.json();
        return Response.json(value, { headers: { 'Cache-Control': 'no-store' } });
      } catch {
        return Response.json(
          {
            jsonrpc: '2.0',
            id: body.id,
            error: { code: -32000, message: 'Sepolia RPC temporarily unavailable' },
          },
          { status: 502 },
        );
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
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'",
    );
    return result;
  },
};
