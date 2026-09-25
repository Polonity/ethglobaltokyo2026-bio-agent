import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const out = 'artifacts/submission-demo';
const file = out + '/bioagent-submission-english.mp4';
const evidence = JSON.parse(await readFile(out + '/evidence.json', 'utf8'));
assert.deepEqual(evidence.errors, []);
assert.ok(evidence.chapters.length >= 13);
assert.ok(evidence.chapters.every((c, i, all) => c.seconds >= 0 && (!i || c.seconds > all[i - 1].seconds)));
assert.match(evidence.foragingTx, /^0x[0-9a-f]{64}$/i);
assert.ok(evidence.body.encoded);
assert.ok(evidence.market.flies.some((f) => f.trades.length && f.report));
assert.equal(evidence.circuitZero.intact.final.action, 'wait');
assert.equal(evidence.circuitHigh.intact.final.action, 'advance');
assert.equal(evidence.circuitHigh.ablated.final.response, 0);
const probe = JSON.parse(
  execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration,size:stream=codec_name,width,height',
      '-of',
      'json',
      file,
    ],
    { encoding: 'utf8' },
  ),
);
assert.equal(probe.streams[0].codec_name, 'h264');
assert.equal(probe.streams[0].width, 1600);
assert.equal(probe.streams[0].height, 1100);
assert.ok(Number(probe.format.duration) > 80 && Number(probe.format.duration) < 180);
execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { stdio: 'pipe' });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
const checks = [];
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  await page.goto(pathToFileURL(resolve(file)).href);
  await page.evaluate(async () => {
    const v = document.querySelector('video');
    v.muted = true;
    v.style.width = '100%';
    v.style.height = '100%';
    await v.play();
  });
  await page.waitForTimeout(800);
  assert.ok(await page.evaluate(() => document.querySelector('video').currentTime > 0));
  for (const fraction of [0.3, 0.73, 0.96]) {
    const target = Number(probe.format.duration) * fraction;
    await page.evaluate((time) => {
      const v = document.querySelector('video');
      v.pause();
      v.currentTime = time;
    }, target);
    await page.waitForFunction((time) => {
      const v = document.querySelector('video');
      return !v.seeking && v.readyState >= 2 && Math.abs(v.currentTime - time) < 0.2;
    }, target);
    const state = await page.evaluate(() => {
      const v = document.querySelector('video');
      return {
        time: v.currentTime,
        duration: v.duration,
        width: v.videoWidth,
        height: v.videoHeight,
        error: v.error?.message || null,
      };
    });
    assert.equal(state.error, null);
    checks.push(state);
    await page.screenshot({ path: out + '/playback-' + fraction + '.png' });
  }
} finally {
  await browser.close();
}
await writeFile(
  out + '/verification.json',
  JSON.stringify({ probe, checks, fullDecode: true, evidenceChecks: 'passed' }, null, 2),
);
console.log(
  'Verified integrated video: ' +
    probe.format.duration +
    ' seconds, full decode, Chrome playback/seeks, and recorded runtime evidence.',
);
