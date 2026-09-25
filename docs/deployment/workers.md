# Fly Lab — Cloudflare Workers

公開 URL: https://ethglobaltokyo-bio-agent-arena.commun-official.workers.dev

Worker: `ethglobaltokyo-bio-agent-arena`

## 構成

`wrangler.jsonc` の Static Assets で `dist/` を配信し、`services/worker/index.js` が `/api/health` とレスポンスヘッダーを処理する。競争・学習 Runtime はブラウザーで動作する。D1 / R2 / Durable Objects は今回使用しない。

[Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/) の構成に基づく。

## ローカル起動

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
- Sepolia コントラクトのデプロイは実施していない。
