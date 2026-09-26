import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir = process.env.FORAGING_VALIDATION_OUT || 'artifacts/foraging-validation-v1';
const summary = JSON.parse(await readFile(dir + '/summary.json'));
const tests = JSON.parse(await readFile(dir + '/test.json'));
const selection = JSON.parse(await readFile(dir + '/selection.json'));
const compact = {
  ...summary,
  protocol: selection.protocol,
  selection: selection.selection.map((x) => ({
    seed: x.seed,
    before: x.before.behavior,
    after: x.after.behavior,
  })),
  cases: tests.test.map((t) => ({
    seed: t.seed,
    environment: t.neural.environmentInput,
    stimuli: t.neural.inputEvents,
    results: Object.fromEntries(
      ['neural', 'random', 'direct'].map((k) => [k, { behavior: t[k].behavior, rewards: t[k].rewards }]),
    ),
  })),
  artifacts: {},
};
for (const file of [
  'protocol.json',
  'selection.json',
  'test.json',
  'direct-control.json',
  'frozen-test.json',
])
  compact.artifacts[file] = {
    path: dir + '/' + file,
    sha256: createHash('sha256')
      .update(await readFile(dir + '/' + file))
      .digest('hex'),
  };
await writeFile(
  'docs/submission/presenter-kit/foraging-validation.json',
  JSON.stringify(compact, null, 2) + '\n',
);
