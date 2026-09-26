import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const run = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (c) => (c === 0 ? resolve() : reject(Error(`ffmpeg exit ${c}`))));
  });
const stamp = (n) => {
  const ms = Math.floor(n * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
export async function renderPresenterDemo({
  raw,
  evidence,
  out,
  delivery = 'docs/submission/presenter-kit',
}) {
  await mkdir(out + '/cuts', { recursive: true });
  await mkdir(delivery, { recursive: true });
  const rawProbe = JSON.parse(
    execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration:format_tags=creation_time', '-of', 'json', raw],
      { encoding: 'utf8' },
    ),
  );
  const creation = Date.parse(rawProbe.format.tags.creation_time);
  const clockOffset = (evidence.recordingStartedAtMilliseconds - creation) / 1000;
  if (!Number.isFinite(clockOffset)) throw Error('Recording requires wall-clock alignment metadata');
  let offset = 0;
  const timeline = [];
  for (const [i, c] of evidence.cues.entries()) {
    if (!(c.end > c.start)) throw Error('Each scene requires a recorded start and end');
    const rawStart = c.start + clockOffset,
      rawEnd = c.end + clockOffset;
    if (rawStart < 0 || rawEnd > Number(rawProbe.format.duration))
      throw Error('Scene is outside the raw video timeline');
    const file = `${out}/cuts/${String(i).padStart(2, '0')}.mp4`;
    await run([
      '-ss',
      String(rawStart),
      '-i',
      raw,
      '-t',
      String(c.end - c.start),
      '-an',
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '19',
      '-pix_fmt',
      'yuv420p',
      file,
    ]);
    const duration = Number(
      execFileSync(
        'ffprobe',
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file],
        { encoding: 'utf8' },
      ).trim(),
    );
    if (!Number.isFinite(duration) || duration <= 0) throw Error('Empty encoded scene: ' + c.id);
    timeline.push({ ...c, rawStart, rawEnd, start: offset, end: offset + duration });
    offset += duration;
  }
  await writeFile(
    out + '/cuts/list.txt',
    timeline.map((_, i) => `file '${String(i).padStart(2, '0')}.mp4'`).join('\n') + '\n',
  );
  await run([
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    out + '/cuts/list.txt',
    '-c',
    'copy',
    out + '/cut-master.mp4',
  ]);
  for (const lang of ['en', 'ja']) {
    const srt = timeline
      .map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c[lang].join('\n')}\n`)
      .join('\n');
    await writeFile(`${out}/captions-${lang}.srt`, srt);
    await run([
      '-i',
      out + '/cut-master.mp4',
      '-vf',
      `pad=1920:1080:0:0:color=0x101d25,subtitles=${out}/captions-${lang}.srt:force_style='FontName=Noto Sans CJK JP,FontSize=9,PrimaryColour=&H00FFFFFF,OutlineColour=&H00251D10,BorderStyle=1,Outline=0,Shadow=0,Alignment=2,MarginV=8'`,
      '-an',
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
    ]);
    await copyFile(`${out}/captions-${lang}.srt`, `${delivery}/captions-${lang}.srt`);
  }
  await copyFile(`${out}/capture-evidence.json`, `${delivery}/capture-evidence.json`);
  await writeFile(
    `${delivery}/render-metadata.json`,
    JSON.stringify(
      {
        schema: 'bioagent.presenter-edit.v2',
        duration: offset,
        rawCaptureSeconds: evidence.end,
        speedWithinShots: 1,
        audio: false,
        presentation: 'English UI; separate Japanese and English burned-in captions',
        cutsOmit:
          'Setup, navigation and long learning/settlement waits. Learning wait omission explicitly captioned.',
        resultDataEdited: false,
        shots: timeline,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ rendered: delivery, duration: offset, shots: timeline.length }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const out = process.argv[2] || 'artifacts/submission-presenter-rerecord';
  const evidence = JSON.parse(await readFile(`${out}/capture-evidence.json`, 'utf8'));
  const raw = (await readFile(`${out}/raw-video-path.txt`, 'utf8')).trim();
  await renderPresenterDemo({
    raw,
    evidence,
    out,
    delivery: process.env.PRESENTER_DELIVERY || `${out}/delivery`,
  });
}
