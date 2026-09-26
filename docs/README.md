# ドキュメント

[プロジェクト概要](../README.md)から一歩進んで、実行環境・実装・研究結果を調べるための索引です。

## 使う

| 目的                          | ガイド                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------- |
| 判断・学習・保存復元を試す    | [BioAgent Framework / Research Lab](../packages/bioagent-framework/README.md) |
| 公開デモでチェーン入力を試す  | [Sepolia Lab](deployment/sepolia.md)                                          |
| ローカルチェーンとGUIを動かす | [Anvil + Workers](deployment/local-anvil.md)                                  |
| 全166,700神経のモデルを動かす | [全規模ランタイム](design/malecns-full-local.md)                              |
| 全神経版のアプリを動かす      | [3用途の起動・学習・検証](submission/full-apps-acceptance.md)                 |
| 4個体の共有市場を動かす       | [共有市場の操作と実装](apps/shared-market/README.md)                          |
| 画面や個体の状態を理解する    | [アプリ説明シート](apps/README.md)、[GUIガイド](design/demo-experience.md)    |

## 設計を理解する

- [フレームワークのレイヤ構成図とAPI](../packages/bioagent-framework/README.md#レイヤ構造)
- [実行境界・実装言語・通信・保存先](architecture.md) · [English](architecture.en.md)
- [BioAgentの目的と設計方針](standards/bioagent-design-direction.md)
- [なぜBioAgentを定義するか](standards/why-bioagent.md)、[既存規格との比較](standards/prior-art-and-bioagent.md)
- [身体・学習profile案](standards/embodied-learning-profile.md)、[用途別の型と単位](standards/application-types.md)
- [IBioAgent・Registryの設計](design/README.md)、[オンチェーン設計](design/onchain-contracts.md)、[ERC形式の草案](standards/bio-agent-draft.md)
- [イベント駆動Runtimeの設計案](design/runtime-and-events.md)、[Agent・walletの拡張案](design/agent-types-and-wallets.md)

## 研究・検証を読む

- [学習実験の結論・対照比較・副作用](research/bioagent-adaptation/README.md)
- [実験から導いたフレームワークの要件](standards/experiment-derived-requirements.md)
- [MaleCNSのデータ出典・帰属・変更点](data-sources.md)
- [生物模倣の背景と比較計画](submission/biomimicry-positioning.md)
- [全規模モデルの実測と縮小判断](design/malecns-full-local.md)
- [部分回路の入出力検証](design/circuit-evidence.md)、[合成Swapイベントの初期検証](design/swap-event-game.md)
- [学習基盤の設計](design/malecns-learning.md)、[全神経アプリの開発計画](design/full-app-learning.md)
- [採餌モデル](design/fly-arena.md)、[身体状態とcheckpoint](design/embodied-foraging.md)
- [ペーパートレード設計案](design/paper-trading-arena.md)、[実装の到達点と制約](submission/goal-audit.md)

## 開発・運用

- [開発環境・検証コマンド](development.md)
- [コントラクト開発](../contracts/README.md)
- [ローカルAPI](reference/local-api.md)、[表示言語・翻訳](i18n.md)
- [Workersへの配信](deployment/workers.md)、[Sepoliaへの配置と検証](deployment/sepolia.md)
- [外部プロトコルとの連携・パートナー向け資料](integrations.md)

## 動画・発表資料

- [日英の提出動画・発表用Q&A・根拠データ](submission/presenter-kit/README.md)
- [動画の再収録手順と過去の収録](demo-video.md)
- [成果説明スライド](presentation/README.md)
- [提出説明・検証索引](submission/README.md)、[設計思想の説明](submission/bioagent-thesis.md)

## 用語

| 用語           | 意味                                                                           |
| -------------- | ------------------------------------------------------------------------------ |
| BioAgentStatus | 活動・エネルギー供給・刺激など、チェーンへ記録する入力条件                     |
| Registry       | 個体の定義と最新の入力状態を保持するコントラクト                               |
| Runtime        | 入力と内部状態から行動を計算する実行環境。用途に応じてブラウザーやPythonで動作 |
| revision       | 入力状態の更新番号                                                             |
| policy version | 学習済み方策の版。入力revisionとは別に管理                                     |
| modelHash      | 登録対象のモデル成果物を照合するSHA-256。対象ファイルは実装ごとに定義          |
| 適用済み       | 受け取った入力をAgentへ反映した状態。チェーンの最終確定とは別                  |
