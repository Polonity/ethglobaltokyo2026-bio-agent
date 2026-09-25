// Deliberately synthetic physiology. Rates are per 0.2 s tick, not biological measurements.
export const BODY_MODEL = 'synthetic-metabolism-v1';
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export function ensureBody(actor) {
  actor.satiety ??= 0.4;
  actor.reserves ??= 0.5;
  actor.massRatio ??= 1;
}
export function bodyStep(actor, { fed = false, resting = false } = {}) {
  ensureBody(actor);
  const digested = Math.min(actor.satiety, 0.008);
  actor.satiety = clamp(actor.satiety - digested + (fed ? 0.3 : 0));
  actor.reserves = clamp(actor.reserves + digested * 0.35 - (resting ? 0.0015 : 0.003));
  const targetMass = 0.7 + actor.reserves * 0.6;
  actor.massRatio = clamp(actor.massRatio + (targetMass - actor.massRatio) * 0.018, 0.7, 1.3);
}
export function bodyObservation(actor) {
  ensureBody(actor);
  return {
    activityEnergy: actor.energy,
    satiety: actor.satiety,
    reserves: actor.reserves,
    massRatio: actor.massRatio,
  };
}
