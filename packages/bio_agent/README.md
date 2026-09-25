# Bio Agent 本体

`step(Stimulus) -> AgentState` を公開します。現在は独立した入力ごとに閾値で `rest` / `explore` を選ぶ模擬モデルです。MaleCNS の取込・神経回路計算・連続状態は今後実装します。外部 I/O は Backend に集約します。
