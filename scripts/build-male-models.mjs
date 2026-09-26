import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { MALE_CNS } from '../packages/bio_agent/connectome/male-cns.js';
const hash = (b) => '0x' + createHash('sha256').update(b).digest('hex');
await mkdir('dist/models/male-cns', { recursive: true });
const refs = {};
for (const [name, path] of Object.entries({
  graph: 'packages/bio_agent/connectome/male-cns-slice.json',
  dynamics: 'packages/bio_agent/connectome/circuit.js',
  encoder: 'packages/bio_agent/connectome/male-cns.js',
  learner: 'packages/training/browser/learning.js',
  readout: 'packages/training/browser/readout.js',
})) {
  const b = await readFile(path),
    file = path.split('/').at(-1);
  if (name === 'graph' && hash(b) !== MALE_CNS.graphSha256)
    throw Error('Pinned MaleCNS graph changed; explicit model migration required');
  await writeFile('dist/models/male-cns/' + file, b);
  refs[name] = { uri: '/models/male-cns/' + file, sha256: hash(b) };
}
for (const path of [
  'packages/bio_agent/browser/manifest.json',
  'packages/bio_agent/runtime/paper-manifest.json',
]) {
  const m = JSON.parse(await readFile(path));
  const foraging = path.includes('/browser/');
  const runtimePath = foraging
    ? 'packages/bio_agent/browser/arena.js'
    : 'packages/bio_agent/runtime/paper-arena.js';
  const runtimeBytes = await readFile(runtimePath),
    runtimeName = foraging ? 'foraging-runtime.js' : 'market-runtime.js';
  await writeFile('dist/models/male-cns/' + runtimeName, runtimeBytes);
  const inputRefs = {};
  if (foraging)
    for (const name of ['tx-food', 'tx-world']) {
      const bytes = await readFile(`packages/bio_agent/browser/${name}.js`);
      await writeFile(`dist/models/male-cns/${name}.js`, bytes);
      inputRefs[name] = { uri: `/models/male-cns/${name}.js`, sha256: hash(bytes) };
    }
  m.connectome = {
    ...MALE_CNS,
    required: true,
    refs: {
      ...refs,
      ...inputRefs,
      runtime: { uri: '/models/male-cns/' + runtimeName, sha256: hash(runtimeBytes) },
    },
  };
  m.modelType = 'connectome-derived';
  m.biologicalValidation = false;
  m.learningTopology = 'frozen measured edges; train action readout only';
  await writeFile(path, JSON.stringify(m, null, 2) + '\n');
}
