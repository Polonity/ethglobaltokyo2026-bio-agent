import type { BiologicalOrigin, BodyState, Checkpoint } from '../types/core.ts';
import type { ForagingAction } from '../types/foraging.ts';
import type { MarketAction, PortfolioValuation, PaperMode } from '../types/market.ts';
import { unit, milliseconds } from '../types/primitives.ts';
// These errors must remain errors. tsc fails if an @ts-expect-error becomes unused.
// @ts-expect-error trading is not a foraging action
const wrongForaging: ForagingAction = { kind: 'buy' };
// @ts-expect-error movement is not a market action
const wrongMarket: MarketAction = { kind: 'move', direction: 0 };
// @ts-expect-error graph origin requires dataset/extraction/graph provenance
const incompleteOrigin: BiologicalOrigin = { kind: 'connectome-derived', assumptions: [] };
const missingValue: PortfolioValuation = {
  kind: 'unavailable',
  reason: 'missing-quote',
  asOfMs: milliseconds(0),
  // @ts-expect-error an unavailable valuation cannot advertise a PnL
  netPnl: 0,
};
// @ts-expect-error no real-money mode in the paper application
const realMoney: PaperMode = 'live-trading';
// @ts-expect-error unmodeled fullness must not be fabricated
const fakeBody: BodyState = { kind: 'legacy-energy-only', activityEnergy: unit(0.5), satiety: unit(0) };
// @ts-expect-error UI position alone is not a checkpoint
const incompleteCheckpoint: Checkpoint = { position: { x: 1, y: 1 } };
void [wrongForaging, wrongMarket, incompleteOrigin, missingValue, realMoney, fakeBody, incompleteCheckpoint];
