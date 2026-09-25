# 2アプリの型定義 v1 — 採餌と市場ペーパートレード

2026-09-26。**TypeScript型・例・基本値の検証・旧採餌型変換を実装済み。ランタイム移行、Solidity ABIの変更、全JSON schema検証は未実施。** 前提は[設計方針](bioagent-design-direction.md)と[Embodied Learning Profile](embodied-learning-profile.md)。NFT/SBTを基底・派生の要件にしない。

## 型の配置

| ファイル | 責務 |
| --- | --- |
| `packages/shared/types/primitives.ts` | JSONで精度を保つ整数文字列、hash/address、範囲付き値のconstructor |
| `packages/shared/types/core.ts` | 個体参照、モデル由来、出典付き刺激、身体・時刻、状態表示、checkpoint、学習記録、汎用runtime契約 |
| `packages/shared/types/foraging.ts` | 採餌の入力・観測・行動・結果・表示・遷移 |
| `packages/shared/types/market.ts` | 市場の入力・観測・判断・紙注文・紙約定・評価・遷移 |
| `packages/shared/types/legacy.ts` | 既存採餌Status/action/energyから新型への明示的変換 |
| `packages/shared/examples/two-apps.ts` | 共通形式を使う2アプリのsyntheticな型チェック用例 |
| `packages/shared/examples/type-boundaries.ts` | 混同を型エラーとして検出する検査 |

`npm run test:types`でstrict TypeScriptチェックとconstructor/変換のNodeテストを実行。Node 22.14以降のtype strippingを使用する。例のhash・URI・個体・身体状態はすべてfixtureであり、実測や実artifactの証拠ではない。

## 1. 共通型

### 識別と記述

- `AgentRef`: chainId/registry/agentIdのEVM参照、またはsessionId/agentIdのローカル参照。ローカル個体に架空のオンチェーンIDを付けない。
- `ArtifactRef`: algorithmを明記したdigestとURI。hash対象はそのartifactの正確なbytes。JSONのキー順等を正規化したhashを暗黙に想定しない。
- `ModelDescriptor`: dynamics、感覚/運動mapping、身体モデル、可塑性、根拠を伴うvalidation claim。
- `BiologicalOrigin`: synthetic-demo / bio-inspired / connectome-derived。最後の型にはdataset・抽出・graphの出典が必須。validatorが内容の真実性を証明するわけではない。

### 刺激と時間

`InputEnvelope<Payload, Source, Schema>`はinputId、source、sourceTimeMs、receivedAtMs、payloadを持つ。チェーン入力はchain/emitter/blockHash/transactionHash/logIndexまで指定し、API入力はendpoint/requestId/response artifactを指定する。fixtureをlive sourceと同じラベルで扱わない。

`Clock`はtick、simulationTimeMs、dtMs、wallTimeMs、pausePolicyを分離する。wallTimeMs/receivedAtMsはUnix ms。sourceTimeMsはchain/APIではUnix ms、simulationではそのepisodeのsimulation ms。fixtureは記録した時刻ドメインをartifactで宣言する。異なるドメインの差から鮮度を計算しない。chain秒→ms変換と欠測処理はadapterの責務。

### 身体状態

`BodyState`は以下を区別する。

| kind | フィールド | 意味 |
| --- | --- | --- |
| unmodeled | なし | 身体モデルを持たない |
| legacy-energy-only | activityEnergy | 既存採餌の実際のenergyだけ。満腹度・体重は不明 |
| embodied | model、activityEnergy、satiety、reserves、massRatio | モデルを明記した身体。最初の3値は0..1、massRatioはモデル基準に対する比 |

満腹度が未実装であることを0（空腹）で表さない。embodiedは**型のみ**で現Arenaに代謝が追加されたわけではない。massRatioの正値・有限性、身体式・単位との一致は今後の全体validatorで検証する。

### 状態・履歴

- `RuntimeView<State>`: lifecycle、inputHealth、body、アプリ固有stateとclock。GUI向けの表示snapshot。
- `Checkpoint`: body、neural、policy、optimizer、experience、PRNG、environment、inputCursorを復元できるartifact参照。genesis/continue/fork/restoreの由来を持つ。対象モデルに不要な要素も、明示的なnot-applicable内容のartifactで記録し、欠落と区別する。
- `Transition<Profile, Observation, Action, Outcome>`: before/after checkpoint、使った入力のID/出典/payload、descriptor、観測、実際のencodedObservation、判断、結果、学習記録。
- `LearningRecord`: none / candidate / adopted / rejected。採用・棄却では評価protocol、データ分割、初期条件、frozen baseline、reportを必須にする。

既存Q-learningの評価seedは選択用で、独立held-out評価ではない。現在の情報だけで新しい完全なLearningRecordを捏造しない。

## 2. 採餌アプリ

| 型 | 主な内容 |
| --- | --- |
| `ForagingConditions` | mode、energySupply、stimulusIntensity。外部入力設定 |
| `ForagingInput` | conditions / food-contact / hazard-contact + 出典 |
| `ForagingObservation` | 外部条件、食物方向と距離、危険方向、判断前の身体状態 |
| `ForagingAction` | move(direction 0..7) / rest |
| `ForagingOutcome` | 行動後座標、採餌・衝突、foraging-score報酬 |
| `ForagingState` | 座標、score、採餌回数、衝突回数 |
| `ForagingTransition` | 上記を共通transitionへ結んだ`foraging.v1` |

座標・距離はarena units、方向は現Arenaの八方向に対応する。移動速度や環境更新式はdescriptorに記述する。現在の採餌は接触時の環境効果なので、独立した「eat」という学習行動を追加したことにはしない。

### 既存の型との対応

| 既存 | 新型 | 注意 |
| --- | --- | --- |
| Status.activity = 0/1/2 | conditions.mode = rest/explore/forage | 状態ではなく入力設定 |
| Status.energy | conditions.energySupply | 実際のactivityEnergyとは別 |
| Status.stimulus | conditions.stimulusIntensity | 0..10000 |
| Status.revision | statusRevision | uint64正整数、重複処理用 |
| fly.energy | legacy-energy-only.activityEnergy | 0..1、満腹・体重を補完しない |
| action index 0..7 / 8 | move(direction) / rest | 不正値は変換時に拒否 |
| fly.state | lifecycleへの将来adapter | 学習中と入力staleを混同しない。今回の変換対象外 |
| lastDecision / 吹き出し | 表示用派生値 | 神経活動の証拠や行動の正本にしない |

## 3. 市場アプリ

| 型 | 主な内容 |
| --- | --- |
| `MarketInput` | 確認済みchain-log由来のSwap、API quote、明示的fixtureの判別union |
| `SwapPrice` | pool/token0/token1、sqrtPriceX96、liquidity、tick、token1-per-token0方向 |
| `ExecutableQuote` | 特定数量のamountIn/amountOut、有効期限、根拠。将来約定の保証ではない |
| `MarketRef` | pool、または固定数量のquote-pair。複数pool routeを単一poolと偽らない |
| `MarketObservation` | 価格、baselineまたは変化bps、attention、身体、現金・保有 |
| `MarketAction` | hold / skip / buy / sell。売買ではspend量と受取token |
| `PaperOrder` | decision tick/time、最早約定時刻、売買判断 |
| `PaperExecution` | no-order / pending / rejected / filled |
| `PortfolioValuation` | unavailable、またはequity・net/realized/unrealized PnL付きvalued |
| `MarketTransition` | 上記を共通transitionへ結んだ`market-paper.v1` |

高いattentionでもhold/skipを選べる。pool spot priceは売買数量のquoteではない。PaperExecution.filledにはquoteと費用modelが必要で、SwapPriceだけでは埋められない。

`TokenRef`はchain/address/decimalsで識別。金額はatomsという**最小単位の十進整数文字列**。PnLだけは符号付き。トークン数量に浮動小数点を使わない。quoteのoutputに含まれるpool fee/impactと、追加のgas/slippage控除を分ける。

PaperModeはlive-data / replay / fixtureの3種類で、すべてpaper-only。紙約定型にtransactionHashはない。出典Swap TXと刺激受理TXは別のprovenanceとして表示する。評価不能はunavailableで、PnL=0とはしない。

既存`UniswapSwapBioAgent`/`UniswapPriceBioAgent`は固定mappingの観察モデルであり、新しいMarketRuntimeを実装した売買Agentではない。Swap readerにはTokenRef/PoolRefの全情報がないため、token metadataとfactory検証を追加してから新型へ変換する。

## 4. runtime契約の案

`IBioAgentRuntimeV1<Input, View, Record>`は次の責務を持つ。

```text
observe(input)     → accepted / duplicate / rejected
advance(clock)     → view + transitions
checkpoint()       → complete artifact reference
restore(reference) → restore complete state
```

これを`ForagingRuntime`、`MarketRuntime`として型パラメータで具体化する。SolidityのIBioAgentを継承する意味ではない。現JSクラスはまだこの契約に適合していないのでimplements宣言は加えていない。

## 5. 型だけで保証できないもの

TypeScriptは外部JSONを検証しない。constructorは基本値だけ検証し、castによる迂回も防がない。今後のruntime validatorで以下を検証する。

- chainId > 0、EVM数値のbit幅、token decimals整数範囲、poolとtokenのchain一致、異なるtoken、canonical factory。
- schemaとsourceの真正性、finality/reorg、重複、source順序・鮮度・同一入力数量。
- 同一agent/episode/branchとbefore→afterの連続性、実際に消費したencodedObservation。
- quoteの数量/方向と注文の一致、約定時刻 >= earliestFillAt、quote取得が判断より前へ遡らないこと、有効期限、非ゼロ注文と残高制限。
- 現金・費用・PnLの評価通貨の一致、LP費用の二重計上防止、未評価保有の扱い。
- 学習/選択/held-outの分離、checkpointの完全性、artifact availabilityとdigest照合。

型付きのJSON例は**ワイヤ形式の確定や署名対象bytesの標準化ではない**。既存Solidity stimulusのABI payloadと、新しいTypeScript schemaラベルは自動的には対応しない。対応encoding、domain separationとtest vectorを決めてからオンチェーンABIを更新する。

## 6. 実装順序

1. この型を使う全体JSON validatorとartifact encodingを作る。
2. 採餌のcheckpoint・PRNG状態・身体入力を追加し、同一tape replayを検証する。
3. 市場の出典収集とmetadata解決を新型へ適合させ、紙約定・台帳を実装する。
4. 2アプリの記録を同じビューアで読めるか確認し、必要最小限のSolidity型/eventを決める。
