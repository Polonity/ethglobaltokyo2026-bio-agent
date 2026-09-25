# Sepolia デプロイ準備

状態: **コントラクト・テスト・スクリプト準備済み。未デプロイ。**

対象は Ethereum Sepolia、chain ID **11155111**。Base Sepolia など別チェーンは対象外です。[Sepolia 公式ネットワーク設定](https://github.com/eth-clients/sepolia)

## 完了している準備

- Foundry v1.8.3 / solc 0.8.30 / Cancun / optimizer 200 に固定。
- 1個の `BioAgentRegistry` を作る Forge Script。constructor 引数はなし。
- チェーンIDは11155111またはローカルの31337に制限。
- ビルド、権限・イベント・入力・競合・fuzz テスト。
- 公開ネットワークに接続しない dry-run と、一時 Anvil RPC を用いた未送信検証。
- 公開 ABI のエクスポート、GitHub Actions の検証定義。

実 Sepolia の RPC・送信者残高に対するシミュレーション、実デプロイ、Explorer 検証は未実施です。

## 設定

リポジトリルートで次を実行し、`contracts/.env` をローカル編集します。

```sh
cp contracts/.env.example contracts/.env
```

| 設定 | 用途 |
| --- | --- |
| SEPOLIA_RPC_URL | Sepolia の HTTP(S) RPC |
| DEPLOYER_ADDRESS | 将来デプロイするウォレットの公開アドレス |
| ETHERSCAN_API_KEY | Explorer 検証用。ビルド・テスト・通常の dry-run には不要 |

Foundry コマンドは `contracts/` を作業ディレクトリとして実行し、その `.env` を読み込みます。ルート `.env` にある Cloudflare 設定は別用途で、今回のコントラクト操作には使いません。どちらの `.env` も Git 管理対象外です。

## 実 Sepolia に対する dry-run（設定後）

```sh
make sepolia-dry-run
```

このコマンドには `--broadcast` がなく、送信しません。実際の nonce・ネットワーク状態に基づくシミュレーションです。送信者がデプロイ費用を賄える Sepolia ETH を持つことを確認してください。計画に出るアドレスは予測値であり、デプロイ済みアドレスではありません。

Foundry の送信は明示的な `--broadcast` によって有効になります。[Foundry デプロイ仕様](https://getfoundry.sh/forge/deploying/)

## 将来、デプロイする時だけ実行

**今回は以下を実行していません。** 書込先・費用・公開アドレスを確かめ、デプロイの指示が出た時に使用します。

秘密鍵はコマンド引数や `.env` に置かず、Foundry の暗号化 keystore に対話式で取り込みます。

```sh
cast wallet import bio-agent-sepolia --interactive
```

keystore の公開アドレスと `DEPLOYER_ADDRESS` を一致させます。その後 `contracts/` から次を実行します。

```sh
forge script script/DeployBioAgentRegistry.s.sol:DeployBioAgentRegistry \
  --rpc-url sepolia \
  --account bio-agent-sepolia \
  --broadcast
```

Explorer 検証を同時に行う場合は `ETHERSCAN_API_KEY` を設定し、上記に `--verify --verifier etherscan` を追加します。検証だけが失敗した場合、**再デプロイせず** receipt とアドレスを確認してから次を使います。

```sh
forge verify-contract <DEPLOYED_REGISTRY_ADDRESS> \
  src/BioAgentRegistry.sol:BioAgentRegistry \
  --chain sepolia --verifier etherscan --watch
```

中断・タイムアウトでも再送前に receipt と nonce を確認してください。同じ Script を新規実行すると別の Registry が作られ得ます。

## デプロイ後に残す公開記録

`contracts/broadcast/DeployBioAgentRegistry.s.sol/11155111/run-latest.json` はローカル生成物として Git から除外しています。成功 receipt を確認後、`contracts/deployments/sepolia.json` に以下の公開情報を記録してコミットします。

- chainId、Registry アドレス、デプロイ Tx hash、blockNumber / blockHash
- deployer の公開アドレス、デプロイ日時
- ソース commit、Foundry / solc 版、optimizer / EVM 設定
- runtime bytecode hash、ABI ファイルの SHA-256、Explorer URL

現時点では、このファイルを作らず未デプロイと分かる状態を保っています。Backend のログ取得開始ブロックと GUI の Registry 設定は、この成功記録から設定します。

初期確認は code の存在、`nextAgentId() == 1`、コンパイル済み runtime bytecode との一致です。Agent 登録・Status 更新は別トランザクションになるため、デプロイ後の動作確認として別途実行します。
