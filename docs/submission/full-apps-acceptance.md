# Full-neuron experience learning in all three applications

Foraging, paper market, and Aqua use 166, 700 classified neurons/25, 582, 938 internal edges per agent. Two agents share CSR connectivity but have independent task/session/agent states. Unclassified44, 877 annotation rows and boundary edges are excluded. Encoding, rate dynamics, body, and readout are engineered, not physiological whole-brain reconstruction.

## Recorded results —2026-09-26

All six task×full/legacy cases ran through the GUI with receipts, candidate decisions, and subsequent actions. Restart restored policies for all tasks; stop and a foraging stimulus9000 TX were checked.

| Task     | Selection baseline → candidate (MOMO / SORA) | Adopted versions |
| -------- | -------------------------------------------- | ---------------- |
| foraging | −1.254 /1.110 →13.164 /−2.278                | v2 /v1           |
| market   | 0.000 /0.000 →−1.896 /2.387                  | v1 /v2           |
| aqua     | −1.423 /−1.423 →1.569 /1.554                 | v2 /v2           |

Non-improving agents retain old policies. Selection improvement does not guarantee success elsewhere. Additional evaluation: three foraging seeds, two market/Aqua intervals, 80 actions each. Rewards have different task-specific meanings and cannot be compared across rows.

| Task     | Full mean reward | Reduced mean reward | Full / reduced neural ms per two-agent decision |
| -------- | ---------------: | ------------------: | ----------------------------------------------: |
| foraging |            0.222 |              −3.348 |                                   157.56 /0.180 |
| market   |            0.367 |               4.019 |                                   155.21 /0.180 |
| aqua     |            1.534 |               1.590 |                                   156.45 /0.237 |

Full performed better in limited foraging trials; reduced performed better in market. No uniform full-model advantage was established. Keep full for research and reduced for the browser. In32 fixed-input/policy probes, removing edges changed at least one agent's maximum-score action in each task: computational dependence, not animal-behavior validation.

[Machine-readable acceptance](evidence/full-apps-acceptance.json) verifies an outcome for every SQLite decision, matching hashes, no selection/test leakage into fit, and adopted-policy use. `artifacts/full-apps/full-apps-english-demo.webm` shows post-restart operation/stop, not a complete newly recorded training cycle.

## Reproduce

Recorded environment: Foundry 1.8.3, Python 3.12, NumPy 2.2.6, SciPy 1.15.3. [Prepare data](../design/malecns-full-local.md). Lightweight GUI 8800, standalone full8810, integrated full apps8812. Public Workers do not host Python full inference.

```sh
npm ci
npm run full:prepare
forge build --root contracts
anvil --host 127.0.0.1 --port 18550 --chain-id 31337 \
  --max-persisted-states 100000 --cache-path .local/full-apps/anvil-history --silent
npm run full:apps:collect
npm run full:apps:dev
```

Open http://127.0.0.1:8812/. Running a policy sends slider values as Status TXs. The collect/train/evaluate workflow collects200 actions, compares old/candidate on 80 separate actions each, adopts improvements per agent, then runs another80-action test. Select full or seven-neuron encoder explicitly.

```sh
npm run test:full:apps
npm run test:full:apps:browser
npm run full:apps:compare
npm run full:apps:ablation
npm run full:apps:dev
```

Stop the GUI server after its job finishes before CLI comparison/ablation: an exclusive lock allows only one process to control chain/strategies. Restart reloads active strategies and adopted policies.

Browser checks use `/usr/bin/google-chrome`. Override FULL_RPC_URL/FULL_APPS_PORT for isolation. A new Anvil requires recollecting the market tape: first/last Swap hashes and historical quotes are verified. Changed model/adapter means a new brain hash and collection, not deletion/reuse of old SQLite history.

## Evidence and interpretation

- `.local/full-apps/experience.sqlite3`: inputs/features/actions/policies/outcomes/provenance/candidates/adoption.
- `artifacts/full-apps/*-latest.json`: train/select/test decisions.
- `browser-verification.json`: real GUI, neuron counts, adoption, restart.
- `comparison.json`: matched full/legacy and separate unchanged-browser reference.
- `readout-ablation.json`: fixed-policy/input edge ablation; `*-gui.png`: real screens.

Fit reuses saved features and changes readouts, not25, 582, 938 connections. Market compares regression/tree prediction on reserved collection data; adoption additionally needs separate action outcomes with matched policy hashes/cases/reward means.

Market orders remain paper-only: real V3 logs, next-block quotes, following-block marks, included fees/impact, assumed gas0.001 token1/fill. Aqua ship/dock/fill and balance changes are real TXs, but reward values per-fill changes against another pair's next-price ratio. Wide800 bps offers fill only when observed variation≥200 bps under an artificial taker rule. This is neither whole-wallet PnL nor LVR/real LP profitability.

Full/legacy comparison also changes mapping, state continuity, and4-versus32 neural steps, so it is not a neuron-count-only causal test. Old browser learners have different priors/timing/objectives; do not compare old synthetic-target MSE directly with action reward.

About150 ms for two agents/four steps means roughly6–7 decisions/s or26 neural steps/s, not30 render fps. RSS measures a process that loads the full graph even in legacy mode; legacy RSS is not standalone seven-neuron memory.

Recorded regression: 7 Python learning/provenance tests, 7 full numerical tests, 21 Node application tests, Foundry tests, deployed owner/quantity static-call checks, and actual Chrome acceptance.
