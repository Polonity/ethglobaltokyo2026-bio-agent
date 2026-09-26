# 低コストと適応力 — 根拠と検証案 / Cost and adaptation: evidence and proposed tests

2026-09-26 · CPUのみ新規測定 / Fresh CPU measurement only

## 日本語

**提案の核は「低い運用コストで、状況変化にも適応できるBot」。低コストと適応力の両立を、BioAgentの採用理由として検証する。**

### 今言えること

| 項目 | 根拠・結果 | 解釈できる範囲 |
| --- | --- | --- |
| LLMへの依存 | 現行の神経特徴計算と行動の読み出しはNumPy/SciPy等で実行 | 判断ごとのLLM API呼び出しは不要。端末・電力・RPC・ガスの費用がゼロになるわけではない |
| CPU推論 | GPUを使用せず、中央値162.603 ms、p95 208.383 ms | 2Agent・各4stepの神経計算。1Agentの時間やアプリ全体の時間ではない |
| メモリ | 推論プロセス最大RSS443.844 MiB。共有CSR行列293.409 MiB | モデルを含む測定プロセス。チェーンのノード、サーバー、GUIなどは含まない |
| 学習機構 | 神経結合は固定し、反応から行動を選ぶ部分を学習 | 更新機構はある。通常AIより少ない経験で適応できるかは未検証 |
| 電力・設備費 | 未測定 | メモリや処理時間だけから電気代・端末価格の削減率は出せない |

測定環境はAMD Ryzen 9 9950X、WSL2、Python 3.12.3。166,700神経／個体、25,582,938接続を省略せず使用。3回の準備実行後、合成入力による30回を測定した。学習・売買・外部APIを実行せず、稼働中のサービスの状態も変更していない。低価格PCやRaspberry Pi、マイコン上の実測ではない。

- [生の測定値とソースhash](cost-evidence.json)
- 再現スクリプト：リポジトリ内 `docs/sponsor-pitch/measure-inference.py`

### LLMより低コストと言えるか

**各判断で大きなLLMを呼ぶ構成に対して、低コスト化を狙える根拠はある。ただし、比較測定をせずに「LLMより安い」「何分の1の電力」とは言わない。** 今回確認できたのは、数値入力から神経特徴を作る処理がCPUと約444 MiBのプロセスで動くこと、判断ループにLLMが不要なこと。

比較する仕事は、自動リバランスの「実行／短時間待機」という限定した判断に揃える。自然言語での相談、ニュースの読解、計画立案など、LLMが担える全機能を置き換えたとは扱わない。必要なら、LLMで方針を設定し軽量な制御器で反復判断する構成も比較する。

[Googleの公式発表](https://developers.googleblog.com/introducing-gemma-3-270m/)には、端末動作を想定した270M級の言語モデルもある。したがって、比較対象は大型LLMだけでなく小型LLM・小型RNN・単純ルールを含める。生物の省電力性が、汎用CPU上の回路シミュレーションに自動的に引き継がれるとは考えない。

### 256GB級のLLM構成との比較

256GBのメモリを搭載した機器で大型LLMをローカル運用する構成を、比較シナリオに置くことはできる。ただし、256GBは全LLMの必要条件ではなく、今回測ったLLMの使用量でもない。モデル・量子化・文脈長・同時実行数を決めて測定する必要がある。

今回の約444MiBはBioAgent推論プロセスの使用量であり、256GBの搭載容量とは測定対象が違う。この比から「約600分の1のRAM・電力・費用」とは計算しない。示す問いは、**大型LLMが担っていた限定的な実行判断を、より小さな機器のBioAgentで、同じ品質で代替できるか**。最終的には、両方の構成でBot全体を動かすために必要な機器と費用を比べる。

### BioAgent固有の可能性をどう示すか

仮説は、**生物由来の結合構造が、限られた計算・経験の予算でも、変化に追従できる判断を作りやすくするか**。単にCPUで動くことや履歴を扱うことでは差別化できない。

- 同じ市場履歴、資産状態、売買条件、経験数で比較する。
- 通常の小型AI、LLMまたはLLM＋軽量制御、BioAgentを比較する。
- BioAgentと、規模・入力・状態更新・読み出しを揃えた次数保存の組み替え回路を比べ、生物由来構造の寄与を調べる。
- 未使用期間で、同じ成績に達するまでの経験数、相場変化後の累積損失と回復までの経験数を測る。応答が変わることと、成績が改善することを分ける。
- 判断品質を揃えたときの遅延・メモリ・判断当たりの電力量・学習更新費用を測る。実機の消費電力は待機分も含め、同一頻度・同一期間で測定する。

関連する[FlyGMのプレプリント](https://arxiv.org/abs/2602.17997v3)は、別のモデル・運動制御課題で学習効率の改善を報告している。研究の着想を支えるが、金融市場への効果は示さない。[conn2res研究](https://www.nature.com/articles/s41467-024-44900-4)には、ハエの回路がランダム化回路に有意に勝たない記憶課題の結果もある。既存研究も一律な優位性を保証しない。

### 誰のコストが下がるのか

直接の受益者は、Botを運用する開発者や利用者。Uniswapが全Botの設備費を負担するわけではない。Uniswap向けの便益は「少ない負担でAgentを立ち上げ・続けられる → Routerに接続するアプリが増える」という仮説。

月額費用の比較には、設備の償却、平均消費電力×稼働時間×電気料金、API・RPC、学習更新、運用保守を含める。外部LLM APIを使う場合は実際の利用料金を計上し、提供者側の電力と二重計上しない。スワップの手数料・ガス・待機損失も、利用者の総便益を判断する際には含める。

まずCPUで実行可能なことを示し、次に小型実機での費用と適応力を比較する。有用ならRouter接続サンプルを提供し、開発者の試用、接続、継続利用を測る。現時点で省電力率、収益率、採用者増加の数値は実証していない。

## English

**The proposal is a bot that combines low operating cost with adaptation to changing conditions. The combination is the adoption hypothesis we need to test.**

### What is supported today?

| Item | Evidence | Boundary |
| --- | --- | --- |
| LLM independence | Neural feature computation and action readout run locally | No LLM API call is needed per decision. Hardware, power, RPC and gas are not free |
| CPU inference | Median 162.603 ms; p95 208.383 ms; no GPU | Neural work for two agents, four steps each. Not single-agent or full-app latency |
| Memory | Peak process RSS 443.844 MiB; shared CSR matrix 293.409 MiB | The measured process, excluding chain nodes, server and GUI |
| Learning | Fixed neural wiring with a trained action readout | An update mechanism exists; superior adaptation is unproven |
| Energy and equipment cost | Not measured | Memory and timing alone do not establish electricity or hardware savings |

Measured on an AMD Ryzen 9 9950X under WSL2 / Python 3.12.3. The model retains 166,700 neurons per agent and 25,582,938 connections. Thirty calls with synthetic inputs followed three warmups. The isolated measurement did not learn, trade, call external APIs or modify a running service. It is not a low-cost-board or microcontroller benchmark.

[Raw measurements and source hashes](cost-evidence.json). Reproduction script: `docs/sponsor-pitch/measure-inference.py` in the repository.

### Is it cheaper than an LLM?

There is a plausible route to lower cost than calling a large LLM for every bounded control decision. The current evidence establishes CPU feasibility and an LLM-free decision loop, not a measured cost ratio or energy advantage.

Match the job: execute or briefly defer an automated rebalancing order. Do not treat this as replacing an LLM’s language understanding, news analysis or planning capabilities. Include an LLM-plus-lightweight-controller baseline when appropriate.

[Google’s official 270M model announcement](https://developers.googleblog.com/introducing-gemma-3-270m/) also targets on-device deployment. Include small LLMs, small RNNs and simple rules, not only large LLMs. Biological energy efficiency does not automatically carry over to software running on a conventional CPU.

### Comparison with a 256 GB LLM host

A 256 GB host running a large local LLM can be a comparison scenario. This is not a universal LLM requirement or a measured LLM footprint here. Specify the model, quantization, context and concurrency before measuring.

The measured ~444 MiB is BioAgent process usage, whereas 256 GB is installed host capacity. Their ratio is not a RAM, energy or cost reduction result. The test is whether BioAgent can replace the same bounded execution decision at matched quality on a smaller machine. Compare the hardware and total costs required for the complete bot in both configurations.

### How do we test a BioAgent-specific advantage?

The hypothesis is that biological wiring helps produce adaptive decisions under limited experience and compute budgets. CPU execution and temporal state alone are not unique advantages.

- Match history, positions, order constraints and experience counts.
- Compare conventional small AI, LLM or hybrid control, and BioAgent.
- Isolate wiring with degree-preserving rewiring controls, matching size, inputs, dynamics and readout.
- On held-out periods, measure experiences to reach matched performance, post-shift losses and experiences to recover. Changed responses alone do not establish better adaptation.
- At matched decision quality, measure latency, memory, energy per decision and update costs. Use the same operating frequency and duration on the target device, including idle power.

The [FlyGM preprint](https://arxiv.org/abs/2602.17997v3) reports sample-efficiency benefits for a different model on locomotion tasks. This motivates a hypothesis, not a financial result. [conn2res](https://www.nature.com/articles/s41467-024-44900-4) also includes a memory task where fly wiring did not significantly outperform rewired controls. Prior work does not establish universal superiority.

### Who benefits financially?

Bot operators and developers are the direct beneficiaries. Uniswap does not necessarily pay their compute bills. The proposed platform benefit is lower barriers to deploying and maintaining apps that use the Router.

Compare equipment amortization, average power × running hours × electricity price, APIs/RPC, learning updates and maintenance. For hosted LLMs, use actual billed charges without double-counting provider electricity. Include swap fees, gas and waiting losses when evaluating overall user benefit.

Next: test costs and adaptation on a small device, then provide a Router example if useful. Track developer trials, integration and retention separately. No energy-saving percentage, profit improvement or adoption increase has yet been demonstrated.
