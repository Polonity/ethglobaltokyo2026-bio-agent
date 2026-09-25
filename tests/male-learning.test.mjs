import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  MALE_CNS,
  neuralSignal,
  forageChannels,
  marketChannels,
  neuralStats,
  verifyMaleManifest,
} from '../packages/bio_agent/connectome/male-cns.js';
import { Arena } from '../packages/bio_agent/browser/arena.js';
import { PaperArena } from '../packages/bio_agent/runtime/paper-arena.js';
import { trainAquaPolicy, defaultAquaPolicy } from '../packages/training/browser/aqua-learning.js';
import { decideAqua } from '../packages/bio_agent/connectome/aqua-controller.js';
const graph = JSON.parse(readFileSync('packages/bio_agent/connectome/male-cns-slice.json'));
test('mandatory pinned measured graph: missing identity rejected; ablation removes transmitted features', () => {
  assert.equal(
    MALE_CNS.graphSha256,
    '0x' +
      createHash('sha256')
        .update(readFileSync('packages/bio_agent/connectome/male-cns-slice.json'))
        .digest('hex'),
  );
  assert.throws(() => verifyMaleManifest({ connectome: { required: false } }));
  const inputs = { direction: 0, mask: 0, energy: 0.7, satiety: 0.1, stimulus: 0.5 };
  const normal = forageChannels(inputs),
    removed = forageChannels(inputs, { ablated: true });
  assert.ok(normal.some((x) => x > 0));
  assert.ok(removed.every((x) => x === 0));
  assert.notDeepEqual(marketChannels(400, false, 0.4), marketChannels(400, false, 0.4, { ablated: true }));
});
test('cache returns identical fixed circuit results and stays bounded', () => {
  const a = neuralSignal(0.43),
    before = neuralStats();
  for (let i = 0; i < 1000; i++) assert.deepEqual(neuralSignal(0.43), a);
  assert.equal(neuralStats().computations, before.computations);
  assert.ok(neuralStats().hits >= before.hits + 1000);
  assert.ok(neuralStats().entries <= 514);
});
test('foraging learns in a fixed small budget and accepted policy is used next tick', () => {
  const a = new Arena(2026, { agentCount: 1 });
  a.autoLearn = false;
  for (let i = 0; i < 80; i++) a.tick();
  const f = a.flies[0];
  a.startTraining(f);
  const v = f.version;
  for (let i = 0; i < 10; i++) a.tick();
  assert.equal(f.state, 'racing');
  assert.equal(f.lastReport.steps, 960);
  assert.equal(f.version, v + (f.lastReport.adopted ? 1 : 0));
  a.tick();
  assert.equal(f.lastTransition.policyVersion, f.version);
  assert.equal(f.lastTransition.connectome, MALE_CNS.graphSha256);
});
test('market candidate fitted on prefix, selected on suffix, adopted next decision without eight-second delay', () => {
  const a = new PaperArena(),
    f = a.flies[0];
  f.memory = Array.from({ length: 20 }, () => ({ key: '1:0:0:10:0', action: 1, reward: 0.4 }));
  a.startTraining(0);
  assert.equal(f.state, 'learning');
  a.advanceLearning();
  assert.equal(f.state, 'watching');
  assert.ok(f.report.adopted);
  assert.equal(f.version, 2);
  assert.ok(f.q['1:0:0:10:0'][1] > 0.35);
  assert.equal(f.report.trainingSamples, 14);
  assert.equal(f.report.selectionSamples, 6);
});
test('Aqua synthetic curriculum changes learned gain and decision, preserving conservative hard gate', () => {
  const old = defaultAquaPolicy(),
    p = trainAquaPolicy(old, 2);
  assert.ok(p.report.adopted);
  assert.ok(p.report.after < p.report.before);
  assert.equal(p.version, 2);
  const a = decideAqua(graph, 2000, 2, old),
    b = decideAqua(graph, 2000, 2, p);
  assert.notEqual(a.spreadBps, b.spreadBps);
  assert.equal(b.policyVersion, 2);
  assert.equal(decideAqua(graph, 10000, 2, p).action, 'dock');
  assert.throws(() => trainAquaPolicy({ ...p, model: 'unknown' }, 2));
  const retry = trainAquaPolicy(p, 2);
  assert.equal(retry.report.adopted, false);
  assert.equal(retry.version, 2);
});

test('trained readouts survive scoped storage, reject other topology/application, and retain version', async () => {
  const { policyStorage, exportReadout, restoreReadout } =
    await import('../packages/training/browser/readout.js');
  const memory = new Map(),
    storage = { getItem: (k) => memory.get(k), setItem: (k, v) => memory.set(k, v) };
  const a = new Arena(2026, { agentCount: 1 }),
    f = a.flies[0];
  a.autoLearn = false;
  for (let i = 0; i < 80; i++) a.tick();
  a.startTraining(f);
  for (let i = 0; i < 10; i++) a.tick();
  assert.ok(f.lastReport.adopted);
  const store = policyStorage(storage, 'registry:model', 'foraging');
  assert.ok(store.save(f));
  const b = new Arena(2026, { agentCount: 1 });
  assert.ok(store.restore(b.flies[0]));
  assert.deepEqual(b.flies[0].q, f.q);
  assert.equal(b.flies[0].version, 2);
  const artifact = exportReadout(f, 'foraging');
  assert.throws(() => restoreReadout(b.flies[0], { ...artifact, model: 'synthetic' }, 'foraging'));
  assert.throws(() => restoreReadout(b.flies[0], artifact, 'market'));
});
