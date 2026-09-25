# Bio Agent contracts — Foundry

`IBioAgent` / `IBioAgentRegistry` の型と `BioAgentRegistry` を実装しています。Status は Agent への入力で、内部状態や行動の計算はオフチェーンです。

## ツールと配置

- Foundry **v1.8.3**（forge / cast / anvil）、Solidity **0.8.30**、EVM **Cancun**。
- optimizer 有効、200 runs。設定は `foundry.toml`。
- `forge-std` v1.9.7 を Git submodule と lockfile で固定。
- `src/interfaces/`: 共通型、イベント、custom error、操作。
- `src/BioAgentRegistry.sol`: 登録と owner による Status 更新。
- `test/`: 単体・fuzz・デプロイスクリプトテスト。
- `script/`: Sepolia / ローカル用 Forge Script。
- `abi/`: コンパイルから生成した公開 ABI。Backend / Frontend で共用可能。

Foundry が未導入なら [公式インストール手順](https://getfoundry.sh/introduction/installation/) に従い、`foundryup --install v1.8.3` で版を合わせます。`forge`・`cast`・`anvil` が PATH にあることを確認してください。

## ビルドとテスト（リポジトリルート）

```sh
git submodule update --init --recursive
make contracts-fmt contracts-build contracts-test
make contracts-dry-run
make contracts-check-deployment
make contracts-abi
```

`contracts-dry-run` はローカル EVM に Sepolia の chain ID を設定したシミュレーションです。公開 Sepolia に接続せず、秘密鍵も不要です。

`contracts-check-deployment` は一時 Anvil を起動し、RPC を使う Forge Script の dry-run を検証します。CREATE 計画が1件生成されること、nonce・ブロック番号が変わらないこと、予測アドレスにコードが存在しないことを確認して Anvil を終了します。

Foundry が PATH にない場合は `make ... FORGE=/absolute/path/forge ANVIL=/absolute/path/anvil` を使用できます。CI も固定版で同じ検証を行い、ABI の差分を検出します。

## 型と制約

`Activity` は Rest=0 / Explore=1 / Forage=2。energy と stimulus は0..10000。初期 Status は Rest / 5000 / 0、revision は1。更新は現在の revision を指定し、成功時に1増加します。

登録時は `BioAgentRegistered` → `BioAgentStatusUpdated`、更新時は `BioAgentStatusUpdated` を発行します。Status イベントはその版の入力全体を含みます。

登録は誰でも可能で、登録者が owner です。owner だけが自身の Agent の Status を更新できます。modelHash は非ゼロ、metadataURI は1..512バイトです。URI の UTF-8 妥当性や参照先の内容は検証しません。定義変更、所有権移転、削除、管理者権限、アップグレード、トークン発行はありません。

デプロイだけでは Agent は登録されません。稼働 Runtime や GUI の接続も別途必要です。[型の設計](../docs/design/onchain-contracts.md) と [Sepolia 手順](../docs/deployment/sepolia.md) を参照してください。

## ローカルアプリ層を実デプロイ

`script/DeployLocalArena.s.sol` は chain ID 31337 のみに対応し、Registry と3匹を用意します。`npm run local:up` が Anvil の起動から GUI 配信まで実行します。[ローカル接続ガイド](../docs/deployment/local-anvil.md) を参照してください。

## Agent用wallet参照

`IBioAgentWallet` の `getAgentWallet` / `setAgentWallet` を追加しています。ownerが同一チェーン上のwalletアドレスを登録し、専用イベントを発行します。初期値はゼロで、設定しても操作権限は委任しません。実walletの作成・所有検証は別工程です。旧Registryへの自動アップグレードはありません。[Agent拡張設計](../docs/design/agent-types-and-wallets.md)を参照してください。

## Experimental stimulus extension

`BioAgentStimulusRegistry` extends the existing Registry with schema-tagged inputs and ERC-165 discovery. It does not tokenize agents. See [mailbox semantics](../docs/standards/bio-agent-draft.md). Existing deployment scripts still deploy the base Registry; the separate Swap fixture demo deploys the stimulus extension on its own Anvil. No Sepolia deployment has been performed.
