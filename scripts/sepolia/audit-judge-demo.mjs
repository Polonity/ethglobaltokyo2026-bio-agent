import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
const out = process.env.DEMO_AUDIT_OUT || 'artifacts/sepolia/judge-review-final';
await fs.mkdir(out, { recursive: true });
const url =
  process.env.DEMO_URL || 'https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/?lang=en';
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, acceptDownloads: true });
const result = {
  testedAt: new Date().toISOString(),
  url,
  writes: [],
  errors: [],
  browser: browser.version(),
};
page.on('pageerror', (e) => result.errors.push(e.message));
const metrics = () =>
  page.evaluate(() =>
    Object.fromEntries(
      ['live', 'action', 'food', 'body-energy', 'policy', 'revision', 'block', 'notice'].map((id) => [
        id,
        document.getElementById(id).textContent,
      ]),
    ),
  );
async function exportDecision(name) {
  const pending = page.waitForEvent('download');
  await page.locator('#export').click();
  const d = await pending;
  await d.saveAs(`${out}/${name}.json`);
  return JSON.parse(await fs.readFile(`${out}/${name}.json`, 'utf8'));
}
try {
  const start = performance.now();
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
  result.firstReadyMs = performance.now() - start;
  result.initial = await metrics();
  result.learningButtonPosition = await page.locator('#learn').boundingBox();
  result.viewportHeight = 768;
  result.startLinkPosition = await page.locator('#start-learning').boundingBox();
  assert.ok(result.startLinkPosition.y + result.startLinkPosition.height < 768);
  await page.locator('#start-learning').click();
  const learnedButton = await page.locator('#learn').boundingBox();
  assert.ok(learnedButton.y >= 0 && learnedButton.y < 768, 'intro link reaches learning');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${out}/initial-en.jpg`, type: 'jpeg', quality: 85 });
  await page.waitForTimeout(6000);
  result.baseline = await metrics();
  const trainingStart = performance.now();
  await page.locator('#learn').click();
  await page.waitForFunction(
    () => !document.querySelector('#learn').disabled && document.querySelector('#learning-result table'),
  );
  result.trainingInteractionMs = performance.now() - trainingStart;
  await page.waitForFunction(() => document.body.dataset.policy === '2');
  result.trainedEvidence = await exportDecision('trained-decision');
  await page.screenshot({ path: `${out}/learning-en.jpg`, type: 'jpeg', quality: 85 });
  result.trained = await metrics();
  await page.locator('#arena').scrollIntoViewIfNeeded();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(5000);
    (result.progress ??= []).push(await metrics());
  }
  await page.screenshot({ path: `${out}/moving-en.jpg`, type: 'jpeg', quality: 85 });
  assert.ok(
    Number(result.progress.at(-1).food) > Number(result.trained.food),
    'trained fly collects food in live UI',
  );
  console.log(
    JSON.stringify({
      stage: 'live-learning',
      firstReadyMs: result.firstReadyMs,
      trainingInteractionMs: result.trainingInteractionMs,
      progress: result.progress,
    }),
  );
  // Fixed demo seeds: repeating identical search should retain the policy, not fabricate improvement.
  await page.locator('#learn').click();
  await page.waitForFunction(
    () =>
      !document.querySelector('#learn').disabled &&
      /Criteria failed/.test(document.querySelector('#learning-result').textContent),
  );
  result.repeatLearning = await page.locator('#learning-result').innerText();
  assert.equal(await page.locator('body').getAttribute('data-policy'), '2');
  await page.reload();
  await page.waitForFunction(
    () => document.body.dataset.ready === 'true' && document.body.dataset.policy === '2',
  );
  result.restored = await metrics();
  result.restoredEvidence = await exportDecision('restored-decision');
  assert.equal(result.restoredEvidence.policy.sha256, result.trainedEvidence.policy.sha256);
  await page.locator('#connect').click();
  result.noWalletMessage = await page.locator('#notice').innerText();
  assert.match(result.noWalletMessage, /wallet is required/);
  await page.locator('#agent-id').fill('999999999');
  await page.locator('#load').click();
  await page.waitForFunction(
    () => !document.querySelector('#load').disabled && document.body.dataset.ready === 'false',
  );
  result.invalidAgent = await metrics();
  assert.equal(result.invalidAgent.live, 'UNAVAILABLE');
  assert.equal(result.invalidAgent.revision, '—');
  assert.equal(result.invalidAgent.policy, '—');
  assert.match(result.invalidAgent.notice, /not found.*Load ID 1/);
  await page.locator('#agent-id').fill('1');
  await page.locator('#load').click();
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  result.recoveredFromInvalidAgent = true;
  // Fault injection is confined to this browser clock, not the public RPC or blockchain.
  await page.evaluate(() => {
    window.auditOriginalNow = Date.now;
    Date.now = () => window.auditOriginalNow() + 180000;
  });
  await page.waitForFunction(() => document.querySelector('#live').textContent === 'PAUSED');
  result.stalePause = await metrics();
  await page.evaluate(() => {
    Date.now = window.auditOriginalNow;
  });
  await page.locator('#refresh').click();
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  result.recoveredFromStale = await metrics();
  assert.match(result.recoveredFromStale.notice, /Live Sepolia state received/);
  // Descriptive holdout/control experiment using modules served by the actual public Worker.
  result.holdout = await page.evaluate(
    async ({ policy, status }) => {
      const m = await import('/packages/bio_agent/research/adaptive-forager.js');
      const profile = {
        name: 'current-chain-profile',
        energy: status.energy / 10000,
        stimulus: status.stimulus / 10000,
        mode: ['rest', 'explore', 'forage'][status.activity],
      };
      const seeds = Array.from({ length: 20 }, (_, i) => 900101 + i);
      const raw = m.fitReadout(
        { ...m.initialPolicy(), encoder: 'raw' },
        { seed: 6217, seeds: [101, 102, 103, 104], profiles: [profile], ticks: 300, trials: 16 },
      );
      const candidates = { initial: m.initialPolicy(), trained: policy, directInputTrained: raw.policy };
      return {
        scope:
          'Exploratory synthetic 20-seed check, separate from training and UI selection; no production or biological-superiority claim.',
        seeds,
        ticks: 300,
        profile,
        policies: candidates,
        rows: Object.fromEntries(
          Object.entries(candidates).map(([key, p]) => [key, m.evaluatePolicy(p, seeds, [profile], 300)[0]]),
        ),
      };
    },
    { policy: result.trainedEvidence.policy.policy, status: result.trainedEvidence.decision.input.status },
  );
  console.log(
    JSON.stringify({
      stage: 'holdout',
      metrics: Object.fromEntries(Object.entries(result.holdout.rows).map(([k, v]) => [k, v.metrics])),
    }),
  );
  for (const lang of ['en', 'ja']) {
    await page.goto(`${url.split('?')[0]}?lang=${lang}`);
    await page.waitForFunction(() => document.body.dataset.ready === 'true');
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
    await page.screenshot({ path: `${out}/desktop-${lang}.jpg`, fullPage: true, type: 'jpeg', quality: 85 });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `${out}/mobile-${lang}.jpg`, fullPage: true, type: 'jpeg', quality: 85 });
    await page.setViewportSize({ width: 1366, height: 768 });
  }
  result.assetHashes = {};
  for (const [remote, local] of [
    ['app.js', 'apps/sepolia-lab/app.js'],
    ['style.css', 'apps/sepolia-lab/style.css'],
    ['index.html', 'apps/sepolia-lab/index.html'],
    ['packages/bio_agent/research/adaptive-forager.js', 'packages/bio_agent/research/adaptive-forager.js'],
    [
      'packages/bio_agent/connectome/male-cns-slice.json',
      'packages/bio_agent/connectome/male-cns-slice.json',
    ],
  ]) {
    const response = await page.request.get(new URL(remote, url).href);
    assert.ok(response.ok());
    const sha = (b) => '0x' + createHash('sha256').update(b).digest('hex');
    const served = sha(await response.body());
    assert.equal(served, sha(await fs.readFile(local)), `${remote}: served bytes match reviewed source`);
    result.assetHashes[remote] = served;
  }
  assert.equal(
    result.assetHashes['packages/bio_agent/connectome/male-cns-slice.json'],
    result.trainedEvidence.deployment.modelHash,
  );
  assert.deepEqual(result.errors, []);
  result.passed = true;
} catch (e) {
  result.failure = e.stack;
  process.exitCode = 1;
  await page.screenshot({ path: `${out}/failure.jpg`, fullPage: true, type: 'jpeg', quality: 85 });
} finally {
  await fs.writeFile(`${out}/audit.json`, JSON.stringify(result, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify({ passed: result.passed, failure: result.failure, out }));
}
