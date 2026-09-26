# MaleCNS learning infrastructure

The [166, 700-neuron / 25, 582, 938-edge runtime](../../docs/design/malecns-full-local.md) is separate. The three learning paths below use a lightweight measured MaleCNS v1.0 subcircuit. They train small action readouts while keeping neural connectivity fixed; they do not establish biological validity.

| Task     | Implementation                                             | Adoption and persistence                                                                                                      |
| -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Foraging | `bio_agent/browser/arena.js` + `browser/learning.js`       | 960 environment updates in chunks; improved Q-values selected on fixed courses apply on the next tick; versioned localStorage |
| Market   | `bio_agent/runtime/paper-arena.js` + `browser/learning.js` | Chunks of 256 updates; lower chronological selection MSE applies on the next Swap; versioned localStorage                     |
| Aqua     | `browser/aqua-learning.js`                                 | Fit readout gain on 192 synthetic examples, select on 64; apply through a new Status revision, local KV, and a new strategy   |

`learning.js` defines shared reports and compute budgets. `readout.js` validates task, identity, and graph bindings when saving/restoring artifacts. GUI learning adopts only improved candidates and does not add a fixed wait after completion.

See [algorithms, consistency, measurements, and reproduction](../../docs/design/malecns-learning.md). Main checks: `npm run test:male-learning`, `npm run benchmark:male-learning`, and `npm run test:male-learning:browser`.

Python `make train` is a reference threshold-calibration job using the same subcircuit and four synthetic labels. It establishes no generalization result and does not automatically apply artifacts. Keep it distinct from GUI-connected learning.
