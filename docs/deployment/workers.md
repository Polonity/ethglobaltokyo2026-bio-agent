# Cloudflare Workersの公開デモ

現在の公開先は[Sepolia Fly Lab](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/)。Anvilと同じUIを配信します。[入力仕様・署名者・ガス予算・配置記録](sepolia.md)。

```sh
npm run sepolia:build
node scripts/cloudflare.mjs deploy --config wrangler.sepolia.jsonc --dry-run
npm run deploy                 # sepolia:publish と同じ
npm run test:sepolia:public     # 公開ページを読み取り検証
```

配信設定は`wrangler.sepolia.jsonc`、Workerは`services/sepolia/worker.js`。Static Assetsが共通UIを配信し、CronとDurable Objectが予算内で刺激TXを定期送信します。実行時の行動判断・学習はブラウザー内です。

Cloudflare配布コマンドはルート`.env`からCloudflareの認証情報だけを読みます。署名鍵は別のCloudflare Secretで管理し、ブラウザーや静的ファイルへ配信しません。

ローカルは`npm run dev`または`npm run local:up`。[ポート変更などの手順](local-anvil.md)。

以前の12匹・ブラウザー単独モードの起動・試験・配布設定は削除しました。既存の旧Workerそのものを削除する操作は行っていません。審査用には上記Sepolia URLを使用してください。
