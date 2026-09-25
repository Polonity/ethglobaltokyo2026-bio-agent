import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const base = process.env.LOCAL_GUI_URL || 'http://127.0.0.1:8799';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
const out = 'artifacts/two-app-demo';
await mkdir(`${out}/raw`, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  locale: 'en-US',
  viewport: { width: 1600, height: 1100 },
  recordVideo: { dir: `${out}/raw`, size: { width: 1600, height: 1100 } },
});
const page = await context.newPage();
const video = page.video();
const start = Date.now();
const evidence = { url: base, chapters: [], errors: [] };
page.on('pageerror', (e) => evidence.errors.push(e.message));
const hold = (ms) => page.waitForTimeout(ms);
async function caption(title, detail) {
  evidence.chapters.push({ seconds: (Date.now() - start) / 1000, title, detail });
  console.log(title);
  await page.evaluate(
    ({ title, detail }) => {
      let el = document.getElementById('demo-caption');
      if (!el) {
        el = document.createElement('div');
        el.id = 'demo-caption';
        el.setAttribute('data-no-i18n', '');
        el.style.cssText =
          'position:fixed;bottom:16px;left:4%;right:4%;z-index:99999;background:#23352def;color:white;padding:18px 24px;border-radius:18px;font:24px/1.5 sans-serif;pointer-events:none';
        document.body.append(el);
      }
      const titleEl = document.createElement('strong'),
        sub = document.createElement('div');
      titleEl.textContent = title;
      sub.textContent = detail;
      sub.style.fontSize = '17px';
      el.replaceChildren(titleEl, sub);
    },
    { title, detail },
  );
}
async function focus(selector, top = 60) {
  await page
    .locator(selector)
    .evaluate(
      (el, top) => window.scrollBy({ top: el.getBoundingClientRect().top - top, behavior: 'smooth' }),
      top,
    );
  await hold(700);
}
try {
  await page.goto(`${base}/?test=1`);
  await page.waitForFunction(() => window.__chain?.ready);
  await page.locator('#language').selectOption('en');
  await caption(
    'BioAgent: one shared vocabulary, two applications.',
    'Source, body state, decisions and learning history — with explicit evidence boundaries.',
  );
  await hold(4500);
  await page.locator('[data-mode="forage"]').click();
  await page.locator('#energy').fill('85');
  await page.locator('#stimulus').fill('60');
  await page.locator('#apply').click();
  await page.waitForFunction(() => window.__chain.lastTx?.applied && !window.__chain.busy);
  evidence.foragingTx = await page.evaluate(() => window.__chain.lastTx.transactionHash);
  await focus('#arena');
  await caption(
    '1 / Onchain input reaches a registered fly.',
    'A real Anvil transaction changes foraging conditions after its event is received.',
  );
  await hold(4500);
  await page.locator('#feed-selected').scrollIntoViewIfNeeded();
  await caption(
    'Body state is part of the actual policy input.',
    'Local treats increase fullness. The belly changes continuously — no image swapping.',
  );
  for (let i = 0; i < 4; i++) {
    await page.locator('#feed-selected').click();
    await hold(900);
  }
  evidence.body = await page.evaluate(() => ({
    satiety: window.__arena.flies[0].satiety,
    encoded: window.__arena.flies[0].observation?.encodedKey,
  }));
  await focus('#body-readout', 500);
  await hold(4000);
  await page.goto(`${base}/market?test=1`);
  await page.waitForFunction(() => window.__paper?.lastEvent);
  await page.locator('#language').selectOption('en');
  await caption(
    '2 / A real Uniswap V3 pool, running on Anvil.',
    'Three registered agents observe the same Swap events. Their portfolios are paper-only.',
  );
  await hold(4000);
  await focus('#field', 300);
  await caption(
    'Prices move. Each fly makes its own decision.',
    'Momentum, contrarian and cautious priors; exact-size quotes at a later block for paper fills.',
  );
  const before = await page.evaluate(() => window.__paper.tick);
  await page.locator('#sequence').click();
  await page.waitForFunction((n) => window.__paper.tick >= n + 12, before, { timeout: 60000 });
  await hold(3000);
  await page.locator('#source-tx').click();
  await page.waitForFunction(() =>
    document.querySelector('#receipt-data').textContent.includes('transactionHash'),
  );
  await caption(
    'Follow the source transaction.',
    'This is the actual pool Swap receipt. A paper fill never pretends to have its own transaction.',
  );
  await hold(4500);
  await page.locator('#close-receipt').click();
  await focus('#learning', 200);
  await caption(
    'Pause, learn, evaluate — then return.',
    'Positions remain exposed while learning. Candidate selection uses reward-prediction error, not a profit guarantee.',
  );
  await hold(8000);
  evidence.market = await page.evaluate(() => window.__paper.snapshot());
  assert.ok(evidence.market.flies.some((f) => f.trades.length));
  await focus('#field', 200);
  await caption(
    'A working prototype, with honest boundaries.',
    'Synthetic models today. Connectome provenance and portable learning profiles define the direction. No Sepolia deployment.',
  );
  await hold(5500);
  assert.deepEqual(evidence.errors, []);
  await page.screenshot({ path: `${out}/final.png`, fullPage: true });
} finally {
  await context.close();
  evidence.rawVideo = await video.path();
  await browser.close();
  await writeFile(`${out}/evidence.json`, JSON.stringify(evidence, null, 2));
}
execFileSync(
  'ffmpeg',
  [
    '-y',
    '-i',
    evidence.rawVideo,
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '21',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    `${out}/bioagent-two-apps-english.mp4`,
  ],
  { stdio: 'ignore' },
);
console.log(`${out}/bioagent-two-apps-english.mp4`);
