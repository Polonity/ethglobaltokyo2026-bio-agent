# アーキテクチャ

**オンチェーン入力 → receipt・イベント検証 → 感覚入力の計算 → 判断・学習 → 描画**。ハエに与える外部入力はすべてチェーンに記録し、身体と学習状態はオフチェーンで更新します。

## 実行環境

| 環境 | 起動・配信 | 入力・署名 | 計算 |
| --- | --- | --- | --- |
| Anvil | `npm run local:up` / `npm run dev` | ローカルアカウント → Registry | 共通Fly Lab、7神経、3個体 |
| Sepolia | `npm run sepolia:publish` | 所有者ウォレット、または毎時Workers送信 → Registry | Anvilと同じUI・判断・学習 |
| 全神経Anvil | `npm run full:apps:dev` | ローカルRegistry・実取引 | Python全166,700神経。環境入力処理はブラウザー版と共有 |
| 独立した研究 | `npm run framework:lab`等 | 明示的な合成入力・対照条件 | フレームワークの学習・評価実験。チェーン接続デモとは別 |

## 責務

| コード | 役割 |
| --- | --- |
| `BioAgentStimulusRegistry` / `IBioAgentStimulus` | 個体定義・活動・刺激・供給と、スキーマ付き環境入力。ownerとrevision/nonceを検査 |
| `scripts/local-up.mjs` / `scripts/sepolia/deploy.mjs` | 配置、個体登録、初期環境TX |
| `services/worker/registry-read.js` | 両環境のsnapshot・イベント・receiptを同じロジックで検証 |
| `services/worker/local.js` | Anvil専用署名・RPC接続 |
| `services/sepolia/worker.js` / `scheduler.js` | Sepolia読取・配信、予算と送信間隔を制限したCron送信 |
| `apps/frontend/chain.js` | イベント同期、重複排除、環境の適用、手動送信 |
| `packages/bio_agent/browser/tx-world.js` / `tx-food.js` | 初期環境・危険エリア・餌を確認済みTXから構築。全神経版も使用 |
| `packages/bio_agent/browser/arena.js` | 身体・行動・経験・Q学習。接続中の学習は確定環境を再生 |
| `apps/frontend/` | 共通UI。チェーン未接続の合成箱庭へ切り替えない |
| `packages/bioagent-framework/` | 独立した共通API・入力アダプター・学習採用・保存復元の研究基盤 |

## 状態と境界

初期環境TXが幅・高さ・seed・危険エリア・餌配置範囲を与えます。正の刺激TXが餌を1個追加し、環境更新TXはフィールドを再構築します。位置・身体・消費・方策はランタイムが計算する内部状態です。クリックで未記録の餌を増やす経路はありません。

未確認の環境では停止します。reorgやrevision欠番ではsnapshotから再同期し、過去の身体や学習を厳密に巻き戻す構成ではありません。Sepoliaは約12秒間隔、Anvilは約600ms間隔で確認します。receipt確認は最終確定や計算の暗号学的証明ではなく、RPCへの信頼が残ります。

個体・入力はチェーン、消費履歴と方策はブラウザーに保存します。タブ間で同じ入力を受信しても、身体や学習の状態は独立します。提出動画は既存のAnvil＋全神経版です。

[ローカル操作](deployment/local-anvil.md) · [Sepoliaと予算](deployment/sepolia.md) · [フレームワークAPI](../packages/bioagent-framework/README.md)
