# データ管理Backend（Pythonひな型）

標準ライブラリのHTTPサーバーとSQLiteで、模擬刺激の実行結果を保存します。現在のAnvil版GUIが使うAPIは [ローカルWorker](../worker/README.md) で、このBackendへ競争状態は保存されません。

## 起動

リポジトリルートで `make dev`。先に `npm ci` が必要です。フロントをビルドしてからPythonサーバーを起動します。

| 環境変数 | 既定値 |
| --- | --- |
| HOST | 127.0.0.1 |
| PORT | 8000 |
| BIO_AGENT_DB | data/bio-agent.sqlite3 |

単一ローカルプロセス向けです。公開用の認証・並行処理・スキーマ移行は実装していません。

## API

| API | 応答 |
| --- | --- |
| GET `/api/health` | status=ok, mode=mock |
| GET `/api/runs` | runs配列。新しい順、最大50件 |
| POST `/api/demo/step` | 本文不要。模擬入力を1回計算して保存、HTTP 201 |

```sh
curl -fsS http://127.0.0.1:8000/api/health
curl -fsS -X POST http://127.0.0.1:8000/api/demo/step
curl -fsS http://127.0.0.1:8000/api/runs
```

POSTはSQLiteに1件追加します。保存内容はschema_version、created_at、stimulus、stateと記録ID。入力sourceはmock、chain_idはnullです。再起動後も同じDBなら履歴を引き継ぎますが、連続した神経状態は保持しません。

GUIアセットも配信しますが、GUIの12匹と `/api/demo/step` は独立しています。検証はルートで `make test`。将来のスキーマは [共有Runtime設計](../../docs/design/runtime-and-events.md) を参照してください。
