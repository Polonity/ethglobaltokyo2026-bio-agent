import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = 'http://127.0.0.1:8812',
  out = 'artifacts/ux-refresh';
await mkdir(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1600, height: 1050 }, locale: 'ja-JP' });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
const reports = [];
async function until(fn) {
  for (let i = 0; i < 500; i++) {
    const s = await fetch(base + '/api/state').then((r) => r.json());
    if (fn(s)) return s;
    await p.waitForTimeout(100);
  }
  throw Error('State timeout');
}
try {
  for (const app of ['foraging', 'market', 'aqua']) {
    await p.goto(base + '/' + app);
    await p.waitForFunction(
      () => document.querySelector('#live') && !document.querySelector('#live').disabled,
    );
    await p.selectOption('#language', 'ja');
    assert.equal(await p.locator('#details-dialog').isVisible(), false);
    await p.locator('#live').click();
    await until((s) => s.latest[app]?.phase === 'live' && s.latest[app].tick >= 12);
    await p.locator('#stop').click();
    const state = await until((s) => !s.busy);
    await p.waitForTimeout(700);
    assert.equal(state.latest[app].neural.neuronsPerIndividual, 166700);
    await p.screenshot({ path: `${out}/${app}-desktop-ja.png` });
    const cardText = await p.locator('#cards').innerText();
    if (app === 'market') {
      assert(cardText.includes(state.display.market[1].symbol));
      assert(!cardText.includes('ETH'));
    }
    if (app === 'aqua') {
      assert(cardText.includes('%') || cardText.includes('提示なし'));
      assert((await p.locator('#proxy-caption').innerText()).includes('Uniswap'));
    }
    await p.locator('#open-details').click();
    await p.locator('[data-pane="evidence"]').click();
    await p.locator('#tx a').first().click();
    await p.waitForFunction(() => document.querySelector('#receipt-body').innerText.includes('成功'));
    await p.screenshot({ path: `${out}/${app}-receipt-ja.png` });
    await p.locator('#close-receipt').click();
    await p.locator('#close-details').click();
    assert.equal(await p.locator('#details-dialog').isVisible(), false);
    await p.selectOption('#language', 'en');
    await p.screenshot({ path: `${out}/${app}-desktop-en.png` });
    await p.setViewportSize({ width: 390, height: 844 });
    await p.screenshot({ path: `${out}/${app}-mobile-en.png`, fullPage: true });
    const dims = await p.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert(dims.scroll <= dims.width + 1, JSON.stringify(dims));
    await p.locator('#open-details').click();
    await p.locator('[data-pane="help"]').click();
    await p.screenshot({ path: `${out}/${app}-help-mobile.png` });
    await p.keyboard.press('Escape');
    assert.equal(await p.locator('#details-dialog').isVisible(), false);
    reports.push({
      app,
      cardText,
      units: state.display,
      neurons: state.latest[app].neural.neuronsPerIndividual,
      mobile: dims,
    });
    await p.setViewportSize({ width: 1600, height: 1050 });
  }
  assert.deepEqual(errors, []);
  await writeFile(out + '/verification.json', JSON.stringify({ reports, errors }, null, 2));
  console.log(JSON.stringify({ apps: reports.length, errors }));
} finally {
  await b.close();
}
