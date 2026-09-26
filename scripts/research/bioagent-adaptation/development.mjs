import fs from 'node:fs/promises';
import {
  initialPolicy,
  fitReadout,
  evaluatePolicy,
} from '../../../packages/bio_agent/research/adaptive-forager.js';
const profiles = [
  { name: 'default', stimulus: 0.55, energy: 0.7 },
  { name: 'shifted', stimulus: 0.9, energy: 0.35 },
];
const records = [];
for (const encoder of ['malecns', 'raw']) {
  const before = { ...initialPolicy(), encoder };
  const fitted = fitReadout(before, {
    seed: 310001,
    seeds: Array.from({ length: 8 }, (_, i) => 311000 + i * 19),
    profiles,
    trials: 32,
  });
  const seeds = Array.from({ length: 16 }, (_, i) => 312000 + i * 19);
  const result = {
    encoder,
    policy: fitted.policy,
    training: fitted.training,
    before: evaluatePolicy(before, seeds, profiles),
    after: evaluatePolicy(fitted.policy, seeds, profiles),
  };
  records.push(result);
  console.log(
    JSON.stringify({
      encoder,
      policy: fitted.policy,
      before: result.before.map((p) => p.metrics),
      after: result.after.map((p) => p.metrics),
    }),
  );
}
await fs.writeFile(
  'artifacts/bioagent-adaptation-20260926/development.json',
  JSON.stringify({ role: 'development only, not final test', records }, null, 2),
);
