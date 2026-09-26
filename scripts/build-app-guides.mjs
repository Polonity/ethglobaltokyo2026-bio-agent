import { guideFor } from '../apps/frontend/guides/content.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('docs/apps', { recursive: true });
for (const app of ['foraging', 'market', 'aqua']) {
  const g = guideFor(app, 'ja', 'full'),
    old = guideFor(app, 'ja', 'browser');
  const rows = (r) => r.map(([k, v]) => `| ${k} | ${v} |`).join('\n');
  const text = `# ${g.name}\n\n${g.goal}\n\n[全神経版の印刷シート](http://127.0.0.1:8812/guides/sheet.html?app=${app}&mode=full&lang=ja) / [従来版の印刷シート](http://127.0.0.1:8800/guides/sheet.html?app=${app}&mode=browser&lang=ja)。画面内と同じ説明データから生成しています。英語はシートの言語選択で切り替えられます。\n\n## 画面の凡例\n\n| 表示 | 意味 |\n| --- | --- |\n${rows(g.legend)}\n\n## オンチェーンから行動へ\n\n${g.flow.map(([k, v]) => `### ${k}\n\n${v}`).join('\n\n')}\n\n${g.boundary}\n\n## 状態と吹き出し\n\n${g.body}\n\n${g.bubbles}\n\n## コネクトームと学習\n\n${g.model}\n\n${g.learning}\n\n${g.phase}\n\n${g.biology}\n\n## 数値の意味\n\n| 表示 | 意味 |\n| --- | --- |\n${rows([...g.metrics, ...g.numbers])}\n\n## 操作して確かめる\n\n${g.tryIt}\n\n## 従来のブラウザー版との違い\n\n${old.model}\n\n${old.flow.map(([k, v]) => `- **${k}**：${v}`).join('\n')}\n\n${old.learning}\n\n参照実装：全神経版 \`services/full-apps/${app}.mjs\`、神経入力 \`packages/bio_agent/full_apps/brain.py\`、学習 \`packages/bio_agent/full_apps/learning.py\`。説明データは \`apps/frontend/guides/content.mjs\`。\n`;
  await writeFile(`docs/apps/${app}.md`, text);
}
