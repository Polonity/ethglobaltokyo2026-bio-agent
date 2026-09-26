import http from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { BrainClient } from '../../scripts/full/brain-client.mjs';
import { FullChain } from './chain.mjs';
import { rollout, trainApplication } from './experiment.mjs';
const port = Number(process.env.FULL_APPS_PORT || 8812),
  base = `http://127.0.0.1:${port}`;
const brain = new BrainClient(),
  chain = new FullChain();
const descriptor = await brain.call('describe');
await chain.setup(descriptor);
const tape = JSON.parse(await readFile('artifacts/full-apps/market-tape.json', 'utf8'));
await chain.validateTape(tape);
const apps = ['foraging', 'market', 'aqua'];
let current = null;
const latest = {},
  reports = {};
const cleanReport = (r) => ({
  app: r.app,
  variant: r.variant,
  before: r.before.rewards,
  after: r.after.rewards,
  test: r.test.rewards,
  adopted: r.adoption.map((a) => a.adopted),
  versions: r.test.lastDecision.map((a) => a.policyVersion),
  trainingMs: r.candidates.map((c) => c.trainingMs),
  neurons: r.test.neurons,
  inferenceMs: r.test.neuralMs / r.test.steps,
});
async function start({ app, variant, operation, stimulus = 0.5 }) {
  if (current) throw Error('An experiment is already running');
  const job = { app, variant, operation, cancelled: false, startedAt: Date.now() };
  current = job;
  const onProgress = async (p) => {
    latest[app] = {
      ...(latest[app]?.variant === variant ? latest[app] : {}),
      ...p,
      operation,
      startedAt: job.startedAt,
    };
    if (job.cancelled) throw Error('Stopped after a completed action');
  };
  (async () => {
    try {
      if (operation === 'learn') {
        const history = await brain.call('summary');
        const collected =
          history.experiences.find(
            (e) => e.app === app && e.variant === variant && e.agent === 0 && e.phase === 'collect',
          )?.decisions || 0;
        const collectionSeed = 51027 + Math.floor(collected / 200);
        const report = await trainApplication({
          client: brain,
          chain,
          tape: tape.events,
          collectionSeed,
          app,
          variant,
          onProgress,
        });
        reports[`${app}:${variant}`] = cleanReport(report);
        await mkdir('artifacts/full-apps', { recursive: true });
        await writeFile(
          `artifacts/full-apps/${app}-${variant}-latest.json`,
          JSON.stringify(report, null, 2) + '\n',
        );
        latest[app] = { ...latest[app], phase: 'complete', report: cleanReport(report) };
      } else {
        const result = await rollout({
          client: brain,
          chain,
          tape: tape.events,
          app,
          variant,
          phase: 'live',
          stimulus,
          seed: 20260926,
          steps: 64,
          offset: 820,
          onProgress,
        });
        latest[app] = {
          ...latest[app],
          phase: 'complete',
          result: { rewards: result.rewards, versions: result.lastDecision.map((d) => d.policyVersion) },
        };
      }
    } catch (error) {
      latest[app] = { ...latest[app], phase: job.cancelled ? 'stopped' : 'error', error: error.message };
    } finally {
      current = null;
    }
  })();
}
for (const app of apps)
  for (const variant of ['full', 'legacy']) {
    try {
      const report = JSON.parse(await readFile(`artifacts/full-apps/${app}-${variant}-latest.json`, 'utf8'));
      if (report.test.brainHash === descriptor.brainHash) reports[`${app}:${variant}`] = cleanReport(report);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
const stringify = (x) => JSON.stringify(x, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
const server = http.createServer(async (req, res) => {
  const reply = (status, value, type = 'application/json') => {
    res.writeHead(status, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(typeof value === 'string' ? value : stringify(value));
  };
  try {
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host))
      return reply(403, { error: 'Loopback host required' });
    const url = new URL(req.url, base);
    if (req.method === 'GET') {
      if (url.pathname === '/' || apps.some((a) => url.pathname === '/' + a))
        return reply(200, await readFile('services/full-apps/index.html', 'utf8'), 'text/html');
      if (url.pathname.startsWith('/models/')) return reply(200, descriptor);
      if (url.pathname === '/api/state')
        return reply(200, {
          busy: current ? { app: current.app, variant: current.variant, operation: current.operation } : null,
          latest,
          reports,
          descriptor,
          chain: chain.config,
        });
      if (url.pathname === '/api/history') return reply(200, await brain.call('summary'));
      if (/^\/tx\/0x[0-9a-f]{64}$/i.test(url.pathname))
        return reply(200, await chain.provider.getTransactionReceipt(url.pathname.slice(4)));
      return reply(404, { error: 'Not found' });
    }
    if (
      req.method !== 'POST' ||
      req.headers.origin !== `http://${req.headers.host}` ||
      req.headers['content-type']?.split(';')[0] !== 'application/json'
    )
      return reply(403, { error: 'Same-origin JSON required' });
    let text = '';
    for await (const chunk of req) {
      text += chunk;
      if (text.length > 4096) return reply(413, { error: 'Request too large' });
    }
    const data = JSON.parse(text || '{}');
    if (url.pathname === '/api/stop') {
      if (current) current.cancelled = true;
      return reply(200, { stopping: Boolean(current) });
    }
    if (
      url.pathname !== '/api/run' ||
      !apps.includes(data.app) ||
      !['full', 'legacy'].includes(data.variant) ||
      !['live', 'learn'].includes(data.operation) ||
      (data.stimulus !== undefined &&
        (typeof data.stimulus !== 'number' || data.stimulus < 0 || data.stimulus > 1))
    )
      return reply(400, { error: 'Invalid application operation' });
    if (current) return reply(409, { error: 'Another experiment is running' });
    await start(data);
    reply(202, { started: true });
  } catch (error) {
    reply(500, { error: error.message });
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Full MaleCNS applications: ${base}`));
const stop = async () => {
  if (current) current.cancelled = true;
  server.close();
  while (current) await new Promise((resolve) => setTimeout(resolve, 100));
  brain.close();
  chain.close();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
