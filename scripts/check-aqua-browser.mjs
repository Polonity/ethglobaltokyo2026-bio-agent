import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.LOCAL_GUI_URL || 'http://127.0.0.1:8799';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Local only');
const out = 'artifacts/aqua-browser';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 }, locale: 'en-US' });
const page = await ctx.newPage(),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto(base + '/aqua');
  await page.waitForFunction(() => window.__aqua?.snapshot().online);
  await page.locator('#language').selectOption('en');
  const snap = () => page.evaluate(() => window.__aqua.snapshot());
  const settle = () => page.waitForFunction(() => !window.__aqua.snapshot().busy);
  async function send(id, value) {
    await page.locator('#agent').selectOption(String(id));
    await page.locator('#stimulus').fill(String(value));
    await page.locator('#send').click();
    await settle();
    const s = await snap();
    assert.equal(s.error, '');
    return s;
  }
  let s;
  for (let id = 1; id <= 3; id++) s = await send(id, 0);
  assert.equal(s.state.agents.filter((a) => a.active.some((s) => s.current)).length, 3);
  assert.deepEqual(
    s.state.balances.map((b) => b.aqua),
    ['0.0', '0.0'],
  );
  const before = s.state.balances.map((b) => b.maker);
  await page.screenshot({ path: out + '/shared-wallet.png', fullPage: true });
  await page.locator('#fill').click();
  await settle();
  s = await snap();
  assert.equal(s.error, '');
  assert.equal(Number(s.state.balances[0].maker), Number(before[0]) + 1);
  assert.equal(Number(s.state.balances[1].maker), Number(before[1]) - 0.997);
  s = await send(2, 40);
  assert.equal(s.state.agents[1].decision.action, 'cautious');
  assert.equal(s.state.agents[1].active[0].balances[1], '40.0');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: out + '/cautious.png', fullPage: true });
  s = await send(2, 100);
  assert.equal(s.state.agents[1].decision.action, 'dock');
  assert.equal(s.state.agents[1].active.length, 0);
  assert.equal(await page.locator('#fill').isDisabled(), true);
  assert.equal(s.state.agents[1].decision.control.final.response, 0);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: out + '/danger.png', fullPage: true });
  await page.locator('#transactions button').first().click();
  await page.waitForFunction(() =>
    document.querySelector('#receipt-data').textContent.includes('"status": "0x1"'),
  );
  await page.locator('#close').click();
  // Same-origin write protection and revision guard.
  const denied = await page.request.post(base + '/api/aqua/apply', {
    headers: { Origin: 'https://example.com' },
    data: { agentId: 1, revision: s.state.agents[0].revision },
  });
  assert.equal(denied.status(), 403);
  const stale = await page.request.post(base + '/api/aqua/apply', {
    headers: { Origin: base },
    data: { agentId: 1, revision: '0' },
  });
  assert.equal(stale.status(), 409);
  // Repeated application must not generate another transaction.
  const retry = await page.request.post(base + '/api/aqua/apply', {
    headers: { Origin: base },
    data: { agentId: 1, revision: s.state.agents[0].revision },
  });
  assert.equal(retry.status(), 200);
  assert.equal((await retry.json()).transactions.length, 0);
  await page.locator('#language').selectOption('ja');
  assert.match(await page.locator('h1').textContent(), /流動性/);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: out + '/mobile.png', fullPage: true });
  const bad = await ctx.newPage();
  await bad.route('**/models/aqua/male-cns-slice.json', (r) => r.fulfill({ status: 200, body: '{}' }));
  await bad.goto(base + '/aqua');
  await bad.waitForFunction(() => window.__aqua?.snapshot().error.includes('digest mismatch'));
  assert.equal(await bad.locator('#send').isDisabled(), true);
  assert.deepEqual(errors, []);
  await writeFile(
    out + '/evidence.json',
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        checks: [
          'three shared offers',
          'actual swap',
          'cautious replacement',
          'danger dock',
          'receipt',
          'cross-origin denied',
          'stale revision rejected',
          'idempotent apply',
          'ja/mobile',
          'artifact tamper rejected',
        ],
        state: s,
        errors,
      },
      null,
      2,
    ),
  );
  console.log('Aqua browser checks passed');
} finally {
  await browser.close();
}
