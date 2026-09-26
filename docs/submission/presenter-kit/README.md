# BioAgent presenter kit

Start with the [documentary production guide](documentary-production.md) and [English narration script](documentary-script-en.md); [Japanese translation](documentary-script-ja.md) is for comprehension. The latest local documentary includes the presenter's own English recording and lasts approximately 3: 57.5. English/Japanese subtitle editions are under `artifacts/documentary/`.

## Foraging validation and historical cuts

[English40.3-second clip](bioagent-foraging-validated-en.mp4) · [Japanese clip](bioagent-foraging-validated-ja.mp4) · [Results and limitations](foraging-validation.md) · [Playback/TX verification](foraging-video-verification.json).

The validated clip contains a normal-speed run and explicitly labeled0.25× replay of the same actions. Held-out results: 24/24 food, 91.9% approach; safety criterion failed and unique biological advantage is unproven.

The historical57.1-second integrated cut below predates that fix. Its market settlement evidence remains valid historical evidence; use the updated clip/documentary for foraging.

| Material                              | English                                                   | Japanese                                                  |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| Historical integrated cut             | [MP4](bioagent-submission-en.mp4)                         | [MP4](bioagent-submission-ja.mp4)                         |
| Six explanation slides + architecture | [PDF](explanation-en.pdf) · [PPTX](explanation-en.pptx)   | [PDF](explanation-ja.pdf) · [PPTX](explanation-ja.pptx)   |
| Walkthrough                           | [Script](walkthrough-en.md) · [HTML](explanation-en.html) | [Script](walkthrough-ja.md) · [HTML](explanation-ja.html) |
| Four-page Q&A                         | [PDF](qa-cheatsheet-en.pdf) · [Text](qa-cheatsheet-en.md) | [PDF](qa-cheatsheet-ja.pdf) · [Text](qa-cheatsheet-ja.md) |

[Combined eight-page Q&A](qa-cheatsheet-ja-en.pdf) · [Language-switching HTML](qa-cheatsheet.html).

The historical integrated masters are57.1 s, 1920×1080, 30 fps, H.264, silent, using the same243.1-second raw capture and separate lower caption bands. [English SRT](captions-en.srt) / [Japanese SRT](captions-ja.srt). Setup/navigation/long waits are cut; retained segments use original speed. Learning-wait cuts and receipt excerpts are labeled. No results/balances are injected.

Slide 7 is the architecture/Q&A appendix: languages, responsibilities, and communication. [English architecture](../../architecture.md) · [Japanese](../../architecture.ja.md). The brief explanation uses slides 1–6.

## Purpose

Build a framework to run biologically derived decision models on onchain inputs, adapt from experience, and compare effectiveness/resource use. Intended users are agent developers/researchers. Lower power/cost and superior adaptation remain hypotheses.

## Historical57-second edit

| Time        | Scene                                                  |
| ----------- | ------------------------------------------------------ |
| 0–4 s       | Purpose                                                |
| 4–10 s      | TX-defined initial world                               |
| 10–14.1 s   | Actual world receipt                                   |
| 14.1–20.1 s | Actions and experience                                 |
| 20.1–27.1 s | Same-input candidate comparison, learning wait omitted |
| 27.1–32.1 s | Measured structure, engineered dynamics                |
| 32.1–40.1 s | Four full-model market agents                          |
| 40.1–46 s   | Fresh Aqua settlement                                  |
| 46–52 s     | Fresh Uniswap V3 settlement                            |
| 52–57.1 s   | Framework for testing benefits and limits              |

## Evidence from that take

**Foraging acceptance failed in that recording.** The opening had untrained directional bias; collection was fully random; both agents collected zero food on the separate-layout test. [Diagnosis](foraging-behavior-review.md) is distinct from [later validation](foraging-validation.md).

Two full-model foragers consumed TX-defined world/hazards/food. Both policies replayed identical confirmed input TXs. MOMO retained its old policy (5.20→−1.54 candidate); SORA adopted (4.08→8.64). Separate-condition rewards were−6.29/−12.79, not evidence of improved generalization.

The four-agent market added**2 Aqua fills and25 V3 swaps over 14 cycles**. All27 successful receipts, ERC20 Transfers, and contract events were checked by RPC. Displayed cumulative counters include earlier runs. All four agents received14 readout updates; three changed saved weights. This demonstrates the update path, not profitability.

Each agent computes166, 700 neurons/25, 582, 938 connections, sharing the fixed graph while keeping independent state. Measured wiring plus engineered dynamics is not validated whole-brain biology.

Neural processing across 14 market cycles was304.1–349.5 ms (median324.0 ms); complete local cycles7.679–9.354 s (median8.642 s), excluding cadence wait. Python peak RSS443.1 MiB is not whole-system RAM/power/public-chain finality latency.

The recording changed artificial demand targets to85%/15%, then stopped and restored70%/30%. Balances/learning were preserved. [Capture](capture-evidence.json), [settlements](settlement-evidence.json), [resources](resource-evidence.json).

## Public boundary

[Sepolia page](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en): 7 neurons/19 edges, 3 agents, shared Anvil/Sepolia UI and Q-learning, TX-defined external world/food. Observation/learning requires no wallet; it sends no Aqua/Uniswap orders.

Video uses local full Python foraging selection and market online updates. These differ from public Q-learning and the independent JS framework. Cross-application skill transfer is unproven.

Local receipts have no Etherscan TX URL. Market fork origin: Ethereum block 26, 058, 941; execution chain 31337. Official Aqua:`0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`. Tokens/transactions are local tests.

## Q&A sources

| Ref          | Evidence                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| R1           | [Capture](capture-evidence.json), [settlements](settlement-evidence.json), [resources](resource-evidence.json)            |
| R2           | [Shared market](../../apps/shared-market/README.md)                                                                       |
| R3           | [Independent experiments](../../research/bioagent-adaptation/README.md)                                                   |
| R4           | [JS framework](../../../packages/bioagent-framework/README.md)                                                            |
| R5           | [Sepolia](../../deployment/sepolia.md), [public walkthrough](public-walkthrough.json)                                     |
| R6           | [World/scheduled TX checks](../judge-demo-review.md)                                                                      |
| R7           | [AI comparison](ai-agent-comparison.md)                                                                                   |
| R8           | [Architecture/languages](../../architecture.md)                                                                           |
| Verification | [Decode/playback/hashes](verification.json), [visual review](artifact-review.json), [PDF/PPTX audit](document-audit.json) |
| Editing      | [Source/edit times](render-metadata.json), [production plan](production-plan.md)                                          |

Q&A separates power/memory/latency/adaptation hypotheses from measurements. Do not infer power savings from RAM or say all LLMs require256 GB. PDFs were visually checked; PPTX structure/text/notes were audited, not native PowerPoint rendering.

## Reproduce the historical integrated recording

Use Node/Chrome/ffmpeg and prepared full data. Defaults: paused foraging8856, market8857, market fork18577, `.local/presenter-current-market`, foraging artifacts `artifacts/submission-presenter-rerecord/foraging`. Override PRESENTER_FORAGING_URL, PRESENTER_DEMO_URL, PRESENTER_MARKET_RPC, PRESENTER_MARKET_STATE, PRESENTER_FORAGING_ARTIFACTS consistently. Do not record during an active job or reset another chain.

```sh
node scripts/submission/record-presenter-demo.mjs
PRESENTER_DELIVERY=artifacts/submission-presenter-rerecord/delivery node scripts/submission/collect-presenter-settlements.mjs
PRESENTER_DELIVERY=artifacts/submission-presenter-rerecord/delivery node scripts/submission/summarize-presenter-resources.mjs
node scripts/submission/render-presenter-demo.mjs
```

New takes stage under `artifacts/submission-presenter-rerecord/delivery/`. Review MP4 s/evidence, preserve the previous delivery, then copy both MP4 s/SRTs and capture/settlement/resource/render JSONs here.

```sh
node scripts/submission/build-presenter-walkthrough.mjs
node scripts/submission/build-presenter-cheatsheet.mjs
node scripts/submission/verify-presenter-kit.mjs
```

Builders use delivered evidence. Fresh visual review is required after replacement; automation cannot validate narrative alone. Raw footage/screens/cuts remain local Git-ignored artifacts. Delivered files need no running chain. External forms are not submitted by these commands.
