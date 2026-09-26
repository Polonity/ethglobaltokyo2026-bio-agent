# BioAgent: 学習実験からフレームワークへ / From experiments to a framework

2026-09-26。結論は、**人工採餌環境での学習効果と、共通フレームワークの実用上の効用を確認した。生物由来回路の性能優位は確認できなかった**、です。報酬の改善には身体エネルギーの低下も伴います。

[フレームワーク・構成図・起動手順](../../../packages/bioagent-framework/README.md) · [事前に固定した実験プロトコル](protocol.json) · [一次記録](../../../artifacts/bioagent-adaptation-20260926/experiment.json) · [集計](../../../artifacts/bioagent-adaptation-20260926/summary.json)

## 何を変えたか

初回の研究では、従来のQ学習を5回行うと餌は増えましたが接触がさらに増え、総合報酬が悪化しました。厳格な外部ゲートだけでは候補がすべて落ち、改善もありませんでした。市場は相場条件で改善・悪化が逆転し、Aquaの人工目標は既知の式が最良でした。[初回の記録](../../../artifacts/bioagent-study-20260926/findings-ja-en.md)を残しています。

今回は、既存Q学習を置き換えず、**別の実験アダプター**で固定回路の出力から行動へ変換する3係数を、報酬を用いたランダム探索で学習しました。休息バイアス、疲労への反応、移動方向の継続性です。学習中の候補比較、採用時の選択評価、最終評価をすべて決定的な300stepにそろえました。トポロジー・神経接続を学習したのではありません。

最初に開発用seedで挙動を確認し、その後、探索予算・評価条件・採用基準・未使用seedをプロトコルへ固定しました。最終テストを見て候補を選び直していません。5つの探索seedは同じ12学習環境を共有し、20選択環境で採用を判定します。最終評価は60の新しい環境seed、2種類の入力条件と、障害物配置を変えた追加stress条件です。

## 結果

各値は1個体・300stepの指標を、5探索seed × 60テスト環境で平均したものです。5×60を300の完全独立学習実行と解釈してはいけません。

| 条件 | 学習前報酬 | 学習後報酬 | 餌：前 → 後 | 接触：前 → 後 | 条件を満たす探索実行 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 標準 | 18.79 | 56.12 | 6.80 → 20.84 | 1.25 → 0.10 | 5 / 5 |
| 低供給・高刺激 | 18.59 | 56.35 | 6.80 → 20.84 | 1.28 → 0.09 | 5 / 5 |
| 障害物再配置（追加stress） | 10.51 | 45.01 | 6.15 → 16.76 | 4.22 → 0.19 | 5 / 5 |

標準条件の報酬差は **+37.34**、探索seedと環境seedの2軸bootstrapによる95%区間は **[+28.85, +46.84]**。接触差は **−1.15**、同区間は **[−2.94, 0.00]**です。接触は平均で減りましたが、区間上端は0なので、どの新環境でも厳密に減るとは言えません。

| 標準条件の比較 | 平均報酬 | 平均接触 |
| --- | ---: | ---: |
| 学習前MaleCNS | 18.79 | 1.25 |
| 学習後MaleCNS | 56.12 | 0.100 |
| 入力を直接使う対照を同予算で学習 | 56.08 | 0.087 |
| 特定の固定ルール：目標方向＋低体力休息 | 49.05 | 0.083 |

MaleCNSと直接入力の報酬差は **+0.045、95%区間 [−0.123, +0.197]**。この課題では生物由来回路の優位を確認できませんでした。直接入力も学習すれば同程度になります。固定ルールに対しては報酬差 **+7.07 [ +3.65, +11.15 ]**ですが、接触はわずかに多く、すべての指標で優位ではありません。すべての通常AI、最良の非生物モデル、LLMとの比較ではありません。

危険方向の除外を追加しましたが、今回の学習前・学習後の方策は、その除外の有無でテスト結果が同じでした。したがって、改善を追加ガードの効果とは説明できません。学習前の平均休息 **192.07 / 300step** が **7.68 / 300step**まで減ったことが主要な行動変化です。従来Q学習の各失敗要因を因果的に分離した実験でもありません。

## 身体状態への副作用

主解析後に、モデルを変更せず追加監査しました。この監査は事前の成功基準には含まれていません。[生データ](../../../artifacts/bioagent-adaptation-20260926/body-audit.json)。

| 標準条件の身体指標 | 前 | 後 |
| --- | ---: | ---: |
| 最終エネルギー | 0.722 | 0.361 |
| 低エネルギー（<0.12）のstep数 | 0.00 | 48.50 / 300 |
| 最終の蓄え | 0.607 | 0.279 |

動き続けることで人工報酬を増やし、体力を多く使っています。これを生物として健全な適応と断定できません。フレームワークに`new ForagingBackend({ minimumFinalEnergy: 0.8 })`のような**終了時平均エネルギーの下限**を追加し、報酬が改善した候補でも棄却できることをテストしました。0.8は拒否動作を確認するための例で、生物学的に校正した推奨値ではありません。この制約付きで新たな改善方策を発見した、という結果ではありません。

## 実装で確認できた共通化の価値

- **2つの別エンジン、1つのAPI**：採餌とAquaが`LearningBioAgent`を使い、学習候補を評価してから採用。未評価・悪化候補の拒否を確認。
- **保存した成果の適用範囲を確認**：identity、用途、model、encoder、dynamics、readout、actionSpace、任意の採用制約を照合。異なる用途への復元を拒否。採餌/Aqua各300判断を追加学習なしに復元一致。
- **共有環境の時計**：旧方式は個体ごとのstepで環境が二重に進んだ。共通時計経由では2個体が1tickずつ進み、重複tickと競合する時計の生成を制御。
- **実コントラクトから判断まで**：隔離Anvilへ実Registryをデプロイし、3つの入力更新から2アダプターの6判断を生成。CLIも同じ入力を読み、rollback・異なるchainを拒否。sourceのRPC呼出しが読み取りだけであることを記録。
- **実ブラウザーの確認**：採餌・Aquaそれぞれの学習、評価、採用、保存、復元、刺激変更を操作。EVMの6判断を記録再生し、元の判断とpolicy hashが完全一致。日本語・英語・モバイル幅を確認。

これらはSDKの導入時間を何時間削減したかという測定ではありません。重複しがちな処理を共通実装として実行できることを示しています。Solidity `IBioAgent`の継承だけでこれらの機能が自動的に得られるわけではありません。

## Uniswap / 1inch Aquaへ伝える価値

**提案の中心は「使ってくれるbotを増やす」から一歩進め、異なる判断モデルを同じ入力・指標・出典管理で比較し、良い候補だけをアプリへ反映できる開発基盤を提供すること**です。利用者・ルーター利用・利益の増加は、現時点の測定結果ではなく事業仮説です。

Uniswap向けの次の具体的な検証対象は、固定ペア・同額の見積もりと手数料を使う「実行候補 / 見送り」の判断です。固定ルールと直接入力モデルを対照に置き、実行可能な候補の割合、手数料控除後の結果、失敗・見送り率を同じ未使用データで測ります。このフレームワーク版には市場の新しい成果を実装・実証したとは含めません。既存市場アプリの結果を生物優位の証拠に流用しません。

Aqua向けは、入力リスクに対する提示条件・撤回の判断を同じ基盤で評価する入口になります。ただし、今回のAquaアダプターの学習目標は`risk × 0.24`という人工目標です。その既知の式が誤差0の対照になるため、校正成功を取引成績や回路の必要性の証拠にはしません。接続を共通化できた価値と、判断モデルの価値を分けます。

## 審査員への1分説明

「ブロックチェーン上のBioAgentを受けて、ハエ由来の回路で判断するフレームワークを作りました。採餌とAquaで、入力検証・学習評価・保存復元を共通化しています。採餌では未使用60環境で、報酬が18.79から56.12へ改善し、接触も平均で減りました。ただし体力消費は増え、普通の入力モデルも同程度でした。生物の優位を誇る段階ではありません。モデルを同条件で比較し、悪い候補を止め、判断の根拠を追えることが今回の成果です。」

## 質疑応答

**普通のAI Agentと何が違う？** 判断の特徴計算に実測神経接続を使います。ただし動力学と入出力変換は人工設計で、学習はreadoutだけです。同条件の直接入力モデルとの結果はほぼ同じでした。生物ならではの性能利益は今後の研究対象です。

**研究として何を見つけた？** ①学習損失だけでなく行動結果で評価が必要、②休息・危険・体力の目的を分離しないと改善の定義が曖昧、③入力変換が強いと回路の寄与が見えにくい、④再利用にはモデルだけでなく用途・変換・実行責務の一致が必要、という仕様上の学びです。

**学習したとは言える？** シミュレーション結果の報酬から、48候補を比較して3係数を適合しました。固定の答えを手で選んだのではありません。ただし神経接続の可塑性、オンライン強化学習、実際のハエの学習とは別です。

**600 bytesで動く？ LLMより安い？** 約600 bytesは保存方策JSONの大きさです。回路、エンジン、ランタイム、メモリー、学習計算量は別です。今回LLMと同一課題の能力・消費電力を測っておらず、コスト優位は未証明です。

**全神経モデルなの？** この新フレームワークの実証は7神経・19接続です。全166,700神経版は既存の別ランタイムです。初回研究ではそちらも検証しましたが、この版へ統合したとは主張しません。

**安全な自動売買ができる？** このパッケージは読み取りと判断までです。秘密鍵・署名・自動取引は扱いません。アプリが実行する場合は別に認可・最新状態・数量・価格などの条件を確認する必要があります。RPCの信頼やartifactの作者認証も別です。

**別アプリへ学習を移せる？** APIと成果物管理は共通です。採餌の方策を市場やAquaへそのまま転用する技能転移は実証していません。違う用途への復元は拒否します。

## Reproduction and evidence

Run from the repository root:

```sh
npm run test:framework
npm run research:adaptation
node scripts/research/bioagent-adaptation/body-audit.mjs
npm run test:framework:chain
npm run test:framework:browser
```

Primary protocol hash: `1db1bf40c3f88601a877e981ca8a10add46cf5cef205d99ae71d0216b471c314`. Development results remain in `development.json`. Generated files are under `artifacts/bioagent-adaptation-20260926/` (Git-ignored). Protocol and reproducible source are tracked in the repository. The evidence package contains their hashes and a ZIP manifest.

## English findings and Q&A

**Conclusion.** A reusable framework and learning effects were demonstrated in synthetic foraging. Biological performance superiority was not demonstrated. Higher reward also consumed more body energy.

The new opt-in adapter uses reward-driven random search over three readout coefficients: rest bias, fatigue response and directional persistence. Neural topology is fixed. The previous Q learner remains unchanged. After development, we froze the protocol before final fitting and held-out testing. Five search seeds share 12 training worlds; 20 selection worlds govern adoption. Sixty unseen worlds per profile test the adopted policies. A relocated-hazard stress profile is reported separately.

Default reward increased **18.79 → 56.12**, food **6.80 → 20.84**, and contacts **1.25 → 0.10**. All five search runs passed the specified mean reward/contact test. Two-axis bootstrap reward change: **+37.34 [28.85, 46.84]**. Contact change: **−1.15 [−2.94, 0.00]**. These intervals do not cover alternative training-world datasets or all possible environments.

The matched direct-input learner scored **56.08**; the connectome advantage was **+0.045 [−0.123, +0.197]**, so superiority was not established. One engineered rule scored **49.05**, with slightly fewer contacts (**0.083**). We did not compare against every ordinary AI or LLM. The additional hazard guard did not change the measured policies' results. Reduced resting, from **192.07 to 7.68 ticks**, was the visible behavioral difference.

An exploratory body audit then found final energy **0.722 → 0.361**, and low-energy ticks **0 → 48.50 / 300**. This is a reward–energy tradeoff, not unqualified biological adaptation. An optional final-energy adoption floor now rejects reward-improving candidates that violate a specified reserve requirement. We verified the rejection, not a newly learned policy satisfying that floor.

**Why a framework?** Two different task engines share learning and artifact APIs. Restored policies reproduce 300 decisions per task without retraining. Artifact compatibility checks cover identity, task and model/mapping versions. One shared clock prevents duplicate Arena advancement through that API. Three actual local Registry updates produced six traceable decisions across two adapters; the CLI, rollback rejection and read-only source methods were verified. Browser interactions and historical replay matched the EVM evidence exactly.

**Sponsor value.** The practical proposal is a reusable way to compare candidate controllers against rules and direct-input models on identical inputs, reject regressions, and trace decisions to chain state and policy versions. Increased router use, user adoption, trading returns and power savings remain hypotheses. A concrete next Uniswap task is quote-and-fee-based candidate/hold decisions, measured against matched controls on unseen data. The current Aqua task is artificial calibration; its defining formula solves the target exactly.

**What is biological?** A measured 7-neuron, 19-edge MaleCNS slice participates in feature computation. Dynamics, mappings and body model are engineered. The existing full 166,700-neuron runtime is separate and not integrated into this framework release.

**What was learned?** Three readout coefficients were selected from 48 reward-evaluated candidates per run. This is optimization from experience, not biological synaptic plasticity or proof of live-animal learning.

**What does save/restore prove?** Reuse within a compatible task and runtime. It does not demonstrate skill transfer between tasks or restore the complete environment state. SHA-256 checks content integrity, not authorship.

**Is it cheaper than an LLM?** The approximately 600-byte saved policy is not the runtime memory footprint. No matched LLM capability, energy or total-cost comparison was performed.

**Can it trade automatically?** The package returns decisions only and has no signer or transaction execution. A consumer must supply its own authorization and execution-time checks. The chain source trusts its RPC and is not a cryptographic state-proof verifier.
