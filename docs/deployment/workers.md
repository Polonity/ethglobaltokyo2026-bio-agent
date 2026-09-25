# Fly Lab — Cloudflare Workers

公開 URL: https://ethglobaltokyo-bio-agent-arena.commun-official.workers.dev

Worker: `ethglobaltokyo-bio-agent-arena`

## 構成

`wrangler.jsonc` の Static Assets で `dist/` を配信し、`services/worker/index.js` が `/api/health` とレスポンスヘッダーを処理する。競争・学習 Runtime はブラウザーで動作する。D1 / R2 / Durable Objects は今回使用しない。

[Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/) の構成に基づく。

## Anvil と接続したローカル起動

3匹のコントラクト登録と刺激送信を試す場合は `npm run local:up`。手順は [Anvil + ローカル Workers](local-anvil.md) を参照してください。公開用 Worker とは別の entrypoint で起動し、公開環境を変更しません。

## ブラウザー内デモのローカル起動

Node.js 22以上（今回確認した版は22.14.0）。

```sh
npm ci
npm run dev
# Wrangler が表示するローカル URL を開く
```

ポート競合時は `npm run dev -- --port 8797 --inspector-port 9247` を使用する。

## 公開

```sh
npm run deploy
```

ルート `.env` の `CLOUDFLARE_ACCOUNT_ID` と `CLOUDFLARE_API_TOKEN` をデプロイ用の子プロセスに渡す。R2関連のキーは渡さず、Wrangler の .env 自動読込も無効化する。`.env` はビルドの入力ではなく、Worker バインディングにも含めない。

Worker を更新する操作なので、公開前に次を確認する。

```sh
npm run format:check
npm run test:arena
npm run build
node scripts/cloudflare.mjs deploy --dry-run --outdir /tmp/bio-agent-worker-build
# npm run dev でローカル起動後
ARENA_URL=http://127.0.0.1:8787 npm run test:browser
```

公開後は `ARENA_URL` に公開 URL を指定して実ブラウザーで検証する。Chrome の場所が異なる環境では `CHROME_PATH` を指定する。APIの200だけで稼働判定しない。

## 公開履歴

- 2026-09-25: 初回公開。version `18e03808-54ae-42c9-8b40-f5f2d2188839`。
- 2026-09-25: 最終版を反映。version `000bd0fb-2770-4bc6-bcc4-82cd4a7b404e`（コード commit `fc3bc57`）。
- 公開 URL で競争・操作・学習復帰・モバイル表示を実 Chrome で検証済み。
- Sepolia コントラクトのデプロイは実施していない。
