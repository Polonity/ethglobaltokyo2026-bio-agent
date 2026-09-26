import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = 'http://127.0.0.1:8810';
const out = 'artifacts/malecns-full';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1450, height: 1150 }, locale: 'en-US' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const evidence = { base, cases: [] };
try {
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('#neurons').textContent === '166,700');
  await page.locator('#lang').selectOption('en');
  const action = async (name) => {
    const response = page.waitForResponse((r) => r.url() === base + '/api/' + name);
    await page.locator('#' + name).click();
    const r = await response;
    assert.equal(r.status(), 200);
    await page.waitForFunction(() => !document.querySelector('#advance').disabled);
    return r.json();
  };
  await action('reset');
  await page.locator('#channel').selectOption('cb_sensory');
  await page.locator('#steps').selectOption('32');
  const first = (await action('advance')).last;
  assert.equal(first.neuronsPerAgent, 166700);
  assert.equal(first.connections, 25582938);
  assert.equal(first.agents, 2);
  assert.ok(first.motorMean[0] < first.motorMean[1]);
  assert.ok(first['activeAbove1e-12'].every((n) => n > 160000));
  evidence.cases.push(first);
  await action('save');
  const next = (await action('advance')).last;
  await action('restore');
  const replay = (await action('advance')).last;
  assert.deepEqual(next.motorMean, replay.motorMean);
  assert.deepEqual(next.groups, replay.groups);
  evidence.checkpointReplay = 'exact';
  await page.locator('#continuous').click();
  await page.waitForFunction(
    () => /render (?:2[89]|3[01])\./.test(document.querySelector('#rates').textContent),
    null,
    { timeout: 15000 },
  );
  await page.waitForTimeout(3500);
  evidence.continuousRates = await page.locator('#rates').textContent();
  evidence.continuousTick = (await (await page.request.get(base + '/api/state')).json()).last.tick;
  assert.ok(evidence.continuousTick > replay.tick + 30);
  await page.locator('#continuous').click();
  await page.waitForFunction(() => !document.querySelector('#advance').disabled);
  await page.screenshot({ path: out + '/full-local-en.png', fullPage: true });
  await page.locator('#lang').selectOption('ja');
  assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
  assert.equal(await page.locator('h1').textContent(), '全神経で、ハエを動かす。');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: out + '/full-local-ja-mobile.png', fullPage: true });
  await page.locator('#lang').selectOption('system');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  // Actual rejection paths through the local API.
  for (const [data, status] of [
    [{ steps: 129 }, 400],
    [{ stimuli: [0, 2, 1] }, 400],
  ]) {
    const r = await page.request.post(base + '/api/advance', { data });
    assert.equal(r.status(), status);
  }
  const foreign = await page.request.post(base + '/api/reset', {
    headers: { Origin: 'https://example.org' },
    data: {},
  });
  assert.equal(foreign.status(), 403);
  assert.deepEqual(errors, []);
  evidence.browserErrors = errors;
  evidence.languages = ['system', 'en', 'ja'];
  evidence.mobileOverflow = false;
  await writeFile(out + '/browser-evidence.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log(
    'Full MaleCNS browser: actual 166,700 × 2 inference and continuous render, replay, languages, mobile and rejection checks passed.',
  );
} finally {
  await browser.close();
}
