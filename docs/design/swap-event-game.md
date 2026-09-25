# Swapイベントで反応するハエ — 実装計画と検証状況

2026-09-26。第2ゲームの最初の縦通し実装。**市場ゲームのGUI、売買方策、PnL、自己学習は未実装**。既存の採餌GUIとそのAnvil配置は維持しています。

## 今回決めた構成

```text
Uniswap V3 pool / Swap event
  → configured RPC + successful receipt + canonical block + confirmations
  → fixed-pool sqrtPriceX96 movement
  → schema-tagged stimulus, submitted by current Agent owner
  → BioAgentStimulusAccepted
  → runtime verifies payload against source receipt
  → three independent BioAgent runtimes
  → next: GUI reactions / paper broker / leaderboard
```

チェーン上の入力受理と、オフチェーンの反応を分離します。市場アダプターはERC仕様の必須部分ではありません。刺激仕様を共通化することで、採餌、価格、空腹などを別のschemaとして追加できます。身体状態の満腹度・体格・活動エネルギーはランタイム側で計算し、必要な記録だけをオンチェーンに送る方針です（身体状態は未実装）。

## 実装済みの範囲

- `readSwapReceipt`: Uniswap V3形式のSwap ABI、指定chain/pool、成功レシート、確認数、canonical block hashを検証して入力イベントを生成。
- `UniswapSwapBioAgent`: 同一poolの価格変化率を整数で計算。初回/長い欠測後はbaseline、上昇はcurious、下落はcautious。採餌Arenaへの入力を変える**固定マッピングの観察モデル**で、売買を学習するモデルではない。
- 重複は無視、順序逆転/同じ高さの異なるblockHashは拒否、古い入力ならtickを停止。
- 通常のRegistry派生による汎用入力契約。詳細は[ERC草案](../standards/bio-agent-draft.md)。
- 独立Anvilで3体のAgentを登録し、3回の価格イベント→9回の入力TX→3匹の反応を検証するスクリプト。

プール価格は `token1_base_units / token0_base_units = sqrtPriceX96² / 2¹⁹²`。同一poolの変化率ではdecimal倍率が相殺されます。USD価格、希望数量の約定価格、利益確率とは異なります。表示用価格にはtoken0/token1とdecimalsの解決が必要です。基準価格方向を反転すると上昇/下落の意味も変わるため、GUIは必ずペア方向を明示します。

## Market stimulus v1（実験schema）

- schema: `keccak256(UTF8("bioagent.uniswap-v3-swap.v1"))`
- payload: Solidity `abi.encode(uint256 sourceChainId, address pool, bytes32 sourceBlockHash, bytes32 sourceTransactionHash, uint256 logIndex, uint160 sqrtPriceX96)`。
- payloadHash: `keccak256(payload)`、mailbox event nonceはAgentごとの入力順序。
- runtimeは同じsourceChainIdのRPCを使い、receipt内の指定indexが指定poolのV3 Swapで、blockHash/priceが一致することを確認してから採用する。
- blockNumber/transactionIndex/blockTimestampは元receipt/blockから取得する。重複キーはchain/pool/blockHash/txHash/logIndex。
- デフォルト鮮度60秒はランタイムの初期値で、ERCの規範要件ではない。確認数もチェーン別の運用設定。
- トランザクションを受理した事実だけではUniswap入力の真実性を証明しない。ランタイムの追検証が必要。

## ローカルの再現手順

```bash
npm ci
forge test --root contracts
npm run test:swaps
npm run demo:swaps
```

forge/anvilがPATHにない場合は環境変数`FORGE`と`ANVIL`に実行ファイルの絶対パスを渡します。スクリプトは127.0.0.1:18545に専用Anvilを起動して終了時に停止します。既存プロセスがそのポートを使っていれば中止します。GUI用8545は使用しません。

出力: `artifacts/swap-demo/evidence.json`。Registryアドレス、刺激schema、元イベントTX、Agentごとの入力TX・入力値・反応・位置を保存します。2026-09-26実行結果はbaseline→curious（+2099 bps）→cautious（-1735 bps）、全3匹で検証済み。sqrt固定小数点と整数除算による丸めを含みます。

**このローカルデモはSwapEventFixtureの合成イベントです。実際のUniswapプール・流動性・スワップを使っていません。** TXとレシート自体はAnvil上の実トランザクションですが、Uniswap接続実績として説明しません。全個体の入力変換は同じで、異なる戦略の優劣を示すものでもありません。

## 実プール接続までの残作業

1. Sepoliaのcanonical V3 factoryから対象pair/feeのpoolを解決し、factory/token0/token1/decimalsを検証。現アダプターは運用者指定allowlistのみでfactory照合は未実装。
2. ブロックcursorを永続化したログ監視、再接続、checkpointからのreorg replayを実装。現在は単一TXのreaderであり、常駐監視ではない。長時間実行時の重複キャッシュも永続化・整理する。
3. 出典検証→署名→mailbox→runtimeの常駐サービスを構築。現在のdemo scriptが縦通しの参照で、GUIサービスには未接続。
4. 第2ゲーム画面にwaiting/confirming/fresh/stale/replaying、元Swap TXと入力TXを別々に表示。SepoliaはEtherscanへ、Anvilはローカル詳細へ。紙取引に架空のTX hashを付けない。
5. PaperBroker・仮想残高・費用込みPnL・学習/評価分離を[ペーパートレード設計](paper-trading-arena.md)どおり実装。
6. 承認済みの段階でSepoliaへ配置・テスト用poolを準備。今回、Sepolia配置や実資金売買は行わない。

## 審査員へ説明する軸（改訂）

[NFT/SBT追加は派生構造の例を機能要件と取り違えた先行実装](../standards/bioagent-design-direction.md)であり、提出の主軸にしません。NFT/SBT実験契約を撤去し、このデモも通常のBioAgentStimulusRegistryへ移行しました。

BioAgentの差分候補は生物モデルの出典、身体を含む個体状態、入力から反応・学習への過程の記述です。市場観測はその用途別profileとして位置付けます。[提出説明案](../submission/bioagent-thesis.md)で実装済みと構想を区別します。

## 一次資料

- [Uniswap V3 Swap event source](https://github.com/Uniswap/v3-core/blob/main/contracts/interfaces/pool/IUniswapV3PoolEvents.sol)
- [Uniswap deployments](https://developers.uniswap.org/deployments)
- [ERC-721](https://eips.ethereum.org/EIPS/eip-721)、[ERC-5192](https://eips.ethereum.org/EIPS/eip-5192)、[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)
