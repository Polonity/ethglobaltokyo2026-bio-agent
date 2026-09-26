import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ locale: 'ja-JP', viewport: { width: 390, height: 844 } }),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:8812/aqua');
  await page.waitForFunction(() => document.documentElement.lang === 'ja');
  assert.equal(await page.locator('#language').inputValue(), 'system');
  await page.selectOption('#language', 'en');
  await page.reload();
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  await page.selectOption('#language', 'ja');
  await page.waitForFunction(() => document.documentElement.lang === 'ja');
  const sizes = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  assert(sizes.scroll <= sizes.client + 1);
  const bad = await page.request.post('http://127.0.0.1:8812/api/run', {
    headers: { Origin: 'https://example.invalid' },
    data: { app: 'aqua', variant: 'full', operation: 'live' },
  });
  assert.equal(bad.status(), 403);
  await page.screenshot({ path: 'artifacts/full-apps/mobile-ja-gui.png', fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/full-apps/ui-verification.json',
    JSON.stringify(
      {
        systemJapanese: true,
        englishPersists: true,
        japanese: true,
        mobile: sizes,
        crossOriginMutationStatus: bad.status(),
        browserErrors: errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('System/en/ja, persistence, mobile overflow and origin guard passed.');
} finally {
  await browser.close();
}
