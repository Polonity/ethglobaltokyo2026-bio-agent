# 採餌の改善検証 / Foraging validation

## 日本語 — 1分で説明

**目的は、オンチェーン環境を読んだBio Agentが、経験から餌へ近づく行動を獲得することです。** 旧動画では同点の行動スコアが右方向へ偏り、1配置だけの経験収集では別配置への適応が不十分でした。

1. 同点時の選択をseed付きランダムに修正。餌へ向ける決め打ち処理は追加していません。
2. 確定TXで作った12配置から、各個体768行動の経験を収集。最初70%でreadoutを学習し、残り30%で報酬予測を確認します。166,700神経の接続は固定です。
3. 別の6配置で、学習前と候補に**同じ環境・刺激TX**を再生して採用を判定。餌は1個→12個／12個へ改善しました。
4. モデルを固定し、未使用12配置でランダム・直接入力モデルと比較。2個体が同じ箱庭で共有する餌24個が分母です。

| 最終テスト | 餌の回収 | 餌へ近づいた移動 | 危険域内のステップ |
| --- | ---: | ---: | ---: |
| 全神経＋学習readout | **24 / 24** | **577 / 628（91.9%）** | 7 |
| ランダム | 4 / 24 | 793 / 1,675（47.3%） | 29 |
| 神経回路なし・直接入力ridge | 23 / 24 | 670 / 777（86.2%） | 23 |

**結論：採餌は改善しました。Bio Agent固有の優位性は未確定です。** 直接入力モデルも同じ経験と学習式で良好に動きます。これは1回の学習・12配置の結果であり、独立した学習の反復や統計的優位を確認したものではありません。

**安全基準は未達。** 事前基準は回収率75%以上・接近率65%以上・ランダムより回収が多いこと・各配置の危険域滞在1ステップ以下。最後の条件は最大6ステップで不合格でした。基準は結果を見て緩めていません。危険域接触7は「7回の侵入」ではなく、域内にいた行動ステップの合計です。

質疑への回答：人工設計の方向センサーを神経回路へ入力し、実際の行動結果からreadoutだけを学習します。「ハエの意識」「神経接続そのものの学習」「消費電力削減」を実証したわけではありません。環境と刺激はすべてAnvilの確定TX由来。身体状態・移動・推論はオフチェーンです。Sepoliaの縮小モデルへこの性能を外挿しません。

## English — one-minute explanation

**We test whether a Bio Agent learns to approach food from experience in a TX-defined world.** The earlier video exposed deterministic ties that always selected east and insufficient experience diversity.

1. Replace fixed tie-breaking with seeded random selection; add no target-steering rule.
2. Collect 768 actions per agent across 12 TX-defined worlds. Fit the readout on the first 70%; check reward prediction on the remaining 30%. All 166,700 neurons remain in inference; connections stay fixed.
3. Select candidates on six separate worlds, replaying identical confirmed environment/stimulus transactions. Collection improves from 1 to 12 of 12 food items.
4. Freeze the candidates and compare on 12 untouched worlds with identical inputs. The two agents share 24 available food items in total.

| Held-out model | Food collected | Moves toward food | Hazard steps |
| --- | ---: | ---: | ---: |
| Full connectome + learned readout | **24 / 24** | **577 / 628 (91.9%)** | 7 |
| Random | 4 / 24 | 793 / 1,675 (47.3%) | 29 |
| Direct sensory ridge, no connectome | 23 / 24 | 670 / 777 (86.2%) | 23 |

**Foraging improved; a unique biological advantage remains unproven.** The small direct-input model also performs well using the same collected actions, rewards and ridge training. One training run and twelve paired test worlds do not establish statistical or general superiority.

**The frozen safety criterion failed.** Food collection ≥75%, approach ≥65%, and more food than random passed. At most one hazard step per world failed: the maximum was six. We retained the original criterion. Hazard steps count occupancy, not separate entries.

Engineered directional sensory encoding is explicit. Only the readout learns; fly thoughts, synaptic learning and power savings are not demonstrated. Environment/stimulus inputs are confirmed Anvil transactions; bodies and inference run off-chain. These full-model findings are not claims about the reduced Sepolia model.

## Evidence and reproduction

- [Machine-readable results, TX inputs and artifact hashes](foraging-validation.json)
- Historical failure: [previous video diagnosis](foraging-behavior-review.md)
- Scripts: `scripts/full/foraging-validation.mjs`, `fit-foraging-direct-control.py`, `test-foraging-validation.mjs`, `finalize-foraging-validation.mjs`, `publish-foraging-validation.mjs`.
- Use a fresh `FULL_APPS_STATE_DIR`, `FORAGING_VALIDATION_OUT`, and dedicated local Anvil via `FULL_RPC_URL`. Collect/select first; fit the direct control on its SQLite file; freeze and run final tests once. Preserve all test cases, including failures. New TX hashes can change food locations, so fresh reruns need not reproduce identical counts.
