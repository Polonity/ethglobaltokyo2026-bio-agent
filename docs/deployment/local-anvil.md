# Anvil + ローカル Workers：3匹へオンチェーン刺激を送る

この手順はローカル PC 内で完結します。Cloudflare アカウント・API token・Sepolia ETH・ブラウザーウォレットは不要です。公開 Workers と Sepolia を更新しません。

## ゴールと実行するもの

| コンポーネント | 実体 | 既定の接続先 |
| --- | --- | --- |
| EVM | Foundry Anvil / chain ID 31337 | `http://127.0.0.1:8545` |
| アプリ層 | `IBioAgentRegistry` / `IBioAgent` を実装する `BioAgentStimulusRegistry` | 起動時に Anvil へ実デプロイ |
| ローカル Web アプリ | Wrangler dev の workerd + Static Assets + ローカル専用 API | `http://127.0.0.1:8798` |
| Agent Runtime | GUI 内の Q-learning モデル、3個体 | MOMO #1 / SORA #2 / KIKI #3 |

コントラクトの型を定義した interface 自体はデプロイしません。実装である Registry をデプロイし、Foundry Script が `IBioAgentRegistry` 経由で3匹を登録します。

## 初回準備

- Node.js 22以上、Python 3.11以上（既存テスト用）。
- Foundry v1.8.3 の `forge` と `anvil`。Solidity コンパイラはプロジェクトの0.8.30に固定。
- 初回依存取得・コンパイラ取得時はインターネットが必要です。

```sh
npm ci
git submodule update --init --recursive
```

`forge` と `anvil` は PATH、または `~/.foundry/bin/` から検出します。別の場所に置いている場合は環境変数 `FORGE` / `ANVIL` で実行ファイルの絶対パスを指定してください。今回の検証では `/tmp/bio-agent-foundry-v1.8.3/` に置いた公式配布の v1.8.3 を使用しました。

## 一式を起動する

リポジトリルートで実行します。

```sh
npm run local:up
```

明示的にツールの場所を指定する場合:

```sh
FORGE=/path/to/forge ANVIL=/path/to/anvil npm run local:up
```

起動コマンドは次の順に処理します。

1. GUI アセットとモデル manifest をビルドする。
2. 空いている専用ポートに新しい Anvil を起動する。
3. chain ID が31337、client が Anvil であることを確認する。
4. `DeployLocalArena.s.sol` を **ローカルへ broadcast** する。
5. Registry の CREATE・3回の registerAgent・初期環境submitStimulus、計5TXの成功receiptを確認する。
6. 接続情報を `.local/deployment.json`、ローカル設定を `.local/wrangler.json` に生成する。
7. `wrangler dev --local` を起動する。

ターミナルに `Ready on http://127.0.0.1:8798` が出たら、[ローカル GUI](http://127.0.0.1:8798) を開きます。

`Ctrl-C` で、このコマンドが起動した Anvil と Wrangler を終了します。既存プロセスは停止しません。起動のたびに新しいローカルチェーンを作るため、前回の状態は引き継ぎません。既存ポートが使用中なら自動上書きや停止をせずエラーにします。

```sh
ANVIL_PORT=8555 LOCAL_GUI_PORT=8808 LOCAL_INSPECTOR_PORT=9258 npm run local:up
```

## GUI で試す

1. 上部の `ANVIL / 31337` が接続済みとなり、MOMO・SORA・KIKI の3匹が表示されることを確認。
2. 順位表またはハエをクリックして対象を選ぶ。Inspector の矢印でも切り替えられる。
3. 「採餌」、刺激95%、エネルギー供給90%などを設定。
4. **「コントラクトに刺激を送信」** を押す。
5. 送信 → 採掘 → ログ受信 → 適用済みを確認。Tx hash、block、log index、revision が画面に残る。
6. 対象の1匹が新しい入力で行動する。他の2匹の Status は変化しない。
7. 同じ個体を「休息」に変更すると、移動よりも休息を選ぶ傾向が強くなる。

登録時の初期値は3匹ともRest / energy 5000 / stimulus 0 / revision 1。初期環境TXが寸法・seed・危険エリア・餌配置範囲を記録します。正の刺激TXを送るまで餌はなく、ハエは待機します。

AnvilとSepoliaは `apps/frontend/` の同じUI・判断・学習処理を使います。選択中の個体への正の刺激TXが成功すると、共通フィールドへ餌を1個追加。食べた餌は消え、自動補充しません。フィールドのクリックは個体選択で、「おやつ」も刺激TXを送ります。

**ハエに与える外部入力はすべてオンチェーンデータです。** 環境入力は `IBioAgentStimulus.submitStimulus`、個体の活動・刺激・供給は `updateStatus` を使います。初期環境の送信内容は [foraging-world.json](../../packages/bio_agent/browser/foraging-world.json)。ローカル値での代替はありません。環境TXの更新はフィールドを再構築し、それ以前の餌を消去します。

身体・位置・方策は入力から計算する内部状態です。再生速度は観察の速度で、環境条件ではありません。学習は確認済み環境のコピーを再生し、表示中の餌を増やしません。環境TXと餌の由来は「環境と餌の入力TX」で確認できます。

## イベントから反応まで

1. GUI が `/api/chain/status` へ agentId、expectedRevision、activity、energy、stimulus を送信。
2. ローカル Worker が入力を検証し、固定 Registry の ABI で `updateStatus` をエンコード。
3. Anvil のローカル owner アカウントで `eth_sendTransaction`。GUI や Worker に秘密鍵は渡さない。
4. コントラクトが所有者・値域・revision を確認して状態を更新し、`BioAgentStatusUpdated` を emit。
5. GUI の ChainSession が Worker 経由で `eth_getLogs` を定期取得する。
6. ログの入力全体を対象の Agent に適用する。HTTPの送信成功だけでは適用しない。
7. 次の Agent tick から新しい入力で判定・移動する。フレームの描画はブラウザーで継続する。

ログ取得間隔は600ms、Agent tick は200ms（再生速度1×）。停止ボタンはシミュレーションを止めますが、ログ受信は継続します。画面を隠した間も受信は行いますが、ブラウザーのバックグラウンド制限によって遅れることがあります。

## 入力の対応

| コントラクト | Runtime | GUI |
| --- | --- | --- |
| Activity.Rest = 0 | mode = rest | 休息 |
| Activity.Explore = 1 | mode = explore | 探索 |
| Activity.Forage = 2 | mode = forage | 採餌 |
| energy 0..10000 | エネルギー供給 0..1 | 供給 0..100% |
| stimulus 0..10000 | 刺激 0..1 | 刺激 0..100% |
| revision uint64 | 適用済み版（10進文字列） | rev N |

入力 energy は供給条件です。Inspector の ENERGY は Runtime が計算した現在の体力なので、同じ値とは限りません。

## API と保存境界

| API | 用途 |
| --- | --- |
| GET `/api/config` | モード、Registry、modelHash、3つのID |
| GET `/api/chain/snapshot` | 特定ブロック時点の3匹の状態と、それぞれの原因ログ |
| GET `/api/chain/events?after=N&hash=0x...` | cursor 以降の Registry ログと次の cursor |
| POST `/api/chain/status` | 固定 Registry の3匹に対する Status 書込 |
| GET `/api/chain/receipt?hash=0x...` | pending / mined / reverted |
| GET `/api/health` | Anvil と配置ブロックの整合確認 |

GET のログは Registry アドレスに限定し、block / transactionIndex / logIndex 順に整列します。`eventId` と revision で重複を排除します。停止後に再び開くと、チェーンの最新 Status と原因イベントから初期化します。

Anvil 内には登録情報・Status・イベントが残ります。Runtime の位置・スコア・Q値はブラウザー内であり、ページ再読込でリセットされます。JSON保存には現在の方策・経験・チェーン出典が含まれますが、完全な再開ファイルではありません。

チェーンの巻戻り・revision欠番を検知した場合は canonical な snapshot から**競争を初期化**します。元の軌跡や学習を取り消し前まで厳密に巻き戻す機能ではありません。Anvil自体を起動し直した場合は、`local:up` で設定を再生成しGUIを再読込します。

## ローカル専用の書込経路

ローカル API は公開用の Worker entrypoint と別です。`wrangler.sepolia.jsonc` による通常デプロイにはこのAPIを含めません。

- Anvil RPC は loopback のみ、chain IDは31337、client名はAnvilを検証。
- GUI の接続元も localhost / 127.0.0.1 に限定。
- 書込は同一Originの JSON、agentId 1..3、固定 owner / Registry / 関数に限定。
- 任意RPC転送や任意アドレスへの送金APIは提供しない。
- ルート `.env` の Cloudflare情報や実ネットワーク用の鍵は使わない。

これは操作しやすさを優先したローカル開発用の署名経路です。公開環境ではウォレット等の認証済み署名へ置き換えます。

## 動作確認

起動したまま、別ターミナルで実行します。

```sh
npm run test:local
```

デフォルトでは `.local/deployment.json` のGUIとRPCに接続します。公開URLに対する実行は拒否します。Chrome の場所が異なる場合は `CHROME_PATH=/path/to/chrome` を指定してください。

確認項目:

- 3匹の実登録とモデル manifest のハッシュ照合。
- automineを一時停止し、危険エリアと餌が採掘前には変化せず、確定後だけ反映されること。
- GUI送信の receipt・Status・イベント・Runtime入力が一致すること。
- 採餌と休息で実際の判定回数が変わること。
- 他個体の入力が変わらないこと。
- 重複ログ、古いrevision、範囲外入力、別Originを拒否すること。
- GUI以外から送ったトランザクションも受信すること。
- ページ再読込で最新Statusを復元すること。
- `evm_revert` 後に古い入力を捨てて同期し直すこと。
- PC／スマートフォンの表示と JavaScript エラー。

記録は `artifacts/local-chain/verification.json`、`desktop.png`、`mobile.png`。テストはローカル Status を変更します。初期状態から試したい場合は `Ctrl-C` 後に再起動してください。

その他の確認:

```sh
npm run format:check
npm run test:arena
make contracts-test
make test
```

## よくある問題

| 症状 | 対応 |
| --- | --- |
| ポートが使用中 | 上記の環境変数で別ポートを選ぶ。既存プロセスは止めない |
| forge / anvil が見つからない | Foundryを導入しPATHまたは実行ファイルの絶対パスを指定 |
| 登録時に失敗 | `.local/forge.log` を確認。submoduleとコンパイラを準備 |
| Workerが起動しない | ターミナルのWrangler出力と inspector port を確認 |
| 接続待ち / Deployment changed | Anvilと起動設定を揃えて local:up を再起動。GUIも再読込 |
| RevisionMismatch | 他の操作が先に更新した。受信後のrevisionを確認してもう一度送る |
| 適用待ち | Txが採掘されたか確認。自動再送はしない。テスト中ならautomineの復帰を待つ |
| 学習している個体が動かない | 学習室では競争を一時離脱。学習終了後に復帰 |

参照: [Foundry Anvil](https://www.getfoundry.sh/anvil/index.html)、[Cloudflare local development](https://developers.cloudflare.com/workers/local-development/)。

## 今回の実行記録（2026-09-25）

- Anvil / Registry / 3登録 / ローカル workerd の起動を確認。
- Foundry: 16テスト成功。Agent Runtime: 4テスト成功。既存Python: 2テスト成功。
- `test:local` の12項目が成功し、PC・モバイルともJavaScriptエラーなし。
- 実ブラウザーの30判定の観測例: 採餌では移動29 / 休息1、休息入力では移動6 / 休息24。入力による動作変化の確認であり、生物学的な評価ではない。
- 採餌Tx: `0x8eb4fdc28473660206dea1520a85c80cfd9849f488d2b7e7e9c824f6893cceb4`。
- 休息Tx: `0x4ba418b47903ba785fea33001c2d1742cc633c2b1f3ed4427655a3799d19a014`。
- このTxは今回の一時Anvil内だけに存在する。再起動後のチェーンや公開Explorerでは参照できない。
- 公開Workers・Sepoliaのデプロイは変更していない。
