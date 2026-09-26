import { FORAGING_PROTOCOL, summarizeEpisodes, foragingSafetyGate } from './foraging-protocol.mjs';
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
  epsilon = null,
  replayForaging = null,
  onProgress = () => {},
}) {
  const session = `${app}-${variant}-${phase}-${seed}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const env =
    app === 'foraging'
      ? new ForagingEnvironment(seed, { txFood: Boolean(chain) })
      : app === 'market'
        ? new MarketEnvironment(chain, tape.slice(offset))
        : new AquaEnvironment(chain, tape.slice(offset), variant);
  if (replayForaging) {
    if (!chain || app !== 'foraging') throw Error('Foraging replay requires a chain');
    // The same seed with new TX hashes would move the food and confound policy comparison.
    for (const event of [replayForaging.environment, ...replayForaging.statuses]) {
      const receipt = await chain.provider.getTransactionReceipt(event.transactionHash);
      const block = await chain.provider.getBlock(Number(event.blockNumber));
      if (
        !receipt ||
        receipt.status !== 1 ||
        receipt.blockHash !== event.blockHash ||
        block?.hash !== event.blockHash
      )
        throw Error('Foraging replay input is no longer canonical');
    }
  }
  if (chain && app === 'foraging')
    env.applyWorld(replayForaging?.environment || (await chain.configureForaging(variant, seed)));
  const inputStimulus = stimulus ?? 0.55;
  if (!chain && app === 'foraging') env.world.stimulus = inputStimulus;
  const initialStatus = replayForaging ? structuredClone(replayForaging.statuses) : [];
  if (!replayForaging && chain && app === 'foraging')
    for (let agent = 0; agent < 2; agent++)
      initialStatus.push(await chain.stimulus(app, variant, agent, inputStimulus));
  if (initialStatus.length) {
    env.world.stimulus = initialStatus[0].stimulus / 10000;
    env.world.energy = initialStatus[0].energy / 10000;
    env.world.mode = ['rest', 'explore', 'forage'][initialStatus[0].activity];
    for (const event of initialStatus) env.addStimulus(event);
  }
  const behavior = [0, 1].map(() => ({ collected: 0, hazardSteps: 0, toward: 0, moves: 0, rest: 0 }));
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
        ...(epsilon === null ? {} : { epsilon }),
        observations,
        drives: observations.map((x) => x.drives),
        allowed: observations.map((x) => x.allowed),
        source: {
          kind:
            app === 'foraging' ? 'confirmed-status-and-foraging-observation' : 'confirmed-market-observation',
          statuses: initialStatus,
          environment: app === 'foraging' ? env.world.worldSource : null,
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
          environment: app === 'foraging' ? env.world.worldSource : null,
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
            environment: app === 'foraging' ? env.world.worldSource : null,
            seed,
            tick: env.tick,
          },
        });
        if (app === 'foraging') {
          const m = outcomes[agent].metrics,
            b = behavior[agent];
          b.collected += Number(m.collected);
          b.hazardSteps += Number(m.hit);
          b.rest += Number(m.action === 8);
          if (m.targetId && m.action < 8) {
            b.moves++;
            b.toward += Number(m.progress > 1e-8);
          }
        }
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
      behavior,
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
      environmentInput: app === 'foraging' ? env.world.worldSource : null,
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
  if (app === 'foraging') return trainForaging({ client, chain, tape, variant, onProgress, collectionSeed });
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
    replayForaging:
      app === 'foraging' && chain
        ? { environment: before.environmentInput, statuses: before.inputEvents }
        : null,
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

async function trainForaging({ client, chain, tape, variant, onProgress, collectionSeed }) {
  const app = 'foraging',
    protocol = FORAGING_PROTOCOL;
  const run = (phase, seed, extra = {}) =>
    rollout({
      client,
      chain,
      tape,
      app,
      variant,
      phase,
      seed,
      steps: phase === 'collect' ? protocol.collectionSteps : protocol.evaluationSteps,
      onProgress,
      ...extra,
    });
  const collected = [];
  // Repeated learning uses fresh collection layouts; evaluation layouts remain disjoint.
  for (const seed of protocol.training) collected.push(await run('collect', seed + collectionSeed - 51027));
  const collection = summarizeEpisodes(collected);
  await onProgress({ app, variant, phase: 'training' });
  const candidates = [];
  for (let agent = 0; agent < 2; agent++)
    candidates.push(await client.call('train', { app, variant, agent }));
  const old = [],
    next = [];
  for (const seed of protocol.selection) {
    const before = await run('selection', seed);
    old.push(before);
    next.push(
      await run('selection', seed, {
        candidates: candidates.map((c) => c.candidateHash),
        replayForaging: chain ? { environment: before.environmentInput, statuses: before.inputEvents } : null,
      }),
    );
  }
  const before = summarizeEpisodes(old),
    after = summarizeEpisodes(next),
    adoption = [];
  for (let agent = 0; agent < 2; agent++) {
    if (!foragingSafetyGate(before, after, agent)) {
      adoption.push({ adopted: false, reason: 'Food collection or hazard exposure regressed' });
      continue;
    }
    adoption.push(
      await client.call('adopt', {
        candidateHash: candidates[agent].candidateHash,
        evaluation: {
          before: before.mean[agent],
          after: after.mean[agent],
          metric: 'mean observed foraging action reward across six paired TX worlds',
          evaluationDecisionIds: [...before.ids[agent], ...after.ids[agent]],
        },
      }),
    );
  }
  const evaluated = [];
  for (const seed of protocol.test) evaluated.push(await run('test', seed));
  return {
    app,
    variant,
    protocol,
    collection,
    candidates,
    before,
    after,
    adoption,
    test: summarizeEpisodes(evaluated),
  };
}
