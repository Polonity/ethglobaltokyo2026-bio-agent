import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { JsonRpcProvider, Interface, Contract, formatUnits } from 'ethers';
import { verifyAquaFork } from '../../services/full-apps/fork.mjs';

const url = process.env.PRESENTER_DEMO_URL || 'http://127.0.0.1:8814';
const out = process.env.PRESENTER_OUTPUT || 'artifacts/submission-presenter-20260926';
const delivery = 'docs/submission/presenter-kit';
assert.equal(new URL(url).hostname, '127.0.0.1');
await mkdir(out + '/raw', { recursive: true });
await mkdir(delivery, { recursive: true });
const readState = async () => (await fetch(url + '/api/state')).json();
const before = await readState();
assert(!before.running, 'An existing run must be paused; do not interrupt it');
assert.equal(before.brain.full.neurons, 166700);
const beforePolicy = JSON.parse(await readFile('.local/shared-market/readout.json', 'utf8'));
const p = new JsonRpcProvider('http://127.0.0.1:18551', undefined, { batchMaxCount: 1 });
assert.equal(BigInt(await p.send('eth_chainId', [])), 31337n);
const fork = await verifyAquaFork(p, '.local/aqua-fork/upstream.json');
const tokenInterface = new Interface([
  'event Transfer(address indexed from,address indexed to,uint256 value)',
]);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1920, height: 960 },
  locale: 'en-US',
  recordVideo: { dir: out + '/raw', size: { width: 1920, height: 960 } },
});
await context.addInitScript(() => localStorage.setItem('shared-language', 'en'));
const started = Date.now(),
  page = await context.newPage(),
  video = page.video();
const cues = [],
  errors = [],
  receipts = [];
let startedOwnRun = false,
  after;
page.on('pageerror', (e) => errors.push(e.message));
const cue = (en, ja) => cues.push({ start: (Date.now() - started) / 1000, en, ja });
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
async function sleep(ms) {
  await page.waitForTimeout(ms);
}
async function setTargets(values) {
  for (let i = 0; i < 2; i++) {
    await page.locator(`#target${i}`).evaluate(
      (el, value) => {
        el.value = String(value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      Math.round(values[i] * 100),
    );
  }
  await page.locator('#apply').click();
}
async function stopOwnRun() {
  if (!startedOwnRun) return;
  await page.locator('#stop').click();
  for (let i = 0; i < 120; i++) {
    after = await readState();
    if (!after.running) {
      startedOwnRun = false;
      return;
    }
    await sleep(250);
  }
  throw Error('Own recording run did not pause');
}
async function showReceipt(trade) {
  // Open the application's real receipt first, then format that same data for legibility.
  const button = page.locator(`[data-tx="${trade.hash}"]`);
  if (await button.count()) await button.click();
  else {
    await page.locator('[data-tx]').first().click();
    // The excerpt is labelled and bound to the selected freshly recorded trade below.
  }
  await page.locator('#modal').waitFor({ state: 'visible' });
  const receipt = await p.getTransactionReceipt(trade.hash);
  assert.equal(receipt.status, 1);
  const transfers = receipt.logs.flatMap((log) => {
    const index = before.config.tokens.findIndex((t) => t.toLowerCase() === log.address.toLowerCase());
    if (index < 0) return [];
    try {
      const x = tokenInterface.parseLog(log);
      if (!x) return [];
      return [
        {
          token: before.config.symbols[index],
          tokenAddress: log.address,
          from: x.args.from,
          to: x.args.to,
          raw: x.args.value.toString(),
          amount: formatUnits(x.args.value, 18),
        },
      ];
    } catch {
      return [];
    }
  });
  assert(transfers.length >= 2);
  const emitter = trade.route === 'Aqua' ? fork.aqua : before.config.pool;
  const signatures =
    trade.route === 'Aqua'
      ? ['Pushed(address,address,bytes32,address,uint256)', 'Pulled(address,address,bytes32,address,uint256)']
      : ['Swap(address,address,int256,int256,uint160,uint128,int24)'];
  for (const signature of signatures) {
    const topic = new Interface(['event ' + signature]).fragments[0].topicHash;
    assert(
      receipt.logs.some((l) => l.address.toLowerCase() === emitter.toLowerCase() && l.topics[0] === topic),
    );
  }
  const record = {
    trade,
    receipt: receipt.toJSON(),
    transfers,
    verifiedEventEmitter: emitter,
    verifiedEvents: signatures,
  };
  receipts.push(record);
  const html = `<p class="receipt-label">REAL RECEIPT EXCERPT · ANVIL LOCAL FORK · CHAIN 31337</p><h2>${esc(trade.route)} · ${esc(trade.input)} → ${esc(trade.output)}</h2><div class="receipt-stats"><div>STATUS<strong>SUCCESS</strong></div><div>BLOCK<strong>${receipt.blockNumber}</strong></div><div>GAS USED<strong>${receipt.gasUsed}</strong></div></div><p>Transaction <code>${esc(receipt.hash)}</code></p><table class="receipt-table"><thead><tr><th>Token</th><th>Actual transfer</th><th>From → To</th></tr></thead><tbody>${transfers.map((x) => `<tr><td>${esc(x.token)}</td><td>${esc(x.amount)}</td><td><code>${esc(x.from)}<br>→ ${esc(x.to)}</code></td></tr>`).join('')}</tbody></table><p>Verified event emitter: <code>${esc(emitter)}</code></p><p class="receipt-label">Decoded from this receipt's ERC20 Transfer logs. Local test tokens; not a mainnet transaction.</p>`;
  await page.evaluate((html) => {
    document.querySelector('#modal-title').textContent = 'Confirmed settlement';
    document.querySelector('#modal-body').innerHTML = html;
    document.querySelector('#modal').scrollTop = 0;
  }, html);
}
try {
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll('[data-tx]').length > 0);
  await page.addStyleTag({
    content: `aside{padding:14px;gap:10px;width:340px}.card{padding:14px}h2{margin-bottom:10px}.controls label{margin:8px 0}.fill{padding:7px 0}dialog{width:1180px;max-width:90vw}dialog pre{font-size:13px}.receipt-label{font-size:14px;color:#b9d0c2;letter-spacing:1px}.receipt-stats{display:flex;gap:80px;margin:24px 0}.receipt-stats strong{display:block;font-size:28px;color:#c8f9a5}.receipt-table{width:100%;border-collapse:collapse;margin:24px 0}.receipt-table td,.receipt-table th{padding:12px;border-bottom:1px solid #577466;text-align:left}.receipt-table code{font-size:13px}`,
  });
  // Controlled demand is a visible user input, not a hidden action/result injection.
  await setTargets([0.85, 0.15]);
  cue(
    [
      'BioAgent | From connectomes to on-chain action',
      'Four simulated agents. 166,700 measured neurons each. One shared market.',
    ],
    [
      'BioAgent｜コネクトームから、オンチェーンの行動へ',
      '各166,700神経で動く4個体。同じ市場で提示・売買・学習します。',
    ],
  );
  await sleep(4800);
  await page.locator('#start').click();
  startedOwnRun = true;
  cue(
    [
      'Two makers. One self-custodied wallet.',
      'MOMO and SORA publish, widen or withdraw offers through official Aqua.',
    ],
    ['提示側2匹、資金は同じウォレットに。', 'MOMOとSORAが、公式Aquaへの提示・拡大・撤回を選びます。'],
  );
  await sleep(7500);
  cue(
    [
      'Two traders. The same token pair.',
      'KOHARU and HINATA choose buy, hold or sell. Code compares executable quotes.',
    ],
    [
      '売買側2匹、同じ通貨ペアで取引。',
      'KOHARUとHINATAが売買・待機を判断。通常コードが見積もりを比較します。',
    ],
  );
  await sleep(7500);
  cue(
    [
      'Confirmed outcomes feed learning',
      'Readout weights update after each cycle. The measured connectome stays fixed.',
    ],
    ['実際の行動結果から、学習を更新。', '周期ごとに行動readoutを更新します。実測の神経接続は固定です。'],
  );
  await sleep(9000);
  await stopOwnRun();
  assert.equal(after.error, null);
  assert(after.tick > before.tick);
  assert.equal(after.metrics.neuronsPerFly, 166700);
  for (const route of ['Aqua', 'Uniswap V3'])
    assert(after.routes[route] > before.routes[route], `No newly recorded ${route} settlement`);
  await page.locator('#details').click();
  cue(
    [
      'Measured structure. Engineered dynamics.',
      'Full neural workload, resource use and per-agent learning history are inspectable.',
    ],
    ['構造は実測、動力学は人工設計。', '全神経の計算量、使用メモリー、個体ごとの学習履歴を確認できます。'],
  );
  await sleep(4200);
  await page.locator('#modal').evaluate((el) => (el.scrollTop = el.scrollHeight));
  await sleep(3000);
  await page.locator('#close').click();
  for (const route of ['Aqua', 'Uniswap V3']) {
    const trade = after.transactions.find(
      (x) => x.kind === 'swap' && x.route === route && !before.transactions.some((b) => b.hash === x.hash),
    );
    assert(trade, `Missing fresh ${route} receipt`);
    await showReceipt(trade);
    cue(
      route === 'Aqua'
        ? [
            'Aqua | Actual token settlement',
            'A fresh successful transaction. Inspect ERC20 transfers and official Aqua events.',
          ]
        : [
            'Uniswap V3 | Actual swap settlement',
            'The same tokens flow through the V3 pool. Gas is recorded separately in ETH.',
          ],
      route === 'Aqua'
        ? ['Aqua｜実際のトークン決済', '今回成立した取引のERC20移動と、公式Aquaのイベントを確認。']
        : ['Uniswap V3｜実際のスワップ決済', '同じ通貨がV3プールで移動。ガス代はETHで別に記録しています。'],
    );
    await sleep(6300);
    await page.screenshot({ path: `${out}/${route === 'Aqua' ? 'aqua' : 'uniswap'}-receipt.png` });
    await page.locator('#close').click();
  }
  await setTargets(before.targets);
  await page.evaluate(() => window.scrollTo(0, 0));
  cue(
    [
      'A testbed for bio-inspired agents',
      'Trace inputs, learning and settlement. Artificial demand; no profitability claim.',
    ],
    [
      '生物由来Agentを、比較・検証する実験基盤。',
      '入力・学習・決済を追跡。需要は人工設定で、収益性の実証ではありません。',
    ],
  );
  await sleep(5500);
  await page.screenshot({ path: out + '/poster.png' });
  const afterPolicy = JSON.parse(await readFile('.local/shared-market/readout.json', 'utf8'));
  const policyChanges = after.flies.map((f, i) => ({
    name: f.name,
    updatesBefore: beforePolicy.updates[i],
    updatesAfter: afterPolicy.updates[i],
    weightsChanged: JSON.stringify(beforePolicy.weights[i]) !== JSON.stringify(afterPolicy.weights[i]),
    policyHashAtLastDecision: f.policyHash,
  }));
  assert(policyChanges.every((x) => x.updatesAfter > x.updatesBefore));
  assert(policyChanges.some((x) => x.weightsChanged));
  assert.deepEqual(errors, []);
  const end = (Date.now() - started) / 1000;
  const evidence = {
    recordedAt: new Date().toISOString(),
    scope: 'Anvil Ethereum fork + full population; no public-chain writes',
    fork: {
      chainId: fork.chainId,
      blockNumber: fork.blockNumber,
      blockHash: fork.blockHash,
      aqua: fork.aqua,
      codeHash: fork.codeHash,
    },
    config: {
      registry: before.config.registry,
      pool: before.config.pool,
      router: before.config.router,
      app: before.config.app,
      tokens: before.config.tokens,
      symbols: before.config.symbols,
      wallets: before.config.wallets,
    },
    brain: after.brain,
    before: { tick: before.tick, routes: before.routes, targets: before.targets },
    after: { tick: after.tick, routes: after.routes, metrics: after.metrics, pnl: after.pnl },
    newRoutes: Object.fromEntries(
      Object.keys(after.routes).map((k) => [k, after.routes[k] - before.routes[k]]),
    ),
    policyChanges,
    receipts,
    browserErrors: errors,
    cues,
    end,
    presentationChanges: 'Compact CSS and clearly labelled decoded receipt excerpts; no result injection',
    restoredTargets: (await readState()).targets,
  };
  await writeFile(out + '/capture-evidence.json', JSON.stringify(evidence, null, 2));
} finally {
  if (startedOwnRun) await stopOwnRun();
  if (!(await readState()).running) await setTargets(before.targets);
  await context.close();
  await browser.close();
  p.destroy();
}
const raw = await video.path();
await writeFile(out + '/raw-video-path.txt', raw + '\n');
const evidence = JSON.parse(await readFile(out + '/capture-evidence.json', 'utf8'));
const rawStart = evidence.cues[0].start;
const stamp = (n) => {
  const ms = Math.floor(n * 1000);
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};
for (const lang of ['en', 'ja']) {
  const srt = cues
    .map(
      (c, i) =>
        `${i + 1}\n${stamp(i === 0 ? 0 : c.start - rawStart)} --> ${stamp((cues[i + 1]?.start ?? evidence.end) - rawStart)}\n${c[lang].join('\n')}\n`,
    )
    .join('\n');
  await writeFile(`${out}/captions-${lang}.srt`, srt);
  const target = `${delivery}/bioagent-submission-${lang}.mp4`;
  await new Promise((resolve, reject) => {
    const ff = spawn(
      'ffmpeg',
      [
        '-y',
        '-loglevel',
        'error',
        '-ss',
        String(rawStart),
        '-i',
        raw,
        '-t',
        String(evidence.end - rawStart),
        '-vf',
        `pad=1920:1080:0:0:color=0x101d25,subtitles=${out}/captions-${lang}.srt:force_style='FontName=Noto Sans CJK JP,FontSize=8,PrimaryColour=&H00FFFFFF,OutlineColour=&H00251D10,BorderStyle=1,Outline=0,Shadow=0,Alignment=2,MarginV=8'`,
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
        target,
      ],
      { stdio: 'inherit' },
    );
    ff.on('error', reject);
    ff.on('exit', (code) => (code === 0 ? resolve() : reject(Error(`ffmpeg exit ${code}`))));
  });
  await copyFile(`${out}/captions-${lang}.srt`, `${delivery}/captions-${lang}.srt`);
}
await copyFile(out + '/capture-evidence.json', delivery + '/capture-evidence.json');
console.log(
  JSON.stringify({
    videos: ['en', 'ja'].map((l) => `${delivery}/bioagent-submission-${l}.mp4`),
    cycles: evidence.after.tick - evidence.before.tick,
    newRoutes: evidence.newRoutes,
    policyChanges: evidence.policyChanges,
  }),
);
