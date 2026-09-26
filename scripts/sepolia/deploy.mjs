import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Contract, ContractFactory, keccak256 } from 'ethers';
import { loadWallet, provider, artifact, json, local, deploymentPath, CHAIN_ID, sha256 } from './common.mjs';
import { sendOnce } from './transactions.mjs';
import { MALE_CNS } from '../../packages/bio_agent/connectome/male-cns.js';

if (!process.argv.includes('--broadcast'))
  throw Error('Use prepare.mjs for estimates; --broadcast explicitly sends to Sepolia');
const p = await provider(),
  wallet = (await loadWallet()).connect(p);
try {
  const a = await artifact(),
    factory = new ContractFactory(a.abi, a.bytecode.object);
  const send = (label, request) =>
    sendOnce({ provider: p, wallet, directory: path.join(local, 'journal'), label, request });
  const deployed = await send('deploy-registry', await factory.getDeployTransaction());
  const address = deployed.contractAddress;
  if (!address) throw Error('Missing deployed contract address');
  const code = await p.getCode(address);
  if (code.toLowerCase() !== a.deployedBytecode.object.toLowerCase())
    throw Error('Deployed bytecode differs from compiled Registry');
  const registry = new Contract(address, a.abi, p);
  const metadataURI = 'https://ethglobaltokyo-bio-agent-sepolia.commun-official.workers.dev/model.json';
  const registered = await send(
    'register-demo-agent',
    await registry.registerAgent.populateTransaction(MALE_CNS.graphSha256, metadataURI),
  );
  const registration = registered.logs
    .map((l) => {
      try {
        return registry.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((l) => l?.name === 'BioAgentRegistered');
  if (!registration) throw Error('No registration event');
  const agentId = registration.args.agentId.toString();
  const definition = await registry.getAgent(agentId);
  if (
    definition.owner.toLowerCase() !== wallet.address.toLowerCase() ||
    definition.modelHash !== MALE_CNS.graphSha256
  )
    throw Error('Registered identity mismatch');
  const initial = await send(
    'initialize-demo-status',
    await registry.updateStatus.populateTransaction(agentId, 1, 2, 7000, 5500),
  );
  const block = await p.getBlock(deployed.blockNumber);
  const record = {
    schema: 'bioagent.sepolia-deployment.v1',
    chainId: CHAIN_ID,
    registryAddress: address,
    deployer: wallet.address,
    deploymentTransaction: deployed.hash,
    blockNumber: deployed.blockNumber,
    blockHash: deployed.blockHash,
    deployedAt: new Date(block.timestamp * 1000).toISOString(),
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    compiler: { version: '0.8.30', evmVersion: 'cancun', optimizerRuns: 200 },
    runtimeBytecodeHash: keccak256(code),
    abiSha256: sha256(JSON.stringify(a.abi)),
    modelHash: MALE_CNS.graphSha256,
    neurons: MALE_CNS.neurons,
    edges: MALE_CNS.edges,
    demoAgentId: agentId,
    registrationTransaction: registered.hash,
    initialStatusTransaction: initial.hash,
    metadataURI,
    explorer: `https://sepolia.etherscan.io/address/${address}`,
    verification: 'runtime-bytecode-matched; explorer-source-verification-pending',
  };
  await json(deploymentPath, record);
  console.log(JSON.stringify(record, null, 2));
} catch (e) {
  console.error(JSON.stringify({ error: e.shortMessage || e.message, code: e.code || null }));
  process.exitCode = 1;
} finally {
  p.destroy();
}
