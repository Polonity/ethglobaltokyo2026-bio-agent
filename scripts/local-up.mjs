import path from 'node:path';
// Owns a fresh Anvil and local workerd instance. Ctrl-C stops only these child processes.
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, open, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import net from 'node:net';
const root = process.cwd();
const stateDir = path.resolve(root, process.env.LOCAL_STATE_DIR || '.local');
if (!stateDir.startsWith(root + path.sep)) throw new Error('State directory must be inside workspace');
const anvilPort = Number(process.env.ANVIL_PORT || 8545);
const guiPort = Number(process.env.LOCAL_GUI_PORT || 8798);
const inspectorPort = Number(process.env.LOCAL_INSPECTOR_PORT || 9248);
const rpcUrl = `http://127.0.0.1:${anvilPort}`;
const guiUrl = `http://127.0.0.1:${guiPort}`;
const children = [];
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (child.exitCode === null) child.kill('SIGTERM');
  setTimeout(() => {
    for (const child of children) if (child.exitCode === null) child.kill('SIGKILL');
    process.exit(code);
  }, 700).unref();
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
async function freePort(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', () =>
      reject(
        new Error(
          `Port ${port} is occupied. Change ANVIL_PORT / LOCAL_GUI_PORT / LOCAL_INSPECTOR_PORT; existing services were not modified.`,
        ),
      ),
    );
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
async function tool(name) {
  if (process.env[name.toUpperCase()]) return process.env[name.toUpperCase()];
  if (spawnSync(name, ['--version'], { stdio: 'ignore' }).status === 0) return name;
  const path = `${homedir()}/.foundry/bin/${name}`;
  await access(path);
  return path;
}
async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(2000),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.result;
}
try {
  for (const port of [anvilPort, guiPort, inspectorPort]) await freePort(port);
  await mkdir(stateDir, { recursive: true });
  const forge = await tool('forge'),
    anvil = await tool('anvil');
  if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit' }).status)
    throw new Error('Frontend build failed');
  const log = await open(path.join(stateDir, 'anvil.log'), 'w');
  const node = spawn(
    anvil,
    ['--host', '127.0.0.1', '--port', String(anvilPort), '--chain-id', '31337', '--silent'],
    { stdio: ['ignore', log.fd, log.fd] },
  );
  children.push(node);
  await log.close();
  for (let i = 0; ; i++) {
    try {
      if (BigInt(await rpc('eth_chainId')) === 31337n) break;
    } catch {}
    if (i === 100 || node.exitCode !== null) throw new Error('Anvil failed to start; see .local/anvil.log');
    await new Promise((r) => setTimeout(r, 100));
  }
  const client = await rpc('web3_clientVersion');
  if (!client.toLowerCase().startsWith('anvil/')) throw new Error('Refusing non-Anvil RPC');
  const owner = (await rpc('eth_accounts'))[0];
  const modelHash = `0x${createHash('sha256')
    .update(await readFile('packages/bio_agent/browser/manifest.json'))
    .digest('hex')}`;
  console.log('Anvil started. Deploying Registry and registering three agents on chain 31337 only...');
  const result = spawnSync(
    forge,
    [
      'script',
      'script/DeployLocalArena.s.sol:DeployLocalArena',
      '--rpc-url',
      rpcUrl,
      '--sender',
      owner,
      '--unlocked',
      '--broadcast',
    ],
    {
      cwd: `${root}/contracts`,
      encoding: 'utf8',
      env: {
        ...process.env,
        DEPLOYER_ADDRESS: owner,
        LOCAL_MODEL_HASH: modelHash,
        LOCAL_GUI_URL: guiUrl,
        LOCAL_WORLD_INPUT: await readFile('packages/bio_agent/browser/foraging-world.json', 'utf8'),
      },
    },
  );
  await writeFile(path.join(stateDir, 'forge.log'), result.stdout + result.stderr);
  if (result.status !== 0) throw new Error('Local deployment failed; see .local/forge.log');
  const receipt = JSON.parse(
    await readFile('contracts/broadcast/DeployLocalArena.s.sol/31337/run-latest.json', 'utf8'),
  );
  const creation = receipt.transactions.find(
    (t) => t.transactionType === 'CREATE' && t.contractName === 'BioAgentStimulusRegistry',
  );
  if (!creation) throw new Error('Registry deployment receipt missing');
  const creationReceipt = await rpc('eth_getTransactionReceipt', [creation.hash]);
  if (creationReceipt.status !== '0x1') throw new Error('Registry deployment reverted');
  const config = {
    chainId: '31337',
    worldInput: true,
    rpcUrl,
    guiUrl,
    registryAddress: creation.contractAddress,
    owner,
    deployBlock: BigInt(creationReceipt.blockNumber).toString(),
    deployBlockHash: creationReceipt.blockHash,
    modelHash,
    agentIds: ['1', '2', '3'],
    transactionHashes: receipt.transactions.map((t) => t.hash),
  };
  if (config.transactionHashes.length !== 5)
    throw new Error('Expected deploy, three registrations and environment input');
  for (const hash of config.transactionHashes)
    if ((await rpc('eth_getTransactionReceipt', [hash])).status !== '0x1')
      throw new Error('Registration failed');
  await writeFile(path.join(stateDir, 'deployment.json'), JSON.stringify(config, null, 2) + '\n');
  await writeFile(
    path.join(stateDir, 'wrangler.json'),
    JSON.stringify(
      {
        name: 'bio-agent-anvil-local',
        main: path.join(root, 'services/worker/local.js'),
        compatibility_date: '2026-09-25',
        workers_dev: false,
        assets: { directory: path.join(root, 'dist'), binding: 'ASSETS', run_worker_first: true },
        vars: {
          LOCAL_ANVIL: 'true',
          WORLD_INPUT: 'true',
          ANVIL_RPC_URL: rpcUrl,
          REGISTRY_ADDRESS: config.registryAddress,
          LOCAL_OWNER: owner,
          DEPLOYMENT_BLOCK: config.deployBlock,
          DEPLOYMENT_BLOCK_HASH: config.deployBlockHash,
          LOCAL_MODEL_HASH: modelHash,
        },
      },
      null,
      2,
    ),
  );
  const worker = spawn(
    'node_modules/.bin/wrangler',
    [
      'dev',
      '--config',
      path.join(stateDir, 'wrangler.json'),
      '--local',
      '--ip',
      '127.0.0.1',
      '--port',
      String(guiPort),
      '--inspector-port',
      String(inspectorPort),
    ],
    { stdio: 'inherit', env: { ...process.env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false' } },
  );
  children.push(worker);
  node.on('exit', () => {
    if (!stopping) {
      console.error('Anvil stopped');
      stop(1);
    }
  });
  worker.on('exit', (code) => stop(code || 0));
  console.log(
    `\nGUI: ${guiUrl}\nRegistry: ${config.registryAddress}\nAgents: 1=MOMO, 2=SORA, 3=KIKI\nLocal setup: ${stateDir}/deployment.json\nCtrl-C stops this local environment.\n`,
  );
} catch (error) {
  console.error(error.message);
  await stop(1);
  process.exitCode = 1;
}
