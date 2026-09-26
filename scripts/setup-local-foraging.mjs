import defaultWorld from '../packages/bio_agent/browser/foraging-world.json' with { type: 'json' };
import { WORLD_SCHEMA } from '../packages/bio_agent/browser/tx-world.js';
// Replace only the local foraging registry when its registered model changes.
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { ContractFactory, JsonRpcProvider, toUtf8Bytes } from 'ethers';
const dir = process.env.LOCAL_STATE_DIR || '.local',
  d = JSON.parse(await readFile(dir + '/deployment.json'));
if (!['127.0.0.1', 'localhost'].includes(new URL(d.rpcUrl).hostname)) throw Error('Loopback only');
const p = new JsonRpcProvider(d.rpcUrl);
try {
  if (
    (await p.getNetwork()).chainId !== 31337n ||
    !(await p.send('web3_clientVersion', [])).startsWith('anvil/')
  )
    throw Error('Anvil only');
  if (spawnSync('npm', ['run', 'build'], { stdio: 'inherit' }).status) throw Error('Build failed');
  const a = JSON.parse(
    await readFile('contracts/out/BioAgentStimulusRegistry.sol/BioAgentStimulusRegistry.json'),
  );
  const reg = await new ContractFactory(a.abi, a.bytecode.object, await p.getSigner(d.owner)).deploy();
  await reg.waitForDeployment();
  const receipt = await reg.deploymentTransaction().wait(),
    modelHash =
      '0x' +
      createHash('sha256')
        .update(await readFile('packages/bio_agent/browser/manifest.json'))
        .digest('hex');
  for (let i = 1; i <= 3; i++) {
    await (await reg.registerAgent(modelHash, d.guiUrl + `/models/agents/${i}.json`)).wait();
  }
  await (await reg.submitStimulus(1, 0, WORLD_SCHEMA, toUtf8Bytes(JSON.stringify(defaultWorld)))).wait();
  for (let i = 1; i <= 3; i++) await (await reg.updateStatus(i, 1, 2, 7000, 5500)).wait();
  Object.assign(d, {
    worldInput: true,
    registryAddress: await reg.getAddress(),
    modelHash,
    deployBlock: String(receipt.blockNumber),
    deployBlockHash: receipt.blockHash,
  });
  await writeFile(dir + '/deployment.json', JSON.stringify(d, null, 2) + '\n');
  const c = JSON.parse(await readFile(dir + '/wrangler.json'));
  Object.assign(c.vars, {
    WORLD_INPUT: 'true',
    REGISTRY_ADDRESS: d.registryAddress,
    LOCAL_MODEL_HASH: modelHash,
    DEPLOYMENT_BLOCK: d.deployBlock,
    DEPLOYMENT_BLOCK_HASH: d.deployBlockHash,
  });
  await writeFile(dir + '/wrangler.json', JSON.stringify(c, null, 2) + '\n');
  console.log('Foraging registry migrated:', d.registryAddress);
} finally {
  p.destroy();
}
