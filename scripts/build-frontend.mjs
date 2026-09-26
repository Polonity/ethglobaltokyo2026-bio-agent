import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await import('./build-male-models.mjs');
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
await copyFile('packages/bio_agent/browser/manifest.json', 'dist/models/foraging-malecns-q-v3.json');
for (const [i, name] of ['MOMO', 'SORA', 'KIKI'].entries())
  await writeFile(
    `dist/models/agents/${i + 1}.json`,
    JSON.stringify({
      name,
      modelId: 'foraging-malecns-q-v3',
      manifest: '/models/foraging-malecns-q-v3.json',
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

await build({
  entryPoints: ['apps/frontend/market.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outfile: 'dist/market.js',
});
for (const file of ['market.html', 'market.css']) await copyFile(`apps/frontend/${file}`, `dist/${file}`);
const paperSource = await readFile('packages/bio_agent/runtime/paper-arena.js');
await writeFile('dist/models/paper-arena.js', paperSource);
await writeFile(
  'dist/models/paper-reference.json',
  JSON.stringify({
    digest: { algorithm: 'sha256', value: `0x${createHash('sha256').update(paperSource).digest('hex')}` },
    uri: '/models/paper-arena.js',
  }),
);

await copyFile('packages/bio_agent/runtime/paper-manifest.json', 'dist/models/market-malecns-reward-v2.json');
for (const [i, name] of ['MOMO', 'SORA', 'KIKI'].entries())
  await writeFile(
    `dist/models/market-agent-${i + 1}.json`,
    JSON.stringify({
      name,
      modelId: 'market-malecns-reward-v2',
      manifest: '/models/market-malecns-reward-v2.json',
      profile: 'market-paper.v1',
    }),
  );

await import('./build-circuit.mjs');
await build({
  entryPoints: ['apps/frontend/circuit.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outfile: 'dist/circuit.js',
});
await copyFile('apps/frontend/circuit.html', 'dist/circuit.html');

await import('./build-aqua.mjs');
await build({
  entryPoints: ['apps/frontend/aqua.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outfile: 'dist/aqua.js',
});
for (const file of ['aqua.html', 'aqua.css']) await copyFile('apps/frontend/' + file, 'dist/' + file);

await mkdir('dist/guides', { recursive: true });
for (const file of ['content.mjs', 'guide.mjs', 'guide.css', 'sheet.html'])
  await copyFile('apps/frontend/guides/' + file, 'dist/guides/' + file);
