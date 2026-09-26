import { bodyStep, ensureBody } from '../../packages/bio_agent/browser/body.js';
const clamp = (x) => Math.max(0, Math.min(1, x));
export class AquaEnvironment {
  constructor(chain, tape, variant) {
    this.chain = chain;
    this.tape = tape;
    this.variant = variant;
    this.cursor = 0;
    this.tick = 0;
    this.flies = [0, 1].map((id) => ({
      id,
      name: ['MOMO', 'SORA'][id],
      reward: 0,
      fees: 0,
      fills: 0,
      energy: 0.7,
      last: null,
    }));
    this.flies.forEach(ensureBody);
  }
  observe() {
    const event = this.tape[this.cursor],
      previous = this.tape[Math.max(0, this.cursor - 1)],
      delta = event.price / previous.price - 1;
    return this.flies.map((f) => ({
      price: event.price,
      deltaBps: delta * 10000,
      source: event,
      drives: [
        clamp(Math.abs(delta) * 10),
        clamp(delta * 10),
        clamp(-delta * 10),
        f.satiety,
        f.reserves,
        clamp(f.fees),
        f.last?.filled ? 1 : 0,
        f.energy,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
      ],
      allowed: [0, 1, 2],
    }));
  }
  async apply(actions, decisions) {
    const current = this.tape[this.cursor],
      next = this.tape[this.cursor + 1];
    if (!next) throw Error('Next market observation required');
    const obs = this.observe(),
      results = [];
    for (const [i, f] of this.flies.entries()) {
      const decision = decisions[i];
      const policyHash = decision.policyHash;
      if (!/^0x[0-9a-f]{64}$/.test(policyHash || '')) throw Error('Learned policy artifact hash required');
      // Taker direction uses the current observed trend, never the future mark.
      const fill = await this.chain.aquaAction(
        this.variant,
        i,
        actions[i],
        policyHash,
        obs[i].drives[0],
        obs[i].deltaBps < 0,
        actions[i] === 0 || Math.abs(obs[i].deltaBps) >= 200,
      );
      const ratio = next.price / current.price;
      const reward = fill.tokenChanges[0] * ratio + fill.tokenChanges[1];
      f.reward += reward;
      f.fees += fill.fee;
      f.fills += Number(fill.filled);
      f.last = fill;
      bodyStep(f, { fed: reward > 0, resting: actions[i] === 2 });
      results.push({
        reward,
        metrics: { ...fill, relativeMark: ratio, cumulativeReward: f.reward, fees: f.fees },
        source: {
          kind: 'actual-aqua-test-fill-with-replayed-market-mark',
          input: current,
          nextMark: next,
          valuation:
            'Aqua test tokens use an explicit normalized Uniswap price proxy, not a token price oracle or realized production PnL',
        },
      });
    }
    this.cursor++;
    this.tick++;
    return results;
  }
  snapshot() {
    return {
      app: 'aqua',
      variant: this.variant,
      tick: this.tick,
      lastEvent: this.tape[this.cursor],
      flies: this.flies,
    };
  }
}
