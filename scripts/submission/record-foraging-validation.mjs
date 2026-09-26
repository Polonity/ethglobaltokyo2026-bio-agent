import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { renderPresenterDemo } from './render-presenter-demo.mjs';
const out = 'artifacts/foraging-validation-video',
  delivery = out + '/delivery';
await mkdir(out + '/raw', { recursive: true });
const summary = JSON.parse(await readFile('docs/submission/presenter-kit/foraging-validation.json'));
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1920, height: 960 },
  recordVideo: { dir: out + '/raw', size: { width: 1920, height: 960 } },
});
await context.addInitScript(() => {
  if (location.protocol === 'http:') localStorage.setItem('full-app-language', 'en');
});
const started = Date.now(),
  page = await context.newPage(),
  video = page.video(),
  cues = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const state = async () => (await fetch('http://127.0.0.1:8858/api/state')).json();
const time = () => (Date.now() - started) / 1000;
async function shot(id, seconds, ja, en) {
  const start = time();
  await page.waitForTimeout(seconds * 1000);
  cues.push({ id, start, end: time(), ja: [ja], en: [en] });
}
try {
  await page.goto('http://127.0.0.1:8858/foraging');
  await page.locator('#language').selectOption('en');
  await page.waitForTimeout(1200);
  const initial = await state();
  assert(!initial.busy);
  await page.screenshot({ path: out + '/before.png' });
  await shot(
    'purpose',
    4,
    '修正版｜経験から餌へ近づく行動を学習',
    'Revised foraging | Learn to approach food from experience',
  );
  const start = time();
  await page.locator('#live').click();
  await page.waitForTimeout(900);
  const snapshots = [];
  for (let i = 0; i < 180; i++) {
    const s = await state();
    snapshots.push(s.latest?.foraging);
    if (!s.busy) break;
    if (i === 4) await page.screenshot({ path: out + '/approach.png' });
    await page.waitForTimeout(250);
  }
  const endState = await state();
  assert(!endState.busy);
  assert.equal(endState.latest.foraging.phase, 'complete');
  assert.deepEqual(endState.latest.foraging.result.versions, [2, 2]);
  await page.waitForTimeout(1000);
  cues.push({
    id: 'learned-live',
    start,
    end: time(),
    ja: ['学習済みv2の実行｜環境・餌は確定TXから。神経接続は固定'],
    en: ['Actual learned v2 run | Confirmed TX inputs; fixed connectome, learned readout'],
  });
  await page.screenshot({ path: out + '/collected.png' });
  await page.locator('#open-details').click();
  await page.locator('[data-pane="learning"]').click();
  await shot(
    'evaluation',
    6,
    '12配置で収集 → 6配置で採用判定 → 未使用12配置で最終テスト',
    '12 collection worlds → 6 selection worlds → 12 held-out test worlds',
  );
  await page.screenshot({ path: out + '/evaluation.png' });
  const n = summary.models.neural,
    d = summary.models.direct,
    r = summary.models.random;
  await page.goto('about:blank');
  await page.setContent(
    `<html><body style="margin:0;background:#101d25;color:#edf5f1;font:30px Arial;padding:90px"><p style="color:#8fbdac">RECORDED EXPERIMENT RESULTS · ANVIL · FULL 166,700 NEURONS</p><h1 style="font-size:60px">Foraging improved. Safety is unfinished.</h1><table style="width:100%;text-align:left;border-spacing:0 25px"><tr><th>12 held-out worlds / 2 agents</th><th>Food</th><th>Toward food</th><th>Hazard steps</th></tr>${[
      ['Full connectome + readout', n],
      ['Direct-input ridge', d],
      ['Random', r],
    ]
      .map(
        ([name, m]) =>
          `<tr><td>${name}</td><td>${m.collected} / 24</td><td>${(m.towardFraction * 100).toFixed(1)}%</td><td>${m.hazardSteps}</td></tr>`,
      )
      .join(
        '',
      )}</table><p style="color:#eac181">Safety criterion failed: at most 1 hazard step/world required; maximum observed: 6.</p><p>Small direct-input model also succeeds. Biological superiority remains unproven.</p><p style="font-size:23px;color:#9db2ac">One training run. Paired TX inputs. Final tests were not used for tuning.<br>Source: foraging-validation.json · 2026-09-26 · no power-savings claim.</p></body></html>`,
  );
  await shot(
    'results',
    12,
    '餌24/24、接近91.9%。直接入力も23/24。安全基準は未達、生物優位は未確定',
    '24/24 food; 91.9% toward food. Direct input: 23/24. Safety criterion failed; no superiority claim.',
  );
  await page.screenshot({ path: out + '/results.png' });
  assert.deepEqual(errors, []);
  const evidence = {
    schema: 'bioagent.foraging-video.v1',
    recordedAt: new Date().toISOString(),
    recordingStartedAtMilliseconds: started,
    cues,
    end: time(),
    errors,
    before: initial,
    after: endState,
    snapshots,
    summary: '../../docs/submission/presenter-kit/foraging-validation.json',
  };
  await writeFile(out + '/capture-evidence.json', JSON.stringify(evidence, null, 2));
  await context.close();
  const raw = await video.path();
  await writeFile(out + '/raw-video-path.txt', raw + '\n');
  await renderPresenterDemo({ raw, evidence, out, delivery });
  for (const lang of ['ja', 'en'])
    await rename(
      `${delivery}/bioagent-submission-${lang}.mp4`,
      `${delivery}/bioagent-foraging-validated-${lang}.mp4`,
    );
  console.log(
    JSON.stringify({
      delivery,
      live: endState.latest.foraging.result,
      snapshot: endState.latest.foraging.snapshot,
    }),
  );
} finally {
  await browser.close();
}
