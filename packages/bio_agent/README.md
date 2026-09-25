# Bio Agent 本体

| 実装 | 役割 |
| --- | --- |
| `browser/arena.js` | 現在のGUIの行動判定、競争、経験記録、Q学習 |
| `__init__.py` | Python APIひな型用の独立した閾値モデル |

## ブラウザーRuntime

モデルIDは `foraging-q-v1`。Arenaが個体の位置・体力・得点・Q値・経験を保持し、5Hzで進めます。受信したStatusは `applyAgentStatus` で対象個体へ適用されます。RPCやHTTPの取得はこのモジュールの責務ではありません。

- 入力: rest / explore / forage、energy供給、stimulus。契約の0..10000を0..1へ変換。
- 観測: 蜜の方向、危険・境界方向、低体力かどうか。
- 行動: 8方向への移動または休息。
- 学習: 直近の経験と練習環境を使用。候補を検証し、改善時のみ採用。
- 出力: 個体状態と競争・学習イベント。自動オンチェーン書戻しはしない。

個体数はAnvilモード3匹、ブラウザーモード12匹。タブごとに独立して動作します。学習と次ラウンドの詳細は [Fly Lab設計](../../docs/design/fly-arena.md) を参照してください。

## Pythonモデル

`step(Stimulus) -> AgentState` は閾値でrest / exploreを選ぶ模擬モデルです。ブラウザーのQ学習とは別で、Pythonの学習成果物も自動適用しません。

いずれもMaleCNS神経回路シミュレーションではありません。将来のモデル差し替えでは、入力・出力対応、モデルmanifest、評価条件を合わせて更新します。

検証: ルートで `npm run test:arena`、Pythonは `make test`。

## 入力元が異なるAgent

`runtime/agents.js` に `IBioAgentRuntime` を継承する `ForagingBioAgent` と `UniswapPriceBioAgent` を追加しています。既存GUIとは別の拡張基盤です。`npm run demo:agents` で固定データの刺激→判定を確認できます。[仕様・出典・walletの境界](../../docs/design/agent-types-and-wallets.md)を参照してください。
