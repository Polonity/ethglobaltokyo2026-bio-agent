# Uniswap Developer Feedback Form — 日英記入案 / Bilingual draft

2026-09-26 · 未送信 / Not submitted

添付いただいたHTMLは、Uniswapの開発体験フィードバック用フォームです。提案の説明に使える文章を以下に用意しました。将来の構想と完成済みの機能を区別しています。実際の統合時間、利用したサポート、評価、個人情報、同意事項は記入していません。

The supplied HTML is the Uniswap developer-experience feedback form. The text below separates the working prototype from the proposed next step. Personal information, integration time, support used, ratings and consent are left to the submitter.

## 作ったもの / What did you build?

### 日本語

BioAgentは、生物由来の神経結合を使うAgentの研究プロトタイプです。公式Uniswap V3コントラクトを使うローカルpoolで2個体を動かし、観測・神経特徴・行動・結果を記録しています。Agentの売買はペーパートレードで、現在のpoolは広い単一価格帯の流動性を使います。

次は、V3の集中流動性が変わる場面で、リバランス注文を今実行するか短時間待つかを学ぶクライアントを提案します。Swap履歴、tick、有効流動性、見積もりを入力に加え、同じ注文条件で通常AIや固定ルールと約定率・総コスト・適応の速さを比較します。有用なら、UniswapのAgent向け開発基盤で再利用できる流動性シナリオとAPI／Router接続サンプルを提供したいです。新しい入力、Router接続、適応や費用の優位性は今後の検証対象です。

### English

BioAgent is a research prototype using biologically derived neural connectivity. We run two agents against a local pool using official Uniswap V3 contracts and record observations, neural features, actions and outcomes. Agent trades are paper trades; the current pool has one wide liquidity range.

Our proposed next step is a client that learns whether to execute or briefly defer rebalancing orders as V3 concentrated liquidity changes. We would add swap history, ticks, active liquidity and quotes as inputs, then compare completion, total cost and adaptation against rules and conventional AI under identical order constraints. If useful, we would contribute liquidity scenarios and an API/Router example for Uniswap’s agent developer ecosystem. The new inputs, Router integration and performance or cost advantages remain to be validated.

## 統合状況の補足 / Integration scope

**日本語：** ローカル環境で公式V3コントラクトを利用する統合は動作しています。自律AgentがRouter経由で実資産を運用する完成品ではありません。完成度や統合成功の選択肢に答える際は、この範囲を自由記述にも添えてください。

**English:** Integration with official V3 contracts works in the local environment. This is not yet a production agent executing real-asset trades through the Router. Include this scope when answering completion and integration-status questions.

**Agentの分類：** 添付フォームには「オンチェーン動作を行うBot／Agent」などの選択肢がありますが、現在のペーパー売買に完全一致する分類は見当たりません。Router経由のAgent実行が完成済みだと誤解される回答は避け、分類を主催側に確認するか、自由記述で現状を明記してください。

**Agent category:** The listed categories do not precisely describe the current paper-trading prototype. Clarify the category with the organizer or state the current scope in the free-text answer; do not imply completed onchain agent execution.

## 技術面の説明候補 / Technical context for blocker questions

以下はコードから説明できる技術上の課題です。「最大の障害」「最も難しかった点」という本人の体験として送る前に、実際の経験と合うか確認してください。

These are technical challenges supported by the implementation. Confirm they match your experience before describing them as the biggest or hardest blocker.

**日本語：** 評価時の未来情報の混入を避けるため、市場観測、判断、約定評価、最終評価の時点を分け、ブロック情報と方策の版を記録しました。次の課題は、BioAgentの判断が単純なルールより役立つかを、待機損失や推論費用を含めた同条件の比較で示すことです。

**English:** We separated observation, decision, paper-fill and valuation times, recording block provenance and policy versions to avoid future-information leakage. The next challenge is to show whether BioAgent decisions outperform simple rules under identical conditions, including waiting and inference costs.

## 希望する支援の記入案 / Suggested support request

**日本語：** V3の流動性変化に応じて実行・保留を学ぶ、自動リバランスAgentを提案しています。この利用場面と約定率・総コストの評価が、Agent統合で重視する課題に合うかを伺いたいです。また、poolの状態を使う判断からAPI／Routerによるテスト実行までの推奨接続経路について助言をいただきたいです。

**English:** We propose a rebalancing agent that learns execute/defer decisions as V3 liquidity changes. We would value feedback on whether this use case and its completion/total-cost evaluation match your agent-integration priorities, plus a recommended path from pool-state decisions to API/Router test execution.

これは今後ほしい支援の案です。過去のサポート不足を申告するものではありません。 / This is a prospective request, not a claim of inadequate past support.

## 提出時に必要なリンク / Link needed for submission

[公式プライズ要件](https://ethglobal.com/events/tokyo2026/prizes/uniswap-foundation)は、公開コード、`FEEDBACK.md`、そのリンクを含む[開発者フィードバックフォーム](https://developers.uniswap.org/hackathon-feedback)の送信、およびREADMEでの統合箇所の案内を求めています。

The official prize requirements call for public open-source code, `FEEDBACK.md`, the completed developer form including a link to that file, and README pointers to the integration.

`FEEDBACK.md`を公開した後、実在するURLを追加コメント等に記載してください。この記入案はそのファイルの代わりではなく、フォーム送信も行っていません。

After publishing `FEEDBACK.md`, include its actual URL in an appropriate free-text field. This draft does not replace that file and has not been submitted.
