// Run once after freezing selection; never use these results for model selection.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BrainClient } from './brain-client.mjs';
import { FullChain } from '../../services/full-apps/chain.mjs';
import { rollout } from '../../services/full-apps/experiment.mjs';
const dir = process.env.FORAGING_VALIDATION_OUT || 'artifacts/foraging-validation-v1';
process.env.FULL_APPS_STATE_DIR ||= '.local/foraging-validation-v1';
process.env.FULL_RPC_URL ||= 'http://127.0.0.1:18578';
const selection = JSON.parse(await readFile(dir + '/selection.json'));
const directText = await readFile(dir + '/direct-control.json', 'utf8');
const direct = JSON.parse(directText);
const brain = new BrainClient(),
  chain = new FullChain();
const candidates = selection.candidates.map((x) => x.candidateHash);
const result = {
  protocol: selection.protocol,
  candidates,
  directHash: createHash('sha256').update(directText).digest('hex'),
  frozenAt: new Date().toISOString(),
  test: [],
};
await writeFile(dir + '/frozen-test.json', JSON.stringify(result, null, 2), { flag: 'wx' });
class Control {
  constructor(kind) {
    this.kind = kind;
    this.rng = 1;
    this.id = 0;
  }
  async call(op, p) {
    if (op === 'reset') {
      this.rng = 1;
      return {};
    }
    if (op === 'outcome') return {};
    if (op !== 'act') throw Error(op);
    if (p.source.tick === 0) this.rng = p.seed >>> 0;
    const random = () => {
      this.rng = (Math.imul(1664525, this.rng) + 1013904223) >>> 0;
      return this.rng / 4294967296;
    };
    return {
      neural: { inferenceMs: 0, neuronsPerIndividual: 0, brainHash: this.kind },
      decisions: p.observations.map((o, i) => {
        const model = direct.agents[i];
        const x = [
          1,
          ...o.drives.map((v, j) => Math.max(-20, Math.min(20, (v - model.mean[j]) / model.scale[j]))),
        ];
        const scores =
          this.kind === 'direct'
            ? model.weights.map((w) => w.reduce((s, v, j) => s + v * x[j], 0))
            : Array(9).fill(0);
        const max = Math.max(...o.allowed.map((a) => scores[a]));
        const ties = o.allowed.filter((a) => Math.abs(scores[a] - max) <= 1e-12);
        return {
          id: `${this.kind}-${++this.id}`,
          action: ties[Math.floor(random() * ties.length)],
          scores,
          policyVersion: 1,
        };
      }),
    };
  }
}
async function run(client, seed, replayForaging = null, modelCandidates = [null, null]) {
  const behavior = [0, 1].map(() => ({ toward: 0, moves: 0, collected: 0, hazardSteps: 0, rest: 0 }));
  const r = await rollout({
    client,
    chain,
    tape: [],
    app: 'foraging',
    variant: 'full',
    phase: 'test',
    seed,
    steps: selection.protocol.evaluationSteps,
    candidates: modelCandidates,
    replayForaging,
    onProgress: (p) =>
      p.outcomes.forEach((o, i) => {
        const m = o.metrics,
          b = behavior[i];
        b.collected += Number(m.collected);
        b.hazardSteps += Number(m.hit);
        b.rest += Number(m.action === 8);
        if (m.targetId && m.action < 8) {
          b.moves++;
          b.toward += Number(m.progress > 1e-8);
        }
      }),
  });
  return { ...r, behavior };
}
try {
  await chain.setup(await brain.call('describe'));
  for (const seed of selection.protocol.test) {
    const neural = await run(brain, seed, null, candidates);
    const replay = { environment: neural.environmentInput, statuses: neural.inputEvents };
    const random = await run(new Control('random'), seed, replay);
    const direct = await run(new Control('direct'), seed, replay);
    result.test.push({ seed, neural, random, direct });
    await writeFile(dir + '/test-progress.json', JSON.stringify(result, null, 2));
    console.log(
      JSON.stringify({ seed, neural: neural.behavior, random: random.behavior, direct: direct.behavior }),
    );
  }
  result.completedAt = new Date().toISOString();
  await writeFile(dir + '/test.json', JSON.stringify(result, null, 2));
} finally {
  brain.close();
  chain.provider.destroy();
  chain.releaseLock?.();
}
