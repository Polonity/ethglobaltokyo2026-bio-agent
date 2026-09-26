import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve('.'),
  port = Number(process.env.BIOAGENT_LAB_PORT || 8826);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
  '.md': 'text/plain; charset=utf-8',
};
export function createLabServer() {
  return http.createServer(async (req, res) => {
    try {
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405);
        res.end();
        return;
      }
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const relative = pathname === '/' ? 'apps/research-lab/index.html' : pathname.slice(1);
      const file = path.resolve(root, relative);
      const allowed = ['apps/research-lab/', 'packages/', 'artifacts/bioagent-adaptation-20260926/'].some(
        (prefix) => file.startsWith(path.resolve(root, prefix) + path.sep),
      );
      if (
        !file.startsWith(root + path.sep) ||
        !allowed ||
        relative.split('/').some((x) => x.startsWith('.'))
      ) {
        res.writeHead(403);
        res.end();
        return;
      }
      const bytes = await fs.readFile(file);
      res.writeHead(200, {
        'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const server = createLabServer();
  server.listen(port, '127.0.0.1', () => console.log(`BioAgent Research Lab http://127.0.0.1:${port}`));
}
