import { random } from '../browser/arena.js';
import { bodyStep } from '../browser/body.js';
export const ATOM = 10n ** 18n;
export const PAPER_GAS = ATOM / 1000n; // Explicit game assumption in token1, not actual chain gas.
const actions = ['hold', 'buy', 'sell'];
const clone = (x) => structuredClone(x);
export class PaperArena {
  constructor(seed = 2026) {
    this.rng = random(seed);
    this.lastEvent = null;
    this.seen = new Set();
    this.tick = 0;
    this.events = [];
    this.flies = ['MOMO', 'SORA', 'KIKI'].map((name, id) => ({
      id,
      name,
      color: ['#ed754a', '#76ae8f', '#b394d6'][id],
      energy: 0.7,
      satiety: 0.4,
      reserves: 0.5,
      massRatio: 1,
      cash: 100n * ATOM,
      units: 0n,
      basis: 0n,
      realized: 0n,
      equity: 100n * ATOM,
      pnl: 0n,
      q: {},
      memory: [],
      version: 1,
      state: 'watching',
      training: null,
      pending: null,
      decision: 'hold',
      lastKey: null,
      lastAction: 0,
      lastEquity: 100n * ATOM,
      trades: [],
      report: null,
      attention: 0,
      deltaBps: '0',
      reason: 'baseline',
    }));
  }
  row(f, key, q = f.q) {
    if (q[key]) return q[key];
    const [sign, held] = key.split(':').map(Number);
    // Named engineering priors, not biological instincts or learned market knowledge.
    const buy = f.id === 0 ? sign * 0.04 : f.id === 1 ? -sign * 0.04 : -0.01;
    const sell = f.id === 0 ? -sign * 0.04 : f.id === 1 ? sign * 0.04 : 0.015;
    return [0, held ? -1 : buy, held ? sell : -1];
  }
  record(f, text) {
    this.events.unshift({ tick: this.tick, fly: f.name, text });
    this.events = this.events.slice(0, 60);
  }
  async consume(event, quote) {
    if (
      !event ||
      !/^0x[0-9a-f]{64}$/i.test(event.transactionHash || '') ||
      !/^0x[0-9a-f]{64}$/i.test(event.blockHash || '') ||
      !/^[1-9]\d*$/.test(event.sqrtPriceX96 || '') ||
      !Number.isSafeInteger(event.blockNumber) ||
      !Number.isSafeInteger(event.logIndex)
    )
      throw new Error('Invalid market event');
    if (this.seen.has(event.id)) return false;
    if (
      this.lastEvent &&
      (event.blockNumber < this.lastEvent.blockNumber ||
        (event.blockNumber === this.lastEvent.blockNumber &&
          (event.blockHash !== this.lastEvent.blockHash || event.logIndex <= this.lastEvent.logIndex)))
    )
      throw new Error('Market order/reorg mismatch');
    const sqrt = BigInt(event.sqrtPriceX96);
    if (sqrt < 4295128739n || sqrt >= 1461446703485210103287273052203988822378723970342n)
      throw new Error('Invalid pool price');
    const old = this.lastEvent ? BigInt(this.lastEvent.sqrtPriceX96) : sqrt;
    const delta = ((sqrt * sqrt - old * old) * 10000n) / (old * old);
    // Work on a draft. Failed quote transport cannot partly apply one market event.
    const rng = random(this.rng.state());
    const draft = this.flies.map(clone);
    const notices = [];
    for (const f of draft) {
      const pending = f.pending;
      if (pending && event.blockNumber > pending.blockNumber) {
        const amount = pending.side === 'buy' ? 10n * ATOM : f.units;
        if (amount <= 0n || (pending.side === 'buy' && f.cash < amount + PAPER_GAS)) {
          f.pending = null;
          f.reason = 'insufficient-funds';
        } else {
          const q = await quote(pending.side, amount.toString(), event);
          this.checkQuote(q, amount, event);
          const out = BigInt(q.amountOut);
          if (pending.side === 'buy') {
            f.cash -= amount + PAPER_GAS;
            f.units += out;
            f.basis += amount + PAPER_GAS;
          } else {
            f.cash += out - PAPER_GAS;
            f.realized += out - PAPER_GAS - f.basis;
            f.units = 0n;
            f.basis = 0n;
          }
          f.trades.unshift({
            kind: 'paper-fill',
            side: pending.side,
            amountIn: amount.toString(),
            amountOut: out.toString(),
            sourceTransactionHash: event.transactionHash,
            decisionBlock: pending.blockNumber,
            fillBlock: event.blockNumber,
            gasCostAtoms: PAPER_GAS.toString(),
            quote: q,
          });
          f.trades = f.trades.slice(0, 40);
          f.pending = null;
          notices.push([f.id, `Paper ${pending.side} filled at block ${event.blockNumber}`]);
        }
      }
      let liquidation = 0n;
      if (f.units > 0n) {
        const q = await quote('sell', f.units.toString(), event);
        this.checkQuote(q, f.units, event);
        liquidation = BigInt(q.amountOut) - PAPER_GAS;
        f.valuationQuoteId = q.quoteId;
      }
      f.equity = f.cash + liquidation;
      f.pnl = f.equity - 100n * ATOM;
      const reward = Number(f.equity - f.lastEquity) / Number(ATOM);
      if (f.lastKey) f.memory.push({ key: f.lastKey, action: f.lastAction, reward });
      if (f.memory.length > 400) f.memory.shift();
      f.lastEquity = f.equity;
      bodyStep(f, { fed: reward > 0, resting: f.state === 'learning' });
      f.deltaBps = delta.toString();
      f.attention = Math.min(1, Number(delta < 0n ? -delta : delta) / 1000);
      const key = `${delta > 0n ? 1 : delta < 0n ? -1 : 0}:${f.units > 0n ? 1 : 0}:${f.satiety > 0.7 ? 1 : 0}`;
      if (f.state !== 'learning' && !f.pending) {
        const row = this.row(f, key);
        const allowed = f.units > 0n ? [0, 2] : f.cash >= 10n * ATOM + PAPER_GAS ? [0, 1] : [0];
        // Seeded occasional exploration is separate from the declared prior.
        const index =
          rng() < 0.15
            ? allowed[Math.floor(rng() * allowed.length)]
            : allowed.reduce((a, b) => (row[b] > row[a] ? b : a));
        f.decision = actions[index];
        f.lastKey = key;
        f.lastAction = index;
        f.reason = this.lastEvent ? 'policy-choice' : 'baseline';
        if (index > 0) f.pending = { side: actions[index], blockNumber: event.blockNumber, key };
      } else {
        f.lastKey = key;
        f.lastAction = 0;
      }
    }
    this.rng = rng;
    this.flies = draft;
    this.tick++;
    this.lastEvent = clone(event);
    this.seen.add(event.id);
    for (const [id, text] of notices) this.record(this.flies[id], text);
    if (this.tick % 6 === 0) {
      const candidate = [...this.flies]
        .filter((f) => f.state !== 'learning' && f.memory.length >= 5)
        .sort((a, b) => (a.pnl < b.pnl ? -1 : a.pnl > b.pnl ? 1 : a.id - b.id))[0];
      if (candidate) this.startTraining(candidate.id);
    }
    return true;
  }
  checkQuote(q, amount, event) {
    if (
      q?.amountIn !== amount.toString() ||
      !/^[1-9]\d*$/.test(q?.amountOut || '') ||
      q.blockHash !== event.blockHash ||
      q.blockNumber !== event.blockNumber ||
      q.outputIncludesPoolFeesAndImpact !== true
    )
      throw new Error('Quote mismatch');
  }
  startTraining(id) {
    const f = this.flies[id];
    if (!f || f.state === 'learning' || f.memory.length < 5) return false;
    const split = Math.max(1, Math.floor(f.memory.length * 0.7));
    const candidate = clone(f.q),
      training = f.memory.slice(0, split),
      selection = f.memory.slice(split);
    for (let epoch = 0; epoch < 12; epoch++)
      for (const sample of training) {
        const row = (candidate[sample.key] ||= [...this.row(f, sample.key)]);
        row[sample.action] += 0.12 * (sample.reward - row[sample.action]);
      }
    const loss = (q) =>
      selection.reduce((sum, x) => sum + (this.row(f, x.key, q)[x.action] - x.reward) ** 2, 0) /
      selection.length;
    f.training = {
      remaining: 8,
      candidate,
      before: loss(f.q),
      after: loss(candidate),
      samples: training.length,
      selection: selection.length,
    };
    f.state = 'learning';
    f.pending = null;
    this.record(f, 'Learning reward estimates; position remains exposed');
    return true;
  }
  advanceLearning(dt = 0.2) {
    for (const f of this.flies)
      if (f.state === 'learning') {
        f.training.remaining -= dt;
        if (f.training.remaining <= 0) {
          const t = f.training;
          const adopted = t.after < t.before - 1e-9;
          if (adopted) {
            f.q = t.candidate;
            f.version++;
          }
          f.report = {
            adopted,
            before: t.before,
            after: t.after,
            trainingSamples: t.samples,
            selectionSamples: t.selection,
            metric: 'selection reward-prediction MSE; not held-out PnL',
          };
          f.state = 'watching';
          f.training = null;
          this.record(f, adopted ? 'Candidate adopted' : 'Previous policy retained');
        }
      }
  }
  snapshot() {
    return JSON.parse(
      JSON.stringify(
        {
          tick: this.tick,
          lastEvent: this.lastEvent,
          events: this.events,
          flies: this.flies,
          rng: this.rng.state(),
          seen: [...this.seen],
        },
        (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
      ),
    );
  }
}
