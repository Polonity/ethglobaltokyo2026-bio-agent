# Embodied foraging v2

Implemented 2026-09-26. `foraging-embodied-q-v2` is a synthetic Q-learning demonstration, not a MaleCNS simulation or validated physiology.

## Actual body loop

`body.js` defines fullness, reserves and slowly changing relative mass. Every 0.2 simulation seconds: digest up to 0.008 fullness, gain 0.35 of digestion in reserves, spend 0.003 reserves moving (0.0015 resting), then relax mass 1.8% toward `0.7 + 0.6 * reserves`. Feeding adds 0.3 fullness. Values are clamped; mass stays between 0.7 and 1.3. These are game assumptions.

The Q observation key now includes fullness and reserve bins. Fullness changes initial rest bias and the reward for collecting food. This is an explicit engineered body-to-policy coupling, not learned biological hunger. Candidate Q values still learn from experience, and are adopted only if the selection benchmark improves. Inference no longer mutates the Q table just to initialize unseen states.

The GUI uses the shared `ForagingView` adapter, displays actual body values and the last encoded observation, and changes belly size continuously from mass and fullness. Speech bubbles show hunger/fullness. Body evolves while training, while position remains fixed. Pause freezes the whole simulation. Round restart retains body and learned policy, resets energy/positions/scores explicitly as a game round boundary.

## Replay

`Arena.checkpoint()` serializes the entire arena including shared world, individual input/chain cursors, policies, memories, active training candidate/world/actor, and all Mulberry32 states. `Arena.restore()` resumes **trusted local** checkpoints only. It does not claim validation of arbitrary uploaded JSON or the full external artifact protocol. Different model versions are rejected.

`tests/body-checkpoint.test.mjs` verifies fed/fasted mass changes, different actual observations for the same environment with different bodies, and bit-for-bit continuation during active training. Exact replay is scoped to this JS execution model; no cross-engine floating-point claim is made.

## Verified local environment

A separate instance was started with `LOCAL_STATE_DIR=.local/embodied`, `ANVIL_PORT=18546`, `LOCAL_GUI_PORT=8799`, `LOCAL_INSPECTOR_PORT=9250`. Its Registry commits the new manifest hash. Default `npm run local:up` still uses 8545/8798. An older chain registering the v1 manifest must not be presented as the v2 model; restart an explicitly selected local instance or use a new one.

The full `test:local` browser path passed on 8799: registration, actual stimulus transactions, mined-event application, rest/forage behavior, stale writes/reorg handling, reload, desktop/mobile. Body unit/replay tests and existing arena/agent/swap tests also passed.

## Remaining work

Validated external artifact import, portable Transition/LearningEvidence construction, independent held-out biological/behavioral evaluation and MaleCNS integration remain separate milestones. A complete local serialized arena is progress toward checkpoint interoperability, not proof that all future profile requirements are implemented.
