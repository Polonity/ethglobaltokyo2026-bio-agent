import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'apps/frontend/guides/screens';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const report = [];
const targets = {
  full: ['#live', '#arena', '#cards', '#tx'],
  foraging: ['.control-panel', '#arena canvas', '#body-readout', '.chain-panel'],
  market: ['.controls', '#field', '#cards', '.connection'],
  aqua: ['#send', '#brain', '#flies', '.evidence'],
};
try {
  for (const mode of ['full', 'browser'])
    for (const app of ['foraging', 'market', 'aqua']) {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, locale: 'en-US' });
      await page.goto(
        (mode === 'full' ? 'http://127.0.0.1:8812' : 'http://127.0.0.1:8800') +
          (app === 'foraging' ? '/' : '/' + app),
      );
      await page.waitForFunction(() => typeof document.querySelector('#language')?.onchange === 'function');
      for (const lang of ['ja', 'en']) {
        await page.selectOption('#language', lang);
        await page.waitForTimeout(800);
        for (const [index, selector] of (mode === 'full' ? targets.full : targets[app]).entries()) {
          const loc = page.locator(selector).first();
          await loc.waitFor();
          const name = `${mode}-${app}-${lang}-${index + 1}.png`;
          await loc.screenshot({ path: out + '/' + name });
          report.push({ file: name, selector, url: page.url(), capturedAt: new Date().toISOString() });
        }
      }
      await page.close();
    }
} finally {
  await browser.close();
}
await writeFile(out + '/manifest.json', JSON.stringify(report, null, 2));
console.log('Captured ' + report.length + ' actual UI regions.');
