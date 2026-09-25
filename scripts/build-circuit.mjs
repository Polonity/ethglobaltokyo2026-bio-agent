import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const dir = 'packages/bio_agent/connectome';
const out = 'dist/models/circuit';
await mkdir(out, { recursive: true });
const ref = async (source, name) => {
  const bytes = await readFile(source);
  await writeFile(out + '/' + name, bytes);
  return {
    digest: { algorithm: 'sha256', value: '0x' + createHash('sha256').update(bytes).digest('hex') },
    uri: '/models/circuit/' + name,
  };
};
const graph = JSON.parse(await readFile(dir + '/male-cns-slice.json', 'utf8'));
const descriptor = {
  schema: 'bioagent.descriptor.v1',
  origin: {
    kind: 'connectome-derived',
    dataset: {
      release: graph.dataset,
      source: { digest: { algorithm: 'sha256', value: graph.sources[1].sha256 }, uri: graph.sources[1].uri },
      license: graph.license,
      attribution: graph.attribution,
    },
    extraction: await ref('scripts/extract-male-cns.py', 'extract-male-cns.py'),
    graph: await ref(dir + '/male-cns-slice.json', 'graph.json'),
    assumptions: [
      'Only seven selected neurons; boundary inputs/outputs omitted. Not a complete biological circuit.',
      'All edges treated as excitatory, without neurotransmitter predictions.',
      'Rate dynamics: a_next = 0.75*a + 0.25*tanh(sum(count/maxCount*a_pre) + externalDrive).',
      'Dimensionless time and activity; frozen topology/weights; no biological validation.',
      'Chain stimulus is an artificial direct input to body 10001; output action is artificial.',
    ],
  },
  dynamics: await ref(dir + '/circuit.js', 'circuit.js'),
  sensoryMapping: await ref(dir + '/sensory-mapping.json', 'sensory-mapping.json'),
  motorMapping: await ref(dir + '/motor-mapping.json', 'motor-mapping.json'),
  bodyModel: null,
  plasticity: { kind: 'frozen' },
  validationClaims: [],
};
if (descriptor.origin.extraction.digest.value !== graph.extractionSha256)
  throw new Error('Re-extract graph after modifying extraction code');
await writeFile(out + '/descriptor.json', JSON.stringify(descriptor, null, 2) + '\n');
