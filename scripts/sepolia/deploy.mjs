import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Contract, ContractFactory, keccak256, toUtf8Bytes } from 'ethers';
import { loadWallet, provider, artifact, json, local, deploymentPath, CHAIN_ID, sha256 } from './common.mjs';
import { sendOnce } from './transactions.mjs';
import { MALE_CNS } from '../../packages/bio_agent/connectome/male-cns.js';
import defaultWorld from '../../packages/bio_agent/browser/foraging-world.json' with { type: 'json' };
import { WORLD_SCHEMA, validateWorldInput } from '../../packages/bio_agent/browser/tx-world.js';

if (!process.argv.includes('--broadcast'))
  throw Error('Use prepare.mjs for estimates; --broadcast sends to Sepolia');
const p = await provider(),
  wallet = (await loadWallet()).connect(p);
try {
  let previous = null;
  try {
    previous = JSON.parse(await fs.readFile(deploymentPath, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  const a = await artifact(),
    factory = new ContractFactory(a.abi, a.bytecode.object);
  const writes = [];
  const send = async (label, request) => {
    const r = await sendOnce({
      provider: p,
      wallet,
      directory: path.join(local, 'journal'),
      label: 'world-v1-' + label,
      request,
    });
    writes.push({ operation: label, transactionHash: r.hash, feeWei: r.fee.toString() });
    return r;
  };
  const deployed = await send('deploy-registry', await factory.getDeployTransaction());
  const address = deployed.contractAddress;
  if (!address) throw Error('Missing deployed contract address');
  const code = await p.getCode(address);
  if (code.toLowerCase() !== a.deployedBytecode.object.toLowerCase())
    throw Error('Deployed bytecode mismatch');
  const registry = new Contract(address, a.abi, p);
  const metadataURI = 'https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/model.json';
  const registrations = [];
  for (const id of ['1', '2', '3']) {
    const r = await send(
      'register-agent-' + id,
      await registry.registerAgent.populateTransaction(MALE_CNS.graphSha256, metadataURI),
    );
    registrations.push(r.hash);
    const definition = await registry.getAgent(id);
    if (
      definition.owner.toLowerCase() !== wallet.address.toLowerCase() ||
      definition.modelHash !== MALE_CNS.graphSha256
    )
      throw Error('Registered identity mismatch');
  }
  const environment = await send(
    'environment',
    await registry.submitStimulus.populateTransaction(
      1,
      0,
      WORLD_SCHEMA,
      toUtf8Bytes(JSON.stringify(validateWorldInput(defaultWorld))),
    ),
  );
  const initialStatuses = [];
  for (const id of ['1', '2', '3'])
    initialStatuses.push(
      (
        await send(
          'initialize-agent-' + id,
          await registry.updateStatus.populateTransaction(id, 1, 2, 7000, 5500),
        )
      ).hash,
    );
  const block = await p.getBlock(deployed.blockNumber);
  const record = {
    schema: 'bioagent.sepolia-deployment.v2',
    contract: 'BioAgentStimulusRegistry',
    chainId: CHAIN_ID,
    registryAddress: address,
    deployer: wallet.address,
    deploymentTransaction: deployed.hash,
    blockNumber: deployed.blockNumber,
    blockHash: deployed.blockHash,
    deployedAt: new Date(block.timestamp * 1000).toISOString(),
    sourceCommit:
      previous?.registryAddress === address
        ? previous.sourceCommit
        : execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    compiler: { version: '0.8.30', evmVersion: 'cancun', optimizerRuns: 200 },
    runtimeBytecodeHash: keccak256(code),
    abiSha256: sha256(JSON.stringify(a.abi)),
    modelHash: MALE_CNS.graphSha256,
    neurons: MALE_CNS.neurons,
    edges: MALE_CNS.edges,
    demoAgentId: '1',
    demoAgentIds: ['1', '2', '3'],
    registrationTransactions: registrations,
    initialStatusTransactions: initialStatuses,
    worldInput: true,
    environmentTransaction: environment.hash,
    environmentSchema: WORLD_SCHEMA,
    metadataURI,
    explorer: `https://sepolia.etherscan.io/address/${address}`,
    verification: 'runtime-bytecode-matched',
    previousRegistry:
      previous?.registryAddress !== address ? previous?.registryAddress : previous?.previousRegistry,
  };
  await json(deploymentPath, record);
  await json('artifacts/sepolia/world-deployment.json', {
    writes,
    balanceWei: (await p.getBalance(wallet.address)).toString(),
  });
  console.log(
    JSON.stringify({
      registry: address,
      environmentTransaction: environment.hash,
      agentIds: record.demoAgentIds,
      writes,
    }),
  );
} catch (e) {
  console.error(JSON.stringify({ error: e.shortMessage || e.message, code: e.code || null }));
  process.exitCode = 1;
} finally {
  p.destroy();
}
