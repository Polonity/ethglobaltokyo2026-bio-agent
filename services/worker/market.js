import { Interface } from 'ethers/abi';
const harness = new Interface(['function movePrice(bool)', 'function quote(bool,uint256) returns(uint256)']);
const pool = new Interface([
  'function slot0() view returns(uint160,int24,uint16,uint16,uint16,uint8,bool)',
  'function token0() view returns(address)',
  'function token1() view returns(address)',
  'function liquidity() view returns(uint128)',
  'event Swap(address indexed sender,address indexed recipient,int256 amount0,int256 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick)',
]);
const registry = new Interface([
  'function getAgent(uint256) view returns(tuple(address owner,bytes32 modelHash,string metadataURI))',
]);
const factory = new Interface(['function getPool(address,address,uint24) view returns(address)']);
const hex = (x) => `0x${BigInt(x).toString(16)}`;
export async function marketRoute(request, env, rpc) {
  const url = new URL(request.url);
  const json = (data, status = 200) =>
    Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!env.MARKET_POOL || !env.MARKET_HARNESS || !env.MARKET_REGISTRY)
    return json({ error: 'Run npm run local:market for this Anvil first' }, 503);
  const call = async (abi, to, name, args = [], block = 'latest') =>
    abi.decodeFunctionResult(
      name,
      await rpc(env, 'eth_call', [{ to, data: abi.encodeFunctionData(name, args) }, block]),
    );
  const tip = await rpc(env, 'eth_getBlockByNumber', ['latest', false]);
  const [token0] = await call(pool, env.MARKET_POOL, 'token0', [], tip.number);
  const [token1] = await call(pool, env.MARKET_POOL, 'token1', [], tip.number);
  const [resolved] = await call(factory, env.MARKET_FACTORY, 'getPool', [token0, token1, 3000], tip.number);
  if (resolved.toLowerCase() !== env.MARKET_POOL.toLowerCase())
    return json({ error: 'Factory/pool mismatch' }, 409);
  if (url.pathname === '/api/market/snapshot') {
    const agents = [];
    for (let id = 1; id <= 3; id++) {
      const [agent] = await call(registry, env.MARKET_REGISTRY, 'getAgent', [id], tip.number);
      if (
        agent.modelHash !== env.MARKET_MODEL_HASH ||
        agent.owner.toLowerCase() !== env.LOCAL_OWNER.toLowerCase()
      )
        return json({ error: 'Market agent registration mismatch' }, 409);
      agents.push({
        agentId: String(id),
        owner: agent.owner,
        modelHash: agent.modelHash,
        metadataURI: agent.metadataURI,
      });
    }

    const after = url.searchParams.get('after');
    if (after && !/^\d+$/.test(after)) return json({ error: 'Invalid cursor' }, 400);
    if (after) {
      const block = await rpc(env, 'eth_getBlockByNumber', [hex(after), false]);
      if (!block || block.hash !== url.searchParams.get('hash'))
        return json({ error: 'reorg', reset: true }, 409);
    }
    const from = after ? BigInt(after) + 1n : BigInt(env.MARKET_DEPLOYMENT_BLOCK);
    if (BigInt(tip.number) - from > 1000n)
      return json({ error: 'Replay window exceeded; start a new local round' }, 409);
    const logs =
      from > BigInt(tip.number)
        ? []
        : await rpc(env, 'eth_getLogs', [
            {
              address: env.MARKET_POOL,
              fromBlock: hex(from),
              toBlock: tip.number,
              topics: [pool.getEvent('Swap').topicHash],
            },
          ]);
    const events = [];
    for (const log of logs) {
      const { args } = pool.parseLog(log);
      const block = await rpc(env, 'eth_getBlockByNumber', [log.blockNumber, false]);
      if (log.removed || block.hash !== log.blockHash) return json({ error: 'reorg', reset: true }, 409);
      events.push({
        id: `${log.blockHash}:${log.transactionHash}:${log.logIndex}`,
        blockNumber: Number(BigInt(log.blockNumber)),
        blockHash: log.blockHash,
        transactionHash: log.transactionHash,
        logIndex: Number(BigInt(log.logIndex)),
        timestampMs: Number(BigInt(block.timestamp)) * 1000,
        sqrtPriceX96: args.sqrtPriceX96.toString(),
        liquidity: args.liquidity.toString(),
        tick: Number(args.tick),
      });
    }
    return json({
      agents,
      registry: env.MARKET_REGISTRY,
      modelHash: env.MARKET_MODEL_HASH,
      chainId: '31337',
      protocol: 'uniswap-v3-core@1.0.1',
      pool: env.MARKET_POOL,
      factory: env.MARKET_FACTORY,
      token0,
      token1,
      decimals: 18,
      fee: 3000,
      verification: 'factory-verified',
      blockNumber: Number(BigInt(tip.number)),
      blockHash: tip.hash,
      events,
    });
  }
  if (url.pathname === '/api/market/quote') {
    const amount = url.searchParams.get('amount'),
      direction = url.searchParams.get('direction');
    const blockNumber = url.searchParams.get('block');
    if (
      !/^[1-9]\d{0,20}$/.test(amount || '') ||
      BigInt(amount) > 100n * 10n ** 18n ||
      !['buy', 'sell'].includes(direction) ||
      !/^\d+$/.test(blockNumber || '')
    )
      return json({ error: 'Invalid quote request' }, 400);
    const block = await rpc(env, 'eth_getBlockByNumber', [hex(blockNumber), false]);
    if (!block || block.hash !== url.searchParams.get('hash'))
      return json({ error: 'Quote block changed' }, 409);
    const [out] = await call(
      harness,
      env.MARKET_HARNESS,
      'quote',
      [direction === 'sell', amount],
      hex(blockNumber),
    );
    return json({
      quoteId: `31337:${env.MARKET_POOL}:${block.hash}:${direction}:${amount}`,
      kind: 'exact-input-quote',
      amountIn: amount,
      amountOut: out.toString(),
      tokenIn: direction === 'buy' ? token1 : token0,
      tokenOut: direction === 'buy' ? token0 : token1,
      blockNumber: Number(blockNumber),
      blockHash: block.hash,
      source: 'anvil-eth-call',
      outputIncludesPoolFeesAndImpact: true,
    });
  }
  if (url.pathname === '/api/market/move' && request.method === 'POST') {
    if (
      request.headers.get('Origin') !== url.origin ||
      request.headers.get('Content-Type')?.split(';')[0] !== 'application/json'
    )
      return json({ error: 'Same-origin JSON required' }, 403);
    const text = await request.text();
    if (text.length > 100) return json({ error: 'Too large' }, 413);
    const body = JSON.parse(text);
    if (!['up', 'down'].includes(body.direction)) return json({ error: 'Invalid direction' }, 400);
    const tx = {
      from: env.LOCAL_OWNER,
      to: env.MARKET_HARNESS,
      data: harness.encodeFunctionData('movePrice', [body.direction === 'down']),
    };
    await rpc(env, 'eth_call', [tx, 'latest']);
    const gas = await rpc(env, 'eth_estimateGas', [tx]);
    return json(
      {
        transactionHash: await rpc(env, 'eth_sendTransaction', [
          { ...tx, gas: hex((BigInt(gas) * 12n) / 10n) },
        ]),
        mode: 'local-test-token-swap',
      },
      202,
    );
  }
  if (url.pathname === '/api/market/receipt') {
    const hash = url.searchParams.get('hash');
    if (!/^0x[0-9a-f]{64}$/i.test(hash || '')) return json({ error: 'Invalid hash' }, 400);
    const receipt = await rpc(env, 'eth_getTransactionReceipt', [hash]);
    if (!receipt || !receipt.logs.some((l) => l.address.toLowerCase() === env.MARKET_POOL.toLowerCase()))
      return json({ error: 'No receipt for this pool' }, 404);
    return json(receipt);
  }
  return json({ error: 'not_found' }, 404);
}
