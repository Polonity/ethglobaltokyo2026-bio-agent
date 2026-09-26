import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';
import { ContractFactory, Contract, JsonRpcProvider, Wallet, parseEther } from 'ethers';
import { buildDemo } from './build.mjs';
import { createDemoServer } from './serve.mjs';
import { loadWallet, provider as publicProvider, artifact, json, local } from './common.mjs';
import { sendOnce } from './transactions.mjs';
import { MALE_CNS } from '../../packages/bio_agent/connectome/male-cns.js';

const urlIndex = process.argv.indexOf('--url');
const publicURL = urlIndex >= 0 ? process.argv[urlIndex + 1] : null;
const broadcast = process.argv.includes('--broadcast');
if (broadcast && publicURL !== 'https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/')
  throw Error('Public write check requires the exact approved demo URL');
const out = `artifacts/sepolia/${publicURL ? 'public' : 'local'}-browser`;
await fs.mkdir(out, { recursive: true });
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bioagent-sepolia-browser-'));
let anvil, server, p, wallet, config, browser, page;
const errors = [],
  failed = [],
  writes = [],
  result = {
    scope: publicURL ? 'live-ethereum-sepolia' : 'isolated-anvil-chain-11155111',
    walletBridge: 'EIP-1193 browser bridge; signer in Node only, not a MetaMask UI test',
  };
try {
  if (publicURL) {
    p = await publicProvider();
    config = JSON.parse(await fs.readFile('contracts/deployments/sepolia.json', 'utf8'));
    if (broadcast) wallet = (await loadWallet()).connect(p);
  } else {
    const probe = createServer();
    await new Promise((r) => probe.listen(0, '127.0.0.1', r));
    const port = probe.address().port;
    await new Promise((r) => probe.close(r));
    anvil = spawn(
      process.env.ANVIL || path.join(os.homedir(), '.foundry/bin/anvil'),
      [
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--chain-id',
        '11155111',
        '--block-time',
        '1',
        '--silent',
      ],
      { stdio: 'ignore' },
    );
    const rpcURL = `http://127.0.0.1:${port}`;
    for (let i = 0; i < 100; i++) {
      try {
        await fetch(rpcURL);
        break;
      } catch {
        await delay(50);
      }
    }
    p = new JsonRpcProvider(rpcURL, undefined, { batchMaxCount: 1 });
    p.pollingInterval = 100;
    wallet = Wallet.createRandom().connect(p);
    await p.send('anvil_setBalance', [wallet.address, '0x' + parseEther('1').toString(16)]);
    const a = await artifact();
    const registry = await new ContractFactory(a.abi, a.bytecode.object, wallet).deploy();
    await registry.waitForDeployment();
    await (await registry.registerAgent(MALE_CNS.graphSha256, 'https://example.test/model.json')).wait();
    await (await registry.updateStatus(1, 1, 2, 7000, 5500)).wait();
    config = {
      chainId: 11155111,
      registryAddress: await registry.getAddress(),
      modelHash: MALE_CNS.graphSha256,
      demoAgentId: '1',
    };
    const root = path.join(directory, 'site');
    await buildDemo({ output: root, deployment: config });
    server = createDemoServer({ root, rpcURL });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox'],
  });
  page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push({ url: r.url(), status: r.status() });
  });
  if (wallet) {
    const iface = new Contract(config.registryAddress, (await artifact()).abi, p).interface;
    const readMethods = new Set([
      'eth_chainId',
      'eth_blockNumber',
      'eth_getBlockByNumber',
      'eth_getTransactionByHash',
      'eth_getTransactionReceipt',
      'eth_getTransactionCount',
      'eth_estimateGas',
      'eth_gasPrice',
      'eth_maxPriorityFeePerGas',
      'eth_feeHistory',
      'eth_call',
    ]);
    await page.exposeFunction('sepoliaWalletRequest', async ({ method, params = [] }) => {
      if (['eth_requestAccounts', 'eth_accounts'].includes(method)) return [wallet.address];
      if (method === 'wallet_switchEthereumChain') {
        assert.equal(params[0].chainId, '0xaa36a7');
        return null;
      }
      if (method === 'eth_sendTransaction') {
        const tx = params[0];
        assert.equal(tx.to.toLowerCase(), config.registryAddress.toLowerCase());
        assert.equal(tx.from.toLowerCase(), wallet.address.toLowerCase());
        assert.equal(BigInt(tx.value || 0), 0n);
        const decoded = iface.parseTransaction({ data: tx.data });
        assert.ok(['registerAgent', 'updateStatus'].includes(decoded.name));
        if (publicURL) {
          assert.equal(decoded.name, 'updateStatus');
          assert.equal(decoded.args[0].toString(), config.demoAgentId);
          assert.ok([0n, 2n].includes(decoded.args[2]));
        }
        const receipt = await sendOnce({
          provider: p,
          wallet,
          directory: publicURL ? path.join(local, 'journal') : path.join(directory, 'journal'),
          label: `browser-${decoded.name.toLowerCase()}-${decoded.name === 'updateStatus' ? decoded.args[1].toString() : 'new'}`,
          request: { to: tx.to, data: tx.data },
        });
        writes.push({
          method: decoded.name,
          hash: receipt.hash,
          block: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          feeWei: receipt.fee.toString(),
        });
        return receipt.hash;
      }
      if (!readMethods.has(method)) throw Error('Unsupported test wallet method');
      return p.send(method, params);
    });
    await page.addInitScript(() => {
      const handlers = {};
      window.ethereum = {
        request: (args) => window.sepoliaWalletRequest(args),
        on: (name, fn) => {
          (handlers[name] ??= []).push(fn);
        },
        testEmit: (name, arg) => handlers[name]?.forEach((fn) => fn(arg)),
      };
    });
  }
  const url = publicURL || `http://127.0.0.1:${server.address().port}/`;
  await page.goto(url);
  await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
  result.initialRevision = await page.locator('#revision').textContent();
  const tick = Number(await page.locator('body').getAttribute('data-ticks'));
  await page.waitForFunction((n) => Number(document.body.dataset.ticks) > n + 2, tick);
  assert.equal(await page.locator('#send').isDisabled(), true);
  if (wallet) {
    await page.locator('#connect').click();
    await page.waitForFunction(() => !document.querySelector('#register').disabled);
    if (!publicURL) {
      await page.locator('#register').click();
      await page.waitForFunction(
        () => document.body.dataset.agentId === '2' && document.body.dataset.ready === 'true',
        null,
        { timeout: 60000 },
      );
      result.browserRegistration = true;
    }
    // Confirm rest is accepted on-chain and drives action 8, then restore foraging for judges.
    for (const [mode, stimulus] of [
      ['0', '95'],
      ['2', '55'],
    ]) {
      const before = Number(await page.locator('#revision').textContent());
      await page.locator('#activity').selectOption(mode);
      await page.locator('#stimulus').fill(stimulus);
      await page.locator('#supply').fill('70');
      await page.locator('#send').click();
      await page.waitForFunction(
        (rev) => Number(document.querySelector('#revision').textContent) > rev,
        before,
        { timeout: 180000 },
      );
      if (mode === '0')
        await page.waitForFunction(
          () => ['休息', 'Rest'].includes(document.querySelector('#action').textContent),
          null,
          { timeout: 15000 },
        );
    }
    result.browserInputUpdates = true;
  }
  await page.locator('#learn').click();
  await page.waitForFunction(
    () => !document.querySelector('#learn').disabled && document.querySelector('#learning-result table'),
    null,
    { timeout: 60000 },
  );
  result.learningText = await page.locator('#learning-result').textContent();
  const version = await page.locator('body').getAttribute('data-policy');
  assert.equal(version, '2');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  await download.saveAs(`${out}/decision.json`);
  const evidence = JSON.parse(await fs.readFile(`${out}/decision.json`, 'utf8'));
  assert.equal(evidence.decision.input.chainId, 11155111);
  assert.equal(evidence.decision.input.model, MALE_CNS.graphSha256);
  assert.equal(evidence.policy.version, 2);
  assert.ok(evidence.learning.accepted);
  result.learning = evidence.learning;
  result.input = evidence.decision.input;
  await page.screenshot({ path: `${out}/ja.png`, fullPage: true });
  await page.locator('#language').click();
  assert.match(await page.locator('h1').textContent(), /On-chain/);
  await page.screenshot({ path: `${out}/en.png`, fullPage: true });
  await page.reload();
  await page.waitForFunction(
    () => document.body.dataset.ready === 'true' && document.body.dataset.policy === '2',
    null,
    { timeout: 60000 },
  );
  result.restored = true;
  await page.setViewportSize({ width: 390, height: 844 });
  result.mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(result.mobileOverflow, false);
  await page.screenshot({ path: `${out}/mobile.png`, fullPage: true });
  if (wallet && !publicURL) {
    await page.locator('#connect').click();
    await page.waitForFunction(() => !document.querySelector('#send').disabled);
    await page.evaluate(() => window.ethereum.testEmit('chainChanged', '0x1'));
    assert.equal(await page.locator('#send').isDisabled(), true);
    result.walletChangeDisablesWrites = true;
  }
  // Exercise actual freshness gate without spending any gas or changing the shared RPC.
  await page.evaluate(() => {
    const original = Date.now;
    Date.now = () => original() + 180000;
  });
  await page.waitForFunction(() => document.querySelector('#live').textContent === 'PAUSED');
  result.staleInputPauses = true;
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  Object.assign(result, { passed: true, writes, errors, failed });
  await json(`${out}/result.json`, result);
  console.log(
    JSON.stringify({
      passed: true,
      scope: result.scope,
      writes,
      restored: result.restored,
      mobileOverflow: result.mobileOverflow,
      staleInputPauses: result.staleInputPauses,
    }),
  );
} catch (e) {
  console.error(e);
  if (page) {
    console.error(await page.locator('#notice').textContent());
    await page.screenshot({ path: `${out}/failure.png`, fullPage: true });
  }
  await json(`${out}/failure.json`, { message: e.message, errors, failed, writes });
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
  p?.destroy();
  anvil?.kill('SIGTERM');
  await fs.rm(directory, { recursive: true, force: true });
}
