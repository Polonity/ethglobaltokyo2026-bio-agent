import fs from 'node:fs/promises';
import path from 'node:path';
import { Transaction, keccak256, parseEther, parseUnits } from 'ethers';
import { CHAIN_ID } from './common.mjs';
// Persist the exact signed transaction before broadcasting. Retries reuse that hash.
export async function sendOnce({ provider, wallet, directory, label, request }) {
  if (!/^[a-z0-9-]+$/.test(label)) throw Error('Invalid transaction label');
  if (BigInt(await provider.send('eth_chainId', [])) !== BigInt(CHAIN_ID)) throw Error('Sepolia required');
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const file = path.join(directory, `${label}.json`);
  let saved;
  try {
    saved = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  if (!saved) {
    const sender = await wallet.getAddress();
    const latest = Number(BigInt(await provider.send('eth_getTransactionCount', [sender, 'latest'])));
    const pending = Number(BigInt(await provider.send('eth_getTransactionCount', [sender, 'pending'])));
    if (latest !== pending) throw Error('Unresolved pending transaction; inspect journal before sending');
    const estimate = await provider.estimateGas({ ...request, from: sender });
    const gasLimit = (estimate * 125n) / 100n;
    const fees = await provider.getFeeData();
    const maxFeePerGas = fees.maxFeePerGas;
    const maxPriorityFeePerGas = fees.maxPriorityFeePerGas;
    if (!maxFeePerGas || maxFeePerGas > parseUnits('10', 'gwei') || gasLimit > 2000000n)
      throw Error('Gas quote exceeds the test deployment budget');
    let reserved = gasLimit * maxFeePerGas;
    for (const name of await fs.readdir(directory))
      if (name.endsWith('.json')) {
        const prior = JSON.parse(await fs.readFile(path.join(directory, name), 'utf8'));
        if (prior.maxCostWei) reserved += BigInt(prior.maxCostWei);
      }
    if (reserved > parseEther('0.01')) throw Error('Cumulative transaction cap exceeds 0.01 Sepolia ETH');
    const raw = await wallet.signTransaction({
      ...request,
      chainId: CHAIN_ID,
      nonce: latest,
      type: 2,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      value: 0n,
    });
    saved = {
      label,
      hash: keccak256(raw),
      raw,
      sender,
      nonce: latest,
      to: request.to || null,
      data: request.data || '0x',
      maxCostWei: (gasLimit * maxFeePerGas).toString(),
    };
    await fs.writeFile(file, JSON.stringify(saved, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
  }
  const signed = Transaction.from(saved.raw);
  if (
    signed.hash !== saved.hash ||
    signed.chainId !== BigInt(CHAIN_ID) ||
    signed.from?.toLowerCase() !== (await wallet.getAddress()).toLowerCase() ||
    (signed.to || '').toLowerCase() !== (request.to || '').toLowerCase() ||
    signed.data !== (request.data || '0x') ||
    signed.value !== 0n
  )
    throw Error('Transaction journal does not match this action');
  let receipt = await provider.getTransactionReceipt(saved.hash);
  if (!receipt) {
    const existing = await provider.getTransaction(saved.hash);
    if (!existing) {
      try {
        await provider.broadcastTransaction(saved.raw);
      } catch (e) {
        if (!(await provider.getTransaction(saved.hash))) throw e;
      }
    }
    console.log(JSON.stringify({ label, transactionHash: saved.hash, state: 'waiting-for-receipt' }));
    receipt = await provider.waitForTransaction(saved.hash, 1, 180000);
  }
  if (!receipt || receipt.status !== 1) throw Error(`Transaction failed or pending: ${saved.hash}`);
  return receipt;
}
