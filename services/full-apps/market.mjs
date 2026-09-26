import { bodyStep, ensureBody } from '../../packages/bio_agent/browser/body.js';
const ATOM = 10n ** 18n,
  GAS = ATOM / 1000n;
const clamp = (x) => Math.max(0, Math.min(1, x));
export class MarketEnvironment {
  constructor(chain, tape) {
    if (tape.length < 3) throw Error('Confirmed market observations required');
    this.chain = chain;
    this.tape = tape;
    this.cursor = 0;
    this.tick = 0;
    this.flies = [0, 1].map((id) => ({
      id,
      name: ['MOMO', 'SORA'][id],
      cash: 100n * ATOM,
      units: 0n,
      equity: 100n * ATOM,
      pnl: 0n,
      reward: 0,
      trades: 0,
      energy: 0.7,
    }));
    this.flies.forEach(ensureBody);
  }
  observe() {
    const event = this.tape[this.cursor],
      previous = this.tape[Math.max(0, this.cursor - 1)];
    const delta = (event.price / previous.price - 1) * 10000;
    return this.flies.map((f) => ({
      price: event.price,
      deltaBps: delta,
      held: f.units > 0n,
      satiety: f.satiety,
      reserves: f.reserves,
      drives: [
        clamp(delta / 1000),
        clamp(-delta / 1000),
        f.units > 0n ? 1 : 0,
        f.satiety,
        f.reserves,
        clamp(Number(f.cash) / Number(100n * ATOM)),
        clamp(Math.abs(delta) / 1000),
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
      allowed: f.units > 0n ? [0, 2] : f.cash >= 10n * ATOM + GAS ? [0, 1] : [0],
      source: event,
    }));
  }
  async apply(actions) {
    const decision = this.tape[this.cursor],
      fill = this.tape[this.cursor + 1],
      mark = this.tape[this.cursor + 2];
    if (!mark || fill.blockNumber <= decision.blockNumber || mark.blockNumber <= fill.blockNumber)
      throw Error('Later fill and valuation blocks required');
    const observations = this.observe(),
      outcomes = [];
    for (const [i, f] of this.flies.entries()) {
      const action = actions[i];
      if (!observations[i].allowed.includes(action)) throw Error('Invalid market action');
      const before = f.equity;
      let fillQuote = null,
        valuation = null;
      if (action === 1) {
        fillQuote = await this.chain.quote('buy', 10n * ATOM, fill);
        f.cash -= 10n * ATOM + GAS;
        f.units = BigInt(fillQuote.amountOut);
        f.trades++;
      }
      if (action === 2) {
        fillQuote = await this.chain.quote('sell', f.units, fill);
        f.cash += BigInt(fillQuote.amountOut) - GAS;
        f.units = 0n;
        f.trades++;
      }
      let liquidation = 0n;
      if (f.units > 0n) {
        valuation = await this.chain.quote('sell', f.units, mark);
        liquidation = BigInt(valuation.amountOut) - GAS;
      }
      f.equity = f.cash + liquidation;
      f.pnl = f.equity - 100n * ATOM;
      const reward = Number(f.equity - before) / Number(ATOM);
      f.reward += reward;
      bodyStep(f, { fed: reward > 0 });
      outcomes.push({
        reward,
        metrics: {
          action,
          pnl: String(f.pnl),
          equity: String(f.equity),
          trades: f.trades,
          fillQuote,
          valuation,
        },
        source: { kind: 'paper-fill-and-mark', decision, fill, mark, assumedGasAtoms: String(GAS) },
      });
    }
    this.cursor += 2;
    this.tick++;
    return outcomes;
  }
  snapshot() {
    return JSON.parse(
      JSON.stringify(
        {
          app: 'market',
          tick: this.tick,
          cursor: this.cursor,
          lastEvent: this.tape[this.cursor],
          flies: this.flies,
        },
        (_k, v) => (typeof v === 'bigint' ? String(v) : v),
      ),
    );
  }
}
