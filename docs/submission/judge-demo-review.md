# 審査員向け公開デモの実動作レビュー

2026-09-26 / [日本語デモ](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja) / [English demo](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en)

**判定：研究・フレームワークの体験デモとして、審査員に見せられます。** 実Sepolia入力を取り込み、ブラウザーで行動し、学習候補を比較・採用・保存する一連の流れが動作しました。学習後の行動変化も目視できます。7神経の生物回路が通常AIより優れているという結論は出ていません。全神経・市場アプリ統合の説明には[提出動画](presenter-kit/README.md)を併用します。

[実ブラウザー・別シナリオ・実取引の記録](judge-demo-evidence.json) / [構成と使い方](../deployment/sepolia.md)

## その場で見せられる効果

画面の「学習して比較する」で、訓練とは別の固定4シナリオを比較しました。数値は各300ステップの平均です。これらは**方策選択用**であり、独立テストではありません。

| 指標 | 学習前 | 候補 |
| --- | ---: | ---: |
| 報酬 | 3.89 | 33.81 |
| 獲得した餌 | 6.25 | 12.50 |
| 障害物への接触 | 9.00 | 0.25 |
| 最終身体エネルギー | 59.2% | 32.6% |

餌と報酬が増え、接触が減ったため採用されます。一方、休息が減って身体エネルギーも低下しました。**報酬だけを最大化すればよいわけではない**ことが、具体的に説明できる結果です。身体エネルギーはシミュレーション内の体力であり、PCの消費電力ではありません。

画面のライブ個体でも、学習後の30秒間に餌の累計が2個から23個へ進みました。これは1回の動作確認で、学習前後を同じ開始状態で比べた効果量ではありません。

学習はボタン押下時の有限なreadout探索です。固定接続を再学習したり、閲覧中に常時学習したりはしません。再度同じ条件で学習すると今回は追加改善がなく、方策v2を維持しました。再読込では方策を復元し、身体・得点は初期化されます。

## 別20シナリオでも確認

公開Workerから配信される計算モジュールで、訓練・選択に使っていない20個のseedを事前に固定して確認しました。同じ採餌条件・各300ステップの探索的な比較です。新しい環境条件への適応や統計的有意差を実証するものではありません。

| 指標の平均 | 初期方策 | 学習後BioAgent | 学習後の直接入力対照 |
| --- | ---: | ---: | ---: |
| 報酬 | 21.77 | 48.13 | 50.82 |
| 餌 | 7.05 | 17.55 | 19.15 |
| 接触 | 0.00 | 0.00 | 0.00 |
| 最終身体エネルギー | 74.2% | 24.1% | 25.0% |

**学習の効果は観察できましたが、生物接続を通さない対照も同等以上でした。** この課題で生物回路の優位性を主張しないことが適切です。次の問いは、履歴や環境変化がある課題と体力制約の下で、どの構造が有効かです。

[公開画面：入口](judge-demo-review/initial-en.jpg) / [公開画面：学習結果](judge-demo-review/learning-en.jpg)

## 実動作と使い勝手

- 公開Workers上で7神経・19接続のモデル読み込み、実Sepoliaの観測ブロック更新、学習・採用・JSON保存・方策復元を確認。
- 所有者の入力変更を実送信し、revision **4→5→6**、休息→採餌を確認。終了時は採餌・供給70%・刺激55%に復帰。
- 実TX：[休息へ変更](https://sepolia.etherscan.io/tx/0x52fa0e0064620ef35683c834fe4abf3ef2b537a11dfdc9eaf1c0a53c87bc76df) / [採餌へ復帰](https://sepolia.etherscan.io/tx/0xf2ca702c0326e5d8d6f81ab276d833bab08bb208c35411c68aa976ef48423778)。2件の合計ガス費は **0.000075299830071968 Sepolia ETH**。
- 入力期限切れで停止し、有効な入力へ戻ると復帰。検査用の時刻変更は当該ブラウザー内だけで実施。
- 日英、1366×768のデスクトップ、390×844のモバイル表示を確認。ページ例外・横はみ出しなし。
- 初期画面に「1分で学習を試す」を追加。復帰後に古いエラーが残る問題と、未登録IDで前の個体の数値が残る問題を修正し、再公開後に確認。

ウォレット試験はNode署名器を使ったEIP-1193ブリッジです。MetaMask拡張の手動操作、Safari・実機スマートフォンの試験ではありません。ライブRPCへの接続が必要です。再読込後は前回の比較表ではなく保存方策を復元するので、初回の比較は新しいブラウザープロファイルで見せると分かりやすくなります。

## 1分で伝える順番

1. **0–10秒**：「Sepolia上の入力で、実測7神経の回路をブラウザーで動かします。ウォレットなしで試せます。」ブロックと行動を指します。
2. **10–25秒**：「学習して比較する」を押し、餌・接触・身体エネルギーを並べて見せます。
3. **25–40秒**：「餌を増やせました。ただし体力を消費しました。何を良い行動とするか、採用条件も必要だと分かります。」
4. **40–55秒**：「入力検証→学習→評価→採用→保存を共通フレームワークで扱います。」JSONの入力ブロック・モデル・方策hashを示します。hashは計算の正しさの証明ではありません。
5. **55–60秒**：「これは操作できる縮小版です。全166,700神経と市場アプリの統合は提出動画で見せています。」

## English: what to show judges

**Ready as an interactive research and framework demo.** Live Sepolia inputs drive a measured seven-neuron subgraph in the browser. Judges can train a readout, compare selection results, adopt it, restore it and export input/policy provenance without a wallet. Wallet writes were also exercised through the live page and confirmed on Sepolia; the default agent was returned to foraging.

On the four selection scenarios, average food increased **6.25→12.50**, contacts decreased **9.00→0.25**, and final body energy fell **59.2%→32.6%**. This tradeoff is the useful finding: more reward does not automatically mean a better overall policy.

An additional 20-seed check found more food after learning (**7.05→17.55**), but a trained direct-input control scored **19.15**. There is no demonstrated biological advantage here. These are synthetic, same-profile observations, not a trading, energy-efficiency or generalization guarantee.

**One-minute story:** trace the live input, press Train & compare, show both the improvement and energy tradeoff, then export provenance. Explain that the framework makes validation, evaluation, adoption and persistence reusable. Use the separate full-population video for the 166,700-neuron market integration.

## 再現

```sh
# 公開ページを閲覧・操作する。オンチェーン書込は行わない。
node scripts/sepolia/audit-judge-demo.mjs

# 任意：所有者の実入力変更2件。既存Sepolia署名環境とガスが必要。
npm run test:sepolia:public -- --broadcast
```

前者は30秒間の採餌、別20シナリオ、導線、未登録IDからの復帰、期限切れ入力からの復帰、配信ファイルのhash一致を確認します。JSONと日英・モバイル画像は `artifacts/sepolia/judge-review-final/` に保存します。時刻・待ち時間は当該試験の観測値で、性能保証ではありません。
