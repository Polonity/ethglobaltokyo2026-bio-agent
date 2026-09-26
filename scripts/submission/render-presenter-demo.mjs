import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function renderPresenterDemo({
  raw,
  evidence,
  out,
  delivery = 'docs/submission/presenter-kit',
}) {
  const rawStart = evidence.cues[0].start;
  const cues = structuredClone(evidence.cues);
  // Caption editing only: no changes to captured application results or timing.
  cues[0].en = ['BioAgent | 4 × 166,700 neurons', 'One market. Real local settlement.'];
  cues[0].ja = ['BioAgent｜4個体 × 166,700神経', '同じ市場で、判断から決済へ。Anvilローカル。'];
  const stamp = (n) => {
    const ms = Math.floor(n * 1000);
    return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
  };
  for (const lang of ['en', 'ja']) {
    const srt = cues
      .map(
        (c, i) =>
          `${i + 1}\n${stamp(i === 0 ? 0 : c.start - rawStart)} --> ${stamp((cues[i + 1]?.start ?? evidence.end) - rawStart)}\n${c[lang].join('\n')}\n`,
      )
      .join('\n');
    await writeFile(`${out}/captions-${lang}.srt`, srt);
    await new Promise((resolve, reject) => {
      const ff = spawn(
        'ffmpeg',
        [
          '-y',
          '-loglevel',
          'error',
          '-ss',
          String(rawStart),
          '-i',
          raw,
          '-t',
          String(evidence.end - rawStart),
          '-vf',
          `pad=1920:1080:0:0:color=0x101d25,subtitles=${out}/captions-${lang}.srt:force_style='FontName=Noto Sans CJK JP,FontSize=8,PrimaryColour=&H00FFFFFF,OutlineColour=&H00251D10,BorderStyle=1,Outline=0,Shadow=0,Alignment=2,MarginV=8'`,
          '-r',
          '30',
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '20',
          '-pix_fmt',
          'yuv420p',
          '-movflags',
          '+faststart',
          `${delivery}/bioagent-submission-${lang}.mp4`,
        ],
        { stdio: 'inherit' },
      );
      ff.on('error', reject);
      ff.on('exit', (c) => (c === 0 ? resolve() : reject(Error(`ffmpeg exit ${c}`))));
    });
    await copyFile(`${out}/captions-${lang}.srt`, `${delivery}/captions-${lang}.srt`);
  }
  await copyFile(`${out}/capture-evidence.json`, `${delivery}/capture-evidence.json`);
  await writeFile(
    `${delivery}/render-metadata.json`,
    JSON.stringify(
      {
        rawStart,
        rawEnd: evidence.end,
        speed: 1,
        audio: false,
        presentation: 'English UI; English and Japanese burned-in caption masters',
        captionEdit: 'Opening shortened for reading time. Final SRTs supersede draft text in capture cues.',
        resultDataEdited: false,
      },
      null,
      2,
    ) + '\n',
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const out = process.argv[2] || 'artifacts/submission-presenter-20260926';
  const evidence = JSON.parse(await readFile(`${out}/capture-evidence.json`, 'utf8'));
  const raw = (await readFile(`${out}/raw-video-path.txt`, 'utf8')).trim();
  await renderPresenterDemo({ raw, evidence, out });
}
