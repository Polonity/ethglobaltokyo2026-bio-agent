# BioAgent — submission video & presenter Q&A / 提出動画・発表用回答集

2026-09-26更新。**目的 → 環境TX → 判断 → 学習 → 検証 → 次の課題**の順で説明します。まず日英6枚のスライドで約1分、その後は4ページの手元資料（実演手順1＋Q&A 2＋AI比較1）を使います。

| 用途 / Use | 日本語 | English |
| --- | --- | --- |
| 最新の説明スライド / Current slides | [日本語 PDF](explanation-ja.pdf) · [PPTX](explanation-ja.pptx) | [English PDF](explanation-en.pdf) · [PPTX](explanation-en.pptx) |
| 話す原稿と操作手順 / Script & walkthrough | [日本語](walkthrough-ja.md) · [HTML](explanation-ja.html) | [English](walkthrough-en.md) · [HTML](explanation-en.html) |
| 全神経の提出動画 / Recorded full-market video | [日本語字幕 MP4](bioagent-submission-ja.mp4) | [English captions MP4](bioagent-submission-en.mp4) |
| 発表時の手元資料 / Printable Q&A | [日本語 PDF・4ページ](qa-cheatsheet-ja.pdf) | [English PDF · 4 pages](qa-cheatsheet-en.pdf) |
| 編集できる原稿 / Editable answers | [日本語 Markdown](qa-cheatsheet-ja.md) | [English Markdown](qa-cheatsheet-en.md) |

[**日英まとめて印刷：8ページPDF / Combined PDF**](qa-cheatsheet-ja-en.pdf) · [**言語切替付きブラウザー版 / HTML**](qa-cheatsheet.html)

動画はどちらも **51.5秒、1920×1080、30fps、H.264、音声なし**。英語GUIに、それぞれ英語／日本語の字幕を焼き込んでいます。[英語SRT](captions-en.srt) / [日本語SRT](captions-ja.srt)も同梱。字幕はGUIと重ならない下部帯に配置しています。

Both masters show the same real browser recording, with separate English and Japanese captions and no audio. Use the English MP4 for an English-speaking judging panel. Start with the six current slides or the one-minute script. Each four-page Q&A has a purpose and five-step demo guide, 18 short answers, and a final page on expected resource and adaptation benefits. The video is a separate, unchanged recording of the full-population market runtime.

## 最初に伝える目的 / State the purpose first

**生物由来の判断モデルをオンチェーン入力で動かし、経験から適応させ、その効果を対照モデルと比較できるフレームワークをつくる。** Agent開発者と研究者が、入力検証・モデルの出典・学習結果を再利用して評価できるようにすることが狙いです。省電力・低コスト・通常AIへの優位は検証する仮説です。

**Build a framework for running biologically derived decision models on onchain inputs, adapting from experience and comparing their effects against controls.** The intended users are agent developers and researchers. Lower energy, cost and superior adaptation remain hypotheses.

## 公開デモの進め方 / Walk through the public demo

1. **開く / Open:** ウォレットなしで3個体を観察する。
2. **出典 / Trace:** 「環境と餌の入力TX」で初期環境と危険エリアのTXを開く。
3. **反応 / Observe:** 正の刺激TX → 餌1個 → 感覚入力 → 移動・休息の順に示す。
4. **学習 / Learn:** 個体を選び「学習室へ / Start learning」。確認済み環境のコピーと経験でQ値を更新する。
5. **比較 / Compare:** 学習前・候補・採用／維持を見る。同環境の再生比較であり、独立した汎化試験とは分ける。

定期送信は毎時確認・最低1時間間隔です。1分の発表では記録済みTXを使います。手動送信は所有者のみ。餌を食べ切ったら休息し、自動補充しません。改善しない結果もそのまま説明します。英語での読み上げは[English walkthrough](walkthrough-en.md)を使用します。

## どの証拠を使うか / Evidence boundaries

| 対象 / Track | 何を示すか / What it demonstrates |
| --- | --- |
| 現在の共通Fly Lab / Current shared Fly Lab | Sepolia・7神経・3個体。初期環境・危険エリア・餌・刺激がTX由来。身体とQ学習はブラウザー内。Anvilと同じUI・処理。 |
| 提出動画 / Submitted video | Anvil・全166,700神経×4個体。Aqua／V3の実テスト通貨交換とreadout更新。**環境TX変更前の収録**であり、最新の箱庭入力の証拠には使わない。 |
| 独立研究 / Controlled research | 合成採餌課題の学習・評価・対照比較。公開画面の学習スコアとは別の結果。 |

Watching and learning require no wallet; manual writes require the owner. The public page uses Q-learning on confirmed-world replays, the recorded full market uses online readout updates, and the separate JS research framework has its own evaluation/adoption API. These are distinct implementations. The public page does not trade on Aqua or Uniswap.

## AI Agentとの比較を準備する / Prepare for AI comparisons

4ページ目は、消費電力・設備費・メモリー・反応速度・適応について「期待する効果」と「実測」を分けた比較表と想定反論です。[説明の根拠・一次資料・測定計画](ai-agent-comparison.md)と[収録6周期の集計](resource-evidence.json)を参照できます。低電力・低コストの倍率は未測定です。

Page 4 adds a comparison table and five focused answers. The accompanying note distinguishes architectural hypotheses, recorded CPU resource use, ordinary small-model alternatives and a proposed matched benchmark.

## 約1分で見せること / Video chapters

| 時間 / Time | 見せること / Scene |
| --- | --- |
| 0–3秒 | 4個体、各166,700神経 / Four full-population agents |
| 3–10秒 | 2個体が共通ウォレットからAquaへ提示 / Makers and shared custody |
| 10–18秒 | 2個体の売買判断と通常コードによる見積もり比較 / Traders and executable quotes |
| 18–27秒 | 成立した行動結果によるreadout更新 / Learning from confirmed outcomes |
| 27–32秒 | 全神経・計算資源・個体別更新履歴 / Model, resource use and policy history |
| 32–39秒 | 新規Aqua決済のreceipt / A fresh Aqua settlement |
| 39–46秒 | 新規V3決済のreceipt / A fresh Uniswap V3 settlement |
| 46–52秒 | 入力・学習・決済を追跡する実験基盤 / Research scope and limits |

## 今回確認できた事実 / Recording evidence

- 6周期で **Aqua 1件、Uniswap V3 11件**が新規に成立。12件すべての成功receipt、テストトークンTransfer、対応するAqua／V3イベントをRPCで確認しました。
- 全4個体のreadout更新数が **37→43**。保存重みが変化したのはMOMO・KOHARU・HINATAの3個体です。SORAは更新処理を受けましたが重みは変わっていません。
- 各個体で **166,700の分類付きMaleCNS神経、25,582,938接続**を計算。グラフを共有し、個体ごとの神経状態を持ちます。実測接続を用いた人工動力学で、生物学的な全脳の再現を意味しません。
- Pythonプロセスのpeak RSS **443.2 MiB**、最後の4個体分の神経計算 **333.3 ms**、同周期全体 **2,581.8 ms**。CPU・メモリーの一回の観測で、平均速度、全システムのRAM、電力、LLM比較ではありません。
- 収録時にGUIから目標保有比率を85%／15%へ変更し、人工的な需要を作りました。終了後は停止し、元の70%／30%に戻しています。残高・学習状態・累積カウンターはリセットしていません。

Six cycles produced 12 new successful local settlements. All four agents received six learning updates; three changed weights. These observations establish a working inference–outcome–update path, not improved trading performance. The separate seven-neuron foraging result (18.79 → 56.12 reward; direct-input control 56.08) is explained in the Q&A and must not be presented as a full-market or profitability result.

## 根拠を開く / Evidence index

| 参照 | ファイル / Source | 何の証拠か / Scope |
| --- | --- | --- |
| R1 | [収録記録](capture-evidence.json) / [全12決済・6周期](settlement-evidence.json) | model、実測資源、更新差分、raw receipt・Transfer・イベント |
| R2 | [共有市場の実装・仕様](../../apps/shared-market/README.md) | 行動選択、通常の経路比較、PnL、実行条件 |
| R3 | [採餌実験の結果と限界](../../research/bioagent-adaptation/README.md) | 未使用環境での効果、直接入力対照、体力の悪化 |
| R4 | [7神経フレームワーク](../../../packages/bioagent-framework/README.md) | IBioAgentとLearningBioAgentの違い、採用・復元・入力検証 |
| R5 | [Sepolia公開デモ](../../deployment/sepolia.md) | 縮小版の操作、Registry入力TX、公開版の範囲 |
| R7 | [AI Agent比較の根拠](ai-agent-comparison.md) / [資源集計](resource-evidence.json) | 期待効果、実測範囲、一次資料と未実施の比較計画 |
| R6 | [ETHGlobal公式要件](https://ethglobal.com/events/tokyo2026/prizes) | 2026-09-26確認の1inch・Uniswap要件 |
| 検証 | [動画・ブラウザー・SHA-256](verification.json) / [PDF・目視確認](artifact-review.json) / [PPTX・PDF監査](document-audit.json) | 全編デコード、最後までのChrome再生、シーク、PDF全ページ |
| 編集 | [表示上の編集](render-metadata.json) / [収録計画](production-plan.md) | コンパクトCSS、receipt抜粋、字幕。結果の注入なし |

Receipt excerpts format real captured logs for readability and are labelled as excerpts. The original receipts are retained. The opening caption was shortened during editing; the final SRT files contain the published wording. The recording runs at its original speed; no synthetic result or balance is inserted. UI animations are illustrative and independent of neural/transaction timing.

Local Anvil transactions have **no public Etherscan link**. The upstream chain is Ethereum (1), forked at block **26,058,941**; the execution chain is Anvil (31337). The official Aqua address is `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`. See the capture evidence for block/code hashes and both representative receipts.

## 公開ページとの使い分け / Public demo vs video

[審査員向けSepoliaページ](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en)は **7神経・19接続**で、採餌・学習比較とRegistryの入力更新を体験するものです。Aqua／Uniswapへの注文は送りません。この提出動画の全神経・4個体・実テスト通貨交換とは範囲が異なります。

The video predates the environment-TX changes; use the current public page to demonstrate TX-derived hazards and food. The public page is a lightweight interactive entry point. It is not a hosted version of the full-population trading runtime. The seven-neuron framework’s evaluate/adopt gate is also separate from the full-market runtime’s experimental online readout updates.

## 資料どおりに操作できるか / Walkthrough verification

[公開ページでの確認記録](public-walkthrough.json)：初期環境TX、日英切替、学習完了、採用／維持の表示、390px画面、共通ビルドとの一致を確認しました。今回は候補のスコアが13.8943→13.8401へ下がり、元の方策を維持しました。TX送信は行っていません。

The public walkthrough completed without a wallet or a chain write. A slightly lower-scoring candidate was correctly rejected. This verifies the explanation and adoption behavior, not generalization or a new performance result.

## 再生成 / Reproduction

Repository root, existing Node/Chrome/ffmpeg dependencies. PDF generation uses installed Noto Sans CJK JP. The capture requires the existing shared market at `127.0.0.1:8814` and its Anvil fork at `127.0.0.1:18551`, paused with prior transactions. It resumes only its own local run, preserves learning/balances and restores the initial targets. Do not reset or redeploy a chain to view these delivered files.

```sh
# 新規収録：ローカルAnvilに取引を送る / record a new local run
node scripts/submission/record-presenter-demo.mjs
# 読み取りだけで収録中の全決済を検証 / verify all captured receipts
node scripts/submission/collect-presenter-settlements.mjs
# 既存raw動画から字幕版だけを再生成 / render without a new run
node scripts/submission/render-presenter-demo.mjs
# 同じ収録の資源・readoutを集計 / summarize captured resources
node scripts/submission/summarize-presenter-resources.mjs
# 段階別スライド・原稿を生成 / build current slides and script
node scripts/submission/build-presenter-walkthrough.mjs
# 回答集とPDFを生成 / build Q&A and PDFs
node scripts/submission/build-presenter-cheatsheet.mjs
# 全編デコード・Chrome再生・資料操作 / validate delivered artifacts
node scripts/submission/verify-presenter-kit.mjs
# 動画・収録証拠が不変の資料更新だけなら / unchanged videos: verify docs only
node scripts/submission/verify-presenter-kit.mjs --docs-only
```

The raw WebM and playback screenshots are local, Git-ignored files under `artifacts/submission-presenter-20260926/`. Delivered MP4s, PDFs, editable text, public-safe receipts and verification results are tracked here. If re-recording, re-check the narrative and perform a fresh visual review; generated assertions alone do not validate the presentation.

## 提出直前の事務項目 / Before submitting

動画と回答集の作成は完了しています。外部フォームへの送信や最新コミットの公開はこの作業では実施していません。[Uniswapの公式要件](https://ethglobal.com/events/tokyo2026/prizes#uniswap-foundation)にある **FEEDBACK.md** と [Developer Feedback Form](https://developers.uniswap.org/hackathon-feedback) は別途必要です。この時点ではFEEDBACK.mdは未作成、フォーム送信は未確認です。旧版の動画と取り違えず、上表のMP4を使用してください。

段階別資料の共通原稿は `scripts/submission/presenter-walkthrough.mjs`。チートシートの冒頭・スライド・読み上げ原稿を同じデータから生成します。PDF描画とPPTXの構造・ノートは検証済みですが、PowerPoint本体での描画は未確認です。
