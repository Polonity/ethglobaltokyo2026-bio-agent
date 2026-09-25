# ログ受信・Agent 実行・データ管理

状態: **設計案 / 未実装**。

## 1回の Status 更新が届くまで

1. GUI が owner のウォレットに `updateStatus` の署名・送信を要求する。
2. Registry が状態を書き換え、`BioAgentStatusUpdated` を emit する。
3. Agent Runtime 内の ChainListener が Registry アドレスと event topic で logs を取得する。
4. ログを保存・検証・整列し、agentId に対応する稼働中の Agent のキューへ渡す。
5. Agent が Status を入力に変換し、次の tick 境界で適用する。
6. Runtime が入力イベントと適用 tick、計算結果を Backend に保存する。
7. Backend が SSE で更新を配信し、GUI が最新フレームへ補間する。

Registry は Runtime を直接呼び出さない。Runtime はオフチェーンで起動済みである必要がある。登録イベントを受けても、任意の未知モデルを自動起動しない。デモでは事前設定した Agent ID と許可済みモデルをホストする。

## ログとアプリケーションイベントの型

外部 JSON では uint256、uint64、chainId、tick、SSE cursor を10進文字列で表現する。JavaScript Number の整数精度を前提にしない。energy / stimulus は0..10000の JSON number とする。

| 型 | 必須フィールド |
| --- | --- |
| AgentKey | chainId, registryAddress, agentId |
| ChainLogEnvelope | schemaVersion, chainId, registryAddress, blockNumber, blockHash, transactionHash, transactionIndex, logIndex, eventName, payload, observedAt, canonicality |
| StatusInput | agentKey, activity, energy, stimulus, revision, updatedAt, causeEventId |
| RuntimeState | agentKey, sessionId, modelHash, tick, appliedRevision, lastCauseEventId, x, y, heading, speed, activation, action |
| RuntimeFrame | schemaVersion, frameId, sessionId, generatedAt, agents（RuntimeState の配列） |
| RuntimePresence | agentKey, state（starting / running / catching_up / offline / error）, lastHeartbeatAt, errorCode |

`canonicality` は `observed / confirmed / orphaned`。`confirmed` は設定した確認深度に達した意味で、チェーンの最終確定を一般に保証する名称ではない。`causeEventId` は `(chainId, registryAddress, blockHash, transactionHash, logIndex)` を正規化した識別子。同じログの再配送を識別する。

`x,y` はデモ領域の0..1、heading はラジアン、speed は領域幅/秒、activation は0..1。非有限値を拒否する。イベント名は Solidity 側と一致させ、独立した schemaVersion でアプリケーション形式を管理する。

## Runtime の処理契約

オンチェーンの `IBioAgent` とは別に、Python 側で `BioAgentRuntime` Protocol を設ける。

```text
initialize(definition, model, seed) -> RuntimeState
apply_status(StatusInput) -> AppliedInput
step(dt, tick) -> RuntimeState
snapshot() -> Checkpoint
restore(Checkpoint) -> RuntimeState
```

`AppliedInput` は eventId、revision、適用 tick を返す。Status の energy / stimulus を10000で割りモデル入力に変換する。Activity の解釈はモデル版で固定する。入力が来ない間も最新の入力条件と内部状態を使って tick を進める。agentId ごとのキューを直列に処理し、同じ tick に複数入力があればチェーン順に適用した記録を残す。

デモの初期提案は Runtime 20Hz、配信10Hz、描画は requestAnimationFrame。負荷測定で調整する。通信到着時刻ではなく、記録した適用 tick・固定 dt・seed・モデル版を使って再生する。

## 受信・重複・停止復旧

- `eth_getLogs` を範囲指定でポーリングする構成を最初に採用する。WebSocket 通知は後から高速化のヒントとして追加できる。
- 保存した blockNumber / blockHash から一定範囲を重ねて再取得し、重複を除く。初回はデプロイブロックから走査する。
- `(blockNumber, transactionIndex, logIndex)` 順に処理する。Registered が先、同一 Tx の初期 StatusUpdated が後になる。
- ログ保存と取得 cursor 更新を同一 DB transaction にする。Runtime の入力適用記録・checkpoint・配信用 outbox も一貫して保存する。
- 配送は at-least-once とし、Agent ごとの eventId で冪等化する。クラッシュ後は checkpoint と適用記録から再生する。未保存の GUI フレームは最新 snapshot で置換する。
- 未処理 revision に欠番があれば再取得し、順番がそろうまで対象 Agent を catching_up にする。再編成で巻き戻す場合は旧 revision の重複判定も巻き戻す。
- Agent 停止中もログを保存する。再開時は checkpoint 以降を順に追いつかせる。履歴が取得できない場合、最新 Status だけで再現済みと見なさず、明示的な新 session として初期化する。

RPC のログには block / transaction / logIndex などの出典情報が含まれる。取得条件や戻り値は [Ethereum eth_getLogs 仕様](https://ethereum.github.io/execution-apis/api/methods/eth_getLogs/) を基準に実装する。

## 確認深度と reorg

デモでは「ブロックに取り込まれたら暫定反映」を既定案とする。署名待ち・mempool pending の段階では Agent に適用しない。GUI に暫定反映と確認深度到達を分けて表示する。安定性重視のモードでは確認深度まで入力適用を待てる。

`removed` 通知に加え、再走査範囲のブロックハッシュを照合して共通祖先を探す。取り消されたログを orphaned とし、影響を受けた Agent を共通祖先以前の checkpoint に戻して正規チェーンから再生する。GUI には `runtime.reset` を送って旧軌跡を破棄させる。保持範囲を超える再編成では実行を停止し、デプロイブロックから再同期する。

ログの removed フラグと再編成については [Ethereum JSON-RPC ドキュメント](https://ethereum.org/developers/docs/apis/json-rpc/) を参照。確認深度・ポーリング間隔・再走査幅は対象チェーン選定時に決める。

## データ管理案

| テーブル | 役割・主な一意条件 |
| --- | --- |
| agents | AgentKey ごとの登録定義と現在の canonical Status の投影 |
| chain_logs | eventId ごとの生 topics / data、decode 結果、canonicality |
| chain_cursors | chainId / Registry ごとの取得済みブロックとハッシュ |
| runtime_sessions | モデル版、seed、dt、開始条件、稼働状態 |
| applied_inputs | sessionId / agentId / eventId ごとの適用 tick と有効状態 |
| checkpoints | sessionId / agentId / tick ごとの内部状態 |
| runtime_frames | 最新フレームと必要なデモ記録。全フレーム永久保存はしない |
| stream_outbox | 保存済みイベントを GUI に再送する単調増加 cursor |

既存 SQLite を拡張する案とし、スキーマ移行を導入する。チェーンの定義・入力は正規ログと状態が基準、Runtime 内部状態は checkpoint が基準、GUI は投影である。

## GUI 向け API 案

| API | 内容 |
| --- | --- |
| GET `/api/agents` | 定義、最新 Status、RuntimePresence の一覧 |
| GET `/api/agents/{agentId}/snapshot` | 現在の RuntimeState、適用 revision、原因イベント |
| GET `/api/events?agentId=...&cursor=...` | チェーン入力と実行の履歴 |
| GET `/api/stream` | SSE: agent.registered / status.observed / status.confirmed / status.reverted / runtime.frame / runtime.reset / runtime.presence |

v0.1 のサーバーは1 chain / 1 Registry に固定し、その設定を全応答に含める。複数 Registry 対応時は URL に完全な AgentKey を含める。

SSE id は chain logIndex ではなく outbox の cursor。再接続は Last-Event-ID から再送する。保持期間外なら snapshot と cursor を同一時点で取得し直す。遅いクライアントには frame を間引くが、Status と reset は落とさない。画面読込は snapshot の cursor より後のイベントを購読し、間の更新を欠落させない。

Status 書込はウォレットから直接 Registry に送信する。Backend に秘密鍵を預ける API は設けない。Runtime 停止時も Status の書込自体は成功し得るため、「チェーン保存済み」と「Agent 適用済み」を別々に表示する。

学習基盤には canonical な入力履歴と実行条件を渡す。学習結果は manifest と成果物として出力し、別 Agent の登録で明示的に選ぶ。実行結果の自動オンチェーン書戻しは v0.1 に含めない。
