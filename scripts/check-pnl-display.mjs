// Isolated presentation fixture. Does not submit transactions or alter runtime state.
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const base = 'http://127.0.0.1:8812';
const state = await fetch(base + '/api/state').then((r) => r.json());
const sample = structuredClone(state);
sample.busy = null;
assert(sample.latest.market?.snapshot, 'Run the normal market UI check first.');
const flies = sample.latest.market.snapshot.flies;
flies[0].pnl = '5000000000000000000';
flies[0].equity = '105000000000000000000';
flies[1].pnl = '-2000000000000000000';
flies[1].equity = '98000000000000000000';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
try {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.route('**/api/state', (r) =>
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(sample) }),
  );
  await p.goto(base + '/market');
  await p.waitForFunction(() => document.querySelector('#cards')?.innerText.includes('+5.000'));
  const text = await p.locator('#cards').innerText();
  assert(text.includes('−2.000'));
  assert(text.includes(sample.display.market[1].symbol));
  assert(text.includes('+5.00%'));
  assert(text.includes('−2.00%'));
  assert.equal(await p.locator('#cards .gain').count(), 1);
  assert.equal(await p.locator('#cards .loss').count(), 1);
  const bars = await p
    .locator('.bar-fill')
    .evaluateAll((xs) =>
      xs.map((x) => ({ left: parseFloat(x.style.left), width: parseFloat(x.style.width) })),
    );
  assert.equal(bars[0].left, 50);
  assert(bars[1].left < 50);
  assert(Math.abs(bars[1].left + bars[1].width - 50) < 0.001);
  await writeFile(
    'artifacts/ux-refresh/pnl-format-fixture.json',
    JSON.stringify(
      { kind: 'isolated synthetic presentation fixture; not a trading result', text, bars },
      null,
      2,
    ),
  );
  console.log('Verified positive/negative signs, token units, percentage basis and zero-centered bars.');
} finally {
  await b.close();
}
