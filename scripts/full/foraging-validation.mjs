import { FORAGING_PROTOCOL } from '../../services/full-apps/foraging-protocol.mjs';
// Controlled local experiment; all world/food inputs are real Anvil TXs.
import { mkdir, writeFile } from 'node:fs/promises';
import { BrainClient } from './brain-client.mjs';
import { FullChain } from '../../services/full-apps/chain.mjs';
import { rollout } from '../../services/full-apps/experiment.mjs';
const dir = process.env.FORAGING_VALIDATION_OUT || 'artifacts/foraging-validation-v1';
process.env.FULL_APPS_STATE_DIR ||= '.local/foraging-validation-v1';
process.env.FULL_RPC_URL ||= 'http://127.0.0.1:18578';
await mkdir(dir, { recursive: true });
const protocol = {
  schema: 'bioagent.foraging-validation.v1',
  ...FORAGING_PROTOCOL,
  acceptance: {
    minimumFoodFraction: 0.75,
    minimumTowardFraction: 0.65,
    maximumHazardStepsPerEpisode: 1,
    requiresBeatingRandom: true,
  },
  scope: 'Two-agent shared worlds; local TX inputs. Final tests are not used to tune or select candidates.',
};
await writeFile(dir + '/protocol.json', JSON.stringify(protocol, null, 2) + '\n');
const brain = new BrainClient(),
  chain = new FullChain();
const result = { protocol, startedAt: new Date().toISOString(), collection: [], selection: [], test: [] };
async function run(seed, phase, candidates = [null, null], replayForaging = null, epsilon = null) {
  const behavior = [0, 1].map(() => ({
    toward: 0,
    away: 0,
    stationary: 0,
    moves: 0,
    progress: 0,
    collected: 0,
    hazardSteps: 0,
    rest: 0,
  }));
  const report = await rollout({
    client: brain,
    chain,
    tape: [],
    app: 'foraging',
    variant: 'full',
    phase,
    seed,
    steps: phase === 'collect' ? protocol.collectionSteps : protocol.evaluationSteps,
    candidates,
    replayForaging,
    epsilon,
    onProgress: (p) => {
      for (const [i, x] of p.outcomes.entries()) {
        const b = behavior[i],
          m = x.metrics;
        b.collected += Number(m.collected);
        b.hazardSteps += Number(m.hit);
        b.rest += Number(m.action === 8);
        if (m.targetId && m.action < 8) {
          b.moves++;
          b.toward += Number(m.progress > 1e-8);
          b.away += Number(m.progress < -1e-8);
          b.stationary += Number(Math.abs(m.progress) <= 1e-8);
          b.progress += m.progress;
        }
      }
    },
  });
  return { ...report, behavior };
}
try {
  result.model = await brain.call('describe');
  await chain.setup(result.model);
  for (const seed of protocol.training) {
    const r = await run(seed, 'collect');
    result.collection.push(r);
    await writeFile(dir + '/progress.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ phase: 'collection', seed, behavior: r.behavior }));
  }
  result.candidates = await Promise.all(
    [0, 1].map((agent) => brain.call('train', { app: 'foraging', variant: 'full', agent })),
  );
  const candidates = result.candidates.map((x) => x.candidateHash);
  for (const seed of protocol.selection) {
    const before = await run(seed, 'selection');
    const replay = { environment: before.environmentInput, statuses: before.inputEvents };
    const after = await run(seed, 'selection', candidates, replay);
    result.selection.push({ seed, before, after });
    await writeFile(dir + '/progress.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ phase: 'selection', seed, before: before.behavior, after: after.behavior }));
  }
  // Stop before final tests: inspect selection and freeze the protocol/model for the next stage.
  result.completedAt = new Date().toISOString();
  await writeFile(dir + '/selection.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ phase: 'selection-complete', path: dir + '/selection.json' }));
} finally {
  brain.close();
  chain.provider.destroy();
  chain.releaseLock?.();
}
