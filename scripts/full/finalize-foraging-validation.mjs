import { readFile, writeFile } from 'node:fs/promises';
import { BrainClient } from './brain-client.mjs';
import { summarizeEpisodes, foragingSafetyGate } from '../../services/full-apps/foraging-protocol.mjs';
const dir = process.env.FORAGING_VALIDATION_OUT || 'artifacts/foraging-validation-v1';
process.env.FULL_APPS_STATE_DIR ||= '.local/foraging-validation-v1';
const selection = JSON.parse(await readFile(dir + '/selection.json'));
const tests = JSON.parse(await readFile(dir + '/test.json'));
const before = summarizeEpisodes(selection.selection.map((x) => x.before));
const after = summarizeEpisodes(selection.selection.map((x) => x.after));
const summary = {
  schema: 'bioagent.foraging-behavior-validation.v1',
  createdAt: new Date().toISOString(),
  trainingWorlds: 12,
  selectionWorlds: 6,
  testWorlds: 12,
  agents: 2,
  stepsPerTestWorld: 80,
  availableFood: 24,
  candidates: tests.candidates,
  models: {},
};
for (const key of ['neural', 'random', 'direct']) {
  const episodes = tests.test.map((t) => t[key]);
  const b = episodes.flatMap((e) => e.behavior);
  const sum = (k) => b.reduce((s, x) => s + x[k], 0);
  summary.models[key] = {
    collected: sum('collected'),
    hazardSteps: sum('hazardSteps'),
    toward: sum('toward'),
    moves: sum('moves'),
    towardFraction: sum('toward') / sum('moves'),
    reward: episodes.reduce((s, e) => s + e.rewards.reduce((a, b) => a + b, 0), 0),
    maxHazardStepsPerWorld: Math.max(
      ...episodes.map((e) => e.behavior.reduce((s, b) => s + b.hazardSteps, 0)),
    ),
  };
}
const n = summary.models.neural,
  a = selection.protocol.acceptance;
summary.acceptance = {
  food: n.collected / 24 >= a.minimumFoodFraction,
  toward: n.towardFraction >= a.minimumTowardFraction,
  hazard: n.maxHazardStepsPerWorld <= a.maximumHazardStepsPerEpisode,
  beatsRandom: n.collected > summary.models.random.collected,
};
summary.allCriteriaMet = Object.values(summary.acceptance).every(Boolean);
summary.limitations = [
  'One training run and twelve paired held-out layouts, not independent training replications.',
  'Direct sensory ridge control also learns; no general biological superiority or power advantage established.',
  'Strict hazard criterion was frozen before testing and remains unmet; approach/collection improved but safe navigation is unfinished.',
  'Engineered directional sensory encoding; only the action readout is trained, not connectome synapses.',
  'All environment inputs are confirmed local Anvil transactions; learned policy execution is off-chain.',
];
const client = new BrainClient();
try {
  const adoption = [];
  for (let agent = 0; agent < 2; agent++) {
    if (!foragingSafetyGate(before, after, agent)) throw Error('Selection safety regression');
    adoption.push(
      await client.call('adopt', {
        candidateHash: selection.candidates[agent].candidateHash,
        evaluation: {
          before: before.mean[agent],
          after: after.mean[agent],
          metric: 'mean observed reward across six paired selection worlds',
          evaluationDecisionIds: [...before.ids[agent], ...after.ids[agent]],
        },
      }),
    );
  }
  const report = {
    app: 'foraging',
    variant: 'full',
    protocol: selection.protocol,
    collection: summarizeEpisodes(selection.collection),
    candidates: selection.candidates,
    before,
    after,
    adoption,
    test: summarizeEpisodes(tests.test.map((x) => x.neural)),
  };
  await writeFile(dir + '/foraging-full-latest.json', JSON.stringify(report, null, 2));
  summary.adopted = adoption.map((a) => a.adopted);
  await writeFile(dir + '/summary.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  client.close();
}
