import { loadCircuitBundle, runCircuitTrial } from '../../packages/bio_agent/connectome/circuit.js';
import { getLanguage, getPreference, setPreference } from './i18n.js';
import { flyDrawing } from './fly-art.js';
const $ = (id) => document.getElementById(id);
const ja = {
  foraging: '採餌',
  market: '市場',
  lab: '回路の検証',
  language: '言語',
  title: '実測の接続から、行動へ。',
  intro: '実測データの7神経・19接続。人工的な仮定も見えるように。',
  boundary: '動力学・行動変換は人工設計。生物学的妥当性は未検証。',
  copies:
    '同じ部分グラフを使う3つの登録済み実行個体です。3匹の生物標本ではありません。既存2ゲームはsyntheticモデルです。',
  agent: '個体',
  stimulus: '刺激',
  send: 'オンチェーン刺激を送る',
  export: '証跡を保存',
  trial:
    '入力確認ごとにゼロ状態から32tickを実行。回路は固定で学習しません。activityとenergyの値は使いません。',
  graph: '実測の構造、人工モデルの活動',
  color: '色は計算された活動、矢印の太さは元の接続数。実測した神経活動ではありません。',
  comparison: '接続が行動に影響する？',
  contrast: '同じ刺激・動力学で、接続だけを全て除去した対照と比較。',
  intact: '実測トポロジー',
  removed: '接続を除去',
  interpretation:
    '差はこの接続への依存を示します。ランダム回路に対する優位性や生物学的な再現性は示しません。',
  agents: '3個体のオンチェーン入力と反応',
  provenance: '出典・変換・制約',
  assumptions:
    '選択した近傍だけを使用。全接続を興奮性として扱い、符号や神経動力学は推定しません。下行性神経への直接入力と行動への変換は人工設計です。',
  close: '閉じる',
  connecting: '接続とモデルを確認中…',
  ready: '接続済み · 登録descriptorと全ローカル成果物のhashを照合',
  sending: '送信済み · イベント反映待ち',
  advance: '進む',
  wait: '待つ',
  failed: '接続・照合に失敗。実行を停止しています。',
};
const en = Object.fromEntries(
  [...document.querySelectorAll('[data-key]')].map((e) => [e.dataset.key, e.textContent]),
);
Object.assign(en, {
  connecting: 'Connecting and verifying model…',
  ready: 'Connected · registered descriptor and local artifact hashes verified',
  sending: 'Submitted · waiting for event',
  advance: 'Advance',
  wait: 'Wait',
  failed: 'Connection or integrity check failed. Execution stopped.',
});
const t = (key) => (getLanguage() === 'ja' ? ja : en)[key] || key;
let bundle,
  config,
  cursor,
  online = false,
  busy = false,
  polling = false,
  error = '',
  stage = 'ready';
const records = new Map(),
  agents = new Map(),
  positions = [50, 380, 710];
const api = async (path, options) => {
  const r = await fetch('/api/circuit/' + path, options);
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || 'Request failed');
  return body;
};
function consume(agent) {
  const previous = agents.get(agent.agentId);
  if (previous && previous.status.revision === agent.status.revision) return;
  if (previous && BigInt(agent.status.revision) !== BigInt(previous.status.revision) + 1n)
    throw new Error('Revision gap');
  if (
    agent.cause.registryAddress.toLowerCase() !== config.registryAddress.toLowerCase() ||
    agent.cause.chainId !== '31337' ||
    !['1', '2', '3'].includes(agent.agentId)
  )
    throw new Error('Wrong source');
  const stimulus = agent.status.stimulus / 10000;
  records.set(agent.agentId, {
    agentId: agent.agentId,
    source: agent.cause,
    descriptorHash: bundle.descriptorHash,
    intact: runCircuitTrial(bundle.graph, stimulus),
    ablated: runCircuitTrial(bundle.graph, stimulus, 32, true),
  });
  agents.set(agent.agentId, agent);
}
async function poll() {
  if (polling) return;
  polling = true;
  try {
    const current = await api('config');
    if (
      config &&
      (current.registryAddress !== config.registryAddress || current.modelHash !== config.modelHash)
    )
      throw new Error('Deployment changed. Reload to start a new experiment.');
    config = current;
    if (!bundle) bundle = await loadCircuitBundle(fetch, config.modelHash);
    if (!cursor) {
      const snapshot = await api('snapshot');
      for (const agent of snapshot.agents) consume(agent);
      cursor = { blockNumber: snapshot.blockNumber, blockHash: snapshot.blockHash };
    } else {
      const batch = await api('events?after=' + cursor.blockNumber + '&hash=' + cursor.blockHash);
      for (const event of batch.events)
        if (event.name === 'BioAgentStatusUpdated')
          consume({ agentId: event.agentId, status: event.status, cause: event });
      cursor = { blockNumber: batch.blockNumber, blockHash: batch.blockHash };
    }
    online = true;
    error = '';
  } catch (e) {
    online = false;
    error = e.message;
  } finally {
    polling = false;
    render();
  }
}
$('language').value = getPreference();
$('language').onchange = () => {
  setPreference($('language').value);
  render();
};
window.addEventListener('languagechange', render);
$('agent').onchange = render;
$('stimulus').oninput = () => {
  $('amount').textContent = $('stimulus').value + '%';
};
$('send').onclick = async () => {
  if (busy || !online) return;
  busy = true;
  render();
  try {
    const id = $('agent').value;
    const tx = await api('status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: id,
        expectedRevision: agents.get(id).status.revision,
        activity: 0,
        energy: 5000,
        stimulus: Number($('stimulus').value) * 100,
      }),
    });
    stage = 'sending';
    render();
    for (let i = 0; i < 30; i++) {
      await poll();
      if (records.get(id)?.source.transactionHash === tx.transactionHash) break;
      await new Promise((r) => setTimeout(r, 200));
    }
    if (records.get(id)?.source.transactionHash !== tx.transactionHash)
      throw new Error('Input not applied; inspect receipt before retrying');
    stage = 'ready';
  } catch (e) {
    error = e.message;
    online = false;
  } finally {
    busy = false;
    render();
  }
};
$('export').onclick = () => {
  const payload = {
    schema: 'bioagent.circuit-evidence.v1',
    descriptor: bundle.descriptor,
    registry: config.registryAddress,
    chainId: '31337',
    records: [...records.values()],
    claims: { measuredConnectivity: true, biologicallyValidated: false, learning: false },
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bioagent-circuit-evidence.json';
  a.click();
  URL.revokeObjectURL(url);
};
$('tx').onclick = async (e) => {
  e.preventDefault();
  const record = records.get($('agent').value);
  if (!record) return;
  try {
    $('receipt-data').textContent = JSON.stringify(
      await api('receipt?hash=' + record.source.transactionHash),
      null,
      2,
    );
    $('receipt').showModal();
  } catch (e) {
    error = e.message;
    render();
  }
};
$('close').onclick = () => $('receipt').close();
function render() {
  document.documentElement.lang = getLanguage();
  for (const el of document.querySelectorAll('[data-key]')) el.textContent = t(el.dataset.key);
  $('status').textContent = online ? t(stage) : error ? t('failed') + ' ' + error : t('connecting');
  $('send').disabled = !online || busy;
  $('export').disabled = !records.size;
  if (!bundle) return;
  $('registry').textContent = config.registryAddress;
  $('descriptor').textContent = bundle.descriptorHash;
  $('credit').textContent = bundle.graph.attribution;
  $('source').textContent = JSON.stringify(
    {
      source: bundle.graph.sources,
      changes: bundle.graph.changes,
      assumptions: bundle.descriptor.origin.assumptions,
    },
    null,
    2,
  );
  const r = records.get($('agent').value);
  if (r) {
    $('response').textContent = r.intact.final.response.toFixed(6);
    $('action').textContent = t(r.intact.final.action);
    $('activity').value = r.intact.final.response;
    $('ablated').textContent = r.ablated.final.response.toFixed(6);
    $('tx').textContent = r.source.transactionHash;
    $('tx').href = '/api/circuit/receipt?hash=' + r.source.transactionHash;
    $('block').textContent = r.source.blockNumber;
    $('revision').textContent = agents.get(r.agentId).status.revision;
  }
  $('runs').replaceChildren(
    ...[...records.values()].map((r) => {
      const el = document.createElement('article');
      el.textContent =
        ['MOMO', 'SORA', 'KIKI'][Number(r.agentId) - 1] +
        ' · ' +
        Math.round(r.intact.stimulus * 100) +
        '% → ' +
        t(r.intact.final.action) +
        ' / ' +
        r.intact.final.response.toFixed(4);
      return el;
    }),
  );
  drawGraph(r);
}
function drawGraph(record) {
  const c = $('graph').getContext('2d'),
    g = bundle.graph;
  c.clearRect(0, 0, 760, 410);
  const xy = new Map(
    g.nodes.map((n, i) => [
      n.id,
      i === 0 ? [95, 200] : [310 + Math.floor((i - 1) / 3) * 235, 75 + ((i - 1) % 3) * 125],
    ]),
  );
  const max = Math.max(...g.edges.map((e) => e.count));
  for (const e of g.edges) {
    const [x, y] = xy.get(e.pre),
      [xx, yy] = xy.get(e.post);
    if (e.pre === e.post) continue;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(xx, yy);
    c.strokeStyle = '#8ca49566';
    c.lineWidth = 1 + (4 * e.count) / max;
    c.stroke();
    const a = Math.atan2(yy - y, xx - x),
      endX = xx - 30 * Math.cos(a),
      endY = yy - 30 * Math.sin(a);
    c.beginPath();
    c.moveTo(endX, endY);
    c.lineTo(endX - 9 * Math.cos(a - 0.45), endY - 9 * Math.sin(a - 0.45));
    c.lineTo(endX - 9 * Math.cos(a + 0.45), endY - 9 * Math.sin(a + 0.45));
    c.closePath();
    c.fillStyle = '#8ca495';
    c.fill();
  }
  g.nodes.forEach((n, i) => {
    const [x, y] = xy.get(n.id),
      activity = record?.intact.final.activity[i] || 0;
    c.beginPath();
    c.arc(x, y, 28, 0, Math.PI * 2);
    c.fillStyle = 'hsl(' + Math.round(100 - activity * 75) + ' 50% ' + (88 - activity * 25) + '%)';
    c.fill();
    c.fillStyle = '#48533f';
    c.textAlign = 'center';
    c.font = '12px sans-serif';
    c.fillText(n.id, x, y + 3);
    c.fillText(n.type, x, y + 46);
    c.fillText(activity.toFixed(3), x, y - 38);
  });
}
function animate(time) {
  const c = $('flies').getContext('2d');
  c.clearRect(0, 0, 1000, 160);
  for (let i = 0; i < 3; i++) {
    const r = records.get(String(i + 1)),
      response = r?.intact.final.response || 0,
      target = 50 + i * 330 + 200 * response;
    if (online) positions[i] += (target - positions[i]) * 0.07;
    flyDrawing(
      c,
      positions[i],
      88,
      0,
      ['#ed754a', '#76ae8f', '#b394d6'][i],
      2,
      time,
      !online || r?.intact.final.action !== 'advance',
    );
    c.fillStyle = '#657153';
    c.font = '14px sans-serif';
    c.textAlign = 'center';
    c.fillText(['MOMO', 'SORA', 'KIKI'][i], 50 + i * 330, 145);
  }
  requestAnimationFrame(animate);
}
if (new URL(location.href).searchParams.has('test'))
  window.__circuit = {
    snapshot: () => ({ online, error, config, records: [...records.values()] }),
  };
render();
await poll();
setInterval(poll, 1000);
requestAnimationFrame(animate);
