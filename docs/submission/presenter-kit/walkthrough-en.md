# BioAgent | From purpose to demo

## What we want to achieve

Build a framework for running biologically derived decision models on onchain inputs, adapting from experience, and comparing their effectiveness and resource use.

For agent developers and researchers: reuse input validation, model provenance and learning records to discover when biological circuits are useful.

## A roughly one-minute script

We are building a framework for using biological decision models in applications and testing whether learning helps. First, we record the environment, including hazards, in a transaction. A confirmed stimulus then adds food, and the agent chooses movement or rest. Learning replays that environment and experience, adopting an improved candidate. The demo lets us trace inputs, decisions and learning. A separate controlled experiment improved reward, but did not establish a biological advantage. Next, we will compare the same task against small AI models, measuring adaptation speed and resource use.

One minute is a suggested speaking time, not a guarantee of TX or training completion.

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

## 1. Make biological decision models usable and testable

- For agent developers and researchers
- Aim: economical repeated decisions and adaptation
- Built: traceable inputs, models and learning results

**Lower power and an advantage over ordinary AI remain hypotheses.**

Lead with the intended improvement: the cost of routine decisions and repeated integration work. Reuse input validation and model/learning descriptions. Developer-time savings have not been measured.

## 2. Record the environment and stimuli in TXs

- Initial TX: dimensions, seed and hazards
- Stimulus TX: one confirmed positive input adds one food
- Open the environment and food source TXs on screen

**All external inputs to the flies come from onchain data.**

The owner initializes the environment. Workers checks hourly and sends to Agent #1 at least one hour apart. Show recorded TXs within a minute. Registration, zero stimulus, duplicates and failed TXs add no food.

## 3. Turn the confirmed world into movement or rest

- Verify TXs and events before applying inputs
- Encode the environment and internal body state
- 7 measured neurons, 19 connections → action → outcome

**Encoding, body state, decisions and rendering run offchain.**

Measured wiring supplies the topology; dynamics and sensory/motor mappings are engineered. Consumed food disappears. Clicking selects an agent; it does not create food.

## 4. Replay experience and compare the candidate

- Select an agent and “Start learning”
- Update Q-values from a confirmed-world copy and experience
- Higher comparison score: adopt / Otherwise: keep

**Same-environment replay is separate from unseen-world testing.**

The wiring stays fixed. Training copies never add visible food. Recovery on returning from training is not a learned improvement. The full-market video uses separate online readout updates, without this adoption gate.

## 5. Separate working integration from improved behavior

- Public: a scheduled TX increased food from 3 to 4
- Video: four full agents, 2 Aqua and 25 V3 settlements
- Research: reward 18.79 → 56.12; direct-input control 56.08

**Integration and learning work; biological superiority is unproven.**

These are saved observations from three different tracks. Research used five search seeds and 60 unseen worlds per profile; final body energy also fell. The new recording includes current environment TXs. Full-foraging readouts are separate from public Q-learning.

## 6. Measure useful decisions within a small budget

- Compare small AI models on the same inputs and task
- Measure reward, failures, adaptation, RAM and joules/action
- Apply to Uniswap execute/hold and Aqua offer/withdraw

**Lower operating cost could encourage adoption; that is unmeasured.**

The current market uses custom FlyV3Router and V3 core, not Universal Router or Trading API. Savings would accrue to agent operators. User growth, protocol revenue and energy savings have not been measured.

[Q&A](qa-cheatsheet-en.md) · [Current TX evidence](../judge-demo-review.md) · [Research](../../research/bioagent-adaptation/README.md) · [Video evidence](capture-evidence.json)
