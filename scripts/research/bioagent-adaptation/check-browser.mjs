import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createLabServer } from './serve.mjs';
const out = 'artifacts/bioagent-adaptation-20260926';
const server = createLabServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const errors = [],
  failedRequests = [],
  result = { tasks: [] };
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) failedRequests.push({ url: r.url(), status: r.status() });
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => document.querySelector('#evidence').textContent.includes('56.12'));
  for (const task of ['foraging', 'aqua']) {
    await page.locator('#task').selectOption(task);
    await page.locator('#step').click();
    await page.locator('#train').click();
    await page.locator('#evaluate').click();
    const evaluation = JSON.parse(await page.locator('#comparison').textContent());
    assert.equal(evaluation.gate.passed, true, `${task} interactive gate`);
    await page.locator('#adopt').click();
    assert.match(await page.locator('#phase').textContent(), /v2/);
    await page.locator('#save').click();
    await page.waitForFunction(() => !document.querySelector('#restore').disabled);
    await page.locator('#step').click();
    await page.locator('#restore').click();
    await page.waitForFunction(() => document.querySelector('#phase').textContent.includes('復元'));
    await page.locator('#stimulus').fill('9000');
    await page.locator('#stimulus').dispatchEvent('input');
    await page.locator('#step').click();
    const decision = JSON.parse(await page.locator('#decision').textContent());
    assert.equal(decision.policyVersion, 2);
    if (task === 'aqua') assert.equal(decision.action, 'dock');
    result.tasks.push({ task, adopted: true, restored: true, decision, evaluation });
  }
  await page.locator('#replay').click();
  await page.waitForFunction(() =>
    document.querySelector('#chain-result').textContent.includes('archived-local-EVM-replay'),
  );
  const replay = JSON.parse(await page.locator('#chain-result').textContent());
  assert.equal(replay.decisions.length, 6);
  const chain = JSON.parse(await fs.readFile(`${out}/chain.json`, 'utf8'));
  for (const record of replay.decisions) {
    const expected = chain.traces
      .find((x) => x.observation.status.revision === record.revision)
      .outputs.find((o) => o.binding.task === record.task);
    assert.deepEqual(record.decision, expected.decision);
    assert.deepEqual(record.policy, expected.policy);
  }
  result.archivedChainReplay = { decisions: 6, exactMatch: true };
  await page.locator('#task').selectOption('foraging');
  await page.locator('#language').click();
  assert.match(await page.locator('#title').textContent(), /One framework/);
  await page.screenshot({ path: `${out}/framework-lab-en.png`, fullPage: true });
  await page.locator('#language').click();
  await page.screenshot({ path: `${out}/framework-lab-ja.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  result.mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(result.mobileOverflow, false);
  await page.screenshot({ path: `${out}/framework-lab-mobile.png`, fullPage: true });
  assert.deepEqual(errors, []);
  assert.deepEqual(failedRequests, []);
  Object.assign(result, { passed: true, errors, failedRequests });
  await fs.writeFile(`${out}/browser.json`, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify({
      passed: true,
      tasks: result.tasks.map((x) => x.task),
      ...result.archivedChainReplay,
      mobileOverflow: result.mobileOverflow,
    }),
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
