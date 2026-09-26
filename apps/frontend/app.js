import { policyStorage } from '../../packages/training/browser/readout.js';
import { MALE_CNS, verifyMaleAssets } from '../../packages/bio_agent/connectome/male-cns.js';
import { flyDrawing } from './fly-art.js';
import { address, uint } from '../../packages/shared/types/primitives.ts';
import { foragingView } from '../../packages/shared/types/foraging-view.ts';
import { Arena, WIDTH, HEIGHT, MODEL, random } from '../../packages/bio_agent/browser/arena.js';
import { ChainSession } from './chain.js';
import { transactionLink } from './explorer.js';
import { translate, translateDOM, getPreference, setPreference } from './i18n.js';
const $ = (id) => document.getElementById(id);
const urlLanguage = new URLSearchParams(location.search).get('lang');
if (['ja', 'en'].includes(urlLanguage)) setPreference(urlLanguage);
$('language').value = getPreference();
translateDOM();
const config = await fetch('/api/config').then((r) => {
  if (!r.ok) throw Error('Connection configuration unavailable; no offline fallback');
  return r.json();
});
const bodyModel = await fetch('/models/body-reference.json').then((r) => r.json());
const chainMode = ['anvil', 'sepolia'].includes(config.mode);
let modelError = '';
try {
  await verifyMaleAssets(await fetch(`/models/${MODEL}.json`).then((r) => r.json()));
} catch (e) {
  modelError = e.message;
  document.getElementById('intro-agent-count').textContent = e.message;
}
const arena = new Arena(2026, { agentCount: chainMode ? config.agentIds.length : 12, txFood: chainMode });
if (modelError) arena.paused = true;
let savedPolicies = null;
try {
  savedPolicies = policyStorage(
    localStorage,
    `bioagent:${config.registryAddress || 'browser'}:${config.modelHash || MODEL}`,
    'foraging',
  );
  arena.flies.forEach((f) => savedPolicies.restore(f));
} catch {}
let chain = null;
let receiptRequest = 0;
function bindTransactionLink(element, hash, event) {
  const link = transactionLink(config.chainId, hash);
  element.textContent = hash || '—';
  element.onclick = null;
  if (!link) {
    element.removeAttribute('href');
    return;
  }
  element.href = link.href;
  element.title = link.label;
  element.setAttribute('aria-label', `${link.label} ${hash}`);
  element.target = '_blank';
  element.rel = 'noopener noreferrer';
  if (link.local)
    element.onclick = async (e) => {
      e.preventDefault();
      const requestId = ++receiptRequest;
      const dialog = $('transaction-dialog');
      const display = (entries) => {
        $('transaction-data').replaceChildren(
          ...entries.flatMap(([key, value]) => {
            const dt = document.createElement('dt'),
              dd = document.createElement('dd');
            dt.textContent = key;
            dd.textContent = value;
            return [dt, dd];
          }),
        );
        translateDOM(dialog);
      };
      display([
        ['Tx hash', hash],
        ['状態', 'Anvilに問い合わせ中…'],
      ]);
      $('transaction-raw').href = link.href;
      if (!dialog.open) dialog.showModal();
      try {
        const response = await fetch(link.href);
        const receipt = await response.json();
        if (!response.ok) throw new Error(receipt.error || 'receiptを取得できません');
        if (requestId !== receiptRequest) return;
        const entries = [
          ['ネットワーク', 'Anvil / 31337（ローカル）'],
          ['Tx hash', hash],
          [
            '現在のreceipt',
            {
              pending: '未採掘、または現在のチェーンに存在しません',
              mined: '採掘成功',
              reverted: '失敗（revert）',
            }[receipt.stage] || receipt.stage,
          ],
          ['Block', receipt.blockNumber || '—'],
        ];
        if (event && receipt.stage === 'mined' && receipt.blockNumber === event.blockNumber)
          entries.push(
            ['対象', `Agent #${event.agentId}`],
            ['イベント', `${event.name} / log ${event.logIndex}`],
            [
              '入力',
              `revision ${event.status.revision} / 刺激 ${event.status.stimulus / 100}% / 供給 ${event.status.energy / 100}%`,
            ],
            ['送信者', event.writer],
            ['Registry', event.registryAddress],
          );
        display(entries);
      } catch (error) {
        if (requestId === receiptRequest)
          display([
            ['Tx hash', hash],
            ['取得エラー', error.message],
          ]);
      }
    };
}
function selectFly(id) {
  arena.selected = id;
  const input = arena.flies[id].input;
  if (chain && input) {
    pendingMode = input.mode;
    for (const name of ['energy', 'stimulus']) {
      $(name).value = Math.round(input[name] * 100);
      $(`${name}-value`).textContent = `${$(name).value}%`;
    }
    document.querySelectorAll('[data-mode]').forEach((b) => {
      b.classList.toggle('selected', b.dataset.mode === pendingMode);
      b.setAttribute('aria-pressed', String(b.dataset.mode === pendingMode));
    });
  }
  renderUI();
}
const field = $('field'),
  ctx = field.getContext('2d');
let speed = 1,
  pendingMode = 'forage',
  lastTime = performance.now(),
  accumulator = 0,
  uiTime = 0,
  lastEvent = -1;
const visual = arena.flies.map((f) => ({ x: f.x, y: f.y }));
const textureRng = random(737);
const grass = Array.from({ length: 85 }, () => ({
  x: textureRng() * WIDTH,
  y: textureRng() * HEIGHT,
  size: textureRng() + 0.6,
}));
let cssWidth = 0,
  cssHeight = 0,
  ratio = 1;
const resize = () => {
  const rect = field.getBoundingClientRect();
  cssWidth = rect.width;
  cssHeight = rect.height;
  ratio = Math.min(window.devicePixelRatio || 1, 2);
  field.width = Math.round(cssWidth * ratio);
  field.height = Math.round(cssHeight * ratio);
};
new ResizeObserver(resize).observe(field);
function thought(f) {
  if (f.state === 'learning') return { text: '？ どうしよう…', color: '#f1e4ff' };
  if (f.lastDecision.includes('危険')) return { text: '！ あぶない', color: '#ffe1d8' };
  if (f.lastDecision.includes('獲得')) return { text: '♡ やった！', color: '#fff0be' };
  if (f.lastDecision.includes('休息')) return { text: 'すやすや…', color: '#e5edf9' };
  if (f.satiety > 0.8) return { text: 'おなかいっぱい…', color: '#fff0be' };
  if (f.satiety < 0.15) return { text: 'ぐぅ…おなかすいた', color: '#fffdf4' };
  return { text: 'おやつ、どこ？', color: '#fffdf4' };
}
function bubble(c, x, y, f, boundWidth) {
  const mood = thought(f);
  mood.text = translate(mood.text);
  c.font = '600 11px sans-serif';
  const width = c.measureText(mood.text).width + 20;
  const left = Math.max(4, Math.min(boundWidth - width - 4, x - width / 2));
  const top = Math.max(5, y - 74);
  c.fillStyle = mood.color;
  c.strokeStyle = '#ac9cae';
  c.lineWidth = 1;
  c.beginPath();
  c.roundRect(left, top, width, 27, 12);
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(left + width / 2 - 4, top + 27);
  c.lineTo(left + width / 2, top + 32);
  c.lineTo(left + width / 2 + 4, top + 27);
  c.fill();
  c.stroke();
  c.fillStyle = '#62516b';
  c.textAlign = 'center';
  c.fillText(mood.text, left + width / 2, top + 18);
}
function draw(time) {
  const w = cssWidth,
    h = cssHeight;
  if (!w || !h) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = '#edf3dc';
  ctx.fillRect(0, 0, w, h);
  if (chain && !chain.ready) return;
  const fieldWidth = arena.world.width,
    fieldHeight = arena.world.height;
  const sx = w / fieldWidth,
    sy = h / fieldHeight;
  // Soft terrain, paths and sparse observation grid.
  for (const [x, y, rx, ry] of [
    [8, 6, 8, 5],
    [27, 17, 10, 6],
    [32, 3, 9, 5],
  ]) {
    ctx.fillStyle = '#b9c79c50';
    ctx.beginPath();
    ctx.ellipse(x * sx, y * sy, rx * sx, ry * sy, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#faf5d02d';
  ctx.lineWidth = 24;
  ctx.beginPath();
  ctx.moveTo(-10, h * 0.77);
  ctx.bezierCurveTo(w * 0.2, h * 0.6, w * 0.4, h * 0.2, w + 10, h * 0.35);
  ctx.stroke();
  ctx.fillStyle = '#7c8e6550';
  for (let x = 1; x < fieldWidth; x += 2)
    for (let y = 1; y < fieldHeight; y += 2) {
      ctx.beginPath();
      ctx.arc(x * sx, y * sy, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  ctx.strokeStyle = '#82946a60';
  ctx.lineWidth = 0.8;
  for (const g of grass) {
    const x = g.x * sx,
      y = g.y * sy;
    ctx.beginPath();
    ctx.moveTo(x - 3 * g.size, y);
    ctx.lineTo(x - 4 * g.size, y - 4 * g.size);
    ctx.moveTo(x, y + 1);
    ctx.lineTo(x, y - 5 * g.size);
    ctx.moveTo(x + 2 * g.size, y);
    ctx.lineTo(x + 4 * g.size, y - 3 * g.size);
    ctx.stroke();
  }
  for (const hazard of arena.world.hazards) {
    const x = hazard.x * sx,
      y = hazard.y * sy,
      r = hazard.radius * Math.min(sx, sy);
    ctx.fillStyle = '#c28b7740';
    ctx.strokeStyle = '#b7806e88';
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.ellipse(x, y, hazard.radius * sx, hazard.radius * sy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#aa7462';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', x, y + 4);
    ctx.font = '6px monospace';
    ctx.fillText('AVOID', x, y + r + 10);
  }
  for (const food of arena.world.foods) {
    const x = food.x * sx,
      y = food.y * sy,
      pulse = (Math.sin(time * 0.002 + food.x + food.y) + 1) / 2;
    ctx.strokeStyle = '#b69b4770';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, 13 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ece6a6';
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 4, 4, 3, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#b99840';
    ctx.beginPath();
    ctx.arc(x, y, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  arena.flies.forEach((f, i) => {
    visual[i].x += (f.x - visual[i].x) * 0.16;
    visual[i].y += (f.y - visual[i].y) * 0.16;
    if (f.state === 'learning') {
      visual[i].x = f.x;
      visual[i].y = f.y;
    }
    if (f.trail.length > 1) {
      ctx.strokeStyle = f.color + (i === arena.selected ? '90' : '40');
      ctx.lineWidth = 1;
      ctx.beginPath();
      f.trail.forEach((p, index) =>
        index ? ctx.lineTo(p.x * sx, p.y * sy) : ctx.moveTo(p.x * sx, p.y * sy),
      );
      ctx.stroke();
    }
    const x = visual[i].x * sx,
      y = visual[i].y * sy;
    if (i === arena.selected) {
      ctx.strokeStyle = '#53664588';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    flyDrawing(
      ctx,
      x,
      y,
      f.heading,
      f.color,
      Math.max(0.85, Math.min(1.5, w / 550)),
      time + i * 90,
      arena.paused || arena.finished || f.state === 'learning' || f.lastDecision.includes('休息'),
      f,
    );
    ctx.font = `${i === arena.selected ? '600 ' : ''}10px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#44543b';
    ctx.fillText(f.name, x, y + 29);
    if (chainMode || i === arena.selected || f.state === 'learning') bubble(ctx, x, y, f, w);
  });
}
function renderUI() {
  chain?.persistFood();
  if (chain) {
    document.body.dataset.ready = String(chain.ready);
    document.body.dataset.foodCount = String(arena.world.foods.length);
    document.body.dataset.foodEvents = String(arena.world.foodEvents.length);
    const source = arena.world.worldSource;
    $('environment-state').textContent = source
      ? `${arena.world.width} × ${arena.world.height} · ${translate('危険エリア')} ${arena.world.hazards.length} · nonce ${source.nonce}`
      : translate('環境TXを待っています');
    if (source) {
      bindTransactionLink($('environment-tx'), source.transactionHash);
      $('environment-tx').textContent = source.transactionHash.slice(0, 14) + '…';
    }
    $('food-provenance').replaceChildren();
    for (const event of arena.world.foodEvents.slice(-8).reverse()) {
      const row = document.createElement('p'),
        link = document.createElement('a');
      bindTransactionLink(link, event.source.transactionHash);
      link.textContent = `#${event.source.agentId} · ${event.source.transactionHash.slice(0, 12)}…`;
      row.append(link, document.createTextNode(event.consumed ? ' · collected' : ' · 1 food'));
      $('food-provenance').append(row);
    }
  }
  if (!modelError && (!chain || chain.ready)) arena.flies.forEach((f) => savedPolicies?.save(f));
  const learners = arena.flies.filter((f) => f.state === 'learning');
  const leader = arena.ranking()[0];
  $('arena-status').textContent =
    chain && !chain.ready
      ? 'チェーン接続を待っています'
      : arena.finished
        ? `${leader.name} が優勝！`
        : arena.paused
          ? 'みんな、ちょっと待ってね。'
          : learners.length
            ? `${learners.map((f) => f.name).join('・')} は学びなおし中`
            : 'おやつレース、開催中！';
  $('arena-story').textContent =
    chain && !chain.ready
      ? '接続が戻るまで競技と新しい送信を待機します。'
      : arena.finished
        ? '学んだことを引き継いで、次のラウンドへ。'
        : arena.paused
          ? '競技は一時停止中。チェーンの入力受信は続いています。'
          : learners.length
            ? 'その場で立ち止まって経験から練習中。評価を終えたら動き出します。'
            : `${leader.name} が ${leader.score} 個でリード。好きな子を選んで、刺激を届けよう。`;
  $('session-badge').textContent = chain
    ? `${config.networkName} ${chain.ready ? '接続中' : '未接続'} / ${config.chainId}`
    : 'チェーン未接続 · ブラウザーデモ';
  const remaining = Math.ceil(arena.duration - arena.time);
  $('timer').textContent =
    `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  $('time-progress').style.width = `${(remaining / arena.duration) * 100}%`;
  $('round-label').textContent = `ROUND ${String(arena.round).padStart(2, '0')}`;
  $('total-nectar').textContent = arena.flies.reduce((n, f) => n + f.score, 0);
  $('field-count').textContent = `${arena.flies.filter((f) => f.state === 'racing').length} agents active`;
  $('ranking').replaceChildren(
    ...arena.ranking().map((f, i) => {
      const row = document.createElement('button');
      row.className = `rank-row ${f.id === arena.selected ? 'selected' : ''}`;
      row.setAttribute('aria-label', `${f.name} を観察、${f.score} nectar`);
      row.setAttribute('aria-pressed', String(f.id === arena.selected));
      row.innerHTML = `<span class="rank-number">${String(i + 1).padStart(2, '0')}</span><span class="rank-dot" style="background:${f.color}"></span><span class="rank-name">${f.name}</span><span class="rank-tag">${f.state === 'learning' ? '学び中' : f.lastDecision.includes('休息') ? 'すやすや' : 'おやつ探し'}</span><span class="rank-score">${f.score}</span>`;
      row.onclick = () => {
        selectFly(f.id);
      };
      return row;
    }),
  );
  const f = arena.flies[arena.selected];
  $('selected-name').textContent = f.name;
  $('selected-name').style.color = '#665168';
  $('selected-version').textContent = `POLICY V${f.version}`;
  $('selected-state').textContent =
    f.state === 'learning' ? 'LEARNING' : (f.input?.mode || arena.world.mode).toUpperCase();
  $('selected-energy').textContent = `${Math.round(f.energy * 100)}%`;
  $('energy-bar').style.width = `${f.energy * 100}%`;
  const view = foragingView(
    arena,
    f,
    chainMode
      ? {
          kind: 'evm',
          chainId: uint(String(config.chainId)),
          registry: address(config.registryAddress),
          agentId: uint(String(f.id + 1)),
        }
      : { kind: 'local', sessionId: 'gui', agentId: String(f.id + 1) },
    bodyModel,
    Date.now(),
  );
  $('body-satiety').textContent = `${Math.round(view.body.satiety * 100)}%`;
  $('body-reserves').textContent = `${Math.round(view.body.reserves * 100)}%`;
  $('body-mass').textContent = `${view.body.massRatio.toFixed(2)}×`;
  $('body-encoded').textContent = f.observation?.encodedKey || '—';
  $('decision').textContent =
    f.state === 'learning' ? `経験を再生中 / ${f.training.steps} updates` : f.lastDecision;
  $('sensors').textContent = f.observation
    ? `蜜: ${['東', '南東', '南', '南西', '西', '北西', '北', '北東'][f.observation.bearing]} / 近くの危険: ${f.observation.danger ? 'あり' : 'なし'}`
    : '感覚入力を待機中';
  if (chain) {
    const stages = {
      connecting: '接続確認中',
      connected: '接続済み',
      submitting: '送信中',
      submitted: '採掘待ち',
      mined: '採掘済み',
      applied: '反映済み',
      offline: '接続待ち',
      error: '送信を確認してください',
    };
    $('chain-summary').textContent = chain.message;
    $('chain-stage').textContent = stages[chain.stage] || chain.stage;
    $('chain-panel').dataset.state = chain.ready ? 'online' : 'offline';
    $('chain-summary').dataset.stage = chain.stage;
    $('apply').disabled = !chain.ready || chain.busy;
    $('chain-target').textContent = `観察中：${f.name} / #${f.id + 1}`;
    $('chain-status').textContent = f.chain
      ? `${f.name} の登録入力 · rev ${f.chain.revision} · ${{ rest: '休息', explore: '探索', forage: '採餌' }[f.input.mode]} · 刺激 ${f.chain.status.stimulus / 100}% · 供給 ${f.chain.status.energy / 100}%`
      : '3匹の登録を確認しています';
    // Evidence always belongs to the selected agent, not a different last sender.
    bindTransactionLink($('chain-tx'), f.chain?.cause.transactionHash, f.chain?.cause);
    $('chain-block').textContent = f.chain
      ? `Block ${f.chain.cause.blockNumber} / log ${f.chain.cause.logIndex} / 適用tick ${(f.chain.appliedAt / 0.2).toFixed(0)}`
      : '—';
    const tx = chain.lastTx;
    $('tx-card').hidden = !tx && !chain.busy;
    $('tx-card-title').textContent = tx
      ? `${arena.flies[Number(tx.agentId) - 1].name} への刺激`
      : '取引を送信中…';
    $('tx-card-status').textContent = tx?.applied
      ? '✓ イベント受信 → ハエに反映済み'
      : chain.stage === 'error'
        ? '反映未確認。取引詳細を確認してください。'
        : tx
          ? 'ブロックへの記録・イベント反映を確認中'
          : 'Tx hashの発行を待っています';
    bindTransactionLink($('tx-card-hash'), tx?.transactionHash, tx?.event);
    $('tx-card-proof').textContent = tx?.event
      ? `Block ${tx.event.blockNumber} · rev ${tx.event.status.revision} · BioAgentStatusUpdated`
      : '送信しただけでは、ハエの入力は変わりません。';
    $('tx-card-network').textContent =
      String(config.chainId) === '31337'
        ? '↗ hashをクリックしてAnvilの取引詳細へ（公開Etherscanには未掲載）'
        : '↗ hashをクリックしてEtherscanで検証';
    const progress = tx?.applied ? 4 : chain.stage === 'mined' ? 2 : chain.stage === 'submitted' ? 1 : 0;
    document.querySelectorAll('.tx-journey li').forEach((el, i) => {
      el.classList.toggle('done', i < progress);
      el.classList.toggle('current', chain.busy && i === progress);
    });
    $('tx-context').textContent = tx
      ? `直近の送信先：${arena.flies[Number(tx.agentId) - 1].name} #${tx.agentId} · ${tx.applied ? 'イベント受信・反映を確認 ✓' : '反映未確認（送信成功だけでは動きを変えません）'}`
      : '1匹を選んで刺激を送ろう。ブロックに記録されると、その子に届きます。';
  }
  $('memory-count').textContent = f.memory.length;
  $('selected-score').textContent = f.score;
  $('train-selected').disabled = f.state === 'learning' || arena.finished;
  const sc = $('specimen').getContext('2d');
  sc.clearRect(0, 0, 400, 150);
  flyDrawing(
    sc,
    200,
    78,
    -0.4,
    f.color,
    3.3,
    performance.now(),
    f.state === 'learning' || f.lastDecision.includes('休息'),
    f,
  );
  const learning = arena.flies.filter((f) => f.state === 'learning');
  const recent = [...arena.flies]
    .filter((f) => f.lastReport && f.state !== 'learning')
    .sort((a, b) => b.lastTraining - a.lastTraining);
  const slots = learning.slice(0, 2).map((f) => ({ f, active: true }));
  for (const r of recent) {
    if (slots.length >= 2) break;
    slots.push({ f: r, active: false });
  }
  while (slots.length < 2) slots.push({ f: null });
  $('learning-slots').replaceChildren(
    ...slots.map(({ f, active }, i) => {
      const el = document.createElement('div');
      el.className = `learning-slot ${active ? 'active' : ''}`;
      if (!f) {
        el.innerHTML = `<div class="slot-heading"><span>◎</span> TRAINING POD ${String(i + 1).padStart(2, '0')}<span>STANDBY</span></div><p class="slot-detail">下位の個体が到着するまで待機中</p>`;
      } else if (active) {
        el.innerHTML = `<div class="slot-heading"><i class="rank-dot" style="background:${f.color}"></i>${f.name}<span>${Math.floor((f.training.steps / f.training.totalUpdates) * 100)}%</span></div><p class="slot-detail">経験再生 + 練習環境 / ${f.training.steps} updates</p><div class="training-track"><i style="width:${(f.training.steps / f.training.totalUpdates) * 100}%"></i></div>`;
      } else {
        const r = f.lastReport;
        el.innerHTML = `<div class="slot-heading"><i class="rank-dot" style="background:${f.color}"></i>${f.name}<span>${r.accepted ? 'POLICY UPDATED' : 'POLICY KEPT'}</span></div><p class="slot-detail">検証報酬 ${r.before.toFixed(1)} → ${r.after.toFixed(1)}<br>${r.accepted ? `v${f.version} で競争に復帰` : '改善なし。既存方策で復帰'}</p>`;
      }
      return el;
    }),
  );
  $('auto-indicator').textContent = arena.autoLearn ? 'ON' : 'OFF';
  if (arena.revision !== lastEvent) {
    lastEvent = arena.revision;
    $('events').replaceChildren(
      ...arena.events.slice(0, 5).map((e) => {
        const row = document.createElement('div');
        row.className = 'event-row';
        row.dataset.kind = e.kind;
        const time = document.createElement('time');
        time.textContent = `${Math.floor(e.time).toString().padStart(2, '0')}s`;
        const title = document.createElement('strong');
        title.textContent = e.title;
        const detail = document.createElement('span');
        detail.textContent = e.detail;
        row.append(time, title, detail);
        return row;
      }),
    );
  }
  $('round-end').hidden = !arena.finished;
  if (arena.finished) {
    const winner = arena.ranking()[0];
    $('winner').textContent = `${winner.name} WINS`;
    $('winner-detail').textContent =
      `${winner.score} nectar / ${arena.flies.reduce((n, f) => n + f.trainingCount, 0)} learning sessions`;
  }
  translateDOM();
}
field.addEventListener('click', (e) => {
  if (arena.finished) return;
  const rect = field.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * arena.world.width,
    y = ((e.clientY - rect.top) / rect.height) * arena.world.height;
  const fly = arena.flies.find((f) => Math.hypot(f.x - x, f.y - y) < 1.2);
  if (fly) selectFly(fly.id);
  else if (chain) {
    $('input-feedback').textContent =
      '餌は刺激TXの採掘後に追加されます。刺激を0より大きくして送信してください。';
  } else arena.addFood(x, y);
  renderUI();
});
$('pause').onclick = () => {
  arena.paused = !arena.paused;
  $('pause').innerHTML = arena.paused ? '▶ <span>Resume</span>' : 'Ⅱ <span>Pause</span>';
  $('pause').setAttribute('aria-label', arena.paused ? '再開' : '一時停止');
  renderUI();
};
$('speed').onclick = () => {
  speed = speed === 1 ? 2 : speed === 2 ? 4 : 1;
  $('speed').textContent = `${speed}×`;
};
for (const name of ['stimulus', 'energy'])
  $(name).oninput = () => {
    $(`${name}-value`).textContent = `${$(name).value}%`;
  };
for (const button of document.querySelectorAll('[data-mode]'))
  button.onclick = () => {
    pendingMode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach((b) => {
      b.classList.toggle('selected', b === button);
      b.setAttribute('aria-pressed', String(b === button));
    });
  };
$('apply').onclick = async () => {
  if (chain) {
    try {
      await chain.send(String(arena.selected + 1), {
        activity: ['rest', 'explore', 'forage'].indexOf(pendingMode),
        energy: Number($('energy').value) * 100,
        stimulus: Number($('stimulus').value) * 100,
      });
      $('input-feedback').textContent = 'イベント受信後、選択したハエに適用しました';
    } catch (error) {
      $('input-feedback').textContent = error.message;
    }
    renderUI();
    return;
  }
  arena.applyStatus({
    stimulus: Number($('stimulus').value) / 100,
    energy: Number($('energy').value) / 100,
    mode: pendingMode,
  });
  $('input-feedback').textContent = '刺激を適用しました';
  $('apply').innerHTML = '適用しました ✓';
  setTimeout(() => {
    $('apply').innerHTML = '刺激を適用する <span>↗</span>';
  }, 1200);
  renderUI();
};
$('train-selected').onclick = () => {
  arena.startTraining(arena.flies[arena.selected]);
  renderUI();
};
$('auto-learn').onchange = () => {
  arena.autoLearn = $('auto-learn').checked;
  renderUI();
};
$('next-agent').onclick = () => {
  selectFly((arena.selected + 1) % arena.flies.length);
};
$('next-round').onclick = () => {
  arena.nextRound();
  $('pause').innerHTML = 'Ⅱ <span>Pause</span>';
  $('pause').setAttribute('aria-label', '一時停止');
  renderUI();
};
$('close-transaction').onclick = () => {
  receiptRequest++;
  $('transaction-dialog').close();
};
$('about').onclick = () => $('about-dialog').showModal();
$('close-about').onclick = $('about-ok').onclick = () => $('about-dialog').close();
$('export').onclick = () => {
  const result = {
    model: MODEL,
    connectome: MALE_CNS,
    foodEvents: arena.world.foodEvents || [],
    seed: arena.seed,
    round: arena.round,
    time: arena.time,
    world: arena.world,
    source: chain ? `${config.mode}-${config.chainId}` : 'browser-local',
    chain: chain
      ? { registryAddress: config.registryAddress, cursor: chain.cursor, lastTx: chain.lastTx }
      : null,
    events: arena.events,
    agents: arena.flies.map((f) => ({
      id: f.id,
      name: f.name,
      score: f.score,
      version: f.version,
      q: f.q,
      experiences: f.memory,
      lastReport: f.lastReport,
      chain: f.chain,
    })),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `fly-lab-round-${arena.round}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
// Explicit diagnostic mode for repeatable browser acceptance tests; no network writes.
if (new URLSearchParams(location.search).has('test')) {
  window.__arena = arena;
  window.__chain = chain;
}
function frame(now) {
  const elapsed = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (!modelError && !document.hidden && !arena.paused && !arena.finished && (!chain || chain.ready)) {
    accumulator += elapsed * speed;
    while (accumulator >= 0.2) {
      arena.tick(0.2);
      accumulator -= 0.2;
    }
  }
  draw(now);
  if (now - uiTime > 250) {
    renderUI();
    uiTime = now;
  }
  requestAnimationFrame(frame);
}
if (chainMode) {
  document.body.classList.add('chain-mode');
  document.querySelector('.standings').append(document.querySelector('.control-panel'));
  $('about-mechanism').textContent =
    '3匹が蜜・危険・エネルギーから行動を選びます。18秒ごとに下位1匹が学習室に入り、経験を再生して方策を更新します。入力は選択した個体のコントラクト Status に記録されます。';
  $('chain-panel').hidden = false;
  $('chain-registry').textContent = config.registryAddress;
  $('input-source-label').textContent = `${config.networkName} ${config.chainId}`;
  $('network-label').textContent = `${config.networkName} / ${config.chainId}`;
  $('apply').innerHTML = 'コントラクトに刺激を送信 <span>↗</span>';
  $('intro-agent-count').textContent = '蜜を探す3つの個体。';
  $('world-input-title').textContent = 'この子に刺激を届けよう。';
  $('world-input-help').textContent =
    `${config.networkName} · ${translate('刺激TXで餌を1個追加。自動補充なし。')}`;
  $('about-chain').parentElement.textContent =
    `${config.networkName} / ${config.chainId} · ${translate('実測7神経・19接続。刺激TXで餌を追加し、行動選択を学習します。身体と動力学は人工設計です。')}`;
  chain = new ChainSession(arena, config, renderUI);
  if (new URLSearchParams(location.search).has('test')) window.__chain = chain;
  await chain.sync();
  if (chain.ready) selectFly(0);
  setInterval(() => chain.sync(), config.pollIntervalMs || 12000);
  $('food-source-panel').hidden = false;
  document.querySelector('.field-corner').textContent = translate('刺激TXで餌を1個追加。自動補充なし。');
  $('feed-selected').textContent = translate('刺激TXで餌を追加');
  if (config.walletMode === 'browser') {
    $('connect-wallet').hidden = false;
    $('connect-wallet').onclick = async () => {
      try {
        const w = await chain.connectWallet();
        $('connect-wallet').textContent = w.address.slice(0, 8) + '…';
      } catch (e) {
        chain.message = e.message;
        renderUI();
      }
    };
    window.ethereum?.on?.('accountsChanged', () => {
      chain.wallet = null;
    });
    window.ethereum?.on?.('chainChanged', () => {
      chain.wallet = null;
    });
  }
  if (!config.localApps)
    document
      .querySelectorAll('nav a[href="/market"],nav a[href="/circuit"],nav a[href="/aqua"]')
      .forEach((a) => (a.hidden = true));
}
$('language').onchange = () => {
  setPreference($('language').value);
  renderUI();
};
window.addEventListener('languagechange', () => {
  if (getPreference() === 'system') renderUI();
});
window.addEventListener('storage', (event) => {
  if (event.key === 'fly-lab.language') {
    setPreference(event.newValue);
    $('language').value = getPreference();
    renderUI();
  }
});
$('field').setAttribute(
  'aria-label',
  chainMode
    ? translate('刺激TXで餌を1個追加。自動補充なし。')
    : `蜜を競って集める${arena.flies.length}匹のハエ。クリックするとその場所に蜜を置けます。`,
);
renderUI();
requestAnimationFrame(frame);

$('feed-selected').onclick = async () => {
  const f = arena.flies[arena.selected];
  if (!chain) {
    arena.addFood(f.x, f.y);
    return;
  }
  try {
    await chain.send(String(f.id + 1), {
      activity: 2,
      energy: Math.round((f.input?.energy || 0.7) * 10000),
      stimulus: Math.round((f.input?.stimulus || 0.55) * 10000),
    });
  } catch (e) {
    chain.message = e.message;
    renderUI();
  }
};
