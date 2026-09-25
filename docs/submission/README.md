# Submission package — BioAgent

Prepared 2026-09-26. This is a local prototype and a specification proposal, not an assigned EIP. The text below is ready to adapt to the submission form. No external form has been submitted.

## Short description

**Tiny agents, traceable lives.** BioAgent explores how applications can describe an agent's model origin, sensory input, body state and learning history. Two playable demos connect registered flies to blockchain events: an embodied foraging arena and a paper-trading competition driven by a real Uniswap V3 pool on Anvil.

## What we built

In Fly Lab, a user sends an onchain stimulus to one of three registered agents. The browser consumes its event and the agent responds. Eating changes fullness and energy reserves; the changing belly visualizes state that actually enters the policy observation. Lower-performing flies pause with a question bubble, train a candidate and return after evaluation.

In Market Meadow, price controls execute test-token swaps against locally deployed Uniswap V3 core. Three registered flies see the same Swap events but use different initial policies and seeded exploration. Paper orders fill only on later blocks using size-specific pool quotes. The leaderboard includes pool fees, price impact and an explicit assumed gas cost. A learning fly stops deciding while its holdings remain exposed.

Both apps share typed identity, body, input and runtime-view concepts. Their profiles specialize the action space and outcome: food and movement versus paper trades and PnL. The UI exposes source transactions, live connection state, model references, actual encoded observations and learning outcomes.

## Why a BioAgent profile?

Agent identity alone does not explain what a biological model represents or why an individual changed. Our proposed profile describes biological or synthetic origin, sensory and motor mappings, internal body dynamics, plasticity and reproducibility. It separates external stimulus from internal state and separates a readable view from a replay-capable checkpoint.

We researched existing identity, state, AI and token standards before refining this scope. We do not claim those standards cannot carry the data. The contribution is the interpretation of biological/embodied state and learning across applications. NFT and SBT were analogies for a base specification and its derivatives; neither token feature is required or implemented.

See [prior-art research](../standards/prior-art-and-bioagent.md), [design direction](../standards/bioagent-design-direction.md), [profile proposal](../standards/embodied-learning-profile.md), [Solidity draft](../standards/bio-agent-draft.md) and [application types](../standards/application-types.md).

## How it works

- **Contracts / Foundry:** owner-controlled registration, explicit input revision, full status events, optional schema-tagged stimulus payloads with independent nonces, optional declared wallet reference.
- **Runtime:** browser-based synthetic foraging Q-learning and market reward estimation; shared synthetic body dynamics; deterministic foraging checkpoint restore including active training.
- **Market source:** pinned Uniswap V3 core factory artifact, local pool and callback harness, verified Swap receipts and block-pinned quotes. The live demo does not call the Trading API.
- **Frontend / hosting:** original procedural fly drawings, continuously parameterized bellies, emotional bubbles, English/Japanese/system language, local Cloudflare Workers.
- **Common types:** strict TypeScript views and domain profiles, explicit units and string-encoded token amounts. Full cross-runtime protocol migration is still future work.

## Demo script (about one minute)

| Scene | Say / show |
| --- | --- |
| Registered flies | “Three individuals, each linked to an onchain registry and a model reference.” |
| Send a stimulus | Submit forage conditions; show the actual TX and event reaching its agent. |
| Feed a fly | “Body state enters the observation, so the belly is more than decoration.” |
| Open Market Meadow | “The same vocabulary, a different application: a real V3 pool on a local chain.” |
| Run price sequence | Show independent buy/hold/sell decisions and paper PnL. |
| Open source TX | Distinguish the real pool Swap from the simulated paper fill. |
| Learning | Show stationary fly, question bubble, candidate selection and return. |
| Close | “Synthetic models today; biological provenance and portable learning are the specification's direction.” |

Video and reproducible recording: [English two-app demo](../demo-video.md). Local output: `artifacts/two-app-demo/bioagent-two-apps-english.mp4`, with `evidence.json`.

## Evidence and reproduction

Start with [local Anvil/Workers](../deployment/local-anvil.md), then [Market Meadow](../design/local-market-app.md). `local:market` creates a new market; do not use it to resume an existing competition. The current validation instance uses GUI port 8799, RPC 18546 and `.local/embodied`.

| Claim | Check / evidence |
| --- | --- |
| Ownership, input bounds, revision/nonce and events | `forge test --root contracts`: 23 passing tests, including fuzz cases |
| Common application types | `npm run test:types`: type compilation and 3 runtime tests |
| Body affects observation/action; replay during training | `npm run test:body`: 4 passing controlled tests |
| Paper fill timing, costs, failed-quote atomicity, learning exposure | `npm run test:paper`: 4 passing tests |
| Foraging real TX → reaction → receipt | `LOCAL_STATE_DIR=.local/embodied LOCAL_GUI_URL=http://127.0.0.1:8799 npm run test:local`; `artifacts/local-chain/verification.json` |
| Real pool swaps → 3 agents → paper fills / learning / receipt | `LOCAL_GUI_URL=http://127.0.0.1:8799 npm run test:market`; `artifacts/market-browser/evidence.json` |
| System/en/ja and mobile | `LOCAL_STATE_DIR=.local/embodied npm run test:i18n`, market browser test |
| Build / formatting | `npm run build`, `npm run format:check` |
| Video integrity | Full ffmpeg decode, representative frames and Chrome MP4 playback |

The combined arena, agent, swap, body, paper and translation unit suite passes 22 tests, in addition to the 3 shared-type runtime tests and 23 Foundry tests. Browser scripts write fresh evidence when run; generated artifacts are not committed.

## Honest boundaries

- The current models are **synthetic**, not MaleCNS neural-circuit execution or biologically validated physiology.
- Learning candidate selection is visible and reproducible locally; it does not establish out-of-sample improvement, trading skill or profitability.
- Market balances and orders are paper-only. The real onchain swaps use local test tokens.
- Foraging checkpoint restore is a trusted local format. Cross-implementation replay, portable learning attestations and persistent reorg rollback are not implemented.
- Wallet association is a declared address reference, not deployed smart-wallet control or spending authority.
- No Sepolia deployment has been performed. Public Workers have not been updated to this two-app local version.
- No EIP number, standards approval or compliance certification is claimed.

## Deliverables checklist

- [x] Base concepts, explicit non-goals, prior-art review and two application profiles.
- [x] Typed views used by both GUIs; Foundry registry and optional stimulus extension.
- [x] Two playable local apps with blockchain provenance, current status and learning visibility.
- [x] Body-state input, procedural belly and local deterministic checkpoint evidence.
- [x] Real local Uniswap pool and three-agent paper competition.
- [x] English demo recording, reproducible checks and submission narrative.
- [ ] External submission form, team metadata and final hosted URL: fill in when the actual submission destination is selected.
