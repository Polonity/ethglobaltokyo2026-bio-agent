import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const url = 'http://127.0.0.1:8814';
const out = process.env.SHARED_EVIDENCE_DIR || 'artifacts/shared-market';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(
    () =>
      document.querySelector('#price').textContent.includes('POLLEN') ||
      document.querySelector('#price').textContent.includes('NECTAR'),
  );
  let s = await (await fetch(url + '/api/state')).json();
  assert.equal(s.running, false, 'Finish the existing run before verification');
  const initial = s.tick;
  const response = await page.evaluate(async () => {
    const r = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticks: 12 }),
    });
    return r.status;
  });
  assert.equal(response, 202);
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    s = await (await fetch(url + '/api/state')).json();
    if (s.error || (!s.running && s.tick >= initial + 12)) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  s = await (await fetch(url + '/api/state')).json();
  assert.equal(s.error, null);
  assert.equal(s.tick, initial + 12);
  assert.equal(s.flies.length, 4);
  assert.equal(s.metrics.neuronsPerFly, 166700);
  assert(s.metrics.connections > 25000000);
  assert(s.flies.every((f) => f.updates >= 12));
  assert(s.routes.Aqua > 0);
  assert(
    s.routes['Uniswap V3'] > 0,
    'Natural route comparison should exercise both venues in this seeded run',
  );
  const txs = s.transactions.filter((x) => x.kind === 'swap');
  assert(txs.length > 0);
  for (const tx of txs) {
    const receipt = await (await fetch(url + '/api/tx/' + tx.hash)).json();
    assert.equal(receipt.status, 1);
    assert(receipt.logs.length > 0);
    assert(Number(tx.amountOut) > 0);
  }
  await page.screenshot({ path: out + '/shared-market-en.png', fullPage: true });
  await page.locator('[data-tx]').first().click();
  await page.locator('#modal').waitFor({ state: 'visible' });
  await page.screenshot({ path: out + '/shared-market-receipt.png' });
  await page.locator('#close').click();
  await page.locator('#language').selectOption('ja');
  await page.locator('#help').click();
  await page.screenshot({ path: out + '/shared-market-help-ja.png' });
  await page.locator('#close').click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: out + '/shared-market-mobile.png', fullPage: true });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
    'Mobile overflow',
  );
  assert.deepEqual(errors, []);
  await writeFile(
    out + '/verification.json',
    JSON.stringify({ checkedAt: new Date().toISOString(), state: s, browserErrors: errors }, null, 2),
  );
  console.log(JSON.stringify({ ticks: s.tick, routes: s.routes, metrics: s.metrics, pnl: s.pnl }));
} finally {
  await browser.close();
}
