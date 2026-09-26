import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import net from 'node:net';
import { JsonRpcProvider, keccak256 } from 'ethers';
import { OFFICIAL_AQUA } from '../../services/full-apps/fork.mjs';
const stateDir = '.local/aqua-fork',
  artifactDir = 'artifacts/aqua-fork';
const rpc = 'http://127.0.0.1:18551';
const env = {
  ...process.env,
  FULL_RPC_URL: rpc,
  FULL_APPS_PORT: '8813',
  FULL_APPS_STATE_DIR: stateDir,
  FULL_APPS_ARTIFACT_DIR: artifactDir,
  AQUA_FORK_MANIFEST: `${stateDir}/upstream.json`,
};
const children = new Set();
function stop() {
  for (const child of children) child.kill('SIGTERM');
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
function run(command, args, options = {}) {
  const child = spawn(command, args, { env, stdio: 'inherit', ...options });
  children.add(child);
  child.once('exit', () => children.delete(child));
  child.done = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => (code === 0 ? resolve() : reject(Error(`${command} exited ${code}`))));
  });
  child.done.catch(() => {});
  return child;
}
async function freePort(port) {
  await new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', () => reject(Error(`Port ${port} is in use; existing service preserved`)));
    s.listen(port, '127.0.0.1', () => s.close(resolve));
  });
}
try {
  await freePort(18551);
  await freePort(8813);
  await mkdir(stateDir, { recursive: true });
  await mkdir(artifactDir, { recursive: true });
  const upstream = new JsonRpcProvider(process.env.AQUA_UPSTREAM_RPC || 'https://eth.drpc.org');
  if ((await upstream.getNetwork()).chainId !== 1n) throw Error('Ethereum mainnet upstream required');
  const pinned = process.env.AQUA_FORK_BLOCK ? Number(process.env.AQUA_FORK_BLOCK) : 'finalized';
  const block = await upstream.getBlock(pinned);
  if (!block) throw Error('Fork block unavailable');
  const code = await upstream.getCode(OFFICIAL_AQUA, block.number);
  if (code === '0x') throw Error('Official Aqua is absent at the selected block');
  const manifest = {
    schema: 'bioagent.official-aqua-fork.v1',
    chainId: 1,
    blockNumber: block.number,
    blockHash: block.hash,
    aqua: OFFICIAL_AQUA,
    codeHash: keccak256(code),
    deploymentSource: 'https://github.com/1inch/aqua#deployments',
    checkedAt: new Date().toISOString(),
  };
  await writeFile(env.AQUA_FORK_MANIFEST, JSON.stringify(manifest, null, 2));
  await writeFile(`${artifactDir}/upstream.json`, JSON.stringify(manifest, null, 2));
  upstream.destroy();
  const log = createWriteStream(`${stateDir}/anvil.log`);
  const anvil = run(
    process.env.ANVIL_BIN || `${process.env.HOME}/.foundry/bin/anvil`,
    [
      '--host',
      '127.0.0.1',
      '--port',
      '18551',
      '--chain-id',
      '31337',
      '--fork-url',
      process.env.AQUA_UPSTREAM_RPC || 'https://eth.drpc.org',
      '--fork-block-number',
      String(block.number),
      '--silent',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  anvil.stdout.pipe(log);
  anvil.stderr.pipe(log);
  const local = new JsonRpcProvider(rpc);
  for (let i = 0; i < 100; i++) {
    try {
      await local.send('web3_clientVersion', []);
      break;
    } catch {
      if (i === 99) throw Error('Anvil startup timeout');
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  local.destroy();
  // SQLite backup takes a consistent snapshot without changing the original learning store.
  try {
    await access(`${stateDir}/experience.sqlite3`);
  } catch {
    try {
      await access('.local/full-apps/experience.sqlite3');
      await run('.local/connectome-tools/bin/python', [
        '-c',
        'import sqlite3; s=sqlite3.connect("file:.local/full-apps/experience.sqlite3?mode=ro",uri=True); d=sqlite3.connect(".local/aqua-fork/experience.sqlite3"); s.backup(d); d.close(); s.close()',
      ]).done;
      await writeFile(
        `${artifactDir}/policy-origin.json`,
        JSON.stringify(
          {
            source: '.local/full-apps/experience.sqlite3',
            copiedAt: new Date().toISOString(),
            note: 'Saved policies copied with SQLite backup; no new training claimed.',
          },
          null,
          2,
        ),
      );
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }
  await run('.local/connectome-tools/bin/python', ['-m', 'scripts.submission.seed_aqua_policies'], {
    env: { ...env, PYTHONPATH: '.' },
  }).done;
  await run(process.env.FORGE_BIN || `${process.env.HOME}/.foundry/bin/forge`, [
    'build',
    '--root',
    'contracts',
  ]).done;
  console.log(`Official Aqua fork: Ethereum block ${block.number}. Preparing confirmed test-market inputs.`);
  await run(process.execPath, ['scripts/full/collect-market.mjs']).done;
  console.log('Submission GUI: http://127.0.0.1:8813/aqua (Ethereum local fork; test tokens only)');
  await run(process.execPath, ['services/full-apps/server.mjs']).done;
} finally {
  stop();
}
