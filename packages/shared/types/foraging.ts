import type {
  BodyState,
  InputEnvelope,
  RuntimeView,
  Transition,
  SourceRef,
  IBioAgentRuntimeV1,
} from './core.ts';
import type { InputLevel, UInt } from './primitives.ts';
export type ForagingMode = 'rest' | 'explore' | 'forage';
/** External input configuration. Never substitute for actual body state. */
export interface ForagingConditions {
  mode: ForagingMode;
  energySupply: InputLevel;
  stimulusIntensity: InputLevel;
}
export type ForagingInput = InputEnvelope<
  | { kind: 'conditions'; conditions: ForagingConditions; statusRevision: UInt | null }
  | { kind: 'food-contact'; foodId: string; nutritionUnits: number }
  | { kind: 'hazard-contact'; hazardId: string; severity: InputLevel },
  SourceRef,
  'bioagent.foraging.input.v1'
>;
/** Distances and position are arena units; bearings are discrete octants. */
export type Octant = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export interface ForagingObservation {
  conditions: ForagingConditions;
  target: { foodId: string; direction: Octant; distanceArenaUnits: number } | null;
  dangerousDirections: Octant[];
  body: BodyState;
}
export type ForagingAction = { kind: 'move'; direction: Octant } | { kind: 'rest' };
/** Feeding is currently an environment effect, not a separately learned action. */
export interface ForagingOutcome {
  position: { x: number; y: number };
  collectedFoodIds: string[];
  hitHazardIds: string[];
  reward: { kind: 'foraging-score'; value: number };
}
export interface ForagingState {
  position: { x: number; y: number };
  score: number;
  collectedCount: UInt;
  collisionCount: UInt;
}
export type ForagingView = RuntimeView<ForagingState>;
export type ForagingTransition = Transition<
  'foraging.v1',
  ForagingObservation,
  ForagingAction,
  ForagingOutcome
>;

export type ForagingRuntime = IBioAgentRuntimeV1<ForagingInput, ForagingView, ForagingTransition>;
