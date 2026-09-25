import { validateAquaPolicy, defaultAquaPolicy } from '../../training/browser/aqua-learning.js';
// Aqua — © Degensoft Ltd 2025. Local experimental integration.
// A measured topology with artificial dynamics; no brain-region or performance claim.
import { runCircuitTrial } from './circuit.js';
export const AQUA_MODEL = 'aqua-malecns-learned-risk-v2';
export function decideAqua(graph, stimulus, agentId, policy = defaultAquaPolicy()) {
  validateAquaPolicy(policy);
  if (!Number.isInteger(stimulus) || stimulus < 0 || stimulus > 10000 || ![1, 2, 3].includes(agentId))
    throw new Error('Invalid Aqua input');
  const sensitivity = [0.7, 1, 1.3][agentId - 1];
  const drive = Math.min(1, (stimulus / 10000) * sensitivity);
  const trial = runCircuitTrial(graph, drive);
  const control = runCircuitTrial(graph, drive, 32, true);
  const rawResponse = trial.final.response;
  const response = rawResponse * policy.gain;
  const action = rawResponse >= 0.1 || response >= 0.1 ? 'dock' : response >= 0.045 ? 'cautious' : 'ship';
  return {
    model: AQUA_MODEL,
    sensitivity,
    stimulus,
    drive,
    rawResponse,
    policyVersion: policy.version,
    response,
    action,
    spreadBps: action === 'dock' ? 0 : Math.round(30 + response * 4000),
    virtualAmount: action === 'dock' ? '0' : action === 'cautious' ? '40' : '100',
    trial,
    control,
  };
}
