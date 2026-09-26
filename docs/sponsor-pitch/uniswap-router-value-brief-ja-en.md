# BioAgent × Uniswap — 当事者の文脈 / Our context as Uniswap builders

2026-09-26 · 1分資料の質疑用補足 / Q&A companion to the one-minute pitch

## 日本語

**私たちはUniswap V3で2つのBioAgentを動かす試作を作った。次は、価格帯ごとの流動性変化に適応して注文を実行するAgentを研究し、その接続例と比較結果をUniswap開発者に返したい。**

### Uniswap側の文脈

Uniswap Labsは、Agent向けの開発支援とAPI統合を公式に展開している。また、Agent由来の利用を区別する任意の分析用ヘッダーも提供している。[Developer Platform](https://blog.uniswap.org/uniswap-developer-platform-is-live) / [Agent Attribution](https://developers.uniswap.org/docs/trading/swapping-api/start-building/agent-attribution)

この文脈から、我々は「低い運用負担で、Uniswapを継続利用する自律クライアントの実装例」に価値があると仮定する。これは我々の提案であり、Foundation担当者の優先順位や採用が確定したわけではない。

### こちらが実際に作ったもの

- 公式V3コントラクトを使うローカルpoolと、2個体の神経モデル・行動・結果の記録。
- 市場観測、判断、後のブロックでのペーパー約定、さらに後の評価を分ける仕組み。
- GPU・LLM呼び出しなしの神経計算。既存モデルの測定は約444 MiB、中央値163 ms／2個体。

**現在の限界も具体的に示す。** `LocalMarket.seed`は-887220〜887220の広い単一価格帯に流動性を置く。現行Agent入力は主に価格変化と個体状態で、有効流動性や近傍tickの分布をまだ判断に使っていない。Agent売買はペーパー処理。これを「集中流動性への適応やRouter実行が完成した」とは説明しない。

### 我々から選ぶ最初の用途

**自動リバランスAgentが、Uniswap V3の流動性と見積もりの変化を見て、注文を今実行するか短時間待つかを決める。**

V3では流動性が価格範囲に配置され、範囲に応じて利用できる量が変わる。[集中流動性の公式説明](https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity)

我々の実験では、流動性が厚い→薄い、薄い→厚い、変わらない場面を作る。tickの通過そのものを危険と決めつけない。追加する入力は、Swap履歴、tick、有効流動性、同じ注文に対する見積もりの履歴。経路選択はUniswapの機能を使い、BioAgentは時間をまたぐ実行・保留の学習を担当する。

| 立場 | 困りごと・狙う便益 | 比較で確かめること |
| --- | --- | --- |
| Bot運用者 | 決めた期限・価格条件内で注文を完了し、運用費と不利な実行を抑えたい | 全注文の完了率、待機損失を含む総コスト、実機の推論・更新費用 |
| Agent開発者 | V3の状態に応じるクライアントを再現・組み込みたい | 流動性シナリオと判断モジュール、API／Routerへの接続サンプル |
| Uniswapチーム | Agent統合の実装例・比較データ・開発者のフィードバックを得る | 実行までの接続、Agent由来の利用、導入アプリの継続利用 |

これらの課題や便益は提案仮説であり、利用者調査や本番損失の実績を装わない。他の集中流動性型DEXでは成立しないという主張でもない。Uniswap V3の仕組みを入力・判断・評価に具体的に使うことが、今回のUniswapとの接点になる。

### BioAgentならではの問い

同じ観測と同じ経験数で、生物由来の結合構造が、小型AIや固定ルールより少ない運用負担で変化に適応できるかを調べる。比較する固定ルールにも見積もりと流動性履歴を渡す。回路の大きさ、入力、動力学、読み出しを揃えた組み替え回路との比較で、構造そのものの寄与を調べる。

現在の価格を見積もるだけならUniswapが既に提供している機能である。単に安く動くことだけなら通常の小型AIでも可能。だから「時間とともに流動性が変わる中での学習効率・注文成績・運用費」の組合せで採否を判断する。[計算費用と適応力の根拠](cost-and-adaptation-ja-en.md)

### 次のデモの具体案

1. ローカルV3に複数の価格範囲を作り、厚い・薄い流動性への遷移を再現する。現在の広い単一範囲からの拡張。
2. 即時実行、見積もり・変動率の固定ルール、小型AI、BioAgentを、同じ注文・締切・価格許容範囲・経験数で比較する。
3. 未使用の期間で完了率と総コストを測る。全注文を対象に、手数料・ガス・待機損失・推論費を含める。見積もりの出力額に含まれる価格影響やpool手数料を二重計上しない。見送った注文も除外しない。
4. 有用なら、最新見積もり→判断→必要なら待機→再見積もり→Routerでテスト実行、のサンプルを作る。現行のローカルpoolの観測と、将来のAPI／Router接続は別の実装段階として示す。

任意の`X-Agent-Info`は利用分析用であり、決済成功の証拠にはならない。TXレシート・注文完了と併せて計測する。外部APIや本番での取引は、この資料作成では実施していない。

**チームへの依頼：このV3利用場面と評価基準が、Agent統合で優先したい課題に合うか、推奨する接続経路は何かを確認したい。** 用途をゼロから考えてもらう質問にしない。

## English

**We built two BioAgents on local Uniswap V3. Next, we want to study agents that adapt execution to liquidity changes across price ranges, and contribute an integration example and comparative evidence to Uniswap developers.**

### The Uniswap context

Uniswap Labs provides agent-oriented developer support and API integration tools, plus optional attribution of agent-driven traffic. [Developer Platform](https://blog.uniswap.org/uniswap-developer-platform-is-live) / [Agent Attribution](https://developers.uniswap.org/docs/trading/swapping-api/start-building/agent-attribution)

Our inference is that an autonomous client that is economical to operate could be a useful example for this ecosystem. This is a proposal, not an agreement on Foundation priorities or adoption.

### What we actually built

- A local pool using official V3 contracts, with two agents and recorded neural features, actions and outcomes.
- Separate observation, decision, later-block paper-fill and subsequent valuation stages.
- Neural computation without a GPU or LLM calls: about 444 MiB peak process memory and 163 ms median for two agents on the measured desktop.

Today, `LocalMarket.seed` supplies one wide range, -887220 to 887220. Agent inputs mostly encode price changes and internal state; active liquidity and nearby tick distribution are not yet learning inputs. Agent trades are paper trades. Concentrated-liquidity adaptation and Router execution are not finished features.

### Our chosen first use case

**A rebalancing agent uses Uniswap V3 liquidity and quote changes to decide whether to execute now or briefly wait.**

V3 allocates liquidity across price ranges. [Official liquidity explanation](https://developers.uniswap.org/docs/get-started/concepts/liquidity-providers/concentrated-liquidity)

Test thick-to-thin, thin-to-thick and unchanged liquidity, rather than treating all tick crossings as bad. Proposed inputs are swap history, ticks, active liquidity and quote history for the same order. Uniswap provides routes and quotes; BioAgent would learn execution/defer policies over time.

| Stakeholder | Proposed need or benefit | Evidence to provide |
| --- | --- | --- |
| Bot operator | Complete orders within deadlines and price limits, with lower operating and execution costs | Completion, costs including waiting losses, and device inference/update costs |
| Agent developer | Reproduce and integrate a client that responds to V3 conditions | Liquidity scenarios, decision module and API/Router example |
| Uniswap team | Reusable agent integration, comparison data and developer feedback | Verified execution, attributed activity and continued app usage |

These are proposed needs and benefits, not fabricated customer interviews or production-loss reports. We do not claim exclusivity to Uniswap. The connection is a concrete use of V3 mechanics in inputs, decisions and evaluation.

### The BioAgent-specific question

With the same information and experience budget, does biological wiring enable useful adaptation at lower total operating cost than simple rules or small AI? Give baselines liquidity and quote history too. Use rewired controls matching size, inputs, dynamics and readout to isolate topology.

Uniswap already quotes the current market. Small conventional AI can also be cheap. Evaluate the combination of learning efficiency, order outcomes and operating cost as liquidity changes. [Cost and adaptation evidence](cost-and-adaptation-ja-en.md)

### Proposed next demo

1. Extend the local V3 fixture from one wide range to multiple ranges, reproducing changes in available liquidity.
2. Compare immediate execution, quote/volatility rules, small AI and BioAgent on identical orders, deadlines, price limits and experience counts.
3. Evaluate completion and total cost on held-out periods. Include all orders, skips, fees, gas, waiting and inference costs. Do not count price impact or pool fees twice when already included in quoted output.
4. If useful, build a reproducible fresh-quote → decision → optional wait → fresh-quote → Router test-execution example. Distinguish current local-pool observation from future API/Router integration.

Optional `X-Agent-Info` supports analytics; it does not prove settlement. Combine attribution with receipts and order-completion evidence. No external API calls or production trades were made for this material.

**Our ask: does this V3 use case and evaluation match your agent-integration priorities, and which integration path would you recommend?** We bring the use case ourselves.

## Code and evidence / 実装と根拠

- `services/full-apps/chain.mjs`: official V3 deployment, Swap records and historical quotes.
- `contracts/test/fixtures/LocalMarket.sol`: current wide-range liquidity setup.
- `services/full-apps/market.mjs`: current inputs and paper decision/fill/valuation separation.
- `packages/bio_agent/full_apps/brain.py` / `learning.py`: neural features and action-readout learning.
- `cost-evidence.json`: existing isolated CPU measurement, not evidence of the proposed liquidity policy.
