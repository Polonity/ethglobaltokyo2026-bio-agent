import { mkdir, writeFile } from 'node:fs/promises';
import { scenes } from './long-demo-plan.mjs';
const out = 'artifacts/presenter-long';
await mkdir(out + '/audio', { recursive: true });
await writeFile(out + '/narration.json', JSON.stringify(scenes, null, 2));
for (const lang of ['ja', 'en'])
  await writeFile(
    out + `/script-${lang}.md`,
    '# BioAgent · GUI demo narration\n\n' +
      scenes.map((s, i) => `## ${i + 1}. ${s.title[lang]}\n\n${s[lang]}\n`).join('\n'),
  );
