import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import worker from '../../services/sepolia/worker.js';
export function createDemoServer({ root = 'dist/sepolia-demo', rpcURL = process.env.SEPOLIA_RPC_URL } = {}) {
  const directory = path.resolve(root);
  const ASSETS = {
    async fetch(request) {
      const url = new URL(request.url);
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        return new Response('Bad path', { status: 400 });
      }
      const file = path.resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(directory + path.sep)) return new Response('Not found', { status: 404 });
      try {
        const body = await fs.readFile(file);
        const type =
          { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' }[
            path.extname(file)
          ] || 'application/octet-stream';
        return new Response(request.method === 'HEAD' ? null : body, { headers: { 'Content-Type': type } });
      } catch {
        return new Response('Not found', { status: 404 });
      }
    },
  };
  return http.createServer(async (req, res) => {
    try {
      const parts = [];
      for await (const part of req) {
        parts.push(part);
        if (parts.reduce((n, x) => n + x.length, 0) > 8192) {
          res.writeHead(413).end();
          return;
        }
      }
      const request = new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(parts),
      });
      const response = await worker.fetch(request, { ASSETS, SEPOLIA_RPC_URL: rpcURL });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch {
      res.writeHead(500).end('Demo server error');
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const server = createDemoServer();
  server.listen(Number(process.env.PORT || 8836), '127.0.0.1', () =>
    console.log(`Sepolia lab: http://127.0.0.1:${server.address().port}`),
  );
}
