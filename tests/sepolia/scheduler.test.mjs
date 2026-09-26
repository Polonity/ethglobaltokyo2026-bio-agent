import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBudget, LIMITS, StimulusScheduler } from '../../services/sepolia/scheduler.js';
import { parseEther } from 'ethers';
test('hourly worst-case cost fits the daily cap and checks fee, balance, rolling budget', () => {
  const cost = LIMITS.gasLimit * LIMITS.maxFeePerGas;
  assert.equal(24n * cost, parseEther('0.00432'));
  assert.ok(24n * cost < LIMITS.dailyBudget);
  const args = { gas: LIMITS.gasLimit, fee: LIMITS.maxFeePerGas, balance: parseEther('0.01'), reserved: 0n };
  assert.equal(checkBudget(args), cost);
  for (const bad of [
    { fee: LIMITS.maxFeePerGas + 1n },
    { gas: 60001n },
    { balance: LIMITS.reserve },
    { reserved: LIMITS.dailyBudget },
  ])
    assert.throws(() => checkBudget({ ...args, ...bad }));
});
test('disabled scheduler never signs and public status cannot trigger a transaction', async () => {
  const map = new Map();
  const storage = { get: async (k) => map.get(k), put: async (k, v) => map.set(k, v) };
  const s = new StimulusScheduler({ storage }, { STIMULUS_ENABLED: 'false' });
  assert.equal((await s.run()).state, 'disabled');
  assert.equal((await s.fetch(new Request('https://internal/tick'))).status, 404);
  const status = await (await s.fetch(new Request('https://internal/status'))).json();
  assert.equal(status.enabled, false);
  assert.equal(status.intervalMinutes, 60);
});
