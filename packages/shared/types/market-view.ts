import type { AgentRef, ArtifactRef } from './core.ts';
import type { MarketView, TokenRef } from './market.ts';
import { int, milliseconds, uint, unit } from './primitives.ts';
interface PaperProjection {
  valuationQuoteId?: string;
  id: number;
  state: string;
  energy: number;
  satiety: number;
  reserves: number;
  massRatio: number;
  cash: bigint;
  units: bigint;
  equity: bigint;
  pnl: bigint;
  realized: bigint;
}
export function marketView(
  f: PaperProjection,
  agent: AgentRef,
  token0: TokenRef,
  token1: TokenRef,
  model: ArtifactRef,
  tick: number,
  sourceTime: number,
  available: boolean,
  now: number,
  costModel: ArtifactRef,
): MarketView {
  const amount = (atoms: bigint) => ({ token: token1, atoms: uint(atoms.toString()) });
  const signed = (atoms: bigint) => ({ token: token1, atoms: int(atoms.toString()) });
  return {
    schema: 'bioagent.view.v1',
    agent,
    episodeId: 'market-round',
    branchId: 'main',
    clock: {
      tick: uint(String(tick)),
      simulationTimeMs: milliseconds(tick * 200),
      dtMs: milliseconds(200),
      wallTimeMs: milliseconds(now),
      pausePolicy: 'freeze',
    },
    lifecycle: f.state === 'learning' ? 'training' : 'running',
    inputHealth: available
      ? { kind: 'fresh', inputId: `swap-${tick}`, sourceTimeMs: milliseconds(sourceTime) }
      : { kind: 'waiting' },
    body: {
      kind: 'embodied',
      model,
      activityEnergy: unit(f.energy),
      satiety: unit(f.satiety),
      reserves: unit(f.reserves),
      massRatio: f.massRatio,
    },
    applicationState: {
      mode: 'paper-live-data',
      cash: amount(f.cash),
      holdings: [{ token: token0, atoms: uint(f.units.toString()) }],
      valuation: available
        ? {
            kind: 'valued',
            asOfMs: milliseconds(sourceTime),
            initialEquity: amount(100n * 10n ** 18n),
            equity: amount(f.equity),
            netPnl: signed(f.pnl),
            realizedPnl: signed(f.realized),
            unrealizedPnl: signed(f.pnl - f.realized),
            liquidationQuoteIds: f.valuationQuoteId ? [f.valuationQuoteId] : [],
            costModel,
          }
        : { kind: 'unavailable', reason: 'missing-quote', asOfMs: milliseconds(now) },
    },
  };
}
