import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { LearningBioAgent } from '../../../packages/bioagent-framework/src/index.js';
import { ForagingBackend } from '../../../packages/bioagent-framework/src/adapters.js';
import { evaluatePolicy, initialPolicy } from '../../../packages/bio_agent/research/adaptive-forager.js';
const out = 'artifacts/bioagent-adaptation-20260926';
const bytes = await fs.readFile('docs/research/bioagent-adaptation/protocol.json');
const protocol = JSON.parse(bytes);
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
const seeds = Array.from(
  { length: protocol.testSeedRule.count },
  (_, i) => protocol.testSeedRule.start + i * protocol.testSeedRule.stride,
);
const profiles = [...protocol.profiles, protocol.stressProfile];
const records = [];
const controls = {
  baseline: evaluatePolicy(initialPolicy(), seeds, profiles, protocol.episodeTicks),
  unguarded: evaluatePolicy(initialPolicy(), seeds, profiles, protocol.episodeTicks, { guard: false }),
  rule: evaluatePolicy(initialPolicy(), seeds, profiles, protocol.episodeTicks, { rule: true }),
};
for (const seed of protocol.trainingRuns)
  for (const encoder of protocol.encoders) {
    const agent = new LearningBioAgent(
      { id: 'research-forager', owner: '0x' + '11'.repeat(20) },
      new ForagingBackend({ encoder }),
    );
    const before = agent.policy;
    const started = performance.now();
    const candidate = agent.train({
      seed,
      seeds: protocol.trainWorldSeeds,
      profiles: protocol.profiles,
      ticks: protocol.episodeTicks,
      trials: protocol.searchTrials,
    });
    const selection = agent.evaluate({
      seeds: protocol.selectionSeeds,
      profiles: protocol.profiles,
      ticks: protocol.episodeTicks,
    });
    const adoption = agent.adopt();
    const artifact = await agent.exportPolicy();
    const record = {
      seed,
      encoder,
      fitMilliseconds: performance.now() - started,
      candidate,
      selection,
      adoption,
      artifact,
      before: evaluatePolicy(before, seeds, profiles, protocol.episodeTicks),
      after: evaluatePolicy(agent.policy, seeds, profiles, protocol.episodeTicks),
      unguardedCandidate: evaluatePolicy(candidate.policy, seeds, profiles, protocol.episodeTicks, {
        guard: false,
      }),
    };
    records.push(record);
    await fs.writeFile(
      `${out}/experiment.partial.json`,
      JSON.stringify({ protocol, sha256, controls, records }, null, 2),
    );
    console.log(
      JSON.stringify({
        seed,
        encoder,
        adopted: adoption.accepted,
        weights: agent.policy.weights,
        metrics: record.after.map((p) => ({ profile: p.profile, ...p.metrics })),
      }),
    );
  }
await fs.writeFile(
  `${out}/experiment.json`,
  JSON.stringify({ protocol, sha256, controls, records }, null, 2),
);
