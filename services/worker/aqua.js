// Powered by Aqua — © Degensoft Ltd 2025. Local prototype only.
import { Interface, AbiCoder, keccak256, parseEther, formatEther } from 'ethers';
import { AquaProtocolContract } from '@1inch/aqua-sdk';
import { Address, HexString } from '@1inch/sdk-core';
import { decideAqua } from '../../packages/bio_agent/connectome/aqua-controller.js';
import graph from '../../packages/bio_agent/connectome/male-cns-slice.json';
const reg = new Interface([
  'function getAgent(uint256) view returns(tuple(address owner,bytes32 modelHash,string metadataURI))',
  'function getStatus(uint256) view returns(tuple(uint8 activity,uint16 energy,uint16 stimulus,uint64 revision,uint64 updatedAt))',
  'function updateStatus(uint256,uint64,uint8,uint16,uint16)',
  'event BioAgentStatusUpdated(uint256 indexed agentId,uint64 indexed revision,address indexed writer,uint8 activity,uint16 energy,uint16 stimulus,uint64 updatedAt)',
]);
const aq = new Interface([
  'event Shipped(address maker,address app,bytes32 strategyHash,bytes strategy)',
  'event Docked(address maker,address app,bytes32 strategyHash)',
  'function rawBalances(address,address,bytes32,address) view returns(uint248,uint8)',
]);
const erc = new Interface(['function balanceOf(address) view returns(uint256)']);
const appAbi = new Interface(['function swap(address,bytes,bool,uint256,uint256) returns(uint256)']);
const coder = AbiCoder.defaultAbiCoder();
const types = ['uint256', 'uint256', 'uint256', 'bytes32'];
const json = (x, s = 200) => Response.json(x, { status: s, headers: { 'Cache-Control': 'no-store' } });
export async function aquaRoute(request, env, rpc) {
  if (!env.AQUA_CONFIG) return json({ error: 'Run npm run local:aqua first' }, 503);
  const cfg = JSON.parse(env.AQUA_CONFIG),
    url = new URL(request.url);
  const deployed = await rpc(env, 'eth_getBlockByNumber', [
    '0x' + BigInt(cfg.deploymentBlock).toString(16),
    false,
  ]);
  if (deployed?.hash !== cfg.deploymentBlockHash) return json({ error: 'Aqua deployment changed' }, 409);
  const sdk = new AquaProtocolContract(new Address(cfg.aqua));
  const tip = await rpc(env, 'eth_getBlockByNumber', ['latest', false]);
  const call = async (abi, to, name, args = [], block = tip.number) =>
    abi.decodeFunctionResult(
      name,
      await rpc(env, 'eth_call', [{ to, data: abi.encodeFunctionData(name, args) }, block]),
    );
  const logs = await rpc(env, 'eth_getLogs', [
    { address: cfg.aqua, fromBlock: '0x' + BigInt(cfg.deploymentBlock).toString(16), toBlock: tip.number },
  ]);
  const strategies = [];
  for (const l of logs) {
    let e;
    try {
      e = aq.parseLog(l);
    } catch {
      continue;
    }
    if (
      !e ||
      e.args.maker.toLowerCase() !== env.LOCAL_OWNER.toLowerCase() ||
      e.args.app.toLowerCase() !== cfg.app.toLowerCase()
    )
      continue;
    if (e.name === 'Shipped') {
      const [id, revision, spread, hash] = coder.decode(types, e.args.strategy);
      strategies.push({
        agentId: Number(id),
        revision: String(revision),
        spreadBps: Number(spread),
        modelHash: hash,
        strategy: e.args.strategy,
        strategyHash: e.args.strategyHash,
        transactionHash: l.transactionHash,
        blockNumber: Number(BigInt(l.blockNumber)),
        active: true,
      });
    }
    if (e.name === 'Docked') {
      const s = strategies.find((s) => s.strategyHash === e.args.strategyHash);
      if (s) {
        s.active = false;
        s.dockTransactionHash = l.transactionHash;
      }
    }
  }
  const stimulusLogs = await rpc(env, 'eth_getLogs', [
    {
      address: cfg.registry,
      fromBlock: '0x' + BigInt(cfg.deploymentBlock).toString(16),
      toBlock: tip.number,
      topics: [reg.getEvent('BioAgentStatusUpdated').topicHash],
    },
  ]);
  const agents = [];
  for (let id = 1; id <= 3; id++) {
    const [[agent], [status]] = await Promise.all([
      call(reg, cfg.registry, 'getAgent', [id]),
      call(reg, cfg.registry, 'getStatus', [id]),
    ]);
    if (agent.owner.toLowerCase() !== env.LOCAL_OWNER.toLowerCase() || agent.modelHash !== cfg.modelHash)
      return json({ error: 'Agent/model mismatch' }, 409);
    const source = stimulusLogs.findLast((l) => {
      const e = reg.parseLog(l);
      return Number(e.args.agentId) === id && e.args.revision === status.revision;
    });
    if (!source || Number(reg.parseLog(source).args.stimulus) !== Number(status.stimulus))
      return json({ error: 'Confirmed stimulus event missing' }, 409);
    const decision = decideAqua(graph, Number(status.stimulus), id);
    const active = [];
    for (const s of strategies.filter((s) => s.agentId === id && s.active)) {
      const [b0, b1] = await Promise.all([
        call(aq, cfg.aqua, 'rawBalances', [env.LOCAL_OWNER, cfg.app, s.strategyHash, cfg.token0]),
        call(aq, cfg.aqua, 'rawBalances', [env.LOCAL_OWNER, cfg.app, s.strategyHash, cfg.token1]),
      ]);
      active.push({
        ...s,
        balances: [formatEther(b0[0]), formatEther(b1[0])],
        current: s.revision === String(status.revision),
      });
    }
    agents.push({
      id,
      source: {
        transactionHash: source.transactionHash,
        blockHash: source.blockHash,
        logIndex: source.logIndex,
      },
      revision: String(status.revision),
      stimulus: Number(status.stimulus),
      decision,
      active,
    });
  }
  if (url.pathname === '/api/aqua/snapshot' && request.method === 'GET') {
    const balances = await Promise.all(
      [cfg.token0, cfg.token1].map(async (t) => ({
        maker: formatEther((await call(erc, t, 'balanceOf', [env.LOCAL_OWNER]))[0]),
        aqua: formatEther((await call(erc, t, 'balanceOf', [cfg.aqua]))[0]),
        taker: formatEther((await call(erc, t, 'balanceOf', [cfg.taker]))[0]),
      })),
    );
    return json({
      config: cfg,
      maker: env.LOCAL_OWNER,
      chainId: '31337',
      blockNumber: Number(BigInt(tip.number)),
      agents,
      strategies,
      balances,
    });
  }
  if (url.pathname === '/api/aqua/receipt' && request.method === 'GET') {
    const hash = url.searchParams.get('hash');
    if (!/^0x[0-9a-f]{64}$/i.test(hash || '')) return json({ error: 'Invalid hash' }, 400);
    const receipt = await rpc(env, 'eth_getTransactionReceipt', [hash]);
    if (
      receipt &&
      ![cfg.aqua, cfg.app, cfg.registry].some((a) => a.toLowerCase() === receipt.to?.toLowerCase())
    )
      return json({ error: 'Not an Aqua demo transaction' }, 400);
    return json({ receipt });
  }
  if (request.method !== 'POST') return json({ error: 'not_found' }, 404);
  if (
    request.headers.get('Origin') !== url.origin ||
    request.headers.get('Content-Type')?.split(';')[0] !== 'application/json'
  )
    return json({ error: 'Same-origin JSON required' }, 403);
  const text = await request.text();
  if (text.length > 512) return json({ error: 'Too large' }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (![1, 2, 3].includes(body.agentId)) return json({ error: 'Invalid agent' }, 400);
  const agent = agents[body.agentId - 1];
  if (body.revision !== agent.revision) return json({ error: 'Stale revision; refresh' }, 409);
  const send = async (info, from = env.LOCAL_OWNER) => {
    const tx = { from, to: info.to, data: info.data };
    await rpc(env, 'eth_call', [tx, 'latest']);
    const gas = await rpc(env, 'eth_estimateGas', [tx]);
    const hash = await rpc(env, 'eth_sendTransaction', [
      { ...tx, gas: '0x' + ((BigInt(gas) * 12n) / 10n).toString(16) },
    ]);
    let receipt;
    for (let attempt = 0; attempt < 40; attempt++) {
      receipt = await rpc(env, 'eth_getTransactionReceipt', [hash]);
      if (receipt) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!receipt || receipt.status !== '0x1')
      throw Error('Transaction not confirmed: ' + hash + '; inspect receipt before retry');
    return {
      transactionHash: hash,
      blockNumber: Number(BigInt(receipt.blockNumber)),
      gasUsed: String(BigInt(receipt.gasUsed)),
    };
  };
  if (url.pathname === '/api/aqua/stimulus') {
    if (!Number.isInteger(body.stimulus) || body.stimulus < 0 || body.stimulus > 10000)
      return json({ error: 'Invalid stimulus' }, 400);
    return json(
      await send({
        to: cfg.registry,
        data: reg.encodeFunctionData('updateStatus', [agent.id, agent.revision, 0, 5000, body.stimulus]),
      }),
    );
  }
  if (url.pathname === '/api/aqua/apply') {
    const d = agent.decision,
      transactions = [];
    if (d.action !== 'dock' && agent.active.some((s) => s.current))
      return json({ transactions, stage: 'already-applied' });
    // A changed input makes old strategies unfillable in AquaFlyApp immediately.
    for (const old of agent.active)
      transactions.push({
        operation: 'dock',
        ...(await send(
          sdk.dock({
            app: new Address(cfg.app),
            strategyHash: new HexString(old.strategyHash),
            tokens: [new Address(cfg.token0), new Address(cfg.token1)],
          }),
        )),
      });
    if (d.action !== 'dock') {
      const strategy = coder.encode(types, [agent.id, agent.revision, d.spreadBps, cfg.modelHash]);
      const ship = sdk.ship({
        app: new Address(cfg.app),
        strategy: new HexString(strategy),
        amountsAndTokens: [cfg.token0, cfg.token1].map((t) => ({
          token: new Address(t),
          amount: parseEther(d.virtualAmount),
        })),
      });
      transactions.push({ operation: 'ship', strategyHash: keccak256(strategy), ...(await send(ship)) });
    }
    return json({ transactions, stage: 'confirmed', decision: d.action });
  }
  if (url.pathname === '/api/aqua/fill') {
    const s = agent.active.find((s) => s.current);
    if (!s) return json({ error: 'No current strategy' }, 409);
    const amount = parseEther('1'),
      minimum = (amount * BigInt(10000 - s.spreadBps)) / 10000n;
    return json(
      await send(
        {
          to: cfg.app,
          data: appAbi.encodeFunctionData('swap', [env.LOCAL_OWNER, s.strategy, true, amount, minimum]),
        },
        cfg.taker,
      ),
    );
  }
  return json({ error: 'not_found' }, 404);
}
