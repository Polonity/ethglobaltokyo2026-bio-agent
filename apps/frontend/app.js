import { Arena, WIDTH, HEIGHT, MODEL, random } from '../../packages/bio_agent/browser/arena.js';
import { ChainSession } from './chain.js';
const $ = (id) => document.getElementById(id);
const config = await fetch('/api/config').then((r) => (r.ok ? r.json() : { mode: 'browser' }));
const chainMode = config.mode === 'anvil';
const arena = new Arena(2026, { agentCount: chainMode ? 3 : 12 });
let chain = null;
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
function flyDrawing(c, x, y, angle, color, scale, time, resting = false) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);
  c.fillStyle = '#23302425';
  c.beginPath();
  c.ellipse(1, 4, 10, 5, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#344338';
  c.lineWidth = 1.05;
  for (const side of [-1, 1]) {
    for (const offset of [-3, 0, 3]) {
      c.beginPath();
      c.moveTo(offset, side * 2);
      c.lineTo(offset - 2, side * 5);
      c.lineTo(offset + (offset > 0 ? 3 : -4), side * 7);
      c.stroke();
    }
  }
  const flap = resting ? 0.35 : Math.sin(time * 0.065) * 0.22;
  c.fillStyle = '#f1f2ddaa';
  c.strokeStyle = '#64786377';
  c.lineWidth = 0.55;
  for (const side of [-1, 1]) {
    c.save();
    c.rotate(side * (0.5 + flap));
    c.beginPath();
    c.ellipse(-3, side * 5, 9, 3.8, side * 0.1, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  }
  c.fillStyle = '#394938';
  c.beginPath();
  c.ellipse(-3, 0, 6, 3.3, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#859172';
  c.lineWidth = 0.8;
  for (const i of [-5, -3, -1]) {
    c.beginPath();
    c.moveTo(i, -2.5);
    c.lineTo(i, 2.5);
    c.stroke();
  }
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(2, 0, 4.3, 3.8, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#29372d';
  c.beginPath();
  c.arc(6, 0, 3.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#bf6653';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.ellipse(7, side * 2, 1.8, 1.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = '#344338';
  c.beginPath();
  c.moveTo(8, -1);
  c.lineTo(11, -4);
  c.moveTo(8, 1);
  c.lineTo(11, 4);
  c.stroke();
  c.restore();
}
function draw(time) {
  const w = cssWidth,
    h = cssHeight;
  if (!w || !h) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.fillStyle = '#d7ddbf';
  ctx.fillRect(0, 0, w, h);
  const sx = w / WIDTH,
    sy = h / HEIGHT;
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
  for (let x = 1; x < WIDTH; x += 2)
    for (let y = 1; y < HEIGHT; y += 2) {
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
      pulse = (Math.sin(time * 0.002 + food.id) + 1) / 2;
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
    if (f.state === 'learning') return;
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
      Math.max(0.72, Math.min(1.05, w / 740)),
      time + i * 90,
      arena.paused || arena.finished,
    );
    ctx.font = `${i === arena.selected ? '600 ' : ''}7px monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#44543b';
    ctx.fillText(f.name, x, y - 17);
  });
}
function renderUI() {
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
      row.innerHTML = `<span class="rank-number">${String(i + 1).padStart(2, '0')}</span><span class="rank-dot" style="background:${f.color}"></span><span class="rank-name">${f.name}</span>${f.state === 'learning' ? '<span class="rank-tag">LEARNING</span>' : ''}<span class="rank-score">${f.score}</span>`;
      row.onclick = () => {
        selectFly(f.id);
      };
      return row;
    }),
  );
  const f = arena.flies[arena.selected];
  $('selected-name').textContent = f.name;
  $('selected-name').style.color = f.color;
  $('selected-version').textContent = `POLICY V${f.version}`;
  $('selected-state').textContent =
    f.state === 'learning' ? 'LEARNING' : (f.input?.mode || arena.world.mode).toUpperCase();
  $('selected-energy').textContent = `${Math.round(f.energy * 100)}%`;
  $('energy-bar').style.width = `${f.energy * 100}%`;
  $('decision').textContent =
    f.state === 'learning' ? `経験を再生中 / ${f.training.steps} updates` : f.lastDecision;
  $('sensors').textContent = f.observation
    ? `蜜: ${['東', '南東', '南', '南西', '西', '北西', '北', '北東'][f.observation.bearing]} / 近くの危険: ${f.observation.danger ? 'あり' : 'なし'}`
    : '感覚入力を待機中';
  if (chain) {
    $('chain-summary').textContent = chain.message;
    $('chain-stage').textContent = chain.stage.toUpperCase();
    $('chain-summary').dataset.stage = chain.stage;
    $('apply').disabled = !chain.ready || chain.busy;
    $('chain-target').textContent = `${f.name} / Agent #${f.id + 1}`;
    $('chain-status').textContent = f.chain
      ? `登録済み rev ${f.chain.revision} · ${f.input.mode} · 刺激 ${f.chain.status.stimulus / 100}% · 供給 ${f.chain.status.energy / 100}%`
      : '登録確認中';
    $('chain-tx').textContent = chain.lastTx?.transactionHash || f.chain?.cause.transactionHash || '—';
    $('chain-block').textContent = f.chain
      ? `Block ${f.chain.cause.blockNumber} / log ${f.chain.cause.logIndex} / tick ${(f.chain.appliedAt / 0.2).toFixed(0)}`
      : '—';
  }
  $('memory-count').textContent = f.memory.length;
  $('selected-score').textContent = f.score;
  $('train-selected').disabled = f.state === 'learning' || arena.finished;
  const sc = $('specimen').getContext('2d');
  sc.clearRect(0, 0, 400, 150);
  flyDrawing(sc, 200, 75, -0.4, f.color, 3.7, performance.now());
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
        el.innerHTML = `<div class="slot-heading"><i class="rank-dot" style="background:${f.color}"></i>${f.name}<span>${Math.floor((f.training.elapsed / 8) * 100)}%</span></div><p class="slot-detail">経験再生 + 練習環境 / ${f.training.steps} updates</p><div class="training-track"><i style="width:${(f.training.elapsed / 8) * 100}%"></i></div>`;
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
}
field.addEventListener('click', (e) => {
  if (arena.finished) return;
  const rect = field.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * WIDTH,
    y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
  const fly = arena.flies.find((f) => f.state !== 'learning' && Math.hypot(f.x - x, f.y - y) < 1.2);
  if (fly) selectFly(fly.id);
  else arena.addFood(x, y);
  renderUI();
});
$('pause').onclick = () => {
  arena.paused = !arena.paused;
  $('pause').innerHTML = arena.paused ? '▶ <span>Resume</span>' : 'Ⅱ <span>Pause</span>';
  $('pause').setAttribute('aria-label', arena.paused ? '再開' : '一時停止');
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
$('about').onclick = () => $('about-dialog').showModal();
$('close-about').onclick = $('about-ok').onclick = () => $('about-dialog').close();
$('export').onclick = () => {
  const result = {
    model: MODEL,
    seed: arena.seed,
    round: arena.round,
    time: arena.time,
    world: arena.world,
    source: chain ? 'anvil-31337' : 'browser-local',
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
  if (!document.hidden && !arena.paused && !arena.finished && (!chain || chain.ready)) {
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
  $('input-source-label').textContent = 'ANVIL 31337 · 選択中の1匹に送信';
  $('apply').innerHTML = 'コントラクトに刺激を送信 <span>↗</span>';
  $('intro-agent-count').textContent = '蜜を探す3つの個体。';
  $('world-input-title').textContent = 'このハエに刺激を。';
  $('world-input-help').textContent = '選択した個体の入力を Anvil に記録します。';
  $('about-chain').parentElement.textContent =
    'このローカル版では Anvil (31337) に登録した3匹が、IBioAgent の StatusUpdated ログを受信して個体別の入力を更新します。Runtime はブラウザー内の Q学習モデルです。MaleCNS 回路ではありません。';
  chain = new ChainSession(arena, config, renderUI);
  if (new URLSearchParams(location.search).has('test')) window.__chain = chain;
  await chain.sync();
  if (chain.ready) selectFly(0);
  setInterval(() => chain.sync(), 600);
}
renderUI();
requestAnimationFrame(frame);
