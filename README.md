# Bio Agent — ETHGlobal Tokyo 2026

ブロックチェーン上の情報を刺激として受け取り、内部状態と学習結果に基づいて振る舞う Bio Agent。生物由来の神経回路を使った学習・自律性と、その様子を観察できる体験を目指します。

現在は、12体のハエが競争し、成績下位の個体が自己学習して復帰する **Fly Lab** を Cloudflare Workers で公開しています。判定・学習はブラウザー内の Q-learning モデルです。ローカルでは Anvil に3匹を登録し、GUIからオンチェーン刺激を送る構成にも対応しています。MaleCNS 回路・Sepolia 接続は未実装で、コントラクトは Foundry によるデプロイ準備まで完了しています。

**[Fly Lab を開く](https://ethglobaltokyo-bio-agent-arena.commun-official.workers.dev)**

**提出物の設計軸:** 生物モデルの出典、身体状態を含む個体、刺激から反応・学習への変化を共通形式で追う。[思想と設計方針](docs/standards/bioagent-design-direction.md) / [既存ERC調査](docs/standards/prior-art-and-bioagent.md) / [審査員向け説明案](docs/submission/bioagent-thesis.md)。NFT/SBT機能追加は要件ではなく、採餌と市場観測を用途別profileとして整理しています。新profileは設計段階です。

**[ドキュメント一覧](docs/README.md)** — 起動、構成、API、学習、デモ、開発・検証の入口。

## 構成

| パス | 役割 |
| --- | --- |
| `packages/bio_agent/` | Bio Agent 本体。刺激を受け取り内部状態・行動を出力 |
| `packages/training/` | 学習基盤。実験実行、評価、モデル成果物の管理 |
| `apps/frontend/` | エージェントの入力・状態・行動の観察画面 |
| `services/worker/` | Cloudflare Workers による GUI 配信と health API |
| `services/backend/` | データ管理 API。入力と実行結果を SQLite に保存 |
| `contracts/` | Foundry: Solidity 型、Registry、テスト、デプロイスクリプト、ABI |
| `packages/shared/` | コンポーネント間で共通のデータ形式 |
| `docs/` | アーキテクチャ・データ出典・開発計画 |
| `data/` | ローカル実行データ（Git 管理対象外） |

## システム設計

[設計ドキュメント v0.1](docs/design/README.md) に `IBioAgent`、Registry、Status、イベント、ログ受信、GUI デモの設計をまとめています。Status は Agent への入力となる状態・刺激です。Registry が発行するイベントを起動中の Agent が処理し、その実行結果を GUI に反映します。Registry コントラクトと、ローカル Anvil のイベント受信・Runtime・GUI の接続を実装済みです。

## Anvil とローカル Workers で動かす

```sh
npm ci
git submodule update --init --recursive
npm run local:up
# http://127.0.0.1:8798
```

Foundry の forge / anvil が必要です。AnvilへRegistryを実デプロイして3匹を登録し、GUIで選んだ1匹に刺激を送れます。Cloudflareの認証情報やブラウザーウォレットは不要です。

起動後、別ターミナルの `npm run test:local` でGUI→コントラクト→イベント→個体反応を実ブラウザーで検証できます。**[詳しい起動・操作・動作確認ガイド](docs/deployment/local-anvil.md)** を参照してください。

ローカル版の字幕付きデモ動画は `node scripts/record-demo.mjs` で収録できます。[動画の内容と再収録手順](docs/demo-video.md)を参照してください。

## ブラウザー内デモを起動

Node.js 22以上を使用し、ルートで実行します。

```sh
npm ci
npm run dev
# Wrangler が表示するローカル URL を開く
```

蜜を集める90秒のレースが自動で始まります。活動・刺激・エネルギー供給を変更し、ハエを選んで判断を観察できます。下位2体は自動で学習室へ入り、評価後に復帰します。

```sh
npm run test:arena
npm run test:browser  # ローカルサーバーを先に起動。既定はポート8797
npm run deploy       # Cloudflare に公開する操作
```

詳細は [Fly Lab 設計](docs/design/fly-arena.md) / [Workers 手順](docs/deployment/workers.md)。

元の Python API ひな型も残しています。Python 3.11以上で `make dev`（ポート8000）、`make train`、`make test` が使えます。GUI の競争データはブラウザー内で管理され、SQLite Backend にはまだ接続していません。

## 目標のデータフロー

```text
Blockchain RPC / events
    → Backend: 取得・正規化・出典保存
    → Bio Agent: 刺激 → 内部状態 → 行動
    → Backend: 実行結果・モデルバージョン保存
    → Frontend: 観察・履歴表示

保存済み入力 → 学習基盤: 学習・評価 → モデル成果物 → Bio Agent
```

現在公開中の GUI はローカル入力 → ブラウザー内 Agent → 描画の構成です。学習室で更新した方策は評価後に適用されます。上記のチェーン・共有Backend経由の構成は次段階です。

## コントラクト開発・Sepolia

コントラクト開発は **Foundry** を使用します。[コントラクト README](contracts/README.md) に環境とテスト、[Sepolia 手順](docs/deployment/sepolia.md) に未送信の dry-run と将来のデプロイ操作をまとめています。

```sh
git submodule update --init --recursive
make contracts-build contracts-test
make contracts-dry-run contracts-check-deployment
```

上記の確認コマンドは実ネットワークにトランザクションを送信しません。

## MaleCNS

[Male CNS Connectome](https://male-cns.janelia.org/) は雄ショウジョウバエの中枢神経系コネクトームの公開プロジェクトです。接続データを神経回路モデル構築の参照元とし、Agent の実装・実行エンジンは本プロジェクトで用意します。公開データそのものが動作する Agent ではありません。

データ取込前にリリース、抽出条件、帰属・ライセンスを記録します。詳細は [データ出典方針](docs/data-sources.md) を参照してください。

## 開発

- 各要素の境界と未実装項目は [アーキテクチャ](docs/architecture.md) を参照。
- 作業単位で動作確認し、小さなコミットを残します。
- RPC URL、トークン、大容量データ、学習成果物はコミットしません。
- 現在の動作確認は Anvil。次の対象は Ethereum Sepolia。イベントの型は `contracts/src/interfaces/`、現在の学習目的・評価条件は [Fly Lab設計](docs/design/fly-arena.md) を参照。
- スポンサー固有の統合・スマートコントラクトは選定後に追加します。

### Experimental market inputs

[Swap event milestone](docs/design/swap-event-game.md): `npm run demo:swaps` verifies three agents using synthetic V3-shaped events on a separate Anvil. This is not a live Uniswap integration or a completed trading game. The existing demo currently uses the earlier experimental NFT contract; tokenization is not a requirement and its implementation cleanup is deferred until the design review is settled.
