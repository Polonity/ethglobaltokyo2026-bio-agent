# BioAgentの設計方針 — まず意味を決め、interfaceはその後に決める

2026-09-26 / **方針提案・レビュー用。ABI未確定。** この文書が現在の設計議論の入口。既存コントラクトを自動的に新仕様へ適合させる文書ではない。

## 1. 提出物の中心となる思想

**BioAgentは、生物由来の構造・身体の状態・経験によって変わる個体を、別のアプリでも同じ意味で扱うための仕様を目指す。**

「AgentをNFTにする」「イベントが来たら反応する」「学習済みモデルにhashを付ける」だけでは、その違いを説明できない。何を生物から借り、何を工学的に仮定し、その個体がどんな条件で変化したかを追跡できることを重視する。

NFTとSBTは「共通仕様と派生」の構造を説明する例だった。トークン化、譲渡、譲渡禁止をBioAgentの仕様へ追加する要件ではない。先行実装はこの点を取り違えたため、採用方針の根拠にしない。

## 2. 生物らしい見た目と、生物モデルを分ける

同じ価格刺激でも、空腹・満腹、身体状態、学習経験によって観測や判断が変わる。これを見た目だけでなく、モデルへ実際に渡した入力と、その前後の状態で示す。

市場価格を感覚刺激に変える部分は人工的なadapterであり、ハエが金融を理解した証拠にはしない。MaleCNSの接続構造を利用する場合も、神経の動力学・入力写像・可塑性の仮定を別々に宣言する。connectomeと学習アルゴリズムは同じものではない。

現行Q-learningは`synthetic-demo`。将来の`connectome-derived`モデルと共通形式で比較できる対照実装として位置付ける。Q-learningを本物のコネクトームと呼ぶ必要はない。

## 3. 最小の共通概念

| 概念 | 意味 | 決して混ぜないもの |
| --- | --- | --- |
| Agent identity | 継続して追跡する個体の識別子 | モデル種別、現在の所有者、walletアドレス |
| Model descriptor | 生物的出典、実行モデル、感覚/運動mapping、身体モデル、学習可能な箇所 | 変化する個体stateや「全体的な生物妥当性」 |
| Stimulus | 出典・時刻・schemaを持つ入力 | 実行命令、実行済みの事実、reward |
| State checkpoint | 身体・神経過渡状態・policy・PRNG等、再開に必要な状態 | 外から指定したenergyや、GUIの現在位置だけ |
| Transition record | どのstateにどの入力を使い、どの行動と次stateになったか | 刺激TXの成功、単なるモデルファイル更新 |
| Learning evidence | 何を更新し、どの条件で評価し、採用/棄却したか | 行動が変わった事実、単発の利益、学習中の吹き出し |

これらの多くは一般のAIにも共通する。BioAgentの固有要件は、これらを**生物の出典・身体の内受容・回路/感覚/運動の対応・可塑性**に結び付ける意味付けである。世界初や生物Agentだけの性質とは主張しない。

## 4. 基底と派生の境界

```text
BioAgent semantic core
  ├─ model origin + dynamics + mappings
  ├─ body / neural / learned state + clocks
  ├─ stimulus → transition → learning evidence
  │
  ├─ Foraging profile
  │    food / hazard / satiety → movement / feeding / rest
  │
  └─ Market observation profile
       confirmed Swap → declared sensory encoder → response
       └─ Paper trading application
            policy action → execution guard → virtual ledger / PnL
```

- 採餌用の`Rest / Explore / Forage`を基底enumへ固定しない。
- 市場用の`Buy / Hold / Sell`も基底enumへ追加しない。
- 感覚への注目と行動選択を分ける。強い刺激は買いの命令ではない。
- 空腹や満腹の単位・更新式はbody schemaで宣言する。あらゆる生物を同じ数値尺度に押し込めない。
- 表現形式・出典・時間・状態の連続性は共有し、刺激channelや行動空間はprofileごとに定める。

## 5. IBioAgentをどうするか

**推奨: 先にsemantic profileを決め、その最小のオンチェーン境界をinterfaceにする。現在の名前を守るために実装を一般仕様と呼ばない。**

| 層 | 方針案 | 現状と扱い |
| --- | --- | --- |
| 共通記述 | 生物モデルdescriptorと状態遷移profile | 新設計。文書のみ。encodingと検証を先に詰める |
| Identity binding | Agent識別子からdescriptorを解決する薄いbinding。既存registry利用も可能にする | 現在のRegistryを初期adapterとして利用。独自identity標準を主張しない |
| On-chain stimulus transport | `IBioAgentStimulus`のschema/nonce/event方式を候補にする | 実験実装あり。独自性の中心ではない。deadline、source検証、入力認可を別途レビュー |
| Off-chain runtime | observe / advance / checkpoint / restore等の意味を共通化 | ABIではなく実行時契約。採餌のローカルcheckpointは実装済み、実装間互換は未検証 |
| 学習履歴の固定 | 必要な境界で既存のcommitment方式と接続する | ERC-8350等のadapterを検討。新しい汎用履歴registryは今は作らない |

現行`IBioAgent.sol`は採餌入力profile v0として凍結し、既存GUIの互換性を維持する。`getStatus`が返すのは入力設定であり、内部stateやruntime lifecycleではないことを明記する。将来の基底interfaceに同じ名称を再利用するか、`IBioAgentDescriptor`等へ分けるかは、責務・ABI差分を確認してから決める。

`IBioAgentRuntime`のJavaScriptクラスとSolidityの`IBioAgent`を継承関係と説明しない。契約が受理した入力を、ランタイムが検証・解釈して使う関係である。

## 6. 既存規格との関係

[先行調査](prior-art-and-bioagent.md)を参照。Agentの識別はERC-8004、私的モデル/記憶の受け渡しはERC-7857、記憶状態のcommitmentはERC-8350が関連する。これらがカバーする汎用機能をBioAgent固有の新規性とはしない。

推奨は、既存Agent識別にも付与できる**Embodied Learning Profile**をまず作ること。独立ERC化するか、既存規格の解釈profileとして提案するかは未決定。EIP提出形式を埋める前に、独立実装間で同じ記録を読めることが必要。

## 7. 提出時に見せたい最小の実験

1. 同じ入力tape・同じpolicyで、空腹/満腹だけを変え、実際の観測入力と行動を並べる。常に行動差が出ると仮定しない。
2. 同じ初期条件から、学習あり/なしで比較。学習箇所と採用/棄却を表示する。
3. 入力TX → sensory mapping → pre-state → action → post-stateを一つの記録として追う。
4. 完全checkpointから再実行し、宣言した数値精度内で比較する。
5. 生物回路を使った場合はdataset→graph→実行モデルまでの出典を示す。

この実験ができれば、GUIのかわいさが仕様の説明になる。膨らんだお腹は身体入力、停止と「？」は学習lifecycle、TXリンクは刺激の出典を表す。現在、synthetic採餌モデルで身体を変える対照実験と、学習中を含むローカルcheckpoint再開を検証済み。MaleCNS実行、異なる実装間のcheckpoint互換、学習効果の独立held-out評価は未完了。詳細は[身体モデル](../design/embodied-foraging.md)を参照。

## 8. 設計ゲートと到達点

順序は以下を推奨する。今回は1と2の提案文書までで、3以降を実装したとは扱わない。

1. 共通概念と非目標を固定: NFT/SBT機能追加は対象外。既存EIPと重なる部分は再利用。
2. 採餌/市場の2profileで必要な項目を突き合わせる。
3. descriptor・observation・checkpoint・transitionのschema、単位、hash対象bytes、PRNG、時間、エラー条件を定義し、test vectorを用意する。
4. 2つのruntimeに読み書きを実装し、身体入力と再実行を検証する。
5. その結果に基づき`IBioAgent`のABI、必要なevent、認可・永続化境界を決める。
6. NFT/SBT実験コードと依存の削除は完了。通常の刺激Registryへ置換し、採餌・市場GUIを検証済み。

共通型と用途別Viewは両GUIで使用済み。以下の提出版は局所的な実装・検証であり、profile全体の準拠認証ではない。

## 判断の基準

interfaceが増えたかではなく、第三者が「この個体は何に由来し、何を受け取り、どの状態で判断し、何を学んだか」を同じ意味で読み取れるかで判断する。

## 型策定の進捗

[2アプリの型定義 v1](application-types.md)をTypeScriptとして追加。共通概念と用途別型、変換例、型エラー検査まで実装しました。完全なJSON検証・artifact encoding・runtime移行・Solidity ABIはまだ未確定です。
