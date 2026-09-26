# Paper Trading Arena — observing tokens and learning timing

Historical design, 2026-09-26. Local real-V3 paper trades/PnL/GUI were implemented in [Market Meadow](local-market-app.md); trending-token acquisition and other items below are proposals. See [initial Swap fixture](swap-event-game.md) and [common design](../standards/bioagent-design-direction.md). This mode has virtual accounts, with no real-fund orders, signing, approvals, or transfers.

## Experience and data

Display tokens as flowers. Agents attend, buy/hold/sell/skip, remain near held tokens, and show a learning indicator when reconsidering. Bubbles visualize implemented action/state, not measured emotions.

The proposed [Get tokens API](https://developers.uniswap.org/docs/api-reference/get_tokens) uses volume_24h or tvl by chain. Define trending operationally as high24h volume, not social popularity or future performance; detecting a rise requires historical ranks/volume. Collect fixed-quantity [quotes](https://developers.uniswap.org/docs/api-reference/aggregator_quote), preserving actual returned data and server-side keys.

```text
Token candidates + acquisition time → fixed-amount quotes with provenance
  → shared MarketSnapshot → sensory features → attention → policy
  → PaperBroker → virtual ledger / net PnL
  → observed outcomes → learning → evaluation
```

One collector should distribute identical snapshots to all agents, not independent tab-time inputs. Attention is not profit probability or a buy command. Existing UniswapPriceBioAgent is an observer mapped into foraging; a trading engine/broker requires separate financial observations, actions, and rewards.

## Initial round proposal

One chain,5–10 common candidates, three agents, equal virtual USDC, spot-only buy/hold/sell/skip, initially one position and discrete sizes. Match starting funds, costs, risk limits, and observation times. Candidate removal must not erase holdings; missing valuations remain unavailable. Continue marking holdings during learning.

## Paper execution

Decisions use only data available at time t. Fill after a common delay using a later quote matching direction and quantity; never backfill at a favorable earlier price. Missing/expired/no-route quotes reject execution. Buy USDC→token; sell and mark token→USDC. Do not scale small quotes linearly to large positions. Name/version the fill model because quotes do not guarantee real execution.

```text
Equity = virtual cash + liquidation quote value − unaccounted liquidation costs
Net PnL = equity − initial equity
```

Separate included pool fee/impact from extra gas/slippage deductions to avoid double counting. Record gas conversion and slippage assumptions. Display net ranking plus realized/unrealized PnL, drawdown, trades, costs, and freshness. Unvalued holdings mean pending valuation, not zero loss or a final rank.

## Learning and evaluation

Base reward is cost-adjusted equity change. Explicit risk penalties are distinct from displayed PnL. Do not reward only sales/win rate or exempt retained losses. Split chronological training, selection, and untouched evaluation periods; retain historical candidate lists to prevent hindsight bias. Store only transitions whose outcomes are observed.

Compare candidate and baseline on matched unseen inputs/costs, then another period, including a frozen nonlearning baseline. One profitable run does not demonstrate improvement.

## UI and chain evidence

Label PAPER/LIVE DATA, PAPER/REPLAY, or PAPER/FIXTURE. Accelerated historical playback shows replay time/rate; never imply accelerated live markets. States include waiting, observing, buy/sell decision, pending fill, holding, learning, unvalued, and complete.

Trade details show observation/quote sources, decision/fill times, quantities, costs, and policy version. Paper IDs are not Etherscan TXs. Optional wallet references remain distinct from PaperAccount balances; wallet creation/funding is not a prerequisite.

Future anchoring may record rules/model/results hashes, with only the actual anchor TX linked. This does not prove profitability or source truth and was not implemented in the proposal.

## Implementation sequence

Define shared provenance/replay records; build/test broker and ledger for fees, reverse quotes, latency, balances, and missing data; replay identical tapes for three agents and a frozen baseline; add task-specific learning with temporal splits; provide a separate bilingual GUI; verify real collection with configured chain/key without invoking order APIs.
