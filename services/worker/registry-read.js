import { Interface } from 'ethers';
import abi from '../../contracts/abi/BioAgentRegistry.json' with { type: 'json' };
const contract = new Interface(abi);
const hex = (n) => '0x' + BigInt(n).toString(16);
const decimal = (n) => BigInt(n).toString();
const json = (v, status = 200) => Response.json(v, { status, headers: { 'Cache-Control': 'no-store' } });
const state = (s) => ({
  activity: Number(s.activity),
  energy: Number(s.energy),
  stimulus: Number(s.stimulus),
  revision: decimal(s.revision),
  updatedAt: decimal(s.updatedAt),
});
export async function registryRead(request, config, rpc) {
  const url = new URL(request.url),
    path = url.pathname;
  if (request.method !== 'GET') return null;
  if (!['/api/chain/snapshot', '/api/chain/events', '/api/chain/receipt'].includes(path)) return null;
  const address = config.registryAddress.toLowerCase();
  const call = async (name, args, block) =>
    contract.decodeFunctionResult(
      name,
      await rpc('eth_call', [{ to: address, data: contract.encodeFunctionData(name, args) }, block]),
    );
  const logs = async (from, to) => {
    const output = [];
    for (let n = BigInt(from); n <= BigInt(to); n += 1000n) {
      const end = n + 999n > BigInt(to) ? BigInt(to) : n + 999n;
      const rows = await rpc('eth_getLogs', [
        {
          address,
          fromBlock: hex(n),
          toBlock: hex(end),
          topics: [contract.getEvent('BioAgentStatusUpdated').topicHash],
        },
      ]);
      await Promise.all(
        rows.map(async (l) => {
          if (l.removed || l.address.toLowerCase() !== address) throw Error('Invalid Registry log');
          const e = contract.parseLog(l);
          if (!config.agentIds.includes(e.args.agentId.toString())) return;
          const receipt = await rpc('eth_getTransactionReceipt', [l.transactionHash]);
          if (
            !receipt ||
            BigInt(receipt.status) !== 1n ||
            receipt.blockHash !== l.blockHash ||
            receipt.transactionHash !== l.transactionHash ||
            !receipt.logs.some(
              (r) =>
                r.address.toLowerCase() === address &&
                r.transactionHash === l.transactionHash &&
                r.logIndex === l.logIndex &&
                r.data === l.data &&
                JSON.stringify(r.topics) === JSON.stringify(l.topics),
            )
          )
            throw Error('Confirmed Registry receipt required');
          const b = await rpc('eth_getBlockByNumber', [l.blockNumber, false]);
          if (b?.hash !== l.blockHash) throw Error('Registry history changed');
          const event = {
            chainId: String(config.chainId),
            registryAddress: address,
            blockNumber: decimal(l.blockNumber),
            blockHash: l.blockHash,
            transactionHash: l.transactionHash,
            transactionIndex: decimal(l.transactionIndex),
            logIndex: decimal(l.logIndex),
            name: e.name,
            agentId: e.args.agentId.toString(),
            writer: e.args.writer,
            status: state(e.args),
            receiptVerified: true,
          };
          event.eventId = `${event.chainId}:${address}:${event.blockHash}:${event.transactionHash}:${event.logIndex}`;
          output.push(event);
        }),
      );
    }
    return output.sort(
      (a, b) =>
        Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)) ||
        Number(a.transactionIndex) - Number(b.transactionIndex) ||
        Number(a.logIndex) - Number(b.logIndex),
    );
  };
  if (path.endsWith('/receipt')) {
    const hash = url.searchParams.get('hash');
    if (!/^0x[0-9a-f]{64}$/i.test(hash || '')) return json({ error: 'Invalid transaction hash' }, 400);
    const r = await rpc('eth_getTransactionReceipt', [hash]);
    if (!r) return json({ stage: 'pending' });
    if (r.to?.toLowerCase() !== address) return json({ error: 'Not a Registry transaction' }, 400);
    return json({
      stage: BigInt(r.status) === 1n ? 'mined' : 'reverted',
      blockNumber: decimal(r.blockNumber),
      transactionHash: hash,
    });
  }
  const tip = await rpc('eth_getBlockByNumber', ['latest', false]);
  if (!tip || (String(config.chainId) !== '31337' && Date.now() / 1000 - Number(BigInt(tip.timestamp)) > 120))
    throw Error('Fresh chain block required');
  const envelope = {
    blockNumber: decimal(tip.number),
    blockHash: tip.hash,
    blockTimestamp: decimal(tip.timestamp),
  };
  const canonical = async () => {
    const block = await rpc('eth_getBlockByNumber', [tip.number, false]);
    if (block?.hash !== tip.hash) throw Error('Registry anchor changed');
  };
  if (path.endsWith('/events')) {
    const after = url.searchParams.get('after'),
      hash = url.searchParams.get('hash');
    if (!/^\d{1,16}$/.test(after || '') || !/^0x[0-9a-f]{64}$/i.test(hash || ''))
      return json({ error: 'Cursor required' }, 400);
    if (BigInt(after) < BigInt(config.deployBlock) || BigInt(after) > BigInt(tip.number))
      return json({ error: 'reorg', reset: true }, 409);
    const base = await rpc('eth_getBlockByNumber', [hex(after), false]);
    if (!base || base.hash !== hash) return json({ error: 'reorg', reset: true }, 409);
    const events = await logs(BigInt(after) + 1n, BigInt(tip.number));
    await canonical();
    return json({ ...envelope, events });
  }
  const events = await logs(config.deployBlock, BigInt(tip.number));
  const agents = await Promise.all(
    config.agentIds.map(async (agentId) => {
      const [[a], [s]] = await Promise.all([
        call('getAgent', [agentId], tip.number),
        call('getStatus', [agentId], tip.number),
      ]);
      if (a.modelHash !== config.modelHash) throw Error('Model hash mismatch');
      const cause = events.findLast(
        (e) => e.agentId === agentId && e.status.revision === decimal(s.revision),
      );
      if (!cause || cause.writer.toLowerCase() !== a.owner.toLowerCase()) throw Error('Status event missing');
      return {
        agentId,
        owner: a.owner,
        modelHash: a.modelHash,
        metadataURI: a.metadataURI,
        status: state(s),
        cause,
      };
    }),
  );
  await canonical();
  return json({ ...envelope, agents, events });
}
