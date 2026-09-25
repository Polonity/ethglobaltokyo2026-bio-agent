// Small bounded learners shared by browser/Worker runtimes; topology is never modified.
export const LEARNING_SCHEMA = 'bioagent.learning-result.v1';
export function learningReport({
  useCase,
  version,
  before,
  after,
  samples,
  updates,
  adopted,
  model,
  metric,
}) {
  if (![before, after].every(Number.isFinite)) throw Error('Non-finite evaluation');
  return {
    schema: LEARNING_SCHEMA,
    useCase,
    model,
    baseVersion: version,
    version: version + (adopted ? 1 : 0),
    before,
    after,
    samples,
    updates,
    adopted,
    metric,
    applies: 'next-decision',
    changed: 'action-readout-only',
    topology: 'frozen MaleCNS v1.0',
  };
}
// One bounded slice per simulation tick; no fixed wall-clock wait after computation.
export const FORAGE_UPDATES = 960;
export const FORAGE_BATCH = 96;
export const MARKET_BATCH = 256;
export function fitGain(samples, previous = 1) {
  if (samples.length < 20 || samples.some((s) => ![s.x, s.y].every(Number.isFinite)))
    throw Error('Invalid calibration samples');
  const split = Math.floor(samples.length * 0.75),
    train = samples.slice(0, split),
    selection = samples.slice(split);
  const xx = train.reduce((a, s) => a + s.x * s.x, 0),
    xy = train.reduce((a, s) => a + s.x * s.y, 0);
  const candidate = Math.max(0.5, Math.min(2, xy / (xx + 1e-9)));
  const loss = (g) => selection.reduce((a, s) => a + (g * s.x - s.y) ** 2, 0) / selection.length;
  const before = loss(previous),
    after = loss(candidate),
    adopted = after < before - 1e-10;
  return {
    gain: adopted ? candidate : previous,
    before,
    after,
    adopted,
    trainingSamples: train.length,
    selectionSamples: selection.length,
    updates: train.length,
  };
}
