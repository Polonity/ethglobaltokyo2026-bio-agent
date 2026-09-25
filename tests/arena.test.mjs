import test from 'node:test';
import assert from 'node:assert/strict';
import { Arena, evaluate } from '../packages/bio_agent/browser/arena.js';

test('seeded race is reproducible, competes and automatically learns', () => {
  const a = new Arena(42), b = new Arena(42);
  for (let i = 0; i < 200; i++) { a.tick(); b.tick(); }
  assert.deepEqual(a.flies.map(f => [f.x, f.y, f.score, f.version]), b.flies.map(f => [f.x, f.y, f.score, f.version]));
  assert.ok(a.flies.some(f => f.score > 0));
  assert.ok(a.flies.some(f => f.trainingCount > 0));
  const reports = a.flies.filter(f => f.lastReport).map(f => f.lastReport);
  assert.ok(reports.length >= 2);
  assert.ok(reports.every(r => !r.accepted || r.after > r.before));
});
test('training actually updates Q values and only promotes better benchmark scores', () => {
  const a = new Arena(2026);
  a.autoLearn = false;
  for (let i = 0; i < 80; i++) a.tick();
  const fly = a.flies[0];
  const old = JSON.stringify(fly.q);
  assert.equal(a.startTraining(fly), true);
  assert.equal(a.startTraining(fly), false);
  const score = fly.score;
  for (let i = 0; i < 45; i++) a.tick();
  assert.ok(fly.lastReport.steps >= 900);
  assert.equal(fly.state, 'racing');
  assert.ok(fly.lastReport.accepted ? JSON.stringify(fly.q) !== old : JSON.stringify(fly.q) === old);
  assert.ok(fly.score >= score);
  assert.ok(Number.isFinite(evaluate(fly.q)));
});
test('pause, input bounds, local stimuli, round completion and retained policies', () => {
  const a = new Arena();
  a.paused = true; a.tick(); assert.equal(a.time, 0);
  a.paused = false;
  a.applyStatus({ stimulus: 2, energy: -1, mode: 'invalid' });
  assert.equal(a.world.stimulus, 1); assert.equal(a.world.energy, 0);
  assert.equal(a.world.mode, 'forage');
  a.addFood(-100, 100); assert.equal(a.world.foods.at(-1).x, 1);
  for (let i = 0; i < 500; i++) a.tick();
  assert.equal(a.finished, true); assert.equal(a.time, 90);
  const policies = a.flies.map(f => JSON.stringify(f.q));
  a.nextRound(); assert.equal(a.round, 2); assert.equal(a.time, 0);
  assert.deepEqual(a.flies.map(f => JSON.stringify(f.q)), policies);
});
