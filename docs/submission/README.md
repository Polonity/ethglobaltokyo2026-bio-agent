# Submission package — BioAgent

Prepared 2026-09-26. This is a local prototype and a specification proposal, not an assigned EIP. The text below is ready to adapt to the submission form. No external form has been submitted.

## Short description

**From verifiable events to biologically grounded action.** BioAgent proposes a profile for agents that use connectome-derived structure to generate actions. It connects onchain input provenance with model origin, sensory mappings, body state and learning history. Two synthetic demos — foraging and paper trading — illustrate the proposed interaction model.

## Motivation and standardization position

Onchain records give independent participants a shared reference for the source and history of inputs. Agent infrastructure is developing around ERC-8004, which remains a Draft at the time of review. We build toward compatibility with common agent infrastructure, adding the information needed to interpret a model's biological origin and engineered assumptions. Current contracts do not implement ERC-8004.

This is an extension profile, not a replacement for general agent identity, communication or wallets. Body state and learning are also useful to ordinary AI agents. The stronger rationale is the source-to-circuit correspondence and the ability to distinguish measured structure, artificial sensory/motor mappings and learned components. Independent ERC status requires further interoperability evidence.

See the [Japanese/English pitch](bioagent-thesis.md) and [primary-source research and design judgment](../standards/why-bioagent.md). A separate [Circuit Lab](../design/circuit-evidence.md) now executes a measured seven-neuron MaleCNS topology with explicitly artificial dynamics and readout. The two games remain synthetic; no biological fidelity or performance advantage is established. See the [goal audit](goal-audit.md) for remaining work.

## What we built

In Fly Lab, a user sends an onchain stimulus to one of three registered agents. The browser consumes its event and the agent responds. Eating changes fullness and energy reserves; the changing belly visualizes state that actually enters the policy observation. Lower-performing flies pause with a question bubble, train a candidate and return after evaluation.

In Market Meadow, price controls execute test-token swaps against locally deployed Uniswap V3 core. Three registered flies see the same Swap events but use different initial policies and seeded exploration. Paper orders fill only on later blocks using size-specific pool quotes. The leaderboard includes pool fees, price impact and an explicit assumed gas cost. A learning fly stops deciding while its holdings remain exposed.

Both apps share typed identity, body, input and runtime-view concepts. Their profiles specialize the action space and outcome: food and movement versus paper trades and PnL. The UI exposes source transactions, live connection state, model references, actual encoded observations and learning outcomes.

## Evidence for the biological-source claim

Circuit Lab binds a common descriptor to three onchain simulation instances. It preserves seven original MaleCNS neuron IDs and 19 connection counts, verifies local artifact hashes against the registered descriptor, and shows a real status transaction driving the graph-based calculation and an advance/wait action. A graph-removal control isolates dependence on the connections. An independent Python implementation matches the exported traces within 1e-12 absolute tolerance.

This is a topology-derived engineering model, with artificial excitatory dynamics and an engineered decoder. It has no learning or body simulation, and is not a whole-brain or biologically validated fly model. The two game arenas retain their synthetic policies.

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

## Demo script (two apps + circuit evidence)

| Scene | Say / show |
| --- | --- |
| Registered flies | “Three individuals, each linked to an onchain registry and a model reference.” |
| Send a stimulus | Submit forage conditions; show the actual TX and event reaching its agent. |
| Feed a fly | “Body state enters the observation, so the belly is more than decoration.” |
| Open Market Meadow | “The same vocabulary, a different application: a real V3 pool on a local chain.” |
| Run price sequence | Show independent buy/hold/sell decisions and paper PnL. |
| Open source TX | Distinguish the real pool Swap from the simulated paper fill. |
| Learning | Show stationary fly, question bubble, candidate selection and return. |
| Open Circuit Lab | “A measured MaleCNS topology: seven neurons, nineteen connections, with artificial dynamics.” |
| Send 0% then 100% | Show real transactions and wait→advance, compared with an edge-removal control. |
| Inspect source | Show registered descriptor, provenance and engineered assumptions. |
| Close | “Two synthetic games and one topology-derived experiment; biological validation and full portability remain future work.” |

Supplement: [Circuit Lab recording and checks](../design/circuit-evidence.md).

Latest integrated video and reproduction: [English submission demo](../demo-video.md). Local output: `artifacts/submission-demo/bioagent-submission-english.mp4`, with `evidence.json` and exported circuit traces.

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

The combined arena, agent, swap, body, paper, circuit, explorer and translation unit suite passes 27 tests, in addition to the 3 shared-type runtime tests and 23 Foundry tests. Browser scripts write fresh evidence when run; generated artifacts are not committed.

## Honest boundaries

- The two games are **synthetic**. Circuit Lab uses a small measured MaleCNS topology with artificial dynamics; none of these models establishes biologically validated physiology.
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
- [x] Minimal measured-connectivity example, source/artifact binding and independent scalar replay check.
- [ ] Full connectome integration into both games, biological validation and cross-application portability.
- [ ] External submission form, team metadata and final hosted URL: fill in when the actual submission destination is selected.
