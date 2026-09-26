# AI Agentとの比較：期待する効果と回答の根拠

[日英チートシート](qa-cheatsheet-ja-en.pdf)の3ページ目に対応する補足です。2026-09-26確認。以下の「期待」は設計からの仮説であり、比較実験の結果ではありません。

## まず言うこと

> 定型的な判断を頻繁に行う部分で、メモリー・待ち時間・更新負荷を小さくできる可能性を調べています。固定回路と小さい学習部分がその根拠です。CPU実行は確認できましたが、低消費電力や通常AIへの優位はこれから同条件で検証します。

AI Agent全体の代替を主張せず、**数値状態から少数の行動を選ぶ処理**を比較単位にします。自由な言語理解・計画・説明は、このBioAgentの実装範囲ではありません。LLMが低頻度の計画や説明を担当し、小型の行動モデルが反復処理を担当する構成も研究候補です。この分業は現状の実装ではありません。

## 期待の根拠と、根拠にならないこと

| 観点 | 期待する効果の仕組み | 主張の限界 |
| --- | --- | --- |
| 消費電力・継続運用費 | 必要な判断を限られたCPU処理で実行できれば、継続運用のエネルギーや外部推論API呼出しを減らせる可能性 | RAM使用量からWや電気代は算出できない。比較対象の実装・稼働率・品質次第 |
| RAM・設備 | グラフを共有し、個体ごとの状態とreadoutを持つため、個体ごとに全モデルを複製する必要がない | LLMサーバーも重みを共有できる。CPUで動くことは低電力・マイコン対応の証明ではない |
| 反応速度 | 固定stepの数値処理から行動を決め、毎回の文章生成や外部推論API往復を省ける | 固定計算量でもOS・メモリー帯域等で時間は変動。現在もチェーンRPCは必要 |
| 適応 | 固定回路から行動へ変換する部分だけを再適合し、状態を維持して次の判断へ反映できる | 小型RNN・reservoirでも可能。少ない学習データで未知環境へ適応する優位は未証明 |

BioAgentの実装は、生きたハエの消費電力を利用する装置ではありません。CPU上のNumPy/SciPyによる人工rate modelです。現在は活動のない神経も含めて計算し、spikingやイベント駆動の省電力回路を実装したわけではありません。[実装](../../../packages/bio_agent/full_apps/brain.py)、[疎行列ランタイム](../../../packages/bio_agent/full/model.py)。

削減が直接及ぶと期待するのは、Agentを動かす利用者・端末・ホスティング側です。Uniswap/Aquaのガス代や運営費が自動的に下がる、という意味ではありません。導入費用が下がれば利用者や継続利用が増える可能性がありますが、この波及効果も未測定です。

## 現在の実測を正確に使う

[収録6周期の生データ](settlement-evidence.json)から[集計JSON](resource-evidence.json)を生成しています。新たな負荷試験や消費電力測定を行ったものではありません。

| 指標 | 観測値 | 範囲 |
| --- | --- | --- |
| 対象 | 4個体 × 166,700神経、25,582,938接続／個体 | 接続グラフは共有、神経状態は個別 |
| peak RSS | 443.2 MiB | Pythonプロセスの生存期間中の最大値。PC全体・1個体分・準備処理の最大値ではない |
| 神経処理 | 333.3–492.1 ms、中央値348.5 ms | 6周期。4個体合計・各4step＋特徴抽出。行動readout・IPC・RPC等を除く |
| アプリの1周期 | 2.582–3.093秒、中央値2.750秒 | ローカルRPC・取引・学習更新を含む。次の周期までの待機を除く |
| 実行間隔 | 約4秒を目標 | 遅い周期では延長。計算時間とは別のアプリ設定 |
| 学習対象 | 180係数／個体（3行動 × bias込み60特徴） | 保存readoutを確認。25,582,938接続全体を学習しているわけではない |
| 消費電力・J/判断 | 未測定 | 生物モデルとLLMの比較結果も未取得 |

神経処理時間を4で割って「1個体の応答時間」と呼んだり、6周期からp95の実運用保証を出したりしません。GPUを必要としないこの計算経路が存在する、という説明はできます。スマートフォン、マイコン、専用低電力機器への移植・最低RAM・連続運転の電力は別途確認が必要です。全規模データの準備に必要なメモリーは、この推論プロセスのRSSとは別です。

1個体のfloat64状態ベクトルだけなら `166,700 × 8 bytes ≈ 1.27 MiB` ですが、グラフ・索引・作業領域・ランタイムを含みません。「モデル全体が1.27 MiB」「4個体でも約600 bytes」とは言いません。約600 bytesという過去の値は別の7神経実験の保存方策JSONです。

## 想定反論への答え

### 「LLMなら256 GB必要なのでは？」

一律の必要量ではありません。重みの理論サイズは `パラメーター数 × bit数 ÷ 8`。8BならFP16で16 GB、4bitで理論上4 GB（十進単位）です。実際には量子化の補助情報、作業領域、activation、KV cacheなどが加わり、文脈長や同時実行数も影響します。この計算は実機で動く最低RAMや能力の同等性を示すものではありません。[Hugging Face：量子化](https://huggingface.co/docs/transformers/main/en/quantization/overview)、[KV cache](https://huggingface.co/docs/transformers/main/en/kv_cache)。

API型のLLMは、クライアント側が重みを保持しません。小さい端末同士の比較なら、BioAgentのローカル計算とLLM APIクライアントのRAMだけを比べて優位を決めることはできません。費用・通信遅延は測れますが、提供側の電力は外部から測れない場合があります。[Hugging Face：hosted inferenceの構成](https://huggingface.co/docs/inference-providers/index)。

### 「メモリーが小さいなら電気代も安い？」

期待はできますが、比例関係は置けません。CPU/GPUの種類、実行時間、メモリー転送、稼働率、待機電力が変わるためです。推論だけの測定と、アプリ全体を常時動かす測定を分けます。機器全体のAC電力を測る範囲は[MLCommonsの計測方針](https://mlcommons.org/benchmarks/inference-edge/)を参考にします。MLPerf準拠・認定済みという主張ではありません。

- 電力：平均・ピークの **W**。電力量：区間で積算した **J / Wh**。
- 総J/判断：測定区間の全機器エネルギーを完了判断数で割る。待機を含む値と、待機分を差し引いた増分値を別々に報告する。
- エラー・期限超過・再試行も計上し、有効な判断1件あたりの値も出す。精度を下げて省電力に見せない。
- 電気代の試算：`平均W × 稼働時間 ÷ 1,000 × 電力単価`。総費用にはAPI、設備償却、データ準備、学習、RPC、運用を加え、チェーンのガス代を別記する。

RAPL等のCPU package値は、壁コンセントでの全機器電力と同じではありません。現在はどちらも測っていないため、仮のWや削減倍率を実測値として載せません。

### 「333 msで取引完了？」「LLMより必ず速い？」

333 msは今回の最終周期の**4個体分の神経計算と特徴抽出**です。readout計算やプロセス間通信まで含む「利用可能な行動が返るまでの遅延」は別に計測します。取引のreceiptまで、さらにチェーンの最終確定までを分け、Anvilの即時採掘からSepolia/mainnetの時間を推定しません。

LLMと比べるなら最初のトークンが出る時間だけではなく、必要な行動が確定して利用できる時点までを測ります。LLMも短い構造化出力にでき、キャッシュ等で生成を効率化できます。常に遅い相手を仮定しません。[Hugging Face：生成とcache](https://huggingface.co/docs/transformers/main/en/kv_cache)。

### 「小型NNやreservoirで十分では？」

有力な対照です。固定された再帰回路と学習readoutという設計には、Echo State Networkなどの先行例があります。軽量学習という仕組み自体を、本プロジェクトや生物固有の発明として説明しません。[Lukoševičius・Popovici・Jaeger・Siewert, 2006, §2.1](https://www.ai.rug.nl/minds/uploads/techreport2.pdf)。

このプロジェクトが調べたいのは、**実測した生物接続が、履歴を含む判断や環境変化への対応で、同予算の非生物回路より良い結果を生む条件があるか**です。現状の人工動力学は生体の全機構を再現していません。生物由来だから省電力・高性能になるとは推論できません。7神経の採餌課題では直接入力の対照が同程度でした。[既存の比較結果](../../research/bioagent-adaptation/README.md)。

## 次に行う公平な比較（提案、未実施）

1. **課題を固定**：同じ数値観測・履歴・行動制約・報酬・安全条件を与える。初めは採餌、次に固定ペア・同額見積もりでの実行／見送り。
2. **対照を用意**：固定ルール、直接入力線形モデル、学習可能な小型MLP/RNN、ランダムreservoir、BioAgent。生物構造の寄与には次数・重み分布・正規化を揃えた接続シャッフル対照も用意する。LLMはモデル・量子化・prompt・文脈・出力形式・cache・API/ローカルを明記。
3. **品質と適応を測る**：学習・選択・テストを分離。新しい環境へ変えた後の回復時間、必要サンプル数、報酬、失敗・安全違反を測る。LLMのin-context適応と重み学習を同一扱いしない。
4. **資源を測る**：利用可能な行動までのp50/p95、cold/warm、処理数/秒、ピークRAM/VRAM、WとJ/判断を記録する。1個体と4個体、同じ要求頻度で比較。モデル準備・学習と推論を分け、起動や共有グラフも計上する。
5. **適用条件を示す**：同品質での費用、又は同じ資源上限での品質を比べる。差とばらつきを報告し、CPU、OS、ライブラリ、thread数、同時負荷を保存する。優位がなければ、目的に適した対照モデルを選べることを成果として説明する。

## English: defensible comparison

**Expected benefit.** A fixed circuit and small learned readout may make repeated, task-specific decisions economical. The hypothesis concerns numeric observations and a few actions, not general language understanding. Lower energy, cost and latency require matched evidence. A future hybrid could use an LLM for planning and a small controller for repeated actions; this is not implemented.

Potential savings would accrue to the agent operator, not automatically to a protocol’s gas or operating costs. Easier deployment could encourage adoption, but that business effect is unmeasured.

**Current observations.** Six recorded cycles used four full-population agents. Python peak RSS was 443.2 MiB. Neural computation plus feature extraction took 333.3–492.1 ms, median 348.5 ms, for all four agents. Complete local cycles took 2.582–3.093 s, median 2.750 s, before the cadence wait; the loop targets approximately four seconds. No power, energy, single-agent latency or production p95 was measured. Sources: [raw cycles](settlement-evidence.json), [resource summary](resource-evidence.json).

**Why the architecture might help.** One fixed sparse graph is shared across agents; each has separate state and 180 learned readout coefficients (three actions, 60 features including bias). This limits the component being refitted. It does not make the entire model 180 parameters: 25,582,938 fixed connections still participate. The current NumPy/SciPy implementation updates all neuron states, not an event-driven spiking or biological device. A state vector alone is about 1.27 MiB; that excludes the graph, workspace and runtime. The historical ~600-byte policy belongs to a separate seven-neuron experiment.

**“Does every LLM need 256 GB?”** No. Ideal weight bytes = parameters × bits / 8: an 8B model has 16 GB of FP16 weights or an ideal 4 GB at four bits. Additional caches and runtime storage remain; this is not a measured memory minimum or equivalent-capability comparison. [Weight quantization](https://huggingface.co/docs/transformers/main/en/quantization/overview), [KV cache](https://huggingface.co/docs/transformers/main/en/kv_cache). Hosted-model clients do not hold the server weights; distinguish client resources from the service's infrastructure. [Hosted inference](https://huggingface.co/docs/inference-providers/index).

**“How much electricity do you save?”** We do not have a savings ratio. Measure whole-system power and energy at matched quality, rate and completed work; the wall-power scope follows the principle described by [MLCommons](https://mlcommons.org/benchmarks/inference-edge/), without claiming MLPerf compliance. Report gross and idle-subtracted energy separately, include failures/retries, and distinguish total decisions from valid decisions. Electricity cost = mean watts × hours / 1,000 × tariff. Add hardware, model preparation, training, API/RPC and operating costs; list chain gas separately. CPU-package counters alone do not measure the whole system.

**“Does 333 ms mean settlement?”** No. It excludes the action readout, messaging and chain operations. Compare time to a usable action, not only time to the first generated token. Measure receipt and finality separately; local Anvil timing does not predict a public chain. LLMs can use short outputs and caching, so a slow verbose baseline would be unfair. [Caching documentation](https://huggingface.co/docs/transformers/main/en/kv_cache).

**“Why not conventional small AI?”** Fixed recurrent circuits with learned outputs have established precedents. [ESN primary paper, §2.1](https://www.ai.rug.nl/minds/uploads/techreport2.pdf). The biological question is whether measured wiring improves temporal decisions or adaptation under a matched budget. That has not been established. The existing seven-neuron foraging task matched a direct-input learner; do not generalize its outcome to full-market performance. [Experiment](../../research/bioagent-adaptation/README.md).

**Proposed test, not completed.** Match observations/history, action limits, quality criteria and request rate across rules, linear models, small MLP/RNNs, random reservoirs, biological and shuffled graphs, and an explicitly configured LLM. Separate fitting, selection and unseen testing. Measure reward, adaptation speed, samples needed, errors, usable-action p50/p95, throughput, RAM/VRAM and joules/decision. Separate cold/warm execution, learning, model preparation and inference. Record host/software/thread settings and competing workloads. Compare cost at equal quality or quality under an equal resource cap, with variability reported. LLM context adaptation does not necessarily require weight training.
