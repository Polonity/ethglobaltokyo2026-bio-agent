import test from 'node:test';
import assert from 'node:assert/strict';
import { LearningBioAgent, ChainDecisionRunner, SharedArenaClock, digest } from '../src/index.js';
import { ForagingBackend, AquaBackend } from '../src/adapters.js';
import { Arena } from '../../bio_agent/browser/arena.js';
import { ForagingBioAgent, UniswapPriceBioAgent, IBioAgentRuntime } from '../../bio_agent/runtime/agents.js';
const owner = '0x' + '11'.repeat(20),
  registry = '0x' + '22'.repeat(20);
const identity = { id: 'test-1', owner };
const profile = [{ name: 'default', stimulus: 0.55, energy: 0.7 }];
const agent = (backend) => new LearningBioAgent(identity, backend);
const input = (a) => ({
  source: 'evm-rpc-state',
  chainId: 31337,
  registry,
  agentId: '1',
  owner,
  model: a.binding.model,
  block: { number: 10, hash: '0x' + '44'.repeat(32), timestamp: 1000, confirmations: 2 },
  status: { activity: 2, energy: 7000, stimulus: 5500, revision: '1', updatedAt: 990 },
});
const runner = (a) => new ChainDecisionRunner(a, { chainId: 31337, registry, agentId: 1 });

test('different task engines inherit one learning lifecycle, require evaluation, reject training leakage and restore exact behavior', async () => {
  for (const Backend of [ForagingBackend, AquaBackend]) {
    const a = agent(new Backend({ seed: 42 })),
      b = agent(new Backend({ seed: 42 }));
    assert.ok(a instanceof IBioAgentRuntime);
    const candidate = a.train({
      seed: 310001,
      seeds: [311000, 311019],
      profiles: profile,
      trials: 12,
      ticks: 100,
    });
    candidate.policy = null;
    assert.notEqual(a.candidate.policy, null);
    assert.throws(() => a.adopt(), /Evaluated/);
    assert.throws(() => a.evaluate({ seeds: [311000], profiles: profile, ticks: 100 }), /overlap/);
    const evaluation = a.evaluate({ seeds: [312000, 312019], profiles: profile, ticks: 100 });
    evaluation.gate.passed = false;
    const report = a.adopt();
    assert.equal(typeof report.accepted, 'boolean');
    const saved = await a.exportPolicy();
    await b.restorePolicy(saved);
    const status = { activity: 2, energy: 7000, stimulus: 3400 };
    a.observe(status);
    b.observe(status);
    for (let i = 0; i < 300; i++) assert.deepEqual(a.step(), b.step());
    assert.deepEqual(a.snapshot(), b.snapshot());
  }
});
test('restore checks integrity and all compatibility fields; rejected restore never changes active policy', async () => {
  const a = agent(new ForagingBackend()),
    original = await a.exportPolicy();
  for (const field of ['model', 'encoder', 'dynamics', 'readout', 'actionSpace', 'task']) {
    const { sha256: _, ...p } = structuredClone(original);
    p.binding[field] = 'wrong';
    await assert.rejects(a.restorePolicy({ ...p, sha256: await digest(p) }), /Incompatible/);
  }
  const tampered = structuredClone(original);
  tampered.policy.weights[0] = 0.5;
  await assert.rejects(a.restorePolicy(tampered), /digest/);
  await assert.rejects(agent(new AquaBackend()).restorePolicy(original), /Incompatible/);
  await assert.rejects(
    new LearningBioAgent({ id: 'other', owner }, new ForagingBackend()).restorePolicy(original),
    /Incompatible/,
  );
  assert.deepEqual(await a.exportPolicy(), original);
});
test('restore discards any staged evaluation; no old candidate can overwrite a restored policy', async () => {
  const a = agent(new AquaBackend()),
    original = await a.exportPolicy();
  a.train({ seeds: [17] });
  a.evaluate({ seeds: [19] });
  await a.restorePolicy(original);
  assert.throws(() => a.adopt(), /Evaluated/);
});
test('chain runner rejects wrong identity, model, chain, stale and conflicting input before advancing', async () => {
  const a = agent(new AquaBackend()),
    r = runner(a),
    good = input(a);
  assert.equal(r.observe(good, 1000), true);
  assert.equal(r.observe(good, 1000), false);
  const decision = await r.decide(1001);
  assert.equal(decision.input.status.revision, '1');
  assert.equal(decision.execution, 'decision-only');
  const before = a.snapshot();
  const invalid = [
    { ...good, chainId: 1 },
    { ...good, agentId: '2' },
    { ...good, owner: registry },
    { ...good, model: '0x' + '55'.repeat(32) },
    { ...good, block: { ...good.block, confirmations: 0 } },
    { ...good, block: { ...good.block, hash: '0x' + '66'.repeat(32) } },
    { ...good, status: { ...good.status, stimulus: 9999 } },
    { ...good, status: { ...good.status, revision: '2', stimulus: 1000 } },
    { ...good, status: { ...good.status, revision: '2', energy: -1 } },
  ];
  for (const bad of invalid) assert.throws(() => r.observe(bad, 1001));
  await assert.rejects(r.decide(1201), /Fresh/);
  assert.deepEqual(a.snapshot(), before);
  r.observe(
    { ...good, block: { ...good.block, number: 11, hash: '0x' + '77'.repeat(32), timestamp: 1010 } },
    1010,
  );
  assert.equal((await r.decide(1010)).input.block.number, 11);
});
test('shared clock advances every individual once; duplicate ticks are idempotent, competing clocks and input-specific adapters rejected', () => {
  const arena = new Arena(42, { agentCount: 2 });
  arena.autoLearn = false;
  const agents = [1, 2].map((i) => new ForagingBioAgent({ id: String(i), owner }, arena, i));
  const clock = new SharedArenaClock(agents);
  assert.equal(clock.advance(1).applied, true);
  assert.equal(clock.advance(1).applied, false);
  assert.equal(arena.time, 0.2);
  assert.deepEqual(
    arena.flies.map((f) => f.activeTicks),
    [1, 1],
  );
  assert.throws(() => clock.advance(3), /Out-of-order/);
  assert.throws(() => new SharedArenaClock(agents), /owner/);
  assert.throws(
    () =>
      new SharedArenaClock([
        new UniswapPriceBioAgent(identity, { chainId: 1, tokenIn: owner, tokenOut: registry, amountIn: '1' }),
      ]),
    /foraging/,
  );
  for (let i = 2; i <= 30; i++) clock.advance(i);
  assert.deepEqual(
    arena.flies.map((f) => f.activeTicks),
    [30, 30],
  );
});
