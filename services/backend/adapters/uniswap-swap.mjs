import { Interface, getAddress } from 'ethers';

// Uniswap V3 only. V2/V4 have different event semantics and need separate adapters.
export const swapInterface = new Interface([
  'event Swap(address indexed sender,address indexed recipient,int256 amount0,int256 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick)',
]);
const hash = (value) => /^0x[0-9a-f]{64}$/i.test(value || '');

// The pool allowlist is operator configuration, NOT proof of a canonical Uniswap deployment.
// Before production use, resolve the pair through the canonical factory and verify token metadata.
export async function readSwapReceipt(provider, { chainId, pool, confirmations = 2 }, txHash) {
  if (!Number.isSafeInteger(chainId) || chainId <= 0 || !hash(txHash)) throw new Error('Invalid source');
  if (!Number.isSafeInteger(confirmations) || confirmations < 1) throw new Error('Invalid confirmations');
  const address = getAddress(pool);
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(chainId)) throw new Error('Wrong chain');
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1 || receipt.hash.toLowerCase() !== txHash.toLowerCase())
    throw new Error('Missing or unsuccessful receipt');
  const [head, block] = await Promise.all([
    provider.getBlockNumber(),
    provider.getBlock(receipt.blockNumber),
  ]);
  if (!block || block.hash !== receipt.blockHash) throw new Error('Noncanonical receipt');
  if (head - receipt.blockNumber + 1 < confirmations) throw new Error('Awaiting confirmations');
  return receipt.logs
    .filter(
      (log) =>
        log.address.toLowerCase() === address.toLowerCase() &&
        log.topics[0] === swapInterface.getEvent('Swap').topicHash,
    )
    .map((log) => {
      if (
        log.removed ||
        log.blockHash !== block.hash ||
        log.transactionHash.toLowerCase() !== txHash.toLowerCase()
      )
        throw new Error('Invalid log provenance');
      const { args } = swapInterface.parseLog(log);
      if (
        args.sqrtPriceX96 < 4295128739n ||
        args.sqrtPriceX96 >= 1461446703485210103287273052203988822378723970342n ||
        args.liquidity === 0n
      )
        throw new Error('Invalid or inactive pool price');
      return {
        source: 'evm-swap-log',
        protocol: 'uniswap-v3-event',
        chainId,
        pool: address,
        blockNumber: receipt.blockNumber,
        blockHash: block.hash,
        transactionHash: txHash,
        transactionIndex: receipt.index,
        logIndex: log.index,
        observedAt: block.timestamp * 1000,
        sqrtPriceX96: args.sqrtPriceX96.toString(),
        liquidity: args.liquidity.toString(),
        tick: Number(args.tick),
        eventId: `${chainId}:${address.toLowerCase()}:${block.hash}:${txHash.toLowerCase()}:${log.index}`,
      };
    })
    .sort((a, b) => a.logIndex - b.logIndex);
}
