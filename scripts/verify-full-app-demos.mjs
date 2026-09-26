import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const out = process.env.DEMO_OUTPUT || 'artifacts/full-app-demos-20260926';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const report = [];
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  for (const app of ['foraging', 'market', 'aqua']) {
    const file = `${out}/${app}-english.mp4`,
      evidence = JSON.parse(await readFile(`${out}/${app}-evidence.json`, 'utf8'));
    assert.deepEqual(evidence.errors, []);
    assert.equal(evidence.receiptStatus, 200);
    assert.equal(
      evidence.receipt.hash || evidence.receipt.transactionHash,
      evidence.receiptUrl.split('/').at(-1),
    );
    assert.equal(Number(evidence.receipt.status), 1);
    assert.equal(evidence.during.neural.neuronsPerIndividual, 166700);
    assert(evidence.completed.tick >= 4);
    assert(evidence.savedReport);
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
    assert(Number(probe.format.duration) > 45);
    execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { stdio: 'pipe' });
    await page.goto(pathToFileURL(resolve(file)).href);
    await page.evaluate(async () => {
      const v = document.querySelector('video');
      v.muted = true;
      v.controls = false;
      v.style.width = '100%';
      v.style.height = '100%';
      await v.play();
    });
    await page.waitForTimeout(700);
    assert(await page.evaluate(() => document.querySelector('video').currentTime > 0));
    for (const [name, sec] of [
      [
        'action',
        evidence.chapters.find((c) =>
          /Nectar, hazards|Real price observations|Neural decisions/.test(c.title),
        ).seconds + 3,
      ],
      ['trace', evidence.chapters.find((c) => c.title === 'Follow one completed decision').seconds + 2],
      ['receipt', evidence.chapters.find((c) => c.title === 'Inspect the transaction receipt').seconds + 2],
    ]) {
      await page.evaluate((time) => {
        const v = document.querySelector('video');
        v.pause();
        v.currentTime = time;
      }, sec);
      await page.waitForFunction((time) => {
        const v = document.querySelector('video');
        return !v.seeking && v.readyState >= 2 && Math.abs(v.currentTime - time) < 0.2;
      }, sec);
      assert.equal(await page.evaluate(() => document.querySelector('video').error), null);
      await page.screenshot({ path: `${out}/${app}-playback-${name}.png` });
    }
    report.push({ app, probe, fullDecode: true, browserPlayback: true, receipt: true, fullNeurons: true });
  }
} finally {
  await browser.close();
}
await writeFile(out + '/verification.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
