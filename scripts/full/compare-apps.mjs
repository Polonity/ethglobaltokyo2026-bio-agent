import { BrainClient } from './brain-client.mjs';
import { FullChain } from '../../services/full-apps/chain.mjs';
import { rollout } from '../../services/full-apps/experiment.mjs';
import { Arena } from '../../packages/bio_agent/browser/arena.js';
import { PaperArena } from '../../packages/bio_agent/runtime/paper-arena.js';
import { decideAqua } from '../../packages/bio_agent/connectome/aqua-controller.js';
import { defaultAquaPolicy, trainAquaPolicy } from '../../packages/training/browser/aqua-learning.js';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const client = new BrainClient(),
  chain = new FullChain();
const result = {
  schema: 'bioagent.full-app-comparison.v1',
  runs: [],
  original: [],
  limits: [
    'Engineering benchmark on scripted test inputs, not a generalization or financial-performance claim.',
    'Full/legacy share environment and readout learner; encoding, temporal state, and neural step count differ.',
    'Original browser engines remain unchanged; cadence, initial priors, and learning/adoption rules differ, so their metrics are a separate reference.',
  ],
};
const save = () => writeFile('artifacts/full-apps/comparison.json', JSON.stringify(result, null, 2) + '\n');
try {
  result.brain = await client.call('describe');
  await chain.setup(result.brain);
  const tape = JSON.parse(await readFile('artifacts/full-apps/market-tape.json'));
  await chain.validateTape(tape);
  for (const app of ['foraging', 'market', 'aqua'])
    for (const variant of ['full', 'legacy']) {
      for (const [seed, offset] of app === 'foraging'
        ? [
            [71203, 0],
            [71209, 0],
            [71233, 0],
          ]
        : [
            [71203, 620],
            [71209, 810],
          ]) {
        const start = performance.now();
        const run = await rollout({
          client,
          chain,
          tape: tape.events,
          app,
          variant,
          phase: 'test',
          seed,
          offset,
          steps: 80,
        });
        result.runs.push({ ...run, elapsedMs: performance.now() - start });
        await save();
        console.log(
          JSON.stringify({
            app,
            variant,
            seed,
            offset,
            rewards: run.rewards,
            versions: run.lastDecision.map((d) => d.policyVersion),
          }),
        );
      }
    }
  for (const seed of [71203, 71209, 71233]) {
    const arena = new Arena(seed, { agentCount: 2 }),
      start = performance.now();
    for (let t = 0; t < 400; t++) arena.tick(0.2);
    result.original.push({
      app: 'foraging',
      seed,
      ticks: 400,
      elapsedMs: performance.now() - start,
      flies: arena.flies.map((f) => ({
        score: f.score,
        collisions: f.collisions,
        version: f.version,
        activeTicks: f.activeTicks,
        trainingCount: f.trainingCount,
      })),
      metric: 'Original food score and collisions, not new adapter reward. Original auto-learning enabled.',
    });
  }
  for (const offset of [620, 810]) {
    const arena = new PaperArena(71203);
    arena.flies = arena.flies.slice(0, 2);
    const start = performance.now();
    for (const event of tape.events.slice(offset, offset + 161)) {
      await arena.consume({ ...event, id: event.transactionHash + ':' + event.logIndex }, (side, amount, e) =>
        chain.quote(side, BigInt(amount), e),
      );
      arena.advanceLearning(0.2);
    }
    result.original.push({
      app: 'market',
      offset,
      events: 161,
      elapsedMs: performance.now() - start,
      flies: arena.flies.map((f) => ({
        pnl: Number(f.pnl) / 1e18,
        version: f.version,
        trades: f.trades.length,
        learningReport: f.report,
      })),
      metric:
        'Original event cadence and live auto-learning; same confirmed input interval, different decision schedule.',
    });
  }
  const graph = JSON.parse(await readFile('packages/bio_agent/connectome/male-cns-slice.json'));
  for (const agentId of [1, 2]) {
    const start = performance.now(),
      before = defaultAquaPolicy(),
      after = trainAquaPolicy(before, agentId);
    const decisions = Array.from({ length: 80 }, (_, i) =>
      decideAqua(graph, Math.round((i * 10000) / 79), agentId, after),
    );
    result.original.push({
      app: 'aqua',
      agentId,
      elapsedMs: performance.now() - start,
      version: after.version,
      learningReport: after.report,
      actionCounts: Object.fromEntries(
        ['ship', 'cautious', 'dock'].map((a) => [a, decisions.filter((d) => d.action === a).length]),
      ),
      metric:
        'Unchanged synthetic-risk learning and neural controller. No observed-PnL learning exists in this baseline; not interchangeable with new Aqua reward.',
    });
  }
  result.originalSourceHashes = {};
  for (const p of [
    'packages/bio_agent/browser/arena.js',
    'packages/bio_agent/runtime/paper-arena.js',
    'packages/bio_agent/connectome/aqua-controller.js',
    'packages/training/browser/aqua-learning.js',
  ])
    result.originalSourceHashes[p] = createHash('sha256')
      .update(await readFile(p))
      .digest('hex');
  await save();
} finally {
  client.close();
  chain.close();
}
