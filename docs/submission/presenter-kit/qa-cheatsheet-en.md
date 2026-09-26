# BioAgent | From purpose to demo

## What we want to achieve

Build a framework for running biologically derived decision models on onchain inputs, adapting from experience, and comparing their effectiveness and resource use.

For agent developers and researchers: reuse input validation, model provenance and learning records to discover when biological circuits are useful.

## Explain the public demo in this order

- **1 | Open** — Open Sepolia without a wallet and select the three agents. “Decisions use seven measured neurons and 19 connections.”
- **2 | Trace the environment** — Open “Environment and food input TXs” and its initial TX. “Dimensions and hazards were recorded in this transaction.”
- **3 | Follow stimulus to action** — Show a food source TX and behavior. “One confirmed positive stimulus adds one food; the model uses encoded observations to choose movement or rest.”
- **4 | Inspect learning** — Select an agent and press “Start learning”. “It updates Q-values using experience and a copy of the confirmed environment, adopting only a higher-scoring candidate.”
- **5 | Read the result** — Show before/candidate and adopt/keep. “This compares replays of the same environment. We study unseen-world effects in a separate controlled experiment.”

The sender checks hourly, with at least one hour between sends. Use recorded TXs for a one-minute presentation. Manual writes require the owner. Once food is eaten, agents rest; there is no refill. No improvement is a valid result.

## Use the three evidence tracks correctly

- **Current public page** — Sepolia, 7 neurons, 3 agents: TX inputs, foraging and Q-learning.
- **Submitted video** — Anvil, 166,700 neurons per agent: two-agent environment TX and learning comparison, then four-agent Aqua/V3 settlement.
- **Independent research** — Synthetic foraging controls: reward improved, but a biological advantage was not established.

## A roughly one-minute script

We are building a framework for using biological decision models in applications and testing whether learning helps. First, we record the environment, including hazards, in a transaction. A confirmed stimulus then adds food, and the agent chooses movement or rest. Learning replays that environment and experience, adopting an improved candidate. The demo lets us trace inputs, decisions and learning. A separate controlled experiment improved reward, but did not establish a biological advantage. Next, we will compare the same task against small AI models, measuring adaptation speed and resource use.

---

# BioAgent | Presenter Q&A

Current shared Fly Lab. Recorded market results and independent research are labelled separately.

## Optional: introduce the full-market video

BioAgent is an experimental platform that connects biologically derived circuits to traceable actions. The video first shows full-neuron environment TXs and learning comparison, then four agents making Aqua offers and Uniswap trades. We verified real local settlement and learning updates. A separate foraging experiment improved behavior, but did not outperform a matched non-biological model. Our contribution is a working platform for testing these possibilities and their limits.

- **166,700** — neurons per agent × 4 agents
- **27** — new settlements: 2 Aqua · 25 V3
- **14 × 4** — learning updates; 3 agents changed weights

## 1. How is this different from an ordinary AI agent?

**Measured biological connectivity participates in the action features.** From the ecosystem, it still looks like a trading bot. The distinction is model provenance and internal structure. Dynamics, encoding and decoding are engineered; this is not a measurement of a fly’s feelings or consciousness.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 2. Have you demonstrated a uniquely biological advantage?

**Not on the task we tested.** Our hypothesis is that a fixed sparse circuit plus a small learned readout could adapt efficiently. Ordinary models can also learn and use little memory. We built a way to compare these possibilities under matched conditions; superiority remains unproven.

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 3. What value do Uniswap and 1inch receive?

**A reference implementation connecting alternative decision models to real settlement.** For Uniswap: an entry point for comparing quote-based execute/hold policies. For Aqua: learned offer/withdraw decisions using shared self-custodied liquidity. User growth, routing volume and capital-efficiency gains are hypotheses, not measured outcomes.

[R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md) / [R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 4. What learns in the market scenes?

**The action readout updates from confirmed outcomes; neural connections stay fixed.** All four agents received 14 outcome updates; 3 changed saved weights. Rewards reflect offer fills or progress toward target holdings. This full-market runtime updates online, without a held-out adoption gate. Updates alone do not establish a better trading policy.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 5. What improved beyond simply running the demo?

**Full model: 24/24 food; 91.9% of moves approached food.** Same TX inputs, 12 unseen worlds: direct ridge 23/24, random 4/24. Full model: 7 hazard steps; safety criterion failed. One training run. Biological superiority and trading gains remain unproven.

[R9: Full foraging validation](foraging-validation.md)

## 6. Is it cheaper or more energy-efficient than an LLM?

**We aim to reduce the compute and update costs of routine decisions, potentially saving energy, hardware and time.** The shared Python process peaked at 443.1 MiB RSS; the last four-agent neural pass took 317.4 ms. Power is unmeasured; these are not comparative savings. Page 4 gives the hypotheses, counterarguments and comparison conditions.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json)

## 7. Does the fly choose the trading venue?

**The neural model selects an action; ordinary code compares executable quotes.** Makers choose tight/wide/withdraw; traders hold/buy/sell, using learned scores plus engineered priors and exploration. Venue selection compares output before gas. We use V3 core and our FlyV3Router—not Trading API, Universal Router or v4 hooks.

[R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 8. What does the shared BioAgent interface provide?

**A shared meaning for inputs and models, with reusable validation and learning components.** Solidity handles inputs/authority; public JavaScript runs Q-learning, while Workers verifies inputs. Full mode uses Node.js control and Python computation over JSON Lines. The independent JS framework and proposed TypeScript types remain separate. See the architecture appendix.

[R4: Framework: API, validation and restore](../../../packages/bioagent-framework/README.md) / [R8: Architecture, languages and trust boundaries](../../architecture.md)

## 9. What is onchain, and is inference trustless?

**All external inputs to the playground come from onchain data.** The initial TX includes hazards; each confirmed positive stimulus adds one food, removed when eaten. Position, body, consumption and learning run offchain. Browsers share inputs, not body state. Receipt checks do not establish finality or correct neural computation.

[R5: Public Sepolia demo and transaction evidence](../../deployment/sepolia.md) / [R6: Current environment-TX and scheduled sender evidence](../judge-demo-review.md)

## 10. Does PnL prove profit or safe autonomous trading?

**It is test-token mark-to-market accounting, not a profitability or safety result.** Demand is manually set to 85%/15% target holdings. Swap costs affect PnL; ETH gas is shown separately. Two makers share one EOA. Execution has quantity/deadline checks, but this is not an audited trading product.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 11. Does the public demo run the full population?

**The public demo is Sepolia + 7 neurons; the video is Anvil + 166,700 neurons per agent.** The public page has three agents, Q-learning on confirmed-world replays, and a score-based adoption gate. The new video shows two full-foraging agents comparing readouts, then four market agents updating online. Both full foraging and public mode use environment TXs. Public Sepolia does not trade on Aqua/Uniswap.

[R5: Public Sepolia demo and transaction evidence](../../deployment/sepolia.md)

## 12. What did failure teach you, and what comes next?

**Reward improvement needs side-effect constraints and matched controls.** Foraging learned to rest less, raising reward while depleting energy. Next: compare execute/hold policies on identical Uniswap pair/size quotes, using unseen market regimes, fee-adjusted outcomes, failure/skip rates and resource measurements.

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 13. Who sends TXs? Can judges send them?

**The owner EOA signs; Workers uses the same owner key for scheduled sends.** The key stays in a Cloudflare Secret. Hourly checks send to Agent #1 at least an hour apart, subject to gas and balance limits. Viewing and learning need no wallet; manual writes require the owner. This is not a smart wallet. Food never refills without a TX.

[R6: Current environment-TX and scheduled sender evidence](../judge-demo-review.md)

Say: measured connectivity, successful settlement, observed learning updates. Do not claim: fly thoughts, biological superiority, profit, lower LLM cost, or equivalence of full and reduced runtimes.

## AI agent comparison: expected benefits

Scope: repeated choices among a few actions from numeric inputs, not equivalent general language ability.

We aim to keep routine decisions running within a small compute budget. A fixed circuit and a small readout may reduce memory, processing and update costs. Lower energy use, cost and latency are hypotheses; a matched comparison must establish the benefit.

| Dimension | Expected benefit and mechanism | Evidence and limits |
| --- | --- | --- |
| Energy / cost | Bounded CPU work could lower always-on energy use or repeated inference-API charges. | Savings would accrue to agent operators. Power/cost are unmeasured; gas and RPC costs remain. |
| Memory | Share one fixed sparse graph across individuals; keep separate states and readouts. | 443.1 MiB is peak RSS of the four-agent Python process, not whole-system RAM or proof of microcontroller deployment. |
| Latency | Four circuit steps can lead to an action without generating text or calling an external inference API. | Four-agent neural processing: 304–349 ms in 14 recorded cycles. This is not a real-time guarantee. |
| Adaptation | Refit only 180 readout coefficients per agent; keep the circuit fixed. | Task-specific flexibility. Small conventional models can do this too; LLMs can adapt via context without retraining. |

### 14. Does every LLM need 256 GB?

**No: model size, precision and context determine memory.** For an 8B model, weights alone are about 16 GB at FP16 or an ideal 4 GB at 4-bit (decimal). KV cache and overhead are extra. API clients do not host those weights. Compare equivalent tasks.

[S1: HF: weight quantization](https://huggingface.co/docs/transformers/main/en/quantization/overview) / [S2: HF: KV cache and generation](https://huggingface.co/docs/transformers/main/en/kv_cache) / [S5: HF: hosted inference](https://huggingface.co/docs/inference-providers/index)

### 15. How much electricity does it save?

**We have no measured savings ratio; RAM does not determine watts.** Measure system power and joules per decision at matched quality and workload. Electricity cost = average W × operating hours / 1,000 × tariff. Add API, hardware and training costs separately.

[S3: MLCommons: whole-system power](https://mlcommons.org/benchmarks/inference-edge/) / [R7: Comparison rationale, measurements and protocol](ai-agent-comparison.md)

### 16. Does neural processing time include settlement?

**Neural processing and settlement latency are different.** Four-agent neural computation plus features took 304–349 ms; cycles including local transactions/RPC took 7.68–9.35 s. The 4 s target extends for slower cycles. These are neither single-agent response times nor public-chain finality.

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R7: Comparison rationale, measurements and protocol](ai-agent-comparison.md)

### 17. Why not a small AI model or a reservoir?

**They are essential controls; efficiency alone is not uniquely biological.** Fixed circuits with learned readouts already exist. We must compare biological wiring against random circuits and small models for temporal decisions. The seven-neuron foraging experiment did not establish an advantage over direct inputs.

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md) / [S4: ESN primary paper, §2.1](https://www.ai.rug.nl/minds/uploads/techreport2.pdf)

### 18. What makes the comparison fair?

**Match inputs, actions, quality, request rate and measurement scope.** Compare rules, small MLP/RNNs, LLMs and BioAgent on unseen data. Measure usable-action p50/p95, failures, RAM and joules/decision. LLM planning plus a small action controller is another future option.

[R7: Comparison rationale, measurements and protocol](ai-agent-comparison.md)

Distinguish hypotheses from measurements. AI agents are not limited to LLMs. R7 contains the protocol.
