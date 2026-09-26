# Aqua Connectome — stimulus-driven shared liquidity

Historical milestone, 2026-09-26. [Task learning and immediate adoption](malecns-learning.md) supersede the initial fixed-controller learning status. **Powered by Aqua — © Degensoft Ltd 2025.**

The third playground maps measured-connectivity responses to Aqua offers. Official Aqua is deployed on Anvil; three agents virtually offer one wallet's balances at `/aqua`. Existing foraging, market, and Circuit Lab remain.

## Scope

Implemented: stimulus → measured-graph computation → SDK → actual Aqua TX. Not claimed: a mathematical equivalence between capital efficiency and brain structure; whole-brain/mushroom-body/lateral-horn/CX reproduction; gasless withdrawal; cross-chain shared funds; mempool/MEV/LVR protection; biological reward learning.

ship/dock are mined onchain writes. Parameters are immutable: dock the old strategy and ship a new revision. This uses a seven-neuron/19-edge slice. Aqua manages virtual balances; custom AquaFlyApp supplies local pricing, not production SwapVM/Pathfinder integration.

Sources: [overview](https://business.1inch.com/portal/documentation/aqua/overview), [SDK](https://github.com/1inch/sdks/tree/master/typescript/aqua), [pinned Aqua](https://github.com/1inch/aqua/blob/ef24220ed9647555727b06867bf509cd6959d84b/src/Aqua.sol).

## Execution and model

GUI records risk stimulus in Status. Worker verifies same-block Status/event provenance, runs 32 zero-state circuit ticks, and uses an engineered decoder. `@1inch/aqua-sdk@0.3.4` creates ship/dock calldata for the unlocked local maker. A separate local taker can swap one NECTAR through Aqua push/pull. Tokens have no economic value.

Worker executes the logic; browser independently repeats computation for visualization/checking. This version is operation-driven, not a resident trading bot.

- Three agents share maker/descriptor. stimulus is artificial 0–10000; activity/energy are unused.
- Sensitivity: MOMO0.7, SORA1.0, KIKI1.3; drive=min(1, stimulus/10000*sensitivity).
- [Rate dynamics](circuit-evidence.md) plus an edge-ablation display.
- Response <0.045: offer100 of each token; 0.045–<0.1: offer40; ≥0.1: withdraw. Spread=round(30+response*4000) bps.
- Original strategy bytes: abi.encode(agentId, revision, spreadBps, modelHash); hash=keccak256(bytes). Maker/app/pair are bound through contracts/mappings.
- Both tokens have18 decimals; fixed1:1 reference, amountOut=amountIn*(10000-spreadBps)/10000. No market-price oracle.
- `bioagent.aqua-controller.v1` descriptor records controller/graph/dynamics hashes and assumptions; its hash is registered. It is an app-specific descriptor, not a universal final profile.

Three virtual offers of100 do not multiply the maker's100-token balance. Fills affect other strategies' available funds. Offers/withdrawals move no tokens; settlement does.

## Execution boundaries

Require loopback, Anvil31337, matching deployment hash, same-origin JSON, fixed IDs, expected revision, and valid ranges. No arbitrary RPC/calldata API. Makers can still manually ship strategies: this is not an onchain neural-execution proof.

AquaFlyApp checks owner, modelHash, and current stimulus revision. A mined new stimulus invalidates old strategies even before dock. dock→ship is non-atomic; refresh real state after failure before retrying, avoid duplicate apply, and reject stale revisions at fill time.

Wallet references are not smart-account deployment, delegated learning authority, session keys, or production monitoring.

## Setup

```sh
npm ci
ANVIL_PORT=18546 LOCAL_GUI_PORT=8799 LOCAL_INSPECTOR_PORT=9249 \
  LOCAL_STATE_DIR=.local/embodied npm run local:up
LOCAL_STATE_DIR=.local/embodied npm run local:aqua
npm run test:aqua
forge test --root contracts
LOCAL_GUI_URL=http://127.0.0.1:8799 npm run test:aqua:browser
```

The first command starts/retains the environment; do not restart a running one unintentionally. `local:aqua` adds a fresh independent deployment. Specify FORGE/ANVIL paths if needed. Wrangler reloads configuration. Changed model sources require a new registered descriptor, not merely rebuilding dist.

GUI: http://127.0.0.1:8799/aqua. APIs: `/api/aqua/snapshot`, stimulus, apply, fill, receipt?hash=…. Write body: `{agentId: number, revision: string}`; stimulus adds `stimulus: number`.

## Demonstration

Show three offers against one100/100 balance at zero stimulus, then a one-token fill. Set SORA to40% for a smaller offer, then100% for withdrawal. Show response, strategyHash, and actual receipts. Explain measured wiring versus engineered input/dynamics.

## Licensing and checks

See [pinned dependencies/licenses](../../contracts/vendor/README.md). Aqua is not MIT; retain its source/attribution and review commercial terms before productization. Production risk limits/authority/audits are separate work. Cross-chain/Robinhood availability is not established here.

Recorded checks:29 Foundry tests including6 Aqua tests;3 Node Aqua tests; Chrome confirmed three offers, actual fill,40-token cautious offer, dock, receipts, origin/stale/duplicate/tamper rejection, English/Japanese,390px layout. Circuit/market regression, shared types, and formatting also passed. Evidence: `artifacts/aqua-browser/evidence.json`, shared-wallet/cautious/danger/mobile PNGs. These verify local integration, not market performance or production security.

Current v2 strategy bytes add `bytes32 policyHash`. This references the learned artifact, not proof of computation. `/api/aqua/train` creates a new revision/policy when selection MSE improves, then GUI applies the new strategy.
