// Raw-video frame review established the approach interval; preserve the full-speed run too.
import { readFile, writeFile, rename } from 'node:fs/promises';
import { renderPresenterDemo } from './render-presenter-demo.mjs';
const out = 'artifacts/foraging-validation-video',
  delivery = out + '/delivery';
const evidence = JSON.parse(await readFile(out + '/capture-evidence.json'));
evidence.cues = evidence.cues.filter((c) => c.id !== 'approach-slow-replay');
evidence.cues.splice(2, 0, {
  id: 'approach-slow-replay',
  start: 3.9,
  end: 6.5,
  videoStart: 3.9,
  videoEnd: 6.5,
  playbackRate: 0.25,
  ja: ['同じ行動の0.25倍速リプレイ｜餌へ近づき回収（推論速度の測定ではありません）'],
  en: ['Same action replayed at 0.25x | Approach and collect; not an inference-speed measurement'],
});
evidence.editNotes =
  'Retains the full-speed live run, then repeats raw-video 3.9–6.5 seconds at explicitly labelled 0.25x. Interval selected by frame inspection, not behavior filtering.';
await writeFile(out + '/capture-evidence.json', JSON.stringify(evidence, null, 2));
await renderPresenterDemo({
  raw: (await readFile(out + '/raw-video-path.txt', 'utf8')).trim(),
  evidence,
  out,
  delivery,
});
for (const lang of ['ja', 'en'])
  await rename(
    `${delivery}/bioagent-submission-${lang}.mp4`,
    `${delivery}/bioagent-foraging-validated-${lang}.mp4`,
  );
