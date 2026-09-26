import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, random, transition, Arena } from '../../packages/bio_agent/browser/arena.js';
import { enableTxFood, addTxFood } from '../../packages/bio_agent/browser/tx-food.js';
import { ForagingEnvironment } from '../../services/full-apps/foraging.mjs';
const event = {
  chainId: 11155111,
  registry: '0x' + '11'.repeat(20),
  agentId: '1',
  transactionHash: '0x' + '12'.repeat(32),
  blockHash: '0x' + '34'.repeat(32),
  blockNumber: 100,
  logIndex: 0,
  revision: '2',
  stimulus: 5500,
};
test('confirmed input adds one food, duplicates and zero add none, consumption does not respawn', () => {
  const world = createWorld(random(1));
  enableTxFood(world);
  assert.equal(world.foods.length, 0);
  assert.equal(addTxFood(world, { ...event, stimulus: 0 }), false);
  assert.equal(addTxFood(world, { ...event, revision: '1' }), false);
  assert.equal(addTxFood(world, event), true);
  assert.equal(addTxFood(world, event), false);
  const food = world.foods[0],
    fly = { x: food.x, y: food.y, energy: 0.7 };
  assert.equal(transition(fly, world, 8, random(2)).collected, true);
  assert.equal(world.foods.length, 0);
  assert.equal(world.foodEvents[0].consumed, true);
  for (let i = 0; i < 100; i++) assert.equal(transition(fly, world, 8, random(i)).collected, false);
  const restored = createWorld(random(1));
  enableTxFood(restored);
  addTxFood(restored, event, new Set([food.id]));
  assert.equal(restored.foods.length, 0);
});
test('Anvil arena rejects click food, rests empty and adds only a confirmed update', () => {
  const a = new Arena(1, { agentCount: 1, txFood: true });
  assert.throws(() => a.addFood(1, 1), /confirmed/);
  a.tick();
  assert.equal(a.flies[0].decisionCounts.rest, 1);
  a.applyAgentStatus(
    '1',
    { activity: 2, energy: 7000, stimulus: 5500, revision: '2' },
    { ...event, registryAddress: event.registry },
  );
  assert.equal(a.world.foods.length, 1);
  a.applyAgentStatus(
    '1',
    { activity: 2, energy: 7000, stimulus: 5500, revision: '2' },
    { ...event, registryAddress: event.registry },
  );
  assert.equal(a.world.foods.length, 1);
});
test('full-neuron Anvil environment shares TX-only food and consumes without refill', () => {
  const a = new ForagingEnvironment(1, { txFood: true });
  assert.deepEqual(
    a.observe().map((o) => o.allowed),
    [[8], [8]],
  );
  a.apply([8, 8]);
  assert.equal(a.world.foods.length, 0);
  a.addStimulus(event);
  a.flies[0].x = a.world.foods[0].x;
  a.flies[0].y = a.world.foods[0].y;
  a.apply([8, 8]);
  assert.equal(a.world.foods.length, 0);
  assert.deepEqual(
    a.observe().map((o) => o.allowed),
    [[8], [8]],
  );
});
