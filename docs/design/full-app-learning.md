# Full-neuron experience and learning across applications

## Acceptance goal

Run foraging, paper-market, and Aqua with full MaleCNS, collect actual experience, train readouts, evaluate candidates, persist accepted policies, and compare the reduced model. A standalone full-neuron visualization is insufficient.

Each application must verify: all 166, 700 classified neurons/25, 582, 938 internal edges are used without silent fallback; observations/features/actions/policies/outcomes/rewards/provenance are linked; training uses actual outcomes; fresh selection runs gate adoption; subsequent actions use the adopted version; persistence rejects mismatched identity/task/model; full/reduced comparisons use matched action budgets and report neural steps/time separately; GUI exposes collection/training/evaluation/adoption.

## Shared infrastructure

`packages/bio_agent/full_apps/brain.py` shares the graph while separating task/session/agent activity. Sixteen engineered inputs drive sensory populations partitioned by sorted body ID. Every decision computes four steps. Input-population, motor-population, and superclass means feed readouts. Measured connectivity is combined with engineered encoding, all-positive rate dynamics, and output interpretation.

`learning.py` stores decisions/outcomes separately in SQLite, rejecting missing decisions and duplicate outcomes. Ridge regression predicts action rewards; market also compares a small decision tree using reserved prediction data. Training reuses saved neural features; it does not rerun inference repeatedly or modify wiring.

Fit uses the first 70% of experience; the last 30% provides reference prediction error. A separate selection run compares actual old/candidate rewards and verifies before/after against stored outcomes. Selection/test data never enters fit. A single seed does not prove generalization.

`__main__.py` and `scripts/full/brain-client.mjs` connect Node.js to Python via JSON Lines. `.local/full-apps/experience.sqlite3` separates policies by task, full/legacy mode, individual, and brain hash.

## Initial foraging pilot

`services/full-apps/foraging.mjs` adapts the field, food, hazards, progress rewards, feeding/rest, and body updates. The pilot began as CLI; the GUI on 8812 later connected Status TXs to the same lifecycle.

```sh
OPENBLAS_NUM_THREADS=1 .local/connectome-tools/bin/python -m unittest discover -s tests/full_apps -v
node scripts/full/pilot-foraging.mjs
```

Collect 240 actions per agent, then evaluate 96 steps on another seed. MOMO improved −1.3745 → 11.3984 and adopted v2, later used on a different seed. SORA worsened 0.6299 → −4.2786 and retained v1. This proves the acceptance/rejection loop, not universal improvement.

With the same environment and new learner, the older seven-neuron scalar encoder gave a final MOMO reward of 1.6336 versus full 11.9469. Two-agent neural time per decision was ~0.176 ms versus ~138.4 ms. This single trial also changes mappings, continuity, and steps per decision; it is neither a neuron-count-only ablation nor a comparison against the original browser Q learner. Evidence: `artifacts/full-apps/foraging-pilot.json`.

## Integration

Market uses actual Swap/block-pinned quotes for paper fills and rewards. Aqua executes SDK ship/dock and actual test-token swaps, then uses a proxy price valuation of balance changes as reward; it does not train against the older synthetic risk-target curve.

The applications share GUI lifecycle, persistence, policy hashes, and evaluation-case checks. Explicit full mode never falls back to the slice. See [acceptance and reproduction](../submission/full-apps-acceptance.md). Older Q-learning and synthetic Aqua calibration remain distinct baselines with different objectives.

Learning changes readouts, not full-connectome plasticity or identified physiological dynamics.
