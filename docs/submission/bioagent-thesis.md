# BioAgent — 検証できる入力から、生物由来の行動へ

2026-09-26更新。提出用の思想と説明文。[調査根拠と標準化の判断](../standards/why-bioagent.md)を併読する。

## 一文

**BioAgentは、オンチェーンの出来事を生物のコネクトームに由来するモデルの入力へつなぎ、刺激・身体・行動・学習を共通の意味で扱うための仕様を提案する。**

## 日本語ピッチ

AI Agentが自律的に行動する世界では、判断の根拠となったデータを確かめられることが重要です。オンチェーンデータは、出来事の発生元と記録を複数の参加者が共有・検証できるため、Agentが外部の情報を受け取り、行動するための有力な基盤になります。

この方向では、Agentの識別・評判・検証を扱うERC-8004など、共通基盤の整備が進められています。私たちは、その先の問いに取り組みます。**生物の神経回路に由来するAgentを、この世界でどう扱うべきでしょうか。**

私たちがBioAgentと呼ぶのは、生物のコネクトームから得た構造を、入力から行動への計算に利用するAgentです。そこではモデル名だけでなく、どの生物データと回路を使い、外部の出来事をどう感覚へ変換し、身体状態や学習が何を変えたのかまで記述する必要があります。

そこで私たちは、一般のAgent基盤に接続できるBioAgentの拡張profileを提案します。生物的な出典、感覚・運動の対応、神経計算の仮定、身体との相互作用、学習による変化を共通化し、異なるアプリでもその個体を解釈・比較できることを目指します。

今回の採餌と市場の2つのデモでは、その使われ方を体験できます。現在の実行モデルはsyntheticな比較用実装です。実コネクトームの接続と、独立した実装間の相互運用を次の検証段階としています。

## 発表時の根拠

- ERC-8004は確認時点でDraft。identity・reputation・validationのregistryを提案する。[公式仕様](https://eips.ethereum.org/EIPS/eip-8004)
- 2026年4月29日のEthereum Foundation支援報告にはERC-8004の開発者支援が掲載されている。「注目されている」の根拠はこうした活動に置き、確定標準や普及率は主張しない。[EF報告](https://blog.ethereum.org/2026/04/29/allocation-q1-26)
- オンチェーンに書かれた外部情報の正しさにはoracle等の信頼条件が残る。「この記録がある」と「この情報が真で、この行動が正しい」は分ける。[公式解説](https://ethereum.org/developers/docs/oracles/)

## English pitch

As agents act autonomously, the origin of their inputs matters. Onchain records give participants a shared way to inspect where an event came from and what was recorded. We see this as a useful foundation for systems that turn external observations into actions.

Agent infrastructure is developing around proposals such as ERC-8004. BioAgent asks a more specific question: how should applications describe an agent whose action-generating model uses structure derived from a biological connectome?

We propose a compatible profile for tracing biological source data into an executable model: its neural dynamics, sensory and motor mappings, body coupling, and permitted learning changes. The aim is to let different applications interpret and compare the same individual without hiding the assumptions behind its behavior.

Our foraging and paper-trading demos illustrate this interaction model using synthetic agents today. Executing a traced connectome-derived model and demonstrating interoperability between independent implementations are the next research milestones.

## なぜBioAgent用の仕様が必要か

一般Agentと共通のAPIで扱えることは維持する。追加するのは、生物の構造を使ったという主張を検査するための意味である。

| 一般Agentと共有するもの | 生物由来モデルで追加する記述 |
| --- | --- |
| 識別・権限・通信 | datasetから実行回路までの出典・変換・神経IDの対応 |
| 入力・出力 | 外部データを感覚へ、神経出力を行動へ変えるmapping |
| 内部状態・モデル更新 | どの生物的制約を固定し、どの部分を学習で変更したか |
| 実行・性能の評価 | 生物を再現したという主張の対象と証拠、人工的仮定の範囲 |

身体・記憶・学習そのものは一般AIにもある。したがって独立したidentityやwallet規格を作り直す理由にはしない。研究者、モデル開発者、モデルを交換するアプリが「何を生物から借りたのか」を一致した意味で読めることが、このprofileの価値である。[研究と要件の対応](../standards/why-bioagent.md)

## 審査員への回答

**「普通のAgentと見た目は同じでは？」**

利用する側には同じAgentとして扱えます。ただ、モデルを交換・再現・評価する側には、実測の回路と人工的な変換、学習した部分を区別する情報が必要です。その情報を共通化します。

**「コネクトームを使うと優秀になる？」**

今回の根拠からその一般的結論は出ません。私たちが提案するのは優位性の認定ではなく、出典・仮定・評価を比較できる形式です。回路の除去やシャッフル対照で寄与を検証する計画です。

**「価格上昇を感じるのはハエの本当の感覚？」**

市場データから感覚への変換は工学的な設計です。売買成績は生物学的再現の証拠になりません。だからこそ、この変換と出力decoderを仕様で明示します。

**「ERC-8004で十分では？」**

共通のAgent基盤として組み合わせる方針です。BioAgentは生物由来モデルの意味を補足するprofileであり、登録機構の置換ではありません。現契約はERC-8004準拠ではありません。

**「今、MaleCNSが動いている？」**

現行はsyntheticモデルです。採餌では身体入力とcheckpoint再開、市場では実Uniswap V3のローカルSwapから紙約定・PnL・学習への経路を検証しています。MaleCNS実行とは区別します。

関連: [設計方針](../standards/bioagent-design-direction.md)、[既存ERC調査](../standards/prior-art-and-bioagent.md)、[profile案](../standards/embodied-learning-profile.md)、[提出パッケージ](README.md)。
