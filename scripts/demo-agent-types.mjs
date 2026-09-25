import { Arena } from '../packages/bio_agent/browser/arena.js';
import { ForagingBioAgent, UniswapPriceBioAgent } from '../packages/bio_agent/runtime/agents.js';
const owner = `0x${'11'.repeat(20)}`;
const foraging = new ForagingBioAgent(
  { id: 'fixture-foraging', owner },
  new Arena(2026, { agentCount: 1 }),
  '1',
);
foraging.observe({
  name: 'BioAgentStatusUpdated',
  agentId: '1',
  status: { activity: 2, energy: 9000, stimulus: 9500, revision: '1' },
  transactionHash: `0x${'aa'.repeat(32)}`,
});
foraging.step();
const market = {
  chainId: 1,
  tokenIn: `0x${'22'.repeat(20)}`,
  tokenOut: `0x${'33'.repeat(20)}`,
  amountIn: '1000000000000000000',
};
const price = new UniswapPriceBioAgent({ id: 'fixture-market', owner }, market);
const observations = [];
for (const [i, amountOut] of ['2000000000', '2020000000', '1800000000'].entries()) {
  const time = 1000 + i * 1000;
  const result = price.observe(
    {
      ...market,
      source: 'fixture',
      routing: 'CLASSIC',
      observationId: `fixture-${i}`,
      observedAt: time,
      amountOut,
    },
    time,
  );
  for (let j = 0; j < 10; j++) price.step(0.2, time);
  observations.push({
    deltaBps: result.deltaBps,
    status: result.status,
    reaction: result.reaction,
    decision: price.arena.flies[0].lastDecision,
  });
}
console.log(
  JSON.stringify(
    {
      mode: 'FIXTURE ONLY — no RPC/API calls, no real Tx or wallet',
      foraging: foraging.snapshot(),
      price: observations,
    },
    null,
    2,
  ),
);
