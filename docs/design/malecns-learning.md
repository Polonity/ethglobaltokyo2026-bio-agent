# Required MaleCNS inference, task learning, and immediate adoption

Recorded 2026-09-26. This lightweight three-app milestone supersedes earlier synthetic-only/no-Aqua-learning descriptions. The [full runtime](malecns-full-local.md) and [full-app learning](full-app-learning.md) are separate paths. None establishes biological validity or trading profitability.

## Required model

All three tasks use measured MaleCNS v1.0 connectivity; missing/tampered artifacts stop execution rather than falling back to synthetic models. The slice contains7 neurons/19 edges with original IDs/counts, not a whole brain or identified mushroom-body/lateral-horn/CX model.

- Dataset: `male-cns:v1.0`.
- Graph SHA-256: `0xfa923a4bdf0c41af7d0fc9197507f0935adcee957a6417c765db9700d46df987`.
- [MaleCNS](https://male-cns.janelia.org/), CC-BY-4.0; [provenance/extraction](circuit-evidence.md).
- Encoder: `packages/bio_agent/connectome/male-cns.js`; shared training: `packages/training/browser/`.

## Task paths

| Task     | Engineered input                                                                    | Learned component                                     | Selection                                                                         | Application                                   |
| -------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| Foraging | Food alignment, hazard, fullness, energy, stimulus, activity for 9 candidate drives | Nine-action Q-values keyed partly by circuit response | Improved reward on three fixed courses outside fit; not independent final testing | Next0.2 s tick                                |
| Market   | Up/down magnitude, holdings, fullness into4 drives                                  | Hold/buy/sell immediate-reward predictions            | First70% chronological fit, last30% MSE selection; not profit selection           | Next confirmed Swap                           |
| Aqua     | Artificial risk × per-agent sensitivity                                             | Response gain in0.5–2                                 | Least squares on 192 synthetic samples, selection MSE on 64                       | New Status revision, save, dock old, ship new |

Priors, exploration, balance limits, and low-energy rest are engineered controls. Circuit responses affect observation keys/initial action values; ablation tests their contribution. Aqua target=`0.24*risk`, not learned market risk or a DAN model. Raw response≥0.1 always withdraws even if the fitted gain would weaken that signal.

## Efficiency

Quantize drive to1/256 and cache32-tick zero-state responses. At most257 entries per graph, 514 including ablation. This is the declared quantized model, not zero approximation error for arbitrary continuous input.

Foraging runs960 environment updates as ten96-update batches (~2 s at 1×), plus equal-size memory replay where available. Reported updates count environment updates. Adoption follows evaluation without the old fixed8 s delay.

Market fits12 epochs in chunks of 256 updates; small datasets can complete next0.2 s learning tick. Holdings remain marked during learning. Aqua solves one-coefficient least squares using sufficient statistics rather than prolonged gradient training.

## Artifacts and consistency

`bioagent.learning-result.v1` records useCase, graph digest, base/version, before/after, samples/updates, adopted, metric, applies=next-decision, and changed components. Wiring remains fixed.

Foraging/market persist `bioagent.readout.v1` in localStorage keyed by registry, registered model hash, and agent. Reject different task/graph bindings. Reload restores the policy, not positions, market positions, or ledger. Storage failure permits tab-local operation without durable persistence. Full Arena checkpoint replay is a separate capability.

Aqua uses local Wrangler `AQUA_LEARNING` KV by registry/base-model/agent/revision. Strategy policyHash links to learning; the contract checks owner/base-model/current revision, not neural execution. Confirm a new revision first to invalidate old strategies, then save policy, dock, and ship. These operations are non-atomic; refresh/retry after partial failure. A revision without a saved policy uses the initial readout but still requires MaleCNS. This is not production multi-site policy distribution.

Manifests bind graph/dynamics/encoder/learner/readout/runtime hashes; GUI verifies before execution. Builds reject a changed pinned graph. Model-source changes require fresh registered hashes in a dedicated environment.

## Reproduce

```sh
npm ci
ANVIL_PORT=18547 LOCAL_GUI_PORT=8800 LOCAL_INSPECTOR_PORT=19250 \
  LOCAL_STATE_DIR=.local/malecns npm run local:up
LOCAL_STATE_DIR=.local/malecns npm run local:market
LOCAL_STATE_DIR=.local/malecns npm run local:aqua
LOCAL_STATE_DIR=.local/malecns npm run local:circuit
LOCAL_STATE_DIR=.local/malecns npm run local:foraging
npm run test:male-learning
npm run benchmark:male-learning
LOCAL_GUI_URL=http://127.0.0.1:8800 npm run test:male-learning:browser
```

Run local: up in one terminal, then the add-on deployments in another with the same state directory. The recorded GUI was8800 (`/`, `/market`, `/aqua`). Public deployment status at this historical milestone is superseded by [Sepolia](../deployment/sepolia.md).

## Recorded evidence

Node 22.14.0 benchmark: 4096 direct32-tick calculations146.08 ms; cold cached9.15 ms; warm0.38 ms. Foraging batch maximum5.53 ms, evaluation startup5.13 ms, Aqua calibration0.32 ms. Hardware-specific, not a device/browser guarantee. Evidence: `artifacts/male-learning/benchmark.json`, `browser-evidence.json`, PNGs.

Verified foraging v1→v2 adoption/reload, Aqua gain and203→270 bps application, and tampered-artifact rejection. The market example rejected a non-improving MSE candidate; controlled unit tests separately verified adoption/next-decision use.

Python backend step uses the same fixed graph; `python -m packages.training` is a synthetic-label calibration reference, not automatic GUI policy delivery. Recorded final checks: 39 Node, 29 Foundry, 2 Python tests; browser learning/persistence/tamper rejection, languages/mobile, actual Aqua swaps and V3 input swaps, and independent Circuit Lab Python agreement.
