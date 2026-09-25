# Agentの種類・価格入力・smart wallet

2026-09-25時点。既存の採餌と価格観察の2種類を土台として追加しています。**既存GUIはそのまま**で、新Runtimeの画面選択、実API接続の設定、wallet作成・署名はまだ接続していません。

## 1. IBioAgentの境界

`IBioAgent.sol` はオンチェーンのStatus読取・更新・イベントを定義するinterfaceです。Registryが実装しており、行動や学習をEVMで実行する契約ではありません。

オフチェーン側には別名の `IBioAgentRuntime` を設け、`ForagingBioAgent` と `UniswapPriceBioAgent` が継承します。同名のSolidity interfaceとJavaScriptクラスを混同しないための分離です。今回、個体ごとのSolidityコントラクトを2種類デプロイしたわけではありません。

```text
IBioAgent.sol ← IBioAgentRegistry ← BioAgentRegistry
                                      + IBioAgentWallet

IBioAgentRuntime
  ├─ ForagingBioAgent       ← 検証済みStatusUpdatedログ
  └─ UniswapPriceBioAgent   ← 出典付きの固定数量quote
         ↓
      既存Arena（判定・移動・経験・Q学習）
```

Runtimeは `observe(input)`、`step(dt)`、`snapshot()` を提供します。identityにはid、owner、任意のsmartWallet参照（chainId/address/verification）を持ちます。`ForagingBioAgent` へ渡すログはChainSession等でchain・Registry・順序を検証済みとする契約です。既存GUIのChainSessionをこの新しいクラスへ置き換えてはいません。

## 2. 価格観察Agent

実装は `packages/bio_agent/runtime/agents.js`、モデル種別は `uniswap-price-observer-v1`。

| 項目 | 仕様 |
| --- | --- |
| 入力 | 固定chainId、tokenIn、tokenOut、amountInに対するamountOut |
| 初回 | 基準値として保存。Explore、刺激0 |
| amountOut増加 | Forage、変化率の絶対値を刺激へ |
| amountOut減少 | Rest、変化率の絶対値を刺激へ |
| 変化なし | Explore、刺激0 |
| energy | 仮の定数5000 |
| 鮮度 | 既定30秒。古い入力・未来時刻・順序逆転を拒否 |
| 入力なし・期限切れ | stepはwaiting / staleを返し、競技を進めない |
| 長い欠測後・source変更 | 過去との変化率を出さず基準値を取り直す |

変化率は `(newAmountOut - previousAmountOut) * 10000 / previousAmountOut` の整数bpsです。BigIntで計算し、刺激は絶対値を0..10000に制限します。同一ペア・同一入力数量に限って比較するため、比率計算ではdecimalsが相殺されます。amountOutをUSD価格として表示する実装ではありません。固定数量のquoteには手数料や流動性の影響も含まれます。

この変換は初期のデモ規則です。変化を検出する規則自体が学習済みという意味ではありません。変換後の入力を既存のArenaへ渡し、そこで行動・経験・Q学習を実行します。増加を買い、減少を売りと解釈せず、実行範囲は `observe-only` です。

## 3. Uniswap入力の経路

[Uniswap quote API](https://developers.uniswap.org/docs/api-reference/aggregator_quote) は入力数量・通貨・チェーン・swapperを指定して見積もりを取得するHTTP APIです。APIキーが必要です。別案として、[v3 QuoterをRPCで読む方法](https://developers.uniswap.org/docs/sdks/v3/guides/swapping/quoting)もあります。quote取得そのものはswapの実行ではありません。

今回のサーバー用アダプター `services/backend/adapters/uniswap-quote.mjs` は固定の公式 `/v1/quote` のみを呼びます。対象は同一チェーン、EXACT_INPUT、V3 / CLASSIC。異なるroute・token・数量、失敗応答は拒否します。実APIの応答互換性は本番キー・対象ペアでまだ確認していません。

```js
import { fetchUniswapObservation } from './services/backend/adapters/uniswap-quote.mjs';
// Node.jsサーバー側のみ。値は対象ネットワークに合わせて設定する。
const observation = await fetchUniswapObservation({
  apiKey: process.env.UNISWAP_API_KEY,
  market: { chainId, tokenIn, tokenOut, amountIn },
  swapper,
});
priceAgent.observe(observation);
priceAgent.step();
```

APIキーはサーバー側に保持し、ブラウザーや観測結果へ含めません。swapperは見積もり条件に用いるアドレスで、ここで署名や許可を与えるものではありません。アダプターはAPIの返すPermitやswap用データを実行しません。

## 4. 出典を混同しない

| source | 記録・表示するもの |
| --- | --- |
| chain-log | chainId、Registry、Tx hash、block、log、revision |
| uniswap-api | chainId、ペア、数量、requestId、受信時刻、query、rawResponseHash |
| fixture | 固定テスト入力。実市場・実Txとして表示しない |

API観測のobservedAtはサーバーの受信時刻で、ブロックの時刻ではありません。rawResponseHashは受信した文字列のSHA-256で、Uniswapの署名やオンチェーン証明ではありません。`uniswap-api` に架空のTx hashを付けず、既存GUIの「採掘済み」と同じ表示にしません。

API観測を後からチェーンへアンカーする場合、観測記録と記録Txの出典を別々に保持する設計が必要です。今回は自動でStatusを書き戻しません。

## 5. ownerとsmart wallet

従来の登録定義は `owner / modelHash / metadataURI` のみで、smart walletはありませんでした。今回 `IBioAgentWallet` を追加し、Registryへ次の操作を加えています。

```solidity
getAgentWallet(uint256 agentId) returns (address)
setAgentWallet(uint256 agentId, address smartWallet)
// event BioAgentWalletUpdated(agentId, previousWallet, smartWallet)
```

- ownerは登録を管理し、Statusを書き込む主体。
- smartWalletはAgent用の同一チェーン上のアカウント参照。
- 初期値と解除値はゼロアドレス。設定・変更・解除はownerのみ。
- wallet変更はStatus revisionを上げない。専用イベントで追跡する。
- walletを設定してもStatus更新権限を委任しない。
- アドレスはownerの申告情報。コントラクトコード、wallet方式、所有・操作権限は検証しない。未配置のアドレスも指定可能。

既存の `registerAgent`、`getAgent` の返却tuple、StatusUpdatedイベントは変更していません。旧GUIとのABI互換性を保つため、walletは独立getterにしています。稼働中の旧Registryには新関数は存在しません。新しい配置で利用でき、今回稼働中のAnvilは再配置していません。

**walletを実際に作成した状態ではありません。** 次段階で方式・factory・owner/署名者・回復方法を決めて配置し、宣言アドレスと配置receiptを結びます。資金を使う機能を追加する場合は、対象chain・token・呼出し先・上限・有効期限と失効方法を別の実行ポリシーに持たせます。owner、wallet、gasを支払う主体を同一視しません。

## 6. 動かし方と検証範囲

```sh
npm run demo:agents   # 固定データだけ。API・RPC・wallet操作なし
npm run test:agents  # Runtime・見積もりアダプターの固定応答テスト
make contracts-test # wallet設定権限と既存契約の回帰テスト
```

デモのtokenアドレス・Txはfixtureです。実トランザクションの証拠として使いません。

検証済み: 既存採餌アダプター、価格増減の刺激変換、Runtimeへの適用、重複・鮮度・順序・ペア・数量の検証、quote専用HTTPリクエスト、wallet権限・変更イベント・Statusとの分離。Foundry全19テスト、追加Runtime全4テスト。

未検証・未接続: 実Uniswap API、対象tokenとdecimalsの取得、定期収集・永続化、価格AgentのGUI、wallet配置・署名・残高表示。実接続には対象chain・token pair・amountIn・swapper・APIキーを設定します。
