import { build } from 'esbuild';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
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

await mkdir('dist/models/agents', { recursive: true });
await copyFile('packages/bio_agent/browser/manifest.json', 'dist/models/foraging-q-v1.json');
for (const [i, name] of ['MOMO', 'SORA', 'KIKI'].entries())
  await writeFile(
    `dist/models/agents/${i + 1}.json`,
    JSON.stringify({ name, modelId: 'foraging-q-v1', manifest: '/models/foraging-q-v1.json' }),
  );
