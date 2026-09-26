import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { renderPresenterDemo } from './render-presenter-demo.mjs';
import assert from 'node:assert/strict';
import { JsonRpcProvider, Interface, formatUnits } from 'ethers';
import { verifyAquaFork } from '../../services/full-apps/fork.mjs';
const forageUrl = process.env.PRESENTER_FORAGING_URL || 'http://127.0.0.1:8856';
const url = process.env.PRESENTER_DEMO_URL || 'http://127.0.0.1:8857';
const rpc = process.env.PRESENTER_MARKET_RPC || 'http://127.0.0.1:18577';
const marketDir = process.env.PRESENTER_MARKET_STATE || '.local/presenter-current-market';
const forageDir =
  process.env.PRESENTER_FORAGING_ARTIFACTS || 'artifacts/submission-presenter-rerecord/foraging';
const out = process.env.PRESENTER_OUTPUT || 'artifacts/submission-presenter-rerecord';
const delivery = process.env.PRESENTER_DELIVERY || `${out}/delivery`;
for (const u of [forageUrl, url, rpc]) assert.equal(new URL(u).hostname, '127.0.0.1');
await mkdir(out + '/raw', { recursive: true });
await mkdir(delivery, { recursive: true });
const readState = async () => (await fetch(url + '/api/state')).json();
const readForage = async () => (await fetch(forageUrl + '/api/state')).json();
const before = await readState();
assert(!before.running);
const beforeForage = await readForage();
assert(!beforeForage.busy);
assert.equal(before.brain.full.neurons, 166700);
const beforePolicy = await readFile(`${marketDir}/readout.json`, 'utf8')
  .then(JSON.parse)
  .catch((e) => {
    if (e.code !== 'ENOENT') throw e;
    return { updates: [0, 0, 0, 0], weights: {} };
  });
const p = new JsonRpcProvider(rpc, undefined, { batchMaxCount: 1 });
assert.equal(BigInt(await p.send('eth_chainId', [])), 31337n);
const fork = await verifyAquaFork(p, `${marketDir}/upstream.json`);
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
await context.addInitScript(() => {
  localStorage.setItem('shared-language', 'en');
  localStorage.setItem('full-app-language', 'en');
});
const started = Date.now(),
  page = await context.newPage(),
  video = page.video();
const cues = [],
  errors = [],
  receipts = [],
  foraging = {};
let startedOwnRun = false,
  ownForage = false,
  after;
page.on('pageerror', (e) => errors.push(e.message));
const time = () => (Date.now() - started) / 1000;
const sleep = (ms) => page.waitForTimeout(ms);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
async function shot(id, seconds, en, ja) {
  const start = time();
  await sleep(seconds * 1000);
  const end = time();
  cues.push({ id, start, end, en, ja });
  await page.screenshot({ path: `${out}/scene-${id}.png` });
}
async function until(read, predicate, label) {
  for (let i = 0; i < 900; i++) {
    const s = await read();
    if (predicate(s)) return s;
    if (i % 40 === 0)
      console.log(
        JSON.stringify({
          waiting: label,
          phase: s.latest?.foraging?.phase,
          tick: s.latest?.foraging?.tick,
          market: s.tick,
        }),
      );
    await sleep(500);
  }
  throw Error(`Timeout: ${label}`);
}
async function setTargets(values) {
  for (let i = 0; i < 2; i++)
    await page.locator(`#target${i}`).evaluate(
      (el, v) => {
        el.value = String(v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      Math.round(values[i] * 100),
    );
  await page.locator('#apply').click();
}
async function stopOwnRun() {
  if (!startedOwnRun) return;
  await page.locator('#stop').click();
  after = await until(readState, (s) => !s.running, 'market pause');
  startedOwnRun = false;
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
  await page.goto(forageUrl);
  await page.locator('#live').waitFor();
  await page.locator('#live').click();
  ownForage = true;
  let f = await until(
    readForage,
    (s) =>
      s.busy &&
      s.latest.foraging?.phase === 'live' &&
      s.latest.foraging.tick >= 2 &&
      s.latest.foraging.snapshot?.world?.worldSource?.transactionHash !==
        beforeForage.latest.foraging?.snapshot?.world?.worldSource?.transactionHash,
    'full foraging response',
  );
  assert.equal(f.latest.foraging.neural.neuronsPerIndividual, 166700);
  foraging.first = f.latest.foraging;
  await shot(
    'purpose',
    4,
    [
      'BioAgent | Test biological decision models',
      'Anvil · full 166,700-neuron runtime. Inputs, actions and learning.',
    ],
    [
      'BioAgent｜生物由来の判断モデルを、使って検証する',
      'Anvil＋全166,700神経。入力・行動・学習をつなぎます。',
    ],
  );
  await page.locator('#stop').click();
  await until(readForage, (s) => !s.busy, 'foraging pause');
  ownForage = false;
  await page.locator('#open-details').click();
  await page.locator('[data-pane="evidence"]').click();
  await page.locator('#environment-proof').waitFor();
  const environment = foraging.first.snapshot.world.worldSource;
  assert((await page.locator('#tx').innerText()).includes(environment.transactionHash));
  foraging.environmentReceipt = await (
    await page.request.get(forageUrl + '/tx/' + environment.transactionHash)
  ).json();
  assert.equal(Number(foraging.environmentReceipt.status), 1);
  await shot(
    'environment',
    6,
    [
      '1 | Initialize the world with a transaction',
      'Dimensions, seed and hazard areas are recorded onchain.',
    ],
    ['1｜初期環境をトランザクションで構築', 'フィールドの寸法・seed・危険エリアもオンチェーン入力です。'],
  );
  await page.locator('#tx a').first().click();
  await page.waitForFunction(() => document.querySelector('#receipt-body').textContent.includes('Success'));
  await shot(
    'receipt',
    4,
    ['Verify the actual environment receipt', 'Local Anvil success. No public-chain transaction.'],
    ['実際の初期環境TXを確認', 'ローカルAnvilの成功receipt。公開チェーンへの送信ではありません。'],
  );
  await page.locator('#close-receipt').click();
  await page.locator('#close-details').click();
  await page.locator('#learn').click();
  ownForage = true;
  await until(
    readForage,
    (s) => s.latest.foraging?.phase === 'collect' && s.latest.foraging.tick >= 2,
    'learning collection',
  );
  await shot(
    'learn',
    6,
    [
      '2 | Observe actions and collect experience',
      'Confirmed stimuli add food. The fixed circuit feeds a learned action readout.',
    ],
    ['2｜行動して経験を集める', '確定した刺激TXで餌を追加。固定回路から行動を選び、結果を学習へ。'],
  );
  const completed = await until(readForage, (s) => !s.busy, 'full learning and comparison');
  ownForage = false;
  foraging.completed = completed.latest.foraging;
  if (completed.latest.foraging.phase === 'error') throw Error(completed.latest.foraging.error);
  assert.equal(completed.latest.foraging.phase, 'complete');
  const report = JSON.parse(await readFile(`${forageDir}/foraging-full-latest.json`, 'utf8'));
  assert.deepEqual(report.before.environmentInput, report.after.environmentInput);
  assert.deepEqual(report.before.inputEvents, report.after.inputEvents);
  foraging.report = report;
  foraging.sameComparisonInputs = true;
  await page.locator('#open-details').click();
  await page.locator('[data-pane="learning"]').click();
  await page.waitForFunction(() => document.querySelector('#summary').textContent.includes('Policy'));
  await shot(
    'compare',
    7,
    [
      '3 | Compare before adopting · learning wait omitted',
      'Same confirmed input TXs for both policies. Keep an unchanged or worse candidate out.',
    ],
    [
      '3｜同じ入力で比べて採用する（学習待ち時間は省略）',
      '新旧方策に同じ環境・刺激TXを使用。改善しない候補は採用しません。',
    ],
  );
  await page.locator('[data-pane="evidence"]').click();
  await page.locator('#neural').scrollIntoViewIfNeeded();
  assert((await page.locator('#neural').innerText()).includes('166,700'));
  await shot(
    'model',
    5,
    [
      'Full measured connectivity, engineered dynamics',
      '166,700 neurons per agent. Body state and learning run offchain.',
    ],
    ['構造は実測、動力学は人工設計', '各166,700神経で計算。身体状態と学習の処理はオフチェーンです。'],
  );
  await page.goto(url);
  await page.locator('#start').waitFor();
  await page.addStyleTag({
    content:
      'aside{padding:14px;gap:10px;width:340px}.card{padding:14px}h2{margin-bottom:10px}.controls label{margin:8px 0}.fill{padding:7px 0}dialog{width:1180px;max-width:90vw}.receipt-label{font-size:14px;color:#b9d0c2;letter-spacing:1px}.receipt-stats{display:flex;gap:80px;margin:24px 0}.receipt-stats strong{display:block;font-size:28px;color:#c8f9a5}.receipt-table{width:100%;border-collapse:collapse;margin:24px 0}.receipt-table td,.receipt-table th{padding:12px;border-bottom:1px solid #577466;text-align:left}.receipt-table code{font-size:13px}',
  });
  await setTargets([0.85, 0.15]);
  await page.locator('#start').click();
  startedOwnRun = true;
  await until(readState, (s) => s.tick >= before.tick + 2, 'new market cycles');
  await shot(
    'market',
    8,
    [
      '4 | Apply the full model to a shared market',
      'Four agents: Aqua offers and V3 trades. Confirmed outcomes update readouts.',
    ],
    [
      '4｜全神経モデルを、同じ市場の4個体へ',
      'Aquaへの提示とV3での売買。確定した行動結果でreadoutを更新します。',
    ],
  );
  await until(
    readState,
    (s) =>
      s.routes.Aqua > before.routes.Aqua &&
      s.routes['Uniswap V3'] > before.routes['Uniswap V3'] &&
      s.tick >= before.tick + 6,
    'both settlement routes',
  );
  await stopOwnRun();
  assert.equal(after.error, null);
  for (const route of ['Aqua', 'Uniswap V3']) {
    const trade = after.transactions.find(
      (x) => x.kind === 'swap' && x.route === route && !before.transactions.some((b) => b.hash === x.hash),
    );
    assert(trade);
    await showReceipt(trade);
    await shot(
      route === 'Aqua' ? 'aqua' : 'uniswap',
      6,
      [
        route + ' | A freshly confirmed local settlement',
        'Actual token transfers and contract events. Test tokens on an Anvil fork.',
      ],
      [
        route + '｜今回成立したローカル決済',
        '実トークン移動とコントラクトのイベントを確認。Anvil forkのテスト通貨です。',
      ],
    );
    await page.locator('#close').click();
  }
  await setTargets(before.targets);
  await shot(
    'close',
    5,
    [
      'A framework for testing benefits and limits',
      'Learning updates work. Biological superiority and energy savings remain unproven.',
    ],
    [
      '効果と限界を比較できるフレームワークへ',
      '学習更新は動作。生物回路の優位と省電力効果は、今後同条件で検証します。',
    ],
  );
  const afterPolicy = JSON.parse(await readFile(`${marketDir}/readout.json`, 'utf8'));
  const policyChanges = after.flies.map((f, i) => ({
    name: f.name,
    updatesBefore: beforePolicy.updates[i],
    updatesAfter: afterPolicy.updates[i],
    weightsChanged: beforePolicy.weights[i]
      ? JSON.stringify(beforePolicy.weights[i]) !== JSON.stringify(afterPolicy.weights[i])
      : afterPolicy.weights[i].flat().some((v) => v !== 0),
    policyHashAtLastDecision: f.policyHash,
  }));
  assert(policyChanges.every((x) => x.updatesAfter > x.updatesBefore));
  assert(policyChanges.some((x) => x.weightsChanged));
  assert.deepEqual(errors, []);
  const e = {
    schema: 'bioagent.presenter-rerecord.v2',
    recordingStartedAtMilliseconds: started,
    recordedAt: new Date().toISOString(),
    scope: 'Fresh Anvil + full-population foraging and shared market; no public-chain writes',
    fork,
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
    foraging,
    browserErrors: errors,
    cues,
    end: time(),
    restoredTargets: (await readState()).targets,
    presentationChanges:
      'Cuts omit setup and learning waits; each shown segment is real time. Market CSS compacted and actual receipts excerpted. No simulated result injection.',
    paths: { marketState: marketDir, marketRpc: rpc, foragingUrl: forageUrl },
  };
  await writeFile(out + '/capture-evidence.json', JSON.stringify(e, null, 2) + '\n');
  console.log(
    JSON.stringify({
      cycles: e.after.tick - e.before.tick,
      routes: e.newRoutes,
      foraging: completed.reports['foraging:full'],
      shots: cues.length,
    }),
  );
} finally {
  if (startedOwnRun) {
    if (!page.url().startsWith(url)) await page.goto(url);
    await stopOwnRun();
  }
  if (ownForage)
    await page.request.post(forageUrl + '/api/stop', { headers: { Origin: forageUrl }, data: {} });
  if (!(await readState()).running) {
    if (!page.url().startsWith(url)) await page.goto(url);
    await setTargets(before.targets);
  }
  await context.close();
  await browser.close();
  p.destroy();
}
const raw = await video.path();
await writeFile(out + '/raw-video-path.txt', raw + '\n');
const evidence = JSON.parse(await readFile(out + '/capture-evidence.json', 'utf8'));
await renderPresenterDemo({ raw, evidence, out, delivery });
