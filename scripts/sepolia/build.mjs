import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { MALE_CNS } from '../../packages/bio_agent/connectome/male-cns.js';
import { deploymentPath, sha256 } from './common.mjs';

export async function buildDemo({ output = 'dist/sepolia-demo', deployment } = {}) {
  if (!deployment) {
    try {
      deployment = JSON.parse(await fs.readFile(deploymentPath, 'utf8'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  await fs.mkdir(output, { recursive: true });
  for (const file of ['index.html', 'app.js', 'style.css'])
    await fs.copyFile(`apps/sepolia-lab/${file}`, path.join(output, file));
  await build({
    entryPoints: ['apps/sepolia-lab/chain.js'],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: true,
    outfile: path.join(output, 'chain.js'),
  });
  // Preserve import.meta.url and graph byte identity; only ship this explicit allowlist.
  const directories = [
    'packages/bioagent-framework/src',
    'packages/bio_agent/browser',
    'packages/bio_agent/runtime',
    'packages/bio_agent/connectome',
    'packages/bio_agent/research',
    'packages/training/browser',
  ];
  const files = {};
  for (const directory of directories) {
    await fs.mkdir(path.join(output, directory), { recursive: true });
    for (const file of await fs.readdir(directory)) {
      if (!/\.(js|json)$/.test(file)) continue;
      const source = path.join(directory, file),
        bytes = await fs.readFile(source);
      await fs.writeFile(path.join(output, source), bytes);
      files[source] = sha256(bytes);
    }
  }
  const config = {
    chainId: 11155111,
    registryAddress: null,
    demoAgentId: '1',
    ...deployment,
    modelHash: MALE_CNS.graphSha256,
    neurons: MALE_CNS.neurons,
    edges: MALE_CNS.edges,
  };
  if (config.chainId !== 11155111) throw Error('Sepolia only');
  if (deployment && deployment.modelHash !== MALE_CNS.graphSha256) throw Error('Deployment model mismatch');
  const graph = JSON.parse(await fs.readFile('packages/bio_agent/connectome/male-cns-slice.json', 'utf8'));
  const model = {
    schema: 'bioagent.sepolia-demo-model.v1',
    name: 'MaleCNS reduced connectome / BioAgent',
    modelHash: MALE_CNS.graphSha256,
    modelHashScope: 'SHA-256 of exact male-cns-slice.json bytes; runtime files separately listed below',
    neurons: MALE_CNS.neurons,
    edges: MALE_CNS.edges,
    learning: 'Three readout weights; measured topology is frozen',
    limitations:
      'Selected subgraph, not a compressed full brain. Engineered dynamics and body; no biological cognition, trading or energy-efficiency claim.',
    license: graph.license,
    attribution: graph.attribution,
    sources: graph.sources,
    changes: graph.changes,
    files,
  };
  await fs.writeFile(path.join(output, 'config.json'), JSON.stringify(config, null, 2) + '\n');
  await fs.writeFile(path.join(output, 'model.json'), JSON.stringify(model, null, 2) + '\n');
  return { output, registry: config.registryAddress, fileCount: Object.keys(files).length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  console.log(await buildDemo());
