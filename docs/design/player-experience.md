# Observation-first UI for three applications

Full MaleCNS GUI: http://127.0.0.1:8812. The older 8800 application is retained for comparison.

| Application | Observe                                 | Metrics                                                    | Controls                           |
| ----------- | --------------------------------------- | ---------------------------------------------------------- | ---------------------------------- |
| Foraging    | Movement, feeding, rest, hazard contact | Food count and body-energy percentage                      | Stimulus, run, stop, relearn       |
| PnL battle  | Two policies and account-value changes  | Zero-based PnL lines/bars with signs, currency, percentage | Recorded market run, stop, relearn |
| Aqua        | Offers, withdrawals, fills              | Strategy, spread, fills, proxy points                      | Run, stop, relearn                 |

Use a full-screen field with floating status/control cards; stack cards on narrow screens with touch spacing. Signs, zero lines, text, and selection borders supplement color.

## Metric contracts

- PnL = equity − initial 100 token1. Read symbols/decimals from contracts. The recorded dedicated Anvil used token0=POLLEN/token1=NECTAR: never relabel PnL as ETH.
- Use +/− signs and signed `<0.001` for tiny nonzero values, not misleading zero. PnL% uses initial 100 as denominator.
- Plot only observations actually received by the page; reset from zero on a new run, never fabricate history.
- Old Aqua reward accumulates `ΔNECTAR-full × (next Uniswap price / current Uniswap price) + ΔPOLLEN-full`. The reference is another pair's ratio. Display normalized points, not realized PnL, ETH, or an actual-token oracle.
- Spreads: 30 bps=0.30%, 800 bps=8.00%. Display actual decisions and distinguish proposal, registration, and fill.
- Aqua strategies virtually offer the same wallet assets. Each offers 100 per token; multiple offers do not multiply funds or deposit into separate pools. Stop does not withdraw all registered offers.

## Details and evidence

The information dialog separates usage/metrics, chain/implementation, and learning/comparison. Keep hashes, neuron counts, full manuals, and evaluation tables out of the main scene.

A nested receipt dialog shows hash, block, success, From/To, gas units, and source JSON. Guide images link back to controls. Esc closes dialogs and restores focus.

## Assets

Original backgrounds/food/legacy flies were copied unchanged with provenance from `bio-agent/frontend/public/assets/game-v1/`. Imagegen supplied new market/Aqua backgrounds and the rounded cream mascot `cute-fly-v1.png`, stored in `services/full-apps/assets/`. The older realistic fly is not displayed. Movement tilts the mascot without flipping its face; learning holds it still.

Artwork explains setting. Scores, prices, actions, and fills come from runtime data, not baked-in imagery. Decorative coins/canals are not balances or transaction history.

## Verification

```sh
node scripts/check-ux-refresh.mjs
node scripts/check-pnl-display.mjs # synthetic display fixture, not a trading result
node scripts/capture-guide-screens.mjs
npm run docs:apps
npm run build
npm run test:guides
```

UX checks run/stop all three apps and inspect 166, 700-neuron mode, currencies, proxy prices, receipts, both languages, 390 px layouts, and Esc. Outputs: `artifacts/ux-refresh/`. Do not run competing experiments on the same chain. Old recordings remain historical UI evidence.

Independent display fixtures test PnL signs, units, percentages, and zero-based bars without injecting production state. If observed PnL is zero, display zero; never manufacture profit for a screenshot.
