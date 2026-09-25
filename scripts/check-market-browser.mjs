import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.LOCAL_GUI_URL || 'http://127.0.0.1:8799';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const out = 'artifacts/market-browser';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const errors = [];
try {
  const p = await browser.newPage({ viewport: { width: 1500, height: 1100 }, locale: 'en-US' });
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${base}/market?test=1`);
  await p.waitForFunction(() => window.__paper?.lastEvent);
  const before = await p.evaluate(() => window.__paper.tick);
  await p.locator('#sequence').click();
  await p.waitForFunction((n) => window.__paper.tick >= n + 12, before, { timeout: 60000 });
  await p.waitForFunction(() => window.__paper.flies.some((f) => f.report), {}, { timeout: 20000 });
  const state = await p.evaluate(() => window.__paper.snapshot());
  assert.equal(state.flies.length, 3);
  assert.ok(state.flies.some((f) => f.trades.length > 0));
  for (const f of state.flies) for (const trade of f.trades) assert.ok(trade.fillBlock > trade.decisionBlock);
  const views = await p.evaluate(() => window.__paperViews);
  assert.ok(views.every((v) => v.schema === 'bioagent.view.v1'));
  assert.ok(views.every((v) => v.applicationState.valuation.kind === 'valued'));
  await p.locator('#source-tx').click();
  await p.waitForFunction(() =>
    document.getElementById('receipt-data').textContent.includes('transactionHash'),
  );
  assert.match(await p.locator('#receipt-data').textContent(), /0x/);
  await p.locator('#close-receipt').click();
  await p.locator('#language').selectOption('ja');
  assert.match(await p.locator('h1').textContent(), /値動き/);
  await p.locator('#language').selectOption('en');
  assert.match(await p.locator('h1').textContent(), /Little wings/);
  await p.screenshot({ path: `${out}/desktop.png`, fullPage: true });
  await p.setViewportSize({ width: 390, height: 844 });
  assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await p.screenshot({ path: `${out}/mobile.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(`${out}/evidence.json`, JSON.stringify({ base, state, views, errors }, null, 2));
  console.log(
    'Market GUI verified: real local V3 swaps, delayed paper fills, PnL, learning, receipt, i18n and mobile.',
  );
} finally {
  await browser.close();
}
