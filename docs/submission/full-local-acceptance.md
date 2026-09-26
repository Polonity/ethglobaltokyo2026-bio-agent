# Full-neuron local acceptance record

2026-09-26. The local full-model milestone passed: retain the lightweight browser demo, run all classified MaleCNS neurons locally, and evaluate reduction against that reference. Default two agents, configurable to1–3.

[Machine-readable evidence](evidence/full-local-acceptance.json) records source/runtime/GUI hashes, times, and measurements.

| Criterion                       | Result                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| Full computation                | 166, 700 neurons and25, 582, 938 internal edges per agent, float64 state                 |
| Independent responses           | Two agents visibly respond to different stimuli                                          |
| Approximately30 fps observation | 30.1 animation callbacks/s, separate from neural computation                             |
| Continuous computation          | 25.5 neural steps/s including API/statistics; four-step batches skip no internal updates |
| Mid-run input changes           | GUI stimulus1.0/0.0 appears in subsequent computation                                    |
| Stop                            | No new computation after stopping at tick420                                             |
| Restore                         | Exact agreement with continuous execution                                                |
| Reduction comparison            | Full versus7-neuron matched-input tests and1–3-agent scaling                             |
| Reproduction                    | Setup, source boundary, original reduction rationale, and comparison documented          |

Seven numerical/isolation/checkpoint/input/tamper/batch tests plus real-browser controls, languages/mobile, and rejection paths were checked.

## Reproduce

Follow [data preparation](../design/malecns-full-local.md), then start the dedicated server and verify in another terminal:

```sh
npm run full:dev
npm run verify:full
```

GUI: http://127.0.0.1:8810/. Continuous run accepts slider updates; Stop ends computation. Acceptance tests change state/checkpoints, so preserve any experiment you need first. Outputs: `artifacts/malecns-full/`. Re-measure with `npm run full:benchmark` and `npm run full:scaling`; speed varies with load.

## Interpretation

The full model fits local resources, so this milestone gave no reason to return to seven neurons. The original slice was a browser integration choice, not evidence other neurons are unnecessary.

This acceptance covers the classified-neuron computation experiment, not every segmented fragment, physiological reconstruction with transmitter signs, or the separate three-task learning/onchain integration milestone. Keep those evidence scopes distinct.
