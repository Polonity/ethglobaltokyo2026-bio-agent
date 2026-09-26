# BioAgent | Presenter Q&A

Lead with the short answer, then give the evidence. Recording: 26 Sep 2026.

## Your 30-second opening

BioAgent is an experimental platform that connects biologically derived circuits to traceable actions. Four agents, each using 166,700 neurons, make Aqua offers and trade through Uniswap. We verified real local settlement and learning updates. A separate foraging experiment improved behavior, but did not outperform a matched non-biological model. Our contribution is a working platform for testing these possibilities and their limits.

- **166,700** — neurons per agent × 4 agents
- **12** — new settlements: 1 Aqua · 11 V3
- **6 × 4** — learning updates; 3 agents changed weights

## 1. How is this different from an ordinary AI agent?

**Measured biological connectivity participates in the action features.** From the ecosystem, it still looks like a trading bot. The distinction is model provenance and internal structure. Dynamics, encoding and decoding are engineered; this is not a measurement of a fly’s feelings or consciousness.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 2. Have you demonstrated a uniquely biological advantage?

**Not on the task we tested.** Our hypothesis is that a fixed sparse circuit plus a small learned readout could adapt efficiently. Ordinary models can also learn and use little memory. We built a way to compare these possibilities under matched conditions; superiority remains unproven.

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 3. What value do Uniswap and 1inch receive?

**A reference implementation connecting alternative decision models to real settlement.** For Uniswap: an entry point for comparing quote-based execute/hold policies. For Aqua: learned offer/withdraw decisions using shared self-custodied liquidity. User growth, routing volume and capital-efficiency gains are hypotheses, not measured outcomes.

[R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md) / [R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 4. What learns during the video?

**The action readout updates from confirmed outcomes; neural connections stay fixed.** All four agents received 6 outcome updates; 3 changed saved weights. Rewards reflect offer fills or progress toward target holdings. This full-market runtime updates online, without a held-out adoption gate. Updates alone do not establish a better trading policy.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 5. What improved beyond simply running the demo?

**A separate seven-neuron foraging experiment improved held-out reward: 18.79 → 56.12.** A matched direct-input learner scored 56.08, so biological superiority was not established. Mean contacts fell 1.25 → 0.10, but final energy fell 0.722 → 0.361. Five search seeds and 60 unseen worlds per profile; these are not market results.

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 6. Is it cheaper or more energy-efficient than an LLM?

**The resource footprint is measurable; comparative savings are not yet established.** The shared Python process peaked at 443.2 MiB RSS; the last four-agent neural pass took 333.3 ms. These are not whole-system memory or energy measurements. LLM RAM depends on the model and configuration, not a universal 256 GB requirement. We need a matched-task benchmark.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json)

## 7. Does the fly choose the trading venue?

**The neural model selects an action; ordinary code compares executable quotes.** Makers choose tight/wide/withdraw; traders hold/buy/sell, using learned scores plus engineered priors and exploration. Venue selection compares output before gas. We use V3 core and our FlyV3Router—not Trading API, Universal Router or v4 hooks.

[R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 8. What does the shared BioAgent interface provide?

**Reusable input interpretation, provenance and policy compatibility checks.** Solidity IBioAgent defines inputs. The separate seven-neuron JS framework shares validation, train/evaluate/adopt and save/restore, rejecting incompatible or worse candidates. The full Python market runtime is separate. Cross-task skill transfer and developer-time savings are not demonstrated.

[R4: Framework: API, validation and restore](../../../packages/bioagent-framework/README.md)

## 9. What is onchain, and is inference trustless?

**Agent/model references, input revisions and actual settlement are recorded.** Inference and learning run offchain. The video uses Anvil chain 31337, canonical Aqua code on a fork and real Transfer logs. Hashes identify artifacts; they are not proofs of correct neural computation. The chain reader trusts its RPC.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R4: Framework: API, validation and restore](../../../packages/bioagent-framework/README.md)

## 10. Does PnL prove profit or safe autonomous trading?

**It is test-token mark-to-market accounting, not a profitability or safety result.** Demand is manually set to 85%/15% target holdings. Swap costs affect PnL; ETH gas is shown separately. Two makers share one EOA. Execution has quantity/deadline checks, but this is not an audited trading product.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 11. Does the public demo run the full population?

**The public demo is Sepolia + 7 neurons; the video is Anvil + 166,700 neurons per agent.** Visitors can observe foraging, compare learning and submit Registry inputs. The public page does not send Aqua/Uniswap orders. The video shows four full-population agents and real local test-token swaps.

[R5: Public Sepolia demo and transaction evidence](../../deployment/sepolia.md)

## 12. What did failure teach you, and what comes next?

**Reward improvement needs side-effect constraints and matched controls.** Foraging learned to rest less, raising reward while depleting energy. Next: compare execute/hold policies on identical Uniswap pair/size quotes, using unseen market regimes, fee-adjusted outcomes, failure/skip rates and resource measurements.

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 13. Does it fit the prizes, and what remains?

**1inch permits local-fork transfers; V3 is within Uniswap’s listed stack.** Eligibility is not a prize guarantee. Requirements checked Sep 26 include a public repo, FEEDBACK.md and Uniswap’s Developer Feedback Form. This task did not submit the form or create FEEDBACK.md; publication of current commits still needs verification.

[R6: ETHGlobal Tokyo: official prize requirements](https://ethglobal.com/events/tokyo2026/prizes)

Say: measured connectivity, successful settlement, observed learning updates. Do not claim: fly thoughts, biological superiority, profit, lower LLM cost, or equivalence of full and reduced runtimes.
