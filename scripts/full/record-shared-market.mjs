import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const url = 'http://127.0.0.1:8814',
  out = 'artifacts/shared-market-demo';
await mkdir(out, { recursive: true });
const readState = async () => await (await fetch(url + '/api/state')).json();
const before = await readState();
assert(!before.running, 'Pause existing run before recording');
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
  locale: 'en-US',
  recordVideo: { dir: out + '/raw', size: { width: 1600, height: 1000 } },
});
await context.addInitScript(() => localStorage.setItem('shared-language', 'en'));
const started = Date.now(),
  page = await context.newPage(),
  video = page.video(),
  cues = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const caption = (title, detail) => cues.push({ start: (Date.now() - started) / 1000, title, detail });
let after, receipt;
try {
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll('[data-tx]').length > 0);
  caption(
    'bioAgent | A living shared market',
    'Four MaleCNS agents. One token pair. Real transactions on a local Ethereum fork.',
  );
  await page.waitForTimeout(5500);
  await page.locator('#start').click();
  caption(
    'MOMO + SORA | Liquidity makers',
    'Two strategies share one wallet and publish, widen or withdraw their Aqua offers.',
  );
  await page.waitForTimeout(7500);
  caption(
    'KOHARU + HINATA | Independent traders',
    'Target holdings stimulate each fly. Buy and sell orders compare Aqua with Uniswap V3.',
  );
  await page.waitForTimeout(7500);
  caption(
    'Executable quotes determine the route',
    'The same ERC20 pair is exchanged on both venues. Routing maximizes token output before gas.',
  );
  await page.waitForTimeout(7500);
  caption(
    'Observe, act, learn',
    '166,700 MaleCNS neurons per fly. Confirmed outcomes update an experimental action readout.',
  );
  await page.waitForTimeout(7500);
  await page.locator('#stop').click();
  for (let i = 0; i < 100; i++) {
    after = await readState();
    if (!after.running) break;
    await page.waitForTimeout(200);
  }
  assert(!after.running);
  assert.equal(after.error, null);
  assert(after.tick > before.tick);
  caption(
    'Honest portfolio accounting',
    'PnL is marked in the displayed test token, including swap costs. Gas is separate, in ETH.',
  );
  await page.waitForTimeout(5500);
  const hash = await page.locator('[data-tx]').first().getAttribute('data-tx');
  assert(!before.transactions.some((t) => t.hash === hash), 'Show a newly recorded trade');
  await page.locator('[data-tx]').first().click();
  await page.locator('#modal').waitFor({ state: 'visible' });
  receipt = await (await fetch(url + '/api/tx/' + hash)).json();
  assert.equal(receipt.status, 1);
  caption(
    'A real transaction, not an animation',
    'Inspect the confirmed receipt, input and output tokens, route, quote and gas used.',
  );
  await page.waitForTimeout(7500);
  await page.locator('#close').click();
  await page.locator('#details').click();
  caption(
    'Traceable biology meets on-chain execution',
    'Inspect the official Aqua address, shared token pair, neural workload and policy hashes.',
  );
  await page.waitForTimeout(7500);
  await page.locator('#close').click();
  caption(
    'A sandbox for bio-inspired agents',
    'Artificial demand, experimental learning, real local token transfers. No profitability claim.',
  );
  await page.waitForTimeout(5000);
  await page.screenshot({ path: out + '/poster.png' });
  assert.deepEqual(errors, []);
  after = await readState();
  await writeFile(
    out + '/verification.json',
    JSON.stringify(
      {
        recordedAt: new Date().toISOString(),
        before: { tick: before.tick, routes: before.routes },
        after: {
          tick: after.tick,
          routes: after.routes,
          metrics: after.metrics,
          pnl: after.pnl,
          flies: after.flies,
        },
        newRoutes: Object.fromEntries(
          Object.keys(after.routes).map((k) => [k, after.routes[k] - before.routes[k]]),
        ),
        receipt,
        browserErrors: errors,
        cues,
      },
      null,
      2,
    ),
  );
} finally {
  const state = await readState();
  if (state.running)
    await page.evaluate(() =>
      fetch('/api/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
    );
  await context.close();
  await browser.close();
}
const duration = (Date.now() - started) / 1000;
const stamp = (n) => {
  const ms = Math.floor(n * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
await writeFile(
  out + '/captions-en.srt',
  cues
    .map(
      (c, i) =>
        `${i + 1}\n${stamp(i === 0 ? 0 : c.start)} --> ${stamp(cues[i + 1]?.start ?? duration)}\n${c.title}\n${c.detail}\n`,
    )
    .join('\n'),
);
const result = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-i',
    await video.path(),
    '-vf',
    `pad=1600:1120:0:0:color=0x101d25,subtitles=${out}/captions-en.srt:force_style='FontName=DejaVu Sans,FontSize=8,PrimaryColour=&H00FFFFFF,OutlineColour=&H00251D10,BorderStyle=1,Outline=0,Shadow=0,Alignment=2,MarginV=9'`,
    '-r',
    '30',
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
    out + '/shared-market-demo-en.mp4',
  ],
  { encoding: 'utf8' },
);
assert.equal(result.status, 0, result.stderr);
console.log(
  JSON.stringify({
    video: out + '/shared-market-demo-en.mp4',
    duration,
    cycles: after.tick - before.tick,
    routes: after.routes,
  }),
);
