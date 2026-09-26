import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const dir = 'docs/submission/presenter-kit',
  out = 'artifacts/submission-presenter-20260926';
await mkdir(out, { recursive: true });
const evidence = JSON.parse(await readFile(`${dir}/capture-evidence.json`, 'utf8'));
const settlement = JSON.parse(await readFile(`${dir}/settlement-evidence.json`, 'utf8'));
assert.deepEqual(evidence.browserErrors, []);
assert.equal(evidence.brain.full.neurons, 166700);
assert.equal(evidence.brain.full.connections, 25582938);
assert(evidence.policyChanges.every((c) => c.updatesAfter > c.updatesBefore));
assert(evidence.policyChanges.some((c) => c.weightsChanged));
assert.deepEqual(evidence.before.targets, evidence.restoredTargets);
assert.deepEqual(settlement.routeCounts, evidence.newRoutes);
assert(settlement.records.every((x) => Number(x.receipt.status) === 1 && x.tokenTransferCount >= 2));
const report = {
  verifiedAt: new Date().toISOString(),
  recordingModel: evidence.brain.full,
  successfulLocalReceipts: settlement.records.length,
  newRoutes: evidence.newRoutes,
  learning: evidence.policyChanges,
  files: [],
  videos: [],
  cheatsheet: {},
  visualReview: 'Not automated: review generated playback frames and all PDF pages separately.',
};
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const videos = await Promise.all(
    ['en', 'ja'].map(async (lang) => {
      const file = `${dir}/bioagent-submission-${lang}.mp4`;
      const probe = JSON.parse(
        execFileSync(
          'ffprobe',
          [
            '-v',
            'error',
            '-show_entries',
            'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate',
            '-of',
            'json',
            file,
          ],
          { encoding: 'utf8' },
        ),
      );
      const v = probe.streams.find((s) => s.codec_type === 'video');
      assert.equal(v.codec_name, 'h264');
      assert.equal(v.width, 1920);
      assert.equal(v.height, 1080);
      assert.equal(v.r_frame_rate, '30/1');
      assert(!probe.streams.some((s) => s.codec_type === 'audio'));
      assert(Number(probe.format.duration) > 45 && Number(probe.format.duration) < 65);
      execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { stdio: 'pipe' });
      const srt = await readFile(`${dir}/captions-${lang}.srt`, 'utf8');
      const cues = srt.trim().split('\n\n');
      assert.equal(cues.length, 8);
      const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));
      await page.goto(pathToFileURL(resolve(file)).href);
      await page.evaluate(async () => {
        const v = document.querySelector('video');
        v.muted = true;
        v.controls = false;
        v.playbackRate = 2;
        await v.play();
      });
      await page.waitForFunction(() => document.querySelector('video').ended, null, { timeout: 45000 });
      const playback = await page.evaluate(() => {
        const v = document.querySelector('video');
        return {
          ended: v.ended,
          duration: v.duration,
          time: v.currentTime,
          error: v.error?.message ?? null,
          frames: v.getVideoPlaybackQuality().totalVideoFrames,
        };
      });
      assert(playback.ended && playback.frames > 100 && playback.error === null);
      for (const [scene, second] of [
        ['opening', 0.8],
        ['learning', 22],
        ['resources', 28],
        ['aqua', 35],
        ['uniswap', 42],
        ['closing', 49],
      ]) {
        await page.evaluate((s) => {
          const v = document.querySelector('video');
          v.currentTime = s;
        }, second);
        await page.waitForFunction((s) => {
          const v = document.querySelector('video');
          return !v.seeking && v.readyState >= 2 && Math.abs(v.currentTime - s) < 0.1;
        }, second);
        await page.screenshot({ path: `${out}/playback-${lang}-${scene}.jpg`, type: 'jpeg', quality: 85 });
      }
      assert.deepEqual(errors, []);
      await page.close();
      return {
        language: lang,
        probe,
        fullDecode: true,
        browserPlayback: playback,
        seekScenes: 6,
        browserErrors: errors,
      };
    }),
  );
  report.videos = videos;
  assert.equal(videos[0].probe.format.duration, videos[1].probe.format.duration);
  const page = await browser.newPage({ viewport: { width: 1100, height: 1250 } });
  await page.goto(pathToFileURL(resolve(`${dir}/qa-cheatsheet.html`)).href);
  for (const [lang, count] of [
    ['ja', 2],
    ['en', 2],
    ['all', 4],
  ]) {
    await page.locator(`[data-select="${lang}"]`).click();
    assert.equal(await page.locator('.sheet:visible').count(), count);
    report.cheatsheet[lang] = { visiblePages: count };
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  report.cheatsheet.mobileNoHorizontalOverflow = true;
} finally {
  await browser.close();
}
for (const name of [
  'bioagent-submission-en.mp4',
  'bioagent-submission-ja.mp4',
  'captions-en.srt',
  'captions-ja.srt',
  'capture-evidence.json',
  'settlement-evidence.json',
  'qa-cheatsheet-ja.pdf',
  'qa-cheatsheet-en.pdf',
  'qa-cheatsheet-ja-en.pdf',
  'qa-cheatsheet-ja.md',
  'qa-cheatsheet-en.md',
  'qa-cheatsheet.html',
]) {
  const bytes = await readFile(`${dir}/${name}`);
  report.files.push({
    file: name,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
await writeFile(`${dir}/verification.json`, JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify({
    videos: report.videos.map((v) => ({
      language: v.language,
      duration: v.probe.format.duration,
      fullDecode: v.fullDecode,
      ended: v.browserPlayback.ended,
    })),
    successfulReceipts: report.successfulLocalReceipts,
    cheatsheet: report.cheatsheet,
  }),
);
