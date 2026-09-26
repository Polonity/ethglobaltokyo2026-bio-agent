import { ForagingBioAgent } from '../../bio_agent/runtime/agents.js';

// Explicit clock ownership for existing foraging adapters sharing one Arena.
// Quote/swap adapters have their own freshness rules and are deliberately unsupported here.
const owners = new WeakMap();
export class SharedArenaClock {
  #arena;
  #agents;
  #tick = 0;
  constructor(agents) {
    if (
      !agents.length ||
      agents.some((a) => a.constructor !== ForagingBioAgent) ||
      agents.some((a) => a.arena !== agents[0].arena) ||
      new Set(agents.map((a) => a.agentId)).size !== agents.length
    )
      throw Error('Distinct foraging adapters sharing one Arena required');
    this.#arena = agents[0].arena;
    this.#agents = [...agents];
    if (owners.has(this.#arena)) throw Error('Arena already has a clock owner');
    owners.set(this.#arena, this);
  }
  advance(tick) {
    if (!Number.isSafeInteger(tick) || tick < 1) throw Error('Positive tick required');
    if (tick === this.#tick) return { applied: false, tick, agents: this.#agents.map((a) => a.snapshot()) };
    if (tick !== this.#tick + 1) throw Error('Out-of-order clock tick');
    this.#arena.tick(0.2);
    this.#tick = tick;
    return { applied: true, tick, agents: this.#agents.map((a) => a.snapshot()) };
  }
}
