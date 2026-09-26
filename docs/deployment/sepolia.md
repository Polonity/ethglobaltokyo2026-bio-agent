# Sepolia — 公開デモと検証

2026-09-26に配置・公開・実ブラウザー試験を完了しました。

- **[審査員向けデモ（日本語）](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja)** / **[English demo](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en)**
- Ethereum Sepolia / chain ID **11155111** / Agent ID **1**
- Registry: [`0x4c063705afD2D42627693E1C358F30DB9e5Ba0Aa`](https://sepolia.etherscan.io/address/0x4c063705afD2D42627693E1C358F30DB9e5Ba0Aa)
- [公開配置記録](../../contracts/deployments/sepolia.json) / [実TX・ブラウザー検証結果](../submission/sepolia-evidence.json)
- [Sourcifyでcreation/runtimeとも完全一致](https://repo.sourcify.dev/11155111/0x4c063705afD2D42627693E1C358F30DB9e5Ba0Aa)。外部Explorerでの検証状態とは区別します。

## 1分の確認手順

1. ページを開く。ウォレット不要で、Sepoliaのブロック・revision・入力と、動く個体を確認できます。
2. 「学習して比較する」で候補を訓練し、別の4シナリオで評価。条件を満たせば採用し、このブラウザーへ保存します。再読込でポリシーを復元します。
3. 「判断の証跡を保存」で、観測ブロック、チェーン入力、モデルhash、policy hash、学習比較をJSONに保存できます。
4. 入力を変える場合は、Ethereum Sepoliaのウォレットを接続し、「自分のBioAgentを登録」。所有者だけが活動・刺激・供給条件を変更できます。登録と入力更新にSepolia ETHが必要です。

デフォルトの個体1はプロジェクトの検証ウォレットが所有します。第三者は閲覧・ローカル学習ができ、自分で登録した個体への書き込みができます。入力を編集しただけでは挙動は変わらず、receiptと更新後のチェーン状態を取得してから反映します。EIP-1193の注入型ウォレットを想定し、Chromeで試験しています。

## 公開デモと提出動画

| 項目 | 公開デモ | サブミッション動画 |
| --- | --- | --- |
| チェーン | Ethereum Sepolia | Anvil / 公式Aquaのローカルfork |
| モデル | 実測から選択した7神経・19接続 | 全分類付き166,700神経の既存ランタイム |
| 計算 | ブラウザー内のJavaScript | ローカルPythonの全神経計算 |
| 目的 | 審査員がその場で操作できる入口 | フルニューロンとアプリ統合の実演 |
| 今回のオンチェーン範囲 | Registryへの登録・入力更新 | 既存の動画・アプリごとの実TX |

7神経版は全脳を等価に圧縮したモデルではなく、実測部分グラフです。接続は固定し、学習するのは3つの行動readout係数です。身体・刺激変換・動力学は人工設計です。公開デモはAqua / Uniswapへの注文や取引を実行しません。提出動画はユーザー指定どおり **Anvil＋フルニューロン版** を使用し、この公開版で置き換えません。[1inchの提出経路](../submission/1inch-aqua.md)。

## 構成と信頼の境界

```text
Wallet ── sign register / updateStatus ──> Ethereum Sepolia Registry
                                              │
Browser <── same-block RPC reads ── read-only Cloudflare Worker
   │
EvmBioAgentSource → ChainDecisionRunner → LearningBioAgent → ForagingBackend
   │                    │
   └ provenance         └ exact graph-byte hash check
                              ↓
                     canvas / local policy / JSON evidence
```

- Worker `ethglobaltokyo-bio-agent-sepolia` は既存Fly Labと独立。`wrangler.sepolia.jsonc`、`services/sepolia/worker.js`、`apps/sepolia-lab/`を使用します。
- Workerは鍵を持ちません。署名・送信RPCを拒否し、設定したRegistryの`getAgent` / `getStatus`と必要なブロック・receipt取得だけを中継します。
- 約12秒おきに同一ブロックの状態を読み、owner・model・chain・revision・ブロックの一貫性を検査。追加確認深度は0であり、finalityではありません。RPCへの信頼を前提にした観測です。
- 観測ブロックが120秒より古くなると判断を停止。rollbackや競合した入力は拒否し、「読込」で明示的に再同期します。自動的に実行履歴を巻き戻す構成ではありません。
- `modelHash`は正確な`male-cns-slice.json`のSHA-256。`model.json`は出典と実行ファイルのhash一覧を示すカタログであり、そのカタログ自体のhashを登録したわけではありません。全runtimeコードをオンチェーンで実行・証明してはいません。
- 学習済みpolicyはchain / Registry / agent IDで分離してlocalStorageへ保存。チェーンには保存せず、別ブラウザーとは共有しません。身体・座標・得点は再読込で初期化します。

## 再現コマンド

Node.js 22、Chrome、Foundryを使用します。リポジトリルートで実行します。

```sh
npm ci
forge build --root contracts --offline
npm run sepolia:build
npm run sepolia:dev         # http://127.0.0.1:8836/、入力は実Sepolia
npm run test:sepolia        # RPCの制限と再送ジャーナルを確認
npm run test:sepolia:browser # 専用Anvilを自動起動し、終了時に片付ける
npm run test:sepolia:public  # 公開ページの閲覧・学習・復元。オンチェーン書込なし
```

公開ページから本物のSepolia入力を更新する試験は、既存ローカルkeystoreを使用します。専用のNode署名器をEIP-1193ブリッジで接続し、対象Registryへの入力更新だけを許可します。これはMetaMask拡張UIの手動操作試験ではありません。

```sh
npm run test:sepolia:public -- --broadcast
```

成果物は`artifacts/sepolia/public-browser/`の`result.json`、`decision.json`、日英・モバイル画像。公開提出用の要約を[sepolia-evidence.json](../submission/sepolia-evidence.json)に残しています。初回実試験でrevision 2→3→4を確認し、休息→採餌へ戻しました。

## 同じテスト資金を再利用する

検証用ガスウォレットは **`0x0d01a92bae0E01754f7102466936397F609D67C3`**。ユーザーから0.02 Sepolia ETHを受領。今回5件の実TXで約0.00121422 ETHを使用し、確認時点の残高は約0.01878578 ETHです。将来のスマートウォレット配置・操作を含むSepolia試験でも、同じ資金と署名器を使います。このアドレス自体は現在EOAであり、スマートウォレットを配置したという意味ではありません。

`.local/sepolia/keystore.json`と`passphrase`はそれぞれmode 600、親ディレクトリは700で保持し、Git・静的配信・ログには含めません。パスフレーズも同じマシンにあるため、そのマシンにアクセスできる利用者から分離された保管ではありません。別マシンで続ける際は既存の署名環境を安全に引き継ぎ、別ウォレットを黙って生成しません。

```sh
npm run sepolia:prepare     # 着金と最新ガス見積り。送信なし
npm run sepolia:deploy      # 初回のみ配置・登録・初期化。再実行は同じ署名journalを再利用
npm run sepolia:publish     # Sepolia専用Workerだけを公開
```

`SEPOLIA_RPC_URL`未設定時はPublicNodeのEthereum Sepoliaを使用。署名時にchain IDを再検査します。署名済みTXを送信前にローカルjournalへ保存し、中断後は同じhashを確認・再送します。個別2,000,000 gas / 10 gwei、journal全体の最大見積り合計0.01 ETHが上限。継続実験で上限に達した場合は、残高と実使用量を確認して予算を更新します。journalを削除して上限を回避しないでください。

Cloudflareの認証はルート`.env`の`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`だけを配布ツールへ渡します。Sepolia鍵をWorkerへ渡しません。

## For judges / English

Open the [English demo](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en). No wallet is needed to watch a measured seven-neuron connectome slice respond to live Ethereum Sepolia Registry state. Train and compare a readout locally, reload to restore the adopted policy, and download decision provenance. To change on-chain inputs, connect an injected Sepolia wallet, register your own agent, and submit its status.

The public demo uses **Sepolia + a seven-neuron subgraph**. The submission video uses **Anvil + the full 166,700-neuron runtime**. They demonstrate different execution environments. The public page does not execute Aqua or Uniswap transactions. Topology is measured; dynamics, body and action mappings are engineered. Learning adjusts only the readout. No biological fidelity, LLM cost advantage, or trading-profit claim is established.

The live browser check confirmed two real input transactions, rest/forage behavior, policy adoption and restoration, mobile layout, and stale-input pause. [Transaction and browser evidence](../submission/sepolia-evidence.json). The wallet test used an EIP-1193 bridge with a local Node signer; it was not a manual MetaMask extension test. Contract creation and runtime bytecode both match the published source exactly in Sourcify.
