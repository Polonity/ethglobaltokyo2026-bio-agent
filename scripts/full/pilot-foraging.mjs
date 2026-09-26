import { BrainClient } from './brain-client.mjs';
import { ForagingEnvironment } from '../../services/full-apps/foraging.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const client = new BrainClient();
const tag = Date.now().toString();
const report = { schema: 'bioagent.full-foraging-pilot.v1', runs: [] };
async function rollout(variant, phase, seed, steps, candidates = [null, null]) {
  const env = new ForagingEnvironment(seed),
    session = `${tag}-${variant}-${phase}-${seed}-${candidates.some(Boolean) ? 'candidate' : 'current'}`;
  const rewards = [0, 0],
    ids = [[], []];
  let neuralMs = 0,
    last;
  for (let tick = 0; tick < steps; tick++) {
    const observations = env.observe();
    const answer = await client.call('act', {
      app: 'foraging',
      variant,
      phase,
      session,
      seed,
      drives: observations.map((x) => x.drives),
      allowed: observations.map((x) => x.allowed),
      observations,
      candidates,
      source: { kind: 'foraging-environment', seed, tick },
    });
    const outcomes = env.apply(answer.decisions.map((d) => d.action));
    for (const [i, d] of answer.decisions.entries()) {
      await client.call('outcome', {
        decisionId: d.id,
        ...outcomes[i],
        source: { kind: 'foraging-transition', seed, tick: env.tick },
      });
      rewards[i] += outcomes[i].reward;
      ids[i].push(d.id);
    }
    neuralMs += answer.neural.inferenceMs;
    last = answer;
    if (tick % 48 === 47) console.log(JSON.stringify({ variant, phase, tick: tick + 1, rewards }));
  }
  return {
    variant,
    phase,
    seed,
    steps,
    rewards,
    mean: rewards.map((x) => x / steps),
    ids,
    neuralMs,
    lastDecision: last.decisions,
    neurons: last.neural.neuronsPerIndividual,
    snapshot: env.snapshot(),
  };
}
try {
  report.brain = await client.call('describe');
  for (const variant of ['full', 'legacy']) {
    const collection = await rollout(variant, 'collect', 51027, 240);
    const candidates = await Promise.all(
      [0, 1].map((agent) => client.call('train', { app: 'foraging', variant, agent })),
    );
    const before = await rollout(variant, 'selection', 91127, 96);
    const after = await rollout(
      variant,
      'selection',
      91127,
      96,
      candidates.map((c) => c.candidateHash),
    );
    const adoption = [];
    for (let agent = 0; agent < 2; agent++)
      adoption.push(
        await client.call('adopt', {
          candidateHash: candidates[agent].candidateHash,
          evaluation: {
            before: before.mean[agent],
            after: after.mean[agent],
            metric: 'mean observed foraging reward per action',
            evaluationDecisionIds: [...before.ids[agent], ...after.ids[agent]],
          },
        }),
      );
    const test = await rollout(variant, 'test', 32173, 96);
    report.runs.push({ variant, collection, candidates, before, after, adoption, test });
    console.log(
      JSON.stringify({
        variant,
        adopted: adoption.map((r) => r.adopted),
        before: before.rewards,
        after: after.rewards,
        testRewards: test.rewards,
      }),
    );
  }
  await mkdir('artifacts/full-apps', { recursive: true });
  await writeFile('artifacts/full-apps/foraging-pilot.json', JSON.stringify(report, null, 2) + '\n');
} finally {
  client.close();
}
