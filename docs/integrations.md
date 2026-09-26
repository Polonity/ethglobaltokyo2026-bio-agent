# 外部プロトコルとの連携

プロトコル別の実装、パートナー向け提案、ハッカソンの提出資料をまとめています。プロジェクト全体の概要と使い方は[README](../README.md)を参照してください。

## 1inch Aqua

生物由来の回路による判断を、自己管理ウォレットからの流動性提示・変更・撤回に接続しています。全神経版の共有市場では、2個体が同じmakerウォレットを使い、公式AquaのEthereum local forkでテストトークンを決済します。

- [共有市場の操作・実装・決済検証](apps/shared-market/README.md)
- [2個体版の起動・公式配置の検証・提出要件](submission/1inch-aqua.md)
- [軽量ブラウザー版の設計と起動](design/aqua-connectome.md)
- [資金・流動性・報酬の流れ](design/aqua-market-flow.md)

**Powered by Aqua — © Degensoft Ltd 2025.**

## Uniswap

ローカルに配置したV3 coreと独自ルーターを使用しています。共有市場では売買の判断後に通常コードが実行可能な見積もりを比較し、実際のテストトークン交換を行います。従来のMarket Meadowでは、市場価格の生成に実スワップを使い、個体の売買はペーパーとして評価します。

- [共有市場の実売買と制約](apps/shared-market/README.md)
- [Market Meadowの起動・ペーパー評価](design/local-market-app.md)
- [日英の提案資料・打ち合わせ資料](uniswap-proposal/README.md)

判断モデルの比較・検証を可能にする実装です。利用者数・取引量・利益の増加を実証したものではありません。生物由来モデルの効果と限界は[研究結果](research/bioagent-adaptation/README.md)に整理しています。

## 発表・提出資料

- [日英の提出動画・質疑応答・根拠データ](submission/presenter-kit/README.md)
- [応募用説明・要件との対応・検証索引](submission/README.md)
- [プロジェクトの成果説明スライド](presentation/README.md)

提案時点の資料と現在の実装は区別し、提出時は各資料の対象環境と検証日を確認してください。
