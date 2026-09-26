import { Contract, FetchRequest, JsonRpcProvider, Wallet, keccak256, parseEther, parseUnits } from 'ethers';
const ABI = [
  'function getAgent(uint256) view returns (tuple(address owner,bytes32 modelHash,string metadataURI))',
  'function getStatus(uint256) view returns (tuple(uint8 activity,uint16 energy,uint16 stimulus,uint64 revision,uint64 updatedAt))',
  'function updateStatus(uint256,uint64,uint8,uint16,uint16)',
];
export const LIMITS = {
  intervalMs: 3600000,
  gasLimit: 60000n,
  maxFeePerGas: parseUnits('3', 'gwei'),
  dailyBudget: parseEther('0.005'),
  reserve: parseEther('0.001'),
};
export function checkBudget({ fee, gas, balance, reserved }) {
  if (!fee || fee > LIMITS.maxFeePerGas || gas > LIMITS.gasLimit) throw Error('Gas quote exceeds cap');
  const cost = fee * gas;
  if (reserved + cost > LIMITS.dailyBudget) throw Error('Rolling 24-hour budget reached');
  if (balance < LIMITS.reserve + cost) throw Error('Gas reserve reached');
  return cost;
}
// Only the Worker scheduled handler calls /tick. No public HTTP route can request a signature.
// The persisted signed transaction is reused after an interrupted broadcast.
export class StimulusScheduler {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
    this.inFlight = null;
  }
  async fetch(request) {
    if (new URL(request.url).pathname === '/status') {
      const last = await this.ctx.storage.get('last');
      return Response.json(
        {
          enabled: this.env.STIMULUS_ENABLED === 'true',
          intervalMinutes: 60,
          chainId: 11155111,
          gasLimitCap: LIMITS.gasLimit.toString(),
          maxFeePerGasWei: LIMITS.maxFeePerGas.toString(),
          rolling24hBudgetWei: LIMITS.dailyBudget.toString(),
          worstCase24hWei: (24n * LIMITS.gasLimit * LIMITS.maxFeePerGas).toString(),
          reserveWei: LIMITS.reserve.toString(),
          last: last || null,
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/tick')
      return new Response('Not found', { status: 404 });
    if (!this.inFlight)
      this.inFlight = this.run().finally(() => {
        this.inFlight = null;
      });
    return Response.json(await this.inFlight);
  }
  async report(value) {
    const out = { ...value, checkedAt: new Date().toISOString() };
    await this.ctx.storage.put('last', out);
    return out;
  }
  async run() {
    if (this.env.STIMULUS_ENABLED !== 'true') return this.report({ state: 'disabled' });
    if (!this.env.SEPOLIA_SIGNER_KEY)
      return this.report({ state: 'unavailable', reason: 'Signer secret missing' });
    const request = new FetchRequest(
      this.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
    );
    request.timeout = 8000;
    const p = new JsonRpcProvider(request, undefined, { batchMaxCount: 1 });
    try {
      if (BigInt(await p.send('eth_chainId', [])) !== 11155111n) throw Error('Sepolia required');
      const config = await (
        await this.env.ASSETS.fetch(new Request('https://demo.internal/config.json'))
      ).json();
      if (config.chainId !== 11155111 || !config.registryAddress || config.demoAgentId !== '1')
        throw Error('Unexpected demo deployment');
      const wallet = new Wallet(this.env.SEPOLIA_SIGNER_KEY);
      const registry = new Contract(config.registryAddress, ABI, p);
      const definition = await registry.getAgent(config.demoAgentId);
      if (
        definition.owner.toLowerCase() !== wallet.address.toLowerCase() ||
        definition.modelHash !== config.modelHash
      )
        throw Error('Signer/model does not match demo owner');
      const rows = await this.ctx.storage.list({ prefix: 'tx:' });
      const now = Date.now(),
        slot = 'tx:' + Math.floor(now / LIMITS.intervalMs);
      const pending = [...rows.entries()].find(([, r]) => r.state === 'signed' || r.state === 'submitted');
      if (pending) {
        const [key, record] = pending;
        const receipt = await p.getTransactionReceipt(record.hash);
        if (receipt) {
          record.state = receipt.status === 1 ? 'confirmed' : 'reverted';
          record.blockNumber = receipt.blockNumber;
          record.feeWei = receipt.fee.toString();
          record.confirmedAt = now;
          await this.ctx.storage.put(key, record);
          rows.set(key, record);
          await this.report({
            state: record.state,
            transactionHash: record.hash,
            blockNumber: record.blockNumber,
            feeWei: record.feeWei,
          });
        } else {
          if (!(await p.getTransaction(record.hash))) await p.broadcastTransaction(record.raw);
          return this.report({ state: 'pending', transactionHash: record.hash });
        }
      }
      if (rows.has(slot)) {
        const r = rows.get(slot);
        return this.report({
          state: r.state,
          transactionHash: r.hash,
          blockNumber: r.blockNumber || null,
          feeWei: r.feeWei || null,
        });
      }
      const previous = [...rows.values()].sort((a, b) => b.createdAt - a.createdAt)[0];
      if (previous && now - previous.createdAt < LIMITS.intervalMs)
        return this.report({ state: 'interval-wait', transactionHash: previous.hash });
      const latest = await p.getTransactionCount(wallet.address, 'latest');
      if (latest !== (await p.getTransactionCount(wallet.address, 'pending')))
        throw Error('Another wallet transaction is pending');
      const state = await registry.getStatus(config.demoAgentId);
      // One positive stimulus update per hour. No token value, approvals or arbitrary calls.
      const tx = await registry.updateStatus.populateTransaction(
        config.demoAgentId,
        state.revision,
        2,
        7000,
        5500,
      );
      const estimate = await p.estimateGas({ ...tx, from: wallet.address });
      const gas = (estimate * 125n) / 100n;
      const fees = await p.getFeeData();
      const balance = await p.getBalance(wallet.address);
      const reserved = [...rows.values()]
        .filter((r) => now - (r.confirmedAt || r.createdAt) < 86400000)
        .reduce((sum, r) => sum + BigInt(r.feeWei || r.maxCostWei), 0n);
      const cost = checkBudget({ fee: fees.maxFeePerGas, gas, balance, reserved });
      const raw = await wallet.signTransaction({
        ...tx,
        chainId: 11155111,
        nonce: latest,
        type: 2,
        value: 0n,
        gasLimit: gas,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
      const record = {
        state: 'signed',
        createdAt: now,
        hash: keccak256(raw),
        raw,
        maxCostWei: cost.toString(),
      };
      // Persist before broadcasting: a retry cannot create a fresh signature or spend twice.
      await this.ctx.storage.put(slot, record);
      await p.broadcastTransaction(raw);
      record.state = 'submitted';
      await this.ctx.storage.put(slot, record);
      return this.report({
        state: 'submitted',
        transactionHash: record.hash,
        maxCostWei: record.maxCostWei,
        balanceWei: balance.toString(),
        sender: wallet.address,
      });
    } catch (e) {
      // Never expose provider request payloads, signed bytes, or the secret in public diagnostics.
      const allowed = [
        'Gas quote exceeds cap',
        'Rolling 24-hour budget reached',
        'Gas reserve reached',
        'Another wallet transaction is pending',
        'Sepolia required',
        'Unexpected demo deployment',
        'Signer/model does not match demo owner',
      ];
      return this.report({
        state: 'skipped',
        reason: allowed.includes(e.message)
          ? e.message
          : 'RPC or transaction processing unavailable; journal retained',
      });
    } finally {
      p.destroy();
    }
  }
}
