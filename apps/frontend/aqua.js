// Powered by Aqua — © Degensoft Ltd 2025.
import { getLanguage, getPreference, setPreference } from './i18n.js';
import { flyDrawing } from './fly-art.js';
import { sha256, validateGraph } from '../../packages/bio_agent/connectome/circuit.js';
import { decideAqua } from '../../packages/bio_agent/connectome/aqua-controller.js';
const $ = (id) => document.getElementById(id);
const en = {
  title: 'Tiny brains. Shared liquidity.',
  intro:
    'An onchain stimulus playground. Give a fly a risk signal. Watch its circuit respond—and its Aqua strategy change.',
  wallet: 'ONE SHARED MAKER WALLET',
  custody: 'TOKENS HELD BY AQUA',
  chain: 'LOCAL TEST CHAIN',
  brain: '01 / MEASURED STRUCTURE',
  graph: 'A circuit that changes the offer',
  legend:
    'Node light = computed activity. Edge width = measured connection count. This is an engineered rate model.',
  agent: 'Observe',
  stimulus: 'Synthetic risk stimulus',
  calm: 'Calm · 0%',
  uneasy: 'Uneasy · 40%',
  danger: 'Danger · 100%',
  send: 'Send stimulus → react → apply Aqua',
  source:
    'The slider is a synthetic input recorded in BioAgentStatus. No live market feed or mempool classifier.',
  liquidity: '02 / REAL AQUA TRANSACTIONS',
  strategies: 'Three flies. One wallet.',
  shared:
    'Virtual offers share the same assets; they are not additive reserves. Actual fills depend on wallet balance and allowance.',
  apply: 'Apply / retry current decision',
  train: 'Learn risk response → apply',
  fill: 'Test fill · 1 NECTAR',
  trail: 'Follow the transaction trail',
  gas: 'ship() and dock() are mined, gas-consuming transactions. No gasless cancellation claim.',
  provenance: 'Model origin, addresses & assumptions',
  limits:
    '7 measured neurons / 19 connections. Three sensitivity settings, one topology. Fixed measured topology; learned readout gain. Synthetic risk mapping, 1:1 test-token pricing; no whole-brain, MEV-detection, biological-fidelity or profit claim.',
  receipt: 'Transaction receipt',
  local: 'Local Anvil: no Etherscan entry. This receipt comes from the local chain.',
  close: 'Close',
  connected: 'Connected · verified model',
  loading: 'Connecting / checking artifacts…',
  working: 'Transaction in progress…',
  failed: 'Disconnected / verification failed',
  ship: 'Open for snacks!',
  cautious: 'Hmm… smaller bites.',
  dock: 'Too much! Taking shelter.',
  pending: 'Not applied',
  stale: 'Old input · fills blocked',
  offer: 'Virtual offer',
  spread: 'Spread',
  response: 'Response',
  ready: 'Current',
  block: 'Block',
  empty: 'Send a stimulus to start. Existing ship/dock transactions appear below.',
  applied: 'Confirmed',
  model: 'Artifact integrity checked',
};
const ja = {
  title: '小さな脳で、流動性を動かす。',
  intro: 'オンチェーンの刺激の箱庭。ハエに危険の刺激を送り、回路の反応とAqua戦略の変化を観察します。',
  wallet: '3匹が共有する1つのウォレット',
  custody: 'AQUAが保管するトークン',
  chain: 'ローカルテストチェーン',
  brain: '01 / 実測の接続構造',
  graph: '回路が反応すると、提示が変わる',
  legend: '光は計算上の活動、線の太さは実測接続数。動力学は人工設計です。',
  agent: '観察する個体',
  stimulus: '人工的な危険刺激',
  calm: '穏やか · 0%',
  uneasy: '気になる · 40%',
  danger: '危険 · 100%',
  send: '刺激を送る → 反応 → Aquaに反映',
  source: 'スライダー入力をBioAgentStatusへ記録。市場やmempoolを実測した危険度ではありません。',
  liquidity: '02 / 実際のAQUAトランザクション',
  strategies: '3匹のハエ。1つのウォレット。',
  shared: '仮想的な提示は同じ資産を共有し、準備金の合計ではありません。約定には実残高と承認が必要です。',
  apply: '現在の判断を反映 / 再試行',
  train: '危険への反応を学習 → 反映',
  fill: '試しに交換 · 1 NECTAR',
  trail: 'トランザクションをたどる',
  gas: 'ship()とdock()はガスを使うトランザクションです。署名だけのガスレス撤回ではありません。',
  provenance: 'モデルの出典・アドレス・仮定',
  limits:
    '実測7神経・19接続。同じ構造で感度が違う3個体。実測接続を固定し、行動変換の係数を学習。危険度変換と1:1のテスト価格は人工設計。全脳・MEV検出・生物学的再現・利益の実証ではありません。',
  receipt: 'トランザクションの記録',
  local: 'ローカルAnvilのためEtherscanにはありません。実際のローカルチェーンのreceiptを表示します。',
  close: '閉じる',
  connected: '接続済み · モデル照合済み',
  loading: '接続・モデル照合中…',
  working: 'トランザクション処理中…',
  failed: '接続・検証に失敗',
  ship: 'ごはん、どうぞ！',
  cautious: 'うーん…少しだけ。',
  dock: 'こわい！ひと休み。',
  pending: 'まだ未反映',
  stale: '古い入力 · 約定停止',
  offer: '仮想提示',
  spread: 'スプレッド',
  response: '応答',
  ready: '反映済み',
  block: 'ブロック',
  empty: '刺激を送ると始まります。既存のship/dockも下に表示します。',
  applied: '確認済み',
  model: 'データ整合性を確認済み',
};
let state = null,
  graph = null,
  descriptor = null,
  busy = false,
  online = false,
  error = '',
  selected = 1,
  transactions = [],
  animation = 0;
const tr = (k) => (getLanguage() === 'ja' ? ja : en)[k] || k;
const api = async (path, body) => {
  const r = await fetch(
    '/api/aqua/' + path,
    body
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {},
  );
  const j = await r.json();
  if (!r.ok) throw Error(j.error);
  return j;
};
async function verify(s) {
  const r = await fetch('/models/aqua/descriptor.json');
  if (!r.ok) throw Error('Missing descriptor');
  const b = await r.arrayBuffer();
  if ((await sha256(b)) !== s.config.modelHash) throw Error('Registered Aqua descriptor mismatch');
  descriptor = JSON.parse(new TextDecoder().decode(b));
  if (descriptor.schema !== 'bioagent.aqua-controller.v1') throw Error('Unknown model');
  for (const [key, ref] of Object.entries(descriptor.refs)) {
    if (!/^\/models\/aqua\/[a-z0-9.-]+$/.test(ref.uri)) throw Error('Invalid artifact');
    const r = await fetch(ref.uri);
    if (!r.ok) throw Error('Artifact missing');
    const bytes = await r.arrayBuffer();
    if ((await sha256(bytes)) !== ref.sha256) throw Error('Artifact digest mismatch');
    if (key === 'graph') graph = JSON.parse(new TextDecoder().decode(bytes));
  }
  validateGraph(graph);
}
async function refresh() {
  const s = await api('snapshot');
  if (!graph || s.config.modelHash !== state?.config.modelHash) await verify(s);
  for (const a of s.agents) {
    const d = decideAqua(graph, a.stimulus, a.id, a.policy);
    if (JSON.stringify(d) !== JSON.stringify(a.decision)) throw Error('Decision replay mismatch');
  }
  state = s;
  online = true;
  render();
}
function render() {
  document.documentElement.lang = getLanguage();
  document.querySelectorAll('[data-t]').forEach((el) => (el.textContent = tr(el.dataset.t)));
  $('status').textContent = tr(busy ? 'working' : online ? 'connected' : error ? 'failed' : 'loading');
  $('light').className = online ? 'online' : '';
  $('error').textContent = error;
  $('train').disabled = $('send').disabled = $('apply').disabled = busy || !online;
  $('fill').disabled = busy || !online || !state?.agents[selected - 1].active.some((s) => s.current);
  if (!state) return;
  $('block').textContent = tr('block') + ' ' + state.blockNumber;
  $('wallet').textContent = state.balances
    .map((b, i) => Number(b.maker).toFixed(2) + ' ' + ['NECTAR', 'POLLEN'][i])
    .join(' / ');
  $('custody').textContent = state.balances.map((b) => Number(b.aqua).toFixed(0)).join(' / ');
  const active = state.agents[selected - 1].decision;
  const learned = state.agents[selected - 1].policy;
  $('learning-report').textContent = learned.report
    ? `${getLanguage() === 'ja' ? '人工シナリオでの選択用MSE' : 'Synthetic curriculum selection MSE'}: ${learned.report.before.toFixed(6)} → ${learned.report.after.toFixed(6)} · v${learned.version} · ${learned.report.samples}/${learned.report.selectionSamples}`
    : getLanguage() === 'ja'
      ? '学習前の行動変換。実測接続は固定です。'
      : 'Initial readout. Measured connections remain fixed.';
  $('signal').textContent =
    `INPUT ${active.drive.toFixed(2)} → RESPONSE ${active.response.toFixed(4)} → ${active.action.toUpperCase()} · ABLATED ${active.control.final.response.toFixed(4)}`;
  $('flies').replaceChildren();
  for (const a of state.agents) {
    const el = document.createElement('article');
    el.className = 'fly' + (a.id === selected ? ' selected' : '');
    const current = a.active.find((s) => s.current),
      d = a.decision;
    el.innerHTML = `<div class="fly-top"><canvas width="180" height="164"></canvas><div><h3>${['MOMO', 'SORA', 'KIKI'][a.id - 1]}</h3><p class="bubble"></p></div></div><div class="meter"><span></span></div><div class="metrics"></div><div class="hash"></div>`;
    el.querySelector('.bubble').textContent = tr(d.action);
    el.querySelector('.meter span').style.width =
      (current ? Math.min(100, Number(current.balances[1])) : 0) + '%';
    el.querySelector('.metrics').textContent =
      `${tr('offer')}: ${current ? current.balances.map((x) => Number(x).toFixed(2)).join(' / ') : '0 / 0'} · ${tr('spread')}: ${current ? current.spreadBps : '—'} bps · ${tr('response')}: ${d.response.toFixed(4)} · policy v${a.policy.version} · gain ${a.policy.gain.toFixed(3)}`;
    el.querySelector('.hash').textContent = current
      ? `${tr('ready')} · ${current.strategyHash}`
      : a.active.length
        ? tr('stale')
        : d.action === 'dock'
          ? `DOCK · ${tr('applied')}`
          : tr('pending');
    el.dataset.agent = a.id;
    $('flies').append(el);
  }
  $('provenance').textContent = JSON.stringify(
    {
      descriptorHash: state.config.modelHash,
      descriptor,
      learning: state.agents.map((a) => ({ id: a.id, policy: a.policy, policyHash: a.policyHash })),
      biologicalSource: {
        dataset: graph.dataset,
        attribution: graph.attribution,
        license: graph.license,
        changes: graph.changes,
        sources: graph.sources,
      },
      config: state.config,
      maker: state.maker,
    },
    null,
    2,
  );
  const log = [...transactions];
  for (const a of state.agents) {
    if (!log.some((t) => t.transactionHash === a.source.transactionHash))
      log.push({ operation: 'stimulus', ...a.source });
  }
  for (const s of state.strategies) {
    if (!log.some((t) => t.transactionHash === s.transactionHash))
      log.push({ operation: 'ship', transactionHash: s.transactionHash, blockNumber: s.blockNumber });
    if (s.dockTransactionHash && !log.some((t) => t.transactionHash === s.dockTransactionHash))
      log.push({ operation: 'dock', transactionHash: s.dockTransactionHash, blockNumber: s.dockBlockNumber });
  }
  $('transactions').replaceChildren();
  if (!log.length) $('transactions').textContent = tr('empty');
  for (const t of log
    .slice()
    .sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0))
    .slice(0, 30)) {
    const row = document.createElement('div');
    row.className = 'tx';
    const tag = document.createElement('strong');
    tag.textContent = t.operation.toUpperCase();
    const b = document.createElement('button');
    b.textContent = t.transactionHash;
    b.onclick = () => showReceipt(t.transactionHash);
    const detail = document.createElement('span');
    detail.textContent = `${t.blockNumber ? '#' + t.blockNumber : ''} ${t.gasUsed ? 'gas ' + t.gasUsed : ''}`;
    row.append(tag, b, detail);
    $('transactions').append(row);
  }
}
async function showReceipt(hash) {
  try {
    $('receipt-data').textContent = JSON.stringify(await api('receipt?hash=' + hash), null, 2);
    $('receipt').showModal();
  } catch (e) {
    error = e.message;
    render();
  }
}
async function operate(kind) {
  if (busy || !online) return;
  busy = true;
  error = '';
  render();
  try {
    let a = state.agents[selected - 1];
    if (kind === 'train') {
      const result = await api('train', { agentId: selected, revision: a.revision });
      transactions.push(...result.transactions);
      await refresh();
      a = state.agents[selected - 1];
    }
    if (kind === 'send') {
      const tx = await api('stimulus', {
        agentId: selected,
        revision: a.revision,
        stimulus: Number($('stimulus').value) * 100,
      });
      transactions.push({ operation: 'stimulus', ...tx });
      await refresh();
      a = state.agents[selected - 1];
      animation = performance.now();
    }
    const result = await api(kind === 'fill' ? 'fill' : 'apply', { agentId: selected, revision: a.revision });
    if (kind === 'fill') transactions.push({ operation: 'fill', ...result });
    else transactions.push(...result.transactions);
    await refresh();
  } catch (e) {
    error = e.message;
    try {
      await refresh();
    } catch {
      online = false;
    }
  } finally {
    busy = false;
    render();
  }
}
function draw(now) {
  const c = $('brain').getContext('2d'),
    w = 720,
    h = 430;
  c.clearRect(0, 0, w, h);
  if (graph && state) {
    const d = state.agents[selected - 1].decision;
    const step = Math.min(31, Math.floor((now - animation) / 65));
    const values = d.trial.trace[Math.max(0, step)].activity;
    const positions = graph.nodes.map((n, i) =>
      i === 0
        ? [130, 215]
        : [390 + 125 * Math.cos(((i - 1) * Math.PI) / 3), 215 + 145 * Math.sin(((i - 1) * Math.PI) / 3)],
    );
    const index = new Map(graph.nodes.map((n, i) => [n.id, i]));
    for (const edge of graph.edges) {
      const i = index.get(edge.pre),
        j = index.get(edge.post),
        a = positions[i],
        b = positions[j];
      c.beginPath();
      c.moveTo(...a);
      c.lineTo(...b);
      c.strokeStyle = `rgba(28,129,108,${0.12 + values[i] * 0.8})`;
      c.lineWidth = 1 + (edge.count / Math.max(...graph.edges.map((e) => e.count))) * 5;
      c.stroke();
      const t = (now / 1600) % 1;
      c.beginPath();
      c.arc(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 2 + values[i] * 4, 0, Math.PI * 2);
      c.fillStyle = '#77bea0';
      c.fill();
    }
    graph.nodes.forEach((n, i) => {
      const [x, y] = positions[i];
      c.beginPath();
      c.arc(x, y, 24 + values[i] * 9, 0, Math.PI * 2);
      c.fillStyle = `hsl(${160 - values[i] * 80} 50% ${85 - values[i] * 40}%)`;
      c.fill();
      c.strokeStyle = '#307b66';
      c.lineWidth = 2;
      c.stroke();
      c.fillStyle = '#204a40';
      c.font = '12px monospace';
      c.textAlign = 'center';
      c.fillText(n.id, x, y + 49);
      c.fillText(values[i].toFixed(2), x, y + 4);
    });
    document.querySelectorAll('.fly').forEach((el) => {
      const id = Number(el.dataset.agent),
        canvas = el.querySelector('canvas'),
        ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 180, 164);
      const rest = state.agents[id - 1].decision.action === 'dock';
      flyDrawing(
        ctx,
        90,
        85 + (rest ? 0 : Math.sin(now / 700 + id) * 6),
        0,
        ['#f2adc5', '#acd3f1', '#e7ce82'][id - 1],
        3,
        now,
        rest,
      );
    });
  }
  requestAnimationFrame(draw);
}
$('language').value = getPreference();
$('language').onchange = (e) => {
  setPreference(e.target.value);
  render();
};
$('agent').onchange = (e) => {
  selected = Number(e.target.value);
  animation = performance.now();
  render();
};
$('stimulus').oninput = () => ($('level').textContent = $('stimulus').value + '%');
document.querySelectorAll('[data-level]').forEach(
  (b) =>
    (b.onclick = () => {
      $('stimulus').value = b.dataset.level;
      $('stimulus').oninput();
    }),
);
$('send').onclick = () => operate('send');
$('apply').onclick = () => operate('apply');
$('fill').onclick = () => operate('fill');
$('train').onclick = () => operate('train');
$('close').onclick = () => $('receipt').close();
window.__aqua = { snapshot: () => ({ state, busy, online, error, transactions }) };
render();
requestAnimationFrame(draw);
refresh().catch((e) => {
  error = e.message;
  online = false;
  render();
});
setInterval(() => {
  if (!busy)
    refresh().catch((e) => {
      error = e.message;
      online = false;
      render();
    });
}, 5000);
