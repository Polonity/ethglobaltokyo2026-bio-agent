import fs from 'node:fs/promises';
import { JsonRpcProvider } from 'ethers';
import { LearningBioAgent, ChainDecisionRunner } from '../src/index.js';
import { EvmBioAgentSource } from '../src/evm-source.js';
import { AquaBackend, ForagingBackend } from '../src/adapters.js';

// Usage: node .../read-chain.mjs RPC_URL CHAIN_ID REGISTRY AGENT_ID [aqua|foraging] [CONFIRMATIONS] [POLICY_JSON]
const [rpc, chain, registry, agentId, task = 'aqua', depth = '2', policyPath] = process.argv.slice(2);
if (!rpc || !chain || !registry || !agentId || !['aqua', 'foraging'].includes(task))
  throw Error('Required: RPC_URL CHAIN_ID REGISTRY AGENT_ID [aqua|foraging] [CONFIRMATIONS] [POLICY_JSON]');
const provider = new JsonRpcProvider(rpc),
  config = { chainId: Number(chain), registry, agentId, confirmations: Number(depth) };
try {
  const source = new EvmBioAgentSource(provider, config),
    observation = await source.read();
  const agent = new LearningBioAgent(
    { id: `${chain}:${registry.toLowerCase()}:${agentId}`, owner: observation.owner },
    task === 'aqua' ? new AquaBackend() : new ForagingBackend(),
  );
  if (policyPath) await agent.restorePolicy(JSON.parse(await fs.readFile(policyPath, 'utf8')));
  const runner = new ChainDecisionRunner(agent, {
    ...config,
    minConfirmations: config.confirmations,
    source,
  });
  runner.observe(observation);
  console.log(JSON.stringify(await runner.decide(), null, 2));
} finally {
  provider.destroy();
}
