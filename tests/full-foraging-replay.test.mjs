import test from 'node:test';
import assert from 'node:assert/strict';
import { rollout } from '../services/full-apps/experiment.mjs';
import { WORLD_SCHEMA } from '../packages/bio_agent/browser/tx-world.js';
import configuration from '../packages/bio_agent/browser/foraging-world.json' with { type: 'json' };
const hash = '0x' + '78'.repeat(32);
const environment = {
  name: 'BioAgentStimulusAccepted',
  schema: WORLD_SCHEMA,
  agentId: '1',
  nonce: '1',
  configuration,
  transactionHash: '0x' + '56'.repeat(32),
  blockHash: hash,
  blockNumber: '99',
  logIndex: '0',
  receiptVerified: true,
};
const statuses = [1, 2].map((agentId) => ({
  chainId: 31337,
  registry: '0x' + '11'.repeat(20),
  agentId,
  transactionHash: '0x' + String(agentId).repeat(64),
  blockHash: hash,
  blockNumber: 100 + agentId,
  logIndex: 0,
  revision: '2',
  stimulus: 5500,
  energy: 7000,
  activity: 2,
}));
function fixture(canonical = true) {
  let writes = 0;
  const observations = [];
  const chain = {
    provider: {
      getTransactionReceipt: async () => ({ status: 1, blockHash: hash }),
      getBlock: async (number) => {
        assert.equal(typeof number, 'number');
        return { hash: canonical ? hash : '0x' + '00'.repeat(32) };
      },
    },
    configureForaging: async () => {
      writes++;
      return environment;
    },
    stimulus: async (a, v, i) => {
      writes++;
      return statuses[i];
    },
  };
  const client = {
    call: async (op, data) => {
      if (op === 'act') {
        observations.push(structuredClone(data.observations));
        return {
          neural: { inferenceMs: 1, neuronsPerIndividual: 166700 },
          decisions: [
            { id: 'a', action: 8 },
            { id: 'b', action: 8 },
          ],
        };
      }
      return {};
    },
  };
  return { chain, client, observations, writes: () => writes };
}
test('full-policy comparison replays identical TX food and initial observations without new inputs', async () => {
  const f = fixture();
  const args = {
    client: f.client,
    chain: f.chain,
    tape: [],
    app: 'foraging',
    variant: 'full',
    phase: 'selection',
    seed: configuration.seed,
    steps: 1,
  };
  const before = await rollout(args);
  assert.equal(f.writes(), 3);
  const after = await rollout({
    ...args,
    replayForaging: { environment: before.environmentInput, statuses: before.inputEvents },
  });
  assert.equal(f.writes(), 3);
  assert.deepEqual(f.observations[0], f.observations[1]);
  assert.deepEqual(before.snapshot.world.foodEvents, after.snapshot.world.foodEvents);
  assert.deepEqual(before.environmentInput, after.environmentInput);
});
test('reorged replay inputs stop before any neural decision', async () => {
  const f = fixture(false);
  await assert.rejects(
    rollout({
      client: f.client,
      chain: f.chain,
      tape: [],
      app: 'foraging',
      variant: 'full',
      phase: 'selection',
      seed: 1,
      steps: 1,
      replayForaging: { environment, statuses },
    }),
    /no longer canonical/,
  );
  assert.equal(f.observations.length, 0);
  assert.equal(f.writes(), 0);
});
