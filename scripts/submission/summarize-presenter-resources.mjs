import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { recordedResources } from './presenter-comparison.mjs';
const dir = process.env.PRESENTER_DELIVERY || 'docs/submission/presenter-kit';
const capture = JSON.parse(await readFile(`${dir}/capture-evidence.json`, 'utf8'));
const settlementBytes = await readFile(`${dir}/settlement-evidence.json`);
const settlement = JSON.parse(settlementBytes);
const policyBytes = await readFile(`${capture.paths?.marketState || '.local/shared-market'}/readout.json`);
const policy = JSON.parse(policyBytes);
assert.equal(policy.identity, capture.brain.adapterHash, 'Inspect a checkpoint from the same adapter');
assert.deepEqual(
  policy.updates,
  capture.policyChanges.map((x) => x.updatesAfter),
  'Use the captured checkpoint, not later training',
);
const shapes = Object.values(policy.weights).map((w) => ({
  actions: w.length,
  featuresIncludingBias: w[0].length,
  coefficients: w.flat().length,
}));
assert.equal(shapes.length, 4);
assert(shapes.every((x) => JSON.stringify(x) === JSON.stringify(shapes[0])));
const hash = (b) => createHash('sha256').update(b).digest('hex');
const evidence = {
  schema: 'bioagent.presenter.resources.v1',
  summarizedAt: new Date().toISOString(),
  recordedAt: capture.recordedAt,
  source: 'settlement-evidence.json',
  sourceSha256: hash(settlementBytes),
  ...recordedResources(settlement),
  neuralScope:
    'Four agents, four recurrent steps each; neural computation and feature extraction. Excludes action readout, process messaging, RPC, transactions and cadence wait.',
  cycleScope:
    'Recorded local application cycles, including RPC, transactions and outcome updates; excludes the following cadence wait. Not public-chain finality.',
  rssScope:
    'Python process lifetime peak RSS, shared graph plus independent states; excludes Node, browser, Anvil, OS and preprocessing.',
  powerWatts: null,
  energyJoulesPerDecision: null,
  matchedAiComparison: null,
  readout: {
    ...shapes[0],
    individuals: 4,
    checkpointSha256: hash(policyBytes),
    checkpointUpdates: policy.updates,
    adapterIdentity: policy.identity,
  },
  arithmetic: {
    oneFloat64StateVectorMiB: (capture.brain.full.neurons * 8) / 1024 ** 2,
    weightsOnly8B: { fp16DecimalGB: (8e9 * 2) / 1e9, int4IdealDecimalGB: (8e9 * 0.5) / 1e9 },
    note: 'Arithmetic only; excludes graph, workspace, activations, KV cache, quantization metadata and other overhead. Not a measured hardware minimum or an equal-capability comparison.',
  },
};
await writeFile(`${dir}/resource-evidence.json`, JSON.stringify(evidence, null, 2) + '\n');
console.log(
  JSON.stringify({
    neuralMs: evidence.neuralMs,
    cycleMs: evidence.cycleMs,
    readout: evidence.readout.coefficients,
    power: evidence.powerWatts,
  }),
);
