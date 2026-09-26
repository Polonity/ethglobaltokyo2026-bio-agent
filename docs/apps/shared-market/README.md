# Shared Market — four agents trading in one market

[60-second English demo](../../submission/evidence/shared-market-demo-en.mp4) · [Recording and reproduction](../../demo-video.md)

Integrated mode: **http://127.0.0.1:8814/**. Original foraging, paper-market, and Aqua submission applications on 8812/8813 remain separate.

![Four-agent shared market](screen-en.png)

## Reading the screen

| Element | Meaning |
| --- | --- |
| MOMO / SORA | Two Aqua offer strategies sharing one maker wallet, not separate PnL accounts |
| 1inch Aqua | Test-token exchange using agent-selected offers; offering alone earns nothing |
| Uniswap V3 | Same two token addresses as Aqua, with 0.3% pool fee |
| KOHARU / HINATA | Separate wallets placing actual orders and moving toward the selected venue |
| Price | Spot quote per unit of the base token; token order depends on deployment addresses |
| Wallet PnL | Mark-to-market change since initialization, in the actual token symbol, not ETH |
| Chart | Shared maker (green), KOHARU (yellow), HINATA (blue), matching score order |
| Target sliders | Desired asset-value percentage in the displayed base token; artificial demand, not a price forecast |
| Confirmed trades | Actual settlements; TX opens receipt, quotes, transfers, and gas |
| Evidence & brain | Official Aqua/token addresses, MaleCNS measurements, policy hash, and learning counts |

**Powered by Aqua — © Degensoft Ltd 2025.** Tokens have no monetary value. These are real contract executions on a **local Anvil fork** carrying official Ethereum Aqua, not public Etherscan transactions.

## Run and observe

1. Select Run: up to 120 cycles per run, four-second target interval.
2. Watch offer updates and trader decisions.
3. Open a TX to inspect the route and received quantity.
4. Pause, change holdings targets, apply them, and resume.
5. Near-target agents may wait. Zero fills are neither failure nor profit.

Stop takes effect after the current cycle and does not submit forced withdrawals. Offers expire after 90 seconds of chain time; the next startup docks old offers. Anvil time may not advance without new blocks.

## Bubbles and accounting

- `?`: neural processing or readout update; animation pauses in place.
- `LP`: strategy spread and this cycle's fills, explicitly showing no fill when applicable.
- `TX`: buy/sell venue and extra quoted output versus the other route, excluding gas.
- Received quantity: receipt-derived token amount, **not profit**.
- Account change: mark-to-market difference within this cycle, excluding gas.
- Shared account change: the whole MOMO/SORA wallet, including inventory repricing without fills.
- `WAIT`: no order or new movement toward Uniswap.
- Exploration: explicitly labeled experimental action, with actual/target holdings ratios.

Text/CSS labels avoid emoji rendering issues. Mobile layouts pin agent positions to avoid overlap and name venues in bubbles. These are implementation-state visualizations, not decoded biological emotions.

## Execution path

```text
V3 spot price + actual wallet balances + target holdings
  → four confirmed BioAgentStatus transactions
  → 166,700 MaleCNS neurons per agent, independent activity state
  → MOMO/SORA: tight / wide / withdraw → official Aqua ship/dock
  → KOHARU/HINATA: hold / buy / sell
  → compare executable Aqua and Uniswap quotes for the same amount
  → real TX to the highest-output route → ERC20 balances change
  → persist outcomes and update readout → next decision
```

Counterparties are our own KOHARU/HINATA wallets, not external users. Orders use 2 input tokens; contract cap is 10; minOut is 99.5% of quote; deadline is 30 seconds. Aqua strategies bind reference V3 price, spread, expiry, agent, stimulus revision, and model/policy hashes. Changed revisions, expiration, insufficient inventory/allowance, or docked offers invalidate execution.

V3 uses actual core contracts and a custom local callback adapter, not the Uniswap Trading API or production Router API. Quote comparison excludes gas and supports no multihop, MEV protection, production oracle, or cross-chain execution.

Startup seeds LP liquidity. Each participant starts with 100 of each token; surplus maker mint is moved to a separate reserve wallet.

## PnL versus learning

`mark-to-market PnL = token0 balance × current V3 price + token1 balance − initial valuation`

Balances reflect swap fees/spreads, but this includes unrealized changes and **does not deduct gas**. Gas is shown separately in ETH per TX. Internally trading between team-owned wallets does not create external value. All three accounts lost marked value in the recorded verification; acceptance concerned settlement/state/learning integration, not profit.

State is isolated in `.local/shared-market/`; older Aqua/market policies are not reused.

- One fixed connectivity matrix, four independent neural states, processed two agents at a time with four neural steps per decision.
- Sixteen engineered inputs drive sensory populations; population summaries feed readouts.
- Engineered initial scores receive small normalized SGD corrections from actual outcomes, used on the next decision. Connectivity is not retrained.
- Maker reward measures reference-price differences on its fills. Trader reward combines movement toward target holdings with execution cost at the same reference price. Neither equals displayed wallet PnL.
- `decisions.jsonl`: inputs/features/actions/policy hashes; `outcomes.jsonl`: outcomes; `cycles.jsonl`: balances/TXs/performance; `readout.json`: weights.
- Experimental online adaptation is separate from the older candidate evaluation/adoption gate. Held-out profitability and biological validity remain unverified.

## Setup and verification

Prepare data using the [full-model guide](../../design/malecns-full-local.md).

```sh
# Only if the official Aqua fork is not already running on 18551/8813
npm run submission:aqua
# Another terminal; deploy additional contracts to that fork
forge build --root contracts
npm run shared:dev
# http://127.0.0.1:8814/
# Run while stopped; moves real local test tokens over 12 cycles
npm run test:shared
```

If needed, add `$HOME/.foundry/bin` to PATH. Isolation settings: `SHARED_RPC_URL`, `SHARED_PORT`, `AQUA_FORK_MANIFEST`, `FULL_APPS_STATE_DIR`. The app requires loopback RPC, chain 31337, Anvil, and a verified official Aqua fork; it never sends to public networks. The check script defaults to 8814.

Restart resets neural activity, displayed cycle numbers, and fill counters; it retains weights, initial valuations, and chain balances. To start a fresh funded experiment, use a **new state directory**, preserving existing records. Startup does not redistribute initial funds automatically.

## Recorded verification — 2026-09-26

- 12 Foundry tests passed, including actual V3 quote/output matching, rollback, callback spoofing, deadlines, and caps.
- 12 browser verification cycles completed; including earlier runs the screen showed 24 cycles, **12 Aqua fills / 35 Uniswap swaps**. All agents updated their readouts; counts vary with exploration and persistent weights.
- Four-agent neural computation: median **336.8 ms**, maximum **349.9 ms**; Python peak RSS **443.2 MiB**. Fits the four-second target, not a claim of 30 Hz neural computation.
- Transfer-log reconstruction matched all six token balances across three wallets exactly in base units.
- Receipts verified official Aqua Pushed/Pulled and V3 Swap. Some call traces were unavailable due to Anvil historical-bytecode errors; those checks use receipt evidence.
- English/Japanese, TX/help dialogs, and 390 px mobile passed without browser exceptions or horizontal overflow.

[Accounting and performance evidence](accounting.json). Detailed local output: `artifacts/shared-market/verification.json`.
