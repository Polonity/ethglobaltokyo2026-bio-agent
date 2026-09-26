import { createServer } from 'node:http';
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { BrainClient } from '../../scripts/full/brain-client.mjs';
import { SharedChain } from './chain.mjs';
process.env.FULL_APPS_STATE_DIR ||= '.local/shared-market';
const dir = process.env.FULL_APPS_STATE_DIR,
  port = Number(process.env.SHARED_PORT || 8814);
const brain = new BrainClient('packages.bio_agent.full_apps.shared_market');
await brain.ready;
const descriptor = await brain.call('describe');
const chain = new SharedChain();
const config = await chain.init(descriptor.adapterHash);
const initial = await chain.balances();
const startMarket = await chain.market();
let baseline;
try {
  baseline = JSON.parse(await readFile(`${dir}/baseline.json`));
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  baseline = { balances: initial, price: startMarket.price };
  await writeFile(`${dir}/baseline.json`, JSON.stringify(baseline));
}
const state = {
  running: false,
  phase: 'idle',
  tick: 0,
  error: null,
  config,
  brain: descriptor,
  targets: [0.7, 0.3],
  balances: initial,
  price: startMarket.price,
  flies: ['MOMO', 'SORA', 'KOHARU', 'HINATA'].map((name, i) => ({
    name,
    role: i < 2 ? 'maker' : 'trader',
    status: 'idle',
    updates: 0,
  })),
  transactions: [],
  routes: { Aqua: 0, 'Uniswap V3': 0 },
  history: [],
  metrics: {},
};
const clamp = (x) => Math.min(1, Math.max(0, x));
const equity = (b, p) => b[0] * p + b[1];
const fraction = (b, p) => (b[0] * p) / equity(b, p);
const record = (tx) => {
  state.transactions.unshift({ ...tx, time: new Date().toISOString() });
  state.transactions = state.transactions.slice(0, 100);
};
function pnl(b, p) {
  return b.map((row, i) => equity(row, p) - equity(baseline.balances[i], baseline.price));
}
state.pnl = pnl(initial, startMarket.price);
let stopRequested = false,
  previousPrice = startMarket.price;
async function tick() {
  const started = performance.now();
  const market = await chain.market();
  let before = await chain.balances();
  const risk = clamp(Math.abs(market.price / previousPrice - 1) * 100);
  previousPrice = market.price;
  state.phase = 'thinking';
  const stimuli = [];
  for (let i = 0; i < 4; i++) {
    const tx = await chain.stimulus(
      i,
      i < 2 ? risk : Math.abs(state.targets[i - 2] - fraction(before[i - 1], market.price)),
    );
    stimuli.push(tx);
    record(tx);
    state.flies[i].status = 'thinking';
  }
  const makerDrives = [0, 1].map((i) => [
    risk,
    clamp(Math.abs(fraction(before[0], market.price) - 0.5) * 2),
    i * 0.25,
    0.5,
    ...Array(11).fill(0),
    1,
  ]);
  const source = { market, stimuli, pair: config.tokens };
  const makers = await brain.call('infer', { pair: 0, drives: makerDrives, source });
  state.phase = 'offering';
  for (let i = 0; i < 2; i++) {
    const decision = makers.decisions[i];
    const transactions = await chain.offer(i, decision, market.price, stimuli[i]);
    transactions.forEach(record);
    state.flies[i] = {
      ...state.flies[i],
      ...decision,
      status: ['tight', 'wide', 'withdrawn'][decision.action],
      spread: chain.active[i]?.spread ?? null,
    };
  }
  const traderBefore = await chain.balances();
  const gaps = state.targets.map((t, i) => t - fraction(traderBefore[i + 1], market.price));
  const drives = gaps.map((gap, i) => [
    clamp(gap * 5),
    clamp(-gap * 5),
    risk,
    state.targets[i],
    fraction(traderBefore[i + 1], market.price),
    0.5,
    ...Array(9).fill(0),
    1,
  ]);
  const allowed = traderBefore.slice(1).map((b) => [0, ...(b[1] >= 2 ? [1] : []), ...(b[0] >= 2 ? [2] : [])]);
  const traders = await brain.call('infer', { pair: 1, drives, allowed, source });
  const trades = [];
  state.phase = 'trading';
  for (let j = 0; j < 2; j++) {
    const decision = traders.decisions[j],
      i = j + 2;
    state.flies[i] = {
      ...state.flies[i],
      ...decision,
      status: ['hold', 'buy', 'sell'][decision.action],
      target: state.targets[j],
    };
    if (decision.action !== 0) {
      const tx = await chain.trade(i, decision.action === 2);
      record(tx);
      state.routes[tx.route]++;
      trades.push({ ...tx, individual: i });
      state.flies[i].route = tx.route;
    } else state.flies[i].route = null;
  }
  const after = await chain.balances(),
    end = await chain.market();
  state.phase = 'learning';
  // Immediate task reward, not future-return or profitability evidence.
  for (let i = 0; i < 4; i++) {
    const decision = i < 2 ? makers.decisions[i] : traders.decisions[i - 2];
    let reward;
    if (i < 2)
      reward = trades
        .filter((t) => t.route === 'Aqua' && t.maker === i)
        .reduce(
          (s, t) =>
            s +
            (t.direction
              ? Number(t.amountIn) * market.price - Number(t.amountOut)
              : Number(t.amountIn) - Number(t.amountOut) * market.price),
          0,
        );
    else {
      const j = i - 2,
        b = traderBefore[j + 1],
        a = after[j + 1];
      reward =
        10 *
          (Math.abs(state.targets[j] - fraction(b, market.price)) -
            Math.abs(state.targets[j] - fraction(a, market.price))) +
        (equity(a, market.price) - equity(b, market.price)) / 2;
    }
    const learned = await brain.call('outcome', {
      decisionId: decision.id,
      reward,
      source: { ...source, transactions: trades, balancesBefore: traderBefore, balancesAfter: after },
    });
    state.flies[i].updates = learned.updates;
    state.flies[i].reward = reward;
  }
  state.tick++;
  state.balances = after;
  state.price = end.price;
  state.pnl = pnl(after, end.price);
  state.metrics = {
    neuralMs: makers.neural.inferenceMs + traders.neural.inferenceMs,
    cycleMs: performance.now() - started,
    peakRSSMiB: traders.processPeakRSSMiB,
    neuronsPerFly: traders.neural.neuronsPerIndividual,
    connections: traders.neural.connections,
    active: [...makers.neural['activeAbove1e-12'], ...traders.neural['activeAbove1e-12']],
  };
  state.history.push({ tick: state.tick, pnl: state.pnl, price: state.price });
  state.history = state.history.slice(-100);
  await appendFile(
    `${dir}/cycles.jsonl`,
    JSON.stringify({
      tick: state.tick,
      time: new Date().toISOString(),
      metrics: state.metrics,
      market,
      end,
      flies: state.flies,
      balances: after,
      trades,
      pnl: state.pnl,
    }) + '\n',
  );
  state.phase = 'watching';
}
async function run(count) {
  state.running = true;
  state.error = null;
  stopRequested = false;
  try {
    for (let i = 0; i < count && !stopRequested; i++) {
      await tick();
      if (!stopRequested && i < count - 1)
        await new Promise((r) => setTimeout(r, Math.max(1000, 4000 - state.metrics.cycleMs)));
    }
  } catch (e) {
    state.error = e.message;
    console.error(e);
  } finally {
    state.running = false;
    state.phase = state.error ? 'error' : 'paused';
  }
}
const server = createServer(async (req, res) => {
  const json = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(data));
  };
  try {
    if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`)
      return json(403, { error: 'Loopback host required' });
    if (req.method === 'GET' && req.url === '/api/state') return json(200, state);
    if (req.method === 'POST') {
      if (
        req.headers.origin !== `http://${req.headers.host}` ||
        !req.headers['content-type']?.startsWith('application/json')
      )
        return json(403, { error: 'Same origin JSON required' });
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 2000) return json(413, { error: 'Too large' });
      }
      const body = JSON.parse(raw || '{}');
      if (req.url === '/api/run') {
        if (state.running) return json(409, { error: 'Already running' });
        const count = body.ticks ?? 120;
        if (!Number.isInteger(count) || count < 1 || count > 120) return json(400, { error: '1–120 cycles' });
        void run(count);
        return json(202, { started: true });
      }
      if (req.url === '/api/stop') {
        stopRequested = true;
        return json(200, { stopping: true });
      }
      if (req.url === '/api/targets') {
        if (state.running) return json(409, { error: 'Pause before changing targets' });
        if (
          !Array.isArray(body.targets) ||
          body.targets.length !== 2 ||
          body.targets.some((x) => typeof x !== 'number' || x < 0.1 || x > 0.9)
        )
          return json(400, { error: 'Targets must be 10–90%' });
        state.targets = body.targets;
        return json(200, { targets: state.targets });
      }
    }
    if (req.method === 'GET' && /^\/api\/tx\/0x[0-9a-fA-F]{64}$/.test(req.url)) {
      const r = await chain.p.getTransactionReceipt(req.url.split('/').at(-1));
      return json(
        r ? 200 : 404,
        r
          ? {
              hash: r.hash,
              block: r.blockNumber,
              status: r.status,
              gasUsed: String(r.gasUsed),
              logs: r.logs.map((l) => ({ address: l.address, topics: l.topics, data: l.data })),
            }
          : { error: 'Not found' },
      );
    }
    const files = {
      '/': ['services/shared-market/index.html', 'text/html'],
      '/app.mjs': ['services/shared-market/app.mjs', 'text/javascript'],
      '/style.css': ['services/shared-market/style.css', 'text/css'],
      '/fly.png': ['services/full-apps/assets/cute-fly-v1.png', 'image/png'],
      '/garden.png': ['services/full-apps/assets/aqua-garden-v1.png', 'image/png'],
    };
    if (req.method === 'GET' && files[req.url]) {
      const [path, type] = files[req.url];
      res.writeHead(200, { 'Content-Type': type });
      res.end(await readFile(path));
      return;
    }
    json(404, { error: 'Not found' });
  } catch (e) {
    json(500, { error: e.message });
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Shared four-fly market: http://127.0.0.1:${port}`));
async function shutdown() {
  stopRequested = true;
  while (state.running) await new Promise((r) => setTimeout(r, 100));
  server.close();
  brain.close();
  chain.close();
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
