# Sepolia / shared Fly Lab

[English demo](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en) · [Japanese demo](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja)

**All external inputs to the flies come from onchain data.** Confirmed transactions supply the initial environment, hazards, food, activity, stimuli, and supply conditions. Sensory encoding, body state, decisions, and learning execute offchain.

## One-minute check

1. Open the page without a wallet and observe three agents.
2. Inspect environment/food input TXs for hazard initialization and food provenance.
3. Each confirmed positive-stimulus TX adds one yellow food. Eating removes it without automatic refill.
4. Open learning to replay the confirmed environment. Training copies never add visible food.

A new browser replays stimulus history since the current world TX. Consumed-food IDs persist locally and do not reappear on reload. Browsers share onchain inputs, not body, consumption, or learning state.

## Inputs and shared implementation

| Input                    | Transaction and processing                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial world/hazards    | Agent #1 `submitStimulus`, schema `bioagent.foraging-world.v1`: width, height, seed, food bounds, hazard positions/radii                      |
| World change             | A new TX with that schema rebuilds the field and clears previous food                                                                         |
| Activity/stimulus/supply | Per-agent `updateStatus`; one successful positive-stimulus event adds one food. Registration, zero stimulus, duplicates, and reverts add none |
| Food coordinates         | Deterministically derived from TX hash and recorded world seed/dimensions                                                                     |

Unverified world inputs, model mismatches, stale Sepolia blocks, or RPC failure pause execution; there is no fallback to a synthetic local world. Receipts are checked against canonical blocks with zero additional confirmation depth. This is not finality or a cryptographic proof of neural execution.

- Shared UI: `apps/frontend/`, identical HTML/CSS/JS for Anvil and Sepolia.
- Shared behavior/learning: `packages/bio_agent/browser/arena.js`.
- Shared world/food: `tx-world.js` / `tx-food.js`, also used by full-neuron Anvil foraging.
- Shared event verification: `services/worker/registry-read.js`.
- Environment differences: RPC, chain ID, registry, polling interval, and signing adapter. Anvil uses a local account; manual Sepolia writes use the owner's wallet.

The old Sepolia-only UI, RPC proxy, and audit code were removed. [foraging-world.json](../../packages/bio_agent/browser/foraging-world.json) supplies deployment initialization, but connected runtimes read TX-recorded values. Offline synthetic research worlds are separate.

## Scheduled TXs and gas

Cloudflare Cron → `StimulusScheduler` Durable Object → Registry. The scheduler checks hourly and sends a positive stimulus to Agent #1 at least one hour apart. It runs without an open browser and exposes no public HTTP signing trigger.

Signer: test EOA **0x0d01a92bae0E01754f7102466936397F609D67C3**, reusing authorized test funds. Its key is a Cloudflare Secret, never a browser/static asset. This is currently an EOA, not a smart wallet.

- Minimum one-hour send interval; retries/concurrent invocations reuse the same durably journaled signed TX.
- Caps: 60, 000 gas and 3 gwei; 24 transactions cost at most **0.00432 Sepolia ETH** under those caps.
- Rolling 24-hour budget: 0.005 ETH; balance reserve: 0.001 ETH. Exceeding limits skips sending.
- [Scheduler status API](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/api/stimulus-scheduler) exposes the latest hash/status.

Balance at the recorded check was approximately 0.01636 ETH, not a current balance quote. Budget safeguards are not evidence of a completed 24-hour endurance run. See [TX and browser verification](../submission/judge-demo-review.md).

## Deployment and reproduction

Ethereum Sepolia / **11155111** / agent IDs **1, 2, 3**.

- Registry: [`0x09DF8a4feEaceB690Da135d8355B84A6691c323B`](https://sepolia.etherscan.io/address/0x09DF8a4feEaceB690Da135d8355B84A6691c323B).
- [Initial world TX](https://sepolia.etherscan.io/tx/0xbe67b3bb2e1e2ed1a84a1582a8cfa4f7ccd9afa522e0a6f916a93c8a7a6542dc) · [Deployment record](../../contracts/deployments/sepolia.json).
- Uses an existing `BioAgentStimulusRegistry` with checked deployed bytecode. Previous registry is retained in `previousRegistry`.

```sh
npm ci
npm run sepolia:build
npm run sepolia:dev           # localhost:8836; reads real Sepolia
npm run test:sepolia          # isolated Anvil input/retry checks
npm run test:sepolia:browser  # reads running localhost:8836
npm run test:sepolia:public   # reads public page; no writes
npm run sepolia:prepare      # balance and gas estimates
npm run sepolia:deploy       # resume deployment/initial inputs from journal
npm run sepolia:publish      # update this Worker
```

Requires Node.js 22, Chrome, and Foundry. `.local/sepolia/` keystore, passphrase, and signed journal are excluded from Git. Do not delete journals to bypass budgets or retry controls. Deployment passes only Cloudflare credentials from `.env`. Set the signing key through stdin to `wrangler secret put SEPOLIA_SIGNER_KEY --config wrangler.sepolia.jsonc`.

## Public demo versus submission video

The public browser model uses a measured **7-neuron / 19-edge subgraph**, not an equivalent compression of a full brain. It does not trade on Aqua or Uniswap. The submission recording uses **166, 700 neurons per agent** on local Anvil: two-agent foraging with world TXs and same-input readout comparison, followed by four-agent Aqua/V3 settlement. Long waits are cut. Public Q-learning and full Python learning are separate implementations.
