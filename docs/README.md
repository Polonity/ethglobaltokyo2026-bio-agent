# ドキュメント案内

現在の実装を把握する入口です。最終照合: 2026-09-25。

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
| Sepoliaに備える | [Sepolia手順](deployment/sepolia.md) |
| 公開GUIを配信する | [Workers手順](deployment/workers.md) |
| MaleCNSの取込方針を確認する | [データ出典](data-sources.md) |

## 用語

- **BioAgentStatus**: チェーンへ保存する入力条件。Activity、energy、stimulusとrevisionを持つ。
- **Runtime**: 入力と内部状態から行動を計算する実行環境。現在はブラウザー内。
- **Registry**: Agentの定義と最新Statusを保持するコントラクト。interface自体をデプロイするわけではない。
- **revision**: Statusの更新番号。学習によるpolicy versionとは別。
- **policy version**: 改善したQ値の採用時に上がる、ブラウザー内の方策の版。
- **modelHash**: モデルmanifestのバイト列に対するSHA-256。個体ごとの学習済みQ値を都度オンチェーン登録するものではない。
- **適用済み**: 受信したイベントがブラウザー内Agentの入力に反映された状態。一般のチェーンにおける最終確定の意味ではない。

## 実装の到達点

| 機能 | 現状 |
| --- | --- |
| IBioAgent / Registry / Status / イベント | Foundryで実装・テスト済み |
| Anvilへの配置と3匹の登録 | `local:up` で実行 |
| GUIから個体別Status送信・ログ受信 | ローカルAnvilモードで実装済み |
| 2D競争・Q学習・候補評価・復帰 | ブラウザー内で実装済み |
| 公開用Workers | 12匹のブラウザーデモ。オンチェーン入力は未接続 |
| Sepolia | 配置スクリプトと手順を準備。未デプロイ |
| SQLite Backend・Python学習 | 独立したひな型。GUI競争とは未接続 |
| 共有Runtime・SSE・checkpoint復元 | 設計案 |
| MaleCNS回路実行 | 未実装 |

「ローカル版の完了」と「最終プロダクトの完成」は別です。検証記録は各手順の実行日付き記録を参照し、過去の結果を現在の稼働保証として扱わないでください。
