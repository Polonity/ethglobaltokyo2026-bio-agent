import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await mkdir('dist/models/aqua', { recursive: true });
const refs = {};
for (const [key, file] of Object.entries({
  controller: 'packages/bio_agent/connectome/aqua-controller.js',
  graph: 'packages/bio_agent/connectome/male-cns-slice.json',
  dynamics: 'packages/bio_agent/connectome/circuit.js',
})) {
  const b = await readFile(file),
    name = file.split('/').at(-1);
  await writeFile('dist/models/aqua/' + name, b);
  refs[key] = { uri: '/models/aqua/' + name, sha256: '0x' + createHash('sha256').update(b).digest('hex') };
}
await writeFile(
  'dist/models/aqua/descriptor.json',
  JSON.stringify(
    {
      schema: 'bioagent.aqua-controller.v1',
      model: 'aqua-connectome-risk-v1',
      refs,
      assumptions: [
        'Seven measured neurons, nineteen connections; not a whole brain or identified mushroom-body/CX circuit.',
        'Artificial positive rate dynamics, sensitivity gains and risk thresholds. Frozen, no learning.',
        'Manually submitted synthetic risk stimuli, not live volatility or mempool detection.',
        'Local 1:1 test-token market only; no profitability or MEV-protection claim.',
      ],
    },
    null,
    2,
  ) + '\n',
);
