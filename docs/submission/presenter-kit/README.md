# BioAgent — 提出動画・発表資料 / Presenter kit

2026-09-26再収録。**目的 → 環境TX → 行動 → 学習比較 → 市場の決済 → 次の検証**を約1分で示します。

| 用途 / Use | 日本語 | English |
| --- | --- | --- |
| 提出動画 / Video | [日本語字幕 MP4](bioagent-submission-ja.mp4) | [English captions MP4](bioagent-submission-en.mp4) |
| 説明スライド・6枚 / Six slides | [PDF](explanation-ja.pdf) · [PPTX](explanation-ja.pptx) | [PDF](explanation-en.pdf) · [PPTX](explanation-en.pptx) |
| 原稿・操作手順 / Walkthrough | [日本語](walkthrough-ja.md) · [HTML](explanation-ja.html) | [English](walkthrough-en.md) · [HTML](explanation-en.html) |
| Q&A・4ページ / Four-page Q&A | [PDF](qa-cheatsheet-ja.pdf) · [原稿](qa-cheatsheet-ja.md) | [PDF](qa-cheatsheet-en.pdf) · [Text](qa-cheatsheet-en.md) |

[日英8ページPDF / Combined PDF](qa-cheatsheet-ja-en.pdf) · [言語切替HTML / Interactive Q&A](qa-cheatsheet.html)

動画は **57.1秒、1920×1080、30fps、H.264、音声なし**。英語の実画面に日英それぞれの字幕を焼き込んでいます。[日本語SRT](captions-ja.srt) / [English SRT](captions-en.srt)。字幕は画面下の専用帯に配置しています。

Both masters use the same newly recorded browser footage. Setup, navigation and long learning/settlement waits are cut; each included segment runs at its original speed. The learning-wait cut is explicitly captioned. Raw capture lasted 243.1 seconds. Receipt excerpts are labelled and derived from actual logs; no result data or balances are inserted.

## 何を伝えるか / Purpose

**生物由来の判断モデルをオンチェーン入力で動かし、経験から適応させ、効果と資源消費を比較できるフレームワークをつくる。** Agent開発者・研究者が、入力検証・モデルの出典・学習結果を再利用して評価するための基盤です。省電力・低コスト・通常AIへの優位は、今後検証する仮説です。

**Build a framework to run biologically derived decision models on onchain inputs, adapt from experience and compare effects and resource use.** The intended users are agent developers and researchers. Lower energy, cost and superior adaptation remain hypotheses.

## 動画の流れ / Chapters

| 時間 / Time | 場面 / Scene |
| --- | --- |
| 0.0–4.0s | BioAgent｜生物由来の判断モデルを、使って検証する / BioAgent | Test biological decision models |
| 4.0–10.0s | 1｜初期環境をトランザクションで構築 / 1 | Initialize the world with a transaction |
| 10.0–14.1s | 実際の初期環境TXを確認 / Verify the actual environment receipt |
| 14.1–20.1s | 2｜行動して経験を集める / 2 | Observe actions and collect experience |
| 20.1–27.1s | 3｜同じ入力で比べて採用する（学習待ち時間は省略） / 3 | Compare before adopting · learning wait omitted |
| 27.1–32.1s | 構造は実測、動力学は人工設計 / Full measured connectivity, engineered dynamics |
| 32.1–40.1s | 4｜全神経モデルを、同じ市場の4個体へ / 4 | Apply the full model to a shared market |
| 40.1–46.0s | Aqua｜今回成立したローカル決済 / Aqua | A freshly confirmed local settlement |
| 46.0–52.0s | Uniswap V3｜今回成立したローカル決済 / Uniswap V3 | A freshly confirmed local settlement |
| 52.0–57.1s | 効果と限界を比較できるフレームワークへ / A framework for testing benefits and limits |

## 今回の証拠 / This recording

- **前半：全神経の採餌2個体。** 初期環境TXに寸法・seed・危険エリアを記録。確定した刺激TXから餌を追加。新旧方策に同じ確認済み環境・刺激TXを再生し、比較結果に従って採用／維持します。今回はMOMOが維持（5.20→−1.54）、SORAが採用（4.08→8.64）。別条件のテスト報酬は−6.29／−12.79で、汎化の改善は示していません。身体・判断・学習はオフチェーンです。
- **後半：全神経の市場4個体。** 14周期で新規 **Aqua 2件・Uniswap V3 25件**。全27件の成功receipt、ERC20 Transfer、対応するコントラクトイベントをRPCで確認しました。市場の累積表示には前の収録分も含みます。
- 市場では4個体すべてに14回のreadout更新があり、3個体の保存重みが変化しました。更新数の差分は[収録記録](capture-evidence.json)に保存しています。これは学習経路の動作であり、収益改善の証明ではありません。
- 各個体は **166,700神経・25,582,938接続**の計算。実測MaleCNS接続と人工動力学を使い、グラフを共有して個体ごとの状態を持ちます。生物学的な全脳の再現を意味しません。
- 市場14周期の神経処理は **304.1–349.5 ms（中央値324.0 ms）**、ローカル取引等を含む周期は **7.679–9.354秒（中央値8.642秒）**。Python peak RSS **443.1 MiB**。全システムRAM・電力・公開チェーン確定時間ではありません。
- GUIで保有目標を85%／15%へ変更し、人工的な需要を作りました。終了後に市場を停止し、元の70%／30%へ戻しています。残高・学習状態は保持しています。

The foraging comparison replays identical confirmed input TXs for both policies. MOMO keeps its previous policy (5.20 → −1.54 candidate); SORA adopts (4.08 → 8.64). The separate new-condition test returns −6.29 / −12.79. This is not proof of improved generalization or a biological advantage. The market segment adds 27 successful local settlements over 14 cycles; all four agents receive outcome updates and 3 change saved weights. Different takes preserve learning and balances. Independent seven-neuron research is a separate result.

## 公開デモとの違い / Public demo boundary

[Sepolia公開ページ](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en)は **7神経・19接続・3個体**。Anvilと共通のFly Lab UI・Q学習を使い、初期環境・危険エリア・刺激・餌の外部入力をTXから読みます。観察と学習はウォレット不要。Aqua／Uniswapへの注文は送りません。

動画は **Anvil＋全神経**。前半はPythonの採餌readout選択、後半は共有市場のオンライン更新です。公開版のQ学習、独立JSフレームワーク、全神経版の学習は別実装です。アプリ間の学習済み能力の移転は実証していません。

The video includes current environment TXs. The public page remains a lightweight reviewer entry point, not a hosted full-neuron trading runtime. Local Anvil receipts have no public Etherscan URL. The market uses Ethereum block **26,058,941** as its fork origin and executes on chain **31337**. Official Aqua: `0x1111113ccf1426a8e30e2bff5e005d929bf6a90a`. Tokens and transactions are local tests.

## 質疑応答の根拠 / Evidence

| 参照 | 根拠 / Source |
| --- | --- |
| R1 | [収録・全神経採餌比較](capture-evidence.json) · [全決済と周期](settlement-evidence.json) · [資源集計](resource-evidence.json) |
| R2 | [共有市場の実装と制約](../../apps/shared-market/README.md) |
| R3 | [独立した採餌実験と対照比較](../../research/bioagent-adaptation/README.md) |
| R4 | [JSフレームワーク](../../../packages/bioagent-framework/README.md) |
| R5 | [Sepoliaの配置・操作](../../deployment/sepolia.md) · [公開ページの実演確認](public-walkthrough.json) |
| R6 | [現行の環境TXと定期送信の検証](../judge-demo-review.md) |
| R7 | [AI Agent比較：期待・実測・未実施の計画](ai-agent-comparison.md) |
| 検証 | [全編デコード・Chrome再生・SHA-256](verification.json) · [目視確認](artifact-review.json) · [PDF/PPTX監査](document-audit.json) |
| 編集 | [元映像と編集後の時刻](render-metadata.json) · [収録方針](production-plan.md) |

Q&Aには消費電力・メモリー・反応速度・適応の期待効果と限界を記載しています。RAMから電力削減率を計算せず、「LLMは一律256 GB必要」とも説明しません。PDFは全ページを確認し、PPTXは構造・テキスト・ノートを検証します。PowerPoint本体での描画は未確認です。

## 再収録と再生成 / Reproduction

Use the repository's Node/Chrome/ffmpeg dependencies and prepared full connectome data. The recorder defaults to dedicated paused servers: full foraging at `127.0.0.1:8856`, market at `127.0.0.1:8857`, market Anvil fork at `127.0.0.1:18577`. Market state defaults to `.local/presenter-current-market`, foraging artifacts to `artifacts/submission-presenter-rerecord/foraging`. Match the servers' state and artifact settings; set `PRESENTER_FORAGING_URL`, `PRESENTER_DEMO_URL`, `PRESENTER_MARKET_RPC`, `PRESENTER_MARKET_STATE` and `PRESENTER_FORAGING_ARTIFACTS` when using other paths. Do not start against an active run or reset someone else's chain.

```sh
# Running prepared local servers: record, then verify receipts/resources.
node scripts/submission/record-presenter-demo.mjs
PRESENTER_DELIVERY=artifacts/submission-presenter-rerecord/delivery node scripts/submission/collect-presenter-settlements.mjs
PRESENTER_DELIVERY=artifacts/submission-presenter-rerecord/delivery node scripts/submission/summarize-presenter-resources.mjs
# Re-render the existing raw recording without new transactions.
node scripts/submission/render-presenter-demo.mjs
```

New takes are staged under `artifacts/submission-presenter-rerecord/delivery/`. Review the staged MP4s and evidence, preserve the previous delivery, then copy the two MP4s, two SRTs and capture/settlement/resource/render JSONs here. Rebuild and verify:

```sh
node scripts/submission/build-presenter-walkthrough.mjs
node scripts/submission/build-presenter-cheatsheet.mjs
node scripts/submission/verify-presenter-kit.mjs
```

The builders read the delivered capture/resource evidence. Perform a fresh visual review after a new take; automated checks alone cannot validate the narrative. Raw WebM, scene screenshots and cut files remain local, Git-ignored artifacts. Viewing delivered files requires no chain or server. External submission forms have not been submitted in this work.
