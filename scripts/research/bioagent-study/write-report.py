import json,statistics,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'artifacts/bioagent-study-20260926';DOC=ROOT/'docs/research/bioagent-study-20260926'
load=lambda n:json.loads((OUT/(n+'.json')).read_text())
light,full,market,aqua,interfaces=[load(n) for n in ['light-foraging','full-foraging','market','aqua','interfaces']]
mean=statistics.mean
fsummary={k:{m:mean(v for r in full['records'] for e in r[k] for v in e[m]) for m in ['rewards','food','contacts']} for k in ['baseline','learned','heuristic']}
summary={'light':light['summary'],'full':fsummary,'fullCandidateAdoptions':sum(a['adopted'] for r in full['records'] for a in r['adoption']),'market':market['summary'],'marketRestoreAgentSteps':market['reuse']['matchedAgentSteps'],'aqua':[{'agentId':r['agentId'],'beforeMSE':r['beforeMSE'],'afterMSE':r['afterMSE'],'ruleMSE':0,'changedActions':r['changedActions']} for r in aqua['records']],'sharedUpdate':{'consumerContracts':2,'updates':1,'unrelatedAgentUnaffected':True},'interfaceScheduling':interfaces['sharedEnvironment']}
(OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
def light_table():
 rows=['| 方策 / Policy | 学習回数 / Rounds | 条件 / Profile | 採餌 / Food | 接触 / Contacts | 総合報酬 / Reward |','| --- | ---: | --- | ---: | ---: | ---: |']
 for profile in ['default','higher-stimulus-lower-supply']:
  before=next(x['before'] for x in light['summary'] if x['profile']==profile)
  rows.append(f"| Frozen | 0 | {profile} | {before['food']:.2f} | {before['contacts']:.2f} | {before['reward']:.2f} |")
  for x in light['summary']:
   if x['profile']==profile:
    a=x['after'];rows.append(f"| {x['variant']} | {x['round']} | {profile} | {a['food']:.2f} | {a['contacts']:.2f} | {a['reward']:.2f} |")
 return '\n'.join(rows)
ftable='\n'.join(['| 方策 / Policy | 平均個体報酬 / Reward | 採餌 / Food | 接触 / Contacts |','| --- | ---: | ---: | ---: |']+[f"| {k} | {v['rewards']:.3f} | {v['food']:.3f} | {v['contacts']:.3f} |" for k,v in fsummary.items()])
mtable='\n'.join(['| 模擬相場 / Regime | 凍結 / Frozen PnL | 学習後 / Trained PnL | 差 / Difference |','| --- | ---: | ---: | ---: |']+[f"| {r['regime']} | {r['meanBeforePnL']:.3f} | {r['meanAfterPnL']:.3f} | {r['meanDeltaPnL']:+.3f} |" for r in market['summary']])
atable='\n'.join(['| 個体 / Agent | 学習前 MSE | 学習後 MSE | 既知式 / Known-rule MSE | 変わった行動 / Changed actions |','| --- | ---: | ---: | ---: | ---: |']+[f"| {r['agentId']} | {r['beforeMSE']:.6f} | {r['afterMSE']:.6f} | 0 | {r['changedActions']}/10 |" for r in aqua['records']])
text=f'''# BioAgent：実験から得た結論 / Conclusions from experiments

2026-09-26。Goal：学習の効果とIBioAgent共通化の効用を測り、失敗も含めて審査員に伝えられる結論を得る。

## 結論

**限定した実装で、学習成果の再利用と共通入力による制御の効用を確認した。一方、学習量を増やすだけでは総合成績は改善せず、生物由来の構造の優位性も今回の実験では証明できなかった。**

得られた成果は、成功率の宣伝ではなく、再実行できる6系統の実験と、失敗から導いた共通仕様の要件である。候補が学習できたこと、採用されたこと、未使用条件で役立ったことは別に記録する。

## 1. 軽量採餌：学習を増やすと何が変わるか

7神経・19接続の固定回路＋Q読出し。5つの学習seed、1・3・5回の学習、各20の未使用評価seedを2環境条件で評価した。1学習につき960シミュレーションステップと経験再生。評価は各300行動で追加学習を停止し、初期身体・位置・乱数を揃えた。

{light_table()}

通常の採用方法では、標準条件で5回学習すると採餌8.40→11.71（約39%増）、接触21.30→33.14（約56%増）、総合報酬−8.36→−20.97。高刺激・低供給条件でも総合報酬は悪化した。途中の3回時点で合格した学習seedは標準条件で1/5あったが、5回時点は0/5だった。学習回数は改善の保証にならない。

改善に加えて採餌非減・接触非増を要求する実験用の外部採用ゲートも試した。既存の内部選択が採用した候補12件をすべて拒否し、方策は初期状態を維持した。悪化を避けたが、改善も得られなかった。ゲート追加だけで学習能力が良くなったとは言わない。

同じ評価seedを全方策で使う対応比較。5つの学習seedの集計であり、繰り返した評価をすべて独立サンプルとして数えない。環境条件の変更は汎化の試験で、変化後の環境へオンライン適応させた実験ではない。

## 2. 全神経版採餌：大きいモデルでも確認する

166,700神経を省略せず推論。3つの独立した収集・学習seedごとに別のSQLiteを使った。各200収集行動、80行動の選択評価、2つの未使用評価seed×80行動を実行した。世界を2個体で共有するため、個体を完全に独立な標本とは扱わない。

{ftable}

6つの個体候補のうち1つを採用。採用後の全体平均は初期方策より上がったが、入力された方向情報をそのまま使う工学的ルールが平均で上回った。これは3学習seed・2種類の評価世界に限る探索的結果で、全神経の不要性を一般化する実験でも、生物由来の構造を揃えて比較した実験でもない。

初期の全神経版読出しは0から始まり、学習済み事前知識を持たない。軽量版は工学的な初期方策がある。両者の絶対スコアを比較して「神経数だけの効果」と解釈しない。

## 3. 市場：予測誤差と運用成果を分ける

3つの学習seed、360の合成価格イベント、3相場×5評価seed×180イベント。既存PaperArenaの学習と売買ロジックを実行した。価格・一定積の見積もりは人工的で、Uniswap V3の実取引・過去検証ではない。手数料0.3%、ゲーム上のガス0.001 token1、取引深度100,000 token1を明示した。同じ初期資産・価格系列で凍結方策と学習済み方策を比較する。

{mtable}

単位は模擬token1／個体、初期資産は100。下落と往復では損失が減ったが、上昇では悪化し、どの相場も平均PnLは負だった。学習後の予測MSE改善は、利益の証明ではない。なお、この模型で何も取引せず現金だけ持つ場合のPnLは0である（結果を読むための事後的な算術上の参考。事前に実行した対照群ではない）。

3個体は異なる工学的初期方策を持つ。3学習seed×5価格seedは共通の条件を再使用した対応比較で、相互に独立した45市場の実証ではない。

同じ読出し保存APIで採餌と市場の成果物を扱った。市場では直接設定した学習済み方策と、保存・復元した方策について、**24,300個体ステップの判断・方策版・現金・保有量・評価額が一致し、追加学習は0**だった。用途をまたいだ技能転移や、身体・全履歴の移植とは区別する。

## 4. Aqua：学習が不要な目標も見つかる

既存の人工的なリスク教師 `target = risk × 0.24` に対するgain校正を、3個体で5回ずつ試した。評価用10リスク点で以下を得た。

{atable}

最初の学習で誤差が減り、再度同じ学習をしても追加採用はなかった。行動・spreadは変化し、生の回路応答によるdock条件も維持した。しかし教師の既知式を直接計算すれば誤差は0。これは診断用の自明な対照で、売買戦略ではない。この目標ではBioAgentが必要だという根拠を得られない。Aquaの収益、資本効率、実市場のリスクへの効果は未測定。

## 5. 共通入力：1回の更新を複数の契約で使える

隔離したFoundry EVMで、同じRegistryを使う`AquaFlyApp`と`SharedAquaFlyApp`を実行した。両方の戦略が有効であることを確認後、**IBioAgent経由の1回の入力更新で両契約が古いrevisionの戦略を拒否**した。別個体の戦略は有効なままだった。2件の実験テストが成功し、失敗した実行では入力トークン残高が変わらないことも確認した。

この効用は、制御側が用途別APIを知らず、個体IDと入力revisionで操作できること。ただし両アプリ側がrevisionを検証する実装は必要で、継承するだけで自動的に得られる保証ではない。2つともAquaを利用する異なる契約であり、Uniswap Routerも同じ方式で実証したという意味ではない。外部チェーンへの送信は行っていない。

## 6. 共通ランタイム：再利用できた部分と設計上の穴

ForagingBioAgent、UniswapPriceBioAgent、UniswapSwapBioAgentを、用途分岐のない`observe → step → snapshot`の共通ループで動かした。入力は明示的なfixtureで、3つとも内部は同じ採餌Arenaである。独立した3アプリの完全相互運用ではない。

2つのアダプターが同じArenaを共有すると、各個体の`step(0.2)`を順に呼ぶだけで環境が**0.4秒・各個体2行動**進んだ。環境を一度だけ進める対照では0.2秒・各1行動。この結果から、個体の意思決定と共有環境の時計を分離すべきだと分かった。既存アプリを本番変更せず、研究ハーネスで対照を作った。

現在の基底クラスには共通のlearn/checkpoint/restoreがない。SolidityのIBioAgentは入力契約で、JavaScriptのスーパークラスではない。共通化する対象は、学習アルゴリズムそのものよりも、入力、評価記録、成果物の適合条件、実行管理だと判断した。

## 審査員への1分の説明

私たちは、生物由来の回路を使うAgentの学習と共通仕様を、採餌・市場・Aquaで実験しました。学習を増やすと採餌数は増えましたが、接触も増えました。模擬市場も相場条件で改善・悪化が逆転し、Aquaの人工目標は単純な式が最良でした。一方、共通入力を一度更新すると2つの契約が古い戦略を拒否し、市場では保存した方策が再学習なしで2万4300個体ステップを再現しました。共有環境を二重に進める問題も見つかりました。ここから、成果と副作用による採用条件、成果物の適用範囲、環境の時計を仕様の要件にしました。成功と失敗を再現できるBioAgentの検証基盤が、今回の成果です。

## 質疑

**生物由来の優位性は？** 未証明。今回の比較は学習の有無・採用方法・工学的ルールとの比較。規模・入力・読出しを揃えた通常AIや組替え回路との比較が必要。

**失敗ばかりでは？** 市場の一部条件と全神経版の1候補では改善があった。しかし採餌の副作用、人工目標の自明さ、共通スケジューラーの問題も明らかになった。どの効果を保証するためにどの仕様が必要かを、再現可能な証拠で具体化できた。

**IBioAgentを継承する意味は？** 現状は共通の個体・入力・表示処理を再利用する部分に効用がある。全アプリの学習が自動的に共通化されるわけではない。今回の実装に合わせて「継承」と「共通契約の参照」を分けて説明する。

**同じ個体の経験を別アプリへ渡せますか？** 今回は同一用途の方策を再利用し、異なる用途への読出しは拒否した。採餌の知識が取引に転移したとは主張しない。

**Uniswap/1inch側の価値は？** 開発者がAgentの入力・戦略の有効性・学習結果を共通の方法で扱える実装例と評価基盤。Uniswap利用者数やAqua資本効率が増えたという実証は今回ない。スポンサー固有の効果は、この評価方法を接続先の指標に適用して確認する。

## English: conclusion

**We demonstrated limited but concrete benefits from reusable learned artifacts and shared input control. More training did not consistently improve outcomes, and this study did not establish biological-topology superiority.**

The contribution is six reproducible experiment families and requirements derived from their successes and failures. Training a candidate, adopting it, and improving outcomes on new scenarios are separate events.

### Findings

1. **Lightweight foraging:** five training seeds, one/three/five learning rounds, twenty test seeds and two environment profiles. At five rounds in the default profile, food rose 8.40→11.71, contacts rose 21.30→33.14, and reward fell −8.36→−20.97. The experimental constrained gate rejected all twelve internally accepted candidates; it prevented regression by retaining the original policy but produced no improvement. The changed profile tests generalization, not online adaptation after an environmental change.
2. **Full-network foraging:** 166,700 neurons, three isolated training runs, two agents, two test layouts, eighty actions per evaluation. Only one of six candidates was adopted. Average per-agent cumulative reward was {fsummary['baseline']['rewards']:.3f} before learning, {fsummary['learned']['rewards']:.3f} after adoption, and {fsummary['heuristic']['rewards']:.3f} for a rule using the engineered directional inputs directly. This is an exploratory small sample, not a matched topology comparison. The untrained full readout starts at zero, unlike the lightweight engine's engineered priors.
3. **Synthetic market:** learning reduced losses in falling and oscillating regimes but increased them in rising prices. All mean PnLs stayed negative. Prediction MSE is not profitability. Prices, depth, constant-product quotes, fees and paper gas are explicit artificial assumptions; this is neither Uniswap V3 execution nor historical backtesting. The arithmetic no-trade cash reference has zero PnL, but it was not a prespecified executed control arm. Exported/restored market policies matched **24,300 agent steps** of decisions, versions, balances and equity with zero additional training.
4. **Aqua calibration:** fitting the existing artificial risk target reduced MSE and changed actions. Repeating identical calibration gave no additional adoption. The target's defining formula achieves zero error, so this task does not demonstrate a need for a biological circuit or an improvement in trading performance.
5. **Shared input contract:** in an isolated EVM, one IBioAgent revision update invalidated old strategies in both AquaFlyApp and SharedAquaFlyApp, while another individual stayed usable. Both consumers must implement the revision check; inheritance alone provides no automatic guarantee. No public-chain transactions were sent.
6. **Runtime reuse and scheduling:** three JavaScript adapters ran through the same observe/step/snapshot loop. All wrap the same foraging engine. Two adapters sharing one Arena advanced it twice when scheduled per individual. Advancing the environment once preserved the intended tick. The current base class has no shared learn/checkpoint/restore capability.

### Implications for the specification

Record objectives, adverse effects, units, constraints and adoption rules. Keep training, selection and final evaluation separate. Bind artifacts to model, individual, task and policy version. Distinguish readout reuse from complete state restoration and cross-task skill transfer. Give a shared environment one clock owner. Preserve task-specific learners while sharing evidence and compatibility semantics.

These are proposed requirements, not a new deployed ABI. See `docs/standards/experiment-derived-requirements.md`. The Solidity input interface, JavaScript runtime superclass and proposed TypeScript interface are different boundaries.

### One-minute explanation

Across foraging, a synthetic market and Aqua, we found mixed learning effects. More food also meant more collisions. Market losses changed by regime. Aqua's artificial target was solved exactly by its defining rule. Shared interfaces had concrete benefits: one input update invalidated stale strategies in two contracts. Saved market policies reproduced 24,300 agent steps without retraining. We also found double stepping when agents shared a world. These results define our specification: explicit adoption criteria, artifact compatibility, and one environment clock. We built a reproducible research testbed; biological performance superiority remains unproven.

### Questions to expect

- **Does biological structure outperform ordinary AI?** Not established. Add matched small-AI and rewired-topology controls before making that claim.
- **What is useful despite negative outcomes?** We can reproduce task-specific gains and regressions, reuse valid artifacts, invalidate stale strategies, and identify required scheduling/evaluation semantics.
- **Does every app inherit IBioAgent?** No. The Registry implements the Solidity input interface; apps consume it. Three JavaScript input adapters inherit IBioAgentRuntime, while market and Aqua learning have separate implementations.
- **Can one task's skills transfer to another?** Not demonstrated; incompatible readouts are rejected.
- **What does a sponsor gain?** Candidate contributions are reusable integration/evaluation examples and developer feedback. Increased Router adoption, capital efficiency and real-market quality were not measured here.

## Evidence, reproducibility and limits

- `protocol.json`: metrics, seeds and comparisons written before execution. The previous thirty-seed experiment was not reused as this study's final evaluation.
- `light-foraging.json`, `full-foraging.json`, `market.json`, `aqua.json`, `interfaces.json`, `evm.json`: all results, including regressions and rejected candidates.
- `audit.json`: source hashes; 4,080 full-model decisions matched to outcomes; six immutable candidate artifacts; fitting data restricted to collection; test rewards re-summed from read-only SQLite.
- `full-state-*`: separate local training databases. These are retained locally and not included in the compact slide package.
- Scripts: `scripts/research/bioagent-study/`. Full-model runs intentionally refuse to reuse an existing state directory; use a clean isolated checkout/output directory for replay.
- `runtime-tests.txt`: existing adapter tests with fixtures; distinct from actual external API or chain validation.
- No p-values or broad confidence claims. Reused evaluation layouts and shared-world individuals are not independent samples. Full-vs-lightweight encoders, initial priors and time state differ. No biological fidelity, consciousness, production profitability, LLM cost superiority or full-profile interoperability claim.
- Harness preparation: one JavaScript parenthesis typo was corrected before the market runner executed. No seeds, metrics or acceptance thresholds changed after results were observed. No production code was modified by this study.

MaleCNS: FlyEM / HHMI Janelia, Cambridge, MRC LMB, Google; CC BY 4.0. Artificial dynamics and engineered task mappings. Aqua: Powered by Aqua — © Degensoft Ltd 2025.
'''
(DOC/'findings-ja-en.md').write_text(text)
(OUT/'findings-ja-en.md').write_text(text)
shutil.copyfile(ROOT/'docs/standards/experiment-derived-requirements.md',OUT/'spec-requirements-ja-en.md')
shutil.copyfile('/tmp/bioagent-study-runtime-tests.txt',OUT/'runtime-tests.txt')
print(json.dumps({'fullSummary':fsummary,'reportCharacters':len(text),'experiments':6},ensure_ascii=False))
