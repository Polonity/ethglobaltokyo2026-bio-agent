import test from 'node:test';
import assert from 'node:assert/strict';
import { Arena } from '../packages/bio_agent/browser/arena.js';
import {
  IBioAgentRuntime,
  ForagingBioAgent,
  UniswapPriceBioAgent,
} from '../packages/bio_agent/runtime/agents.js';
import { fetchUniswapObservation } from '../services/backend/adapters/uniswap-quote.mjs';
const owner = `0x${'11'.repeat(20)}`;
const market = {
  chainId: 1,
  tokenIn: `0x${'22'.repeat(20)}`,
  tokenOut: `0x${'33'.repeat(20)}`,
  amountIn: '1000000000000000000',
};
const identity = { id: 'market-1', owner, smartWallet: { chainId: 1, address: owner } };
const q = (id, time, amountOut) => ({
  ...market,
  source: 'fixture',
  routing: 'CLASSIC',
  observationId: id,
  observedAt: time,
  amountOut,
});
test('existing arena adapter applies chain inputs and preserves idempotency', () => {
  const arena = new Arena(2026, { agentCount: 3 });
  const agent = new ForagingBioAgent({ id: 'fly-1', owner }, arena, '1');
  assert.ok(agent instanceof IBioAgentRuntime);
  const event = {
    name: 'BioAgentStatusUpdated',
    agentId: '1',
    status: { activity: 2, energy: 9000, stimulus: 9500, revision: '1' },
    transactionHash: `0x${'44'.repeat(32)}`,
  };
  assert.equal(agent.observe(event), true);
  assert.equal(agent.observe(event), false);
  assert.equal(arena.flies[0].input.mode, 'forage');
  assert.equal(arena.flies[1].chain, null);
});
test('fixed quote movement produces traceable bounded inputs, never transactions', () => {
  const agent = new UniswapPriceBioAgent(identity, market);
  assert.ok(agent instanceof IBioAgentRuntime);
  assert.equal(agent.observe(q('a', 1000, '2000000000'), 1000).reaction, 'baseline');
  const up = agent.observe(q('b', 2000, '2020000000'), 2000);
  assert.equal(up.deltaBps, '100');
  assert.deepEqual(up.status, { activity: 2, energy: 5000, stimulus: 100 });
  assert.equal(up.source, 'fixture');
  assert.equal(agent.arena.world.mode, 'forage');
  agent.step(0.2, 2000);
  assert.equal(agent.step(0.2, 40000).inputState, 'stale');
  assert.equal(agent.arena.time, 0.2);
  assert.equal(agent.arena.flies[0].memory.length, 1);
  assert.equal(agent.arena.flies[0].chain, null);
  assert.equal(up.execution, 'observe-only');
  assert.equal(agent.observe(q('b', 2000, '2020000000'), 2000), null);
  const down = agent.observe(q('c', 3000, '1800000000'), 3000);
  assert.equal(down.reaction, 'cautious');
  assert.equal(agent.observe(q('d', 4000, '999999999999999999999'), 4000).status.stimulus, 10000);
  assert.equal(agent.observe(q('e', 40000, '2000000000'), 40000).reaction, 'baseline');
  const snapshot = agent.snapshot();
  snapshot.identity.smartWallet.address = 'changed';
  assert.equal(agent.identity.smartWallet.address, owner);
});
test('reject stale, wrong pair, changed size, nonpositive and out of order without altering baseline', () => {
  const agent = new UniswapPriceBioAgent(identity, market);
  agent.observe(q('a', 1000, '2000000000'), 1000);
  for (const item of [
    q('old', 1, '2'),
    { ...q('pair', 2000, '2'), tokenOut: owner },
    { ...q('size', 2000, '2'), amountIn: '2' },
    q('zero', 2000, '0'),
    q('order', 999, '2'),
  ])
    assert.throws(() => agent.observe(item, item.observationId === 'old' ? 40000 : 2000));
  assert.equal(agent.lastInput.quote.observationId, 'a');
});
test('quote adapter sends only /quote, normalizes provenance and rejects unsupported routes', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return new Response(
      JSON.stringify({
        requestId: 'quote-1',
        routing: 'CLASSIC',
        quote: {
          input: { token: market.tokenIn, amount: market.amountIn },
          output: { token: market.tokenOut, amount: '2000000000' },
        },
      }),
    );
  };
  const observation = await fetchUniswapObservation({
    apiKey: 'test-only-key',
    market,
    swapper: owner,
    fetchImpl,
    now: () => 1000,
  });
  assert.equal(request.url, 'https://trade-api.gateway.uniswap.org/v1/quote');
  assert.equal(JSON.parse(request.options.body).type, 'EXACT_INPUT');
  assert.equal(observation.source, 'uniswap-api');
  assert.match(observation.rawResponseHash, /^0x[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(observation).includes('test-only-key'), false);
  await assert.rejects(
    fetchUniswapObservation({
      apiKey: 'x',
      market,
      swapper: owner,
      fetchImpl: async () => new Response(JSON.stringify({ requestId: 'x', routing: 'DUTCH_V2' })),
    }),
    /Unsupported/,
  );
  await assert.rejects(
    fetchUniswapObservation({
      apiKey: 'x',
      market,
      swapper: owner,
      fetchImpl: async () => new Response('', { status: 429 }),
    }),
    /HTTP 429/,
  );
});
