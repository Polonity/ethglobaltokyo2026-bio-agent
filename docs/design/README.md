# Bio Agent システム設計 v0.1

状態: **設計案 / 未実装**。ユーザーの構想を実装可能な境界に整理する文書です。既存の Python デモの動作を説明するものではありません。

## 目指す体験

ウォレットから Bio Agent の Status をブロックチェーンに登録する。そのイベントログを起動中の Agent が取得し、内部状態と行動を更新する。GUI で多数の個体が動き、どのトランザクションによって動きが変わったか追える。

## 設計の軸

1. `IBioAgent` で Agent の識別子、Status、更新操作、イベントを定義する。
2. `BioAgentRegistry` に Agent の定義と最新 Status を保存する。
3. 常駐する Agent Runtime が Registry のイベントログを取得して処理する。
4. Backend が入力・処理結果を保存し、GUI に配信する。
5. GUI は Runtime が出した位置・行動を補間して描画する。

## 暫定の決定

| 項目 | v0.1 の案 |
| --- | --- |
| チェーン | EVM 系。実ネットワークは未選定 |
| コントラクト配置 | 1 Registry に複数 Agent。1 Agent ごとのコントラクトは作らない |
| Agent の同一性 | `(chainId, registryAddress, agentId)` |
| IBioAgent | オンチェーンの型・Status 更新契約。Runtime の処理契約は別名で定義 |
| Status の意味 | 外部から与える状態・刺激。計算された実行状態とは分離する案（要確認） |
| 書込権限 | Agent を登録した owner。v0.1 では所有権移転・書込委任なし |
| ログ受信 | Runtime 内の共有 ChainListener が取得し、対象 Agent に振り分ける |
| GUI 更新 | Runtime → Backend → SSE → GUI。描画はブラウザー内で継続 |
| 学習 | デモ経路から独立。モデル版を固定し、記録した入力を再生可能にする |

Status を「Agent 自身が報告する状態」とする場合は、書込主体を owner から承認された Runtime writer に拡張し、入力イベントを別途定義する。この意味付けは実装前に確定する。

## 文書

- [型・Registry・イベント](onchain-contracts.md)
- [ログ受信・実行・データ管理](runtime-and-events.md)
- [GUI とハッカソンデモ](demo-experience.md)

## 現在のひな型との対応

| 現在 | 設計後 |
| --- | --- |
| `packages/bio_agent/step` | Runtime 内のモデル実装に相当。状態を保持する処理契約へ拡張 |
| `packages/shared/Stimulus` | イベント由来の入力・出典付き型へ拡張 |
| `packages/training` | 状態遷移記録を利用する学習・評価ジョブ |
| `services/backend` | 保存・読取 API・SSE。RPC と Runtime を別モジュールとして接続 |
| `apps/frontend` | 個体群の表示、Status 操作、Tx と処理の可視化 |
| 未作成 `contracts/` | Solidity interface、Registry、コントラクトテスト |

## 実装前に確定すること

- Status は外部入力か、Runtime の報告か、両方か。
- 対象チェーン、RPC、ウォレット、確認ブロック数。
- 初期 Agent モデルと MaleCNS 部分回路、刺激・行動の対応。
- デモの個体数と操作項目。初期提案は24体、活動モード・エネルギー・刺激強度。

スポンサー固有の API や賞の要件は、この基礎設計の確定条件にしない。
