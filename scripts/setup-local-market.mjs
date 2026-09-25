import { createHash } from 'node:crypto';
// Deploys actual pinned Uniswap V3 core on an already-running local Anvil only.
import { readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { ContractFactory, JsonRpcProvider, Interface } from 'ethers';
const dir = process.env.LOCAL_STATE_DIR || '.local';
const deployment = JSON.parse(await readFile(`${dir}/deployment.json`, 'utf8'));
if (!['localhost', '127.0.0.1'].includes(new URL(deployment.rpcUrl).hostname))
  throw new Error('Loopback only');
const provider = new JsonRpcProvider(deployment.rpcUrl);
try {
  if (
    (await provider.getNetwork()).chainId !== 31337n ||
    !(await provider.send('web3_clientVersion', [])).toLowerCase().startsWith('anvil/')
  )
    throw new Error('Anvil required');
  const build = spawnSync(process.env.FORGE || 'forge', ['build', '--root', 'contracts'], {
    encoding: 'utf8',
  });
  if (build.status !== 0) throw new Error(build.stderr);
  const signer = await provider.getSigner(deployment.owner);
  const deploy = async (file, name, args = []) => {
    const artifact = JSON.parse(await readFile(file, 'utf8'));
    const factory = new ContractFactory(artifact.abi, artifact.bytecode.object || artifact.bytecode, signer);
    const c = await factory.deploy(...args);
    await c.waitForDeployment();
    return c;
  };
  const core = await deploy(
    'node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json',
  );
  const a = await deploy('contracts/out/LocalMarket.sol/LocalMarketToken.json', '', ['NECTAR']);
  const b = await deploy('contracts/out/LocalMarket.sol/LocalMarketToken.json', '', ['POLLEN']);
  const harness = await deploy('contracts/out/LocalMarket.sol/LocalMarket.json', '', [
    await core.getAddress(),
    await a.getAddress(),
    await b.getAddress(),
  ]);
  for (const token of [a, b])
    await (await token.transfer(await harness.getAddress(), 100000n * 10n ** 18n)).wait();
  const seeded = await (await harness.seed()).wait();
  const pool = await harness.pool();
  const token0 = await harness.token0(),
    token1 = await harness.token1();
  if ((await core.getPool(token0, token1, 3000)).toLowerCase() !== pool.toLowerCase())
    throw new Error('Factory mismatch');
  const quote = await harness.quote.staticCall(false, 10n * 10n ** 18n);
  if (quote <= 0n) throw new Error('No quote');
  const swap = await (await harness.movePrice(false)).wait();
  const iface = new Interface([
    'event Swap(address indexed sender,address indexed recipient,int256 amount0,int256 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick)',
  ]);
  if (
    !swap.logs.some(
      (l) =>
        l.address.toLowerCase() === pool.toLowerCase() && l.topics[0] === iface.getEvent('Swap').topicHash,
    )
  )
    throw new Error('Missing real Swap');
  const manifest = await readFile('packages/bio_agent/runtime/paper-manifest.json');
  const modelHash = `0x${createHash('sha256').update(manifest).digest('hex')}`;
  const registry = await deploy('contracts/out/BioAgentStimulusRegistry.sol/BioAgentStimulusRegistry.json');
  const registrationTxs = [];
  for (let id = 1; id <= 3; id++) {
    const receipt = await (
      await registry.registerAgent(modelHash, `${deployment.guiUrl}/models/market-agent-${id}.json`)
    ).wait();
    registrationTxs.push(receipt.hash);
  }
  const result = {
    ...deployment,
    market: {
      registry: await registry.getAddress(),
      modelHash,
      registrationTxs,
      factory: await core.getAddress(),
      pool,
      harness: await harness.getAddress(),
      token0,
      token1,
      decimals: 18,
      fee: 3000,
      deploymentBlock: seeded.blockNumber,
      initialSwap: swap.hash,
      protocol: 'uniswap-v3-core@1.0.1',
      quoteAmountOut: quote.toString(),
    },
  };
  await writeFile(`${dir}/deployment.json`, JSON.stringify(result, null, 2) + '\n');
  const config = JSON.parse(await readFile(`${dir}/wrangler.json`, 'utf8'));
  Object.assign(config.vars, {
    MARKET_REGISTRY: result.market.registry,
    MARKET_MODEL_HASH: modelHash,
    MARKET_FACTORY: result.market.factory,
    MARKET_POOL: pool,
    MARKET_HARNESS: result.market.harness,
    MARKET_DEPLOYMENT_BLOCK: String(seeded.blockNumber),
  });
  await writeFile(`${dir}/wrangler.json`, JSON.stringify(config, null, 2) + '\n');
  console.log(JSON.stringify(result.market, null, 2));
} finally {
  provider.destroy();
}
