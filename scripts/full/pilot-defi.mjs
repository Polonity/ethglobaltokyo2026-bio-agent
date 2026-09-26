import { BrainClient } from './brain-client.mjs';
import { FullChain } from '../../services/full-apps/chain.mjs';
import { trainApplication } from '../../services/full-apps/experiment.mjs';
import { readFile, writeFile } from 'node:fs/promises';
const client = new BrainClient(),
  chain = new FullChain();
const report = { schema: 'bioagent.full-defi-learning-pilot.v1', runs: [] };
try {
  report.brain = await client.call('describe');
  await chain.setup(report.brain);
  const tape = JSON.parse(await readFile('artifacts/full-apps/market-tape.json', 'utf8'));
  await chain.validateTape(tape);
  for (const app of process.env.FULL_APP ? [process.env.FULL_APP] : ['market', 'aqua'])
    for (const variant of ['full', 'legacy']) {
      const result = await trainApplication({
        client,
        chain,
        tape: tape.events,
        app,
        variant,
        onProgress: async (p) => {
          if (p.phase === 'training' || p.tick % 40 === 0)
            console.log(JSON.stringify({ app, variant, phase: p.phase, tick: p.tick, rewards: p.rewards }));
        },
      });
      report.runs.push(result);
      await writeFile(
        `artifacts/full-apps/${process.env.FULL_APP || 'defi'}-pilot.json`,
        JSON.stringify(report, null, 2) + '\n',
      );
      console.log(
        JSON.stringify({
          app,
          variant,
          adopted: result.adoption.map((r) => r.adopted),
          before: result.before.rewards,
          after: result.after.rewards,
          test: result.test.rewards,
          nextVersions: result.test.lastDecision.map((d) => d.policyVersion),
        }),
      );
    }
} finally {
  chain.close();
  client.close();
}
