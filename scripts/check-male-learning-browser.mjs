import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.LOCAL_GUI_URL || 'http://127.0.0.1:8800';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const out = 'artifacts/male-learning';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1500, height: 1100 }, locale: 'en-US' });
const errors = [];
context.on('page', (p) => p.on('pageerror', (e) => errors.push(e.message)));
const evidence = { base };
try {
  const p = await context.newPage();
  await p.goto(base + '/?test=1');
  await p.waitForFunction(() => window.__chain?.ready && window.__arena.time > 0.5);
  await p.locator('#train-selected').click();
  await p.waitForFunction(() => window.__arena.flies[0].lastReport);
  const forage = await p.evaluate(() => ({ f: window.__arena.flies[0], time: window.__arena.time }));
  assert.equal(forage.f.lastReport.steps, 960);
  assert.equal(forage.f.observation.connectome.dataset, 'male-cns:v1.0');
  await p.waitForFunction(
    () => window.__arena.flies[0].lastTransition.policyVersion === window.__arena.flies[0].version,
  );
  evidence.foraging = {
    report: forage.f.lastReport,
    neural: forage.f.observation.neural,
    version: forage.f.version,
  };
  await p.screenshot({ path: out + '/foraging.png', fullPage: true });
  await p.reload();
  await p.waitForFunction(() => window.__chain?.ready);
  assert.equal(await p.evaluate(() => window.__arena.flies[0].version), forage.f.version);
  const market = await context.newPage();
  await market.goto(base + '/market?test=1');
  await market.waitForFunction(() => window.__paper?.lastEvent);
  await market.locator('#sequence').click();
  await market.waitForFunction(() => window.__paper.flies.some((f) => f.report), null, { timeout: 30000 });
  evidence.market = await market.evaluate(() => window.__paper.snapshot());
  assert.ok(evidence.market.flies.some((f) => f.neural?.some((x) => x > 0)));
  assert.ok(evidence.market.flies.some((f) => f.report?.model));
  await market.screenshot({ path: out + '/market.png', fullPage: true });
  const aqua = await context.newPage();
  await aqua.goto(base + '/aqua');
  await aqua.waitForFunction(() => window.__aqua?.snapshot().online);
  await aqua.locator('#agent').selectOption('2');
  await aqua.locator('#stimulus').fill('20');
  await aqua.locator('#send').click();
  await aqua.waitForFunction(() => !window.__aqua.snapshot().busy);
  let s = await aqua.evaluate(() => window.__aqua.snapshot());
  assert.equal(s.error, '');
  const before = s.state.agents[1];
  await aqua.locator('#train').click();
  await aqua.waitForFunction(() => !window.__aqua.snapshot().busy);
  s = await aqua.evaluate(() => window.__aqua.snapshot());
  assert.equal(s.error, '');
  const after = s.state.agents[1];
  assert.ok(after.policy.report);
  assert.ok(after.policy.report.after < after.policy.report.before);
  if (before.policy.version === 1) {
    assert.equal(after.policy.version, 2);
    assert.notEqual(after.active[0].strategyHash, before.active[0].strategyHash);
    assert.notEqual(after.active[0].spreadBps, before.active[0].spreadBps);
  }
  assert.equal(after.active[0].policyHash, after.policyHash);
  evidence.aqua = { before, after, transactions: s.transactions };
  await aqua.screenshot({ path: out + '/aqua-trained.png', fullPage: true });
  await aqua.reload();
  await aqua.waitForFunction(() => window.__aqua?.snapshot().online);
  assert.equal(
    (await aqua.evaluate(() => window.__aqua.snapshot())).state.agents[1].policy.version,
    after.policy.version,
  );
  // Missing/modified measured graph must stop both games, never fall back to a synthetic agent.
  for (const route of ['/?test=1', '/market?test=1']) {
    const bad = await context.newPage();
    await bad.route('**/models/male-cns/male-cns-slice.json', (r) => r.fulfill({ status: 200, body: '{}' }));
    await bad.goto(base + route);
    await bad.waitForTimeout(800);
    if (route.startsWith('/?')) {
      assert.equal(await bad.evaluate(() => window.__arena.time), 0);
      assert.equal(await bad.evaluate(() => window.__chain.ready), false);
    } else assert.equal(await bad.evaluate(() => window.__paper.lastEvent), null);
  }
  assert.deepEqual(errors, []);
  evidence.errors = errors;
  await writeFile(out + '/browser-evidence.json', JSON.stringify(evidence, null, 2));
  console.log('MaleCNS learning verified in all three live apps, persisted and fail-closed.');
} finally {
  await browser.close();
}
