import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = 'http://127.0.0.1:8812';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, locale: 'en-US' });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const evidence = { schema: 'bioagent.full-apps-browser.v1', startedAt: new Date().toISOString(), runs: [] };
await mkdir('artifacts/full-apps', { recursive: true });
try {
  await page.goto(base);
  await page.locator('#connection').filter({ hasText: 'Anvil' }).waitFor();
  for (const app of ['foraging', 'market', 'aqua']) {
    await page.locator(`[data-app="${app}"]`).click();
    for (const variant of ['full', 'legacy']) {
      await page.selectOption('#variant', variant);
      for (let attempt = 0; attempt < 3; attempt++) {
        const existing = await page.evaluate(() => fetch('/api/state').then((r) => r.json()));
        const restored = existing.reports[`${app}:${variant}`]?.versions.some((v) => v >= 2);
        await page.locator(restored ? '#live' : '#learn').click();
        await page.waitForFunction(() => document.querySelector('#learn').disabled);
        const phases = new Set();
        let result;
        for (let poll = 0; poll < 900; poll++) {
          const state = await page.evaluate(() => fetch('/api/state').then((r) => r.json()));
          const current = state.latest[app];
          if (current?.phase) phases.add(current.phase);
          if (current?.phase === 'error') throw Error(current.error);
          if (!state.busy) {
            result = state;
            break;
          }
          if (poll % 20 === 0)
            console.log(
              JSON.stringify({ app, variant, attempt, phase: current?.phase, tick: current?.tick }),
            );
          await page.waitForTimeout(500);
        }
        assert(result, 'Job timeout');
        const report = result.reports[`${app}:${variant}`];
        assert(report);
        assert.equal(report.neurons, variant === 'full' ? 166700 : 7);
        if (restored) assert.deepEqual(result.latest[app].result.versions, report.versions);
        const entry = { app, variant, attempt, restored, phases: [...phases], report };
        evidence.runs.push(entry);
        await page.screenshot({ path: `artifacts/full-apps/${app}-${variant}-gui.png`, fullPage: true });
        await writeFile(
          'artifacts/full-apps/browser-verification.json',
          JSON.stringify(evidence, null, 2) + '\n',
        );
        console.log(JSON.stringify(entry));
        if (report.versions.some((v) => v >= 2)) break;
        if (attempt === 2) throw Error(`No behavioral improvement: ${app}/${variant}`);
      }
      assert((await page.locator('#tx a').count()) > 0, 'TX receipt links missing');
      const href = await page.locator('#tx a').first().getAttribute('href');
      const receipt = await page.evaluate((h) => fetch(h).then((r) => r.json()), href);
      assert.equal(receipt.status, 1);
    }
  }
  const state = await page.evaluate(() => fetch('/api/state').then((r) => r.json()));
  evidence.brain = state.descriptor;
  evidence.reports = state.reports;
  assert.equal(Object.keys(state.reports).length, 6);
  assert.deepEqual(errors, []);
  evidence.browserErrors = errors;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/full-apps/mobile-gui.png', fullPage: true });
  evidence.completedAt = new Date().toISOString();
  await writeFile('artifacts/full-apps/browser-verification.json', JSON.stringify(evidence, null, 2) + '\n');
  console.log('All three full-population and reduced GUI learning loops verified.');
} finally {
  await browser.close();
}
