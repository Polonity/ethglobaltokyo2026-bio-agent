import { Interface, formatEther } from 'ethers';
import { FullChain } from '../../services/full-apps/chain.mjs';
import { BrainClient } from './brain-client.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const chain = new FullChain(),
  brain = new BrainClient();
try {
  await chain.setup(await brain.call('describe'));
  const abi = new Interface([
    'event Swap(address indexed sender,address indexed recipient,int256 amount0,int256 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick)',
  ]);
  const logs = await chain.provider.getLogs({
    address: chain.config.market.pool,
    fromBlock: chain.config.blockNumber,
    toBlock: 'latest',
    topics: [abi.getEvent('Swap').topicHash],
  });
  const events = logs.map((log) => {
    const { args } = abi.parseLog(log);
    return {
      kind: 'confirmed-uniswap-v3-swap',
      transactionHash: log.transactionHash,
      blockHash: log.blockHash,
      blockNumber: log.blockNumber,
      logIndex: log.index,
      pool: chain.config.market.pool,
      sqrtPriceX96: String(args.sqrtPriceX96),
      price: (Number(args.sqrtPriceX96) / 2 ** 96) ** 2,
      amount: formatEther(args.amount0 > 0n ? args.amount0 : args.amount1),
      zeroForOne: args.amount0 > 0n,
    };
  });
  const save = async () => {
    await mkdir('artifacts/full-apps', { recursive: true });
    await writeFile(
      'artifacts/full-apps/market-tape.json',
      JSON.stringify(
        {
          schema: 'bioagent.confirmed-market-tape.v1',
          config: chain.config.market,
          source: 'actual Anvil Uniswap V3 Swap logs; scripted inputs, no real assets',
          events,
        },
        null,
        2,
      ) + '\n',
    );
  };
  console.log(JSON.stringify({ recoveredConfirmedEvents: events.length }));
  for (let i = events.length; i < 1000; i++) {
    // Alternating low/high volatility, trending runs. This is a disclosed test input generator.
    const length = 6 + (Math.floor(i / 120) % 3);
    const down = Math.floor(i / length) % 2 === 1;
    const amount = Math.floor(i / 40) % 2 === 0 ? '1' : '30';
    events.push(await chain.move(down, amount));
    if (i % 100 === 99) {
      await save();
      console.log(JSON.stringify({ events: events.length, price: events.at(-1).price }));
    }
  }
  await mkdir('artifacts/full-apps', { recursive: true });
  await writeFile(
    'artifacts/full-apps/market-tape.json',
    JSON.stringify(
      {
        schema: 'bioagent.confirmed-market-tape.v1',
        config: chain.config.market,
        source: 'actual Anvil Uniswap V3 Swap logs; scripted inputs, no real assets',
        events,
      },
      null,
      2,
    ) + '\n',
  );
} finally {
  chain.close();
  brain.close();
}
