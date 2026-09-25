# なぜBioAgentの仕様を提案するのか

調査・方針更新: 2026-09-26。一次資料から確認した事実と、そこから導く本プロジェクトの設計判断を区別する。これは独立ERCの必要性や科学的新規性を証明する文書ではない。

## 1. 出発点: Agentが判断根拠を共有できる世界

Agentが外部のデータを読み、自律的に行動するほど、その判断が「どこから来た何の情報」に基づくかが重要になる。私たちは、この流れが広がるという見通しの下でBioAgentを設計する。将来の普及量を予測・実証した主張ではない。

オンチェーンデータの価値は、採用したチェーンと確定性の前提の下で、発生元コントラクト・記録内容・順序を他者も検証できることにある。入力の参照先と行動の記録を共通の基盤で扱えるため、Agentとの相性がよい。ethereum.orgも透明なデータとコントラクト操作をAgentの利用領域として紹介している。[Ethereum AI agents](https://ethereum.org/ai-agents/)

ただし、記録の成立と内容の意味は別である。「このpoolでSwapが記録された」と「この価格が公正で買うべき」は同じではない。外部事実の正しさはoracle等の信頼条件に依存する。[Ethereum oracle documentation](https://ethereum.org/developers/docs/oracles/)

本仕様では入力の由来、鮮度、採用した確定性条件、実行結果、生物モデルへの評価を別々に扱う。RPCの応答を読むだけで完全なtrustless検証を実装したとは言わない。Anvilはローカルの再現環境であり、分散した信頼の実証ではない。

## 2. 関連するERCと「いま取り組む」理由

| 資料 | 確認した事実 | 提案への位置付け |
| --- | --- | --- |
| [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004) | 確認時点はDraft。Agentのidentity・reputation・validationを扱う | 一般Agentの発見・信頼の共通基盤として参照。イベントを神経入力へ変換する規格ではない |
| [EF Q1 2026 allocation](https://blog.ethereum.org/2026/04/29/allocation-q1-26) | 2026-04-29公開。ERC-8004 Developers Engagementへの支援を掲載 | 単なる番号の提案に留まらず開発者支援がある、という活動の根拠。採用率や支配的標準の証明ではない |
| [ERC-8350: Agent Memory State Registry](https://eips.ethereum.org/EIPS/eip-8350) | 確認時点はDraft。認可されたAgent記憶の状態遷移をcommitする仕組み | 履歴の固定と、履歴が何を意味するかを分ける参考 |

ERC-8004は能力の正しさや非悪意性を登録だけで保証しないと明記する。本プロジェクトも「登録された＝信じてよい」とはしない。現契約はERC-8004準拠ではなく、将来のadapter候補である。ERC-8004側のERC-721依存を理由にBioAgent自身へNFT機能を追加しない。

## 3. 提案対象の定義

**提案対象のBioAgentは、生物の実測コネクトームに由来する構造を、入力から行動への計算経路で利用するAgent。**

コネクトームは神経の接続を記述する。実行するには神経活動の数理モデル、パラメータ、入力・出力の対応などを選ぶ必要がある。全脳、特定種、スパイキングモデル、オンライン学習を必須にはしない。部分回路、身体を持たない実装、固定回路と学習可能なreadoutを組み合わせた構成も、利用範囲と仮定を宣言して扱う。

生物風のキャラクターや一般的なニューラルネットワークだけでは、この意味のconnectome-derived BioAgentにはならない。プロジェクトの共通ツールはsynthetic / bio-inspiredも比較用に扱うが、分類を保持する。現行2アプリはsyntheticな仕様検証デモであり、この定義を満たす完成モデルではない。

## 4. 研究から分かること

以下の仕様要件は私たちの設計上の推論であり、論文の著者がEthereum規格を提案しているわけではない。

| 一次研究 | 結果の範囲 | 仕様に必要と考えるもの |
| --- | --- | --- |
| Shiu et al., Nature 2024, [A Drosophila computational brain model reveals sensorimotor processing](https://pmc.ncbi.nlm.nih.gov/articles/PMC11446845/) | 接続と神経伝達物質の推定を用いたモデルで、味覚・グルーミングの感覚運動変換を検討・実験検証 | dataset/抽出範囲、dynamics、神経ID、入力と出力の対応。対象行動を限定した検証記録 |
| Lappalainen et al., Nature 2024, [Connectome-constrained networks predict neural activity across the fly visual system](https://pmc.ncbi.nlm.nih.gov/articles/PMC11525180/) | 視覚系のモデルで接続制約とtask optimizationの双方が神経応答予測に寄与 | 生物から固定した部分と、最適化した部分を別々に宣言。学習後も何が制約として残るかを記録 |
| [NeuroMechFly v2, Nature Methods 2024](https://www.nature.com/articles/s41592-024-02497-y)、[著者の実装](https://github.com/NeLy-EPFL/flygym/) | 感覚・運動・身体・環境を接続するシミュレーション基盤 | 身体を扱う場合の閉ループ、感覚feedback、時間刻み、接続部分の版 |
| Brunton et al., [The digital sphinx: Can a worm brain control a fly body?](https://faculty.washington.edu/tuthill/docs/TheSphinx_2026.pdf)（著者公開原稿、2026。査読状態は本調査では確認せず） | 線虫の接続モデルと学習した運動decoderでもハエらしい歩行が得られる反例 | 見た目の一致だけで生物学的再現を判定しない。decoderの役割と回路への依存を個別に評価 |

ここから支持されるのは「生物の構造・人工的な仮定・学習結果を区別する価値」である。生物由来なら高性能・省電力・安全・金融判断が得意になる、あるいは独立ERCが必須になる、という結論は出ない。

MaleCNSを利用する場合は[公式データ](https://male-cns.janelia.org/)の実際のreleaseと抽出成果物を参照する。上記の各研究がMaleCNSを用いているとは限らず、研究結果をそのまま今回のモデルへ転用しない。

## 5. 普通のAI Agentと分ける理由、分けないもの

外からAPIの入力と行動だけを見る利用者には、両者を同じAgentとして扱える。この互換性は維持する。身体、記憶、継続学習、checkpointはロボットや一般AIにもあり、BioAgent専用規格を作る理由としては弱い。

**追加の仕様が必要になるのは「生物の何を使ったAgentなのか」を、他の実装が検査・再利用・比較する場面である。**

| 実務上の問い | BioAgentで追加する意味 |
| --- | --- |
| モデルを取り替えても「同じ回路」か | dataset版、抽出条件、元の神経/細胞型と実行要素の対応、変換履歴 |
| 刺激は回路にどう入ったか | 正規化、時間符号化、対象channel/cell、遅延、人工的なmapping |
| 回路が決めたのか、外付けルールが決めたのか | encoder→神経計算→decoder→権限制御の境界、各寄与の検証 |
| 学習で何が変わったのか | topology、weight、gain、readoutなどの固定/更新範囲と状態の系譜 |
| 生物を再現したという主張をどこまで信じられるか | 実験対象・条件・予測・比較法・証拠。取引成績と生物学的妥当性を別にする |

これらは一般のmetadataにも格納できる。新たな保存方式の発明ではなく、**フィールドの意味と検査手順を共通化するprofile**としての必要性である。生物学的評価が未実施の工学用途も許容し、その状態を正直に表示する。

## 6. 採るべき仕様構造

| 層 | 役割 |
| --- | --- |
| 一般Agentの基盤 | identity、通信、権限、評判、実行証拠。既存仕様と組み合わせる |
| BioAgentのconnectome profile | source→変換→実行回路の対応、dynamics、感覚/運動mapping、可塑性、限定的な検証主張 |
| 横断的なembodiment / learning記述 | 身体状態、時間、checkpoint、候補と採用。必要な実装が利用する |
| アプリ別profile | 採餌のfood/movement、価格観測から紙売買など、入力と行動の意味 |

これは意味上の層分けであり、4つの新コントラクトを必須にするものではない。今回のIBioAgentは採餌用の既存ABIとして維持し、この調査だけを理由に破壊的変更をしない。

ブロックチェーンは出典を共有できる刺激と、必要な実験境界の参照を担う。神経計算や全tickの状態をオンチェーンへ置く必要はない。研究モデルそのものにもブロックチェーンは必須ではなく、複数の独立した参加者が共通の入力や履歴を参照する場面で使う。

## 7. 必要性を実証する次の実験

1. 小さな実コネクトーム回路を接続し、出典・抽出・神経ID・dynamics・mappingを第三者が追跡できる成果物を作る。
2. 同じ入力tapeで、回路の除去/構造をシャッフルした対照/decoder固定を比較する。回路が行動経路に入っていることと、回路に利点があることを別々に検証する。
3. 身体を用いる実装では、身体状態と更新順序を揃えて再実行する。生物学的主張には対応する生物実験を追加する。
4. 異なる2つのproducer/consumer実装で、同じdescriptorを読み、欠けた出典や異なるmappingを検出できることを示す。今の2アプリは独立実装間の互換性証明ではない。
5. 既存metadataで足りる部分は再利用し、共有しないと相互運用が壊れる最小部分だけを標準化する。独立ERCにするかはこの結果で判断する。

進捗更新: 1はCircuit Labの小さな実測グラフで実装。2の接続除去対照と固定decoderでの比較を実施。別Python版でkernelの数値照合も行ったが、4のprofile全体の互換性試験ではない。残りは将来の検証計画と明記する。[回路検証](../design/circuit-evidence.md)。現在のデモが示すのは、出典付き入力・身体を含む観測・行動・学習を、アプリをまたいで説明する体験である。
