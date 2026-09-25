# Fly Lab GUI

Canvasで個体の競争・判定・学習を観察するHTML/CSS/JavaScriptアプリです。

| 起動 | 動作 |
| --- | --- |
| ルートで `npm run local:up` | Anvilに登録した3匹。選択個体へコントラクト経由で入力 |
| ルートで `npm run dev` | ブラウザー内の12匹。チェーン未接続 |

`app.js` は描画・操作、`chain.js` はAnvilのsnapshot・イベント・送信進捗を担当します。行動判定・学習は `packages/bio_agent/browser/arena.js` です。ビルド成果物はルートの `dist/` に生成されます。

## 状態の扱い

- `/api/config` のmodeでAnvil接続を選びます。
- Anvilモードでは編集値を送信しただけではAgentへ適用しません。採掘済みイベントで対象の入力を更新します。
- Runtimeはタブ内にあり、リロードで位置・得点・経験・Q値が初期化されます。チェーンの最新入力は再取得します。
- JSON保存は現在の実験状態の書き出しで、import・完全再開機能ではありません。
- `?test=1` はブラウザーテスト用に `window.__arena` / `window.__chain` を公開します。通常の操作に不要です。

[画面・デモ操作](../../docs/design/demo-experience.md) / [API](../../docs/reference/local-api.md) / [モデル](../../docs/design/fly-arena.md) / [検証](../../docs/development.md)

## 表示言語

ヘッダーからシステム（既定）・English・日本語を選べます。レースを止めずに切り替え、選択をブラウザーに保存します。[仕様・翻訳追加・検証](../../docs/i18n.md)を参照してください。
