// Powered by Aqua — © Degensoft Ltd 2025. Synthetic curriculum, not market profitability.
import { neuralSignal, MALE_CNS } from '../../bio_agent/connectome/male-cns.js';
import { fitGain, learningReport } from './learning.js';
export const defaultAquaPolicy = () => ({
  schema: 'bioagent.aqua-policy.v1',
  model: MALE_CNS.graphSha256,
  version: 1,
  gain: 1,
  report: null,
});
export function validateAquaPolicy(p) {
  if (
    p?.schema !== 'bioagent.aqua-policy.v1' ||
    p.model !== MALE_CNS.graphSha256 ||
    !Number.isSafeInteger(p.version) ||
    p.version < 1 ||
    !Number.isFinite(p.gain) ||
    p.gain < 0.5 ||
    p.gain > 2
  )
    throw Error('Invalid MaleCNS Aqua policy');
  return p;
}
export function trainAquaPolicy(previous, agentId) {
  validateAquaPolicy(previous);
  if (![1, 2, 3].includes(agentId)) throw Error('Invalid agent');
  const gain = [0.7, 1, 1.3][agentId - 1];
  // Reproducible permuted risk inputs. Last 64 samples are selection-only.
  const samples = Array.from({ length: 256 }, (_, i) => {
    const risk = ((i * 73) % 256) / 255;
    return { x: neuralSignal(Math.min(1, risk * gain)).response, y: risk * 0.24 };
  });
  const fit = fitGain(samples, previous.gain);
  const report = learningReport({
    useCase: 'aqua',
    version: previous.version,
    before: fit.before,
    after: fit.after,
    samples: fit.trainingSamples,
    updates: fit.updates,
    adopted: fit.adopted,
    model: MALE_CNS.graphSha256,
    metric: 'synthetic risk-target selection MSE; not market returns',
  });
  return {
    schema: previous.schema,
    model: previous.model,
    version: report.version,
    gain: fit.gain,
    report: { ...report, selectionSamples: fit.selectionSamples, curriculum: 'risk-target-0.24-v1' },
  };
}
