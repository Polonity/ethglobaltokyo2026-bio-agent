import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { scenes } from './long-demo-plan.mjs';
const out = 'artifacts/presenter-long',
  delivery = out + '/delivery';
await mkdir(out + '/edit', { recursive: true });
await mkdir(delivery, { recursive: true });
const gui = JSON.parse(await readFile(out + '/gui-evidence.json'));
const market = (await readFile('artifacts/submission-presenter-rerecord/raw-video-path.txt', 'utf8')).trim();
const run = (args) =>
  new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (c) => (c === 0 ? resolve() : reject(Error('ffmpeg ' + c))));
  });
const duration = (file) =>
  +execFileSync('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=nw=1:nk=1',
    file,
  ]);
const stamp = (n) => {
  const cs = Math.round(n * 100);
  return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, '0')}:${String(Math.floor(cs / 100) % 60).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
};
const srtStamp = (n) => new Date(Math.round(n * 1000)).toISOString().slice(11, 23).replace('.', ',');
const wrap = (s, lang) => {
  if (lang === 'ja') {
    const chars = [...s];
    return [chars.slice(0, 44).join(''), chars.slice(44).join('')].filter(Boolean).join('\\N');
  }
  const words = s.split(' '),
    lines = [''];
  for (const w of words) {
    if ((lines.at(-1) + ' ' + w).length > 88) lines.push(w);
    else lines[lines.length - 1] += (lines.at(-1) ? ' ' : '') + w;
  }
  return lines.join('\\N');
};
const header = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\nWrapStyle: 0\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Subtitle,Noto Sans CJK JP,29,&H00FFFFFF,&H00FFFFFF,&H00302210,&H00000000,0,0,0,0,100,100,0,0,1,0,0,2,65,65,16,1\nStyle: Chapter,Noto Sans CJK JP,27,&H00B6EBD7,&H00B6EBD7,&H00102018,&H00102018,0,0,0,0,100,100,0,0,3,8,0,7,24,24,82,1\nStyle: Pause,Noto Sans CJK JP,22,&H00FFFFFF,&H00FFFFFF,&H00102018,&H00102018,0,0,0,0,100,100,0,0,3,7,0,9,24,24,125,1\nStyle: Note,Noto Sans CJK JP,22,&H00FFFFFF,&H00FFFFFF,&H00102018,&H00102018,0,0,0,0,100,100,0,0,3,7,0,9,24,24,82,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
const manifest = {
  schema: 'bioagent.gui-submission.v1',
  createdAt: new Date().toISOString(),
  audio: false,
  submissionReady: false,
  missing: 'Human narration recording; captions supplement speech and are not a confirmed substitute.',
  subtitleTiming: 'Estimated rehearsal timing; align to the human recording before submission.',
  results: 'Frozen full-neuron validation; not new training during filming',
  market: 'Separate verified 2026-09-26 Anvil fork recording; no new market trades claimed',
  files: {},
  languages: {},
};
for (const [id, c] of Object.entries(gui.clips))
  manifest.files[id] = {
    file: c.file,
    sha256: createHash('sha256')
      .update(await readFile(c.file))
      .digest('hex'),
  };
manifest.files.market = {
  file: market,
  sha256: createHash('sha256')
    .update(await readFile(market))
    .digest('hex'),
};
for (const lang of ['ja', 'en']) {
  let offset = 0;
  const chapters = [],
    subtitles = [];
  for (const [index, scene] of scenes.entries()) {
    const parts = scene[lang]
      .match(/[^。.!?]+[。.!?]?/g)
      .map((s) => s.trim())
      .filter(Boolean);
    const seconds = scene.seconds;
    const totalText = parts.reduce((n, p) => n + p.length, 0);
    const audioTimes = parts.map((p) => ((seconds - 1.2) * p.length) / totalText);
    const audioDuration = null; // Human recording still required; captions are rehearsal timing.
    const prefix = `${out}/edit/${lang}-${scene.id}`;
    let segments = [];
    if (gui.clips[scene.id]) {
      segments = [
        {
          file: gui.clips[scene.id].file,
          start:
            scene.id === 'inputs' ? 1.2 : scene.id === 'learning' ? 1.7 : scene.id === 'results' ? 1.5 : 1.2,
          length: seconds,
          rate: 1,
        },
      ];
      if (scene.id === 'behavior')
        segments = [
          { file: gui.clips.behavior.file, start: 1.4, length: 8, rate: 1 },
          { file: gui.clips.behavior.file, start: 2, length: 4, rate: 0.25 },
        ];
    } else {
      const starts = { market: 120.405, trading: 145, aqua: 225, uniswap: 231.4, close: 182 };
      segments = [
        {
          file: market,
          start: starts[scene.id],
          length: ['aqua', 'uniswap'].includes(scene.id) ? 5.5 : seconds,
          rate: 1,
        },
      ];
    }
    const chunks = [];
    let available = 0;
    for (const [j, s] of segments.entries()) {
      const rawDuration = duration(s.file);
      const length = Math.min(s.length, rawDuration - s.start - 0.08);
      assert(length > 0);
      const path = prefix + `-source-${j}.mp4`;
      chunks.push(path);
      available += length / s.rate;
      await run([
        '-ss',
        String(s.start),
        '-i',
        s.file,
        '-t',
        String(length / s.rate),
        '-vf',
        `setpts=(PTS-STARTPTS)/${s.rate},fps=30`,
        '-an',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '19',
        '-pix_fmt',
        'yuv420p',
        path,
      ]);
    }
    await writeFile(prefix + '-video.txt', chunks.map((f) => `file '${resolve(f)}'`).join('\n'));
    await run([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      prefix + '-video.txt',
      '-c',
      'copy',
      prefix + '-base.mp4',
    ]);
    let ass = header;
    const line = (start, end, style, text) =>
      `Dialogue: 0,${stamp(start)},${stamp(end)},${style},,0,0,0,,${text}\n`;
    ass += line(0, seconds, 'Chapter', scene.title[lang]);
    let t = 0.35;
    parts.forEach((text, i) => {
      const end = t + audioTimes[i];
      ass += line(t, end, 'Subtitle', wrap(text, lang));
      subtitles.push({ start: offset + t, end: offset + end, text });
      t = end;
    });
    if (index >= 5)
      ass += line(
        0,
        seconds,
        'Note',
        lang === 'ja' ? '検証済みの別収録 · Anvil fork' : 'Separate verified recording · Anvil fork',
      );
    if (scene.id === 'behavior')
      ass += line(
        8,
        24,
        'Note',
        lang === 'ja' ? '同じ動作の0.25倍速リプレイ' : 'Same actions · 0.25x replay',
      );
    if (available < seconds - 0.1)
      ass += line(
        Math.max(0, available - 0.1),
        seconds,
        'Pause',
        lang === 'ja' ? '記録画面を停止して説明' : 'Recorded frame paused for explanation',
      );
    await writeFile(prefix + '.ass', ass);
    await run([
      '-i',
      prefix + '-base.mp4',
      '-vf',
      `tpad=stop_mode=clone:stop_duration=${seconds},pad=1920:1080:0:0:color=0x101d25,ass=${prefix}.ass`,
      '-an',
      '-t',
      String(seconds),
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
      prefix + '-final.mp4',
    ]);
    chapters.push({
      id: scene.id,
      start: offset,
      end: offset + seconds,
      seconds,
      audioDuration,
      segments,
      pausedTailSeconds: Math.max(0, seconds - available),
      file: prefix + '-final.mp4',
    });
    offset += seconds;
    console.log(JSON.stringify({ lang, scene: scene.id, seconds, audioDuration }));
  }
  assert(offset >= 120 && offset <= 240, `Narration outside submission range: ${lang} ${offset}`);
  const list = `${out}/edit/${lang}-final.txt`;
  await writeFile(list, chapters.map((c) => `file '${resolve(c.file)}'`).join('\n'));
  const file = `${delivery}/bioagent-demo-draft-${lang}.mp4`;
  await run(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', file]);
  await writeFile(
    `${delivery}/bioagent-demo-${lang}.srt`,
    subtitles.map((s, i) => `${i + 1}\n${srtStamp(s.start)} --> ${srtStamp(s.end)}\n${s.text}\n`).join('\n'),
  );
  await writeFile(
    `${delivery}/script-${lang}.md`,
    '# BioAgent · ' +
      (lang === 'ja' ? '提出動画の読み上げ原稿' : 'Submission narration') +
      '\n\n' +
      chapters
        .map(
          (c, i) =>
            `## ${srtStamp(c.start).slice(0, 8)}–${srtStamp(c.end).slice(0, 8)} · ${scenes[i].title[lang]}\n\n${scenes[i][lang]}\n`,
        )
        .join('\n'),
  );
  manifest.languages[lang] = {
    duration: duration(file),
    chapters,
    narrationCharacters: scenes.reduce((n, s) => n + s[lang].length, 0),
    guiSeconds: offset - chapters.find((c) => c.id === 'results').seconds,
    file,
  };
  await writeFile(delivery + '/production.json', JSON.stringify(manifest, null, 2));
}
