# 共通チェーンAPIリファレンス

読取実装は `services/worker/registry-read.js`、クライアントは `apps/frontend/chain.js`。AnvilとSepoliaで共通です。Anvilの既定URLは `http://127.0.0.1:8798`。Status送信のHTTP APIとhealthはAnvil専用で、Sepoliaの手動送信には所有者ウォレットを使います。

## 共通仕様

チェーン読取レスポンスはJSON、キャッシュは `no-store`。chainId、agentId、revision、nonce、updatedAt、blockNumber、transactionIndex、logIndexは**10進文字列**です。activity、energy、stimulusはJSON整数。ハッシュ・アドレスは `0x` 付き16進数です。

チェーン読取時に設定されたchain IDを検証します。Anvilでは加えてclient名と配置ブロックのハッシュを確認します。config取得だけではチェーン疎通を証明しません。

## 読み取り

| GET | レスポンスの主なフィールド |
| --- | --- |
| `/api/config` | mode=`anvil` / `sepolia`, chainId, registryAddress, deployBlock, modelHash, agentIds, worldInput, walletMode, networkName |
| `/api/health`（Anvil専用） | status=`ok`, runtime=`browser`, mode=`anvil`, chainConnected=true, registryAddress |
| `/api/chain/snapshot` | blockNumber, blockHash, agents, events, environment |
| `/api/chain/events?after=N&hash=H` | blockNumber, blockHash, events |
| `/api/chain/receipt?hash=H` | stage。採掘後はblockNumber, transactionHashも返す |

snapshotの各Agentは `agentId, owner, modelHash, metadataURI, status, cause` を持ちます。最新ブロックを固定して状態を読み、同revisionのStatusUpdatedをcauseに付けます。初回はsnapshotを受け取り、そのblockNumber・blockHashをeventsのcursorに使います。

```sh
curl -fsS http://127.0.0.1:8798/api/health
curl -fsS http://127.0.0.1:8798/api/chain/snapshot
```

eventsは `after + 1` から最新ブロックまでのRegistryログを返します。順序はblockNumber → transactionIndex → logIndexです。イベントが0件でも返された最新cursorを保持します。cursorのブロックが存在しないかhash不一致なら、HTTP 409の `{"error":"reorg","reset":true}` を返します。

receiptのstageは `pending` / `mined` / `reverted`。`mined` はそのトランザクションが採掘されたことを示し、Agent適用済みを示すものではありません。

## Status送信（Anvil専用）

`POST /api/chain/status`。同一Originと `Content-Type: application/json` が必要です。

```json
{
  "agentId": "1",
  "expectedRevision": "1",
  "activity": 2,
  "energy": 9000,
  "stimulus": 9500
}
```

上記は新規登録直後の例です。実際にはsnapshotや受信イベントの最新revisionを使います。固定値を再送するとrevision競合になります。

| フィールド | 条件 |
| --- | --- |
| agentId | 文字列 `1` / `2` / `3` |
| expectedRevision | 現在のrevisionの10進文字列 |
| activity | 0=Rest / 1=Explore / 2=Forage |
| energy | 整数0..10000。供給条件 |
| stimulus | 整数0..10000。刺激強度 |

Workerが `eth_call` で事前確認し、gasを見積もってAnvilのunlocked ownerアカウントから送信します。リクエスト本文は1024文字までです。

成功時HTTP 202:

```json
{
  "transactionHash": "0x…",
  "agentId": "1",
  "stage": "submitted"
}
```

`0x…` は表示上の省略です。実際は完全なハッシュを返します。202は送信受付であり、採掘・イベント適用の保証ではありません。GUIはreceiptとlogsを確認して適用済みを表示します。待機終了時の自動再送は行いません。

## イベント

共通フィールド:

`chainId, registryAddress, blockNumber, blockHash, transactionHash, transactionIndex, logIndex, name, agentId, eventId, receiptVerified`

- `BioAgentStatusUpdated`: `writer, status` を追加。statusは `activity, energy, stimulus, revision, updatedAt`。
- `BioAgentStimulusAccepted`: `writer, nonce, schema, payloadHash, configuration`。環境スキーマはAgent #1から受け、JSONの寸法・seed・危険エリア等を検証する。
- `environment`は最新の有効な環境入力イベント。環境TXがない場合、箱庭用snapshotを返さず停止する。
- eventId: `chainId:registryAddress小文字:blockHash:transactionHash:logIndex`。

現在のJSONは `name` と `status` を使います。共有Runtime設計案にある `eventName / payload / canonicality` の形式とは異なります。スキーマ追加時は両側を同時に更新してください。

## エラー

| HTTP | 代表例 | クライアント側の対応 |
| --- | --- | --- |
| 400 | agent・値域・cursor・hash不正 | 入力を修正 |
| 403 | Origin不一致、loopback外、owner設定不一致 | 接続設定を確認 |
| 409 | RevisionMismatch、RPC側エラー | 再取得して原因を確認。盲目的に再送しない |
| 409 + reset | cursorのreorg | snapshotから再初期化 |
| 413 | 本文が上限超過 | 必要なフィールドだけを送る |
| 503 | RPC停止、配置・model不一致、環境入力未確認 | 起動ログと設定を確認 |
| 404 | 未提供のパス・メソッド | API契約を確認 |

基本形式は `{"error":"説明"}`。JSON構文不正は現在の実装では包括的な503になります。すべての不正入力が400になるわけではありません。

## 初期環境TX

`submitStimulus(1, expectedNonce, schema, payload)`を所有者が送信します。`schema`は`keccak256("bioagent.foraging-world.v1")`、payloadは[初期設定JSON](../../packages/bio_agent/browser/foraging-world.json)のUTF-8バイトです。`expectedNonce`は`stimulusNonce(1)`から取得し、Statusのrevisionとは分けて扱います。

コントラクトはowner・nonce・payload長を検査します。環境スキーマと値域は共通読取・ランタイム側で検証し、不正な入力をローカル初期値で補いません。環境変更は新しい環境TXで行い、以前の餌を消去します。初期配置スクリプトは登録後、動作開始前に環境TXを確定させます。

## 提供しないもの

登録API、任意RPC転送、任意送金、秘密鍵入力、SSE、Runtime状態のサーバー保存はありません。登録はFoundry Scriptで行います。公開ネットワーク用の署名設計にこのunlocked account経路を流用しません。
