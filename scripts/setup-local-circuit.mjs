import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { ContractFactory, JsonRpcProvider } from 'ethers';
const dir = process.env.LOCAL_STATE_DIR || '.local';
const deployment = JSON.parse(await readFile(dir + '/deployment.json', 'utf8'));
if (
  !['localhost', '127.0.0.1'].includes(new URL(deployment.rpcUrl).hostname) ||
  !['localhost', '127.0.0.1'].includes(new URL(deployment.guiUrl).hostname)
)
  throw new Error('Loopback only');
const provider = new JsonRpcProvider(deployment.rpcUrl);
try {
  if (
    (await provider.getNetwork()).chainId !== 31337n ||
    !(await provider.send('web3_clientVersion', [])).toLowerCase().startsWith('anvil/')
  )
    throw new Error('Anvil required');
  const build = spawnSync(process.env.FORGE || 'forge', ['build', '--root', 'contracts'], {
    stdio: 'inherit',
  });
  if (build.status !== 0) throw new Error('Contract build failed');
  await import('./build-circuit.mjs');
  const bytes = await readFile('dist/models/circuit/descriptor.json');
  const modelHash = '0x' + createHash('sha256').update(bytes).digest('hex');
  const artifact = JSON.parse(
    await readFile('contracts/out/BioAgentRegistry.sol/BioAgentRegistry.json', 'utf8'),
  );
  const signer = await provider.getSigner(deployment.owner);
  const registry = await new ContractFactory(artifact.abi, artifact.bytecode.object, signer).deploy();
  await registry.waitForDeployment();
  const receipt = await registry.deploymentTransaction().wait();
  const registrations = [];
  for (let id = 1; id <= 3; id++) {
    registrations.push(
      (
        await (
          await registry.registerAgent(modelHash, deployment.guiUrl + '/models/circuit/descriptor.json')
        ).wait()
      ).hash,
    );
    // Three simulation instances of one seven-neuron slice, not three biological specimens.
    await (await registry.updateStatus(id, 1, 0, 5000, (id - 1) * 5000)).wait();
  }
  deployment.circuit = {
    registry: await registry.getAddress(),
    modelHash,
    deploymentBlock: receipt.blockNumber,
    deploymentBlockHash: receipt.blockHash,
    registrations,
  };
  await writeFile(dir + '/deployment.json', JSON.stringify(deployment, null, 2) + '\n');
  const config = JSON.parse(await readFile(dir + '/wrangler.json', 'utf8'));
  Object.assign(config.vars, {
    CIRCUIT_REGISTRY: deployment.circuit.registry,
    CIRCUIT_MODEL_HASH: modelHash,
    CIRCUIT_DEPLOYMENT_BLOCK: String(receipt.blockNumber),
    CIRCUIT_DEPLOYMENT_BLOCK_HASH: receipt.blockHash,
  });
  await writeFile(dir + '/wrangler.json', JSON.stringify(config, null, 2) + '\n');
  console.log(JSON.stringify(deployment.circuit, null, 2));
} finally {
  provider.destroy();
}
