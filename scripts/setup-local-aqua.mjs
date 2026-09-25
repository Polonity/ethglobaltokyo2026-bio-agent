// Aqua — © Degensoft Ltd 2025. Local-only integration.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { ContractFactory, JsonRpcProvider, MaxUint256 } from 'ethers';
const dir = process.env.LOCAL_STATE_DIR || '.local';
const d = JSON.parse(await readFile(dir + '/deployment.json', 'utf8'));
if (!['localhost', '127.0.0.1'].includes(new URL(d.rpcUrl).hostname)) throw Error('Loopback only');
const p = new JsonRpcProvider(d.rpcUrl);
try {
  if (
    (await p.getNetwork()).chainId !== 31337n ||
    !(await p.send('web3_clientVersion', [])).startsWith('anvil/')
  )
    throw Error('Anvil only');
  if (spawnSync(process.env.FORGE || 'forge', ['build', '--root', 'contracts'], { stdio: 'inherit' }).status)
    throw Error('Build failed');
  if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit' }).status) throw Error('Build failed');
  const signer = await p.getSigner(d.owner),
    taker = await p.getSigner(1);
  const deploy = async (file, name, args = []) => {
    const a = JSON.parse(await readFile(`contracts/out/${file}.sol/${name}.json`));
    const c = await new ContractFactory(a.abi, a.bytecode.object, signer).deploy(...args);
    await c.waitForDeployment();
    return c;
  };
  const aqua = await deploy('Aqua', 'Aqua');
  const token0 = await deploy('AquaFlyApp', 'AquaTestToken', ['NECTAR']);
  const token1 = await deploy('AquaFlyApp', 'AquaTestToken', ['POLLEN']);
  const registry = await deploy('BioAgentRegistry', 'BioAgentRegistry');
  const bytes = await readFile('dist/models/aqua/descriptor.json');
  const modelHash = '0x' + createHash('sha256').update(bytes).digest('hex');
  for (let i = 1; i <= 3; i++)
    await (await registry.registerAgent(modelHash, d.guiUrl + '/models/aqua/descriptor.json')).wait();
  const app = await deploy('AquaFlyApp', 'AquaFlyApp', [
    await aqua.getAddress(),
    await token0.getAddress(),
    await token1.getAddress(),
    await registry.getAddress(),
  ]);
  for (const t of [token0, token1]) {
    await (await t.approve(await aqua.getAddress(), MaxUint256)).wait();
    await (await t.transfer(await taker.getAddress(), 900n * 10n ** 18n)).wait();
    await (await t.connect(taker).approve(await app.getAddress(), MaxUint256)).wait();
  }
  const receipt = await aqua.deploymentTransaction().wait();
  d.aqua = {
    aqua: await aqua.getAddress(),
    app: await app.getAddress(),
    registry: await registry.getAddress(),
    token0: await token0.getAddress(),
    token1: await token1.getAddress(),
    taker: await taker.getAddress(),
    modelHash,
    deploymentBlock: receipt.blockNumber,
    deploymentBlockHash: receipt.blockHash,
  };
  await writeFile(dir + '/deployment.json', JSON.stringify(d, null, 2) + '\n');
  const config = JSON.parse(await readFile(dir + '/wrangler.json'));
  config.vars.AQUA_CONFIG = JSON.stringify(d.aqua);
  config.kv_namespaces = [
    ...(config.kv_namespaces || []).filter((k) => k.binding !== 'AQUA_LEARNING'),
    { binding: 'AQUA_LEARNING', id: 'b10a6e17000000000000000000000001' },
  ];
  await writeFile(dir + '/wrangler.json', JSON.stringify(config, null, 2) + '\n');
  console.log(JSON.stringify(d.aqua, null, 2));
} finally {
  p.destroy();
}
