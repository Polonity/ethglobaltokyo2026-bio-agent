# MaleCNS学習基盤

主経路は `browser/` の共通学習・成果物モジュールと、用途別Runtimeです。全用途でMaleCNS v1.0の実測部分回路を必須とし、接続を固定したまま小さな行動選択部分を学習します。

| 用途 | 実装 | 採用・保存 |
| --- | --- | --- |
| 採餌 | `bio_agent/browser/arena.js` + `browser/learning.js` | 960環境更新を分割、固定選択コースで改善したQ値を次tickへ反映。版付きlocalStorage |
| 市場 | `bio_agent/runtime/paper-arena.js` + `browser/learning.js` | 256更新単位、時系列選択MSEが改善した値を次Swapへ反映。版付きlocalStorage |
| Aqua | `browser/aqua-learning.js` | 人工教材192点でreadout gainをfit、64点で選択。新Status revision・ローカルKV・新戦略へ反映 |

`learning.js` は共通評価レポートと計算予算、`readout.js` は用途・個体・graphを検査する成果物の保存/復元を扱います。GUIの学習は完了後に固定待機せず、結果が改善したときだけ採用します。

[必須条件・アルゴリズム・整合性・実測・再現手順](../../docs/design/malecns-learning.md)を参照してください。`npm run test:male-learning`、`npm run benchmark:male-learning`、`npm run test:male-learning:browser` が主要な確認コマンドです。

Pythonの `make train` は同じMaleCNS部分回路を使う閾値校正の参照ジョブです。4つの人工ラベルを使うため汎化性能は主張せず、成果物を自動適用しません。GUIに接続された学習基盤と、この参照ジョブを混同しないでください。
