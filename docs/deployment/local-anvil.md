# Anvil + local Workers: onchain inputs for three agents

This runs entirely on your PC. No Cloudflare account/token, Sepolia ETH, or browser wallet is required. Public Workers and Sepolia are not modified.

| Component | Implementation | Default |
| --- | --- | --- |
| EVM | Foundry Anvil, chain ID 31337 | http://127.0.0.1:8545 |
| Contracts | BioAgentStimulusRegistry implementing IBioAgentRegistry / IBioAgent | Deployed at startup |
| Web app | Wrangler workerd, Static Assets, local-only API | http://127.0.0.1:8798 |
| Agent runtime | Browser Arena | MOMO #1, SORA #2, KIKI #3 |

Interfaces themselves are not deployed. The deployment script creates the registry implementation and registers agents through `IBioAgentRegistry`.

## Prerequisites and startup

Use Node.js 22+, Python 3.11+ for Python tests, and Foundry v1.8.3 (`forge`/`anvil`). Solidity is pinned to 0.8.30. Initial dependency/compiler downloads require network access.

```sh
npm ci
git submodule update --init --recursive
npm run local:up
```

Tools are resolved from PATH or `~/.foundry/bin/`. Override with absolute `FORGE` / `ANVIL` paths:

```sh
FORGE=/path/to/forge ANVIL=/path/to/anvil npm run local:up
ANVIL_PORT=8555 LOCAL_GUI_PORT=8808 LOCAL_INSPECTOR_PORT=9258 npm run local:up
```

Startup builds assets/manifest, starts its own Anvil on an unused port, verifies chain 31337 and Anvil client identity, broadcasts `DeployLocalArena.s.sol`, and verifies five receipts: CREATE, three registrations, and initial world submission. It writes `.local/deployment.json` and `.local/wrangler.json`, then runs `wrangler dev --local`.

Open [the GUI](http://127.0.0.1:8798) after the Ready message. Ctrl-C stops only processes started by this command. Each launch creates a fresh chain; it refuses occupied ports rather than stopping existing processes.

## Try the GUI

1. Check connection to ANVIL / 31337 and the three named agents.
2. Select one using the field, leaderboard, or inspector arrows.
3. Set Forage, 95% stimulus, and 90% energy supply, then send the stimulus transaction.
4. Follow submitted → mined → received → applied, with TX hash, block, log index, and revision.
5. Observe the selected agent. The other agents' Status inputs remain unchanged.
6. Try Rest to increase the tendency to rest; it need not stop every movement.

Initial Status is Rest / 5000 / 0 / revision 1. The world TX defines dimensions, seed, hazards, and food bounds. No food exists before a positive stimulus; agents wait. Each successful positive stimulus adds one shared food. Eating removes it permanently until a new stimulus. Field clicks select agents; the snack control also submits a TX.

**All external inputs to the flies come from onchain data.** `submitStimulus` supplies the world; `updateStatus` supplies activity/stimulus/supply. Initial payload source: [foraging-world.json](../../packages/bio_agent/browser/foraging-world.json). There is no local-value fallback. A new world TX rebuilds the field and clears old food.

Anvil/Sepolia share UI, decisions, and learning. Body, position, and policy are computed internal state. Playback speed is an observation control. Learning replays confirmed-world copies without adding visible food. Inspect world/food provenance in the input-TX panel.

## Transaction-to-action path

1. GUI POSTs agentId, expectedRevision, activity, energy, and stimulus to `/api/chain/status`.
2. Worker validates and encodes `updateStatus` for the fixed registry.
3. Anvil's unlocked owner sends `eth_sendTransaction`; no key is handed to GUI/Worker.
4. Contract validates owner, ranges, and revision and emits StatusUpdated.
5. ChainSession polls logs through the Worker every 600 ms.
6. Verified event values, not HTTP submission success, update the target agent.
7. The next 200 ms tick (at 1×) computes actions; rendering continues independently.

Pause stops simulation, not event intake. Background browser throttling may delay polling.

| Contract | Runtime / GUI |
| --- | --- |
| Activity 0 / 1 / 2 | Rest / Explore / Forage |
| energy 0–10000 | Supply 0–1, displayed as 0–100% |
| stimulus 0–10000 | Stimulus 0–1, displayed as 0–100% |
| revision uint64 | Applied revision as a decimal string |

Input energy is supply, not the inspector's computed body ENERGY.

## API and storage

[Full API reference](../reference/local-api.md). GET config identifies the mode/model/IDs; snapshot pins state and cause logs to a block; events return logs after a cursor; receipt reports pending/mined/reverted; health checks Anvil/deployment consistency. POST status writes only configured agents.

Logs are restricted to the registry and sorted by block/transaction/log index; eventId and revision prevent duplicates. Reopening retrieves the latest chain inputs. Onchain definitions, Status, and events are distinct from browser-local body, scores, experience, and policies. Exported JSON is not a complete resume file. See [current storage boundaries](../architecture.md#4-state-ownership) for persisted policy/consumption state.

A rollback or revision gap reinitializes the competition from a canonical snapshot; it does not exactly undo historical movement or learning. After restarting Anvil, regenerate configuration with local:up and reload the GUI.

## Local-only signing

The local entrypoint is separate from `wrangler.sepolia.jsonc` deployment. It requires loopback RPC, chain 31337, Anvil client identity, a localhost GUI, same-origin JSON, IDs 1–3, and a fixed owner/registry/function. It exposes no arbitrary RPC forwarding or transfers and uses no public-network key or root Cloudflare credentials. Public signing uses an authenticated owner wallet instead.

## Verification

With the app running, use a second terminal:

```sh
npm run test:local
npm run format:check
npm run test:arena
make contracts-test
make test
```

`test:local` reads `.local/deployment.json`, refuses public URLs, and accepts `CHROME_PATH`. It changes local state, temporarily controls automining, and uses snapshots/reverts; do not run during a presentation or recording.

Coverage: registrations/manifest hash, world/food only after mining, receipt/event/runtime agreement, foraging-versus-rest decisions, per-agent isolation, duplicates/stale revisions/ranges/origin rejection, external TX intake, reload, reorg resync, desktop/mobile, and JS errors. Outputs are `artifacts/local-chain/verification.json`, `desktop.png`, and `mobile.png`.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Occupied port | Choose other ports; preserve existing processes |
| Missing forge/anvil | Install pinned Foundry or set absolute tool paths |
| Registration failed | Inspect `.local/forge.log`, submodule, and compiler |
| Worker failed | Inspect Wrangler output and inspector port |
| Waiting / Deployment changed | Align Anvil/configuration, restart local:up, reload GUI |
| RevisionMismatch | Receive the latest revision, then retry deliberately |
| Waiting for application | Inspect mining/receipt; do not automatically resend |
| Learning agent is stationary | It temporarily leaves competition and returns after learning |

[Foundry Anvil](https://www.getfoundry.sh/anvil/index.html) · [Cloudflare local development](https://developers.cloudflare.com/workers/local-development/)

## Historical verification — 2026-09-25

Anvil, registry, three registrations, and workerd started successfully. Foundry 16 tests, runtime 4, Python 2, and 12 local browser checks passed without desktop/mobile JS errors. In one 30-decision sample, Forage produced 29 moves/1 rest, versus 6 moves/24 rests for Rest. This is behavior verification, not biological validation.

- Forage TX: `0x8eb4fdc28473660206dea1520a85c80cfd9849f488d2b7e7e9c824f6893cceb4`.
- Rest TX: `0x4ba418b47903ba785fea33001c2d1742cc633c2b1f3ed4427655a3799d19a014`.

These hashes existed only on that temporary Anvil, not a public explorer or later restarted chain. That verification did not modify public Workers/Sepolia.
