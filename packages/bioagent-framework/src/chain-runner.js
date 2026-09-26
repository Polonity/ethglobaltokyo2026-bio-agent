import { verifyMaleCNSArtifact } from './model-integrity.js';
const addr = (x) => typeof x === 'string' && /^0x[0-9a-f]{40}$/i.test(x);
const hash = (x) => typeof x === 'string' && /^0x[0-9a-f]{64}$/i.test(x);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Connects a read-only source to a task runtime. No wallet, signing or transactions.
export class ChainDecisionRunner {
  #agent;
  #expected;
  #input = null;
  #source;
  constructor(
    agent,
    { chainId, registry, agentId, maxBlockAgeSeconds = 120, minConfirmations = 2, source = null },
  ) {
    if (
      !Number.isSafeInteger(chainId) ||
      chainId < 1 ||
      !addr(registry) ||
      !/^[1-9]\d*$/.test(String(agentId)) ||
      !Number.isSafeInteger(maxBlockAgeSeconds) ||
      maxBlockAgeSeconds < 1 ||
      !Number.isSafeInteger(minConfirmations) ||
      minConfirmations < 0
    )
      throw Error('Invalid runner binding');
    this.#agent = agent;
    this.#source = source;
    this.#expected = {
      chainId,
      registry: registry.toLowerCase(),
      agentId: String(agentId),
      maxBlockAgeSeconds,
      minConfirmations,
    };
  }
  observe(input, now = Math.floor(Date.now() / 1000)) {
    const e = this.#expected,
      i = structuredClone(input),
      s = i?.status,
      b = i?.block;
    if (
      i?.source !== 'evm-rpc-state' ||
      i.chainId !== e.chainId ||
      i.registry !== e.registry ||
      i.agentId !== e.agentId ||
      i.owner !== this.#agent.identity.owner.toLowerCase() ||
      i.model !== this.#agent.binding.model ||
      !hash(i.model) ||
      !hash(b?.hash) ||
      !Number.isSafeInteger(b?.number) ||
      b.number < 0 ||
      !Number.isSafeInteger(b?.confirmations) ||
      b.confirmations < e.minConfirmations ||
      !Number.isSafeInteger(b?.timestamp) ||
      b.timestamp < 0 ||
      !Number.isSafeInteger(now) ||
      b.timestamp > now ||
      now - b.timestamp > e.maxBlockAgeSeconds ||
      !/^[1-9]\d*$/.test(s?.revision || '') ||
      BigInt(s.revision) > 2n ** 64n - 1n ||
      !Number.isSafeInteger(s?.updatedAt) ||
      s.updatedAt < 0 ||
      s.updatedAt > b.timestamp
    )
      throw Error('Invalid, stale or incompatible chain input');
    if (this.#input) {
      const previous = this.#input;
      if (
        b.number < previous.block.number ||
        (b.number === previous.block.number &&
          (b.hash !== previous.block.hash ||
            b.timestamp !== previous.block.timestamp ||
            !same(s, previous.status))) ||
        BigInt(s.revision) < BigInt(previous.status.revision) ||
        (s.revision === previous.status.revision && !same(s, previous.status))
      )
        throw Error('Rollback or conflicting chain input; explicit resync required');
      if (same(i, previous)) return false;
    }
    this.#agent.observe(s);
    this.#input = i;
    return true;
  }
  async poll(now = Math.floor(Date.now() / 1000)) {
    if (!this.#source) throw Error('No chain source configured');
    const input = await this.#source.read();
    this.observe(input, now);
    return this.decide(now);
  }
  async decide(now = Math.floor(Date.now() / 1000)) {
    if (
      !Number.isSafeInteger(now) ||
      !this.#input ||
      now < this.#input.block.timestamp ||
      now - this.#input.block.timestamp > this.#expected.maxBlockAgeSeconds
    )
      throw Error('Fresh chain input required');
    await verifyMaleCNSArtifact(this.#agent.binding.model);
    const artifact = await this.#agent.exportPolicy();
    const input = structuredClone(this.#input);
    // Check again after asynchronous hashing; do not label a concurrent policy/input change incorrectly.
    if (
      artifact.version !== this.#agent.version ||
      !same(artifact.policy, this.#agent.policy) ||
      !same(input, this.#input)
    )
      throw Error('Decision context changed; retry');
    const decision = this.#agent.step(0.2);
    return {
      schema: 'bioagent.framework-decision.v1',
      identity: structuredClone(this.#agent.identity),
      input,
      binding: this.#agent.binding,
      policy: { version: artifact.version, sha256: artifact.sha256 },
      decision,
      execution: 'decision-only',
      trust: 'trusted-rpc-observation; not a state proof',
    };
  }
}
