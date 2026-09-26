import test from 'node:test';
import assert from 'node:assert/strict';
import { LearningBioAgent } from '../src/index.js';
import { AquaBackend, ForagingBackend } from '../src/adapters.js';
const identity = { id: 'adoption', owner: '0x' + '11'.repeat(20) };
test('a valid but harmful candidate is rejected without changing downstream decisions or version', async () => {
  class BadFit extends AquaBackend {
    fit(p, c) {
      return { policy: { ...p, gain: 0.5 }, training: { seeds: c.seeds } };
    }
  }
  const a = new LearningBioAgent(identity, new BadFit());
  a.observe({ activity: 2, energy: 7000, stimulus: 3500 });
  const before = await a.exportPolicy(),
    decision = a.step();
  a.train({ seeds: [101] });
  const evaluation = a.evaluate({ seeds: [103] });
  assert.ok(evaluation.after.mse > evaluation.before.mse);
  assert.equal(a.adopt().accepted, false);
  assert.deepEqual(await a.exportPolicy(), before);
  assert.deepEqual(a.step(), decision);
});
test('an energy floor can reject a reward-improving foraging candidate and is part of artifact compatibility', async () => {
  const config = {
    seed: 310001,
    seeds: [311000, 311019, 311038, 311057],
    profiles: [{ name: 'default', energy: 0.7, stimulus: 0.55 }],
    ticks: 300,
    trials: 16,
  };
  const selection = { seeds: [312000, 312019, 312038, 312057], profiles: config.profiles, ticks: 300 };
  const open = new LearningBioAgent(identity, new ForagingBackend()),
    constrained = new LearningBioAgent(identity, new ForagingBackend({ minimumFinalEnergy: 0.8 }));
  for (const a of [open, constrained]) a.train(config);
  const first = open.evaluate(selection),
    second = constrained.evaluate(selection);
  assert.ok(second.after[0].metrics.reward > second.before[0].metrics.reward);
  assert.equal(first.gate.passed, true);
  assert.equal(second.gate.passed, false);
  assert.equal(open.adopt().accepted, true);
  assert.equal(constrained.adopt().accepted, false);
  await assert.rejects(constrained.restorePolicy(await open.exportPolicy()), /Incompatible/);
});
test('unbounded or malformed experiment requests fail before running the learner', () => {
  const a = new LearningBioAgent(identity, new ForagingBackend());
  for (const bad of [[], [1, 1], Array.from({ length: 257 }, (_, i) => i)])
    assert.throws(() => a.train({ seeds: bad }));
  const config = {
    seed: 10,
    seeds: [1],
    profiles: [{ name: 'default', energy: 0.7, stimulus: 0.55 }],
    ticks: 300,
    trials: 1,
  };
  assert.throws(() => a.train({ ...config, trials: 1e6 }), /Bounded/);
  assert.throws(() => a.train({ ...config, profiles: [] }), /Bounded/);
  assert.throws(
    () => a.train({ ...config, profiles: [{ name: 'bad', energy: NaN, stimulus: 0.55 }] }),
    /Invalid/,
  );
});
