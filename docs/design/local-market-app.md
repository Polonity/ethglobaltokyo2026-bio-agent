# Market Meadow — 実Uniswap入力とペーパートレード

2026-09-26。ローカルAnvil + Workersで実装・ブラウザー検証済み。`/market`から開く。

## 起動

```bash
npm ci
npm run local:up
# 別ターミナル、同じworkspaceで:
npm run local:market
# http://127.0.0.1:8798/market
```

forge/anvilがPATHにない場合、`FORGE`/`ANVIL`で絶対パスを指定。別ポートで起動した場合は両コマンドに同じ`LOCAL_STATE_DIR`を渡す。検証環境は`.local/embodied`、Anvil 18546、GUI 8799。`local:market`は**新しいテスト市場を作る**操作で、既存市場の継続ではない。実行中の市場画面は設定変更を検知して再読込を要求する。

## 実際にチェーン上で動くもの

- npmの固定版`@uniswap/v3-core@1.0.1`に含まれる公式Factory bytecodeをAnvilへデプロイ。
- ローカル専用テストtoken2種類、実V3 Pool（fee 3000）、全範囲に近い流動性を用意。
- `LocalMarket`はMint/Swap callbackを処理する**テスト専用harness**。chainId 31337に限定。一般向けERC20や本番routerではない。
- `BioAgentStimulusRegistry`に市場用manifest hashと3個体を登録。Workerが登録owner/modelHashを確認し、GUIがmanifest hashを照合する。
- 価格ボタンはowner限定harnessで実際の50 tokenスワップを実行。GUIがPoolのSwapログを読み、全3匹へ同じ入力を渡す。
- GUIのソースTXリンクは実際のAnvil receipt。紙約定用の架空TXは作らない。

これは合成SwapEventFixtureとは異なる**実Uniswapコアのローカルpool**。Mainnet/Sepoliaの市場や流行tokenではない。Factory検証はこのローカルに配置したFactoryとの一致であり、本番canonical deployment認証を意味しない。Uniswap Trading APIはこの経路では使用しない。

コアartifactのライセンスはインストールされた`@uniswap/v3-core/LICENSE`等の配布物に従う。本プロジェクトのMIT表記で依存コアのライセンスを置き換えない。

## Agentの判断

`PaperArena`はsynthetic reward-prediction model。市場変化の方向、保有の有無、満腹度のbinを実際の観測keyにする。MOMOは勢い、SORAは逆張り、KIKIは慎重という**工学的な初期prior**から始め、seed付き探索を行う。これらを学習済み知識や生物の本能とは呼ばない。

価格変化は注目度にも反映するが、注目度が高くてもhold/skipが可能。利益に相当する正の報酬で満腹度を増やすのはゲーム上の比喩。身体モデルは採餌と同じ関数で、市場では1観測につき0.2秒相当の身体更新を行う。学習表示の8秒は別の実行タイマーである。

## 約定とPnL

初期仮想資金100 token1。買い注文は10 token1、売りは保有token0全量。注文は判断したブロックより後のSwap観測まで待つ。quoteは指定blockHashを確認した上で、そのブロックに対する`eth_call`で実Pool.swapを実行し、callback revertから正確な入力数量の出力量を得る。チェーンに仮想注文を送信しない。

quoteにはpool feeとサイズによる価格影響が含まれる。追加費用は明示した仮定の0.001 token1/約定。保有の評価にも売却側quoteと想定清算費用を用いる。表示はcash + liquidation value - initial equityで、実現/未実現を共通MarketViewでも区別する。学習中も保有資産の時価評価は続く。

各ハエの仮想注文は互いにpoolの流動性を消費しない。現実の同時発注・MEV・約定保証・価格予測を再現するものではない。tokenは18 decimalsのローカルテストtokenに限定。金額計算はBigInt、共有型へ渡す値は十進文字列。画面表示だけ小数へ変換する。

quote失敗時はその観測の全個体更新を採用せず、未評価表示で停止する。残高や乱数を一部だけ進めない。通信復帰時に同じcursorから再試行する。Reorg時は競争を停止して新ラウンド開始を要求し、過去損失を消して継続したとは扱わない。

## 学習

6観測ごとに成績下位の対象が8秒間その場で考え直す。履歴を時系列70/30に分け、前半で行動別の即時報酬予測を更新、後半の予測MSEが下がる場合だけ候補を採用する。保有は継続し、未約定注文は取り消す。

後半は候補選択用であり、未使用のheld-out将来相場ではない。on-policyの将来PnL改善や収益性は主張しない。学習結果の採否・予測誤差・サンプル数を保存する。

## GUIと型

- 共通`MarketView`で身体・入力・PnLを表示。採餌は同じ基底の`ForagingView`を使用。
- 3匹の動き、保有tokenへの移動、学習中の停止と「？」、現金・保有・PnL・台帳を表示。
- 英語/日本語/システム言語、モバイル表示、receipt dialog、JSON実験記録export。
- 市場Agentには実際のregistry参照を付ける。脳・台帳・学習の実行場所はブラウザーで、再読込は新しい競争。

## 検証

`npm run test:paper`: 次ブロック約定、費用、重複排除、quote失敗時の原子性、学習中の保有評価、順序とquote不一致を検証。

`LOCAL_GUI_URL=http://127.0.0.1:8799 npm run test:market`: 実Swapを12回生成し、紙約定・PnL・学習結果・共有型・receipt・英日切替・mobileをブラウザーで検証。証跡は`artifacts/market-browser/`。

## 範囲外・次の拡張

本番のトレンドtoken取得、Sepolia配置、継続稼働する共有backend、完全なartifact import、cross-runtime checkpoint、独立held-out評価、MaleCNS実行は未実装。現在のlive readerはSwap主体で、任意のMint/Burn等まで含む一般市場oracleではない。既存`SwapEventFixture`のテストは小さな入力経路テストとして残す。
