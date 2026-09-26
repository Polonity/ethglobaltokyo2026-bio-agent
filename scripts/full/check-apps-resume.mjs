import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  locale: 'en-US',
  viewport: { width: 1440, height: 1050 },
  recordVideo: { dir: 'artifacts/full-apps', size: { width: 1440, height: 1050 } },
});
const page = await context.newPage();
async function waitState(predicate) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => fetch('/api/state').then((r) => r.json()));
    if (predicate(state)) return state;
    await page.waitForTimeout(100);
  }
  throw Error('Timed out waiting for an actual completed action');
}
const result = { schema: 'bioagent.full-app-resume.v1', applications: [] };
try {
  await page.goto('http://127.0.0.1:8812/');
  await page.waitForFunction(() => document.querySelector('#connection').textContent.includes('Anvil'));
  for (const app of ['foraging', 'market', 'aqua']) {
    const report = JSON.parse(await readFile(`artifacts/full-apps/${app}-full-latest.json`));
    await page.locator(`[data-app="${app}"]`).click();
    await page.selectOption('#variant', 'full');
    if (app === 'foraging')
      await page.locator('#stimulus').evaluate((el) => {
        el.value = '0.9';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    await page.locator('#live').click();
    await waitState(
      (s) => s.busy?.app === app && s.latest[app]?.phase === 'live' && s.latest[app]?.tick >= 24,
    );
    await page.locator('#stop').click();
    const state = await waitState((s) => !s.busy && s.latest[app]?.phase === 'stopped');
    const live = state.latest[app];
    assert.equal(live.phase, 'stopped');
    assert.deepEqual(
      live.decisions.map((d) => d.policyVersion),
      report.test.lastDecision.map((d) => d.policyVersion),
    );
    assert.equal(live.neural.neuronsPerIndividual, 166700);
    if (app === 'foraging')
      assert(live.outcomes.every((o) => o.source.statuses.every((s) => s.stimulus === 9000)));
    const tick = live.tick;
    await page.waitForTimeout(350);
    const after = await page.evaluate(() => fetch('/api/state').then((r) => r.json()));
    assert.equal(after.latest[app].tick, tick);
    result.applications.push({
      app,
      versions: live.decisions.map((d) => d.policyVersion),
      stoppedAfterTick: tick,
      neurons: live.neural.neuronsPerIndividual,
      policyHashes: live.decisions.map((d) => d.policyHash),
      stimulus: app === 'foraging' ? 9000 : null,
    });
  }
  await writeFile('artifacts/full-apps/resume-verification.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await context.close();
  const video = await page.video().path();
  await copyFile(video, 'artifacts/full-apps/full-apps-english-demo.webm');
  await browser.close();
}
