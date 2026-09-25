export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/config') return Response.json({ mode: 'browser' });
    if (path === '/api/health')
      return Response.json({
        status: 'ok',
        app: 'fly-lab',
        model: 'foraging-q-v1',
        runtime: 'browser',
        chainConnected: false,
      });
    if (path.startsWith('/api/')) return Response.json({ error: 'not_found' }, { status: 404 });
    const asset = await env.ASSETS.fetch(request);
    const response = new Response(asset.body, asset);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'",
    );
    return response;
  },
};
