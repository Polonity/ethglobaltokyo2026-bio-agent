# Cloudflare Worker

2つのentrypointを用途ごとに使います。

| entrypoint | 設定 | 責務 |
| --- | --- | --- |
| `index.js` | ルート `wrangler.jsonc` | アセット、ブラウザーモードconfig、health |
| `local.js` | `local:up` が生成する `.local/wrangler.json` | ローカルAnvil用APIとアセット |

`local.js` は通常の公開デプロイには含めません。Anvilのunlocked accountを使う書込経路はローカル専用です。任意RPCの中継や秘密鍵入力は提供しません。

どちらもAgent Runtimeそのものではありません。判定と学習はブラウザーで実行します。

- [ローカル起動](../../docs/deployment/local-anvil.md)
- [APIリファレンス](../../docs/reference/local-api.md)
- [公開配信手順](../../docs/deployment/workers.md)
