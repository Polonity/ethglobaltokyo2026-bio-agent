# GUI demonstration guide

For the chain-connected three-agent Fly Lab, see [architecture](../architecture.md), [local setup](../deployment/local-anvil.md), and [Sepolia](../deployment/sepolia.md). Older recordings capture earlier UI/model milestones; use current [application guides](../apps/README.md) for labels.

## Message and controls

Onchain Status supplies inputs. Agents receive verified events, compute actions, and learn from experience. Candidate evaluation may keep the old policy; rejection is a valid outcome.

| Area | Observe |
| --- | --- |
| Chain panel | Connection, selected input revision, TX/block/log |
| Foraging field | Movement, shared food, hazards, selection |
| Leaderboard | Food, rank, time |
| World input | Selected agent's activity, stimulus, energy supply |
| Inspector | Body energy, decisions, experience, score, policy version |
| Learning | Progress, candidate comparison, adoption/rejection |
| Field notes | Input and learning events |

The latest-submission card retains its target even if selection changes. Selected-agent evidence follows the selected agent; do not confuse these two scopes.

## One-minute demonstration

Show connection and names, then submit Forage / 95% stimulus / 90% supply to MOMO. Follow TX → revision → applied input and behavior. Try Rest / 0% stimulus / 40% supply, then Explore / 80% / 85% for SORA to show independent inputs. Demonstrate learning and explain adoption only after evaluation. Rest need not mean complete immobility, and scores vary by run.

Editing controls does not send a TX. Sending stimulus updates Status; positive confirmed events add food. World/hazard changes also require TXs. Speed/pause, learning, and JSON export are offchain operations. Training copies do not add visible food. Pause does not stop event intake; pending transactions never affect the agent early.

## Troubleshooting and evidence

Check Anvil/Wrangler/configuration when waiting for connection. For revision conflicts, receive the latest state before retrying. Inspect receipts before resending. Stationary agents may be paused, resting, low-energy, or learning. Reload restores chain inputs, not an exact previous trajectory. See [storage boundaries](../architecture.md).

[Recording](../demo-video.md) produces real GUI footage plus TX/event/decision/learning evidence; subtitles do not inject model state. Shared persistent-runtime checkpoint recovery, SSE, and cross-browser body synchronization are separate from this browser path.

Mascots and bubbles summarize implemented state, not measured emotions. Learning holds position; rest, hazard, and food messages reflect current decisions. The narrator summarizes waiting, pause, learning, competition, and completion.

Clicking a TX retrieves its receipt; pending, removed, and failed transactions are not shown as successes. Local history disappears when Anvil resets. `apps/frontend/explorer.js` uses local receipts for chain 31337, Sepolia Etherscan for 11155111, and Ethereum Etherscan for 1; invalid hashes/unknown chains get no link. Verify routing with `node --test tests/explorer.test.mjs`.
