# 最新版：4匹の共有市場デモ

2026-09-26収録。**60秒・英語GUI＋英語字幕・音声なし**。1600×1120、30fps、H.264 / faststart、約8.9 MB。

**[動画を再生・ダウンロード](submission/evidence/shared-market-demo-en.mp4)** / [収録中の実TX・学習状態](submission/evidence/shared-market-demo-verification.json) / [英語字幕SRT](submission/evidence/shared-market-demo-en.srt)

現在のアプリ http://127.0.0.1:8814/ を実操作しました。MOMO/SORAのAqua提示とKOHARU/HINATAの実売買、取引先比較、評価損益、実TXモーダル、MaleCNS・policy情報を約1分で紹介します。字幕はGUIを隠さない下部専用帯に表示しています。

収録中の8周期で **Aqua 5約定・Uniswap V3 11スワップ**が新規に成立しました。モーダルに表示するTXも今回成立したものです。既存の累積カウンターはリセットせず、そのまま収録しています。全4個体のMaleCNS（166,700神経/個体）と実結果からのオンラインreadout更新を使い、利益や数値を映像用に作り替えていません。ブラウザ例外なし、完成MP4の全編デコードと主要場面を確認済みです。

| 時間の目安 | 内容 |
| --- | --- |
| 0–6秒 | 4匹・共通市場の概要 |
| 6–19秒 | 提示側2匹と売買側2匹の役割 |
| 19–35秒 | 経路比較、神経判断、実約定と学習 |
| 35–39秒 | 評価損益とガス代の区別 |
| 39–46秒 | 今回成立したAqua取引のreceipt |
| 46–54秒 | 公式Aqua、共通通貨、全神経の計測とpolicy情報 |
| 54–60秒 | 実験の位置づけ |

ローカルEthereumフォーク内のテスト通貨交換です。人工需要と実験的オンライン学習を使い、公開市場での需要・利益・生物学的妥当性の検証を主張しません。詳しくは[実画面付き説明書](apps/shared-market/README.md)。

再収録は共有市場サーバーが起動・一時停止中で、既存の取引がある状態で実行します。約30秒間、実際のローカル取引を再開します。終了後は停止します。

```sh
node scripts/full/record-shared-market.mjs
# artifacts/shared-market-demo/shared-market-demo-en.mp4
```

# アーカイブ：2個体Aqua 英語デモ

2026-09-26収録。**61.04秒・英語GUI＋説明テロップ・音声なし**。1600×1050、H.264 / faststart。

**[動画を再生・ダウンロード](submission/evidence/aqua-current-demo-en.mp4)** / [今回のTX・policy・残高照合](submission/evidence/aqua-current-demo-verification.json)

かわいいMOMO/SORAの選択 → 同じウォレットでの提示 → 公式AquaのEthereum fork → 成功receiptのトークン移動 → 結び、の順です。現在の提出用GUI `http://127.0.0.1:8813/aqua` を実操作しました。各166,700神経、10件の交換を検証し、数値を映像用に作り替えていません。学習済みpolicyを利用しており、収録中の再学習ではありません。local fork内のテストトークン取引です。

```sh
AQUA_DEMO_CAPTIONS=1 AQUA_EVIDENCE_OUTPUT=artifacts/aqua-current-demo-20260926 node scripts/submission/verify-aqua-fork.mjs
```

> UI刷新後の画面は[観察中心のUI](design/player-experience.md)を参照。以下の既存動画は刷新前のUIの記録です。収録スクリプトは詳細モーダルに対応しましたが、このUI変更では動画は再生成していません。

# アーカイブ：全MaleCNS・3アプリ別の英語デモ

2026-09-26の画像付きゲーム説明書を含む全神経GUIを、実際に操作して収録しています。英語GUI・英語字幕、音声なし、1600×1100 H.264 / faststart。各動画は約1分です。

| 動画 | 見どころ |
| --- | --- |
| `artifacts/full-app-demos-20260926/foraging-english.mp4` | 刺激0.75の入力、蜜・危険・身体、2個体の行動、StatusのTX |
| `artifacts/full-app-demos-20260926/market-english.mp4` | ローカルUniswap価格履歴、ペーパー売買・PnL、価格入力のTX |
| `artifacts/full-app-demos-20260926/aqua-english.mp4` | 流動性の提示・撤回、実テストトークンTX、代理報酬 |

各動画は、説明書 → 実画面付きガイド → 現在の方策で実行 → 個体の状態 → 入力から行動の履歴 → receipt → 保存済み学習評価、の順です。1個体166,700神経・25,582,938接続のMaleCNS構造を使います。動力学・入出力変換は人工設計です。市場売買はペーパー、Aqua評価は価格代理指標であり、実資金運用や収益性を示しません。

学習評価表は以前に完了した実験の保存結果です。この録画で学習を新規実行したとは説明せず、字幕でも区別しています。画像付き説明書の写真も撮影時の例であり、現在の数値とは区別します。

```sh
node scripts/record-full-app-demos.mjs
node scripts/verify-full-app-demos.mjs
```

ローカルGUI `http://127.0.0.1:8812` とそのAnvil、Chrome、ffmpeg、npm依存が必要です。録画はGUI経由で通常実行を起動してローカルTXを送ります。同じチェーンで他の実験・学習ジョブを同時実行しないでください。既存ジョブがある場合は開始を拒否します。`FULL_APPS_URL` と `DEMO_OUTPUT` でURLと保存先を指定できます。

`*-evidence.json` に実際の入力・出力、神経数、TX、保存済み評価、字幕時刻とブラウザー例外を記録します。`verification.json` は全フレームデコードとChrome再生・シークの検証結果です。収録スクリプトは説明字幕・スクロールに加え、receiptの取得済み実フィールドを動画用に拡大整形します（その旨も画面表示）。Agentの結果やTXデータを注入・変更しません。再収録時は同名MP4と証拠ファイルを更新します。

---

# 旧版: 2アプリ + Circuit Lab 統合デモ（英語）

提出用の統合版は `artifacts/submission-demo/bioagent-submission-english.mp4`。英語GUI・英語字幕、音声なし、約1分30秒、1600×1100 H.264 / faststart。

## 構成

1. 採餌: 登録個体へ実TXで刺激を送り、身体状態が方策の入力になることを紹介。
2. 市場: 実Uniswap V3のローカルSwap、紙約定・PnL、source receipt、学習結果。
3. Circuit Lab: 登録descriptorを持つ実測7神経・19接続へ0%→100%を実TXで入力。
4. 同じ刺激で接続を除去した対照と比較し、回路への依存を表示。
5. 出典・抽出・動力学・mappingの参照と、現在の実装境界を説明。

採餌・市場はsynthetic、Circuit Labは実測構造を使った人工動力学という違いを字幕で明示します。生物学的な再現や、標準全体の相互運用を実装したとは説明しません。

## 再収録

[ローカル起動](deployment/local-anvil.md)、[市場設定](design/local-market-app.md)、[回路設定](design/circuit-evidence.md)が完了した環境で実行します。既に動く環境ではlocal:market / local:circuitの再配置は不要です。

```sh
LOCAL_GUI_URL=http://127.0.0.1:8799 node scripts/record-submission-demo.mjs
node scripts/verify-submission-video.mjs
```

必要なものはnpm依存、Chrome、ffmpeg、Python 3（標準ライブラリのみ）。実際のGUI経由でローカルTXを送るため、同じチェーンに対するテストや録画を同時実行しないでください。

出力:
- `bioagent-submission-english.mp4`: 統合動画。
- `evidence.json`: 章の時刻、採餌TX、身体入力、市場状態、回路の無刺激/強刺激と除去対照、ブラウザー例外。
- `circuit-evidence.json`: GUIからexportした回路trace。Python参照実装でも照合します。
- `circuit-comparison.png`、`final.png`、`raw/`: 確認画像と元WebM。
- `verification.json`、`playback-*.png`: 全フレームのデコード、Chromeでの再生・シーク、記録された実行結果の検証。

同じ統合版出力先への再実行は上書きします。以前の2アプリ本編・回路補足動画は別フォルダに保存したままです。字幕追加とスクロールは収録用の表示操作であり、Agentの計算結果は注入しません。

---

# 旧補足版: 回路の証拠を示す英語動画（2026-09-26）

`artifacts/circuit-browser/bioagent-circuit-evidence-en.mp4`は、実測MaleCNS部分グラフの刺激→計算→行動と、接続除去対照、Anvil receiptを示す補足映像です。[再収録・境界](design/circuit-evidence.md)と[達成状況監査](submission/goal-audit.md)を参照してください。下記の2アプリ本編は両ゲームがsyntheticであることを説明したまま保存しています。

# 旧版: 2アプリの英語デモ（2026-09-26）

以前の2アプリ版は `artifacts/two-app-demo/bioagent-two-apps-english.mp4`。英語GUI・英語字幕、音声なし、1600×1100のH.264動画です。採餌への実TX、食事と身体入力、ローカル実Uniswap V3の価格変化、紙約定・PnL、source receipt、学習結果を約53秒で紹介します。

`evidence.json`には字幕時刻、実際の入力TX、身体状態、市場snapshot、ブラウザー例外を記録しています。映像内の字幕は説明用であり、結果を注入するものではありません。成果物はGit管理対象外です。

## 旧2アプリ版の再収録

[市場アプリの起動](design/local-market-app.md)に従いAnvilとWorkersを起動します。以下は検証に使用した別ポート構成です。

```sh
LOCAL_STATE_DIR=.local/embodied ANVIL_PORT=18546 LOCAL_GUI_PORT=8799 LOCAL_INSPECTOR_PORT=9250 npm run local:up
# 別ターミナル。新しい市場を作るため、それまでの市場セッションは終了:
LOCAL_STATE_DIR=.local/embodied npm run local:market
LOCAL_GUI_URL=http://127.0.0.1:8799 node scripts/record-two-app-demo.mjs
```

forge/anvilをPATHに置き、Chromeとffmpegを用意してください。録画中は同じチェーンを書き換える他の検証を実行しないでください。既存のtwo-app-demo成果物は上書きされます。動画はsyntheticモデルのローカル実験であり、MaleCNS実行や実資金トレード、Sepolia配置を示しません。

以下は以前の採餌のみの録画手順・当時の状態です。現在の2アプリについては上記と[提出パッケージ](submission/README.md)を参照してください。

---

# ローカル版デモ動画

2026-09-25 時点の Anvil + Cloudflare Workers ローカル版を、実際のブラウザー操作で収録しています。日本語字幕付き、音声なしの MP4 です。

## 見せる流れ

1. Anvil（chain ID 31337）に登録済みの MOMO・SORA・KIKI を表示。
2. MOMO に採餌・エネルギー90%・刺激95%を GUI から送信。
3. 確定した `BioAgentStatusUpdated` を受信し、MOMO の行動に反映。
4. MOMO を休息・エネルギー40%・刺激0%に切り替えて反応を比較。
5. SORA に探索・エネルギー85%・刺激80%を送信。
6. AUTO を有効化し、下位個体の学習と、評価後の競技復帰を観察。

登場するハエはブラウザー内 Q-learning モデルです。MaleCNS 神経回路はまだ実行していません。学習では 3,840 ステップの候補を評価し、改善しなければ元の方策を維持します。動画は学習処理の実行を示すもので、性能向上を保証するものではありません。

## 再収録

必要なもの: Node.js、npm依存関係、Google Chrome、ffmpeg。先に [ローカル起動手順](deployment/local-anvil.md) に従って `npm run local:up` を実行します。

```sh
node scripts/record-demo.mjs
```

Chrome が別の場所にある場合は `CHROME_PATH` を指定します。スクリプトは `.local/deployment.json` を読み、localhost / 127.0.0.1 と chain ID 31337 に限定します。GUI 経由で実際にローカルコントラクトを書き換えるため、MOMO と SORA の入力と revision が更新されます。公開 Workers や Sepolia へのデプロイは行いません。

出力:

- `artifacts/demo/fly-lab-anvil-demo.mp4`: H.264 / 1600×1100 / 25fps、再生開始を早める faststart 対応。
- `artifacts/demo/evidence.json`: 各字幕の時刻、実トランザクション・受信イベント、反応回数、学習評価、ブラウザー例外。
- `artifacts/demo/raw/`: Playwright が収録した元の WebM。
- `artifacts/demo/final.png`: 最終画面。

成果物は Git 管理対象外です。再収録で MP4 と evidence.json は上書きされます。動画と証跡は一緒に保存してください。

字幕と85%表示倍率は収録用にブラウザーへ追加します。Agent・学習・コントラクトの状態を注入せず、操作は GUI 経由で行います。`?test=1` の観察用 API は結果の読み取りだけに利用しています。

## 検証

スクリプトは3匹の表示、各送信のイベント反映、採餌時の移動、休息時の休止判断、学習完了、ブラウザー例外なしを確認します。映像は書き出し後に全フレームのデコード、代表フレームでの字幕と学習画面の確認、ChromeでのMP4再生を確認します。

```sh
ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,r_frame_rate -of json artifacts/demo/fly-lab-anvil-demo.mp4
ffmpeg -v error -i artifacts/demo/fly-lab-anvil-demo.mp4 -f null -
```

## 最新GUIの英語デモ（2026-09-25）

```sh
node scripts/record-demo-en.mjs
```

英語GUI・英語字幕・音声なし。オリジナルの丸いハエ、状態の実況、取引カード、Tx hashから開くAnvil receipt、休息の吹き出し、その場で止まる自動学習と復帰を収録します。日本語版の成果物は上書きしません。

出力は `artifacts/demo-en/fly-lab-english-demo.mp4`。同ディレクトリに `evidence.json`、`final.png`、`raw/` を保存します。録画には実際のローカルStatus更新が含まれます。`test:local` などAnvilを書き換える検証と同時実行しないでください。

英語版は `en-US` のブラウザーを作成し、GUIでもEnglishを選択します。字幕は画面の説明用であり、Agentの状態は変更しません。学習中の座標が変わらないこと、復帰後の評価、取引receiptの採掘成功、判定回数の変化を検証します。

最後に現在の接続範囲を英語で明記します。Uniswap価格観察Runtimeとwallet参照の基盤は追加済みですが、この動画のGUIには未接続です。MaleCNS回路の実行でもありません。
