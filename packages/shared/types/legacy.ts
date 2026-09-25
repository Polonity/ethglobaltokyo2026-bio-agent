import { inputLevel, uint, unit } from './primitives.ts';
import type { ForagingAction, ForagingConditions, ForagingMode } from './foraging.ts';
import type { BodyState } from './core.ts';
/** Explicit migration helpers only. Existing GUI is not switched to the v1 runtime. */
export function legacyConditions(status: {
  activity: number;
  energy: number;
  stimulus: number;
  revision: string;
}): { conditions: ForagingConditions; statusRevision: ReturnType<typeof uint> } {
  const modes: ForagingMode[] = ['rest', 'explore', 'forage'];
  if (!Number.isInteger(status.activity) || !modes[status.activity]) throw new Error('Invalid activity');
  const revision = uint(status.revision);
  if (BigInt(revision) < 1n || BigInt(revision) > (1n << 64n) - 1n)
    throw new Error('Invalid status revision');
  return {
    conditions: {
      mode: modes[status.activity]!,
      energySupply: inputLevel(status.energy),
      stimulusIntensity: inputLevel(status.stimulus),
    },
    statusRevision: revision,
  };
}
export function legacyBody(energy: number): BodyState {
  return { kind: 'legacy-energy-only', activityEnergy: unit(energy) };
}
export function legacyAction(action: number): ForagingAction {
  if (!Number.isInteger(action) || action < 0 || action > 8) throw new Error('Invalid action');
  return action === 8
    ? { kind: 'rest' }
    : { kind: 'move', direction: action as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 };
}
