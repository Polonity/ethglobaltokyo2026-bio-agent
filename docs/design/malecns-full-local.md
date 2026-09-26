# Full MaleCNS local experiments

Recorded 2026-09-26. Keep the lightweight browser demo while evaluating the full model locally before deciding whether reduction is necessary. [Acceptance record](../submission/full-local-acceptance.md): two full-neuron agents, mid-run input changes, stop/restore, and approximately 30 fps rendering checked in a real browser.

## Why the earlier slice had seven neurons

The slice selected DNp01 body 10001 and six strongly connected outputs, retaining 19 edges. It was a minimal browser-friendly provenance/TX/response/artifact demonstration. It was **not** selected after proving all other neurons unnecessary, nor validated as a behavior-preserving reduction. It remains useful for the public demo but does not constrain local research.

## Definition of full

FlyWire's female adult brain count (139, 255) is distinct from this project’s MaleCNS brain-and-ventral-nerve-cord dataset. [FlyWire](https://home.flywire.ai/) · [MaleCNS](https://male-cns.janelia.org/) · [Download specification](https://male-cns.janelia.org/download/).

For `male-cns:v1.0`, use **all 166, 700 annotation rows with non-null superclass**, from 211, 577 rows. No extra filtering by region, cell type, status, degree, weight, or behavior; no Traced-only filter.

| Item                                     |         Count |
| ---------------------------------------- | ------------: |
| Classified neurons                       |      166, 700 |
| Internal connection pairs                |  25, 582, 938 |
| Retained synapse counts                  | 124, 177, 617 |
| All-segment source connection rows       | 151, 856, 684 |
| Unclassified annotation rows             |       44, 877 |
| Boundary rows with one included endpoint | 117, 436, 340 |

This is the induced graph of classified neurons, **not the full segmentation graph**. Unclassified fragments/glia are not counted as additional identified neurons. Excluded boundary counts/weights are recorded in the manifest; upstream confidence 0.5 remains. Boundary effects are unmeasured, not evidence that excluded fragments are biologically irrelevant.

## Implementation and assumptions

- `scripts/full/prepare.py`: verify official source hashes and build the sparse graph, retaining all included IDs, isolated nodes, self-edges, and counts.
- `packages/bio_agent/full/model.py`: CPU NumPy/SciPy float64; shared CSR `W[post, pre]` with independent 166, 700-element state per agent (1–3 agents). Every neuron updates each step.
- `packages/bio_agent/full/__main__.py`: dedicated loopback API/GUI, independent of Anvil/Workers.
- `scripts/full/benchmark.py`: full stimulus, zero/ablated controls, complete restore, and seven-neuron comparison.

Counts remain unchanged. Default incoming normalization divides each receiver's summed drive by its total incoming count; global-max is a comparison option.

```text
drive = (W @ activity) / divisor + external_input
activity_next = 0.75 * activity + 0.25 * tanh(drive)
```

All-positive rate dynamics omit neurotransmitter signs, delays, spikes, and measured time constants. A step is not biological milliseconds. Inputs drive DNp01 or whole ol_sensory/cb_sensory/vnc_sensory populations uniformly; this does not reproduce receptors/receptive fields. Population means are observations, not validated thought/emotion/motor decoders.

## Setup

Run from the root; reuse an existing venv if present.

```sh
python3 -m venv .local/connectome-tools
.local/connectome-tools/bin/python -m pip install -r packages/bio_agent/full/requirements.txt
npm run full:prepare
npm run test:full
npm run full:benchmark
npm run full:dev
```

GUI: http://127.0.0.1:8810/. Older lightweight apps: port 8800, `/market`, `/aqua`.

Prepare downloads missing sources (~1.1 GB), verifies hashes, and refuses to overwrite mismatched sources. Generated data lives in `.local/malecns-full/`, outside Git. Preparation needs more RAM than inference; verified on a 64 GB host, with no measured minimum.

Options: `npm run full:dev -- --port 8811 --normalization global-max`, `--agents 1` or `--agents 3`; default is two. Ctrl-C stops this dedicated server only.

Select stimulus strength/population per agent. Rendering aggregates neurons but computation retains all 166, 700. State persists across requests; reset for zero-state comparisons. Checkpoints contain full state and reject mismatched graph manifest, runtime-file hash, normalization, or agent count. Re-preparing a changed manifest invalidates old checkpoints.

This dedicated screen sends no TXs and does not replace the three applications' registrations, policies, or contracts.

## Initial measurements and reduction decision

`artifacts/malecns-full/benchmark.json`, 2026-09-26, this host, CPU float64:

| Measurement                                 |       Result |
| ------------------------------------------- | -----------: |
| CSR matrix                                  |   293.41 MiB |
| Benchmark peak RSS                          |     ~443 MiB |
| Graph load/verification                     |      ~0.80 s |
| 3 agents × 32 steps, DNp01                  |      ~2.00 s |
| 3 agents × 32 steps, sensory population     | ~1.91–1.93 s |
| Updated state elements                      | 16, 003, 200 |
| Continuous versus save/resume maximum error |            0 |

Agents share the matrix, not activity; stimuli were 0.2/0.5/1.0. Two-second 32-step batches enable interactive experiments but do not establish a 5 Hz game with 32 steps per action.

Full/slice comparison uses the same DNp01 input, 32 steps, six readout neurons, and **full-derived normalization**. At stimulus 1.0, full versus slice mean readout was ~0.010002 vs 0.009562 for incoming, and ~0.011033 vs 0.009848 for global-max. Omitted paths affect responses; this alone establishes neither neuron importance nor learning superiority.

The full model fits memory and remains the local reference. Reduction should be justified by task performance, unseen conditions, response error, and compute budget, not assumed necessary.

## Continuous rendering and scaling

`npm run full:scaling` compares 1–3 agents. Original CSR multicolumn computation took ~57 ms/step even for two agents. A sequential per-agent vector kernel retained all neurons/edges and float64, with maximum state difference 0.

`artifacts/malecns-full/agent-scaling.json`; medians of three 16-step runs:

| Agents      | Neural steps/s | ms/step |
| ----------- | -------------: | ------: |
| 1           |           62.9 |    15.9 |
| 2 (default) |           30.6 |    32.7 |
| 3           |           20.4 |    49.0 |

These exclude HTTP/statistics/rendering. Continuous mode batches four fully computed steps per request and permits no overlapping compute requests. Input changes apply at the next request, with corresponding four-step latency.

Rendering uses a separate requestAnimationFrame loop targeting 30 fps. Neural steps/s includes API/statistics wall time; render fps counts animation callbacks, not GPU paints. A browser sample showed 25.5 neural steps/s and 30.1 render fps for two agents, versus 19.9–21.2 before batching. Biological time remains uncalibrated.

## Validation and learning boundary

Seven tests cover scalar agreement, agent isolation, ablation, zero input, checkpoint replay/model mismatch, invalid inputs, tampering, kernel equivalence, and batch equivalence. `npm run test:full:browser` requires Chrome and the default two-agent server on 8810; it checks response, exact restore, English/Japanese/System, mobile, and API rejection. Outputs: `full-local-en.png`, `full-local-ja-mobile.png`, `browser-evidence.json` under `artifacts/malecns-full/`.

This milestone established full fixed-graph state updates, not all task learning. See [lightweight learning](malecns-learning.md), [full-app integration](full-app-learning.md), and [acceptance](../submission/full-apps-acceptance.md). Continuous full state cannot blindly reuse the older zero-state 32-step response cache.
