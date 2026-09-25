import { IBioAgentRuntime } from './agents.js';
import { Arena } from '../browser/arena.js';

// Trusted-adapter input only; no RPC verification or trading inside the runtime.
export class UniswapSwapBioAgent extends IBioAgentRuntime {
  kind = 'uniswap-swap-observer-v1';
  constructor(identity, { chainId, pool, maxAgeMs = 60_000, seed = 2026 }) {
    super(identity);
    if (!Number.isSafeInteger(chainId) || chainId <= 0 || !/^0x[0-9a-f]{40}$/i.test(pool || ''))
      throw new Error('Invalid market identity');
    if (!Number.isSafeInteger(maxAgeMs) || maxAgeMs <= 0) throw new Error('Invalid freshness window');
    this.market = { chainId, pool: pool.toLowerCase() };
    this.maxAgeMs = maxAgeMs;
    this.arena = new Arena(seed, { agentCount: 1 });
    this.seen = new Set();
  }
  observe(event, now = Date.now()) {
    const e = structuredClone(event);
    if (
      e.source !== 'evm-swap-log' ||
      e.protocol !== 'uniswap-v3-event' ||
      e.chainId !== this.market.chainId ||
      e.pool?.toLowerCase() !== this.market.pool
    )
      throw new Error('Unexpected market source');
    if (
      !Number.isSafeInteger(now) ||
      !Number.isSafeInteger(e.observedAt) ||
      e.observedAt > now ||
      now - e.observedAt > this.maxAgeMs
    )
      throw new Error('Stale or invalid event time');
    for (const field of ['blockNumber', 'transactionIndex', 'logIndex'])
      if (!Number.isSafeInteger(e[field]) || e[field] < 0) throw new Error('Invalid event order');
    for (const field of ['blockHash', 'transactionHash'])
      if (!/^0x[0-9a-f]{64}$/i.test(e[field] || '')) throw new Error('Invalid event hash');
    const id = `${e.chainId}:${e.pool.toLowerCase()}:${e.blockHash}:${e.transactionHash.toLowerCase()}:${e.logIndex}`;
    if (e.eventId !== id) throw new Error('Invalid event identity');
    if (!/^[1-9]\d{0,48}$/.test(e.sqrtPriceX96 || '')) throw new Error('Invalid price');
    const sqrt = BigInt(e.sqrtPriceX96);
    if (sqrt < 4295128739n || sqrt >= 1461446703485210103287273052203988822378723970342n)
      throw new Error('Invalid price range');
    if (this.seen.has(id)) return null;
    const old = this.lastInput?.event;
    if (old) {
      if (e.blockNumber === old.blockNumber && e.blockHash !== old.blockHash)
        throw new Error('Reorg: reset and replay required');
      const order =
        e.blockNumber - old.blockNumber ||
        e.transactionIndex - old.transactionIndex ||
        e.logIndex - old.logIndex;
      if (order <= 0 || e.observedAt < old.observedAt) throw new Error('Out-of-order event');
    }
    const previous = old && e.observedAt - old.observedAt <= this.maxAgeMs ? BigInt(old.sqrtPriceX96) : null;
    // token1 base units per token0 base unit = sqrtPriceX96^2 / 2^192.
    // Decimal normalization cancels for SAME-pool percentage changes.
    const delta = previous ? ((sqrt * sqrt - previous * previous) * 10000n) / (previous * previous) : 0n;
    const magnitude = delta < 0n ? -delta : delta;
    const status = {
      activity: delta > 0n ? 2 : delta < 0n ? 0 : 1,
      energy: 5000,
      stimulus: Number(magnitude > 10000n ? 10000n : magnitude),
    };
    this.arena.applyStatus({
      mode: ['rest', 'explore', 'forage'][status.activity],
      energy: 0.5,
      stimulus: status.stimulus / 10000,
    });
    this.lastInput = {
      event: e,
      deltaBps: delta.toString(),
      status,
      reaction: !previous ? 'baseline' : delta > 0n ? 'curious' : delta < 0n ? 'cautious' : 'calm',
      execution: 'observe-only',
    };
    this.seen.add(id);
    return structuredClone(this.lastInput);
  }
  step(dt = 0.2, now = Date.now()) {
    if (!Number.isSafeInteger(now)) throw new Error('Invalid clock');
    const time = this.lastInput?.event.observedAt;
    if (time === undefined) return { ...this.snapshot(), inputState: 'waiting' };
    if (now < time || now - time > this.maxAgeMs) return { ...this.snapshot(), inputState: 'stale' };
    return { ...super.step(dt), inputState: 'fresh' };
  }
}
