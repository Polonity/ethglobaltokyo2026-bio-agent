# MaleCNS必須の判断・学習・即時反映

> ローカル向けに[全166,700神経・25,582,938接続の実行基盤](malecns-full-local.md)を追加しました。以下の3アプリの学習は軽量モデルです。全規模ランタイムへの用途別学習統合や生物学的検証が完了したという意味ではありません。

2026-09-26。現在の採餌・市場・Aquaの実装を説明する。以前の「2ゲームはsynthetic」「Aquaは学習なし」という実装記録は、この更新で置き換わる。生物学的な妥当性や取引の利益を示すものではない。

## 省略できない条件

**3アプリともMaleCNS v1.0由来の実測接続を判断に使う。モデルや出典が欠けた場合にsyntheticモデルへフォールバックしない。**

利用するのは、すでに出典を記録した実測7神経・19接続の部分グラフ。元の神経ID・接続数を保持する。全脳、キノコ体・側角・CXの再現ではない。実測部分構造に人工rate dynamicsと用途別感覚変換を適用する。

- dataset: `male-cns:v1.0`
- graph SHA-256: `0xfa923a4bdf0c41af7d0fc9197507f0935adcee957a6417c765db9700d46df987`
- source: [MaleCNS](https://male-cns.janelia.org/) / CC-BY-4.0。抽出・元ファイルのハッシュ・帰属は[既存の回路証拠](circuit-evidence.md)とgraph JSONに保持。
- encoder: `packages/bio_agent/connectome/male-cns.js`
- shared training: `packages/training/browser/`

## 3用途の判断経路

| 用途 | MaleCNSへの人工的な入力 | 学習するもの | 評価・採用 | 実行への反映 |
| --- | --- | --- | --- | --- |
| 採餌 | 各方向の食物方向一致度・危険・満腹度・エネルギー・刺激・活動モードを9候補のdriveへ変換 | 回路応答を含む観測キーに対する9行動のQ値 | fittingに使わない固定3コースの報酬が改善した候補を採用。独立した最終評価ではない | 次の0.2秒tickで使用 |
| 市場 | 上昇・下降の大きさ、保有、満腹度を4driveへ変換 | 回路応答から作る観測キーに対するhold/buy/sellの報酬予測 | 時系列の先頭70%でfit、末尾30%のMSEが改善した候補を採用。利益の評価ではない | 次の確認済みSwap観測で使用 |
| Aqua | 個体別感度を掛けた人工危険刺激 | MaleCNS応答に掛けるgain（0.5〜2） | 人工risk-target curriculumの192点で最小二乗、別の64点のMSEで選択 | 新Status revision→保存→旧戦略dock→新戦略ship |

採餌・市場の初期方策、探索乱数、資金制限、低エネルギー時の休息は人工的な制御である。MaleCNSだけで完結する生物的行動モデルとは主張しない。回路応答は観測キーと初期行動価値に入るため、単なる装飾ではない。接続除去による特徴の消失をテストする。

Aquaの人工教材は `target = 0.24 × risk`。市場から学習したリスクやDANの再現ではない。学習後も未校正の回路応答が0.1以上なら撤回する固定gateを維持し、学習gainだけでこの条件を緩和できない。

## 効率化

固定した回路を毎回学習し直す必要はない。採餌・市場・Aquaの校正教材は、driveを1/256刻みに量子化し、ゼロ状態から32tickを計算した応答を再利用する。計算を初めて要求した入力だけ評価し、通常は最大257件を保持する。接続除去対照を含めても514件で上限がある。これは宣言した量子化モデルでの再利用であり、連続入力に対する近似誤差がゼロという主張ではない。

採餌は1回960更新を96更新ずつ10tickに分割する。1倍速で約2秒の学習状態となり、完了・評価の次のtickで採用結果を使う。従来の8秒待機はなく、待機時間で進捗を水増ししない。96環境更新に加え、経験があれば同数の記憶再生を行うため、`updates`は環境更新回数を示す。

市場は12epochのfitを256更新ずつ処理する。少数サンプルなら次の0.2秒学習tickで完了し、大きい履歴も有限の複数tickへ分割する。学習中の保有は値洗いを続ける。Aquaは1係数の最小二乗なので、勾配学習を長時間回さず、少量の十分統計で解く。

## 学習結果の識別と保存

共通レポート `bioagent.learning-result.v1` はuseCase、MaleCNS graph digest、baseVersion/version、before/after、samples/updates、adopted、評価指標、`applies: next-decision`、変更対象を記録する。接続は固定し、学習で変わるのは行動選択・行動変換部分である。

採餌・市場は `bioagent.readout.v1` をlocalStorageへ保存する。保存キーは配置Registry・登録モデルhash・個体IDで分離し、用途やMaleCNS digestが異なる成果物は拒否する。再読込時には行動モデルを復元するが、競技位置・市場ポジション・台帳は新しく始まる。ブラウザー保存が無効・容量不足ならタブ内では動くが、永続化は保証できない。採餌の全状態checkpointは学習途中も正確に復元する別の仕組み。

AquaはローカルWrangler KVの `AQUA_LEARNING` を使用。Registry・base model・agent・input revisionごとに保存する。strategy bytesには `policyHash` を追加して学習結果へリンクする。AquaAppが検査するのは登録owner、base model、現在のinput revisionであり、policyHashは参照であって実行証明ではない。

採用時は新revisionのTXを先に確認して旧戦略の約定を止め、そのrevisionに新policyを保存する。通常操作では学習ボタンがapplyまで続ける。送信・KV保存・dock・shipは非原子的。途中失敗時は状態を再取得し、学習/反映を再試行する。学習済みpolicyがまだ保存されていないrevisionでは初期readoutになるが、MaleCNS自体は必須のまま。多数利用者・複数拠点の整合性を保証する本番学習配信ではない。

## 出典と実行の照合

採餌・市場の登録manifestはgraph、dynamics、encoder、learner、readout、用途別RuntimeのSHA-256を持つ。GUIはそれらを確認してから判断・チェーン連携を開始する。Aqua descriptorもgraph・controller・encoder・learnerを参照する。ビルド時には固定graph hashの変更を拒否する。欠損・改変時は実行を止める。

モデルソースの変更は新しい登録hashを必要とする。古いポートの登録を新しいdistへ無理に合わせず、専用環境を使用する。

## 起動と検証

```bash
npm ci
# FoundryがPATHにない場合は FORGE=/path/to/forge ANVIL=/path/to/anvil を設定
ANVIL_PORT=18547 LOCAL_GUI_PORT=8800 LOCAL_INSPECTOR_PORT=19250 \
  LOCAL_STATE_DIR=.local/malecns npm run local:up
# 別ターミナル
LOCAL_STATE_DIR=.local/malecns npm run local:market
LOCAL_STATE_DIR=.local/malecns npm run local:aqua
LOCAL_STATE_DIR=.local/malecns npm run local:circuit
# モデル更新後に採餌だけ新Registryへ移行する場合
LOCAL_STATE_DIR=.local/malecns npm run local:foraging
npm run test:male-learning
npm run benchmark:male-learning
LOCAL_GUI_URL=http://127.0.0.1:8800 npm run test:male-learning:browser
```

現行GUI: http://127.0.0.1:8800/ 、 `/market` 、 `/aqua` 。新しいモデルは公開Workersへまだデプロイしていない。旧デモ動画もこの変更を含まない。

## 測定と証拠

`artifacts/male-learning/benchmark.json` はローカルNode v22.14.0の測定。4,096入力の32tick直接計算146.08ms、初回キャッシュ込み9.15ms、warm cache 0.38ms。採餌960更新の10batchで最大5.53ms、評価開始5.13ms、Aqua校正0.32msだった。ハードウェア依存であり、別端末やブラウザーでの保証ではない。

`browser-evidence.json` とPNGに、3用途の実画面・学習レポート・Aquaの新旧strategyを保存する。採餌v1→v2採用と再読込後の復元、Aqua gainの変更と203→270 bpsへの即時反映、改変MaleCNS artifactでの実行停止を確認した。市場の学習ループは動作するが、実行例では選択MSEが改善しない候補を棄却した。採用・次判断への適用は独立の制御された単体試験でも確認する。

Python Backendのstepも同じ固定MaleCNSグラフを計算する。`python -m packages.training` は人工ラベルによる閾値校正の参照ジョブとして残すが、アプリへの自動反映を担当するのは上記のbrowser/Worker学習経路である。

最終確認: Node 39テスト、Foundry 29テスト、Python 2テスト成功。3アプリの学習・保存・改変拒否、英日/システム言語、モバイル、実Aqua交換、実Uniswap Swap、Circuit Labの独立Python照合をローカルで確認。市場の候補棄却を含め、評価結果を正しく反映することを確認した。
