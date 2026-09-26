# Foraging behavior review

[Japanese / bilingual edition](foraging-behavior-review.ja-en.md)

**Behavioral acceptance is not met.** This is a read-only reanalysis of the recorded run, not a new experiment. Playback, transaction and learning-update checks did not establish successful foraging.

- In the opening live run, MOMO takes action 0 (right) in all 27 decisions because every untrained readout score is zero and ties select the first action. Neither agent collects food.
- The collection phase uses `epsilon=1`: all 200 choices per agent are random among allowed actions, even though neural features are computed. It is not a learned-policy demonstration.
- On the selection layout, MOMO's candidate is rejected; SORA improves from one to two collected foods and is adopted.
- On the subsequent different-layout test, both agents collect zero food across 80 decisions each. Rewards are −6.29 and −12.79. That test does not establish successful generalization.

More training alone is not a proven remedy. Separate collection from execution, address the deterministic untrained tie behavior, and evaluate frozen policies on multiple unseen TX-derived layouts against untrained, random and direct-input controls. Measure collections, progress toward food, hazard contacts and body state. Record the resulting behavior only after it passes acceptance; do not replace learned behavior with direct target steering or cherry-picked layouts.

[Aggregate evidence](foraging-behavior-review.json) · [Original capture](capture-evidence.json) · [Read-only analysis script](../../../scripts/submission/review-foraging-behavior.py)

Reproduce from the preserved recording database with `python3 scripts/submission/review-foraging-behavior.py`. The script opens SQLite in read-only mode and does not send transactions or update policies. The local database is not distributed in this kit; the original capture retains the evaluation results.
