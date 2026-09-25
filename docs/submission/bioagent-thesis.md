# 提出物の軸 — BioAgentとは何を共通化するのか

2026-09-26 / ピッチと実装計画のための草案。実装済みと構想を区別する。

## 一文

**BioAgentは、生物由来のモデルが、身体の状態と経験によって変わっていく過程を、ブロックチェーンの刺激と結び付けて追跡できるようにする。**

## 英語の説明案

BioAgent explores an interoperability profile for biologically grounded, embodied agents. It connects the origin of a model, external stimuli, internal body state, and learning history, so another application can interpret how an individual changed. We build on existing agent and state-recording standards rather than making token ownership the biological feature.

Our two local demos use synthetic agents: an embodied foraging arena and a paper-trading arena driven by real Uniswap V3 Swap events on Anvil. Body state enters the policy observation. Foraging checkpoints resume deterministically, including during learning. Connectome execution, cross-runtime portability, and independent held-out learning evaluation remain future work.

## 見せる順序

- 同じ刺激でも、身体状態や経験で入力・判断が変わるという仮説。
- 「生物データ→モデル→感覚への変換→身体と判断→学習」という記述の必要性。
- 実装済み: 身体を入力に使う採餌Q-learning、Anvilの実TX、ローカル実Uniswap V3のSwap入力、3匹の紙約定・PnL競争。
- 検証済み: 同じpolicyで身体だけを変えた行動差、学習中を含む採餌checkpoint再開、市場の後続ブロック約定・費用・学習中の保有評価。未完了: 生物回路接続、実装間互換、独立held-out評価。
- 仕様の拡張例は採餌profileと市場profile。NFT/SBT機能は追加しない。

## 質問への答え

**「普通のAI Agentと何が違う？」**

内部状態と学習だけなら普通のAIにもある。BioAgentでは、生物データ由来の構造、人工的な感覚/運動mapping、身体からの内受容、どこを可塑的にしたかまで明示して、同じ個体の変化を解釈可能にする。

**「ERC-8004で足りない？」**

識別・評判・検証の基盤は再利用を検討する。今回詰めたいのは、その個体の生物モデル・身体・入力・学習過程をどう解釈するかというprofileである。既存規格では不可能だとは主張しない。

**「ハッシュがあるなら学習を証明できる？」**

改変を検出する手掛かりにはなるが、実行・改善・生物学的妥当性は別。再実行、対照条件、held-out評価や独立検証の証拠が必要。

**「今、MaleCNSが動いている？」**

現行はsynthetic Q-learning。MaleCNSの出典を明示した回路モデルは未接続。生物由来の主張は実際に使用する成果物と検証結果に限定する。

設計根拠: [方針](../standards/bioagent-design-direction.md)、[既存ERC調査](../standards/prior-art-and-bioagent.md)、[提案profile](../standards/embodied-learning-profile.md)。
