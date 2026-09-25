import { policyStorage } from '../../packages/training/browser/readout.js';
import { verifyMaleAssets } from '../../packages/bio_agent/connectome/male-cns.js';
import { marketView } from '../../packages/shared/types/market-view.ts';
import { address, uint } from '../../packages/shared/types/primitives.ts';
import { PaperArena, ATOM } from '../../packages/bio_agent/runtime/paper-arena.js';
import { flyDrawing } from './fly-art.js';
import { translate as t, translateDOM, getPreference, setPreference } from './i18n.js';
const $ = (id) => document.getElementById(id);
const arena = new PaperArena();
const manifestBytes = await fetch('/models/market-malecns-reward-v2.json').then((r) => r.arrayBuffer());
let modelError = '';
try {
  await verifyMaleAssets(JSON.parse(new TextDecoder().decode(manifestBytes)));
} catch (e) {
  modelError = e.message;
}
const manifestHash =
  '0x' +
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', manifestBytes))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
const bodyModel = await fetch('/models/body-reference.json').then((r) => r.json());
const paperModel = await fetch('/models/paper-reference.json').then((r) => r.json());
let savedPolicies = null;
let meta = null,
  cursor = null,
  busy = false,
  paused = false,
  polling = false,
  online = false,
  lastPoll = 0;
const views = arena.flies.map((_, i) => ({ x: 190 + i * 300, y: 230 }));
const money = (n) => (Number(n) / Number(ATOM)).toFixed(3);
const api = async (path, options) => {
  const r = await fetch(path, options);
  const data = await r.json();
  if (!r.ok) {
    const error = new Error(data.error);
    error.reset = data.reset;
    throw error;
  }
  return data;
};
$('language').value = getPreference();
$('language').onchange = () => {
  setPreference($('language').value);
  render();
};
window.addEventListener('languagechange', () => render());
const quote = (side, amount, event) =>
  api(
    `/api/market/quote?direction=${side}&amount=${amount}&block=${event.blockNumber}&hash=${event.blockHash}`,
  );
async function poll() {
  if (modelError) {
    $('status').textContent = modelError;
    return;
  }
  if (polling || paused) return;
  polling = true;
  try {
    const suffix = cursor ? `?after=${cursor.blockNumber}&hash=${cursor.blockHash}` : '';
    const snapshot = await api('/api/market/snapshot' + suffix);
    if (meta && meta.pool !== snapshot.pool)
      throw new Error(t('市場の設定が変わりました。再読込してください。'));
    if (snapshot.modelHash !== manifestHash) throw new Error(t('モデルmanifestが登録内容と一致しません'));
    if (!meta) {
      try {
        savedPolicies = policyStorage(
          localStorage,
          `bioagent:${snapshot.registry}:${manifestHash}`,
          'market',
        );
        arena.flies.forEach((f) => savedPolicies.restore(f));
      } catch {}
    }
    meta = snapshot;
    for (const event of snapshot.events) await arena.consume(event, quote);
    cursor = { blockNumber: snapshot.blockNumber, blockHash: snapshot.blockHash };
    online = true;
    lastPoll = Date.now();
    $('status').textContent = t('Swapログを監視中。価格を動かして反応を見よう。');
  } catch (error) {
    online = false;
    $('status').textContent = error.reset
      ? t('チェーンの巻戻りを検出。再読込で新しい競争を開始してください。')
      : error.message;
  } finally {
    polling = false;
    render();
  }
}
async function move(direction) {
  if (busy || paused || modelError) return;
  busy = true;
  render();
  try {
    const tx = await api('/api/market/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    $('status').textContent = t('スワップ送信済み。ログの反映を待っています。');
    for (let n = 0; n < 30; n++) {
      await poll();
      if (arena.lastEvent?.transactionHash === tx.transactionHash) break;
      await new Promise((r) => setTimeout(r, 200));
    }
  } catch (error) {
    $('status').textContent = error.message;
  } finally {
    busy = false;
    render();
  }
}
$('up').onclick = () => move('up');
$('down').onclick = () => move('down');
$('sequence').onclick = async () => {
  $('sequence').disabled = true;
  for (const direction of [
    'up',
    'up',
    'down',
    'down',
    'up',
    'down',
    'up',
    'up',
    'down',
    'down',
    'up',
    'down',
  ]) {
    if (paused) break;
    await move(direction);
    await new Promise((r) => setTimeout(r, 900));
  }
  $('sequence').disabled = false;
};
$('pause').onclick = () => {
  paused = !paused;
  render();
};
$('export').onclick = () => {
  const payload = {
    schema: 'bioagent.market-demo-export.v1',
    mode: 'paper-anvil-uniswap-v3',
    metadata: meta,
    state: arena.snapshot(),
    limitation: 'Browser run; selection reward prediction, not held-out profitability',
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bioagent-market-run.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('source-tx').onclick = async (e) => {
  e.preventDefault();
  if (!arena.lastEvent) return;
  $('receipt').showModal();
  $('receipt-data').textContent = t('接続中…');
  try {
    $('receipt-data').textContent = JSON.stringify(
      await api(`/api/market/receipt?hash=${arena.lastEvent.transactionHash}`),
      null,
      2,
    );
  } catch (error) {
    $('receipt-data').textContent = error.message;
  }
};
$('close-receipt').onclick = () => $('receipt').close();
function label(f) {
  return f.state === 'learning'
    ? '？ 考えなおし中'
    : f.pending
      ? f.pending.side === 'buy'
        ? '買うタイミングを待つ'
        : '売るタイミングを待つ'
      : f.units > 0n
        ? 'じっと保有中'
        : '今は見送ろう';
}
function render() {
  if (online) arena.flies.forEach((f) => savedPolicies?.save(f));
  const typedViews = meta
    ? arena.flies.map((f) =>
        marketView(
          f,
          meta.registry
            ? {
                kind: 'evm',
                chainId: uint('31337'),
                registry: address(meta.registry),
                agentId: uint(String(f.id + 1)),
              }
            : { kind: 'local', sessionId: 'market-gui', agentId: String(f.id + 1) },
          { chainId: uint('31337'), address: address(meta.token0), decimals: 18 },
          { chainId: uint('31337'), address: address(meta.token1), decimals: 18 },
          bodyModel,
          arena.tick,
          arena.lastEvent?.timestampMs || 0,
          online,
          Date.now(),
          paperModel,
        ),
      )
    : [];
  if (new URLSearchParams(location.search).has('test')) window.__paperViews = typedViews;
  $('connection').textContent = t(online ? 'Anvil接続済み · 実Uniswap V3プール' : '接続を確認してください');
  $('pool').textContent = meta?.pool || '—';
  $('market-registry').textContent = meta?.registry || '—';
  $('block').textContent = cursor?.blockNumber || '—';
  const sqrt = arena.lastEvent ? Number(arena.lastEvent.sqrtPriceX96) / 2 ** 96 : 0;
  $('price').textContent = sqrt ? (sqrt * sqrt).toFixed(5) : '—';
  $('pause').textContent = t(paused ? '再開' : '一時停止');
  for (const id of ['up', 'down']) $(id).disabled = busy || paused || !online;
  const cards = arena.flies.map((f) => {
    const div = document.createElement('div');
    div.className = 'fly-card';
    div.textContent = `${f.name} · v${f.version}\n${t(label(f))}\n${t('満腹度')} ${Math.round(f.satiety * 100)}% · ${t('体格')} ${f.massRatio.toFixed(2)}×\n${t('現金')} ${money(f.cash)} · ${t('保有')} ${money(f.units)}`;
    div.style.whiteSpace = 'pre-line';
    return div;
  });
  $('cards').replaceChildren(...cards);
  $('ranking').replaceChildren(
    ...[...arena.flies]
      .sort((a, b) => (a.pnl > b.pnl ? -1 : a.pnl < b.pnl ? 1 : a.id - b.id))
      .map((f, i) => {
        const row = document.createElement('div');
        row.className = 'rank';
        const name = document.createElement('span'),
          value = document.createElement('b');
        name.textContent = `${i + 1}. ${f.name}`;
        const valuation = typedViews[f.id]?.applicationState.valuation;
        value.textContent =
          valuation?.kind === 'valued' ? `${f.pnl >= 0n ? '+' : ''}${money(valuation.netPnl.atoms)}` : '—';
        value.className = f.pnl >= 0n ? 'positive' : 'negative';
        row.append(name, value);
        return row;
      }),
  );
  const source = arena.lastEvent;
  $('source-tx').textContent = source?.transactionHash || '—';
  $('source-tx').href = source ? `/api/market/receipt?hash=${source.transactionHash}` : '#';
  $('observation').textContent = arena.flies
    .map(
      (f) =>
        `${f.name}: Δ ${f.deltaBps} bps\nMaleCNS=[${(f.neural || []).map((x) => x.toFixed(3)).join(', ')}]\nattention=${f.attention.toFixed(2)}\nstate=${f.lastKey || 'baseline'} → ${f.decision}`,
    )
    .join('\n\n');
  $('learning').replaceChildren(
    ...arena.flies.map((f) => {
      const p = document.createElement('p');
      p.textContent =
        `${f.name}: ` +
        (f.training
          ? `${t('学び直し中')} ${Math.ceil(f.training.remaining)}s`
          : f.report
            ? `${t(f.report.adopted ? '候補を採用' : '既存方策を維持')} · MSE ${f.report.before.toFixed(4)} → ${f.report.after.toFixed(4)}`
            : t('経験を蓄積中'));
      return p;
    }),
  );
  $('ledger').replaceChildren(
    ...arena.flies
      .flatMap((f) => f.trades.map((trade) => ({ ...trade, name: f.name })))
      .sort((a, b) => b.fillBlock - a.fillBlock)
      .slice(0, 15)
      .map((tr) => {
        const p = document.createElement('div');
        p.className = 'trade';
        p.textContent = `${tr.name} · PAPER ${tr.side.toUpperCase()} · ${money(tr.amountIn)} → ${money(tr.amountOut)}\n${t('判断')} #${tr.decisionBlock} → ${t('評価')} #${tr.fillBlock}`;
        return p;
      }),
  );
  translateDOM();
}
const canvas = $('field'),
  c = canvas.getContext('2d');
function draw(time) {
  c.clearRect(0, 0, 1000, 440);
  for (let i = 0; i < 3; i++) {
    const x = 190 + i * 300;
    c.fillStyle = ['#f3c8aa', '#c7dfbd', '#dbd0e9'][i];
    c.beginPath();
    c.arc(x, 155, 65, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6c7660';
    c.font = '14px sans-serif';
    c.textAlign = 'center';
    c.fillText(i === 1 ? 'TOKEN 0' : i === 0 ? 'TOKEN 1' : 'OBSERVE', x, 150);
  }
  arena.flies.forEach((f, i) => {
    const v = views[i];
    if (f.state !== 'learning' && !paused && online) {
      const target = f.units > 0n ? 410 + i * 90 : 170 + i * 300;
      v.x += (target - v.x) * 0.025;
      v.y += (260 + Math.sin(time / 1400 + i) * 25 - v.y) * 0.025;
    }
    flyDrawing(c, v.x, v.y, 0, f.color, 2.5, time + i * 110, f.state === 'learning' || paused, f);
    const text = t(label(f));
    c.font = '16px sans-serif';
    const w = c.measureText(text).width + 26;
    c.fillStyle = '#fffef8';
    c.beginPath();
    c.roundRect(v.x - w / 2, v.y - 100, w, 35, 15);
    c.fill();
    c.fillStyle = '#695d66';
    c.fillText(text, v.x, v.y - 77);
    c.fillText(f.name, v.x, v.y + 68);
  });
  requestAnimationFrame(draw);
}
setInterval(() => {
  if (!paused && !polling && online && Date.now() - lastPoll < 5000) {
    arena.advanceLearning(0.2);
    render();
  }
}, 200);
setInterval(poll, 1000);
await poll();
requestAnimationFrame(draw);
render();
if (new URLSearchParams(location.search).has('test')) window.__paper = arena;
