# 刺激から行動へ — アニメーションと読み上げ

本番は英語の本人音声。日本語は理解用。台本の0:50から36秒の説明アニメーションを挿入し、その後GUIに戻す。各段階のセリフは [英語台本](documentary-script-en.md) と [日本語対訳](documentary-script-ja.md) に記載。収録音声に合わせて各段階の尺を調整する。現時点の6秒ずつはリハーサル用。

[ブラウザで再生・日本語切り替え](visuals/stimulus-to-action.html)。シークで各場面を確認可能。

| 図の時刻 | 見せる変化 | 説明する実装 |
|---|---|---|
| 0–6秒 | 確定receiptから環境データへ | TX由来の餌・危険エリアの座標を取得 |
| 6–12秒 | 16本の入力バーが立ち上がる | 環境と身体状態から16次元のdrivesを構成 |
| 12–18秒 | 接続図の活動が広がる | MaleCNSの接続で4ステップ更新し、神経群ごとの平均活動を抽出 |
| 18–24秒 | 9本の予測スコア、最大値を強調 | Ridge Regressionで行動ごとの即時報酬を予測。実行可能な行動から選択 |
| 24–30秒 | 左方向の行動でハエのx座標が変化 | JavaScriptが座標を更新し、GUIが描画 |
| 30–36秒 | 経験を保存して学習へ戻す | 特徴量・行動・報酬をSQLiteに保存し、別の学習フェーズでreadoutを更新 |

図は説明用。入力値・スコア・移動は模式例であり、実測の神経活動や記録済みMOMOの再生ではない。冒頭から画面に明記する。環境入力はTX由来だが、身体状態・座標更新・神経計算はオフチェーン。最後の学習矢印は毎フレーム学習する意味ではない。

## 実装との照合

- `services/full-apps/foraging.mjs` の `observe()`：9行動の方向入力＋energy、satiety、reserves、stimulus、world energy、distance、定数の計16入力。`apply()`：8方向＋休息の行動を座標へ変換。
- `packages/bio_agent/full_apps/brain.py` の `infer()`：16感覚群へ入力、固定接続で4ステップ、感覚群・運動群・superclassの平均活動を特徴量化。
- `packages/bio_agent/full_apps/learning.py`：標準化した特徴量で行動別リッジ回帰。L2係数0.1、切片0.001。収集経験の先頭70%で学習、残り30%で報酬予測を確認。
- `.local/presenter-long/experience.sqlite3` の採用済みforaging policy：MOMO・SORAとも `full`, version 2, `algorithm: ridge-linear` を確認。コードには回帰木候補もあるが、今回採用された手法ではない。
- `packages/bio_agent/full_apps/action_selection.py`：許可された行動から最大スコアを選択。同点はseed付き乱択。経験収集時は探索あり。
- 内部モデルIDは `malecns-full-positive-rate-v1`、元データは `male-cns:v1.0`。データセットと今回の実行モデルを区別する。

## ハードウェアと表記

2026-09-26に現在の実行ホストで確認：`lscpu` は **AMD Ryzen 9 9950X 16-Core Processor**。`nvidia-smi` は **NVIDIA RTX PRO 6000 Blackwell Workstation Edition**。コードの計算経路はNumPy／SciPyのCPU処理で、CUDAを使っていない。GPUの製品名を学習環境の主役として出さない。過去の各試行でハードウェア構成を保存した証拠とは区別する。

画面表記：`AMD Ryzen 9 9950X · CPU execution · NumPy / SciPy`。

パートナー表記は公式の **[1inch Aqua Protocol](https://1inch.com/aqua)** と **[Uniswap v3](https://developers.uniswap.org/docs/protocols/v3/overview)** に統一。ERC-20トークンの移動はreceiptで見せる。

## 再生成

`node scripts/submission/render-protocol-animation.mjs`

出力：`artifacts/protocol-animation/stimulus-to-action-en.mp4` と `stimulus-to-action-ja.mp4`。1280×720、36秒、無音。人の英語ナレーションを収録するための説明映像素材であり、完成版サブミッション動画ではない。出典全体は最終動画の [クレジット](video-credits.md) に表示する。

## 最後の24秒：今回の設計

[設計アニメーション](visuals/protocol-design.html)を3:15から表示。IBioAgent → IBioAgentStimulus → フレームワーク → アプリの順に6秒ずつ強調する。出典は24秒間フッターに常時表示。本人音声の字幕はフッターや各箱に重ねず、最終編集で別の余白を確保する。

- `IBioAgent`：`getStatus()` / `updateStatus()`。入力条件の共通化であり、計算済みの神経状態を書き戻すAPIではない。
- `IBioAgentRegistry extends IBioAgent`：個体・モデルの登録。`BioAgentRegistry`はこのinterfaceと`IBioAgentWallet`を実装。
- `IBioAgentStimulus`：`submitStimulus(agentId, expectedNonce, schema, payload)`。`BioAgentStimulusRegistry`が既存Registryを拡張して実装する。図はデータフローであり、すべてのinterfaceがIBioAgentを継承するという図ではない。
- `IBioAgentWallet`：所有者が宣言するウォレットの関連付け。実行権限を委譲するものではないため、アプリ実行への矢印は付けない。
- off-chainの共有処理とアプリの接続を示す。全神経版のPython/Node.js経路を示しており、別のJavaScriptクラス`IBioAgentRuntime`を全神経版が継承するとは表現しない。

再生成：`node scripts/submission/render-protocol-animation.mjs protocol-design`。
出力：`artifacts/protocol-animation/protocol-design-en.mp4` と `protocol-design-ja.mp4`。
