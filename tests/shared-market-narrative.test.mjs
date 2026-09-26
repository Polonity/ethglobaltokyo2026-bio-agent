import { test } from 'node:test';
import assert from 'node:assert/strict';
import { narrative } from '../services/shared-market/narrative.mjs';
const state = { tick: 2, running: false, phase: 'paused', config: { symbols: ['NECTAR', 'POLLEN'] } };
test('receipt output and valuation loss are distinct', () => {
  const n = narrative(
    {
      role: 'trader',
      status: 'buy',
      holding: 0.5,
      target: 0.7,
      trade: {
        route: 'Aqua',
        amountOut: '2.1',
        output: 'NECTAR',
        hash: '0x123',
        quotes: [
          { route: 'Aqua', out: '2.1' },
          { route: 'Uniswap V3', out: '2' },
        ],
      },
      result: { cycle: 2, valuationChange: -0.02 },
    },
    state,
    true,
  );
  assert.match(n.reason, /Uniswap V3より受取 \+0.1000/);
  assert.match(n.note, /利益額ではありません/);
  assert.match(n.result, /-0.0200 POLLEN/);
});
test('unfilled maker does not claim individual profit', () => {
  const n = narrative(
    {
      role: 'maker',
      status: 'tight',
      spread: 10,
      result: { cycle: 2, fills: 0, valuationChange: 0.03, sharedWallet: true },
    },
    state,
    true,
  );
  assert.match(n.reason, /約定なし/);
  assert.match(n.result, /共有口座/);
});
test('hold explicitly means no order; thinking never claims a fill', () => {
  assert.match(narrative({ role: 'trader', status: 'hold' }, state, true).title, /発注なし/);
  const n = narrative({ status: 'thinking' }, { ...state, running: true, phase: 'thinking' }, true);
  assert.equal(n.result, null);
  assert.equal(n.badge, '?');
});
test('stale valuation result is not presented as the current cycle', () => {
  assert.equal(
    narrative({ role: 'trader', status: 'hold', result: { cycle: 1, valuationChange: 5 } }, state).result,
    null,
  );
});
