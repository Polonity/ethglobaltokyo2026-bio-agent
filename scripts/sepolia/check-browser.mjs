import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
if (process.argv.includes('--broadcast'))
  throw Error('This check is read-only. Use the scheduled sender or an owner wallet for transactions.');
const arg = process.argv.indexOf('--url');
const base = arg >= 0 ? process.argv[arg + 1] : 'http://127.0.0.1:8836/';
const out = process.env.BROWSER_OUT || 'artifacts/sepolia/shared-ui-browser';
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ locale: 'ja-JP', viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const result = { url: base, testedAt: new Date().toISOString(), writes: [] };
try {
  await page.goto(base + '?test=1&lang=ja');
  await page.waitForFunction(() => window.__chain?.ready, null, { timeout: 120000 });
  assert.equal(await page.locator('.rank-row').count(), 3);
  await page.evaluate(() => {
    window.__arena.autoLearn = false;
    document.querySelector('#auto-learn').checked = false;
    window.__arena.duration = 600;
  });
  result.initial = await page.evaluate(() => ({
    network: window.__chain.config,
    foodEvents: window.__arena.world.foodEvents,
    foodCount: window.__arena.world.foods.length,
  }));
  assert.ok(result.initial.foodEvents.length > 0);
  assert.ok(result.initial.foodEvents.every((e) => e.source.transactionHash && e.source.revision !== '1'));
  const first = await page.evaluate(() => ({ x: window.__arena.flies[0].x, y: window.__arena.flies[0].y }));
  await page.waitForTimeout(5000);
  result.after = await page.evaluate(() => ({
    x: window.__arena.flies[0].x,
    y: window.__arena.flies[0].y,
    food: window.__arena.world.foods.length,
    events: window.__arena.world.foodEvents.length,
  }));
  result.moved = first.x !== result.after.x || first.y !== result.after.y;
  // Automatic refill is forbidden even while the simulation clock advances.
  assert.ok(result.after.food <= result.initial.foodCount);
  assert.equal(result.after.events, result.initial.foodEvents.length);
  result.foodsBeforeDedup = await page.evaluate(() => window.__arena.world.foods.length);
  await page.evaluate(() => {
    window.__arena.paused = true;
    window.__chain.ingest([window.__arena.flies[0].chain.cause]);
  });
  assert.equal(await page.evaluate(() => window.__arena.world.foods.length), result.foodsBeforeDedup);
  await page.screenshot({ path: out + '/ja.png', fullPage: true });
  await page.locator('#language').selectOption('en');
  await page.screenshot({ path: out + '/en.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: out + '/mobile.png', fullPage: true });
  // Shared bytes are the regression guard against a second environment-specific UI.
  result.assetHashes = {};
  for (const name of ['app.js', 'index.html', 'style.css']) {
    const r = await page.request.get(new URL(name, base).href);
    assert.ok(r.ok());
    const sha = (b) => createHash('sha256').update(b).digest('hex');
    const h = sha(await r.body());
    assert.equal(h, sha(await fs.readFile('dist/' + name)));
    result.assetHashes[name] = h;
  }
  assert.deepEqual(errors, []);
  result.passed = true;
} catch (e) {
  result.error = e.stack;
  process.exitCode = 1;
  console.error(e);
  console.error(await page.locator('#chain-summary').textContent());
} finally {
  await fs.writeFile(out + '/result.json', JSON.stringify({ ...result, errors }, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ passed: result.passed, out }));
}
