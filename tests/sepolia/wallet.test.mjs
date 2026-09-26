import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('an existing deployment without its keystore cannot silently generate a replacement wallet', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bioagent-wallet-restore-'));
  try {
    await fs.mkdir(path.join(directory, 'contracts/deployments'), { recursive: true });
    await fs.writeFile(path.join(directory, 'contracts/deployments/sepolia.json'), '{}');
    const module = new URL('../../scripts/sepolia/common.mjs', import.meta.url).href;
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
      import { ensureWallet } from ${JSON.stringify(module)};
      try { await ensureWallet(); process.exitCode = 1; }
      catch(e) { console.log(e.message); }
    `,
      ],
      { cwd: directory, encoding: 'utf8' },
    );
    assert.match(output, /restore its existing test wallet/);
    await assert.rejects(fs.access(path.join(directory, '.local/sepolia/keystore.json')), { code: 'ENOENT' });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
