/** Compile-time examples only. All IDs, hashes and artifacts here are synthetic fixtures. */
import { address, bytes32, inputLevel, int, milliseconds, uint, unit } from '../types/primitives.ts';
import type { AgentRef, ArtifactRef, BodyState, Clock, ModelDescriptor } from '../types/core.ts';
import type { ForagingInput, ForagingTransition } from '../types/foraging.ts';
import type { MarketInput, MarketTransition, TokenRef } from '../types/market.ts';
const hash = bytes32(`0x${'11'.repeat(32)}`);
const account = address(`0x${'22'.repeat(20)}`);
export const artifact: ArtifactRef = {
  digest: { algorithm: 'sha256', value: hash },
  uri: 'fixture://not-a-real-artifact',
};
export const agent: AgentRef = { kind: 'local', sessionId: 'type-example', agentId: 'momo' };
export const body: BodyState = {
  kind: 'embodied',
  model: artifact,
  activityEnergy: unit(0.6),
  satiety: unit(0.2),
  reserves: unit(0.5),
  massRatio: 1,
};
export const clock: Clock = {
  tick: uint('1'),
  simulationTimeMs: milliseconds(200),
  dtMs: milliseconds(200),
  wallTimeMs: milliseconds(1000),
  pausePolicy: 'freeze',
};
export const descriptor: ModelDescriptor = {
  schema: 'bioagent.descriptor.v1',
  origin: { kind: 'synthetic-demo', description: 'Type example, no biological dataset' },
  dynamics: artifact,
  sensoryMapping: artifact,
  motorMapping: artifact,
  bodyModel: artifact,
  plasticity: { kind: 'frozen' },
  validationClaims: [],
};
export const foragingInput = {
  schema: 'bioagent.foraging.input.v1',
  inputId: 'food-1',
  source: { kind: 'simulation', episodeId: 'round-1', tick: uint('1'), eventId: 'food-1' },
  sourceTimeMs: milliseconds(200),
  receivedAtMs: milliseconds(1000),
  payload: { kind: 'food-contact', foodId: 'nectar-1', nutritionUnits: 1 },
} satisfies ForagingInput;
const common = {
  schema: 'bioagent.transition.v1' as const,
  agent,
  episodeId: 'round-1',
  branchId: 'main',
  tick: uint('1'),
  descriptor: artifact,
  encodedObservation: artifact,
  before: artifact,
  after: artifact,
  learning: { kind: 'none' as const },
};
export const foragingTransition = {
  ...common,
  profile: 'foraging.v1',
  consumedInputs: [{ inputId: foragingInput.inputId, source: foragingInput.source, payload: artifact }],
  observation: {
    conditions: { mode: 'forage', energySupply: inputLevel(5000), stimulusIntensity: inputLevel(7000) },
    target: { foodId: 'nectar-1', direction: 0, distanceArenaUnits: 1 },
    dangerousDirections: [4],
    body,
  },
  decision: { kind: 'move', direction: 0 },
  outcome: {
    position: { x: 2, y: 1 },
    collectedFoodIds: ['nectar-1'],
    hitHazardIds: [],
    reward: { kind: 'foraging-score', value: 5 },
  },
} satisfies ForagingTransition;
const token0: TokenRef = { chainId: uint('31337'), address: account, decimals: 18 };
const token1: TokenRef = { chainId: uint('31337'), address: address(`0x${'33'.repeat(20)}`), decimals: 6 };
const pool = {
  chainId: uint('31337'),
  address: address(`0x${'44'.repeat(20)}`),
  token0,
  token1,
  feePips: uint('3000'),
  verification: 'configured-only' as const,
};
export const marketInput = {
  schema: 'bioagent.market.fixture.v1',
  inputId: 'price-1',
  source: { kind: 'fixture', fixtureId: 'sqrt-price', record: artifact },
  sourceTimeMs: milliseconds(1000),
  receivedAtMs: milliseconds(1000),
  payload: {
    kind: 'v3-pool-price',
    pool,
    sqrtPriceX96: uint('79228162514264337593543950336'),
    liquidity: uint('1000000'),
    tick: 0,
    orientation: 'token1-per-token0',
  },
} satisfies MarketInput;
export const marketTransition = {
  ...common,
  profile: 'market-paper.v1',
  consumedInputs: [{ inputId: marketInput.inputId, source: marketInput.source, payload: artifact }],
  observation: {
    market: { kind: 'pool', pool },
    price: marketInput.payload,
    change: { kind: 'change', deltaBps: int('100') },
    attention: unit(0.9),
    body,
    holdings: [],
    cash: { token: token1, atoms: uint('1000000000') },
  },
  // High attention may still produce no trade.
  decision: { kind: 'hold' },
  outcome: {
    execution: { kind: 'no-order' },
    valuation: { kind: 'unavailable', reason: 'missing-quote', asOfMs: milliseconds(1000) },
    reward: { kind: 'unavailable' },
  },
} satisfies MarketTransition;
