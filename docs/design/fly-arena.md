# Fly Lab environment

[Local Anvil setup](../deployment/local-anvil.md) · [Public Sepolia demo](../deployment/sepolia.md). Both use `apps/frontend/` and `packages/bio_agent/browser/arena.js`.

## Input principle

**All external inputs to the flies come from onchain data.** The initial environment is also created through a TX.

- `IBioAgentStimulus.submitStimulus` with the world schema defines dimensions, seed, food bounds, and hazards.
- Per-agent `updateStatus` records activity, stimulus, and supply conditions.
- Each successful positive-stimulus event adds one food; coordinates derive from its TX and the recorded seed.
- A new world TX rebuilds the field and clears old food.
- Pending, failed, and duplicate TXs add nothing. Consumed food is not automatically replaced.

`registry-read.js` checks receipts, events, and canonical blocks. `tx-world.js` / `tx-food.js` apply them; full-neuron mode shares these transformations. Execution waits for a verified environment and pauses on RPC failure.

## Computation and learning

Body, movement, consumption, scores, and policy are offchain internal state derived from recorded inputs. A measured MaleCNS slice of 7 neurons and 19 connections processes encoded sensory inputs; Q-values select eight movement directions or rest. Full mode uses a separate Python runtime and readout learning.

Browser learning replays experience and copies of the confirmed environment. It adopts improved candidates under identical comparison conditions. Training copies never add visible food. This is a comparison under current conditions, not independent proof of generalization.

Playback speed/pause are observation controls. Browsers share chain inputs, not synchronized body/policy state. Consumption history and policies are persisted locally.

## Offline experiments

Synthetic `createWorld` environments are for offline research and controls, not chain-connected Anvil/Sepolia execution. Historical twelve-agent browser experiments are not the current public-demo specification.
