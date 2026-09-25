import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const deployment = JSON.parse(await readFile('.local/deployment.json', 'utf8'));
const base = deployment.guiUrl;
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
assert.equal(Number(deployment.chainId), 31337);
const out = 'artifacts/demo';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  locale: 'ja-JP',
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
  await page.addStyleTag({ content: 'body {zoom:.85}' });
  assert.equal(await page.locator('.rank-row').count(), 3);
  await page.locator('#pause').click();
  await page.locator('label.toggle').click();
  await caption(
    'FLY LAB — ブロックチェーンで、ハエに刺激を。',
    'Anvil × Cloudflare Workers ローカル版 / 登録済みの MOMO・SORA・KIKI が競います',
  );
  await hold(5500);
  await caption(
    '01  採餌モードと刺激を、コントラクトへ送信',
    'MOMO に採餌・エネルギー90%・刺激95%を入力します',
  );
  await send('forage', 90, 95);
  await caption(
    '02  確定したイベントを受信して、行動に反映',
    'トランザクションと revision を確認。入力を受け取ったハエが行動を判定します',
  );
  await hold(3500);
  await page.locator('#pause').click();
  const first = await page.evaluate(() => ({ ...window.__arena.flies[0].decisionCounts }));
  await hold(8500);
  evidence.forage = await page.evaluate(
    (before) => ({ before, after: window.__arena.flies[0].decisionCounts }),
    first,
  );
  await caption(
    '03  同じハエを、休息モードへ',
    '刺激0%・エネルギー40%を送信。採餌時とは異なる反応を観察します',
  );
  await send('rest', 40, 0);
  const rest = await page.evaluate(() => ({ ...window.__arena.flies[0].decisionCounts }));
  await hold(7000);
  evidence.rest = await page.evaluate(
    (before) => ({ before, after: window.__arena.flies[0].decisionCounts }),
    rest,
  );
  await caption('04  SORA に探索の刺激を送る', '個体ごとに入力を変更できます。MOMO の状態は維持されます');
  await page.locator('.rank-row').filter({ hasText: 'SORA' }).click();
  await send('explore', 85, 80);
  await hold(4000);
  await caption(
    '05  下位の個体は、自動で学習へ',
    'AUTO を有効化。競技を離れ、経験を使って次の方策を評価します',
  );
  await page.locator('label.toggle').click();
  await page.waitForFunction(() => window.__arena.flies.some((f) => f.state === 'learning'), null, {
    timeout: 25000,
  });
  const learner = await page.evaluate(() => window.__arena.flies.find((f) => f.state === 'learning').name);
  evidence.learner = learner;
  await page.locator('.rank-row').filter({ hasText: learner }).click();
  await page.locator('#learning-slots').evaluate((el) => {
    window.scrollBy({ top: el.getBoundingClientRect().top - 480, behavior: 'smooth' });
  });
  await caption(
    `06  ${learner} が学習中`,
    'Q学習で候補を作成し、評価スコアが改善した場合だけ方策を採用します',
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
  await caption('07  評価を終えて、競技に復帰', '学習前後の結果を表示。改善しなければ元の方策を保持します');
  await hold(6500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await caption(
    '状態・刺激 → オンチェーンイベント → 判定・競争・学習',
    '現在はブラウザ内Q学習モデルのデモです。MaleCNS神経回路の実行ではありません',
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
    `${out}/fly-lab-anvil-demo.mp4`,
  ],
  { stdio: 'inherit' },
);
