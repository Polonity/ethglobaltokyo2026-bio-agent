# ドキュメント案内

**[審査員向けSepoliaデモ・日英操作案内・実TX証拠](deployment/sepolia.md)**。公開版は7神経・19接続、提出動画はAnvil＋全166,700神経版です。

**[進行中: 全アプリでの全神経・経験学習・改善](design/full-app-learning.md)**。実験画面を越えて採餌・市場・Aquaへ統合し、省略版と比較するための完了条件と現状。

**[ローカル全166,700神経モデル](design/malecns-full-local.md)**: 7神経への縮小理由、全規模の起動、計算時間とメモリ、比較と残る検証。ブラウザー向けの軽量学習デモと分けて運用します。

現在の実装を把握する入口です。最終照合: 2026-09-26。

## 現在の必須実装

[MaleCNS必須・3用途の学習・即時反映](design/malecns-learning.md)。以前の「2ゲームはsynthetic」「Aquaは学習なし」という記録を更新します。全脳ではなく実測部分回路です。

## 現在の仕様検討の入口

[生物模倣からBioAgentへ](submission/biomimicry-positioning.md): 鮫肌など4つの製品事例、神経回路を借りる理由、性能仮説と比較計画。

[なぜBioAgentを定義するか — オンチェーン入力・ERC動向・コネクトーム研究](standards/why-bioagent.md)。共通Agent基盤に生物由来モデルを解釈するprofileを追加する方針です。

[BioAgentの思想・設計方針](standards/bioagent-design-direction.md) → [既存ERCとの差分調査](standards/prior-art-and-bioagent.md) → [身体・学習profile案](standards/embodied-learning-profile.md) → [提出説明案](submission/bioagent-thesis.md)。NFT/SBTは派生構造の比喩であり、機能追加要件ではありません。実装では通常のRegistryと任意の刺激拡張を用います。

[最新の達成状況監査](submission/goal-audit.md) / [MaleCNS部分グラフのCircuit Lab](design/circuit-evidence.md)。

## Aqua Connectome

[実Aquaと実測接続を使う第3の箱庭](design/aqua-connectome.md)。共有ウォレット・刺激→判断→ship/dock・実テスト交換。専用アプリ形式であり、既存2アプリの共通型への完全統合は今後の課題です。

## 2アプリの型

[採餌・市場アプリの型定義と単位](standards/application-types.md): 共通coreと用途別profileをTypeScript化。型検査と基本値検証を実装し、両GUIのViewへ接続済み。完全な共通Runtimeへの移行は未完了。

## 目的から読む

| やりたいこと | 読む文書 |
| --- | --- |
| まず3匹を動かす | [Anvil + ローカル Workers](deployment/local-anvil.md) |
| 全体構成と保存先を理解する | [アーキテクチャ](architecture.md) |
| 表示言語を切り替える・翻訳を追加する | [i18n](i18n.md) |
| デモを説明・操作する | [GUIデモガイド](design/demo-experience.md) |
| デモ動画を見る・再収録する | [動画と再収録](demo-video.md) |
| GUIとWorkerをつなぐ | [ローカルAPIリファレンス](reference/local-api.md) |
| 型・権限・イベントを変更する | [オンチェーン設計](design/onchain-contracts.md)、[Foundry開発](../contracts/README.md) |
| 第2ゲームのペーパートレード案を読む | [Paper Trading Arena（設計案）](design/paper-trading-arena.md) |
| Agentの種類・価格入力・walletを拡張する | [Agent拡張設計](design/agent-types-and-wallets.md) |
| 判定・自己学習を理解する | [Fly Labモデル](design/fly-arena.md) |
| テストして変更を引き継ぐ | [開発ガイド](development.md) |
| 将来の常駐Runtimeを設計する | [イベント駆動設計](design/runtime-and-events.md) |
| Sepolia公開デモを操作・検証する | [Sepolia手順](deployment/sepolia.md) |
| 公開GUIを配信する | [Workers手順](deployment/workers.md) |
| MaleCNSの取込方針を確認する | [データ出典](data-sources.md) |

## 用語

- **BioAgentStatus**: チェーンへ保存する入力条件。Activity、energy、stimulusとrevisionを持つ。
- **Runtime**: 入力と内部状態から行動を計算する実行環境。現在はブラウザー内。
- **Registry**: Agentの定義と最新Statusを保持するコントラクト。interface自体をデプロイするわけではない。
- **revision**: Statusの更新番号。学習によるpolicy versionとは別。
- **policy version**: 改善したQ値の採用時に上がる、ブラウザー内の方策の版。
- **modelHash**: 登録対象のモデル定義のSHA-256。Sepolia Labでは正確な部分グラフJSON、旧版ではモデルmanifestのバイト列を対象とします。個体ごとの学習済みQ値を都度オンチェーン登録するものではない。
- **適用済み**: 受信したイベントがブラウザー内Agentの入力に反映された状態。一般のチェーンにおける最終確定の意味ではない。

## 実装の到達点

| 機能 | 現状 |
| --- | --- |
| IBioAgent / Registry / Status / イベント | Foundryで実装・テスト済み |
| Anvilへの配置と3匹の登録 | `local:up` で実行 |
| GUIから個体別Status送信・ログ受信 | ローカルAnvilモードで実装済み |
| 2D競争・Q学習・候補評価・復帰 | ブラウザー内で実装済み |
| 公開用Workers | 旧12匹のFly Labに加え、独立したSepolia Labを公開 |
| Sepolia | Registry・個体1配置、入力更新の実TXと公開ブラウザー動作を検証済み |
| SQLite Backend・Python学習 | 独立したひな型。GUI競争とは未接続 |
| 採餌の身体状態・checkpoint復元 | ローカル再開と学習中の再現を検証済み |
| 実V3 Pool・市場GUI・ペーパートレード | Anvilで実装・ブラウザー検証済み |
| サーバー共有Runtime・SSE・互換checkpoint | 設計案 |
| MaleCNS部分グラフ実行 | Circuit Labで7神経・19接続を人工動力学で計算。生物学的検証・2ゲームへの統合は未実装 |

「ローカル版の完了」と「最終プロダクトの完成」は別です。検証記録は各手順の実行日付き記録を参照し、過去の結果を現在の稼働保証として扱わないでください。

## 提出パッケージ

[英語の提出文・デモ台本・検証索引](submission/README.md)を参照してください。[ERC形式の草案](standards/bio-agent-draft.md)は未提出・番号未付与です。NFT/SBT実装と依存は削除済み。ERC-8004準拠や実行証明は主張しません。

[合成Swapイベントの小規模テスト](design/swap-event-game.md)も残しています。現在の市場GUIは別途、実Uniswap V3コアをローカル配置して動作します。

## 採餌モデル v2

[身体入力・可変なお腹・学習中の再開検証](design/embodied-foraging.md)を実装。新manifestを登録した独立Anvil/WorkersでGUI検証済み。満腹度・蓄えは実際の観測に入ります。

## 実Uniswapの市場アプリ

[Market Meadowの起動・仕組み・検証](design/local-market-app.md)。ローカルの実V3 Pool、登録済み3匹、紙約定・PnL・学習・receiptをGUIで確認できます。

- [全3アプリの全神経・経験学習GUI、再現手順と比較](submission/full-apps-acceptance.md)

- [3アプリの説明シート：見た目・状態・オンチェーン・MaleCNSの関係](apps/README.md)
