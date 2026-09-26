# Documentary review cut

日英とも **3分46秒・1920×1080・30fps**。本人の英語ナレーションを収録する前の無音・字幕付き編集確認版。字幕時刻はリハーサル用で、音声収録後に同期を調整する。合成音声は使用していない。

- 日本語確認版：`artifacts/documentary/bioagent-documentary-review-ja.mp4`
- 英語版：`artifacts/documentary/bioagent-documentary-review-en.mp4`
- 字幕：`artifacts/documentary/bioagent-documentary-{ja,en}.srt`
- 編集元・カット時刻・再生倍率・元ファイルSHA-256：`artifacts/documentary/production.json`
- ブラウザ再生検証：`artifacts/documentary/browser-check.json`

| 時刻 | 内容 |
|---|---|
| 0:00–0:15 | MaleCNS公式ページの実スクリーンショットで導入 |
| 0:15–0:25 | アプリを作ったというセリフでMOMOとSORAのGUIへ |
| 0:25–0:50 | 過去の失敗。通常速度＋明示付き0.25倍速リプレイ |
| 0:50–1:32 | 左から右へ流れる処理アニメーション。採用理由→リッジ回帰 |
| 1:32–1:51 | GUIの保存済み学習結果、CPU環境 |
| 1:51–2:31 | 修正・学習後の実行、0.25倍速リプレイ、回収後の停止画面 |
| 2:31–2:56 | 未使用配置での評価と安全基準の未達 |
| 2:56–3:21 | 1inch Aqua Protocol、Uniswap v3、ERC-20の移動 |
| 3:21–3:46 | IBioAgent等の設計図、提案と出典 |

採餌実況の回収字幕は、スロー再生中のMOMO・SORAのカウンター増加に合わせて配置。旧実装と修正後を区別し、モデル・入力変換・学習のすべてが同じだったとは主張しない。市場映像は別の検証済み収録で、テスト資産とEthereum forkを画面に明記する。

説明アニメーションは模式図であり、実際の神経活動の録画ではない。字幕は映像下部の専用120px領域に表示し、GUI、設計図、出典を遮らない。元映像を速度を上げて圧縮していない。

検証：日英両ファイルを全編デコード。Chromeで再生開始、9時点へのシーク、終端再生、1920×1080と226秒を確認。代表フレームで日本語字幕、回収カウンター、図と出典の非重複を目視確認。本人音声の収録・同期が残っているため、提出準備完了とは扱わない。

再生成：

```sh
node scripts/submission/capture-malecns-intro.mjs
node scripts/submission/render-protocol-animation.mjs
node scripts/submission/render-protocol-animation.mjs protocol-design
node scripts/submission/render-documentary.mjs
node scripts/submission/check-documentary.mjs
```

冒頭の出典：https://male-cns.janelia.org/ 。Chromeで公式ページを改変せずに撮影。URL・取得時刻・画像ハッシュは `artifacts/documentary/sources/malecns-official-page.json` に保存。

英語原稿を361語から235語へ短縮。3分46秒のまま、約62語/分（表記上の語数。製品番号を読む音節分は増える）を目安に、図や動きを見る間を確保。専門名とリッジ回帰の採用理由を残し、文法と一般表現を簡略化した。
