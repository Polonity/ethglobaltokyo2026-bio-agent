import { chromium } from '@playwright/test';
import { Interface } from 'ethers/abi';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const deployment = JSON.parse(
  await readFile(`${process.env.LOCAL_STATE_DIR || '.local'}/deployment.json`, 'utf8'),
);
const base = process.env.LOCAL_GUI_URL || deployment.guiUrl;
assert.ok(
  ['localhost', '127.0.0.1'].includes(new URL(base).hostname),
  'This test writes to local Anvil only',
);
const rpcURL = deployment.rpcUrl;
assert.equal(new URL(rpcURL).hostname, '127.0.0.1');
const contract = new Interface(JSON.parse(await readFile('contracts/abi/BioAgentRegistry.json', 'utf8')));
async function rpc(method, params = []) {
  const response = await fetch(rpcURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const body = await response.json();
  assert.ok(!body.error, JSON.stringify(body.error));
  return body.result;
}
assert.equal(BigInt(await rpc('eth_chainId')), 31337n);
assert.match(await rpc('web3_clientVersion'), /^anvil\//i);
const out = 'artifacts/local-chain';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
});
const errors = [],
  results = {};
const snapshot = async () => (await fetch(`${base}/api/chain/snapshot`)).json();
let reorgSnapshot;
try {
  const page = await browser.newPage({
    locale: 'ja-JP',
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/?test=1`);
  await page.waitForFunction(() => window.__chain?.ready);
  assert.equal(await page.locator('.rank-row').count(), 3);
  const initial = await snapshot();
  assert.equal(initial.agents.length, 3);
  results.initial = initial;
  await page.locator('label.toggle').click();
  assert.equal(await page.locator('#auto-learn').isChecked(), false);
  await page.evaluate(() => {
    window.__arena.duration = 300;
  });
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  // Hold the transaction in Anvil's mempool: the UI must not apply it optimistically.
  await rpc('evm_setAutomine', [false]);
  await page.locator('[data-mode="forage"]').click();
  await page.locator('#energy').fill('90');
  await page.locator('#stimulus').fill('95');
  await page.locator('#apply').click();
  await page.waitForFunction(() => window.__chain.lastTx?.stage === 'submitted');
  const forageTx = await page.evaluate(() => window.__chain.lastTx.transactionHash);
  await page.waitForTimeout(500);
  assert.equal(
    await page.evaluate(() => window.__arena.flies[0].chain.revision),
    initial.agents[0].status.revision,
  );
  assert.equal(await page.evaluate(() => window.__chain.lastTx.applied), false);
  assert.equal(await rpc('eth_getTransactionReceipt', [forageTx]), null);
  await rpc('evm_mine');
  await rpc('evm_setAutomine', [true]);
  await page.waitForFunction(() => window.__chain.lastTx?.applied && !window.__chain.busy);
  const updated = await snapshot();
  assert.equal(updated.agents[0].status.stimulus, 9500);
  assert.equal(updated.agents[0].status.activity, 2);
  assert.equal(updated.agents[0].cause.transactionHash, forageTx);
  assert.deepEqual(
    updated.agents.slice(1).map((a) => a.status),
    initial.agents.slice(1).map((a) => a.status),
  );
  assert.equal(await page.evaluate(() => window.__arena.flies[0].input.mode), 'forage');
  // Watch actual animation ticks, not just source or API responses.
  await page.evaluate(() => {
    window.__arena.flies[0].decisionCounts = { rest: 0, move: 0 };
  });
  await page.getByRole('button', { name: '再開', exact: true }).click();
  await page.locator('#speed').click();
  await page.locator('#speed').click();
  await page.waitForFunction(
    () => window.__arena.flies[0].decisionCounts.move + window.__arena.flies[0].decisionCounts.rest >= 30,
  );
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  const forageDecisions = await page.evaluate(() => window.__arena.flies[0].decisionCounts);
  await page.locator('[data-mode="rest"]').click();
  await page.locator('#energy').fill('40');
  await page.locator('#stimulus').fill('0');
  await page.locator('#apply').click();
  await page.waitForFunction(
    (hash) =>
      window.__chain.lastTx?.applied &&
      !window.__chain.busy &&
      window.__chain.lastTx.transactionHash !== hash,
    forageTx,
  );
  const restTx = await page.evaluate(() => window.__chain.lastTx.transactionHash);
  await page.evaluate(() => {
    window.__arena.flies[0].decisionCounts = { rest: 0, move: 0 };
  });
  await page.getByRole('button', { name: '再開', exact: true }).click();
  await page.waitForFunction(
    () => window.__arena.flies[0].decisionCounts.move + window.__arena.flies[0].decisionCounts.rest >= 30,
  );
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  const restDecisions = await page.evaluate(() => window.__arena.flies[0].decisionCounts);
  assert.ok(forageDecisions.move > forageDecisions.rest, JSON.stringify(forageDecisions));
  assert.ok(restDecisions.rest > restDecisions.move, JSON.stringify(restDecisions));
  results.reaction = { forageTx, restTx, forageDecisions, restDecisions };
  // Duplicate log delivery must not reapply a status.
  const count = await page.evaluate(() => {
    const before = window.__arena.events.length;
    window.__chain.ingest([window.__arena.flies[0].chain.cause]);
    return [before, window.__arena.events.length];
  });
  assert.equal(count[0], count[1]);
  // Verify failed input and stale revisions never send a successful update.
  const stale = await page.request.post(`${base}/api/chain/status`, {
    headers: { Origin: base },
    data: { agentId: '1', expectedRevision: '1', activity: 1, energy: 5000, stimulus: 5000 },
  });
  assert.equal(stale.status(), 409);
  const invalid = await page.request.post(`${base}/api/chain/status`, {
    headers: { Origin: base },
    data: { agentId: '1', expectedRevision: '3', activity: 1, energy: 10001, stimulus: 0 },
  });
  assert.equal(invalid.status(), 400);
  const foreignOrigin = await page.request.post(`${base}/api/chain/status`, {
    headers: { Origin: 'https://example.com' },
    data: {},
  });
  assert.equal(foreignOrigin.status(), 403);
  // An external transaction must be caught by the same event poller.
  reorgSnapshot = await rpc('evm_snapshot');
  const current = await snapshot();
  const tx = await rpc('eth_sendTransaction', [
    {
      from: deployment.owner,
      to: deployment.registryAddress,
      data: contract.encodeFunctionData('updateStatus', [
        '2',
        current.agents[1].status.revision,
        1,
        7500,
        6600,
      ]),
      gas: '0x493e0',
    },
  ]);
  await page.waitForFunction((hash) => window.__arena.flies[1].chain.cause.transactionHash === hash, tx);
  assert.equal(await page.evaluate(() => window.__arena.flies[1].input.stimulus), 0.66);
  results.externalTransaction = tx;
  // Reload restores the latest canonical Status from storage plus its event provenance.
  await page.reload();
  await page.waitForFunction(() => window.__chain?.ready);
  assert.equal(await page.evaluate(() => window.__arena.flies[1].input.stimulus), 0.66);
  // Reorg recovery starts a new race from the canonical snapshot, never retains orphaned input.
  assert.equal(await rpc('evm_revert', [reorgSnapshot]), true);
  reorgSnapshot = null;
  await page.waitForFunction(
    () => window.__chain?.ready && window.__arena.events.some((e) => e.title === 'CHAIN RESYNC'),
  );
  assert.equal(
    await page.evaluate(() => window.__arena.flies[1].chain.revision),
    current.agents[1].status.revision,
  );
  const canonical = await snapshot();
  results.finalStatuses = canonical.agents.map((a) => ({
    agentId: a.agentId,
    status: a.status,
    cause: a.cause,
  }));
  await page.screenshot({ path: `${out}/desktop.png`, fullPage: true });
  const mobile = await browser.newPage({
    locale: 'ja-JP',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on('pageerror', (e) => errors.push(e.message));
  await mobile.goto(`${base}/?test=1`);
  await mobile.waitForFunction(() => window.__chain?.ready);
  assert.equal(await mobile.locator('.rank-row').count(), 3);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.screenshot({ path: `${out}/mobile.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    `${out}/verification.json`,
    JSON.stringify(
      {
        url: base,
        passed: true,
        registry: deployment.registryAddress,
        checks: [
          'three-registered-agents',
          'no-optimistic-input-before-mining',
          'GUI-contract-log-agent',
          'isolated-agent-update',
          'observed-behavior-change',
          'deduplication',
          'invalid-and-stale-rejection',
          'same-origin-guard',
          'external-log-reception',
          'reload-snapshot',
          'reorg-resync',
          'mobile-layout',
        ],
        ...results,
      },
      null,
      2,
    ),
  );
  console.log(
    'Local Anvil + Workers browser checks passed. Evidence: artifacts/local-chain/verification.json',
  );
  console.log(JSON.stringify(results.reaction));
} finally {
  await rpc('evm_setAutomine', [true]);
  if (reorgSnapshot) await rpc('evm_revert', [reorgSnapshot]);
  await browser.close();
}
