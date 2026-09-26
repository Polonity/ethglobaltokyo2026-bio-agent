# 採餌行動の再評価 / Foraging behavior review

2026-09-26、動画への指摘を受けて収録済みの判断・観測・結果を再集計しました。**採餌性能の受入は未達です。** 動画の再生・TX・学習更新の検証は、刺激に応じた移動や採餌成功の検証と分けます。これは新しい実験ではありません。

## 確認したこと

| 場面 | 実際の挙動 | 意味 |
| --- | --- | --- |
| 冒頭のlive run | MOMOは全27判断でaction 0（右向き）、全行動スコア0。2個体とも餌の取得0 | 初期readoutがゼロで、同点時に最初の行動を選ぶ。刺激追従を示していない |
| 経験収集 | 各200判断、`epsilon=1`。MOMOは餌1、SORAは0 | すべて許可行動からランダムに選ぶ。神経計算は実行するが、選択はそのスコアに依存しない |
| 候補比較 | MOMOは餌1→0で維持、SORAは餌1→2で採用 | 同じ入力で局所的な改善はあるが、1つの配置での採用判定 |
| 採用後の別配置テスト | 各80判断、双方とも餌0。報酬はMOMO −6.29、SORA −12.79 | 今回の別配置では採餌に成功していない。採用を安定した能力獲得と呼べない |

別配置でMOMOは80回すべて右向き。SORAは目標がある移動79回のうち、目標との距離が縮んだのは22回、広がったのは27回でした。残りは壁での制限等で距離が変わりません。単に「さらに長く学習すれば解決する」とは、この記録から判断できません。

方向・目標距離は[観測のdrives](../../../services/full-apps/foraging.mjs)へ符号化されています。しかし、[行動選択](../../../packages/bio_agent/full_apps/__main__.py)は未学習のゼロreadoutと完全ランダム収集を区別して見せていません。[学習](../../../packages/bio_agent/full_apps/learning.py)は観測した直後の報酬を予測するreadoutで、長期的な採餌成功の保証ではありません。全神経数や報酬予測誤差だけでは移動の質を判定できません。

## 改善時の受入条件

1. 未学習／ランダム探索／学習済み実行をUIと動画で明示する。
2. 同点を一方向に固定する初期挙動を見直す。ただし同点処理の修正だけを学習効果としない。
3. 学習・採用判定・未使用テストを分離し、複数のTX由来配置で評価する。
4. 餌取得数、目標距離の変化、危険エリア接触、身体状態を計測し、未学習・ランダム・直接入力の対照と比較する。
5. その評価を通った方策の実行を収録する。餌へ直接誘導するコードや、良い配置だけの選別で学習成功を演出しない。

修正・追加学習後の効果はまだ測っていません。現在の動画は接続と学習工程の動作を示すもので、採餌能力の完成デモとしては不十分です。

## English

**Behavioral acceptance is not met.** This is a read-only reanalysis of the recorded run, not a new experiment. Playback, transaction and learning-update checks did not establish successful foraging.

- In the opening live run, MOMO takes action 0 (right) in all 27 decisions because every untrained readout score is zero and ties select the first action. Neither agent collects food.
- The collection phase uses `epsilon=1`: all 200 choices per agent are random among allowed actions, even though neural features are computed. It is not a learned-policy demonstration.
- On the selection layout, MOMO's candidate is rejected; SORA improves from one to two collected foods and is adopted.
- On the subsequent different-layout test, both agents collect zero food across 80 decisions each. Rewards are −6.29 and −12.79. That test does not establish successful generalization.

More training alone is not a proven remedy. Separate collection from execution, address the deterministic untrained tie behavior, and evaluate frozen policies on multiple unseen TX-derived layouts against untrained, random and direct-input controls. Measure collections, progress toward food, hazard contacts and body state. Record the resulting behavior only after it passes acceptance; do not replace learned behavior with direct target steering or cherry-picked layouts.

[Aggregate evidence](foraging-behavior-review.json) · [Original capture](capture-evidence.json) · [Read-only analysis script](../../../scripts/submission/review-foraging-behavior.py)

Reproduce from the preserved recording database with `python3 scripts/submission/review-foraging-behavior.py`. The script opens SQLite in read-only mode and does not send transactions or update policies. The local database is not distributed in this kit; the original capture retains the evaluation results.
