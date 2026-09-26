# Circuit Lab — checking that measured connectivity participates in computation

Historical verification, 2026-09-26. Circuit Lab tests the project's connectome claim; it is not a third competition replacing foraging/market. Statements about the older synthetic applications belong to this milestone; see [later learning integration](malecns-learning.md).

## Run

Start local Anvil/Workers, then:

```sh
npm run build
# Use the same state directory as the running local:up instance:
LOCAL_STATE_DIR=.local/embodied FORGE=/tmp/bio-agent-foundry-v1.8.3/forge npm run local:circuit
# http://127.0.0.1:8799/circuit
LOCAL_GUI_URL=http://127.0.0.1:8799 npm run test:circuit:browser
```

FORGE is optional when on PATH. Defaults are `.local` and GUI 8798. `local:circuit` deploys a new dedicated registry and three agents with the same descriptor; it does not resume an old session or write the foraging/market registries.

Select an agent and submit 0%/100% stimulus. Only confirmed Status stimulus is used. The mean activity of six output nodes selects advance/wait. Open TX receipts for evidence. This reuses the existing foraging ABI as an adapter and explicitly ignores activity/energy; it is not a universal new ABI.

## Measured data and engineered model

| Element       | Definition                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| Source        | MaleCNS v1.0 official annotations/connectome weights                                                          |
| Selection     | bodyId 10001 (DNp01) plus six annotated postsynaptic neurons with highest counts; ties by ascending body_post |
| Graph         | 7 neurons / 19 internal edges, retaining original IDs/counts                                                  |
| Dynamics      | Discrete rate model, all connections positive, normalized by maximum count                                    |
| Input         | stimulus/10000 added directly to neuron 10001                                                                 |
| Time          | 32 synchronous updates from zero; no biological seconds assigned                                              |
| Readout       | Mean of six non-input nodes; advance at ≥0.1, otherwise wait                                                  |
| Learning/body | None in this circuit test; fixed wiring/weights/decoder                                                       |
| Display       | Illustrative positions, fly movement, and colors, not measured activity/geometry                              |

`a_next = 0.75*a + 0.25*tanh(sum(count/maxCount*a_pre) + externalDrive)`

Boundary edges are dropped. Neurotransmitter signs, membrane potentials, physiological parameters, and muscle connections are not inferred. Connectome-derived means measured structure participates in computation, not brain emulation. Three agents are independent instances of one specimen's graph. Each revision is an independent zero-state trial, not continuous biological history.

## Provenance and integrity

`packages/bio_agent/connectome/male-cns-slice.json` records source URLs/hashes, extraction-code hash, selection, attribution, and modifications. Extracted data is CC BY 4.0, attributed to FlyEM / HHMI Janelia, University of Cambridge, MRC LMB, and Google Research; this implies no endorsement.

`scripts/build-circuit.mjs` creates exact-byte SHA-256 references for graph, extraction, dynamics, sensoryMapping, and motorMapping. Registry modelHash identifies the descriptor. GUI verifies registration and local artifacts before permitting execution/submission.

This checks delivered-artifact integrity, not source-file signatures, biological validity, or proof of browser execution. The validator handles this fixed bundle, not every proposed profile.

## Re-extract source data

The committed slice suffices for normal use. Re-extraction needs about 1 GB and pyarrow:

```sh
python3 -m venv .local/connectome-tools
.local/connectome-tools/bin/pip install pyarrow==21.0.0
mkdir -p .local/connectome-source
curl --fail --location --retry 2 https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/body-annotations-male-cns-v1.0-minconf-0.5.feather -o .local/connectome-source/annotations.feather
curl --fail --location --retry 2 https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/connectome-weights-male-cns-v1.0-minconf-0.5.feather -o .local/connectome-source/weights.feather
.local/connectome-tools/bin/python scripts/extract-male-cns.py
git diff --exit-code -- packages/bio_agent/connectome/male-cns-slice.json
```

The script recomputes source hashes. Changed upstream files or extraction code require reviewing a new version; mismatches must not be silently accepted. Source data and the Python environment stay outside Git.

## Evidence and API

- `npm run test:circuit`: zero/strong stimulus, edge ablation, checkpoint resume, malformed graphs, and hash/provenance rejection.
- `npm run test:circuit:browser`: actual registrations and 0→100% TXs, wait→advance, receipts, languages/mobile, tampered artifacts, and cross-origin rejection.
- Independent standard-library Python matched 3 agents × 2 conditions × 32 ticks within 1e-12. This is kernel agreement, not full-profile conformance.
- Re-extraction matched the committed JSON. At stimulus 1.0, mean response ≈0.150742; with all edges removed it was zero although the input neuron remained active. This establishes dependence, not superiority to random graphs.

Outputs: `artifacts/circuit-browser/evidence.json`, `verification.json`, desktop/mobile images.

`/api/circuit/config|snapshot|events|status|receipt` reuse the local registry API, pinned to its registry/hash/deployment. Loopback, Anvil 31337, same-origin, owner, and revision checks apply; there is no public generic proxy/signing endpoint.

## Supplemental recording

```sh
LOCAL_GUI_URL=http://127.0.0.1:8799 RECORD_CIRCUIT=1 npm run test:circuit:browser
```

Records the English GUI, stimulus changes, ablation, receipts, and sources to `artifacts/circuit-browser/bioagent-circuit-evidence-en.mp4` without audio, overwriting that output.
