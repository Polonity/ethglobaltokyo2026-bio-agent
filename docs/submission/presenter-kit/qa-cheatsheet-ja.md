# BioAgent｜目的からデモまで

## 何を実現したいか

生物由来の小さな判断モデルを、オンチェーン入力で動かし、経験から適応させる。その効果と計算資源を比較できるフレームワークをつくります。

使う人はAgentの開発者・研究者。入力の検証、モデルの出典、学習結果の追跡を再利用し、生物回路が役立つ条件を調べられることが価値です。

## 公開デモは、この順に説明する

- **1｜開く** — Sepoliaページをウォレットなしで開き、3個体を選んで観察。「判断する部分は実測7神経・19接続を使います。」
- **2｜環境の出典を見る** — 「環境と餌の入力TX」を開き、初期環境TXを示す。「幅・高さ・危険エリアも、最初のTXに記録しました。」
- **3｜刺激から行動へ** — 餌の元TXと行動を示す。「正の刺激TXが確定すると餌が1個増え、感覚入力へ変換して移動・休息を選びます。」
- **4｜学習を確かめる** — 個体を選び「学習室へ」。「確認済み環境のコピーと経験からQ値を更新し、比較スコアが改善した候補だけ採用します。」
- **5｜結果を読む** — 学習前／候補・採用／維持を確認。「同じ環境の再生での比較です。未知環境への効果は、別の比較実験で調べます。」

定期送信は毎時確認・最低1時間間隔。1分の説明では記録済みTXを使います。手動送信は所有者のみ。餌を食べ切ると休息し、自動補充しません。学習で改善しない結果も有効です。

## 3つの証拠を使い分ける

- **現在の公開ページ** — Sepolia・7神経・3個体。TX入力と採餌・Q学習を体験。
- **提出動画** — Anvil・全166,700神経。前半は2個体の環境TXと学習比較、後半は4個体のAqua／V3決済。
- **独立した研究** — 合成採餌環境の対照比較。報酬は改善したが、生物回路の優位は未確認。

## 約1分の説明原稿

私たちが作りたいのは、生物由来の判断モデルをアプリで使い、学習の効果まで確かめられるフレームワークです。まず、危険エリアを含む初期環境をTXに記録します。次に、確定した刺激TXで餌を追加し、ハエが移動や休息を選びます。学習では、その環境と経験を再生し、改善した候補を採用します。ここで示すのは、入力から判断・学習までを追える仕組みです。別の対照実験では報酬は改善しましたが、生物回路の優位は確認できませんでした。次は、同じ仕事で小型AIと比べ、適応の速さと計算資源に利点があるかを測ります。

---

# BioAgent｜発表・質疑応答

現行の共通Fly Labに対応。市場動画・独立研究の結果は明示して区別。

## 全神経動画を補足するとき（約30秒）

BioAgentは、生物由来の神経回路で行動を決め、入力・学習・取引結果を追える実験基盤です。動画の前半で全神経の環境TXと学習比較、後半で4個体のAqua提示とUniswap売買を示します。実取引と学習更新を確認しました。別の採餌実験では行動が改善しましたが、通常モデルへの優位は未確認です。そこまで比較できる基盤を作ったことが成果です。

- **166,700** — 神経／個体 × 4個体
- **27** — 新規決済：Aqua 2・V3 25
- **14回 × 4** — 学習更新。重み変化は3個体

## 1. 普通のAI Agentと何が違う？

**生物の実測接続を、行動判断の特徴計算に使います。** 外から見れば同じ取引botです。差はモデルの由来と内部構造です。動力学・入力変換・行動変換は人工設計で、ハエの感情や意識を読み取ったものではありません。

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 2. BioAgentならではの利点は実証できた？

**この課題で、生物由来であることの性能優位は未確認です。** 仮説は、固定された疎な回路と小さい学習部分で環境変化に対応できること。通常モデルでも学習・省メモリー化は可能です。同条件の対照と比較できることが現時点の成果です。

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 3. Uniswap／1inchチームにどんな価値がある？

**判断モデルを実際の決済まで接続して検証できる、参照実装です。** Uniswapには、見積もり→実行／見送りを比較する実験の入口。Aquaには、同じ保有資金からの提示・撤回を学習モデルへ接続する例を提供します。利用者数、取引量、資本効率の増加は未測定です。

[R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md) / [R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 4. 動画の市場場面では何を学習している？

**確定した行動結果から、行動を選ぶreadoutの重みを更新します。** 実測の神経接続は固定です。今回14周期で全4個体の更新数が増え、3個体の重みが変化しました。報酬は提示の約定結果や目標保有比率への接近です。市場版はオンライン更新で、未使用データによる採用ゲートはありません。

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 5. 動いただけでなく、改善効果はある？

**修正後の全神経版は未使用12配置で餌24/24を回収し、移動の91.9%が餌へ近づきました。** 同じ経験の直接入力ridgeは23/24、ランダムは4/24。危険域滞在は全神経7ステップで事前安全基準は未達。1回の学習・12配置の比較です。生物固有の優位や市場成績を示す結果ではありません。

[R9: Full foraging validation](foraging-validation.md)

## 6. LLMより低コスト・低消費電力？

**定型判断の計算・更新を小さくし、電力・設備費・待ち時間を減らす可能性を調べています。** 収録時のPythonプロセス全体のpeak RSSは443.1 MiB、最後の4個体分の神経計算は317.4 ms。電力は未測定で、比較優位の証拠ではありません。比較条件と想定反論は4ページ目にまとめています。

[R1: Capture: receipts, model and learning deltas](capture-evidence.json)

## 7. ハエが取引先まで決めている？

**神経モデルが行動を選び、通常コードが実行可能な見積もりを比較します。** 提示側はtight／wide／withdraw、売買側はhold／buy／sell。学習値に人工設計の基準値と探索を加えます。AquaかV3かはガス控除前の受取量で選択。独自FlyV3RouterとV3 coreを使用し、Trading API・Universal Router・v4 hooksは未使用です。

[R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 8. IBioAgentを共通化するうまみは？

**入力とモデルの意味を共通化し、検証・学習の処理を再利用することを目指します。** Solidityは入力・権限、公開JavaScriptは判断・Q学習、Workersは取得検証。全神経版はNode.jsの制御とPythonの神経計算をJSON Linesで接続します。独立JSフレームワークとTypeScriptの共有型仕様は別です。構成はスライド付録へ。

[R4: Framework: API, validation and restore](../../../packages/bioagent-framework/README.md) / [R8: Architecture, languages and trust boundaries](../../architecture.md)

## 9. 何がオンチェーン？ 判断も検証できる？

**箱庭の外部入力はすべてオンチェーンデータです。** 初期環境TXに危険エリアも記録。正の刺激TX確定ごとに餌が1個増え、食べると消えます。位置・身体・消費・学習はオフチェーンで、ブラウザー間では入力を共有します。receipt確認は最終確定や神経計算の正しさの証明ではありません。

[R5: Public Sepolia demo and transaction evidence](../../deployment/sepolia.md) / [R6: Current environment-TX and scheduled sender evidence](../judge-demo-review.md)

## 10. PnLは利益？ 安全に自動売買できる？

**テスト通貨の評価損益で、利益・運用安全性を実証したものではありません。** 需要は目標比率85%／15%の人工設定。PnLに交換費用は反映され、ガス代はETHで別表示です。提示側2個体は1つのEOAを共有します。数量・期限などの実行条件はありますが、監査済み製品ではありません。

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R2: Shared market: actions, execution and limits](../../apps/shared-market/README.md)

## 11. 審査員が公開URLで試すものも全神経？

**公開ページはSepolia＋7神経、提出動画はAnvil＋全166,700神経です。** 公開版は3個体で、確認済み環境を再生するQ学習です。新旧方策の比較スコアが改善した時だけ採用します。新動画の前半は全神経2個体の採餌readout比較、後半は市場4個体のオンライン更新です。全神経も環境TXに対応しています。

[R5: Public Sepolia demo and transaction evidence](../../deployment/sepolia.md)

## 12. 失敗から何を学んだ？ 次に何を測る？

**報酬を上げるだけでは不十分で、副作用も採用条件に含める必要があります。** 採餌では休息を減らして報酬を上げ、体力が悪化しました。次はUniswapの固定ペア・同額見積もりで実行／見送りを比較し、未使用相場で手数料控除後の結果・失敗率・見送り率と計算資源を測ります。

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md)

## 13. 誰がTXを送る？ 審査員も送れる？

**所有者EOAが署名し、Workersも同じ所有者鍵で定期送信します。** 鍵はCloudflare Secretに保管。毎時確認・最低1時間間隔でAgent #1に送信し、ガス・残高を制限します。観察と学習はウォレット不要。手動送信は所有者のみで、スマートウォレットではありません。餌はTX以外で自動補充しません。

[R6: Current environment-TX and scheduled sender evidence](../judge-demo-review.md)

言い切る：実接続を使う・取引が成立・学習更新を確認。言い切らない：ハエの思考・生物優位・利益・LLMより安い・フル版と縮小版の同等性。

## AI Agent比較：期待する効果

対象は、数値入力から少数の行動を繰り返し選ぶ処理。汎用的な言語能力との比較ではありません。

狙いは、定型的な判断を小さい計算予算で継続することです。固定回路と小さなreadoutで、メモリー・計算時間・更新負荷を抑える可能性を調べています。低電力・低コスト・低遅延は期待する効果で、比較優位の実証はこれからです。

| 比較軸 | 期待する効果と理由（仮説） | 実測・制約 |
| --- | --- | --- |
| 電力・費用 | CPU上の限られた計算で済めば、常時動作の電力や推論API費用を減らせる可能性。 | 節約先はAgent実行側。電力・費用は未測定で、ガス代・RPC等は別。 |
| メモリー | 固定の疎なグラフを個体間で共有し、個別状態と行動readoutを保持。 | 443.1 MiBは4個体を動かすPythonプロセスのpeak RSS。PC全体のRAMや組込機器での実績ではない。 |
| 反応速度 | 4stepの回路処理から行動へ進むため、毎回の文章生成や外部推論APIの往復を省ける。 | 収録14周期で神経処理は4個体合計304–349 ms。実行期限の保証ではない。 |
| 適応・更新 | 固定回路は維持し、readoutの180係数／個体だけを再適合できる。 | 柔軟性は対象課題の範囲内。小型AIも可能。LLMも文脈・指示から適応でき、重み更新が必須ではない。 |

### 14. LLMは256 GB必要だから、圧倒的に小さい？

**必要量はモデル・精度・文脈で変わります。** 8Bモデルの重みだけならFP16で約16 GB、4bitで理論上約4 GB（十進）。KV cache等は別です。API利用側はモデルを載せません。同等の能力・仕事を揃えて比較します。

[S1: HF: weight quantization](https://huggingface.co/docs/transformers/main/en/quantization/overview) / [S2: HF: KV cache and generation](https://huggingface.co/docs/transformers/main/en/kv_cache) / [S5: HF: hosted inference](https://huggingface.co/docs/inference-providers/index)

### 15. 電気代は何分の一になる？

**倍率は未測定です。RAMから消費電力は換算できません。** 同じ品質・判断数で機器全体のWとJ/判断を測ります。料金試算は平均W×稼働時間÷1,000×単価。API費・設備費・学習費も別に合算します。

[S3: MLCommons: whole-system power](https://mlcommons.org/benchmarks/inference-edge/) / [R7: Comparison rationale, measurements and protocol](ai-agent-comparison.md)

### 16. 神経計算の時間で取引も終わる？

**神経処理の時間と、取引成立までの時間は別です。** 4個体の神経計算＋特徴抽出は304–349 ms。RPC・ローカル取引等を含む周期は7.68–9.35秒、目標4秒を超える周期は延長。1個体の応答時間や公開チェーンの確定時間ではありません。

[R1: Capture: receipts, model and learning deltas](capture-evidence.json) / [R7: Comparison rationale, measurements and protocol](ai-agent-comparison.md)

### 17. 普通の小型AIやreservoirでよいのでは？

**有力な対照です。軽量化だけでは生物固有の価値になりません。** 固定回路＋学習readoutは既存研究にもあります。生物接続が時間的な判断へ役立つかを、ランダム回路・小型モデルと比較します。7神経の採餌実験では直接入力対照への優位は未確認です。

[R3: Held-out experiment and negative results](../../research/bioagent-adaptation/README.md) / [S4: ESN primary paper, §2.1](https://www.ai.rug.nl/minds/uploads/techreport2.pdf)

### 18. 何を揃えれば、公平な比較になる？

**入力・行動・品質・頻度・測定範囲を揃えます。** 固定ルール、小型MLP/RNN、LLM、BioAgentを未使用データで比較。行動が使えるまでのp50/p95、失敗率、RAM、J/判断を測ります。LLMで計画し小型モデルで実行する分業も今後の候補です。

[R7: Comparison rationale, measurements and protocol](ai-agent-comparison.md)

期待効果と実測を分ける。AI AgentはLLMに限らない。出典・比較条件はR7。
