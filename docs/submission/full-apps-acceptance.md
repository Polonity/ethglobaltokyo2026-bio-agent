# 全3アプリの全神経・経験学習（検証中）

対象は採餌、市場ペーパートレード、Aqua。166,700分類付き神経と25,582,938内部接続を各個体の判断に使う。2個体でCSR行列を共有し、状態は用途・セッション・個体ごとに分離する。全セグメントを神経と呼ぶものではなく、未分類の44,877 annotation行とグラフ境界の接続は対象外。入力符号化、興奮性rate dynamics、身体、行動readoutは人工モデルであり、生理的な全脳再現ではない。

## 再実行

既存のブラウザー版は8800、全神経単体実験は8810、新しい3アプリは8812。公開Workerはこのローカル全神経処理を実行しない。Sepoliaへのデプロイは行わない。

```bash
npm ci
# 既存の全神経準備手順で .local/connectome-tools と .local/malecns-full を用意
npm run full:prepare
forge build --root contracts
# 別ターミナル。元のAnvilとは別ポートを使い、過去ブロック状態を保持する
anvil --host 127.0.0.1 --port 18550 --chain-id 31337 \
  --max-persisted-states 100000 --cache-path .local/full-apps/anvil-history --silent
npm run full:apps:collect
npm run full:apps:dev
```

`http://127.0.0.1:8812/` を開く。採餌の刺激スライダーは「現在の方策で実行」でStatus TXに反映される。「収集→学習→評価」は比較条件を固定して200動作を収集、別条件で旧方策と候補を80動作ずつ評価、改善した個体のみ採用し、さらに別の80動作を実行する。2個体それぞれの学習結果がその後の判断に使われる。モードは全神経／7神経encoderから明示的に選ぶ。

```bash
npm run test:full:apps
npm run test:full:apps:browser
# GUIジョブ完了後に実行。同じチェーンの実験を同時実行しない
npm run full:apps:compare
npm run full:apps:ablation
```

ブラウザー検証には `/usr/bin/google-chrome` が必要。`FULL_RPC_URL`、`FULL_APPS_PORT` でローカル接続先を変更できる。新しいAnvilを起動したら、以前の市場テープを流用せず再収集する。最初・最後のSwapのblockHashと過去quoteを検証し、不一致なら起動を止める。モデルや入力アダプターが変わった場合は、新しいbrain hashのデータ・方策として扱い、再収集する。古いSQLite履歴は削除しない。

## 証拠と解釈

- `.local/full-apps/experience.sqlite3`: 観測、神経特徴、行動、方策、実結果、出自、候補、採用記録。
- `artifacts/full-apps/*-latest.json`: 学習・評価・採用後の実行とdecision ID。
- `artifacts/full-apps/browser-verification.json`: GUI実行、神経数、採用結果、再起動後の方策使用。
- `artifacts/full-apps/comparison.json`: 共通環境でのfull/legacy比較と、未変更の旧ブラウザー方策の補助比較。
- `artifacts/full-apps/readout-ablation.json`: 同じ入力・方策で実接続をゼロにした対照。
- `artifacts/full-apps/*-gui.png`: 実画面。

学習中は保存済みの神経特徴を使い、全グラフ計算を繰り返さない。変更するのは行動readoutで、25,582,938接続そのものではない。市場は線形回帰と小さな決定木を収集データの予約区間で比較する。採用にはそれとは別の実行結果が必要で、方策ハッシュ、同じ評価ケース列、実結果の平均値を照合する。

市場の売買はペーパーのみ。実V3 Swapログを観測し、次の記録ブロックでquote、さらに次のブロックで値洗いする。手数料・価格影響込み、ガスは1回0.001 token1というゲーム上の仮定。実トークンを売買するものではない。

Aquaのship/dock/fillとテストトークン残高変化は実TX。価格は別ペアのUniswap記録を正規化した評価用代理値で、本番価格oracleではない。800bpsの提示は観測変動200bps以上でのみ約定する人工takerルール。結果はこの明示した実験条件の報酬であり、現実のLP収益性を証明しない。

共通学習器のfull/legacy比較は環境と評価列を揃えるが、入力mapping、神経状態の継続、4対32の神経step数も異なる。神経数だけの因果比較ではない。元のブラウザー版は学習則、先験的行動、タイミングが異なるため、別の参考欄として扱う。旧Aquaの教材誤差を新方式の実動作報酬と比較しない。

全神経の4stepは2個体で約150ms程度の実測がある。これは約6–7判断/秒、約26神経step/秒であり、GUI描画の30fpsと同じ指標ではない。最終値は比較成果物を参照する。
