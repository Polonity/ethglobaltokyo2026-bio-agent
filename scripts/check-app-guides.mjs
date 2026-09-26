import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ locale: 'ja-JP', viewport: { width: 1440, height: 1100 } }),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('artifacts/app-guides', { recursive: true });
const report = { pages: [], liveTraces: [], pdfs: [] };
async function stateUntil(predicate) {
  for (let i = 0; i < 300; i++) {
    const s = await page.evaluate(() => fetch('/api/state').then((r) => r.json()));
    if (predicate(s)) return s;
    await page.waitForTimeout(100);
  }
  throw Error('Timed out waiting for actual state');
}
try {
  if (!process.argv.includes('--sheets-only'))
    for (const mode of ['full', 'browser'])
      for (const app of ['foraging', 'market', 'aqua']) {
        const base = mode === 'full' ? 'http://127.0.0.1:8812' : 'http://127.0.0.1:8800';
        await page.goto(base + (app === 'foraging' ? '/' : '/' + app));
        const guide = page.locator('[data-bio-guide]');
        await guide.locator('h3').first().waitFor();
        assert((await guide.innerText()).includes('MaleCNS'));
        await page.waitForFunction(() => typeof document.querySelector('#language').onchange === 'function');
        for (const lang of ['en', 'ja']) {
          console.log(JSON.stringify({ mode, app, lang }));
          await page.selectOption('#language', lang);
          await page.waitForFunction((l) => document.documentElement.lang === l, lang);
          await page.waitForFunction(
            ({ mode, app, lang }) =>
              document.querySelector('[data-bio-guide]')?.dataset.guideKey === `${app}:${lang}:${mode}:false`,
            { app, lang, mode },
          );
          await guide.locator('summary').first().click();
          await page.waitForFunction(() => {
            const imgs = [...document.querySelectorAll('[data-bio-guide] .guide-visuals img')];
            return (
              imgs.length === 4 &&
              imgs.every((img) => img.complete && img.naturalWidth > 0 && img.alt.length > 20)
            );
          });
          const link = await guide.locator('.guide-links a').getAttribute('href');
          assert(link.includes(`app=${app}`) && link.includes(`lang=${lang}`));
          report.pages.push({ mode, app, lang, link });
        }
        if (mode === 'full') {
          await page.locator('#live').click();
          await stateUntil(
            (s) => s.busy?.app === app && s.latest[app]?.phase === 'live' && s.latest[app].tick >= 3,
          );
          await page.locator('#stop').click();
          await stateUntil((s) => !s.busy && s.latest[app]?.phase === 'stopped');
          await guide.locator('.guide-trace a').waitFor();
          const trace = await guide.locator('.guide-trace').innerText();
          assert(trace.includes('166,700'));
          assert(trace.includes('MOMO') && trace.includes('SORA'));
          report.liveTraces.push({ app, text: trace });
          await guide.screenshot({ path: `artifacts/app-guides/${app}-inline-ja.png` });
        }
      }
  for (const app of ['foraging', 'market', 'aqua'])
    for (const lang of ['ja', 'en']) {
      await page.goto(`http://127.0.0.1:8812/guides/sheet.html?app=${app}&lang=${lang}&mode=full`);
      await page.locator('main h1').waitFor();
      assert.equal(await page.locator('details[open]').count(), 3);
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll('.guide-visuals img')].length === 4 &&
          [...document.querySelectorAll('.guide-bubbles img')].length >= 6 &&
          [...document.querySelectorAll('main img')].every((img) => img.complete && img.naturalWidth > 0),
      );
      await page.pdf({
        path: `artifacts/app-guides/${app}-${lang}.pdf`,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });
      report.pdfs.push(`${app}-${lang}.pdf`);
    }
  await page.goto('http://127.0.0.1:8812/');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-bio-guide] h3').first().waitFor();
  await page.locator('[data-bio-guide] summary').first().click();
  const size = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert(size.scroll <= size.width + 1, JSON.stringify(size));
  await page.locator('[data-bio-guide]').screenshot({ path: 'artifacts/app-guides/mobile.png' });
  assert.deepEqual(errors, []);
  report.browserErrors = errors;
  report.mobile = size;
  await writeFile(
    `artifacts/app-guides/${process.argv.includes('--sheets-only') ? 'sheets-verification' : 'verification'}.json`,
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(
    JSON.stringify({
      pages: report.pages.length,
      liveTraces: report.liveTraces.length,
      pdfs: report.pdfs.length,
      errors,
    }),
  );
} finally {
  await browser.close();
}
