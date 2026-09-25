import test from 'node:test';
import assert from 'node:assert/strict';
import {
  uint,
  int,
  unit,
  inputLevel,
  milliseconds,
  address,
  bytes32,
} from '../packages/shared/types/primitives.ts';
import { legacyConditions, legacyBody, legacyAction } from '../packages/shared/types/legacy.ts';

test('decimal strings preserve token precision and reject ambiguous representations', () => {
  const amount = '1234567890123456789012345678901234567890';
  assert.equal(JSON.parse(JSON.stringify({ amount: uint(amount) })).amount, amount);
  for (const bad of ['-1', '01', '+1', '1.5', '1e18', ' 1']) assert.throws(() => uint(bad));
  assert.equal(int('-42'), '-42');
  for (const bad of ['-0', '+2', '02']) assert.throws(() => int(bad));
});
test('bounded physical inputs, clocks and identifiers reject malformed values', () => {
  for (const bad of [NaN, Infinity, -0.1, 1.01]) assert.throws(() => unit(bad));
  for (const bad of [-1, 0.5, 10001]) assert.throws(() => inputLevel(bad));
  for (const bad of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => milliseconds(bad));
  assert.equal(unit(1), 1);
  assert.equal(inputLevel(10000), 10000);
  assert.equal(address(`0x${'AA'.repeat(20)}`), `0x${'aa'.repeat(20)}`);
  assert.throws(() => address('0x1'));
  assert.throws(() => bytes32(`0x${'11'.repeat(31)}`));
});
test('legacy status maps to external conditions without fabricating fullness', () => {
  assert.deepEqual(legacyConditions({ activity: 2, energy: 9000, stimulus: 100, revision: '12' }), {
    conditions: { mode: 'forage', energySupply: 9000, stimulusIntensity: 100 },
    statusRevision: '12',
  });
  assert.deepEqual(legacyBody(0.7), { kind: 'legacy-energy-only', activityEnergy: 0.7 });
  assert.deepEqual(legacyAction(8), { kind: 'rest' });
  assert.deepEqual(legacyAction(7), { kind: 'move', direction: 7 });
  for (const action of [-1, 9, 0.1]) assert.throws(() => legacyAction(action));
  for (const activity of [-1, 3, 0.5])
    assert.throws(() => legacyConditions({ activity, energy: 0, stimulus: 0, revision: '1' }));
  for (const revision of ['0', '18446744073709551616'])
    assert.throws(() => legacyConditions({ activity: 0, energy: 0, stimulus: 0, revision }));
});
