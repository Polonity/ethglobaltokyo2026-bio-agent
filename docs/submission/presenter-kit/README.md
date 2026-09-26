# BioAgent — submission video & presenter Q&A / 提出動画・発表用回答集

2026-09-26。**まず動画で約1分の説明、質問には各言語3ページの回答集（基本2ページ＋AI比較1ページ）**を使います。動画は指定どおり **Anvil＋全166,700神経／個体**です。

| 用途 / Use | 日本語 | English |
| --- | --- | --- |
| 提出・説明動画 / Video | [日本語字幕 MP4](bioagent-submission-ja.mp4) | [English captions MP4](bioagent-submission-en.mp4) |
| 発表時の手元資料 / Printable Q&A | [日本語 PDF・3ページ](qa-cheatsheet-ja.pdf) | [English PDF · 3 pages](qa-cheatsheet-en.pdf) |
| 編集できる原稿 / Editable answers | [日本語 Markdown](qa-cheatsheet-ja.md) | [English Markdown](qa-cheatsheet-en.md) |

[**日英まとめて印刷：6ページPDF / Combined PDF**](qa-cheatsheet-ja-en.pdf) · [**言語切替付きブラウザー版 / HTML**](qa-cheatsheet.html)

動画はどちらも **51.5秒、1920×1080、30fps、H.264、音声なし**。英語GUIに、それぞれ英語／日本語の字幕を焼き込んでいます。[英語SRT](captions-en.srt) / [日本語SRT](captions-ja.srt)も同梱。字幕はGUIと重ならない下部帯に配置しています。

Both masters show the same real browser recording, with separate English and Japanese captions and no audio. Use the English MP4 for an English-speaking judging panel. The Q&A begins with a 30-second opening and provides 18 short answers per language, including a dedicated third page on expected energy, memory, latency and adaptation benefits versus other AI agents.

## AI Agentとの比較を準備する / Prepare for AI comparisons

3ページ目は、消費電力・設備費・メモリー・反応速度・適応について「期待する効果」と「実測」を分けた比較表と想定反論です。[説明の根拠・一次資料・測定計画](ai-agent-comparison.md)と[収録6周期の集計](resource-evidence.json)を参照できます。低電力・低コストの倍率は未測定です。

Page 3 adds a comparison table and five focused answers. The accompanying note distinguishes architectural hypotheses, recorded CPU resource use, ordinary small-model alternatives and a proposed matched benchmark.

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
| 検証 | [動画・ブラウザー・SHA-256](verification.json) / [PDF・目視確認](artifact-review.json) | 全編デコード、最後までのChrome再生、シーク、PDF全ページ |
| 編集 | [表示上の編集](render-metadata.json) / [収録計画](production-plan.md) | コンパクトCSS、receipt抜粋、字幕。結果の注入なし |

Receipt excerpts format real captured logs for readability and are labelled as excerpts. The original receipts are retained. The opening caption was shortened during editing; the final SRT files contain the published wording. The recording runs at its original speed; no synthetic result or balance is inserted. UI animations are illustrative and independent of neural/transaction timing.

Local Anvil transactions have **no public Etherscan link**. The upstream chain is Ethereum (1), forked at block **26,058,941**; the execution chain is Anvil (31337). The official Aqua address is `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`. See the capture evidence for block/code hashes and both representative receipts.

## 公開ページとの使い分け / Public demo vs video

[審査員向けSepoliaページ](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en)は **7神経・19接続**で、採餌・学習比較とRegistryの入力更新を体験するものです。Aqua／Uniswapへの注文は送りません。この提出動画の全神経・4個体・実テスト通貨交換とは範囲が異なります。

The public page is a lightweight interactive entry point. It is not a hosted version of the full-population trading runtime. The seven-neuron framework’s evaluate/adopt gate is also separate from the full-market runtime’s experimental online readout updates.

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
