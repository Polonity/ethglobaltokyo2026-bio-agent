import type { Address, Bytes32, Milliseconds, UInt, UnitInterval } from './primitives.ts';

export type AgentRef =
  | { kind: 'evm'; chainId: UInt; registry: Address; agentId: UInt }
  | { kind: 'local'; sessionId: string; agentId: string };
export interface ArtifactRef {
  digest: { algorithm: 'sha256' | 'keccak256'; value: Bytes32 };
  /** Locator is not a guarantee of availability. Digest covers exact artifact bytes. */
  uri: string;
}
export type BiologicalOrigin =
  | { kind: 'synthetic-demo'; description: string }
  | { kind: 'bio-inspired'; references: string[]; assumptions: string[] }
  | {
      kind: 'connectome-derived';
      dataset: { release: string; source: ArtifactRef; license: string; attribution: string };
      extraction: ArtifactRef;
      graph: ArtifactRef;
      assumptions: string[];
    };
export interface ModelDescriptor {
  schema: 'bioagent.descriptor.v1';
  origin: BiologicalOrigin;
  dynamics: ArtifactRef;
  sensoryMapping: ArtifactRef;
  motorMapping: ArtifactRef;
  bodyModel: ArtifactRef | null;
  plasticity:
    | { kind: 'frozen' }
    | { kind: 'adaptive'; algorithm: ArtifactRef; mutableComponents: string[]; frozenComponents: string[] };
  validationClaims: { scope: string; evidence: ArtifactRef; claimant: string }[];
}
export interface ChainLogRef {
  chainId: UInt;
  emitter: Address;
  blockNumber: UInt;
  blockHash: Bytes32;
  transactionHash: Bytes32;
  transactionIndex: UInt;
  logIndex: UInt;
}
export type SourceRef =
  | { kind: 'chain-log'; log: ChainLogRef; confirmations: UInt }
  | { kind: 'simulation'; episodeId: string; tick: UInt; eventId: string }
  | { kind: 'api'; endpoint: string; requestId: string; response: ArtifactRef }
  | { kind: 'fixture'; fixtureId: string; record: ArtifactRef };
export interface InputEnvelope<
  Payload,
  Source extends SourceRef = SourceRef,
  Schema extends string = string,
> {
  schema: Schema;
  inputId: string;
  source: Source;
  sourceTimeMs: Milliseconds;
  receivedAtMs: Milliseconds;
  payload: Payload;
}
/** Simulated body variables; not calibrated biological measurements. */
export type BodyState =
  | { kind: 'unmodeled' }
  | { kind: 'legacy-energy-only'; activityEnergy: UnitInterval }
  | {
      kind: 'embodied';
      model: ArtifactRef;
      activityEnergy: UnitInterval;
      satiety: UnitInterval;
      reserves: UnitInterval;
      /** Relative to model's declared reference body mass; finite and >0 at runtime. */
      massRatio: number;
    };
export interface Clock {
  tick: UInt;
  simulationTimeMs: Milliseconds;
  dtMs: Milliseconds;
  wallTimeMs: Milliseconds;
  pausePolicy: 'freeze' | 'bounded-catch-up';
}
export type InputHealth =
  | { kind: 'waiting' }
  | { kind: 'confirming'; inputId: string; current: UInt; required: UInt }
  | { kind: 'fresh'; inputId: string; sourceTimeMs: Milliseconds }
  | { kind: 'stale'; inputId: string; sourceTimeMs: Milliseconds }
  | { kind: 'replaying'; checkpoint: ArtifactRef }
  | { kind: 'error'; code: string; message: string };
export type Lifecycle = 'running' | 'paused' | 'training' | 'evaluating' | 'finished';
export interface RuntimeView<State> {
  schema: 'bioagent.view.v1';
  agent: AgentRef;
  episodeId: string;
  branchId: string;
  clock: Clock;
  lifecycle: Lifecycle;
  inputHealth: InputHealth;
  body: BodyState;
  applicationState: State;
}
/** A UI view is NOT a resumable checkpoint. All replay dependencies are explicit here. */
export interface Checkpoint {
  schema: 'bioagent.checkpoint.v1';
  agent: AgentRef;
  episodeId: string;
  branchId: string;
  tick: UInt;
  descriptor: ArtifactRef;
  lineage: { kind: 'genesis' } | { kind: 'continue' | 'fork' | 'restore'; parent: ArtifactRef };
  state: {
    body: ArtifactRef;
    neural: ArtifactRef;
    policy: ArtifactRef;
    optimizer: ArtifactRef;
    experience: ArtifactRef;
    prng: ArtifactRef;
    environment: ArtifactRef;
    inputCursor: ArtifactRef;
  };
}
export interface EvaluationEvidence {
  protocol: ArtifactRef;
  inputTape: ArtifactRef;
  initialCheckpoint: ArtifactRef;
  trainingSet: ArtifactRef;
  selectionSet: ArtifactRef;
  heldOutSet: ArtifactRef;
  frozenBaseline: ArtifactRef;
  report: ArtifactRef;
}
export type LearningRecord =
  | { kind: 'none' }
  | { kind: 'candidate'; parentPolicy: ArtifactRef; candidatePolicy: ArtifactRef; experience: ArtifactRef }
  | {
      kind: 'adopted' | 'rejected';
      parentPolicy: ArtifactRef;
      candidatePolicy: ArtifactRef;
      evaluation: EvaluationEvidence;
    };
export interface Transition<Profile extends string, Observation, Action, Outcome> {
  schema: 'bioagent.transition.v1';
  profile: Profile;
  agent: AgentRef;
  episodeId: string;
  branchId: string;
  tick: UInt;
  descriptor: ArtifactRef;
  before: ArtifactRef;
  consumedInputs: { inputId: string; source: SourceRef; payload: ArtifactRef }[];
  observation: Observation;
  /** Exact encoded channels/features actually passed to the model. */
  encodedObservation: ArtifactRef;
  decision: Action;
  outcome: Outcome;
  after: ArtifactRef;
  learning: LearningRecord;
}

/** Proposed runtime boundary, distinct from Solidity IBioAgent. Not yet implemented. */
export type InputAcceptance =
  | { kind: 'accepted' | 'duplicate'; inputId: string }
  | {
      kind: 'rejected';
      inputId: string;
      reason: 'wrong-source' | 'wrong-schema' | 'stale' | 'out-of-order' | 'invalid-payload';
    };
export interface IBioAgentRuntimeV1<Input, View, Record> {
  observe(input: Input): InputAcceptance;
  /** Scheduler supplies explicit time; runtime must not silently catch up on wall time. */
  advance(clock: Clock): { view: View; transitions: Record[] };
  /** Produces a complete artifact. UI snapshots must never implement this by assertion. */
  checkpoint(): Promise<ArtifactRef>;
  restore(checkpoint: ArtifactRef): Promise<void>;
}
