import test from 'node:test';
import assert from 'node:assert/strict';
import { swapInterface, readSwapReceipt } from '../services/backend/adapters/uniswap-swap.mjs';
import { UniswapSwapBioAgent } from '../packages/bio_agent/runtime/swap-agent.js';
const pool = `0x${'11'.repeat(20)}`;
const tx = `0x${'22'.repeat(32)}`;
const blockHash = `0x${'33'.repeat(32)}`;
const market = { chainId: 31337, pool, confirmations: 2 };
function fixture() {
  const encoded = swapInterface.encodeEventLog(swapInterface.getEvent('Swap'), [
    pool,
    pool,
    1,
    -1,
    2n ** 96n,
    100,
    0,
  ]);
  const receipt = {
    status: 1,
    hash: tx,
    blockNumber: 10,
    blockHash,
    index: 0,
    logs: [{ ...encoded, address: pool, blockHash, transactionHash: tx, index: 0, removed: false }],
  };
  const block = { hash: blockHash, timestamp: 100 };
  return {
    receipt,
    block,
    provider: {
      getNetwork: async () => ({ chainId: 31337n }),
      getTransactionReceipt: async () => receipt,
      getBlockNumber: async () => 11,
      getBlock: async () => block,
    },
  };
}
const create = () => new UniswapSwapBioAgent({ id: '1', owner: pool }, market);
function next(event, sqrt, n = 1) {
  const e = {
    ...event,
    blockNumber: event.blockNumber + n,
    observedAt: event.observedAt + n * 1000,
    sqrtPriceX96: sqrt.toString(),
    transactionHash: `0x${String(n + 4).repeat(64)}`,
  };
  e.eventId = `${e.chainId}:${e.pool.toLowerCase()}:${e.blockHash}:${e.transactionHash}:${e.logIndex}`;
  return e;
}
test('verified receipt drives baseline/up/down; duplicate and stale inputs do not advance runtime', async () => {
  const { provider } = fixture();
  const [event] = await readSwapReceipt(provider, market, tx);
  const agent = create();
  assert.equal(agent.step(0.2, 100000).inputState, 'waiting');
  assert.equal(agent.observe(event, 100000).reaction, 'baseline');
  assert.equal(agent.observe(event, 100000), null);
  const up = next(event, 2n ** 97n);
  assert.equal(agent.observe(up, 101000).deltaBps, '30000');
  assert.equal(agent.lastInput.status.stimulus, 10000);
  const down = next(event, 2n ** 96n, 2);
  assert.equal(agent.observe(down, 102000).reaction, 'cautious');
  assert.equal(agent.lastInput.deltaBps, '-7500');
  const before = agent.arena.time;
  assert.equal(agent.step(0.2, 163000).inputState, 'stale');
  assert.equal(agent.arena.time, before);
  assert.throws(() => agent.observe({ ...down, pool: `0x${'44'.repeat(20)}` }, 102000));
  assert.throws(() => agent.observe(down, 99999));
});
test('reader rejects failed, wrong-chain, unconfirmed, orphaned and removed logs', async () => {
  for (const mutate of [
    (f) => {
      f.receipt.status = 0;
    },
    (f) => {
      f.provider.getNetwork = async () => ({ chainId: 1n });
    },
    (f) => {
      f.provider.getBlockNumber = async () => 10;
    },
    (f) => {
      f.block.hash = `0x${'44'.repeat(32)}`;
    },
    (f) => {
      f.receipt.logs[0].removed = true;
    },
  ]) {
    const f = fixture();
    mutate(f);
    await assert.rejects(readSwapReceipt(f.provider, market, tx));
  }
});
test('reader ignores another pool, rejects invalid confirmation policy', async () => {
  const f = fixture();
  f.receipt.logs[0].address = `0x${'44'.repeat(20)}`;
  assert.deepEqual(await readSwapReceipt(f.provider, market, tx), []);
  await assert.rejects(readSwapReceipt(f.provider, { ...market, confirmations: 0 }, tx));
});
test('runtime rejects reordered logs and same-height reorg; baseline resets after a long gap', async () => {
  const [event] = await readSwapReceipt(fixture().provider, market, tx);
  const agent = create();
  agent.observe(event, 100000);
  const up = next(event, 2n ** 97n);
  agent.observe(up, 101000);
  const reorg = { ...up, blockHash: `0x${'55'.repeat(32)}` };
  reorg.eventId = `${reorg.chainId}:${reorg.pool.toLowerCase()}:${reorg.blockHash}:${reorg.transactionHash}:${reorg.logIndex}`;
  assert.throws(() => agent.observe(reorg, 101000), /Reorg/);
  const earlier = { ...next(event, 2n ** 96n, 2), blockNumber: 9 };
  assert.throws(() => agent.observe(earlier, 102000), /order/);
  const delayed = { ...next(event, 2n ** 96n, 3), observedAt: 200000 };
  assert.equal(agent.observe(delayed, 200000).reaction, 'baseline');
});
