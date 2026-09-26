# BioAgent — 目的と段階別の説明 / Purpose and explanation

現行の共通Fly Labに対応。[日英スライド・Q&A](presenter-kit/README.md)の説明方針です。

## 1. 何をしたいか / What we want to achieve

**生物由来の判断モデルを、オンチェーン入力で動かし、経験から適応させ、その効果と資源消費を比較できるフレームワークをつくります。**

使う人はAgentの開発者・研究者です。目標は、数値から少数の行動を繰り返し選ぶ仕事を小さい計算予算で続けられるかを調べること。その際に、入力の検証、モデルの出典、学習結果の追跡を用途ごとに作り直す負担を減らすことも目指します。

**Build a framework for running biologically derived decision models on onchain inputs, adapting from experience, and comparing effectiveness and resource use.** Agent developers and researchers can study repeated numeric decisions under limited compute budgets, reusing input validation, model provenance and learning records. Resource and developer-time savings are intended benefits, not measured results.

## 2. 最初に、環境をTXで定義する / Define the environment in a TX

初期TXにフィールドの寸法・seed・危険エリアを記録します。個体への正の刺激TXが確定すると、餌を1個追加します。登録・刺激0・失敗・重複では追加しません。食べた餌は消え、自動補充しません。

**ハエへの外部入力はすべてオンチェーンデータです。** 動き・身体・消費・学習は、その入力から計算する内部状態です。初期環境が確認できない場合は動作を始めません。

The initial TX records dimensions, seed and hazards. Each confirmed positive stimulus adds one food; registration, zero stimulus, failures and duplicates do not. Consumed food disappears. All external inputs are onchain; movement, body, consumption and learning are offchain internal state. The playground waits for a verified environment.

## 3. 次に、回路を通して行動する / Turn inputs into actions

確認した環境と内部状態を人工的な感覚入力へ変換し、実測MaleCNSの7神経・19接続を使った計算から移動・休息を選びます。接続の出典は生物データですが、動力学・感覚変換・身体・行動の対応づけは人工設計です。

The public browser model uses seven measured MaleCNS neurons and 19 connections to help choose movement or rest. Dynamics, input encoding, body state and action mapping are engineered. This does not measure a fly’s feelings or reproduce a validated whole brain.

## 4. 経験から学び、候補を比較する / Learn and compare a candidate

共通Fly Labでは「学習室へ」で、確認済み環境のコピーと行動経験からQ値を更新します。新旧方策を再生比較し、スコアが改善した候補だけ採用します。神経接続は固定です。学習用コピーが表示中の餌を増やすことはありません。

この比較は同じ環境での再生です。未知環境での効果を示すには別の試験が必要です。学習後の体力回復も、判断能力の改善とは分けます。

“Start learning” updates Q-values from experience and a copy of the confirmed world, adopting only a higher-scoring candidate. Neural wiring stays fixed. Training copies do not create visible food. Same-world replay is not an independent generalization test; recovery after training is not evidence of a better policy.

## 5. 何が確認できたかを示す / State the evidence

- **現在の公開版：** 初期環境TX、危険エリア、定期刺激TXから画面への反映。実確認では餌が3→4へ増えた。[検証記録](judge-demo-review.md)
- **全神経動画：** Anvil上で4個体、Aqua 1件・V3 11件の決済と学習更新。環境TX対応前の市場記録。[収録証拠](presenter-kit/capture-evidence.json)
- **独立研究：** 合成採餌課題の報酬18.79→56.12、直接入力対照56.08。生物優位は未確認で、体力の悪化も観測。[比較実験](../research/bioagent-adaptation/README.md)

Public integration evidence, full-market recording and independent research answer different questions. The public app shares its UI and Q-learning between Anvil and Sepolia. The full Python market uses separate online readout updates, and the independent JS framework has its own learning/evaluation/adoption API. Cross-application skill transfer is not demonstrated.

## 6. 誰にどんな価値を出せるか / Who could benefit

直接の対象はAgent運用者です。同じ判断品質で計算・学習コストを抑えられれば、常時運用や導入の負担を減らせる可能性があります。プロトコル側には、そうしたAgentを増やすための統合例と評価手順を提供できます。

Uniswapでは同一ペア・同額見積もりで「実行／見送り」、Aquaでは共有保有資金から「提示／撤回」を比較することが次の課題です。現行市場はV3 coreと独自FlyV3Routerであり、Universal Router・Trading APIを使った利用増の効果は示していません。電力削減、利用者増加、取引量・資本効率の改善も未測定です。

Potential savings accrue directly to agent operators. Protocol teams could benefit from reusable integrations and evaluation methods that encourage adoption. Next tests target execute/hold decisions for identical Uniswap quotes and offer/withdraw decisions for Aqua. The current market uses V3 core and custom FlyV3Router, not Universal Router or Trading API. Energy savings, adoption, volume and capital efficiency remain unmeasured.

## 共通仕様をどう位置付けるか / Why a shared profile

Solidityの`IBioAgent`は個体・Statusの共通API、`IBioAgentStimulus`はスキーマ付き入力を扱います。仕様案では、実測接続の出典、人工的な変換、学習で変わる部分を区別し、アプリが同じ意味で読めるようにします。識別・通信・ウォレットそのものを生物固有の発明とはしません。

The profile describes measured origin, engineered mappings and learned components with consistent meaning. Current contracts do not implement ERC-8004; this is a research profile, not an approved ERC. The framework’s value must ultimately be tested through interoperability and reduced integration effort.
