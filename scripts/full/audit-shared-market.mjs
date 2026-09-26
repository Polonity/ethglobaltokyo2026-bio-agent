import { JsonRpcProvider, Contract, Interface, parseEther } from 'ethers';
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { verifyAquaFork } from '../../services/full-apps/fork.mjs';
const dir = process.env.FULL_APPS_STATE_DIR || '.local/shared-market';
const config = JSON.parse(await readFile(`${dir}/chain.json`)),
  baseline = JSON.parse(await readFile(`${dir}/baseline.json`));
const provider = new JsonRpcProvider(process.env.SHARED_RPC_URL || 'http://127.0.0.1:18551');
try {
  const fork = await verifyAquaFork(
    provider,
    process.env.AQUA_FORK_MANIFEST || '.local/aqua-fork/upstream.json',
  );
  const iface = new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
  const wallets = config.wallets.map((x) => x.toLowerCase());
  const rows = [];
  for (let t = 0; t < 2; t++) {
    const expected = baseline.balances.map((row) => parseEther(String(row[t])));
    const logs = await provider.getLogs({
      address: config.tokens[t],
      fromBlock: config.block + 1,
      toBlock: 'latest',
      topics: [iface.getEvent('Transfer').topicHash],
    });
    for (const log of logs) {
      const { from, to, value } = iface.parseLog(log).args;
      wallets.forEach((w, i) => {
        if (from.toLowerCase() === w) expected[i] -= value;
        if (to.toLowerCase() === w) expected[i] += value;
      });
    }
    const token = new Contract(
      config.tokens[t],
      ['function balanceOf(address) view returns(uint256)'],
      provider,
    );
    for (let i = 0; i < 3; i++) {
      const actual = await token.balanceOf(wallets[i]);
      assert.equal(actual, expected[i]);
      rows.push({
        wallet: wallets[i],
        token: config.tokens[t],
        rawBalance: String(actual),
        transferLogs: logs.length,
        reconciled: true,
      });
    }
  }
  const cycles = (await readFile(`${dir}/cycles.jsonl`, 'utf8')).trim().split('\n').map(JSON.parse);
  const trades = cycles.flatMap((x) => x.trades),
    traces = [];
  for (const route of ['Aqua', 'Uniswap V3']) {
    const tx = trades.find((x) => x.route === route);
    assert(tx, `Missing ${route} fill`);
    const target = (route === 'Aqua' ? fork.aqua : config.pool).toLowerCase();
    const receipt = await provider.getTransactionReceipt(tx.hash);
    assert.equal(receipt.status, 1);
    const required =
      route === 'Aqua'
        ? [
            'Pushed(address,address,bytes32,address,uint256)',
            'Pulled(address,address,bytes32,address,uint256)',
          ]
        : ['Swap(address,address,int256,int256,uint160,uint128,int24)'];
    for (const event of required) {
      const topic = new Interface(['event ' + event]).fragments[0].topicHash;
      assert(receipt.logs.some((l) => l.address.toLowerCase() === target && l.topics[0] === topic));
    }
    let traceResult;
    try {
      const trace = await provider.send('debug_traceTransaction', [tx.hash, { tracer: 'callTracer' }]);
      const addresses = [];
      function walk(c) {
        if (c.to) addresses.push(c.to.toLowerCase());
        for (const x of c.calls || []) walk(x);
      }
      walk(trace);
      assert(addresses.includes(target));
      traceResult = 'verified';
    } catch (e) {
      if (!String(e.message).includes('missing bytecode')) throw e;
      traceResult = 'unavailable: Anvil historical bytecode lookup; receipt events verified instead';
    }
    traces.push({ route, hash: tx.hash, target, receiptEvents: required, trace: traceResult });
  }
  const times = cycles.map((x) => x.metrics.neuralMs).sort((a, b) => a - b);
  const report = {
    checkedAt: new Date().toISOString(),
    fork,
    cycles: cycles.length,
    transfers: rows,
    traces,
    resources: {
      neuronsPerFly: 166700,
      flies: 4,
      medianNeuralMs: times[Math.floor(times.length / 2)],
      maxNeuralMs: times.at(-1),
      peakRSSMiB: Math.max(...cycles.map((x) => x.metrics.peakRSSMiB)),
    },
    scope: 'Local fork transactions only; reconciliation is not profitability or biological validation.',
  };
  await writeFile('artifacts/shared-market/accounting.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.resources));
} finally {
  provider.destroy();
}
