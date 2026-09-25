import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.ARENA_URL || 'http://127.0.0.1:8797';
const out = process.env.ARENA_ARTIFACTS || 'artifacts/arena';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const errors = [];
try {
  const page = await browser.newPage({
    locale: 'ja-JP',
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (e) => errors.push(e.message));
  const response = await page.goto(`${base}/?test=1`);
  assert.equal(response.status(), 200);
  await page.waitForFunction(() => window.__arena?.time > 0.5);
  assert.equal(await page.locator('.rank-row').count(), 12);
  const before = await page.evaluate(() => window.__arena.flies.map((f) => [f.x, f.y]));
  await page.waitForTimeout(1000);
  const after = await page.evaluate(() => window.__arena.flies.map((f) => [f.x, f.y]));
  assert.notDeepEqual(before, after);
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  const stopped = await page.evaluate(() => window.__arena.time);
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__arena.time), stopped);
  await page.locator('#stimulus').fill('82');
  await page.locator('#apply').click();
  assert.equal(await page.evaluate(() => window.__arena.world.stimulus), 0.82);
  await page.locator('#next-agent').click();
  assert.equal(await page.locator('#selected-name').textContent(), 'SORA');
  await page.locator('#train-selected').click();
  assert.equal(await page.evaluate(() => window.__arena.flies[1].state), 'learning');
  await page.screenshot({ path: `${out}/desktop.png`, fullPage: true });
  await page.getByRole('button', { name: '再開', exact: true }).click();
  await page.locator('#speed').click();
  await page.locator('#speed').click();
  await page.waitForFunction(() => window.__arena.flies[1].lastReport, { timeout: 15000 });
  const report = await page.evaluate(() => window.__arena.flies[1].lastReport);
  assert.ok(report.steps >= 3800);
  // Advance deterministic engine to automatically select low-performing agents.
  await page.evaluate(() => {
    for (let i = 0; i < 100; i++) window.__arena.tick();
  });
  assert.ok(await page.evaluate(() => window.__arena.flies.filter((f) => f.trainingCount).length >= 2));
  await page.locator('#about').click();
  assert.equal(await page.locator('#about-dialog').isVisible(), true);
  await page.locator('#about-ok').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^fly-lab-round-/);
  await download.saveAs(`${out}/experiment.json`);
  await page.evaluate(() => {
    for (let i = 0; i < 500; i++) window.__arena.tick();
  });
  await page.waitForFunction(() => !document.getElementById('round-end').hidden);
  await page.locator('#next-round').click();
  assert.equal(await page.evaluate(() => window.__arena.round), 2);
  const mobile = await browser.newPage({
    locale: 'ja-JP',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto(`${base}/?test=1`);
  await mobile.waitForFunction(() => window.__arena?.time > 0.5);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.locator('#next-agent').click();
  assert.equal(await mobile.locator('#selected-name').textContent(), 'SORA');
  await mobile.screenshot({ path: `${out}/mobile.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/verification.json`,
    JSON.stringify(
      {
        url: base,
        passed: true,
        javascriptErrors: errors,
        report,
        checks: [
          'movement',
          'pause',
          'status input',
          'selection',
          'training-return',
          'automatic-training',
          'dialog',
          'export',
          'round-restart',
          'mobile-overflow',
        ],
      },
      null,
      2,
    ),
  );
  console.log(`Browser checks passed: ${base}; desktop/mobile screenshots: ${out}`);
} finally {
  await browser.close();
}
