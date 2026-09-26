import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const base = process.env.FULL_APPS_URL || 'http://127.0.0.1:8812';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const out = process.env.DEMO_OUTPUT || 'artifacts/full-app-demos-20260926';
const initial = await fetch(base + '/api/state').then((r) => r.json());
assert(!initial.busy, 'An existing job must finish before recording.');
await mkdir(out + '/raw', { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const titles = {
  foraging: 'Foraging: a living stimulus playground',
  market: 'Paper market: buy, sell or wait?',
  aqua: 'Aqua: offer, widen or withdraw?',
};
const activity = {
  foraging: [
    'Nectar, hazards and a changing body',
    'Yellow dots are local nectar. Energy, fullness and reserves feed the next decision.',
  ],
  market: [
    'Real price observations. Virtual trades.',
    'Confirmed local Uniswap history drives decisions; execution uses later-block paper quotes.',
  ],
  aqua: [
    'Neural decisions become Aqua operations',
    'Tight / wide / withdraw; real Anvil test-token transactions. Reward uses a price proxy.',
  ],
};
async function command(binary, args) {
  await new Promise((resolve, reject) => {
    const p = spawn(binary, args, { stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (c) => (c === 0 ? resolve() : reject(Error(`${binary}: ${c}`))));
  });
}
try {
  for (const app of Object.keys(titles)) {
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 1600, height: 1100 },
      recordVideo: { dir: out + '/raw', size: { width: 1600, height: 1100 } },
    });
    const page = await context.newPage(),
      video = page.video(),
      start = performance.now();
    const evidence = {
      app,
      base,
      language: 'en',
      chapters: [],
      errors: [],
      learning: 'Previously saved evaluations are shown; training is not rerun in this recording.',
    };
    page.on('pageerror', (e) => evidence.errors.push(e.message));
    const hold = (ms) => page.waitForTimeout(ms);
    async function caption(title, detail) {
      evidence.chapters.push({ seconds: (performance.now() - start) / 1000, title, detail });
      console.log(app + ': ' + title);
      await page.evaluate(
        ({ title, detail }) => {
          let box = document.querySelector('#recording-caption');
          if (!box) {
            box = document.createElement('div');
            box.id = 'recording-caption';
            box.style.cssText =
              'position:fixed;bottom:18px;left:36px;right:36px;z-index:99999;background:#183c35f5;color:white;border:1px solid #a8c7a4;border-radius:16px;padding:16px 24px;font:22px/1.45 system-ui;pointer-events:none;box-shadow:0 8px 30px #0003';
            document.body.append(box);
          }
          const h = document.createElement('strong'),
            p = document.createElement('div');
          h.textContent = title;
          p.textContent = detail;
          p.style.fontSize = '18px';
          box.replaceChildren(h, p);
        },
        { title, detail },
      );
    }
    async function focus(selector) {
      await page
        .locator(selector)
        .first()
        .evaluate((el) => window.scrollBy({ top: el.getBoundingClientRect().top - 65, behavior: 'smooth' }));
      await hold(800);
    }
    async function stateUntil(predicate) {
      for (let i = 0; i < 600; i++) {
        const s = await fetch(base + '/api/state').then((r) => r.json());
        if (predicate(s)) return s;
        await hold(100);
      }
      throw Error('State timeout: ' + app);
    }
    try {
      await page.goto(base + '/' + app);
      await page.selectOption('#language', 'en');
      await page.locator('#app-guide .guide-start').waitFor();
      await caption(titles[app], 'Two autonomous flies · 166,700 MaleCNS neurons per fly · local Anvil');
      await hold(4000);
      await focus('#app-guide');
      await caption(
        'Start here: the new game manual',
        'Purpose → first play → screen and body states → learning → behind the game.',
      );
      await hold(7500);
      await focus('#app-guide .guide-visuals');
      await caption(
        'Actual screenshots, directly matched to the controls',
        'Numbered screen crops explain the input control, playground, body state and blockchain evidence.',
      );
      await hold(6500);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
      await hold(800);
      if (app === 'foraging') await page.locator('#stimulus').fill('0.75');
      await caption(
        'Run the current policy',
        app === 'foraging'
          ? 'Set stimulus to 0.75. Confirmed onchain status becomes an input to the simulated nervous system.'
          : 'Replay observed price inputs through the full MaleCNS topology and learned action readout.',
      );
      await page.locator('#live').click();
      await stateUntil((s) => s.latest[app]?.phase === 'live' && s.latest[app].tick >= 4);
      await focus('#arena');
      await caption(...activity[app]);
      await hold(11000);
      const during = await fetch(base + '/api/state').then((r) => r.json());
      evidence.during = during.latest[app];
      assert.equal(evidence.during.neural.neuronsPerIndividual, 166700);
      if (during.busy) {
        await page.locator('#stop').click();
        await stateUntil((s) => !s.busy);
      }
      evidence.completed = (await fetch(base + '/api/state').then((r) => r.json())).latest[app];
      await focus('#cards');
      await caption(
        'Read each fly’s action and body state',
        'Policy versions and chosen actions are observable outputs, not a decoding of biological thoughts.',
      );
      await hold(6000);
      await focus('#app-guide .guide-trace');
      await caption(
        'Follow one completed decision',
        'Input TX → measured connectivity with artificial dynamics → action readout → observed result.',
      );
      await hold(6500);
      evidence.trace = await page.locator('.guide-trace').innerText();
      assert(evidence.trace.includes('166,700'));
      const link = page.locator('.guide-trace a').first();
      evidence.receiptUrl = await link.getAttribute('href');
      const receipt = await context.request.get(base + evidence.receiptUrl);
      assert(receipt.ok());
      evidence.receiptStatus = receipt.status();
      // Navigate this recorded page to the exact clicked receipt target, so the receipt remains in the same video.
      await link.evaluate((el) => el.removeAttribute('target'));
      await link.click();
      // Presentation only: show verified receipt fields at readable size, without changing the response.
      const receiptData = await receipt.json();
      evidence.receipt = receiptData;
      await page.evaluate((r) => {
        document.body.replaceChildren();
        document.body.style.cssText =
          'background:#f3f7ed;color:#24473e;font:20px/1.5 system-ui;padding:45px;max-width:1350px;margin:auto';
        const title = document.createElement('h1');
        title.textContent = 'Local Anvil · Transaction receipt';
        const note = document.createElement('p');
        note.textContent = 'Actual receipt fields · enlarged for this recording';
        document.body.append(title, note);
        for (const [name, value] of [
          ['Transaction hash', r.hash || r.transactionHash],
          ['Block', r.blockNumber],
          ['Status', r.status],
          ['From', r.from],
          ['To', r.to],
          ['Gas used', r.gasUsed],
          ['Event logs', r.logs?.length],
        ]) {
          const box = document.createElement('section'),
            label = document.createElement('strong'),
            text = document.createElement('div');
          box.style.cssText =
            'background:white;border:1px solid #ceddcc;border-radius:12px;padding:12px 20px;margin:12px 0';
          label.textContent = name;
          text.textContent = String(value);
          text.style.cssText = 'font-family:monospace;font-size:22px;overflow-wrap:anywhere';
          box.append(label, text);
          document.body.append(box);
        }
      }, receiptData);

      await caption(
        'Inspect the transaction receipt',
        'This is a local Anvil transaction. The block and hash tie the observation to its source.',
      );
      await hold(5500);
      await page.goBack();
      await page.locator('#comparison').waitFor();
      await focus('#comparison');
      await caption(
        'Previously saved learning evaluations',
        'Before / candidate / new test. Only improved candidates are adopted; these are saved results, not a new training run.',
      );
      await hold(6500);
      evidence.savedReport = (await fetch(base + '/api/state').then((r) => r.json())).reports[app + ':full'];
      assert(evidence.savedReport);
      await focus('#app-guide');
      await caption(
        'Play, observe, then inspect the evidence',
        'The in-page manual explains every metric. Full topology; engineered dynamics and inputs/outputs.',
      );
      await hold(4500);
      await page.screenshot({ path: `${out}/${app}-final.png` });
      assert.deepEqual(evidence.errors, []);
    } finally {
      await context.close();
      await writeFile(`${out}/${app}-evidence.json`, JSON.stringify(evidence, null, 2));
    }
    const raw = await video.path();
    await command('ffmpeg', [
      '-y',
      '-v',
      'error',
      '-i',
      raw,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '20',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      `${out}/${app}-english.mp4`,
    ]);
  }
} finally {
  await browser.close();
}
console.log('Recorded all three demos in ' + out);
