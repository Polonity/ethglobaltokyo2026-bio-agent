import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const deployment = JSON.parse(await readFile('.local/deployment.json', 'utf8'));
const base = deployment.guiUrl;
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
assert.equal(Number(deployment.chainId), 31337);
const out = 'artifacts/demo-en';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  locale: 'en-US',
  viewport: { width: 1600, height: 1100 },
  recordVideo: { dir: `${out}/raw`, size: { width: 1600, height: 1100 } },
});
const page = await context.newPage();
const evidence = {
  startedAt: new Date().toISOString(),
  url: base,
  chapters: [],
  transactions: [],
  errors: [],
};
page.on('pageerror', (e) => evidence.errors.push(e.message));
const start = Date.now();
const hold = (ms) => page.waitForTimeout(ms);
async function caption(title, detail) {
  evidence.chapters.push({ seconds: (Date.now() - start) / 1000, title, detail });
  console.log(title);
  await page.evaluate(
    ({ title, detail }) => {
      let el = document.querySelector('#demo-caption');
      if (!el) {
        el = document.createElement('div');
        el.id = 'demo-caption';
        el.setAttribute('data-no-i18n', '');
        el.style.cssText =
          'position:fixed;bottom:18px;left:4%;right:4%;z-index:99999;padding:18px 26px;border:1px solid #fa9165;border-radius:12px;background:rgba(15,23,21,.97);color:#fff;font:24px/1.5 sans-serif;box-shadow:0 6px 24px #0008;pointer-events:none';
        document.body.append(el);
      }
      el.replaceChildren();
      const strong = document.createElement('strong');
      strong.textContent = title;
      el.append(strong);
      const small = document.createElement('div');
      small.style.cssText = 'font-size:18px;color:#c9d6c7';
      small.textContent = detail;
      el.append(small);
    },
    { title, detail },
  );
}
async function focus(selector, top = 80) {
  await page
    .locator(selector)
    .evaluate(
      (el, top) => window.scrollBy({ top: el.getBoundingClientRect().top - top, behavior: 'smooth' }),
      top,
    );
  await hold(600);
}
async function send(mode, energy, stimulus) {
  const previous = await page.evaluate(() => window.__chain.lastTx?.transactionHash);
  await page.locator(`[data-mode="${mode}"]`).click();
  await page.locator('#energy').fill(String(energy));
  await hold(700);
  await page.locator('#stimulus').fill(String(stimulus));
  await hold(1000);
  await page.locator('#apply').click();
  await page.waitForFunction(
    (hash) =>
      window.__chain.lastTx?.applied &&
      !window.__chain.busy &&
      window.__chain.lastTx.transactionHash !== hash,
    previous,
  );
  evidence.transactions.push(await page.evaluate(() => JSON.parse(JSON.stringify(window.__chain.lastTx))));
}
try {
  await page.goto(`${base}/?test=1`);
  await page.waitForFunction(() => window.__chain?.ready);
  await page.locator('#language').selectOption('en');
  await page.addStyleTag({ content: 'body {zoom:.85}' });
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('.rank-row').count(), 3);
  await page.locator('#pause').click();
  await page.locator('label.toggle').click();
  await page.evaluate(() => scrollTo(0, 0));
  await caption(
    'FLY LAB — Tiny wings. Real onchain inputs.',
    'Three registered agents · Anvil local chain · Cloudflare Workers running locally',
  );
  await hold(5000);
  await focus('#arena');
  await caption(
    '01  Choose a little fly. Send a stimulus.',
    'MOMO receives Forage mode, 90% energy supply and 95% stimulus through the contract.',
  );
  await send('forage', 90, 95);
  await focus('#tx-card', 450);
  await caption(
    '02  A real transaction — not just an animation.',
    'The stimulus has a transaction hash, block number and input revision. Click the hash to verify.',
  );
  await hold(3000);
  await page.locator('#tx-card-hash').click();
  await page.waitForFunction(() =>
    document.getElementById('transaction-data').textContent.includes('Mined successfully'),
  );
  await caption(
    'Anvil receipt: mined successfully.',
    'Local receipt, sender, Registry and event. A future Sepolia connection can link to Etherscan.',
  );
  evidence.receiptText = await page.locator('#transaction-data').textContent();
  await hold(6000);
  await page.locator('#close-transaction').click();
  await focus('#arena');
  await page.locator('#pause').click();
  await caption(
    '03  The event changes MOMO’s input.',
    'The fly chooses its next action. Thought bubbles make those decisions visible.',
  );
  const first = await page.evaluate(() => ({ ...window.__arena.flies[0].decisionCounts }));
  await hold(8000);
  evidence.forage = await page.evaluate(
    (before) => ({ before, after: window.__arena.flies[0].decisionCounts }),
    first,
  );
  await caption(
    '04  Now try a little rest.',
    'Send Rest mode with 0% stimulus. Watch MOMO choose more rest actions: Zzz…',
  );
  await send('rest', 40, 0);
  await focus('#arena');
  const rest = await page.evaluate(() => ({ ...window.__arena.flies[0].decisionCounts }));
  await hold(7000);
  evidence.rest = await page.evaluate(
    (before) => ({ before, after: window.__arena.flies[0].decisionCounts }),
    rest,
  );
  await caption(
    '05  Each fly has its own onchain input.',
    'Send Explore mode to SORA. MOMO keeps its own registered state.',
  );
  await page.locator('.rank-row').filter({ hasText: 'SORA' }).click();
  await send('explore', 85, 80);
  await focus('#arena');
  await hold(4000);
  await caption(
    '06  Falling behind? Pause and learn.',
    'Enable automatic learning. A lower-performing fly stays in place and thinks: “?”',
  );
  await page.locator('label.toggle').click();
  await page.waitForFunction(() => window.__arena.flies.some((f) => f.state === 'learning'), null, {
    timeout: 25000,
  });
  const learner = await page.evaluate(() => window.__arena.flies.find((f) => f.state === 'learning').name);
  evidence.learner = learner;
  await page.locator('.rank-row').filter({ hasText: learner }).click();
  await focus('#arena');
  const position = await page.evaluate((name) => {
    const f = window.__arena.flies.find((f) => f.name === name);
    return { x: f.x, y: f.y };
  }, learner);
  await hold(2500);
  assert.deepEqual(
    await page.evaluate((name) => {
      const f = window.__arena.flies.find((f) => f.name === name);
      return { x: f.x, y: f.y };
    }, learner),
    position,
  );
  evidence.stationaryLearning = true;
  await focus('#learning-slots', 420);
  await caption(
    `${learner} is learning from experience.`,
    'Train a candidate policy, then compare it with the current policy on validation courses.',
  );
  await page.waitForFunction(
    (name) => {
      const f = window.__arena.flies.find((f) => f.name === name);
      return f.state !== 'learning' && f.lastReport;
    },
    learner,
    { timeout: 20000 },
  );
  evidence.learning = await page.evaluate((name) => {
    const f = window.__arena.flies.find((f) => f.name === name);
    return { name, report: f.lastReport, version: f.version, trainingCount: f.trainingCount };
  }, learner);
  await caption(
    '07  Evaluate, then return to the race.',
    evidence.learning.report.accepted
      ? 'The candidate improved its validation score, so the new policy was adopted.'
      : 'This candidate did not improve the score. The fly keeps its existing policy and returns.',
  );
  await hold(6500);
  await focus('#arena');
  await caption(
    'Onchain stimulus → decision → experience → learning.',
    'Current demo: browser Q-learning. MaleCNS circuits, live Uniswap inputs and wallet creation are not connected to this GUI.',
  );
  await hold(6500);
  assert.equal(evidence.errors.length, 0);
  assert.ok(evidence.forage.after.move > evidence.forage.before.move);
  assert.ok(evidence.rest.after.rest > evidence.rest.before.rest);
  await page.screenshot({ path: `${out}/final.png` });
} finally {
  const video = page.video();
  await context.close();
  evidence.rawVideo = await video.path();
  evidence.elapsedSeconds = (Date.now() - start) / 1000;
  await writeFile(`${out}/evidence.json`, JSON.stringify(evidence, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify({
    rawVideo: evidence.rawVideo,
    seconds: evidence.elapsedSeconds,
    learning: evidence.learning,
  }),
);

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
    '20',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    `${out}/fly-lab-english-demo.mp4`,
  ],
  { stdio: 'inherit' },
);
