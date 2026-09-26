# Application types v1 — foraging and paper trading

2026-09-26. TypeScript types/examples, primitive validation, and legacy foraging conversions are implemented; shared views are connected to both GUIs. Full runtime-interface migration, generic Solidity ABI redesign, and complete JSON validation remain incomplete. See [design direction](bioagent-design-direction.md) and [Embodied Learning Profile](embodied-learning-profile.md). NFT/SBT are not base/extension requirements.

## Files and checks

| File under packages/shared/ | Responsibility |
| --- | --- |
| types/primitives.ts | Precision-preserving integer strings, hashes/addresses, bounded constructors |
| types/core.ts | Identity, origin, sourced inputs, body/time, view/checkpoint/learning/runtime contracts |
| types/foraging.ts | Conditions, observations, actions, outcomes, views, transitions |
| types/market.ts | Market inputs, observations, decisions, paper orders/fills/valuation/transitions |
| types/legacy.ts | Explicit existing Status/action/energy conversions |
| examples/two-apps.ts | Synthetic examples using shared types |
| examples/type-boundaries.ts | Compile-time rejection of semantic mixups |

`npm run test:types` runs strict TypeScript and constructor/conversion Node tests, using Node22.14+ type stripping. Example IDs/hashes/URIs/body states are fixtures, not measured evidence.

## Common types

AgentRef is an EVM chain/registry/agent reference or a local session/agent reference; do not fabricate onchain identities. ArtifactRef states digest algorithm and URI, hashing exact bytes without implicit JSON canonicalization. ModelDescriptor declares dynamics, sensory/motor mappings, body, plasticity, and scoped validation. BiologicalOrigin distinguishes synthetic-demo, bio-inspired, and connectome-derived; the last requires dataset/extraction/graph provenance, not proof that declarations are true.

InputEnvelope includes inputId, source, sourceTimeMs, receivedAtMs, payload. Chain provenance includes emitter/blockHash/transactionHash/logIndex; API provenance includes endpoint/requestId/response artifact. Label fixtures separately.

Clock separates tick, simulationTimeMs, dtMs, wallTimeMs, and pausePolicy. Wall/receive times are Unix ms; source time is Unix ms for chain/API and episode time for simulation. Fixtures declare their time domain. Never compare timestamps from different domains for freshness. Adapters convert chain seconds and handle missing values.

| Body kind | Fields | Meaning |
| --- | --- | --- |
| unmodeled | None | No body model |
| legacy-energy-only | activityEnergy | Only actual legacy energy; satiety/mass unknown |
| embodied | model, activityEnergy, satiety, reserves, massRatio | First three numeric states0–1; massRatio relative to declared baseline |

Unknown satiety is not zero hunger. Type definitions alone do not implement metabolism. Full validators must enforce finite positive mass and model units/equations.

RuntimeView contains lifecycle, input health, body, task state, and clock. Checkpoint references body, neural state, policy, optimizer, experience, PRNG, environment, and input cursor, with genesis/continue/fork/restore lineage. Explicit not-applicable artifacts differ from missing state.

Transition binds before/after checkpoints, consumed input IDs/provenance/payloads, descriptor, observation, actual encodedObservation, action, outcome, and learning record. LearningRecord distinguishes none/candidate/adopted/rejected; adoption/rejection require protocol, split, initial conditions, frozen baseline, and report. Existing selection seeds are not independent held-out tests; do not invent complete evidence from partial records.

## Foraging profile

| Type | Content |
| --- | --- |
| ForagingConditions | mode, energySupply, stimulusIntensity |
| ForagingInput | Conditions, food-contact, or hazard-contact plus source |
| ForagingObservation | Conditions, food direction/distance, hazard direction, pre-action body |
| ForagingAction | move(direction0–7) or rest |
| ForagingOutcome | Post-action position, food/contact events, foraging-score reward |
| ForagingState | Position, score, collection/contact counts |
| ForagingTransition | Common transition specialized as foraging.v1 |

Coordinates/distances use arena units. Descriptor defines speed/environment updates. Feeding is a contact effect, not a newly learned eat action.

Legacy mapping: Activity0/1/2→rest/explore/forage; Status.energy→supply, distinct from fly.energy→actual body energy; stimulus remains0–10000; revision is positive uint64 for deduplication; actions0–7→move and8→rest, rejecting others. Lifecycle conversion is separate from stale-input status. Bubbles/lastDecision are derived display, not authoritative neural evidence.

## Market profile

| Type | Content |
| --- | --- |
| MarketInput | Discriminated confirmed Swap, API quote, or fixture |
| SwapPrice | Pool/tokens, sqrtPriceX96, liquidity, tick, token1-per-token0 direction |
| ExecutableQuote | Quantity-specific amountIn/out, expiry, provenance; no future-fill guarantee |
| MarketRef | Pool or fixed-amount quote pair; do not mislabel a multihop route as one pool |
| MarketObservation | Price/baseline/change bps, attention, body, cash/holdings |
| MarketAction | hold/skip/buy/sell; trades specify spend and receive token |
| PaperOrder | Decision tick/time, earliest fill, action |
| PaperExecution | no-order/pending/rejected/filled |
| PortfolioValuation | unavailable or valued with equity and net/realized/unrealized PnL |
| MarketTransition | market-paper.v1 specialization |

High attention permits hold/skip. Spot price is not a size-specific quote; filled requires quote and cost model. TokenRef includes chain/address/decimals. Amounts are base-unit decimal strings (atoms); only PnL is signed. Use no floating-point token arithmetic. Separate included fees/impact from additional gas/slippage deductions.

All PaperMode values (live-data/replay/fixture) are paper-only. A paper fill has no transactionHash; source Swap and stimulus TXs have separate provenance. Unavailable valuation is not zero PnL. Existing price/Swap observer adapters do not become trading runtimes merely by conversion; resolve token/pool metadata and factory checks first.

## Runtime proposal and validation gaps

```text
observe(input) → accepted / duplicate / rejected
advance(clock) → view + transitions
checkpoint() → complete artifact reference
restore(reference) → complete restored state
```

IBioAgentRuntimeV1 specializes to task runtimes; it does not inherit Solidity IBioAgent. Existing JS classes do not claim full implements conformance.

TypeScript does not validate external JSON or prevent casts. Future full validators need positive chain IDs/bit widths/decimals/pair-chain/factory checks; source truth/order/finality/reorg/freshness; consistent agent/episode/branch transitions; actual encoded observations; matching quote amount/direction/time/expiry/balances; common valuation currencies and no fee double-counting; fit/selection/test separation; complete available artifacts with verified digests.

Typed examples do not finalize wire bytes or signing payloads. Solidity mailbox payloads do not automatically match TypeScript schema labels. Define encoding, domain separation, and vectors before changing ABI.

Implementation sequence: complete validators/encoding; foraging body/PRNG checkpoints and tape replay; market provenance/metadata/broker/ledger; shared record viewer and minimal necessary Solidity boundary.
