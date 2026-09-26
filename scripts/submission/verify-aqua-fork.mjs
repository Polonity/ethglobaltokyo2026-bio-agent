import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { Contract, Interface } from 'ethers';
import { JsonRpcProvider } from 'ethers';
import { verifyAquaFork } from '../../services/full-apps/fork.mjs';
const base = 'http://127.0.0.1:8813',
  out = process.env.AQUA_EVIDENCE_OUTPUT || 'artifacts/aqua-fork';
const captioned = process.env.AQUA_DEMO_CAPTIONS === '1';
const chapters = [];
await mkdir(`${out}/video`, { recursive: true });
const provider = new JsonRpcProvider('http://127.0.0.1:18551');
const upstream = await verifyAquaFork(provider, '.local/aqua-fork/upstream.json');
const forge = spawnSync(
  process.env.FORGE_BIN || `${process.env.HOME}/.foundry/bin/forge`,
  [
    'test',
    '--root',
    'contracts',
    '--match-contract',
    '^AquaOfficialForkTest$',
    '--fork-url',
    process.env.AQUA_UPSTREAM_RPC || 'https://eth.drpc.org',
    '--fork-block-number',
    String(upstream.blockNumber),
    '-vv',
  ],
  {
    encoding: 'utf8',
    env: { ...process.env, RUN_AQUA_FORK: 'true', AQUA_EXPECTED_CODE_HASH: upstream.codeHash },
  },
);
await writeFile(`${out}/foundry-fork-tests.txt`, forge.stdout + forge.stderr);
assert.equal(forge.status, 0, forge.stdout + forge.stderr);
const initial = await fetch(base + '/api/state').then((r) => r.json());
assert.equal(initial.busy, null, 'Stop existing experiment before verification');
assert.equal(initial.chain.aqua, upstream.aqua);
const cfg = initial.chain,
  tokens = initial.display.aqua.full;
const taker = await (await provider.getSigner(1)).getAddress();
async function balances() {
  return Promise.all(
    tokens.map(async (token) => {
      const t = new Contract(token.address, ['function balanceOf(address) view returns(uint256)'], provider);
      return {
        ...token,
        maker: String(await t.balanceOf(cfg.owner)),
        taker: String(await t.balanceOf(taker)),
      };
    }),
  );
}
const before = await balances(),
  startBlock = await provider.getBlockNumber();
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const context = await browser.newContext({
  viewport: { width: 1600, height: 1050 },
  locale: 'en-US',
  recordVideo: { dir: `${out}/video`, size: { width: 1600, height: 1050 } },
});
const page = await context.newPage(),
  video = page.video(),
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const recordingStart = performance.now();
async function caption(title, detail) {
  if (!captioned) return;
  chapters.push({ seconds: (performance.now() - recordingStart) / 1000, title, detail });
  await page.evaluate(
    ({ title, detail }) => {
      let box = document.getElementById('demo-caption');
      if (!box) {
        box = document.createElement('aside');
        box.id = 'demo-caption';
        box.style.cssText =
          'position:fixed;top:84px;left:50%;transform:translateX(-50%);width:660px;padding:20px 24px;border-radius:18px;background:#092d28ed;border:1px solid #adcfad88;color:#f7f7e9;z-index:50;text-align:center;pointer-events:none;font:20px/1.4 system-ui';
        document.body.append(box);
      }
      const heading = document.createElement('strong');
      heading.textContent = title;
      heading.style.cssText = 'display:block;font-size:26px;margin-bottom:7px';
      const text = document.createElement('span');
      text.textContent = detail;
      box.replaceChildren(heading, text);
    },
    { title, detail },
  );
}
let final;
try {
  await page.goto(base + '/aqua');
  await page.selectOption('#language', 'en');
  await page.waitForFunction(() => !document.querySelector('#live').disabled);
  assert.match(await page.locator('.network').innerText(), /Ethereum fork/);
  await caption(
    'MOMO & SORA · BioAgent Aqua',
    'Two neural agents. One shared wallet. Real test-token settlement.',
  );
  await page.waitForTimeout(captioned ? 5500 : 3500);
  await page.locator('#live').click();
  await caption(
    'Biological structure → liquidity decisions',
    '166,700 MaleCNS neurons per fly · engineered dynamics and learned readouts',
  );
  for (let i = 0; i < 600; i++) {
    final = await fetch(base + '/api/state').then((r) => r.json());
    if (final.latest.aqua?.phase === 'error') throw Error(final.latest.aqua.error);
    if (final.latest.aqua?.startedAt !== initial.latest.aqua?.startedAt && final.latest.aqua?.tick >= 18)
      break;
    if (i === 599) throw Error('Live fork decisions timed out');
    await page.waitForTimeout(200);
  }
  await page.locator('#stop').click();
  for (let i = 0; i < 200; i++) {
    final = await fetch(base + '/api/state').then((r) => r.json());
    if (!final.busy) break;
    if (i === 199) throw Error('Stop timeout');
    await page.waitForTimeout(200);
  }
  assert.equal(final.latest.aqua.neural.neuronsPerIndividual, 166700);
  assert(final.latest.aqua.tick >= 18, 'Record the new run, not a previous run snapshot');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/aqua-live-en.png` });
  const abi = new Interface(JSON.parse(await readFile('contracts/out/AquaFlyApp.sol/AquaFlyApp.json')).abi);
  const logs = await provider.getLogs({
    address: cfg.aquaApps.full.app,
    fromBlock: startBlock + 1,
    toBlock: 'latest',
    topics: [abi.getEvent('Filled').topicHash],
  });
  assert(logs.length > 0, 'Actual test-token settlement is mandatory');
  const fills = [];
  for (const log of logs) {
    const receipt = await fetch(`${base}/tx/${log.transactionHash}`).then((r) => r.json());
    assert.equal(receipt.status, 1);
    assert.equal(receipt.transfers.length, 3);
    fills.push({ hash: log.transactionHash, blockNumber: receipt.blockNumber, transfers: receipt.transfers });
  }
  const aquaAbi = new Interface(JSON.parse(await readFile('contracts/out/Aqua.sol/Aqua.json')).abi);
  const lifecycle = (
    await provider.getLogs({ address: cfg.aqua, fromBlock: startBlock + 1, toBlock: 'latest' })
  )
    .map((log) => ({ log, event: aquaAbi.parseLog(log) }))
    .filter((x) => ['Shipped', 'Docked'].includes(x.event?.name))
    .map(({ log, event }) => ({
      name: event.name,
      hash: log.transactionHash,
      maker: event.args.maker,
      app: event.args.app,
      strategyHash: event.args.strategyHash,
    }));
  assert(lifecycle.some((x) => x.name === 'Shipped'));
  assert(lifecycle.some((x) => x.name === 'Docked'));
  assert(lifecycle.every((x) => x.maker.toLowerCase() === cfg.owner.toLowerCase()));
  const after = await balances();
  for (let i = 0; i < tokens.length; i++) {
    for (const [role, address] of [
      ['maker', cfg.owner],
      ['taker', taker],
    ]) {
      let expected = 0n;
      for (const transfer of fills
        .flatMap((f) => f.transfers)
        .filter((t) => t.token.toLowerCase() === tokens[i].address.toLowerCase())) {
        if (transfer.to.toLowerCase() === address.toLowerCase()) expected += BigInt(transfer.rawAmount);
        if (transfer.from.toLowerCase() === address.toLowerCase()) expected -= BigInt(transfer.rawAmount);
      }
      assert.equal(
        BigInt(after[i][role]) - BigInt(before[i][role]),
        expected,
        'Transfers must reconcile to wallet balance changes',
      );
    }
  }
  const selected = fills.at(-1);
  const trace = await provider.send('debug_traceTransaction', [selected.hash, { tracer: 'callTracer' }]);
  const calls = [];
  function walk(call) {
    if (call.to?.toLowerCase() === cfg.aqua.toLowerCase())
      calls.push(aquaAbi.parseTransaction({ data: call.input }).name);
    for (const child of call.calls || []) walk(child);
  }
  walk(trace);
  assert(calls.includes('push') && calls.includes('pull'));
  await caption(
    'Offer. Widen. Withdraw.',
    'The selected strategies use one maker wallet through Aqua virtual balances.',
  );
  if (captioned) await page.waitForTimeout(4500);
  await page.evaluate(() => document.getElementById('demo-caption')?.remove());
  await page.locator('#open-details').click();
  await page.locator('[data-pane="evidence"]').click();
  await page.locator('#official-aqua-proof').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/official-contract-en.png` });
  await page.locator(`#tx a[href="/tx/${selected.hash}"]`).click();
  await page.waitForFunction(() =>
    document.querySelector('#receipt-body').textContent.includes('Actual token transfers'),
  );
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/transfer-receipt-en.png` });
  await page.locator('#receipt-body .receipt-row').last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${out}/token-transfers-en.png` });
  if (captioned) {
    await page.locator('#close-receipt').click();
    await page.locator('#close-details').click();
    await caption(
      'Aqua settles. BioAgent decides.',
      'Official Aqua on an Ethereum local fork · test tokens · saved learned policies',
    );
    await page.waitForTimeout(5500);
    await page.screenshot({ path: `${out}/closing-en.png` });
  }
  assert.deepEqual(errors, []);
  const report = {
    checkedAt: new Date().toISOString(),
    chapters,
    upstream,
    app: cfg.aquaApps.full.app,
    maker: cfg.owner,
    taker,
    neuronsPerIndividual: final.latest.aqua.neural.neuronsPerIndividual,
    names: final.latest.aqua.snapshot.flies.map((f) => f.name),
    steps: final.latest.aqua.tick,
    policies: final.latest.aqua.decisions,
    before,
    after,
    fills,
    lifecycle,
    representative: { transactionHash: selected.hash, aquaCalls: calls },
    foundry: '6 official-fork tests passed; see foundry-fork-tests.txt',
    browserErrors: errors,
    limits:
      'Local fork test tokens; engineered prices/taker; no mainnet transactions, SwapVM or profitability claim.',
  };
  await writeFile(`${out}/verification.json`, JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify({
      fills: fills.length,
      lifecycle: lifecycle.length,
      neurons: report.neuronsPerIndividual,
      representative: report.representative,
    }),
  );
} finally {
  await context.close();
  await browser.close();
  provider.destroy();
}
const raw = await video.path();
const ff = spawnSync(
  'ffmpeg',
  [
    '-y',
    '-i',
    raw,
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    `${out}/aqua-official-fork-en.mp4`,
  ],
  { encoding: 'utf8' },
);
assert.equal(ff.status, 0, ff.stderr);
