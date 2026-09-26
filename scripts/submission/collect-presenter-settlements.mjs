import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { JsonRpcProvider, Interface } from 'ethers';
const dir = process.env.PRESENTER_DELIVERY || 'docs/submission/presenter-kit';
const e = JSON.parse(await readFile(`${dir}/capture-evidence.json`, 'utf8'));
const end = Date.parse(e.recordedAt),
  start = end - e.end * 1000 - 1000;
const cycles = (await readFile(`${e.paths?.marketState || '.local/shared-market'}/cycles.jsonl`, 'utf8'))
  .trim()
  .split('\n')
  .map(JSON.parse)
  .filter(
    (c) =>
      c.tick > e.before.tick &&
      c.tick <= e.after.tick &&
      Date.parse(c.time) >= start &&
      Date.parse(c.time) <= end,
  );
assert.equal(cycles.length, e.after.tick - e.before.tick);
assert.deepEqual(
  cycles.map((c) => c.tick),
  Array.from({ length: cycles.length }, (_, i) => e.before.tick + i + 1),
);
const p = new JsonRpcProvider(e.paths?.marketRpc || 'http://127.0.0.1:18551', undefined, {
  batchMaxCount: 1,
});
const records = [];
try {
  assert.equal(BigInt(await p.send('eth_chainId', [])), 31337n);
  const events = new Interface([
    'event Transfer(address indexed from,address indexed to,uint256 value)',
    'event Swap(address,address,int256,int256,uint160,uint128,int24)',
    'event Pushed(address,address,bytes32,address,uint256)',
    'event Pulled(address,address,bytes32,address,uint256)',
  ]);
  for (const c of cycles)
    for (const trade of c.trades) {
      const receipt = await p.getTransactionReceipt(trade.hash);
      assert.equal(receipt.status, 1);
      assert.equal(receipt.blockNumber, trade.block);
      const transferLogs = receipt.logs.filter(
        (l) =>
          e.config.tokens.some((t) => t.toLowerCase() === l.address.toLowerCase()) &&
          l.topics[0] === events.getEvent('Transfer').topicHash,
      );
      assert(transferLogs.length >= 2);
      const emitter = trade.route === 'Aqua' ? e.fork.aqua : e.config.pool;
      const names = trade.route === 'Aqua' ? ['Pushed', 'Pulled'] : ['Swap'];
      for (const name of names)
        assert(
          receipt.logs.some(
            (l) =>
              l.address.toLowerCase() === emitter.toLowerCase() &&
              l.topics[0] === events.getEvent(name).topicHash,
          ),
        );
      records.push({
        cycle: c.tick,
        trade,
        verifiedEventEmitter: emitter,
        verifiedEvents: names,
        tokenTransferCount: transferLogs.length,
        receipt: receipt.toJSON(),
      });
    }
} finally {
  p.destroy();
}
const routes = Object.fromEntries(
  Object.keys(e.newRoutes).map((r) => [r, records.filter((x) => x.trade.route === r).length]),
);
assert.deepEqual(routes, e.newRoutes);
assert.equal(new Set(records.map((r) => r.trade.hash)).size, records.length);
const result = {
  verifiedAt: new Date().toISOString(),
  chainId: 31337,
  scope:
    'Read-only receipt verification on the recording Anvil instance; local fork, not public-chain transactions',
  cycles,
  routeCounts: routes,
  records,
};
await writeFile(`${dir}/settlement-evidence.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ cycles: cycles.length, successfulReceipts: records.length, routes }));
