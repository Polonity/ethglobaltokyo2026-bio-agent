import test from 'node:test';
import assert from 'node:assert/strict';
import { PaperArena, ATOM, PAPER_GAS } from '../packages/bio_agent/runtime/paper-arena.js';
const event = (n, price = 1) => ({
  id: `event-${n}`,
  blockNumber: n,
  blockHash: '0x' + n.toString(16).padStart(64, '0'),
  transactionHash: '0x' + (n + 100).toString(16).padStart(64, '0'),
  logIndex: 0,
  timestampMs: n * 1000,
  sqrtPriceX96: ((BigInt(Math.round(Math.sqrt(price) * 1e6)) * 2n ** 96n) / 1000000n).toString(),
});
const quotes = async (side, amount, e) => ({
  amountIn: amount,
  amountOut: ((BigInt(amount) * 997n) / 1000n).toString(),
  blockNumber: e.blockNumber,
  blockHash: e.blockHash,
  outputIncludesPoolFeesAndImpact: true,
});
test('orders fill only on a later block, quote fees and explicit gas reduce paper equity', async () => {
  const a = new PaperArena();
  await a.consume(event(1), quotes);
  a.flies[0].pending = { side: 'buy', blockNumber: 1 };
  await a.consume(event(2, 1.1), quotes);
  const f = a.flies[0];
  assert.equal(f.trades[0].decisionBlock, 1);
  assert.equal(f.trades[0].fillBlock, 2);
  assert.equal(f.cash, 90n * ATOM - PAPER_GAS);
  assert.ok(f.units > 0n);
  assert.ok(f.pnl < 0n);
  assert.equal(f.trades[0].transactionHash, undefined);
  const snapshot = a.snapshot();
  assert.equal(await a.consume(event(2, 1.1), quotes), false);
  assert.deepEqual(a.snapshot(), snapshot);
});
test('a failed quote does not partially change balances, seen events or random state', async () => {
  const a = new PaperArena();
  await a.consume(event(1), quotes);
  a.flies[0].pending = { side: 'buy', blockNumber: 1 };
  a.flies[1].pending = { side: 'buy', blockNumber: 1 };
  const before = a.snapshot();
  let count = 0;
  await assert.rejects(
    a.consume(event(2), async (...args) => {
      if (++count === 3) throw new Error('offline');
      return quotes(...args);
    }),
  );
  assert.deepEqual(a.snapshot(), before);
});
test('learning pauses decisions but preserves holdings and mark-to-market exposure', async () => {
  const a = new PaperArena();
  for (let n = 1; n <= 6; n++) await a.consume(event(n, n % 2 ? 1 : 1.1), quotes);
  assert.ok(a.flies.some((f) => f.state === 'learning'));
  const f = a.flies.find((f) => f.state === 'learning');
  assert.equal(f.decision, 'hold');
  assert.equal(f.pending, null);
  f.units = 5n * ATOM;
  f.cash = 90n * ATOM;
  const id = f.id;
  await a.consume(event(7), quotes);
  assert.equal(a.flies[id].state, 'learning');
  assert.equal(a.flies[id].decision, 'hold');
  assert.equal(a.flies[id].units, 5n * ATOM);
  assert.ok(a.flies[id].pnl < 0n);
  for (let n = 0; n < 41; n++) a.advanceLearning();
  assert.ok(a.flies[id].report);
  assert.equal(a.flies[id].state, 'watching');
});
test('reject orphan order, invalid prices and mis-sized quotes', async () => {
  const a = new PaperArena();
  await a.consume(event(2), quotes);
  await assert.rejects(a.consume(event(1), quotes));
  await assert.rejects(a.consume({ ...event(3), sqrtPriceX96: '0' }, quotes));
  a.flies[0].pending = { side: 'buy', blockNumber: 2 };
  await assert.rejects(
    a.consume(event(3), async (...args) => ({ ...(await quotes(...args)), amountIn: '1' })),
  );
});
