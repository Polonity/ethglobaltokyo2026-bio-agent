import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['apps/frontend/app.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outfile: 'dist/app.js',
});
for (const file of ['index.html', 'style.css']) await copyFile(`apps/frontend/${file}`, `dist/${file}`);
console.log('Built Fly Lab static assets in dist/');
