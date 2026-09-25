import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
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
await copyFile('packages/bio_agent/browser/manifest.json', 'dist/models/foraging-embodied-q-v2.json');
for (const [i, name] of ['MOMO', 'SORA', 'KIKI'].entries())
  await writeFile(
    `dist/models/agents/${i + 1}.json`,
    JSON.stringify({
      name,
      modelId: 'foraging-embodied-q-v2',
      manifest: '/models/foraging-embodied-q-v2.json',
    }),
  );

const bodySource = await readFile('packages/bio_agent/browser/body.js');
await writeFile('dist/models/synthetic-metabolism-v1.js', bodySource);
await writeFile(
  'dist/models/body-reference.json',
  JSON.stringify({
    digest: { algorithm: 'sha256', value: `0x${createHash('sha256').update(bodySource).digest('hex')}` },
    uri: '/models/synthetic-metabolism-v1.js',
  }),
);
