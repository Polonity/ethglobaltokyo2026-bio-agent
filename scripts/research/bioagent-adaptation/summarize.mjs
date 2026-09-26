import fs from 'node:fs/promises';
import { random } from '../../../packages/bio_agent/browser/arena.js';
const out = 'artifacts/bioagent-adaptation-20260926',
  r = JSON.parse(await fs.readFile(`${out}/experiment.json`, 'utf8'));
const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
function interval(matrix) {
  const rng = random(325001),
    values = [];
  for (let b = 0; b < 2000; b++) {
    const runs = Array.from({ length: matrix.length }, () => Math.floor(rng() * matrix.length));
    const worlds = Array.from({ length: matrix[0].length }, () => Math.floor(rng() * matrix[0].length));
    values.push(mean(runs.flatMap((i) => worlds.map((j) => matrix[i][j]))));
  }
  values.sort((a, b) => a - b);
  return { mean: mean(matrix.flat()), lower95: values[50], upper95: values[1949] };
}
const rows = [];
for (const encoder of r.protocol.encoders)
  for (let p = 0; p < 3; p++) {
    const records = r.records.filter((x) => x.encoder === encoder),
      before = records.map((x) => x.before[p]),
      after = records.map((x) => x.after[p]);
    const compare = (field, ref) =>
      interval(after.map((x, i) => x.episodes.map((e, j) => e[field] - ref(i, j)[field])));
    const raw = r.records.filter((x) => x.encoder === 'raw');
    rows.push({
      encoder,
      profile: after[0].profile,
      searchRuns: records.length,
      testWorlds: after[0].episodes.length,
      adopted: records.filter((x) => x.adoption.accepted).length,
      before: Object.fromEntries(
        ['reward', 'food', 'contacts', 'rests'].map((k) => [k, mean(before.map((x) => x.metrics[k]))]),
      ),
      after: Object.fromEntries(
        ['reward', 'food', 'contacts', 'rests'].map((k) => [k, mean(after.map((x) => x.metrics[k]))]),
      ),
      passedRuns: records.filter(
        (x) =>
          x.after[p].metrics.reward > x.before[p].metrics.reward &&
          x.after[p].metrics.contacts <= x.before[p].metrics.contacts,
      ).length,
      rewardChange: compare('reward', (i, j) => before[i].episodes[j]),
      contactChange: compare('contacts', (i, j) => before[i].episodes[j]),
      versusRaw: compare('reward', (i, j) => raw[i].after[p].episodes[j]),
      versusRule: compare('reward', (_, j) => r.controls.rule[p].episodes[j]),
      unguardedCandidate: Object.fromEntries(
        ['reward', 'food', 'contacts'].map((k) => [
          k,
          mean(records.map((x) => x.unguardedCandidate[p].metrics[k])),
        ]),
      ),
    });
  }
const result = {
  protocolSha256: r.sha256,
  rows,
  control: r.controls.rule.map((x) => ({ profile: x.profile, ...x.metrics })),
  artifactBytes: r.records.map((x) => ({
    seed: x.seed,
    encoder: x.encoder,
    bytes: Buffer.byteLength(JSON.stringify(x.artifact)),
  })),
  statistics: r.protocol.statistics,
};
await fs.writeFile(`${out}/summary.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
