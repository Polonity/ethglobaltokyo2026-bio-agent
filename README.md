# BioAgent

生物由来の神経回路（コネクトーム）を使い、環境からの入力に応じて行動・学習するエージェントの実験基盤です。

[公開デモ](https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=ja) · [ドキュメント](docs/README.md) · [フレームワークAPI](packages/bioagent-framework/README.md)

## 目的

ハエの実測神経接続が、エージェントの学習や環境への適応にどう役立つかを研究します。採餌や市場を題材に、入力・内部状態・行動・学習結果を観察し、通常のモデルと比較できる環境を作っています。

ブロックチェーン上の個体・入力情報とモデルの出典を結び付け、アプリをまたいで判断の検証や学習成果の管理に使える共通基盤を目指します。

## 使い方

### ローカルで試す

Node.js 22.14以上とnpmを使用し、リポジトリのルートで実行します。

```sh
npm ci
npm run framework:lab
```

[Research Lab](http://127.0.0.1:8826/)を開き、入力を変えながら「学習 → 評価 → 採用 → 保存・復元」を試せます。このモードにウォレットやチェーンの起動は不要です。

### チェーン接続・全規模モデル

| 試したいこと                       | 手順                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| 公開デモで入力・学習を観察する     | [Sepolia Lab](docs/deployment/sepolia.md)。観察はウォレット不要 |
| ローカルチェーンから個体へ入力する | [Anvilでの起動](docs/deployment/local-anvil.md)                 |
| 全166,700神経をローカルで計算する  | [全規模モデルのセットアップ](docs/design/malecns-full-local.md) |

## 構成

基本の流れは、**チェーン入力 → 検証 → コネクトームの計算 → 判断・学習 → アプリ**です。Anvil／Sepoliaの箱庭では、初期環境・危険エリア・餌・刺激の外部入力をすべてTXに記録します。身体状態と学習はオフチェーンで計算します。

| ディレクトリ                                                          | 役割                                             |
| --------------------------------------------------------------------- | ------------------------------------------------ |
| [contracts/](contracts/README.md)                                     | 個体の登録、モデル参照、入力状態の管理           |
| [packages/bioagent-framework/](packages/bioagent-framework/README.md) | 入力検証、学習候補の評価・採用、方策の保存・復元 |
| [packages/bio_agent/](packages/bio_agent/README.md)                   | コネクトーム、身体状態、用途別の実行エンジン     |
| [apps/](apps/)                                                        | 個体の行動や学習結果を観察するGUI                |
| [services/](services/)                                                | GUI配信、チェーン接続、ローカル実行サービス      |

公開デモとJavaScriptフレームワークは7神経・19接続の部分回路、全規模モデルは別のPythonランタイムを使います。接続構造は実測データに由来し、動力学と入出力変換は人工設計です。

[レイヤ構成図とAPI](packages/bioagent-framework/README.md#レイヤ構造) · [データ出典](docs/data-sources.md) · [実験結果と限界](docs/research/bioagent-adaptation/README.md)

## 開発

```sh
npm run test:framework
```

そのほかのテスト、コントラクト開発、配信手順は[開発ガイド](docs/development.md)を参照してください。
