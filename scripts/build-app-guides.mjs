import { guideFor } from '../apps/frontend/guides/content.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('docs/apps', { recursive: true });
for (const app of ['foraging', 'market', 'aqua']) {
  const g = guideFor(app, 'ja', 'full'),
    old = guideFor(app, 'ja', 'browser');
  const rows = (r) => r.map(([k, v]) => `| ${k} | ${v} |`).join('\n');
  const text = `# ${g.name}\n\n${g.manual.mission}\n\n${g.manual.role}\n\n[全神経版の印刷シート](http://127.0.0.1:8812/guides/sheet.html?app=${app}&mode=full&lang=ja) / [従来版の印刷シート](http://127.0.0.1:8800/guides/sheet.html?app=${app}&mode=browser&lang=ja)。画面内と同じ説明データから生成しています。英語はシートの言語選択で切り替えられます。\n\n## 01 はじめてのプレイ\n\n${g.manual.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n途中で止めるには「停止」。進行中の動作が完了してから止まります。\n\n## 02 画面の見方\n\n実画面の切り抜きです。数値は撮影時の例です。\n\n${['操作する場所', 'ハエが反応する場所', '状態と成績', 'ブロックチェーンの証拠'].map((name, i) => `### ${i + 1}. ${name}\n\n![${name}](../../apps/frontend/guides/screens/full-${app}-ja-${i + 1}.png)`).join('\n\n')}\n\n| 表示 | 意味 |\n| --- | --- |\n${rows(g.legend)}\n\n### 状態と吹き出し\n\n${g.body}\n\n${g.bubbles}\n\n### 成績と目標\n\n${g.manual.score}\n\n| 表示 | 意味 |\n| --- | --- |\n${rows(g.metrics)}\n\n## 03 学び直して、もう一度\n\n${g.learning}\n\n${g.phase}\n\n${g.tryIt}\n\n## 04 ゲームの裏側\n\n${g.flow.map(([k, v]) => `### ${k}\n\n${v}`).join('\n\n')}\n\n${g.boundary}\n\n${g.model}\n\n${g.biology}\n\n| 表示 | 意味 |\n| --- | --- |\n${rows(g.numbers)}\n\n## 従来のブラウザー版との違い\n\n${old.manual.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n${old.manual.score}\n\n${old.model}\n\n${old.flow.map(([k, v]) => `- **${k}**：${v}`).join('\n')}\n\n${old.learning}\n\n参照実装：全神経版 \`services/full-apps/${app}.mjs\`、神経入力 \`packages/bio_agent/full_apps/brain.py\`、学習 \`packages/bio_agent/full_apps/learning.py\`。説明データは \`apps/frontend/guides/content.mjs\`。\n`;
  await writeFile(`docs/apps/${app}.md`, text);
}
