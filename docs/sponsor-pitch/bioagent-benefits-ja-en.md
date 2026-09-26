# BioAgent：効果を確かめて、学習成果を再利用する

2026-09-26。1分説明用の補足資料。既存モデルのオフライン実測。外部サービス・取引・本番環境の変更なし。

## 日本語：1分の説明

BioAgentでは、行動の改善と、学習成果を再利用できる仕様の両方を検証します。軽量採餌モデルを新しい30条件で比較すると、学習後の採餌数は15%増えました。ただし衝突も91%増え、総合報酬は悪化しました。したがって、採餌数だけで成功とは言えません。一方、学習済み方策を保存して読み込むと、再学習なしで9,000ステップの行動・報酬が一致し、別モデル・別用途への誤適用も拒否できました。仕様の狙いは、回路の出自、身体・入力、学習範囲、評価条件を共有し、成果を正しく引き継ぐことです。次の合格条件は、未使用条件で採餌が増え、衝突が増えないこと。通常AIに対する優位性は、別の比較で検証します。

## 日本語：効果から決める仕様

| 誰に与える効果か | 効果の確認方法 | 仕様に必要なもの | 現在の根拠と限界 |
| --- | --- | --- | --- |
| 利用者：学習後の行動を良くする | 同じ初期状態で固定方策と比較し、目的と副作用を両方測る | 目的指標、制約指標、学習・選択・最終評価の区別、採用条件 | 軽量採餌は採餌数増と衝突増が同時に発生。総合改善は未達 |
| アプリ開発者：学習成果を再学習なしで使い直す | 保存前後で同じ入力への行動・報酬が一致する | モデルと用途の識別、方策版、読出しの形式、復元条件 | 30条件×300行動＝9,000ステップ一致、追加学習0。別モデル・別用途を拒否。同一ランタイム内での読出しの再利用 |
| 研究者・統合先：改善の原因を比較できる | 生物由来回路・組替え回路・小型AIを、同じ入力と予算で比較する | 生物データの出自、動力学、感覚／運動変換、身体状態、固定部分と学習部分、実測コスト | 回路を除くと行動が変わる既存記録はある。生物由来の構造が性能を高めるとの証明はまだない |

「仕様を作った」だけでは開発負担の削減を実証したことになりません。次の仕様検証では、独立した利用側が同じ成果物を読み込み、同じ入力で一致するかを確認します。導入時間や削減工数は、実際に測るまでは数値化しません。

## 日本語：実測と解釈

軽量版は7神経・19接続のMaleCNSスライスに人工的な感覚／行動変換とQ学習の読出しを組み合わせています。生体のハエや、166,700神経の全神経版の成績ではありません。

1回の学習（seed 2026、事前80行動、960シミュレーション学習ステップ＋経験再生）後、学習時および既存の選択用3 seedとは別の30 seedで各300行動を実行しました。評価中の追加学習は無効。学習前・学習後・保存から復元した方策には、同じ初期位置・身体・環境・乱数状態を与えました。方策以外の休息・エネルギー回復は持ち込んでいません。

| 指標：1エピソードあたり平均 | 学習前 | 学習後 | 解釈 |
| --- | ---: | ---: | --- |
| 採餌数（事前に指定した主指標） | 8.63 | 9.93 | +1.30、約15.1%増。24勝／4同点／2敗 |
| 障害物との接触ステップ数 | 17.97 | 34.33 | +16.37、約91.1%増。連続して障害物内にいる場合も毎ステップ数える |
| 人工的な総合報酬 | −1.43 | −27.39 | 悪化。採餌・接近の報酬と接触等のペナルティを含む |

30エピソードの対応差の95% bootstrap区間は、採餌数 +0.60〜+1.90、接触数 +7.00〜+26.57、総合報酬 −43.55〜−9.32。主指標の事前合格条件は満たしましたが、副作用と総合報酬が悪化しているため、総合的な改善とは主張しません。この区間は固定した1つの学習済み方策のエピソード差についてのもので、学習seedの違いや実環境に対する信頼区間ではありません。

保存・復元の照合対象は各ステップの行動、観測、報酬、方策版、身体の遷移です。評価エピソードは新しい状態から開始しており、異なるアプリへの技能転移や個体の全履歴の移植ではありません。

別途、既存の全神経版採餌記録も確認しました。MOMOは選択用条件で平均行動報酬 −0.0157→+0.1646 の候補を採用。SORAは予測誤差が改善しても行動報酬 +0.0139→−0.0285 のため不採用となり、その後のテストで旧方策を使用しています。これは採用機構の有用な例で、未使用条件での性能優位の証明ではありません。今回の軽量版の結果と混ぜません。

## 日本語：次の小さな実証の合格条件

- **行動の効果**：次回は採餌数増に加え、接触数が増えないことを採用条件にする。調整に使った今回の30条件は最終評価に再利用せず、別の条件を先に固定する。学習seedも複数にする。
- **仕様の効果**：別の利用側で学習済み成果物を読み込み、再学習なしで同じ入力に同じ出力を返す。モデル・用途・入力変換の不整合は理由を示して拒否する。現時点の一致は同一ランタイム内に限る。
- **Bio固有の効果**：固定方策に加え、通常の小型AIと、規模・入力・読出し等を揃えた組替え回路を比較する。評価回数と計算予算を揃え、報酬・接触・RAM・遅延を報告する。今回の学習前後比較だけでは生物由来の優位性を判断しない。

## 日本語：質疑への回答

**普通のAIでも保存・検証できますよね？** はい。保存や学習はBio固有の機能ではありません。BioAgentの仕様で共有したいのは、生物データから回路を作る過程、人工的な入力・身体・行動変換、変更した学習部分まで含む実験条件です。それでも性能優位は別途示す必要があります。

**共通仕様は完成していますか？** いいえ。提案中のsemantic profileと限定的な実装です。汎用validator、確定した共通wire形式、独立した全仕様の実装間相互運用は未達です。今回の9,000ステップ一致は、その全仕様への適合証明ではありません。

**Uniswapや1inchに何が返せますか？** 学習型クライアントの改善・悪化を同じ条件で検証できる実装例と、再利用できるモデル記述・結果記録が候補です。採餌の効果は取引の効果に読み替えません。Router利用者増、注文品質、取引費用への寄与はスポンサー別の評価で確認する必要があります。既存の集中流動性への対応を代替したとの主張もしません。

**LLMより安いですか？** 今回は比較していません。既存のCPU計測は動作に必要な資源の実測であり、同品質の通常AIに対する省電力・低コストの証明ではありません。

## English: one-minute explanation

We test two kinds of value: better behavior and reusable learning artifacts. On 30 new foraging scenarios, learning increased food collection by 15%, but obstacle contacts rose by 91% and total reward fell. This is not an overall improvement. Separately, a saved policy reproduced all 9,000 action and reward steps without retraining; wrong-model and wrong-task imports were rejected. The proposed specification ties together biological provenance, body and input mappings, learning scope, and evaluation conditions so developers can reuse results correctly. Our next acceptance condition is more food without more collisions on new scenarios. Any advantage over conventional AI still needs a separate comparison.

## English: define the specification through its effects

| Beneficiary and intended effect | Measurement | Required semantics | Evidence boundary |
| --- | --- | --- | --- |
| Users: better behavior after learning | Compare with a frozen policy from identical initial states; report objectives and adverse effects | Objective and constraint metrics, training/selection/test separation, adoption criteria | More food and more collisions in the lightweight task; no overall improvement |
| Developers: reuse a learned result without retraining | Match actions and rewards after export/import | Model/task identity, policy version, readout format, restore conditions | 9,000 matching steps, zero additional training; wrong-model/task imports rejected, within one runtime |
| Researchers and integrators: identify what caused an improvement | Compare the biological circuit, rewired controls and small conventional AI with matched inputs and budgets | Source data, dynamics, sensory/motor mappings, body state, frozen/learned parts, measured resource use | Existing ablation changes behavior; that does not establish better performance from biological topology |

Writing a specification does not itself prove reduced integration effort. An independent consumer should load the same artifact and reproduce outputs before claiming interoperability. Engineering time saved remains unmeasured.

## English: measurements and interpretation

This uses the **seven-neuron, nineteen-edge MaleCNS slice**, engineered mappings and a Q-learning readout. It does not measure a living fly or the 166,700-neuron model.

One training run used seed 2026, 80 preceding actions and 960 simulation training steps plus replay. Evaluation used 30 new seeds, separate from training and the built-in three selection seeds, with 300 actions per seed. Online learning was disabled. Initial environment, position, body and random state matched across untrained, learned and restored policies; no training-time rest or energy recovery was transferred.

| Mean per episode | Before | Learned | Interpretation |
| --- | ---: | ---: | --- |
| Food collected, prespecified primary outcome | 8.63 | 9.93 | +1.30 / +15.1%; 24 wins, 4 ties, 2 losses |
| Obstacle-contact steps | 17.97 | 34.33 | +16.37 / +91.1%; continuous contact counts once per step |
| Engineered cumulative reward | −1.43 | −27.39 | Worse; includes food/progress rewards and contact penalties |

The 95% paired bootstrap intervals are +0.60 to +1.90 food, +7.00 to +26.57 contacts, and −43.55 to −9.32 reward. The prespecified primary criterion passed; adverse effects and overall reward worsened. These intervals describe episode variation for one fixed trained policy, not uncertainty over training seeds or real-world environments.

The restore check matched actions, observations, rewards, policy versions and body transitions for all 9,000 steps. Episodes started from fresh states. This demonstrates local readout reuse, not skill transfer between applications or full individual-state portability.

A separate existing full-model record illustrates adoption control: MOMO's selection-condition mean action reward rose from −0.0157 to +0.1646 and the candidate was adopted. SORA's prediction error improved but action reward fell from +0.0139 to −0.0285; it retained its previous policy in the subsequent test. This is an adoption-mechanism example, not proof of held-out superiority, and is distinct from the new lightweight experiment.

## English: acceptance criteria for the next small demonstration

- **Behavior:** require more food without increased contacts. Freeze new test conditions before the next evaluation; do not reuse these 30 scenarios as an untouched test set. Replicate training seeds.
- **Specification:** an independent consumer imports the learned artifact and reproduces outputs without retraining, with explicit rejection of incompatible model, task or input mappings. Current matching is within one runtime.
- **Biological contribution:** add small conventional AI and rewired-circuit controls with matched scale, inputs, readout and budgets. Report reward, contacts, RAM and latency. Before/after learning alone does not establish a biological advantage.

## English: Q&A

**Can ordinary AI also save policies and validate them?** Yes. These capabilities are not exclusive to BioAgent. The proposed profile standardizes the provenance and interpretation of biological connectivity together with engineered mappings, body state and learning scope. Performance advantage still requires separate evidence.

**Is the specification complete?** No. It is a proposed semantic profile with limited implementations. A general validator, frozen wire format and independent full-profile interoperability remain incomplete. The 9,000-step match is not full-profile conformance.

**What value reaches Uniswap or 1inch?** Candidate contributions are an evaluable learning-client example and reusable model/evidence records. Foraging results do not establish better trading, lower transaction costs or increased Router adoption. Those require sponsor-specific measurements; this does not claim to replace existing concentrated-liquidity tools.

**Is it cheaper than an LLM?** This experiment does not compare costs. Existing CPU measurements establish resource use on that host, not equal-quality cost or energy superiority over conventional AI.

## Sources / 再実行

- Protocol fixed before the new comparison: `docs/sponsor-pitch/benefit-protocol.json`.
- Run: `node docs/sponsor-pitch/measure-benefits.mjs`.
- Raw paired outcomes, policy report and source hashes: `artifacts/bioagent-benefits-20260926/measurement.json`.
- Saved readout: `artifacts/bioagent-benefits-20260926/trained-readout.json`.
- Existing full-model adoption evidence: `artifacts/full-apps/foraging-full-latest.json`; mechanism: `packages/bio_agent/full_apps/learning.py`.
- Proposed specification and its implementation limits: `docs/standards/embodied-learning-profile.md` and `docs/standards/application-types.md`.
- Existing runtime checks rerun this session: `node --test tests/body-checkpoint.test.mjs tests/male-learning.test.mjs tests/circuit.test.mjs` — 14 passed.
- Independent small-circuit reference: `python3 scripts/check-circuit-reference.py artifacts/submission-demo/circuit-evidence.json` — 192 recorded JavaScript trace steps match Python within absolute tolerance 1e-12. This is a circuit check, not a complete alternative agent implementation.

MaleCNS source attribution: FlyEM / HHMI Janelia, Cambridge, MRC LMB, Google; CC BY 4.0. The measured source graph is combined with artificial dynamics and task mappings.
