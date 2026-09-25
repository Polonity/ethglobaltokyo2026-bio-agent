import { Arena } from '../browser/arena.js';
// Off-chain runtime contract. IBioAgent.sol remains the on-chain status interface.
export class IBioAgentRuntime {
  constructor({ id, owner, smartWallet = null }) {
    if (!id || !/^0x[0-9a-f]{40}$/i.test(owner || '')) throw new Error('Agent identity required');
    if (
      smartWallet &&
      (!Number.isSafeInteger(smartWallet.chainId) ||
        smartWallet.chainId <= 0 ||
        !/^0x[0-9a-f]{40}$/i.test(smartWallet.address || ''))
    )
      throw new Error('Invalid wallet reference');
    this.identity = Object.freeze({
      id,
      owner,
      smartWallet: smartWallet ? Object.freeze({ ...smartWallet, verification: 'owner-declared' }) : null,
    });
    this.lastInput = null;
  }
  observe() {
    throw new Error('observe must be implemented');
  }
  step(dt = 0.2) {
    if (dt !== 0.2) throw new Error('Tick must be exactly 0.2 seconds');
    this.arena.tick(dt);
    return this.snapshot();
  }
  snapshot() {
    return structuredClone({
      identity: this.identity,
      kind: this.kind,
      lastInput: this.lastInput,
      runtime: this.arena
        ? {
            time: this.arena.time,
            agents: this.arena.flies.map((f) => ({
              name: f.name,
              x: f.x,
              y: f.y,
              decision: f.lastDecision,
              score: f.score,
              state: f.state,
            })),
          }
        : null,
    });
  }
}

// Adapter over the existing Arena, preserving its behavior and chain provenance.
export class ForagingBioAgent extends IBioAgentRuntime {
  kind = 'foraging-q-v1';
  constructor(identity, arena, agentId) {
    super(identity);
    this.arena = arena;
    this.agentId = String(agentId);
    if (!arena.flies[Number(agentId) - 1]) throw new Error('Unknown arena agent');
  }
  observe(event) {
    if (event.name !== 'BioAgentStatusUpdated' || event.agentId !== this.agentId)
      throw new Error('Expected this agent’s StatusUpdated event');
    const applied = this.arena.applyAgentStatus(this.agentId, event.status, event);
    if (applied) this.lastInput = { source: 'chain-log', event: structuredClone(event) };
    return applied;
  }
}

function positiveInteger(value) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || value.length > 78)
    throw new Error('Positive base-unit amount required');
  return BigInt(value);
}

// Observes comparable, exact-input quotes. No signing, approvals or swap execution.
export class UniswapPriceBioAgent extends IBioAgentRuntime {
  kind = 'uniswap-price-observer-v1';
  constructor(identity, { chainId, tokenIn, tokenOut, amountIn, maxAgeMs = 30_000 }) {
    super(identity);
    if (!Number.isSafeInteger(chainId) || chainId <= 0) throw new Error('Invalid chain');
    for (const token of [tokenIn, tokenOut])
      if (!/^0x[0-9a-f]{40}$/i.test(token || '')) throw new Error('Invalid token');
    if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) throw new Error('Distinct pair required');
    positiveInteger(amountIn);
    if (!Number.isSafeInteger(maxAgeMs) || maxAgeMs <= 0) throw new Error('Invalid freshness window');
    this.market = { chainId, tokenIn: tokenIn.toLowerCase(), tokenOut: tokenOut.toLowerCase(), amountIn };
    this.arena = new Arena(2026, { agentCount: 1 });
    this.maxAgeMs = maxAgeMs;
    this.seen = new Set();
  }
  step(dt = 0.2, now = Date.now()) {
    if (!Number.isSafeInteger(now)) throw new Error('Invalid clock');
    const observedAt = this.lastInput?.quote.observedAt;
    if (observedAt === undefined) return { ...this.snapshot(), inputState: 'waiting' };
    if (now < observedAt || now - observedAt > this.maxAgeMs)
      return { ...this.snapshot(), inputState: 'stale' };
    return { ...super.step(dt), inputState: 'fresh' };
  }
  observe(quote, now = Date.now()) {
    const q = structuredClone(quote);
    if (!['uniswap-api', 'fixture'].includes(q.source) || !q.observationId || q.routing !== 'CLASSIC')
      throw new Error('Unsupported quote provenance or routing');
    if (
      q.chainId !== this.market.chainId ||
      q.tokenIn?.toLowerCase() !== this.market.tokenIn ||
      q.tokenOut?.toLowerCase() !== this.market.tokenOut ||
      q.amountIn !== this.market.amountIn
    )
      throw new Error('Quote market or input size changed');
    const amountOut = positiveInteger(q.amountOut);
    if (
      !Number.isSafeInteger(now) ||
      !Number.isSafeInteger(q.observedAt) ||
      q.observedAt > now ||
      now - q.observedAt > this.maxAgeMs
    )
      throw new Error('Stale or invalid observation time');
    if (this.seen.has(q.observationId)) return null;
    const previousQuote = this.lastInput?.quote;
    const previous =
      previousQuote && now - previousQuote.observedAt <= this.maxAgeMs && previousQuote.source === q.source
        ? previousQuote
        : null;
    if (previousQuote && q.observedAt <= previousQuote.observedAt)
      throw new Error('Out-of-order observation');
    // Compare only one fixed pair and input size: decimals cancel in the ratio.
    // This is a quote movement, not a USD spot price or a profitability signal.
    const delta = previous
      ? ((amountOut - BigInt(previous.amountOut)) * 10_000n) / BigInt(previous.amountOut)
      : 0n;
    const magnitude = delta < 0n ? -delta : delta;
    const input = {
      activity: delta > 0n ? 2 : delta < 0n ? 0 : 1,
      energy: 5000,
      stimulus: Number(magnitude > 10_000n ? 10_000n : magnitude),
    };
    const result = {
      source: q.source,
      quote: q,
      deltaBps: delta.toString(),
      status: input,
      reaction: previous ? (delta > 0n ? 'curious' : delta < 0n ? 'cautious' : 'calm') : 'baseline',
      execution: 'observe-only',
    };
    this.arena.applyStatus({
      mode: ['rest', 'explore', 'forage'][input.activity],
      energy: input.energy / 10000,
      stimulus: input.stimulus / 10000,
    });
    this.seen.add(q.observationId);
    this.lastInput = result;
    return structuredClone(result);
  }
}
