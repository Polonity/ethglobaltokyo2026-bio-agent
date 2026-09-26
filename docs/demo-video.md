# Demo recordings and reproduction

Use the [presenter kit](submission/presenter-kit/README.md), [documentary production](submission/presenter-kit/documentary-production.md), and [English script](submission/presenter-kit/documentary-script-en.md) for the current full-length human-narrated video. Japanese subtitles/scripts are comprehension editions. Historical silent clips below are retained as evidence, not current2–4-minute submissions.

## Documentary

English:`artifacts/documentary/bioagent-documentary-narrated-en.mp4`; Japanese subtitles:`bioagent-documentary-narrated-ja.mp4` in the same directory. Both use the presenter's English recording. Silent3: 56reviews remain available; narrated duration is approximately 3: 57.5 with a final-frame extension. [Production/source/verification details](submission/presenter-kit/documentary-production.md).

## Historical shared market

[60-second English clip](submission/evidence/shared-market-demo-en.mp4), [verification](submission/evidence/shared-market-demo-verification.json), [captions](submission/evidence/shared-market-demo-en.srt). Recorded2026-09-26: 1600×1120, 30 fps, H.264/faststart,~8.9 MB, silent.

Actual8814 GUI: MOMO/SORA offers, KOHARU/HINATA trades, route comparison, marked PnL, receipts, model/policy evidence. Eight cycles added5 Aqua fills/11 V3 swaps; cumulative counters were preserved. Four independent166, 700-neuron states used online readout updates. No result injection; decode/browser/representative visual checks passed.

Chapters: 0–6overview, 6–19roles, 19–35routes/actions/learning, 35–39PnL versus gas, 39–46receipt, 46–54official contracts/tokens/model, 54–60limits. This is artificial demand and local test-token settlement, not public adoption/profit/biology evidence. [Guide](apps/shared-market/README.md).

With the market paused and existing transactions available, the recorder resumes real local trades for about 30 seconds, then stops:

```sh
node scripts/full/record-shared-market.mjs
```

Output:`artifacts/shared-market-demo/shared-market-demo-en.mp4`.

## Historical two-agent Aqua

[61.04-second English clip](submission/evidence/aqua-current-demo-en.mp4), [evidence](submission/evidence/aqua-current-demo-verification.json).1600×1050, H.264/faststart, silent. Two full-model agents, shared wallet, official fork, 10 actual fills, receipt transfers. Uses saved policies, not retraining during capture.

```sh
AQUA_DEMO_CAPTIONS=1 AQUA_EVIDENCE_OUTPUT=artifacts/aqua-current-demo-20260926 node scripts/submission/verify-aqua-fork.mjs
```

[UI conventions](design/player-experience.md). Older captures below record earlier UI; changing the recorder does not retroactively update footage.

## Historical full-model task clips

Under `artifacts/full-app-demos-20260926/`: foraging-english.mp4 (stimulus0.75, body/actions/TX), market-english.mp4 (real input history, paper PnL), aqua-english.mp4 (offers/withdrawals/real test-token TXs/proxy reward). Each is about 1 minute, 1600×1100, H.264, silent English GUI/captions.

Sequence: guide→screen help→current-policy run→state→input/action trace→receipt→saved evaluation. Each agent uses 166, 700 neurons/25, 582, 938 edges with engineered dynamics/mappings. The saved table is explicitly historical evaluation, not newly performed learning. Guide screenshots are historical examples too.

```sh
node scripts/record-full-app-demos.mjs
node scripts/verify-full-app-demos.mjs
```

Requires8812 GUI/Anvil, Chrome, ffmpeg, npm. Recording sends local TXs and rejects an active job. Override FULL_APPS_URL/DEMO_OUTPUT. Evidence JSON records inputs/outputs/neuron counts/TXs/evaluation/captions/browser errors; verification checks full decode and Chrome seek/playback. Receipt excerpts enlarge actual fetched fields and are labeled. Reruns replace same-named outputs; preserve evidence together.

## Historical two-app + Circuit Lab cut

`artifacts/submission-demo/bioagent-submission-english.mp4`:~90 seconds, 1600×1100, H.264, silent. Shows synthetic foraging/body and paper market, then measured7-neuron/19-edge stimulus0→100%, ablation, receipts, and provenance. It explicitly distinguishes the models and does not claim full-profile interoperability/biology.

After [local](deployment/local-anvil.md), [market](design/local-market-app.md), and [circuit](design/circuit-evidence.md) setup, without redeploying a running environment unnecessarily:

```sh
LOCAL_GUI_URL=http://127.0.0.1:8799 node scripts/record-submission-demo.mjs
node scripts/verify-submission-video.mjs
```

Requires Chrome, ffmpeg, Node, Python standard library. Outputs include video, evidence.json, exported circuit-evidence.json independently checked in Python, screenshots/raw WebM, and playback/decode verification. Reruns overwrite this bundle, not separate earlier clips. No agent-state injection.

The circuit-only supplement is `artifacts/circuit-browser/bioagent-circuit-evidence-en.mp4`; see [reproduction](design/circuit-evidence.md) and [scope audit](submission/goal-audit.md).

## Historical53-second two-app cut

`artifacts/two-app-demo/bioagent-two-apps-english.mp4`: 1600×1100, H.264, silent English. Actual foraging inputs/body, V3 input swaps, paper fills/PnL, receipts, and learning. Evidence stores captions/TXs/body/market/browser errors; Git-ignored.

```sh
LOCAL_STATE_DIR=.local/embodied ANVIL_PORT=18546 LOCAL_GUI_PORT=8799 LOCAL_INSPECTOR_PORT=9250 npm run local:up
# Another terminal; local:market creates a new market session:
LOCAL_STATE_DIR=.local/embodied npm run local:market
LOCAL_GUI_URL=http://127.0.0.1:8799 node scripts/record-two-app-demo.mjs
```

Requires Foundry on PATH, Chrome, ffmpeg; do not concurrently change the chain. This historical synthetic-model cut is not MaleCNS execution/public deployment/real-fund trading evidence.

## Original local foraging recordings —2026-09-25

Japanese:`node scripts/record-demo.mjs`; English:`node scripts/record-demo-en.mjs`. Start local: up first. The original sequence submits MOMO Forage90%energy/95%stimulus, then Rest40%/0%, SORA Explore85%/80%, then automatic learning/return. At that milestone the model was browser Q-learning, not MaleCNS; 3, 840-step candidate evaluation could reject a candidate.

Recorders read `.local/deployment.json`, restrict loopback/chain 31337, and use actual GUI Status writes. CHROME_PATH overrides Chrome. No public deployment. Japanese output:`artifacts/demo/fly-lab-anvil-demo.mp4` (1600×1100, 25 fps, H.264/faststart); English:`artifacts/demo-en/fly-lab-english-demo.mp4`. Each retains evidence.json, final.png, raw/. Same-edition reruns overwrite; English does not overwrite Japanese.

Captions/85%zoom are presentation-only; test observation APIs are read-only, with no model-state injection. Verify registrations, event application, movement/rest counts, learning completion/position freeze/return, receipt success, and no JS exceptions. Decode the full export and inspect representative caption frames plus Chrome playback:

```sh
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of json artifacts/demo/fly-lab-anvil-demo.mp4
ffmpeg -v error -i artifacts/demo/fly-lab-anvil-demo.mp4 -f null -
```

The old English capture uses en-US and selects English explicitly. Its end card states the historical integration limits. Do not run test: local or another chain-mutating job while recording.
