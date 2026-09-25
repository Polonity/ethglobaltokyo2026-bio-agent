import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { runCircuitTrial } from '../packages/bio_agent/connectome/circuit.js';
import { neuralSignal, neuralStats, MALE_CNS } from '../packages/bio_agent/connectome/male-cns.js';
import { Arena } from '../packages/bio_agent/browser/arena.js';
import { trainAquaPolicy, defaultAquaPolicy } from '../packages/training/browser/aqua-learning.js';
const graph = JSON.parse(await readFile('packages/bio_agent/connectome/male-cns-slice.json'));
const time = (fn) => {
  const t = performance.now();
  fn();
  return performance.now() - t;
};
const inputs = Array.from({ length: 4096 }, (_, i) => (i % 257) / 256);
const directMs = time(() => inputs.forEach((x) => runCircuitTrial(graph, x)));
const cachedColdMs = time(() => inputs.forEach(neuralSignal));
const cachedWarmMs = time(() => inputs.forEach(neuralSignal));
const arena = new Arena(2026, { agentCount: 3 });
arena.autoLearn = false;
for (let i = 0; i < 80; i++) arena.tick();
const trainingStartMs = time(() => arena.startTraining(arena.flies[0]));
const batches = [];
while (arena.flies[0].state === 'learning') batches.push(time(() => arena.tick()));
let aquaPolicy;
const aquaTrainingMs = time(() => {
  aquaPolicy = trainAquaPolicy(defaultAquaPolicy(), 2);
});
const result = {
  measuredAt: new Date().toISOString(),
  runtime: process.version,
  model: MALE_CNS,
  signals: inputs.length,
  directMs,
  cachedColdMs,
  cachedWarmMs,
  warmSpeedup: directMs / cachedWarmMs,
  cache: neuralStats(),
  foraging: {
    trainingStartMs,
    batches,
    batchMaxMs: Math.max(...batches),
    updates: arena.flies[0].lastReport.steps,
    report: arena.flies[0].lastReport,
  },
  aqua: { trainingMs: aquaTrainingMs, policy: aquaPolicy },
  limits: 'Local CPU measurements; not cross-device guarantees or biological energy-efficiency evidence',
};
await mkdir('artifacts/male-learning', { recursive: true });
await writeFile('artifacts/male-learning/benchmark.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
