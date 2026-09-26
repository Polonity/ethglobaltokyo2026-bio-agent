import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORAGING_PROTOCOL,
  summarizeEpisodes,
  foragingSafetyGate,
} from '../services/full-apps/foraging-protocol.mjs';
test('training, selection and final test layouts are disjoint', () => {
  const p = FORAGING_PROTOCOL,
    all = [...p.training, ...p.selection, ...p.test];
  assert.equal(new Set(all).size, all.length);
  assert.equal(p.training.length, 12);
  assert.equal(p.test.length, 12);
});
test('pooled means use all decisions and preserve paired episode IDs', () => {
  const episode = (steps, r, id) => ({
    steps,
    rewards: [r, r * 2],
    ids: [[id + 'a'], [id + 'b']],
    neuralMs: steps * 2,
    behavior: [
      { collected: 1, hazardSteps: 0 },
      { collected: 0, hazardSteps: 1 },
    ],
  });
  const r = summarizeEpisodes([episode(10, 2, 'x'), episode(30, 6, 'y')]);
  assert.deepEqual(r.mean, [0.2, 0.4]);
  assert.deepEqual(r.ids, [
    ['xa', 'ya'],
    ['xb', 'yb'],
  ]);
  assert.equal(r.behavior[0].collected, 2);
});
test('higher reward does not excuse worse foraging or hazard exposure', () => {
  const a = { behavior: [{ collected: 2, hazardSteps: 1 }] };
  assert.equal(foragingSafetyGate(a, { behavior: [{ collected: 1, hazardSteps: 0 }] }, 0), false);
  assert.equal(foragingSafetyGate(a, { behavior: [{ collected: 3, hazardSteps: 2 }] }, 0), false);
  assert.equal(foragingSafetyGate(a, { behavior: [{ collected: 2, hazardSteps: 0 }] }, 0), true);
});
