import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const base = process.env.LOCAL_GUI_URL || 'http://127.0.0.1:8799';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const out = 'artifacts/circuit-browser';
await mkdir(out + '/raw', { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
});
const recording = process.env.RECORD_CIRCUIT === '1';
const context = await browser.newContext({
  locale: 'en-US',
  viewport: { width: 1500, height: 1100 },
  ...(recording ? { recordVideo: { dir: out + '/raw', size: { width: 1500, height: 1100 } } } : {}),
});
const p = await context.newPage(),
  errors = [];
p.on('pageerror', (e) => errors.push(e.message));
const hold = () => (recording ? p.waitForTimeout(2500) : Promise.resolve());
let video;
try {
  await p.goto(base + '/circuit?test=1');
  await p.waitForFunction(() => window.__circuit?.snapshot().online);
  await p.locator('#language').selectOption('en');
  let state = await p.evaluate(() => window.__circuit.snapshot());
  assert.equal(state.records.length, 3);
  await hold();
  async function send(value) {
    const old = await p.evaluate(() => window.__circuit.snapshot().records[0].source.transactionHash);
    await p.locator('#stimulus').fill(value);
    await p.locator('#send').click();
    await p.waitForFunction(
      (hash) => window.__circuit.snapshot().records[0].source.transactionHash !== hash,
      old,
    );
    await p.waitForFunction(() => !document.getElementById('send').disabled);
    await hold();
    return p.evaluate(() => window.__circuit.snapshot().records[0]);
  }
  const zero = await send('0');
  assert.equal(zero.intact.final.action, 'wait');
  const high = await send('100');
  assert.equal(high.intact.final.action, 'advance');
  assert.ok(high.intact.final.response > 0);
  assert.equal(high.ablated.final.response, 0);
  assert.equal(high.ablated.final.action, 'wait');
  await p.locator('#tx').click();
  await p.waitForFunction(() =>
    document.getElementById('receipt-data').textContent.includes('"stage": "mined"'),
  );
  await hold();
  await p.locator('#close').click();
  const downloadEvent = p.waitForEvent('download');
  await p.locator('#export').click();
  const download = await downloadEvent;
  await download.saveAs(out + '/evidence.json');
  const evidence = JSON.parse(await readFile(out + '/evidence.json', 'utf8'));
  assert.equal(evidence.records.length, 3);
  execFileSync('python3', ['scripts/check-circuit-reference.py', out + '/evidence.json'], {
    stdio: 'inherit',
  });
  await p.screenshot({ path: out + '/desktop.png', fullPage: true });
  await hold();
  await p.locator('details').evaluate((e) => (e.open = true));
  await p.locator('details').scrollIntoViewIfNeeded();
  await hold();
  if (recording) {
    video = p.video();
    await p.close();
  }
  const mobile = recording ? await context.newPage() : p;
  if (recording) {
    await mobile.goto(base + '/circuit?test=1');
    await mobile.waitForFunction(() => window.__circuit?.snapshot().online);
  }
  await mobile.locator('#language').selectOption('ja');
  assert.match(await mobile.locator('h1').textContent(), /実測/);
  await mobile.setViewportSize({ width: 390, height: 844 });
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.screenshot({ path: out + '/mobile.png', fullPage: true });
  // A changed artifact must fail before enabling a chain write.
  const bad = await context.newPage();
  await bad.route('**/models/circuit/graph.json', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
  await bad.goto(base + '/circuit?test=1');
  await bad.waitForFunction(() => window.__circuit?.snapshot().error.includes('digest mismatch'));
  assert.equal(await bad.locator('#send').isDisabled(), true);
  assert.equal((await bad.evaluate(() => window.__circuit.snapshot())).records.length, 0);
  // Existing same-origin signing protections also apply through this route.
  const denied = await p.request.post(base + '/api/circuit/status', {
    headers: { Origin: 'https://example.com', 'Content-Type': 'application/json' },
    data: { agentId: '1' },
  });
  assert.equal(denied.status(), 403);
  assert.deepEqual(errors, []);
  await writeFile(
    out + '/verification.json',
    JSON.stringify(
      { base, zero, high, errors, integrityFailureBlocked: true, foreignOriginBlocked: true },
      null,
      2,
    ),
  );
  console.log(
    'Circuit GUI verified: registry binding, real TX, measured-graph response, ablation, Python reference, integrity rejection, receipt, languages and mobile.',
  );
} finally {
  await context.close();
  await browser.close();
}
if (video) {
  const raw = await video.path();
  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-i',
      raw,
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
      out + '/bioagent-circuit-evidence-en.mp4',
    ],
    { stdio: 'ignore' },
  );
  console.log(out + '/bioagent-circuit-evidence-en.mp4');
}
