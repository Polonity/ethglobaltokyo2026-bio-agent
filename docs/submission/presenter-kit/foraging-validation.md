# Foraging validation

[Japanese / bilingual edition](foraging-validation.ja-en.md)

**We test whether a Bio Agent learns to approach food from experience in a TX-defined world.** The earlier video exposed deterministic ties that always selected east and insufficient experience diversity.

1. Replace fixed tie-breaking with seeded random selection; add no target-steering rule.
2. Collect 768 actions per agent across 12 TX-defined worlds. Fit the readout on the first 70%; check reward prediction on the remaining 30%. All 166, 700 neurons remain in inference; connections stay fixed.
3. Select candidates on six separate worlds, replaying identical confirmed environment/stimulus transactions. Collection improves from 1 to 12 of 12 food items.
4. Freeze the candidates and compare on 12 untouched worlds with identical inputs. The two agents share 24 available food items in total.

| Held-out model                      | Food collected |     Moves toward food | Hazard steps |
| ----------------------------------- | -------------: | --------------------: | -----------: |
| Full connectome + learned readout   |    **24 / 24** | **577 / 628 (91.9%)** |            7 |
| Random                              |         4 / 24 |  793 / 1, 675 (47.3%) |           29 |
| Direct sensory ridge, no connectome |        23 / 24 |     670 / 777 (86.2%) |           23 |

**Foraging improved; a unique biological advantage remains unproven.** The small direct-input model also performs well using the same collected actions, rewards and ridge training. One training run and twelve paired test worlds do not establish statistical or general superiority.

**The frozen safety criterion failed.** Food collection ≥75%, approach ≥65%, and more food than random passed. At most one hazard step per world failed: the maximum was six. We retained the original criterion. Hazard steps count occupancy, not separate entries.

Engineered directional sensory encoding is explicit. Only the readout learns; fly thoughts, synaptic learning and power savings are not demonstrated. Environment/stimulus inputs are confirmed Anvil transactions; bodies and inference run off-chain. These full-model findings are not claims about the reduced Sepolia model.

## Evidence and reproduction

- [Machine-readable results, TX inputs and artifact hashes](foraging-validation.json)
- Historical failure: [previous video diagnosis](foraging-behavior-review.md)
- Scripts: `scripts/full/foraging-validation.mjs`, `fit-foraging-direct-control.py`, `test-foraging-validation.mjs`, `finalize-foraging-validation.mjs`, `publish-foraging-validation.mjs`.
- Use a fresh `FULL_APPS_STATE_DIR`, `FORAGING_VALIDATION_OUT`, and dedicated local Anvil via `FULL_RPC_URL`. Collect/select first; fit the direct control on its SQLite file; freeze and run final tests once. Preserve all test cases, including failures. New TX hashes can change food locations, so fresh reruns need not reproduce identical counts.
