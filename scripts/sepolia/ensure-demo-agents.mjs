import path from 'node:path';
import fs from 'node:fs/promises';
import { Contract } from 'ethers';
import { loadWallet, provider, artifact, local, deploymentPath, json } from './common.mjs';
import { sendOnce } from './transactions.mjs';
const p = await provider(),
  wallet = (await loadWallet()).connect(p);
try {
  const d = JSON.parse(await fs.readFile(deploymentPath, 'utf8'));
  const c = new Contract(d.registryAddress, (await artifact()).abi, p);
  const writes = [];
  for (const id of ['1', '2', '3']) {
    let definition;
    try {
      definition = await c.getAgent(id);
    } catch (e) {
      if (e.code !== 'CALL_EXCEPTION') throw e;
    }
    if (!definition) {
      const r = await sendOnce({
        provider: p,
        wallet,
        directory: path.join(local, 'journal'),
        label: `register-shared-ui-agent-${id}`,
        request: await c.registerAgent.populateTransaction(d.modelHash, d.metadataURI),
      });
      writes.push({ operation: 'registerAgent', agentId: id, hash: r.hash, feeWei: r.fee.toString() });
      definition = await c.getAgent(id);
    }
    if (
      definition.owner.toLowerCase() !== wallet.address.toLowerCase() ||
      definition.modelHash !== d.modelHash
    )
      throw Error('Existing agent ownership/model mismatch');
    const s = await c.getStatus(id);
    if (s.revision === 1n) {
      const r = await sendOnce({
        provider: p,
        wallet,
        directory: path.join(local, 'journal'),
        label: `initialize-shared-ui-agent-${id}`,
        request: await c.updateStatus.populateTransaction(id, s.revision, 2, 7000, 5500),
      });
      writes.push({ operation: 'updateStatus', agentId: id, hash: r.hash, feeWei: r.fee.toString() });
    }
  }
  d.demoAgentIds = ['1', '2', '3'];
  await json(deploymentPath, d);
  await json('artifacts/sepolia/shared-ui-registration.json', { writes });
  console.log(JSON.stringify({ agentIds: d.demoAgentIds, writes }));
} finally {
  p.destroy();
}
