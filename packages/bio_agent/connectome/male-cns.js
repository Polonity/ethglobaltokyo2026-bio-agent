// Required measured MaleCNS topology. No synthetic graph fallback.
import graph from './male-cns-slice.json' with { type: 'json' };
import { runCircuitTrial, validateGraph } from './circuit.js';
validateGraph(graph);
export const MALE_CNS = Object.freeze({
  dataset: graph.dataset,
  neurons: graph.nodes.length,
  edges: graph.edges.length,
  graphSha256: '0xfa923a4bdf0c41af7d0fc9197507f0935adcee957a6417c765db9700d46df987',
  license: graph.license,
  attribution: graph.attribution,
});
// Fixed 32-tick, zero-state trials permit exact reuse for a declared 1/256 input grid.
// The dynamics and sensory mappings are engineered, not validated fly physiology.
const cache = new Map();
let computations = 0,
  hits = 0;
export function neuralSignal(value, { ablated = false } = {}) {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw Error('MaleCNS input outside [0,1]');
  const bin = Math.round(value * 256),
    key = `${ablated ? 1 : 0}:${bin}`;
  if (cache.has(key)) {
    hits++;
    return cache.get(key);
  }
  const trial = runCircuitTrial(graph, bin / 256, 32, ablated);
  computations++;
  const result = Object.freeze({
    input: bin / 256,
    response: trial.final.response,
    feature: trial.final.response / 0.151,
    activity: Object.freeze(trial.final.activity),
  });
  cache.set(key, result);
  return result;
}
export function neuralFeatures(inputs, options) {
  return inputs.map((x) => neuralSignal(x, options).feature);
}
export function neuralStats() {
  return { computations, hits, entries: cache.size, maxEntries: 514 };
}
export function forageChannels({ direction, mask, energy, satiety, stimulus, mode = 'forage' }, options) {
  const signals = Array.from({ length: 9 }, (_, a) =>
    a === 8
      ? Math.min(1, Math.max(satiety, (1 - energy) * 0.7, mode === 'rest' ? 1 : 0))
      : Math.max(
          0,
          Math.min(
            1,
            (0.5 + 0.5 * Math.cos(((a - direction) * Math.PI) / 4)) *
              (1 - satiety * 0.75) *
              (mask & (1 << a) ? 0.05 : 1) *
              (mode === 'rest' ? 0.05 : 1) *
              (1 - stimulus * 0.15),
          ),
        ),
  );
  return neuralFeatures(signals, options);
}
export function marketChannels(delta, held, satiety, options) {
  const magnitude = Math.min(1, Math.abs(delta) / 1000);
  return neuralFeatures(
    [delta > 0 ? magnitude : 0, delta < 0 ? magnitude : 0, held ? 1 : 0, satiety],
    options,
  );
}
export function verifyMaleManifest(manifest) {
  if (
    manifest?.connectome?.graphSha256 !== MALE_CNS.graphSha256 ||
    manifest.connectome.required !== true ||
    manifest.connectome.dataset !== MALE_CNS.dataset
  )
    throw Error('Required MaleCNS model mismatch');
  if (manifest.connectome.refs?.graph?.sha256 !== MALE_CNS.graphSha256)
    throw Error('MaleCNS graph reference mismatch');
}
export async function verifyMaleAssets(manifest, fetcher = fetch) {
  verifyMaleManifest(manifest);
  const { sha256 } = await import('./circuit.js');
  for (const name of [
    'graph',
    'dynamics',
    'encoder',
    'learner',
    'readout',
    'runtime',
    ...(manifest.modelId === 'foraging-malecns-q-v3' ? ['tx-food', 'tx-world'] : []),
  ]) {
    const ref = manifest.connectome.refs?.[name];
    if (!ref || !/^\/models\/male-cns\/[a-z0-9.-]+$/.test(ref.uri))
      throw Error('Required MaleCNS artifact missing');
    const r = await fetcher(ref.uri);
    if (!r.ok) throw Error('Required MaleCNS artifact unavailable');
    const bytes = await r.arrayBuffer();
    if ((await sha256(bytes)) !== ref.sha256) throw Error('MaleCNS artifact digest mismatch');
  }
  return true;
}
