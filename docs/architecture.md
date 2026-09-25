# アーキテクチャ

現在の中心は **Anvilに登録した3匹へ、GUIから入力を送り、ブラウザー内で競争・学習させる構成** です。将来の常駐Runtimeと永続化は [別の設計](design/runtime-and-events.md) として扱います。

## 実行モード

| モード | 起動 | 入力経路 | 個体数 | 保存 |
| --- | --- | --- | --- | --- |
| Anvil接続 | `npm run local:up` | GUI → ローカルWorker → Registry → logs → GUI Runtime | 3 | 登録・入力はAnvil、競争・学習はタブ内 |
| ブラウザーデモ | `npm run dev` / 公開用Worker | GUI → GUI Runtime | 12 | タブ内 |
| Pythonひな型 | `make dev` | `/api/demo/step` → 閾値モデル | 1ステップずつ | SQLiteに模擬実行履歴 |

Pythonサーバーもビルド済みGUIを配信しますが、その競争状態をPythonが計算・保存するわけではありません。

## 現在のローカル経路

```text
Browser GUI                  Local Worker                    Anvil
  入力を編集
  POST /api/chain/status  →   値・Origin・設定検証
                             updateStatus を送信         →   owner / revision 検証
                                                         →   Status保存・event発行
  receipt / events取得    →   eth_getTransactionReceipt
                             eth_getLogs                 ←   採掘済みイベント
  ChainSession            ←   出典付きイベント
    対象個体へ入力を適用
  Arena: 5Hzで行動判定
    Q値・経験・得点更新
  Canvas: 描画を継続
```

WorkerはAgentの行動を計算しません。チェーンに保存するのは入力条件です。座標・体力・蜜の得点・学習結果はArenaが計算します。

`energy` は供給条件、InspectorのENERGYは計算中の体力です。`revision` は入力の更新番号、policy versionは学習候補の採用番号です。どちらも一方が変わっただけでもう一方が更新されることはありません。

## コードの責務

| ファイル・ディレクトリ | 責務 |
| --- | --- |
| `contracts/src/interfaces/` | 登録定義、Status、更新関数、イベント・エラー型 |
| `contracts/src/BioAgentRegistry.sol` | owner権限、値域、revision検証、ストレージ更新 |
| `contracts/script/DeployLocalArena.s.sol` | ローカル配置と3匹の初期登録 |
| `scripts/local-up.mjs` | Anvil起動、Forge実行、設定生成、Wrangler起動・終了 |
| `services/worker/local.js` | 固定Registryへの読取・書込、Anvil確認、イベント整形 |
| `services/worker/index.js` | 公開アセットとブラウザーモード設定の配信 |
| `apps/frontend/chain.js` | snapshot取得、polling、重複排除、再同期、送信進捗 |
| `packages/bio_agent/browser/arena.js` | 個体状態、行動判定、学習、競争、ラウンド |
| `apps/frontend/app.js` | UI操作、Canvas描画、Inspector、JSON保存 |
| `services/backend/` / `packages/training/` | 独立したPython永続化・学習ひな型 |

## 起動・更新・復旧

1. `local:up` が新しいAnvilへRegistryと3匹を配置し、`.local/deployment.json` を生成します。
2. GUIは配信manifestのSHA-256と設定を照合します。Workerは登録済みmodelHashも照合します。
3. GUIは同一ブロックのsnapshotと各Statusの原因ログから初期化します。
4. 600ms間隔でcursor以降を取得し、`eventId`で重複を排除します。更新revisionが連続しない場合は再同期します。
5. 送信成功だけで行動を変更せず、採掘済みイベントを入力として適用します。ローカル版に確認深度待ちはありません。
6. cursorのブロックハッシュ不一致などでreorgを検知すると、最新snapshotから競争を初期化します。checkpointから過去の学習を厳密に巻き戻す実装ではありません。

一時停止はArenaの進行を止めます。ログ受信は続きます。接続が途切れた場合、GUIは接続待ちを示し、新しい送信と競争の進行を待機します。

## データの寿命

| データ | 保存先 | リロード | `local:up`を終了して再起動 |
| --- | --- | --- | --- |
| Agent定義・Status・イベント | 起動中のAnvil | 保持し再取得 | 新しいチェーンで再登録 |
| 座標・得点・経験・Q値 | ブラウザーのタブ | 初期化 | 初期化 |
| 接続設定・Forgeログ | `.local/` | 保持 | 設定再生成 |
| 実験JSON | ユーザーが保存したファイル | ファイルは保持 | ファイルは保持 |
| Python模擬実行 | `data/bio-agent.sqlite3`等 | 保持 | Anvilとは独立 |

実験JSONには完全な操作履歴やimport機能がなく、中断再開ファイルではありません。複数タブは同じチェーン入力を受信できますが、競争と学習はタブごとに独立します。

## 次に接続するもの

- Sepolia: RPC・署名経路・確認深度・再編成方針を決定し、ローカル専用APIと分離して実装。
- 共有Runtime: ブラウザーを閉じても稼働するプロセス、適用tick、checkpoint、入力履歴を保存。
- Backend: 現在の模擬履歴用SQLiteから、イベント・session・モデル成果物のスキーマへ拡張。
- MaleCNS: リリース・利用回路・入出力対応・モデル実装と評価を確定。

具体的な提案は [設計入口](design/README.md)、起動は [ローカル手順](deployment/local-anvil.md)、APIの正確なフィールドは [APIリファレンス](reference/local-api.md) を参照してください。
