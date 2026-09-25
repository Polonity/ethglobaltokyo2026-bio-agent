# 開発・検証ガイド

## 最初の確認

Node.js 22以上、npm、Foundryのforge / anvilを準備します。Pythonひな型のテストはPython 3.11以上、ブラウザーテストはGoogle Chrome、録画はffmpegも使用します。

```sh
npm ci
git submodule update --init --recursive
npm run local:up
```

全コマンドは特記がなければリポジトリルートで実行します。ツールの場所、ポート変更、停止手順は [ローカル起動](deployment/local-anvil.md) を参照してください。

## 変更箇所の見つけ方

| 変更したいもの | 主な場所 | 確認 |
| --- | --- | --- |
| Solidityの型・権限・状態 | `contracts/src/` | Foundryテスト、ABI生成、local E2E |
| ローカルRPC・API | `services/worker/local.js` | local E2E |
| イベント適用・再接続 | `apps/frontend/chain.js` | local E2E、再読込・reorg |
| 判定・報酬・学習 | `packages/bio_agent/browser/arena.js` | arenaテスト、実ブラウザー |
| 画面・操作 | `apps/frontend/` | build、対象モードの実ブラウザー |
| 模擬履歴の保存 | `services/backend/` | Pythonテスト |

コントラクト変更後は `make contracts-abi` で公開ABIを更新します。ローカル配置済みコードは自動更新されません。`local:up` を終了し、再配置して新しい設定で確認します。

## 検証コマンドと副作用

| コマンド | 何を確認するか | 前提・副作用 |
| --- | --- | --- |
| `npm run build` | アセット・manifest生成 | distを書き換える |
| `npm run format:check` | JS・CSS・HTML等の整形 | 読取のみ |
| `npm run test:arena` | 競争・学習・再現性等 | ネットワーク不要 |
| `make contracts-build contracts-test contracts-fmt` | Solidityビルド・テスト・整形 | 公開Txを送らない |
| `make contracts-dry-run` | オフライン配置シミュレーション | Sepoliaへの送信なし |
| `make contracts-check-deployment` | 配置スクリプトの検証 | 専用ローカルAnvilを使用 |
| `make test` | Pythonモデル・保存 | 一時データで検証 |
| `npm run test:local` | GUI→Tx→ログ→反応・再同期 | 起動中のAnvilを書き換える |
| `npm run test:browser` | 12匹モードのGUI・学習等 | 既定URLは127.0.0.1:8797 |
| `node scripts/record-demo.mjs` | 3匹モードの操作を録画 | Status更新、artifacts上書き |

ブラウザーテストは `CHROME_PATH` でChromeを指定できます。`test:local` は `.local/deployment.json` を読み、公開URLでは動作しません。automine切替やsnapshot/revertを含むため、発表・録画中には同時実行しないでください。

公開用12匹モードを検証する場合は別ターミナルで `npm run dev` を起動し、表示されたURLを指定します。

```sh
ARENA_URL=http://127.0.0.1:8797 npm run test:browser
```

healthの成功はチェーン接続の確認です。個体が入力を反映して動くことは実ブラウザーで別に確認します。コマンドの成功と、どの範囲を検証したかをセットで記録します。

## 設定と生成ファイル

| 場所 | 役割 |
| --- | --- |
| `.local/deployment.json` | 起動中AnvilのRegistry・配置ブロック・owner・モデルhash |
| `.local/wrangler.json` | ローカル専用Worker設定 |
| `.local/forge.log` | 配置処理のログ |
| `wrangler.jsonc` | 公開用Worker設定。ローカル書込APIとは別 |
| `contracts/.env` | Sepolia等の契約開発用設定。手順書に従う |
| `artifacts/` | 画面・動画・検証JSON。Git対象外 |
| `data/` | PythonのDB・学習成果物。Git対象外 |

ルート `.env` のCloudflare情報はAnvil起動に不要です。資格情報の値や秘密鍵をドキュメント・スクリーンショット・コミットへ含めないでください。

## 変更を引き継ぐ

1. 変更するモードと保存先を決める。
2. 実装と該当文書を同時に更新する。
3. 影響するテストと実操作を確認する。
4. `git diff --check` と差分を確認する。
5. 動作のまとまりごとに小さくコミットする。

ABI・manifestの変更はコントラクトとフロントの双方に影響します。modelHashはmanifestの正確なバイト列を対象とするため、manifest変更後に古い登録を使うと照合で止まります。

## 今後の実装と完了条件

| 次の段階 | 完了を判断する証拠 |
| --- | --- |
| Sepolia接続 | 署名→receipt→ログ→個体入力が同じTxで追える。拒否・競合も確認 |
| 永続Runtime | ブラウザーを閉じても実行し、プロセス再起動後に保存した入力・checkpointから復旧 |
| 共有観察 | 複数ブラウザーが同じsession・同じ状態を表示 |
| MaleCNSモデル | 出典・回路・入出力変換・モデル版を固定し、実際の計算を再現 |
| 学習評価 | 選別用の固定3コースと別の評価条件で、新旧の差を記録 |

これらは現在の実装完了を示す項目ではありません。公開デプロイは開発テストに含めず、[Workers](deployment/workers.md) / [Sepolia](deployment/sepolia.md) の手順で別に扱います。
