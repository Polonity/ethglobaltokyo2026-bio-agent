import { random, createWorld, observe, transition, DIRECTIONS } from '../browser/arena.js';
import { MALE_CNS } from '../connectome/male-cns.js';

// Opt-in research readout. The production Q learner and circuit stay unchanged.
export const FORAGER_MODEL = 'adaptive-forager-readout-v1';
export const initialPolicy = () => ({ weights: [0, 0, 0], encoder: 'malecns' });
export function validatePolicy(policy) {
  if (
    !policy ||
    !['malecns', 'raw'].includes(policy.encoder) ||
    !Array.isArray(policy.weights) ||
    policy.weights.length !== 3 ||
    policy.weights.some((x) => !Number.isFinite(x) || Math.abs(x) > 4)
  )
    throw Error('Invalid adaptive forager policy');
}
export function rawChannels(ob, world) {
  return DIRECTIONS.map((_, a) =>
    a === 8
      ? Math.min(
          1,
          Math.max(ob.body.satiety, (1 - ob.body.activityEnergy) * 0.7, world.mode === 'rest' ? 1 : 0),
        )
      : Math.max(
          0,
          Math.min(
            1,
            (0.5 + 0.5 * Math.cos(((a - ob.direction) * Math.PI) / 4)) *
              (1 - ob.body.satiety * 0.75) *
              (ob.mask & (1 << a) ? 0.05 : 1) *
              (world.mode === 'rest' ? 0.05 : 1) *
              (1 - world.stimulus * 0.15),
          ),
        ),
  );
}
export function decide(policy, actor, world, { guard = true, rule = false } = {}) {
  const ob = observe(actor, world);
  if (actor.energy < 0.08) return 8;
  const features = policy.encoder === 'raw' ? rawChannels(ob, world) : ob.neural;
  let allowed = Array.from({ length: 9 }, (_, i) => i);
  if (guard) {
    const safe = allowed.filter((a) => a < 8 && !(ob.mask & (1 << a)));
    // Inside an obstacle, permit escape instead of resting indefinitely.
    if (safe.length) allowed = [...safe, 8];
  }
  if (rule && actor.energy < 0.15) return 8;
  const [restBias, fatigueGain, persistence] = policy.weights;
  const scores = features.map(
    (x, a) =>
      x * 0.3 -
      (a === 8 ? 0.035 : 0) +
      (a === 8
        ? restBias + fatigueGain * (1 - actor.energy)
        : persistence * Math.cos((a * Math.PI) / 4 - (actor.heading || 0))),
  );
  const ranked = rule
    ? scores.map((_, a) =>
        a === 8
          ? -2
          : Math.cos(((a - ob.direction) * Math.PI) / 4) +
            0.02 * Math.cos((a * Math.PI) / 4 - (actor.heading || 0)),
      )
    : scores;
  return allowed.reduce((best, a) => (ranked[a] > ranked[best] ? a : best));
}
export function makeEpisode(seed, profile = {}) {
  const rng = random(seed),
    world = { ...createWorld(rng), ...profile };
  const actor = {
    x: 3 + rng() * 30,
    y: 3 + rng() * 16,
    heading: rng() * Math.PI * 2,
    energy: 0.7,
    satiety: 0.4,
    reserves: 0.5,
    massRatio: 1,
  };
  return { rng, world, actor, ticks: 0, metrics: { reward: 0, food: 0, contacts: 0, rests: 0 } };
}
export function advanceEpisode(episode, policy, options) {
  const action = decide(policy, episode.actor, episode.world, options);
  const result = transition(episode.actor, episode.world, action, episode.rng);
  episode.actor.heading = action < 8 ? (action * Math.PI) / 4 : episode.actor.heading;
  episode.ticks++;
  episode.metrics.reward += result.reward;
  episode.metrics.food += Number(result.collected);
  episode.metrics.contacts += Number(result.hit);
  episode.metrics.rests += Number(action === 8);
  return { action, reward: result.reward, hit: result.hit, collected: result.collected };
}
export function rollout(policy, seed, profile = {}, ticks = 300, options) {
  const episode = makeEpisode(seed, profile);
  for (let i = 0; i < ticks; i++) advanceEpisode(episode, policy, options);
  return {
    seed,
    ...episode.metrics,
    finalEnergy: episode.actor.energy,
    finalReserves: episode.actor.reserves,
  };
}
export const meanMetrics = (rows) =>
  Object.fromEntries(
    ['reward', 'food', 'contacts', 'rests', 'finalEnergy', 'finalReserves'].map((k) => [
      k,
      rows.reduce((s, r) => s + r[k], 0) / rows.length,
    ]),
  );
function validateScenarios(seeds, profiles, ticks) {
  if (
    !Array.isArray(seeds) ||
    !seeds.length ||
    seeds.length > 256 ||
    !Number.isSafeInteger(ticks) ||
    ticks < 1 ||
    ticks > 2000 ||
    !Array.isArray(profiles) ||
    !profiles.length ||
    profiles.length > 8
  )
    throw Error('Bounded scenarios, profiles and ticks required');
  for (const p of profiles) {
    if (
      typeof p.name !== 'string' ||
      !p.name ||
      !['energy', 'stimulus'].every((k) => Number.isFinite(p[k]) && p[k] >= 0 && p[k] <= 1) ||
      (p.mode !== undefined && !['rest', 'explore', 'forage'].includes(p.mode)) ||
      Object.keys(p).some((k) => !['name', 'energy', 'stimulus', 'mode', 'hazards'].includes(k)) ||
      (p.hazards !== undefined &&
        (!Array.isArray(p.hazards) ||
          p.hazards.length > 16 ||
          p.hazards.some((h) => ![h.x, h.y, h.radius].every(Number.isFinite) || h.radius <= 0)))
    )
      throw Error('Invalid foraging profile');
  }
}
export function evaluatePolicy(policy, seeds, profiles, ticks = 300, options) {
  validatePolicy(policy);
  validateScenarios(seeds, profiles, ticks);
  return profiles.map((profile) => {
    const episodes = seeds.map((seed) => rollout(policy, seed, profile, ticks, options));
    return { profile: profile.name, metrics: meanMetrics(episodes), episodes };
  });
}
// Reward-driven random search fits only the readout; it does not learn the connectome.
export function fitReadout(previous, { seed, seeds, profiles, ticks = 300, trials = 48 }) {
  validatePolicy(previous);
  validateScenarios(seeds, profiles, ticks);
  if (
    !Number.isSafeInteger(seed) ||
    seed < 0 ||
    seed > 0xffffffff ||
    !Number.isSafeInteger(trials) ||
    trials < 1 ||
    trials > 256
  )
    throw Error('Bounded search seed and trials required');
  const rng = random(seed),
    trace = [];
  const score = (policy) => {
    const profilesResult = evaluatePolicy(policy, seeds, profiles, ticks);
    return {
      reward: profilesResult.reduce((s, p) => s + p.metrics.reward, 0) / profiles.length,
      profiles: profilesResult.map((p) => ({ profile: p.profile, ...p.metrics })),
    };
  };
  let best = structuredClone(previous),
    bestScore = score(best);
  trace.push({ trial: 0, weights: best.weights, ...bestScore });
  for (let trial = 1; trial <= trials; trial++) {
    const candidate = { encoder: previous.encoder, weights: [-0.6 + rng() * 0.8, rng() * 0.5, rng() * 0.06] };
    const result = score(candidate);
    trace.push({ trial, weights: candidate.weights, ...result });
    if (result.reward > bestScore.reward) {
      best = candidate;
      bestScore = result;
    }
  }
  return {
    policy: best,
    training: { seed, seeds, ticks, trials, trace, method: 'reward-driven-random-search' },
  };
}
export const foragerBinding = (encoder) => ({
  task: 'foraging',
  model: MALE_CNS.graphSha256,
  encoder: encoder === 'raw' ? 'raw-forage-drives-v1' : 'malecns-forage-channels-v1',
  dynamics: 'arena-transition-v3',
  readout: FORAGER_MODEL,
  actionSpace: '8-directions-rest-v1',
});
