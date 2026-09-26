// Separate layouts for experience collection, policy selection and final evaluation.
export const FORAGING_PROTOCOL = Object.freeze({
  training: Array.from({ length: 12 }, (_, i) => 610001 + i * 137),
  selection: Array.from({ length: 6 }, (_, i) => 720001 + i * 139),
  test: Array.from({ length: 12 }, (_, i) => 830001 + i * 149),
  collectionSteps: 64,
  evaluationSteps: 80,
});
export function summarizeEpisodes(episodes) {
  if (!episodes.length) throw Error('Episodes required');
  const steps = episodes.reduce((s, e) => s + e.steps, 0);
  const rewards = [0, 1].map((i) => episodes.reduce((s, e) => s + e.rewards[i], 0));
  return {
    ...episodes.at(-1),
    steps,
    rewards,
    mean: rewards.map((r) => r / steps),
    ids: [0, 1].map((i) => episodes.flatMap((e) => e.ids[i])),
    neuralMs: episodes.reduce((s, e) => s + e.neuralMs, 0),
    behavior: [0, 1].map((i) =>
      Object.fromEntries(
        Object.keys(episodes[0].behavior[i]).map((k) => [
          k,
          episodes.reduce((s, e) => s + e.behavior[i][k], 0),
        ]),
      ),
    ),
    episodes,
  };
}
export function foragingSafetyGate(before, after, agent) {
  const a = before.behavior[agent],
    b = after.behavior[agent];
  return b.collected >= a.collected && b.hazardSteps <= a.hazardSteps;
}
