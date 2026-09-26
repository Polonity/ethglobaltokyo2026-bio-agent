# Application guides

Read each guide in order: first run, screen layout, learning, then implementation. Controls, goals, and metrics come before the relationship between onchain inputs and MaleCNS.

| Application | Guide                                           | Onchain evidence                                       | Local computation                                 |
| ----------- | ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------- |
| Foraging    | [Food, state, and bubbles](foraging.md)         | Environment/hazards and per-agent Status stimulus TXs  | Body, neural activity, movement, and learning     |
| Market      | [Prices, trades, and PnL](market.md)            | Real Uniswap Swaps, price blocks, and quote provenance | Paper accounts, decisions, and learning           |
| Aqua        | [Strategies, fills, and proxy rewards](aqua.md) | Status, ship/dock, and actual test-token swaps         | Strategy decisions, proxy valuation, and learning |

Full-neuron UI: [port 8812](http://127.0.0.1:8812/). Legacy browser UI: [port 8800](http://127.0.0.1:8800/). Each page's explanation sheet supports English and Japanese printing/PDF export. Full-mode seven-neuron comparisons and the legacy browser learner are distinct implementations.

Open help through the main screen's information button. See [UI conventions and units](../design/player-experience.md). Each help panel has four numbered screenshots: controls, field, state, and chain evidence. Images are historical examples, not current measurements. The seven-neuron comparison labels its full-mode reference images accordingly.

Guides include legends, processing flow, state/bubble definitions, metrics, and suggested actions. The full UI's latest-action trace displays a completed action's actual input TX, neuron count, policy, action, and result; illustrative examples are not presented as measurements.

## Update the guides

`apps/frontend/guides/content.mjs` is the shared source for in-app help and printable HTML.

```sh
node scripts/capture-guide-screens.mjs # Capture 48 regions from the running GUIs
npm run docs:apps                     # Generate three English Markdown guides
npm run build                        # Refresh static assets
npm run test:guides                   # Check both languages, GUIs, traces, mobile, PDF
```

Browser checks require ports 8812/8800, Chrome, and Anvil. They briefly run and stop the full application, so finish existing learning jobs first. These commands do not deploy the public Worker.

PDFs, captures, and `verification.json` are under `artifacts/app-guides/`. Keep these UI checks separate from [historical learning acceptance](../submission/full-apps-acceptance.md).

Image sources live in `apps/frontend/guides/screens/`; `manifest.json` records URLs, selectors, and capture times. Recapture images after layout changes.

## Bubble reference

`bubbleGuide` / `bubbleSvg` in `content.mjs` describe full-mode action cards and legacy bubbles, including priorities, pending-versus-filled orders, and Aqua decisions versus confirmed TXs. Generated SVGs live in `docs/apps/bubbles/`. These are explanatory diagrams, not captured measurements or evidence of emotions.

For counterparties and currencies, see the in-app trading explanation and [market flow](../design/aqua-market-flow.md).

## Four-agent shared market

[Guide with screenshots](shared-market/README.md), served at http://127.0.0.1:8814/. Two agents offer Aqua liquidity; two others compare Aqua/Uniswap quotes for actual test-token trades. This is separate from the paper-trading mode.
