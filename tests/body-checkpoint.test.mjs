import test from 'node:test';
import assert from 'node:assert/strict';
import { Arena, observe } from '../packages/bio_agent/browser/arena.js';
import { bodyStep } from '../packages/bio_agent/browser/body.js';
test('feeding changes fullness and sustained reserves change body mass; fasting reverses it', () => {
  const fly = { energy: 0.7, satiety: 0.4, reserves: 0.5, massRatio: 1 };
  for (let i = 0; i < 400; i++) bodyStep(fly, { fed: i % 10 === 0, resting: true });
  assert.ok(fly.satiety > 0.8);
  assert.ok(fly.massRatio > 1);
  const fat = fly.massRatio;
  for (let i = 0; i < 700; i++) bodyStep(fly);
  assert.equal(fly.satiety, 0);
  assert.ok(fly.massRatio < fat);
});
test('same environment with different body has different actual policy observations', () => {
  const arena = new Arena(42, { agentCount: 3 });
  const a = arena.flies[0];
  a.satiety = 0.05;
  const hungry = observe(a, arena.world);
  a.satiety = 0.95;
  const full = observe(a, arena.world);
  assert.equal(hungry.direction, full.direction);
  assert.notEqual(hungry.key, full.key);
});
test('checkpoint resumes racing and active training bit-for-bit', () => {
  const a = new Arena(42, { agentCount: 3 });
  for (let i = 0; i < 110; i++) a.tick();
  assert.ok(a.flies.some((f) => f.state === 'learning'));
  const checkpoint = a.checkpoint();
  const b = Arena.restore(checkpoint);
  for (let i = 0; i < 160; i++) {
    a.tick();
    b.tick();
  }
  assert.deepEqual(a.checkpoint(), b.checkpoint());
  assert.throws(() => Arena.restore({ ...checkpoint, model: 'old-model' }));
});

test('a fixed policy chooses different actions with controlled fullness', () => {
  const hungry = new Arena(42, { agentCount: 1 });
  hungry.autoLearn = false;
  hungry.world.stimulus = 0;
  hungry.flies[0].exploration = 0;
  hungry.flies[0].satiety = 0.05;
  const full = Arena.restore(hungry.checkpoint());
  full.flies[0].satiety = 0.95;
  hungry.tick();
  full.tick();
  assert.notEqual(hungry.flies[0].lastTransition.action, 8);
  assert.equal(full.flies[0].lastTransition.action, 8);
});
