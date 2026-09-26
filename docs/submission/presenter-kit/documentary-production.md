# Documentary production and human narration

Silent review cuts are **3: 56, 1920×1080, 30 fps**, with English/Japanese subtitles. They were prepared for recording the presenter's own English narration; no synthesized voice was used.

- Review files: `artifacts/documentary/bioagent-documentary-review-{en,ja}.mp4`.
- Captions: `artifacts/documentary/bioagent-documentary-{en,ja}.srt`.
- Sources, cuts, playback rates, SHA-256: `artifacts/documentary/production.json`.
- Browser checks: `artifacts/documentary/browser-check.json`.

| Time        | Content                                                              |
| ----------- | -------------------------------------------------------------------- |
| 0: 00–0: 05 | Official-page hold, no captions, greeting space                      |
| 0: 05–0: 20 | Actual MaleCNS official-page screenshot                              |
| 0: 20–0: 30 | Introduce the built app, show MOMO/SORA GUI                          |
| 0: 30–0: 55 | Historical failure, normal speed and labeled0.25× replay             |
| 0: 55–1: 37 | Left-to-right processing animation; rationale and ridge regression   |
| 1: 37–1: 56 | Saved learning results and reward prediction; CPU name onscreen only |
| 1: 56–2: 36 | Improved run, labeled slow replay, stopped collection result         |
| 2: 36–3: 01 | Unseen-layout evaluation and failed safety criterion                 |
| 3: 01–3: 26 | 1inch Aqua Protocol, Uniswap v3, ERC-20 transfers                    |
| 3: 26–3: 51 | IBioAgent design, proposal, and credits                              |
| 3: 51–3: 56 | Closing hold, no captions, greeting space                            |

Collection captions follow counter changes in the slow replay. Old/new implementations are labeled; inputs/models/learning are not claimed identical across them. Market footage is a separate verified take with test-assets/Ethereum-fork labeling.

Animations are schematic, not neural recordings. Captions occupy a separate120 px lower band, clear of GUI/diagrams/credits. Source action footage is never sped up to fit.

Both review files passed full decode and Chrome playback, nine seeks, ending playback, dimension/duration checks, plus representative visual checks for captions/counters/credits. At the silent-review milestone, human narration was still pending; the narrated edition below completes that separate step.

## Rebuild review cuts

```sh
node scripts/submission/capture-malecns-intro.mjs
node scripts/submission/render-protocol-animation.mjs
node scripts/submission/render-protocol-animation.mjs protocol-design
node scripts/submission/render-documentary.mjs
node scripts/submission/check-documentary.mjs
```

Opening source: https://male-cns.janelia.org/, captured unmodified in Chrome. URL/time/hash: `artifacts/documentary/sources/malecns-official-page.json`.

The English script was shortened from 361 to238 words, roughly60 words/minute over 3: 56, leaving viewing pauses. Formal names and the reason for ridge regression remain; generic phrasing is simpler. CPU is displayed, not spoken. Short sentences explain recording neural features/actions/rewards and fitting action-reward predictions.

## Narrated edition

`artifacts/documentary/bioagent-documentary-narrated-en.mp4` contains English subtitles and the presenter's recording. The `-ja.mp4` counterpart uses Japanese subtitles with the **same English voice** for comprehension.

The presenter recorded while watching the video, so audio starts at zero offset. The recording lasts approximately 237.525 seconds; the final frame is extended about 1.525 seconds. Voice speed, volume, and pauses are unchanged. Existing subtitle timings remain; no word-level forced alignment is claimed. Silent review cuts are retained.

Rebuild: `node scripts/submission/add-presenter-audio.mjs <recording-path>`. `artifacts/documentary/narration-production.json` records duration and matching source/output AAC-packet hashes, verifying no audio truncation/change. Both streams are fully decoded; playback evidence is in `narrated-browser-check.json`.
