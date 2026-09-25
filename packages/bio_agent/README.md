# Bio Agent 本体

- `browser/arena.js`: Fly Lab の競争・判定・自己学習 Runtime。Q-learning によるブラウザー内の適応モデル。モデルと観測・報酬・検証条件は [Fly Lab 設計](../../docs/design/fly-arena.md) を参照。
- `__init__.py`: 元の API ひな型用 `step(Stimulus) -> AgentState`。閾値で rest / explore を選ぶ独立した模擬モデル。

どちらも MaleCNS の神経回路シミュレーションではない。実データ取込・回路モデルの接続は今後実装する。
