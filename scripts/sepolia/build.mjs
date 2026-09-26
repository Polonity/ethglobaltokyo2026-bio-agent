import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
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
  execFileSync(process.execPath, ['scripts/build-frontend.mjs'], { stdio: 'inherit' });
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  for (const file of ['index.html', 'style.css', 'app.js'])
    await fs.copyFile(`dist/${file}`, path.join(output, file));
  for (const directory of ['models', 'guides'])
    await fs.cp(`dist/${directory}`, path.join(output, directory), { recursive: true });
  const files = {};
  for (const file of ['index.html', 'style.css', 'app.js'])
    files[file] = sha256(await fs.readFile(path.join(output, file)));
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
    learning: 'Shared Anvil/Sepolia Arena Q-learning; measured topology is frozen',
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
