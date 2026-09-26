import { guideFor, bubbleGuide, bubbleSvg } from '../apps/frontend/guides/content.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('docs/apps/bubbles', { recursive: true });
for (const app of ['foraging', 'market', 'aqua']) {
  const g = guideFor(app, 'en', 'full'),
    old = guideFor(app, 'en', 'browser');
  const groups = bubbleGuide(app, 'en', 'full');
  for (const lang of ['ja', 'en'])
    for (const group of bubbleGuide(app, lang, 'full'))
      for (const [i, item] of group.items.entries()) {
        await writeFile(`docs/apps/bubbles/${group.id}-${app}-${lang}-${i}.svg`, bubbleSvg(item));
      }
  const bubbleText = groups
    .map(
      (group) =>
        `#### ${group.title}\n\n${group.items.map((item, i) => `![${item.label}](bubbles/${group.id}-${app}-en-${i}.svg)\n\n**${item.label}**: ${item.meaning}`).join('\n\n')}`,
    )
    .join('\n\n');
  const rows = (r) => r.map(([k, v]) => `| ${k} | ${v} |`).join('\n');
  const text = `# ${g.name}\n\n${g.manual.mission}\n\n${g.manual.role}\n\n[Full-neuron printable sheet](http://127.0.0.1:8812/guides/sheet.html?app=${app}&mode=full&lang=en) / [Legacy printable sheet](http://127.0.0.1:8800/guides/sheet.html?app=${app}&mode=browser&lang=en). Generated from the same content as in-app help. Use the sheet language selector for Japanese.\n\n## 01 First run\n\n${g.manual.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nSelect Stop to interrupt a run after the current action completes.\n\n## 02 Reading the screen\n\nThese are actual screen captures. Numbers are examples from the capture time.\n\n${['Controls', 'Agent field', 'State and results', 'Blockchain evidence'].map((name, i) => `### ${i + 1}. ${name}\n\n![${name}](../../apps/frontend/guides/screens/full-${app}-en-${i + 1}.png)`).join('\n\n')}\n\n| Display | Meaning |\n| --- | --- |\n${rows(g.legend)}\n\n### State and bubbles\n\n${g.body}\n\n${g.bubbles}\n\n### Bubble reference\n\nIllustrations match the actual labels. Full-mode action cards and legacy expressive bubbles are different displays.\n\n${bubbleText}\n\n### Scores and goals\n\n${g.manual.score}\n\n| Display | Meaning |\n| --- | --- |\n${rows(g.metrics)}\n\n## 03 Learn and try again\n\n${g.learning}\n\n${g.phase}\n\n${g.tryIt}\n\n## 04 Behind the application\n\n${g.flow.map(([k, v]) => `### ${k}\n\n${v}`).join('\n\n')}\n\n${g.boundary}\n\n${g.model}\n\n${g.biology}\n\n| Display | Meaning |\n| --- | --- |\n${rows(g.numbers)}\n\n## Differences from the legacy browser version\n\n${old.manual.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\n${old.manual.score}\n\n${old.model}\n\n${old.flow.map(([k, v]) => `- **${k}**: ${v}`).join('\n')}\n\n${old.learning}\n\nReference implementation: full mode \`services/full-apps/${app}.mjs\`, neural inputs \`packages/bio_agent/full_apps/brain.py\`, learning \`packages/bio_agent/full_apps/learning.py\`. Guide content: \`apps/frontend/guides/content.mjs\`.\n`;
  await writeFile(`docs/apps/${app}.md`, text);
}
