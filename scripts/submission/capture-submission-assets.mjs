import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const out = 'artifacts/submission-assets-20260927';
await mkdir(`${out}/screenshots`, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await context.addInitScript(() => localStorage.setItem('full-app-language', 'en'));
const page = await context.newPage();
const url = process.env.SUBMISSION_GUI_URL || 'http://127.0.0.1:8858/foraging';
const entries = [];
try {
  await page.goto(url);
  await page.locator('#language').selectOption('en');
  await page.waitForTimeout(2000);
  for (const [name, pane, title] of [
    ['01-foraging', null, 'Onchain-stimulus foraging: MOMO and SORA'],
    ['02-learning', 'learning', 'Learning results and model comparison'],
    ['03-onchain-inputs', 'evidence', 'Onchain environment inputs and transaction evidence'],
  ]) {
    if (pane) {
      if (!await page.locator('#details-dialog').isVisible()) await page.locator('#open-details').click();
      await page.locator(`[data-pane="${pane}"]`).click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${out}/screenshots/${name}.png` });
    entries.push({ file: `screenshots/${name}.png`, title, source: 'live GUI screenshot', url });
  }
} finally { await browser.close(); }
const recording = 'artifacts/submission-presenter-rerecord/raw/page@5396d79765582ca24c4432a2a6f3f41f.webm';
for (const [name, seconds, title] of [
  ['04-shared-market', 153, 'Shared market: biological agents and smart wallets'],
  ['05-aqua-settlement', 227, '1inch Aqua settlement transaction'],
  ['06-uniswap-settlement', 234, 'Uniswap settlement transaction'],
]) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(seconds), '-i', recording, '-frames:v', '1', `${out}/screenshots/${name}.png`]);
  entries.push({ file: `screenshots/${name}.png`, title, source: 'frame from recorded GUI', recording, seconds });
}
await writeFile(`${out}/manifest.json`, JSON.stringify({ createdAt: new Date().toISOString(), branding: ['logo.png', 'cover.png'], screenshots: entries }, null, 2));
console.log(JSON.stringify(entries, null, 2));
