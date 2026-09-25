# 学習基盤

現在は2つの別々の学習経路があります。

| 経路 | 実装 | 成果物・適用 |
| --- | --- | --- |
| GUIの自己学習 | `packages/bio_agent/browser/arena.js` | タブ内Q値。検証で改善した候補のみ適用 |
| Pythonジョブひな型 | このディレクトリの `__main__.py` | JSONファイル。自動適用しない |

## GUIの自己学習

[モデルと評価条件](../../docs/design/fly-arena.md)を参照してください。学習はブラウザー内で行い、このPythonジョブを呼び出しません。固定3コースはモデル選別用の検証セットで、独立した最終評価ではありません。

## Pythonジョブ

リポジトリルートで実行します。

```sh
make train
# 出力先を指定する場合
python3 -m packages.training --output data/training/experiment.json
```

合成4サンプルに対して閾値0.25 / 0.5 / 0.75を探索します。既定出力は `data/training/demo-model.json`。schema_version、base_model_version、dataset、threshold、training_accuracy、sample_count、evaluation、automatically_appliedを保存します。

これはジョブと成果物の配線確認用です。訓練データ上の正解率を記録し、汎化性能や生物学的学習は検証しません。既存パスへの出力は上書きされるため、比較実験では出力先を分けます。

次段階では、チェーン由来の入力履歴、モデル・seed・適用tick、学習用と評価用の分離、成果物の明示的な適用を接続します。
