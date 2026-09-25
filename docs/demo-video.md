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
