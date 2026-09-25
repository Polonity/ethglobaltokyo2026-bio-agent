# Bio Agent システム設計 v0.1

状態: **Registry・型・イベントは Solidity 実装済み / Anvilに配置済み / Sepolia未デプロイ。Anvil とローカル Workers の3匹接続は実装済み。共有 Runtime・Sepolia 接続は次段階**。ユーザーの構想を実装可能な境界に整理する文書です。既存の Python デモの動作を説明するものではありません。

## 目指す体験

ウォレットから Bio Agent の Status をブロックチェーンに登録する。そのイベントログを起動中の Agent が取得し、内部状態と行動を更新する。GUI で多数の個体が動き、どのトランザクションによって動きが変わったか追える。

## 現在の実装との差分

この文書の共有Runtime・Backend・SSEは将来案です。現在はローカルWorkerのAPIをブラウザーが600ms間隔で取得し、ブラウザー内Arenaが5Hzで行動を判定します。ローカル3匹、ブラウザーデモ12匹を実装済みで、24体は初期提案です。実際の構成は [アーキテクチャ](../architecture.md)、APIは [リファレンス](../reference/local-api.md) を参照してください。

## 設計の軸

1. `IBioAgent` で Agent の識別子、Status、更新操作、イベントを定義する。
2. `BioAgentRegistry` に Agent の定義と最新 Status を保存する。
3. 常駐する Agent Runtime が Registry のイベントログを取得して処理する。
4. Backend が入力・処理結果を保存し、GUI に配信する。
5. GUI は Runtime が出した位置・行動を補間して描画する。

## 決定と提案

| 項目 | v0.1 の案 |
| --- | --- |
| チェーン | Ethereum Sepolia（11155111）。ローカル検証は Foundry / Anvil |
| コントラクト配置 | 1 Registry に複数 Agent。1 Agent ごとのコントラクトは作らない |
| Agent の同一性 | `(chainId, registryAddress, agentId)` |
| IBioAgent | オンチェーンの型・Status 更新契約。Runtime の処理契約は別名で定義 |
| Status の意味 | 外部から与える状態・刺激。計算された実行状態とは分離（ユーザー確認済み） |
| 書込権限 | Agent を登録した owner。v0.1 では所有権移転・書込委任なし |
| ログ受信 | Runtime 内の共有 ChainListener が取得し、対象 Agent に振り分ける |
| GUI 更新 | Runtime → Backend → SSE → GUI。描画はブラウザー内で継続 |
| 学習 | デモ経路から独立。モデル版を固定し、記録した入力を再生可能にする |

Status を入力として扱う方針はユーザー確認済み。それ以外の具体的なフィールド・API・配置は v0.1 の提案とする。Agent 自身の出力は RuntimeState として保存・表示する。

## 文書

- [型・Registry・イベント](onchain-contracts.md)
- [ログ受信・実行・データ管理](runtime-and-events.md)
- [GUI とハッカソンデモ](demo-experience.md)

## 現在のひな型との対応

| 現在 | 設計後 |
| --- | --- |
| `packages/bio_agent/step` | Runtime 内のモデル実装に相当。状態を保持する処理契約へ拡張 |
| `packages/shared/Stimulus` | イベント由来の入力・出典付き型へ拡張 |
| `packages/training` | 状態遷移記録を利用する学習・評価ジョブ |
| `services/backend` | 保存・読取 API・SSE。RPC と Runtime を別モジュールとして接続 |
| `apps/frontend` | 個体群の表示、Status 操作、Tx と処理の可視化 |
| `contracts/`（実装済み） | Solidity interface、Registry、Foundry テスト、Forge Script、公開 ABI |

## 実装前に確定すること

- Sepolia の RPC、ウォレット、確認ブロック数。
- 初期 Agent モデルと MaleCNS 部分回路、刺激・行動の対応。
- 共有Runtime版の個体数と負荷目標。現在のローカル版は3匹、活動モード・エネルギー・刺激強度で実装済み。

スポンサー固有の API や賞の要件は、この基礎設計の確定条件にしない。

コントラクトのビルドとデプロイ準備は [contracts README](../../contracts/README.md) を参照。

現在のブラウザー内競争・自己学習デモは [Fly Lab](fly-arena.md) を参照。以下の共有 Runtime / イベント駆動の設計とは接続段階が異なる。

Anvil 上の実コントラクトからGUIの3匹へ入力する構成は [ローカル接続ガイド](../deployment/local-anvil.md) を参照。

## 先行実験の記録（2026-09-26、方針再検討中）

[ERC形式の草案](../standards/bio-agent-draft.md)とNFT/SBT参照実装を追加しました。未提出・番号未付与で、従来のRegistryとGUIはそのままです。NFT/SBT追加は意図の取り違えによる先行実装で、今後の要件として採用しません。ERC-8004準拠や実行証明は主張しません。

最新の仕様検討は[思想と設計方針](../standards/bioagent-design-direction.md)を参照。既存の採餌用ABIと、新しく検討するBioAgent共通profileを区別します。
