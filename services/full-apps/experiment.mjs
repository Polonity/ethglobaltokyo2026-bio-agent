import { ForagingEnvironment } from './foraging.mjs';
import { MarketEnvironment } from './market.mjs';
import { AquaEnvironment } from './aqua.mjs';
export async function rollout({
  client,
  chain,
  tape,
  app,
  variant,
  phase,
  seed,
  steps,
  offset = 0,
  candidates = [null, null],
  stimulus = null,
  onProgress = () => {},
}) {
  const session = `${app}-${variant}-${phase}-${seed}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const env =
    app === 'foraging'
      ? new ForagingEnvironment(seed)
      : app === 'market'
        ? new MarketEnvironment(chain, tape.slice(offset))
        : new AquaEnvironment(chain, tape.slice(offset), variant);
  if (app === 'foraging' && stimulus !== null) env.world.stimulus = stimulus;
  const initialStatus = [];
  if (chain && app === 'foraging')
    for (let agent = 0; agent < 2; agent++)
      initialStatus.push(await chain.stimulus(app, variant, agent, env.world.stimulus));
  if (initialStatus.length) env.world.stimulus = initialStatus[0].stimulus / 10000;
  const rewards = [0, 0],
    ids = [[], []];
  let neuralMs = 0,
    last;
  try {
    for (let tick = 0; tick < steps; tick++) {
      const observations = env.observe();
      const answer = await client.call('act', {
        app,
        variant,
        phase,
        session,
        seed,
        candidates,
        observations,
        drives: observations.map((x) => x.drives),
        allowed: observations.map((x) => x.allowed),
        source: {
          kind:
            app === 'foraging' ? 'confirmed-status-and-foraging-observation' : 'confirmed-market-observation',
          statuses: initialStatus,
          event: observations[0].source,
          seed,
          tick,
          evaluationCase: `${app}/${seed}/${offset}/${tick}`,
        },
      });
      const outcomes = await env.apply(
        answer.decisions.map((d) => d.action),
        answer.decisions,
      );
      for (const [agent, d] of answer.decisions.entries()) {
        outcomes[agent].source ||= {
          kind: 'foraging-transition',
          statuses: initialStatus,
          seed,
          tick: env.tick,
        };
        await client.call('outcome', {
          decisionId: d.id,
          reward: outcomes[agent].reward,
          metrics: outcomes[agent].metrics,
          source: outcomes[agent].source || {
            kind: 'foraging-transition',
            statuses: initialStatus,
            seed,
            tick: env.tick,
          },
        });
        rewards[agent] += outcomes[agent].reward;
        ids[agent].push(d.id);
      }
      neuralMs += answer.neural.inferenceMs;
      last = answer;
      await onProgress({
        app,
        variant,
        phase,
        tick: tick + 1,
        total: steps,
        rewards: [...rewards],
        snapshot: env.snapshot(),
        neural: answer.neural,
        decisions: answer.decisions,
        outcomes,
      });
    }
    return {
      brainHash: last.neural.brainHash,
      app,
      variant,
      phase,
      seed,
      offset,
      steps,
      rewards,
      mean: rewards.map((x) => x / steps),
      ids,
      neuralMs,
      lastDecision: last.decisions,
      neurons: last.neural.neuronsPerIndividual,
      processPeakRSSMiB: last.neural.processPeakRSSMiB,
      snapshot: env.snapshot(),
      inputEvents:
        app === 'foraging'
          ? initialStatus
          : [tape[offset], tape[offset + (app === 'market' ? steps * 2 : steps)]],
    };
  } finally {
    await client.call('reset', { session });
  }
}
export async function trainApplication({
  client,
  chain,
  tape,
  app,
  variant,
  collectionSeed = 51027,
  onProgress = () => {},
}) {
  const collection = await rollout({
    client,
    chain,
    tape,
    app,
    variant,
    phase: 'collect',
    seed: collectionSeed,
    steps: 200,
    onProgress,
  });
  await onProgress({ app, variant, phase: 'training' });
  const candidates = [];
  for (let agent = 0; agent < 2; agent++)
    candidates.push(await client.call('train', { app, variant, agent }));
  const before = await rollout({
    client,
    chain,
    tape,
    app,
    variant,
    phase: 'selection',
    seed: 91127,
    steps: 80,
    offset: 450,
    onProgress,
  });
  const after = await rollout({
    client,
    chain,
    tape,
    app,
    variant,
    phase: 'selection',
    seed: 91127,
    steps: 80,
    offset: 450,
    candidates: candidates.map((c) => c.candidateHash),
    onProgress,
  });
  const adoption = [];
  for (let agent = 0; agent < 2; agent++)
    adoption.push(
      await client.call('adopt', {
        candidateHash: candidates[agent].candidateHash,
        evaluation: {
          before: before.mean[agent],
          after: after.mean[agent],
          metric: `mean observed ${app} action reward`,
          evaluationDecisionIds: [...before.ids[agent], ...after.ids[agent]],
        },
      }),
    );
  const test = await rollout({
    client,
    chain,
    tape,
    app,
    variant,
    phase: 'test',
    seed: 32173,
    steps: 80,
    offset: 750,
    onProgress,
  });
  return { app, variant, collection, candidates, before, after, adoption, test };
}
