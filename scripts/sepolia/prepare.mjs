import { ContractFactory, Interface, formatEther, formatUnits, parseUnits } from 'ethers';
import { ensureWallet, provider, artifact, json, CHAIN_ID } from './common.mjs';
const wallet = await ensureWallet(),
  p = await provider();
try {
  const a = await artifact(),
    factory = new ContractFactory(a.abi, a.bytecode.object);
  const tx = await factory.getDeployTransaction();
  // eth_estimateGas for contract creation is evaluated without a from balance check.
  const gas = await p.estimateGas(tx),
    fee = await p.getFeeData(),
    balance = await p.getBalance(wallet.address);
  const maxFee = fee.maxFeePerGas && fee.maxFeePerGas > 0n ? fee.maxFeePerGas : parseUnits('2', 'gwei');
  const initGas = 350000n,
    smokeGas = 8n * 80000n;
  const gasBudget = (gas * 130n) / 100n + initGas + smokeGas;
  const estimatedCap = gasBudget * maxFee;
  // Request a small reserve for changing fees and repeated browser tests, not a spend authorization.
  const reserve = 5000000000000000n;
  const requested = estimatedCap * 3n > reserve ? estimatedCap * 3n : reserve;
  const result = {
    chainId: CHAIN_ID,
    network: 'Ethereum Sepolia',
    address: wallet.address,
    balanceETH: formatEther(balance),
    registryDeploymentGas: gas.toString(),
    registrationGasBudget: initGas.toString(),
    smokeTestGasBudget: smokeGas.toString(),
    currentMaxFeeGwei: formatUnits(maxFee, 'gwei'),
    estimatedBudgetETH: formatEther(estimatedCap),
    requestedFundingETH: formatEther(requested),
    fundingNeeded: balance < estimatedCap,
    timestamp: new Date().toISOString(),
    scope: 'One Registry, one demo agent, up to eight input updates; browser learning needs no gas',
  };
  await json('artifacts/sepolia/funding-plan.json', result);
  console.log(JSON.stringify(result, null, 2));
} finally {
  p.destroy();
}
