# 共通チェーン読取と配信

| 実装 | 責務 |
| --- | --- |
| `registry-read.js` | AnvilとSepoliaのsnapshot・イベント・receiptを検証する共通API |
| `rpc-read.js` | 独立した読取をまとめ、WorkersからのRPCリクエスト数を抑える |
| `local.js` | Anvil限定の接続・署名。`local:up`が設定を生成 |
| `index.js` | ローカルWorkerが利用する静的アセット配信 |
| `../sepolia/worker.js` | 公開Sepolia APIと共通アセットの配信 |
| `../sepolia/scheduler.js` | 毎時確認・最低1時間間隔・予算制限付きの刺激TX送信 |

公開用設定は`wrangler.sepolia.jsonc`。ローカルのunlocked accountを使う署名APIは公開しません。行動判断と学習はブラウザーで実行します。

[ローカル起動](../../docs/deployment/local-anvil.md) · [Sepolia](../../docs/deployment/sepolia.md) · [入力の構成](../../docs/architecture.md)
