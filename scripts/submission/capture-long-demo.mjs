import { chromium } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const out = 'artifacts/presenter-long',
  url = 'http://127.0.0.1:8858';
await mkdir(out + '/raw', { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const state = async () => (await fetch(url + '/api/state')).json();
const evidence = {
  recordedAt: new Date().toISOString(),
  clips: {},
  scope:
    'Fresh GUI capture of the existing trained full-neuron policy. Market footage is a separately verified earlier recording.',
};
async function record(id, action) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 960 },
    recordVideo: { dir: out + '/raw', size: { width: 1920, height: 960 } },
  });
  await context.addInitScript(() => {
    if (location.protocol === 'http:') localStorage.setItem('full-app-language', 'en');
  });
  const page = await context.newPage(),
    video = page.video(),
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url + '/foraging');
  await page.locator('#language').selectOption('en');
  await page.waitForTimeout(500);
  const before = await state();
  await action(page);
  const after = await state();
  await page.screenshot({ path: out + `/${id}.png` });
  assert.deepEqual(errors, []);
  await context.close();
  const file = await video.path();
  const duration = Number(
    execFileSync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=nw=1:nk=1',
      file,
    ]),
  );
  evidence.clips[id] = { file, duration, before, after, errors };
  await writeFile(out + '/gui-evidence.json', JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ id, duration, file }));
}
try {
  // Set up a confirmed world and pause between actions for the introduction.
  await fetch(url + '/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: url },
    body: JSON.stringify({ app: 'foraging', variant: 'full', operation: 'live', stimulus: 0.5 }),
  });
  for (let i = 0; i < 100; i++) {
    const s = await state();
    if (s.latest.foraging?.tick >= 2) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await fetch(url + '/api/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: url },
    body: '{}',
  });
  for (let i = 0; i < 100; i++) {
    if (!(await state()).busy) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await record('purpose', async (p) => {
    await p.waitForTimeout(23000);
  });
  await record('inputs', async (p) => {
    await p.locator('#open-details').click();
    await p.locator('[data-pane="evidence"]').click();
    await p.locator('#environment-proof').waitFor();
    await p.waitForTimeout(13500);
    await p.locator('#tx a').first().click();
    await p.waitForFunction(() => document.querySelector('#receipt-body').textContent.includes('Success'));
    await p.waitForTimeout(14500);
  });
  await record('behavior', async (p) => {
    await p.locator('#live').click();
    await p.waitForTimeout(700);
    for (let i = 0; i < 300; i++) {
      const s = await state();
      if (!s.busy) break;
      await p.waitForTimeout(200);
    }
    const s = await state();
    assert.equal(s.latest.foraging.phase, 'complete');
    assert.deepEqual(s.latest.foraging.result.versions, [2, 2]);
    await p.waitForTimeout(2000);
  });
  await record('learning', async (p) => {
    await p.locator('#open-details').click();
    await p.locator('[data-pane="learning"]').click();
    await p.waitForTimeout(28000);
  });
  await record('results', async (p) => {
    const r = JSON.parse(await readFile('docs/submission/presenter-kit/foraging-validation.json'));
    await p.goto('about:blank');
    await p.setContent(
      `<body style="margin:0;padding:70px 90px;background:#10251f;color:#edf5f1;font:29px Arial"><p style="color:#a4cdbb">BIOAGENT / RECORDED VALIDATION / FULL 166,700 NEURONS</p><h1 style="font-size:58px">Foraging improved. Safety remains unfinished.</h1><p>12 unseen worlds · identical TX inputs · 2 agents sharing 24 food items</p><table style="width:100%;text-align:left;border-spacing:0 24px"><tr><th>Policy</th><th>Food</th><th>Toward food</th><th>Hazard steps</th></tr>${[
        ['Full connectome + readout', 'neural'],
        ['Direct-input ridge', 'direct'],
        ['Random', 'random'],
      ]
        .map(
          ([name, k]) =>
            `<tr><td>${name}</td><td>${r.models[k].collected}/24</td><td>${(r.models[k].towardFraction * 100).toFixed(1)}%</td><td>${r.models[k].hazardSteps}</td></tr>`,
        )
        .join(
          '',
        )}</table><p style="padding:20px;background:#503e26;color:#ffe2a0">Safety criterion FAILED: at most 1 hazard step per world required; maximum observed: 6.</p><p>One training run. No statistical or general biological superiority claim.</p><p style="color:#a4cdbb;font-size:21px">Source: foraging-validation.json · 2026-09-26 · local Anvil · no power measurement</p></body>`,
    );
    await p.waitForTimeout(31000);
  });
} finally {
  await browser.close();
}
