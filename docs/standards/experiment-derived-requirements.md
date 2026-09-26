# 実験から導いたBioAgent共通仕様の要件 / Experiment-derived requirements

2026-09-26。**設計提案。既存ABIを変更せず、完全な適合実装とも主張しない。**

根拠：[事前の実験計画](../research/bioagent-study-20260926/protocol.json)。実測の詳細・全条件・失敗例は `artifacts/bioagent-study-20260926/` に保存する。

## 何を共通化するか

| 実験で分かったこと | 必要な仕様 | 効果を確かめる基準 |
| --- | --- | --- |
| 採餌は5回学習すると餌が増えたが接触と総合報酬は悪化 | 目的指標だけでなく、副作用・制約・単位・良い方向・採用条件を記録 | 採餌数だけを見て「改善」と判定せず、未使用条件で制約も確認できる |
| 追加の採用条件は候補12件をすべて拒否。劣化を避けたが改善も止まった | 候補生成・評価・採用／拒否を別の状態にし、拒否理由を保存 | `trained`を`improved`や`adopted`へ自動的に読み替えない |
| 模擬市場の予測誤差は改善したが、利益ではなく損失削減。相場条件で結果が逆転 | 評価対象の環境、基準方策、取引・見送り・費用を含めた結果を記録 | MSEをPnLに読み替えず、評価した相場条件と限界を表示する |
| Aquaの人工目標は既知の式で直接計算すると誤差0 | 人工目標・教師信号の作り方と単純な対照を開示 | 生物由来回路が不要な課題も検出できる |
| 採餌と市場で同じ読出し保存APIが使える。用途が違えば復元は拒否すべき | 個体ID、モデル、用途、方策版、入力・出力の意味を成果物に結び付ける | 同一用途の再利用と、異なる用途への能力転移を区別する |
| 共通の入力revisionを更新すると2つの契約が古い戦略を拒否 | 個体IDと入力revisionを実行条件へ結び付ける | 1回の共通入力更新で、依存する戦略が無効になり、別個体には影響しない |
| 2個体のアダプターが同じArenaを各々stepすると環境が2回進む | 個体の意思決定と環境の時計を分離。スケジューラーが環境を1tickに1回進める | 共通ループで個体数を増やしても、1tickあたりの環境経過が変わらない |

## 最小の責務

1. **個体・モデルの識別**：生物データの出自、抽出・動力学・入力変換・読出しの版を宣言する。単なる同一graph hashで全体の互換性を主張しない。
2. **入力の受理**：accepted / duplicate / rejectedを区別し、出典・順序・鮮度・入力revisionを記録する。Solidity側のStatusは外部入力で、内部の脳・身体状態ではない。
3. **学習能力の宣言**：学習できるか、変更できる部分は何かを明示する。全用途に同じ学習アルゴリズムを強制しない。
4. **共通の評価記録**：目的指標・制約指標・方向・単位・学習／選択／最終評価の分割、初期状態、方策、採用規則を結び付ける。アプリ間で報酬の数値を足したり平均したりしない。
5. **成果物と再開**：読出しの移植と、身体・乱数・環境・経験を含む完全な再開を別の能力として宣言する。
6. **環境の実行管理**：Agentの`step()`だけで共有世界を進めない。環境IDとtick所有者を明確にする。

評価レコードの意味は例えば以下とする。wire形式の確定や既存型の実装変更ではない。

```text
EvaluationRecord
  taskProfile, modelDescriptor, candidatePolicy, baselinePolicy
  trainingInputs, selectionInputs, finalTestInputs
  initialState, environmentProfile, executionAndCostModel
  metrics[]: { name, unit, direction, baseline, candidate }
  constraints[]: { metric, comparator, threshold, satisfied }
  adoptionRule, decision: adopt | reject, reasons[]
  sourceEvidence[], limitations[]
```

生物由来の固有性は、出自だけでなく、回路・人工的な変換・身体・学習範囲を切り分けて比較できる点に置く。ただし、その記述があるだけで生物由来の性能優位を証明したことにはならない。

## 現行実装の境界

- Solidity `IBioAgent`をRegistryが実装し、アプリは参照する。Aquaの2契約がIBioAgentを直接継承しているわけではない。
- `IBioAgentRuntime`を継承する3つの入力アダプターは共通ループで実行できるが、内部は同じ採餌Arena。3種類の独立したタスクエンジンが相互運用したという証明ではない。
- 市場PaperArenaとAquaの学習は用途別の実装。共有される学習結果の記録形式があっても、共通の`learn()`・完全checkpoint・汎用restoreは未実装。
- TypeScriptの`IBioAgentRuntimeV1`は将来の境界を表す型。現在の全ランタイムが準拠したとは主張しない。

## English

These are proposed requirements derived from the experiments, not a new deployed ABI or a claim of full conformance.

- Report objectives **and adverse effects**, with units, direction, constraints and explicit adoption rules. More food with more contacts is not automatically an improvement.
- Separate candidate generation, evaluation, adoption and rejection. The stricter experimental gate rejected all 12 internally accepted candidates: it preserved behavior but also prevented progress.
- Keep prediction quality separate from task outcomes. The synthetic market learner reduced losses in two regimes and worsened the third; it did not establish profitability.
- Declare how teaching targets are produced and include simple controls. Aqua's known synthetic target is computed exactly by its defining formula, so fitting it does not demonstrate a need for a biological circuit.
- Bind artifacts to model, individual, task and policy version. Reusing a readout within its task is different from transferring skills to another task.
- Bind executable strategies to a common input revision. One IBioAgent update invalidated stale strategies in two consumer contracts while leaving a different individual usable.
- Give the environment one clock owner. Calling the current base `step()` once per agent advanced a shared Arena twice; schedule the world once per tick.

The minimum common boundary should cover identity and provenance, input acceptance, optional learning capabilities, evaluation records, artifact compatibility, and environment scheduling. Learning algorithms remain task-specific. A UI snapshot, policy artifact and complete replay checkpoint are distinct capabilities.

Solidity `IBioAgent` is implemented by the Registry and consumed by applications; it is not their runtime superclass. The three JavaScript subclasses share an observation/execution/view loop but all wrap the same foraging engine. Paper-market and Aqua learning remain separate implementations. Full-profile interoperability is still unproven.


## 実装への反映 / Implementation follow-up (2026-09-26)

[BioAgent Framework](../../packages/bioagent-framework/README.md)に、採餌とAquaの共通学習ライフサイクル、互換性付き方策復元、共有Arenaの時計、RPC状態から出典付き判断までの実装を追加しました。[再検証結果](../research/bioagent-adaptation/README.md)では、報酬改善と体力低下のトレードオフから、終了時エネルギーの下限も任意の採用制約として実装しています。

These are implemented capabilities in an opt-in monorepo package, not full conformance to the proposed TypeScript standard. The package uses the 7-neuron slice; the full-model runtime remains separate. Cross-task skill transfer, cryptographic RPC proofs, transaction execution and measured platform growth are not established.
