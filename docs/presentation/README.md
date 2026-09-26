# BioAgent 成果説明スライド / Explanation slides

2026-09-26の保存済み受入記録と現行ソースを根拠にした、理解・質疑応答用の資料です。
日本語版と英語版は同じスライド番号・構成です。性能値は新たに測定したものではありません。

生成先: `artifacts/explanation-slides-20260926/`

- `index.html`: 日英の閲覧入口
- `BioAgent-ja.pptx`, `BioAgent-en.pptx`: 編集可能なPowerPoint。各ページに発表者ノート付き
- `BioAgent-ja.pdf`, `BioAgent-en.pdf`: 閲覧・印刷用
- `BioAgent-ja.html`, `BioAgent-en.html`: オフライン閲覧。矢印キーで移動、Nキーで補足表示
- `study-notes-ja.md`, `study-notes-en.md`: スライド別の説明原稿
- `qa-bilingual.md`: 日英の想定問答
- `source-audit.json`: 出典と保存済み検証のhash照合
- `validation.json`: 資料の描画・文字欠け・PPTX構造の検証結果

原稿と生成コードはこのディレクトリに保存します。ローカルの成果物を作るだけで、アプリの実行・学習・公開環境の変更は行いません。

```bash
node docs/presentation/build.mjs
node docs/presentation/validate.mjs
```

ビルドにはPptxGenJS、PDF化・描画検査にはPlaywrightとChromeを使います。環境のバンドル依存パスはコード先頭で指定しています。

PDFを別エンジンで描画し、PPTXのページ・ノート・XMLを検査するには、同梱Windows Pythonで `audit_artifacts.py` を実行します。PowerPoint本体での描画確認とは区別しています。

生成には `artifacts/explanation-slides-20260926/evidence-snapshot.json` と同フォルダーの `assets/`（3アプリの保存済み受入画面）が必要です。生成物一式を保存すると、画面・数値の根拠を固定して再生成できます。
