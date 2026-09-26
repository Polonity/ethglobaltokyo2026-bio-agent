# Market Meadow — real Uniswap inputs, paper trades

Historical local Anvil/Workers implementation, 2026-09-26. [MaleCNS learning integration](malecns-learning.md) supersedes earlier synthetic/fixed-circuit descriptions below. This is distinct from the later [shared market with actual agent trades](../apps/shared-market/README.md).

## Start

```sh
npm ci
npm run local:up
npm run local:market
# http://127.0.0.1:8798/market
```

Use absolute FORGE/ANVIL if needed and the same LOCAL_STATE_DIR for both commands. Recorded environment: `.local/embodied`, Anvil18546, GUI8799. `local:market` creates a **new test market**, not a continuation. An open GUI detects changed configuration and requires reload.

## Onchain execution

Deploy pinned official `@uniswap/v3-core@1.0.1` Factory bytecode, two test tokens, a fee-3000 V3 pool, and near-full-range liquidity. LocalMarket handles mint/swap callbacks as a chain-31337-only test harness, not a production router. Register three agents with the market manifest; Worker verifies owner/hash and GUI verifies artifacts.

Price controls execute real 50-token swaps. All three agents consume the same pool logs; TX links identify actual local receipts, never fictitious paper-fill transactions. This is real local V3 core, not SwapEventFixture, public mainnet/Sepolia, or the Trading API. Factory verification concerns the local deployment. Dependency licenses remain those of the distributed core, not the project's MIT license.

## Decisions and body

The original PaperArena predicts immediate rewards from price direction, holdings, and fullness bins. MOMO momentum, SORA contrarian, and KIKI cautious biases are engineered initial priors with seeded exploration, not learned knowledge or instincts. Attention does not force trading. Positive rewards affect synthetic fullness; the shared body function advances 0.2 simulation seconds per observation. The historical eight-second learning timer is superseded by the newer chunked learner.

## Fills and PnL

Start with 100 virtual token1. Buy spends 10 token1; sell liquidates all held token0. Wait for a Swap observation after the decision block. A block-hash-checked eth_call to Pool.swap derives exact output through callback revert without submitting the virtual order.

Quotes include pool fees and size impact. Additional assumed cost is 0.001 token1 per fill. Mark holdings using a liquidation quote and assumed liquidation cost; PnL is cash + liquidation value − initial equity. Continue marking positions during learning. Agents' paper orders do not consume shared liquidity. This omits real concurrent-order effects, MEV, and execution guarantees.

Test tokens have 18 decimals; amounts use BigInt and shared types use decimal strings. Only display converts to fractions. On quote failure, reject the whole observation update, preserving balances/RNG, and retry the same cursor after recovery. Reorg stops the round and requires a new one rather than erasing losses and continuing.

## Historical learning and GUI

The original learner reconsidered a lower-ranked agent every six observations, canceled pending orders but retained positions, fit on chronological 70%, and selected lower prediction MSE on 30%. This selection slice was not held-out future-market evaluation; improved MSE does not establish improved PnL. [Current lightweight learning](malecns-learning.md) documents the updated schedule.

Shared MarketView/ForagingView display actual body/input/account state, token-position movement, learning pause, cash/holdings/PnL/ledger, receipts, export, languages, and mobile layout. Brain/ledger/learning run in the browser; reload begins a new competition.

## Checks and limits

`npm run test:paper` covers later-block fills, fees, deduplication, atomic quote failure, learning-time valuation, order/quote agreement. `LOCAL_GUI_URL=http://127.0.0.1:8799 npm run test:market` generates 12 real swaps and checks paper fills, PnL, learning, shared types, receipts, languages/mobile. Evidence: `artifacts/market-browser/`.

Trend-token acquisition, public deployment for this mode, persistent shared backend, portable full checkpoints, and independent held-out profitability are separate work. The reader is Swap-focused, not a general Mint/Burn oracle. Small SwapEventFixture tests remain input-path checks.
