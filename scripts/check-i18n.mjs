import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const deployment = JSON.parse(await readFile('.local/deployment.json', 'utf8'));
const base = deployment.guiUrl;
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
await mkdir('artifacts/i18n', { recursive: true });
const errors = [];
try {
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/?test=1`);
  await page.waitForFunction(() => window.__chain?.ready);
  assert.equal(await page.locator('#language').inputValue(), 'system');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.match(await page.locator('#apply').textContent(), /Send stimulus/);
  await page.locator('#pause').click();
  const state = await page.evaluate(() => ({
    time: window.__arena.time,
    revision: window.__arena.flies[0].chain.revision,
  }));
  await page.locator('#language').selectOption('ja');
  assert.match(await page.locator('#apply').textContent(), /コントラクト/);
  await page.locator('#language').selectOption('en');
  assert.deepEqual(
    await page.evaluate(() => ({
      time: window.__arena.time,
      revision: window.__arena.flies[0].chain.revision,
    })),
    state,
  );
  await page.locator('[data-mode="forage"]').click();
  await page.locator('#apply').click();
  await page.waitForFunction(() => window.__chain.lastTx?.applied && !window.__chain.busy);
  assert.match(await page.locator('#tx-card-status').textContent(), /Applied to fly/);
  await page.locator('#tx-card-hash').click();
  await page.waitForFunction(() =>
    document.getElementById('transaction-data').textContent.includes('Mined successfully'),
  );
  // Programmatic selection here also verifies an already-open modal retranslates.
  await page.selectOption('#language', 'ja', { force: true });
  assert.match(await page.locator('#transaction-data').textContent(), /採掘成功/);
  await page.selectOption('#language', 'en', { force: true });
  assert.match(await page.locator('#transaction-data').textContent(), /Mined successfully/);
  await page.locator('#close-transaction').click();
  await page.locator('#train-selected').click();
  assert.match(await page.locator('#arena-status').textContent(), /pause/i);
  await page.locator('#pause').click();
  await page.waitForTimeout(400);
  assert.match(await page.locator('#arena-status').textContent(), /learning/);
  await page.screenshot({ path: 'artifacts/i18n/english.png', fullPage: true });
  const untranslated = await page.evaluate(() => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    const output = [];
    while ((n = w.nextNode()))
      if (!n.parentElement.closest('[data-no-i18n],script,style') && /[ぁ-んァ-ヶ一-龯]/.test(n.textContent))
        output.push(n.textContent.trim());
    return output;
  });
  await writeFile('artifacts/i18n/untranslated.json', JSON.stringify(untranslated, null, 2));
  assert.deepEqual(untranslated, []);
  await page.reload();
  await page.waitForFunction(() => window.__chain?.ready);
  assert.equal(await page.locator('#language').inputValue(), 'en');
  await page.locator('#language').selectOption('ja');
  await page.reload();
  await page.waitForFunction(() => window.__chain?.ready);
  assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
  await page.locator('#language').selectOption('system');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/i18n/mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await context.close();
  for (const locale of ['ja-JP', 'fr-FR']) {
    const c = await browser.newContext({ locale });
    const p = await c.newPage();
    await p.goto(base);
    await p.waitForFunction(() => document.getElementById('apply').disabled === false);
    assert.equal(await p.locator('html').getAttribute('lang'), locale === 'ja-JP' ? 'ja' : 'en');
    await c.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    'System locale, fallback, live switch, state preservation, persistence, receipt, learning and mobile checks passed',
  );
} finally {
  await browser.close();
}
