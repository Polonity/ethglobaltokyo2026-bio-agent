import type {
  ArtifactRef,
  BodyState,
  ChainLogRef,
  InputEnvelope,
  RuntimeView,
  Transition,
  IBioAgentRuntimeV1,
} from './core.ts';
import type { Address, Int, Milliseconds, UInt, UnitInterval } from './primitives.ts';
export interface TokenRef {
  chainId: UInt;
  address: Address;
  /** Must be verified against the configured asset; integer 0..255. */
  decimals: number;
}
export interface TokenAmount {
  token: TokenRef;
  atoms: UInt;
}
export interface SignedTokenAmount {
  token: TokenRef;
  atoms: Int;
}
export interface PoolRef {
  chainId: UInt;
  address: Address;
  token0: TokenRef;
  token1: TokenRef;
  feePips: UInt;
  verification: 'configured-only' | 'factory-verified';
}
export interface SwapPrice {
  kind: 'v3-pool-price';
  pool: PoolRef;
  sqrtPriceX96: UInt;
  liquidity: UInt;
  tick: number;
  orientation: 'token1-per-token0';
}
export interface ExecutableQuote {
  kind: 'exact-input-quote';
  quoteId: string;
  amountIn: TokenAmount;
  amountOut: TokenAmount;
  observedAtMs: Milliseconds;
  expiresAtMs: Milliseconds;
  evidence: ArtifactRef;
  /** LP fee/impact are included in output; do not deduct again. */
  outputIncludesPoolFeesAndImpact: true;
}
export type MarketInput =
  | InputEnvelope<
      SwapPrice,
      { kind: 'chain-log'; log: ChainLogRef; confirmations: UInt },
      'bioagent.market.swap.v1'
    >
  | InputEnvelope<
      ExecutableQuote,
      { kind: 'api'; endpoint: string; requestId: string; response: ArtifactRef },
      'bioagent.market.quote.v1'
    >
  | InputEnvelope<
      SwapPrice | ExecutableQuote,
      { kind: 'fixture'; fixtureId: string; record: ArtifactRef },
      'bioagent.market.fixture.v1'
    >;
export type MarketRef =
  | { kind: 'pool'; pool: PoolRef }
  | { kind: 'quote-pair'; tokenIn: TokenRef; tokenOut: TokenRef; fixedAmountIn: UInt };
export interface MarketObservation {
  market: MarketRef;
  price: SwapPrice | ExecutableQuote;
  change: { kind: 'baseline' } | { kind: 'change'; deltaBps: Int };
  attention: UnitInterval;
  body: BodyState;
  holdings: TokenAmount[];
  cash: TokenAmount;
}
export type MarketAction =
  | { kind: 'hold' }
  | { kind: 'skip'; reason: 'insufficient-data' | 'policy-choice' }
  | { kind: 'buy'; spend: TokenAmount; receiveToken: TokenRef }
  | { kind: 'sell'; spend: TokenAmount; receiveToken: TokenRef };
/** All modes remain paper-only. Data mode does not grant signing/execution authority. */
export type PaperMode = 'paper-live-data' | 'paper-replay' | 'paper-fixture';
export interface PaperOrder {
  kind: 'paper-order';
  orderId: string;
  decisionTick: UInt;
  decidedAtMs: Milliseconds;
  earliestFillAtMs: Milliseconds;
  action: Extract<MarketAction, { kind: 'buy' | 'sell' }>;
}
export type PaperExecution =
  | { kind: 'no-order' }
  | { kind: 'pending'; order: PaperOrder }
  | {
      kind: 'rejected';
      order: PaperOrder;
      reason: 'stale-quote' | 'insufficient-funds' | 'no-route' | 'risk-limit';
    }
  | {
      kind: 'filled';
      order: PaperOrder;
      fillId: string;
      filledAtMs: Milliseconds;
      quote: ExecutableQuote;
      /** Extra costs only. All denominated in account's valuation token. */
      additionalCosts: { gas: TokenAmount; extraSlippage: TokenAmount };
      executionModel: ArtifactRef;
    };
/** A paper fill has no transactionHash. Source logs live on input provenance separately. */
export type PortfolioValuation =
  | { kind: 'unavailable'; reason: 'missing-quote' | 'stale-quote'; asOfMs: Milliseconds }
  | {
      kind: 'valued';
      asOfMs: Milliseconds;
      initialEquity: TokenAmount;
      equity: TokenAmount;
      netPnl: SignedTokenAmount;
      realizedPnl: SignedTokenAmount;
      unrealizedPnl: SignedTokenAmount;
      liquidationQuoteIds: string[];
      costModel: ArtifactRef;
    };
export interface MarketState {
  mode: PaperMode;
  cash: TokenAmount;
  holdings: TokenAmount[];
  valuation: PortfolioValuation;
}
export interface MarketOutcome {
  execution: PaperExecution;
  valuation: PortfolioValuation;
  /** Reward needs an explicit mapping from portfolio outcome, not attention. */
  reward: { kind: 'unavailable' } | { kind: 'paper-reward'; value: number; mapping: ArtifactRef };
}
export type MarketView = RuntimeView<MarketState>;
export type MarketTransition = Transition<'market-paper.v1', MarketObservation, MarketAction, MarketOutcome>;

export type MarketRuntime = IBioAgentRuntimeV1<MarketInput, MarketView, MarketTransition>;
