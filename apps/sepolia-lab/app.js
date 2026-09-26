import { LearningBioAgent, ChainDecisionRunner } from '/packages/bioagent-framework/src/index.js';
import { ForagingBackend } from '/packages/bioagent-framework/src/adapters.js';
import { neuralSignal } from '/packages/bio_agent/connectome/male-cns.js';
import graph from '/packages/bio_agent/connectome/male-cns-slice.json' with { type: 'json' };
import { EvmBioAgentSource, readProvider, connectWallet, sendStatus, registerAgent } from './chain.js';

const $ = (id) => document.getElementById(id);
const en = {
  connect: 'Connect wallet',
  title: 'On-chain inputs. A fly in motion.',
  'video-scope':
    'Submission video: Anvil + full neuron population. This public page: Sepolia + the seven-neuron subgraph.',
  lead: 'Run a reduced connectome in your browser. Trace its inputs to Sepolia and test how learning changes its behavior.',
  flow1: '01 Sepolia state',
  flow2: '02 7 neurons · 19 edges',
  flow3: '03 Behavior & learning',
  browser: 'BROWSER RUNTIME · GAS FREE',
  arena: 'Foraging agent',
  action: 'Action',
  food: 'Food collected',
  energy: 'Body energy',
  policy: 'Policy',
  legend:
    'Green: food / Red: obstacles. Body and environment are simulated. Sepolia inputs refresh about every 12 seconds.',
  graphnote:
    'A subgraph extracted from measured data. Connections stay frozen; learning adjusts just three action readout weights.',
  chain: 'VERIFIED INPUT · ETHEREUM SEPOLIA',
  input: 'On-chain input',
  load: 'Load',
  refresh: 'Refresh',
  revision: 'Revision',
  block: 'Observed block',
  owner: 'Owner',
  depth:
    'Latest block; 0 additional confirmations. A trusted RPC observation, not a state proof. Execution pauses when input is over 120 seconds old.',
  change: 'Change the input',
  walletnote: 'No wallet needed to watch. Register your own agent to change its input using Sepolia ETH.',
  register: 'Register my BioAgent',
  mode: 'Activity mode',
  rest: 'Rest',
  explore: 'Explore',
  forage: 'Forage',
  supply: 'Environment energy supply (0–100)',
  stimulus: 'Stimulus (0–100)',
  send: 'Send to Sepolia',
  writes:
    'Only registration and input updates are written on-chain. Behavior inputs change after inclusion in a block.',
  'learn-title': 'Test the effect of learning, here.',
  'learn-body':
    'Compare on scenarios held out from training. Adopt only if reward, food and contact criteria pass. Final body energy is shown as a tradeoff.',
  learn: 'Train & compare · no gas',
  export: 'Save decision evidence',
  'learn-empty': 'The learned policy is saved in this browser. It is not written on-chain.',
  limits:
    'This is not a full-brain simulation. Biological cognition, lower power use than LLMs, and trading profitability are unproven. This demo connects the Registry; it does not execute Aqua / Uniswap trades.',
  registry: 'View Registry ↗',
  model: 'Model, sources & file hashes ↗',
  deployment: 'Deployment record ↗',
};
const ja = Object.fromEntries(
  [...document.querySelectorAll('[data-i18n]')].map((el) => [el.dataset.i18n, el.textContent]),
);
let language =
  new URL(location.href).searchParams.get('lang') || localStorage.getItem('sepolia-language') || 'ja';
if (!['ja', 'en'].includes(language)) language = 'ja';
const t = (a, b) => (language === 'ja' ? a : b);
let config,
  provider,
  source,
  agent,
  runner,
  input,
  lastDecision,
  wallet,
  selectedId,
  evaluation,
  busy = false,
  polling = false,
  ticking = false,
  generation = 0;
const short = (value) => (value ? `${value.slice(0, 8)}…${value.slice(-6)}` : '—');
const message = (value) => {
  $('notice').textContent = value;
};
const error = (e) => {
  message(t('処理を完了できません: ', 'Could not complete: ') + (e.shortMessage || e.message));
};
const storageKey = () =>
  `sepolia-policy:${config.chainId}:${config.registryAddress.toLowerCase()}:${selectedId}`;
function translate() {
  document.documentElement.lang = language;
  for (const el of document.querySelectorAll('[data-i18n]'))
    el.textContent = (language === 'ja' ? ja : en)[el.dataset.i18n];
  $('language').textContent = language === 'ja' ? 'English' : '日本語';
  if (input) renderInput();
  if (evaluation) renderEvaluation();
  renderButtons();
}
$('language').onclick = () => {
  language = language === 'ja' ? 'en' : 'ja';
  localStorage.setItem('sepolia-language', language);
  translate();
};
function renderButtons() {
  $('connect').textContent = wallet ? short(wallet.address) : t('ウォレット接続', 'Connect wallet');
  $('connect').disabled = busy;
  $('register').disabled = busy || !wallet || !config?.registryAddress;
  $('send').disabled = busy || !wallet || !input || wallet.address.toLowerCase() !== input.owner;
  $('learn').disabled = busy || !lastDecision;
  $('export').disabled = busy || !lastDecision;
  $('load').disabled = busy;
  $('refresh').disabled = busy;
}
function renderInput() {
  $('revision').textContent = input.status.revision;
  $('block').textContent = input.block.number.toLocaleString();
  $('block').href = `https://sepolia.etherscan.io/block/${input.block.number}`;
  $('owner').textContent = short(input.owner);
  $('owner').title = input.owner;
  const modes = language === 'ja' ? ['休息', '探索', '採餌'] : ['Rest', 'Explore', 'Forage'];
  $('observed').textContent =
    `${modes[input.status.activity]}  ·  ${t('環境供給', 'Supply')} ${input.status.energy / 100}%\n${t('刺激', 'Stimulus')} ${input.status.stimulus / 100}%  ·  chain ${input.chainId}`;
  document.body.dataset.revision = input.status.revision;
  document.body.dataset.agentId = input.agentId;
  renderButtons();
}
async function loadAgent(id) {
  if (!/^[1-9]\d{0,30}$/.test(String(id))) throw Error('Invalid agent ID');
  const token = ++generation;
  runner = null;
  agent = null;
  input = null;
  lastDecision = null;
  evaluation = null;
  $('live').textContent = 'CONNECTING';
  document.body.dataset.ready = 'false';
  renderButtons();
  const nextSource = new EvmBioAgentSource(provider, {
    chainId: config.chainId,
    registry: config.registryAddress,
    agentId: id,
    confirmations: 0,
  });
  const nextInput = await nextSource.read();
  if (token !== generation) return;
  const nextAgent = new LearningBioAgent({ id: String(id), owner: nextInput.owner }, new ForagingBackend());
  const nextRunner = new ChainDecisionRunner(nextAgent, {
    chainId: config.chainId,
    registry: config.registryAddress,
    agentId: id,
    minConfirmations: 0,
  });
  nextRunner.observe(nextInput);
  source = nextSource;
  agent = nextAgent;
  runner = nextRunner;
  input = nextInput;
  selectedId = String(id);
  let restored = false;
  try {
    const saved = localStorage.getItem(storageKey());
    if (saved) {
      await agent.restorePolicy(JSON.parse(saved));
      restored = true;
    }
  } catch {
    message(
      t(
        '保存済みポリシーが不適合のため初期値を使用します。',
        'Saved policy is incompatible; using initial weights.',
      ),
    );
  }
  if (token !== generation) return;
  $('agent-id').value = id;
  $('activity').value = String(input.status.activity);
  $('supply').value = input.status.energy / 100;
  $('stimulus').value = input.status.stimulus / 100;
  const url = new URL(location.href);
  url.searchParams.set('agent', id);
  history.replaceState(null, '', url);
  $('learning-result').textContent = restored
    ? t('保存したポリシーを復元しました。', 'Restored the saved policy.')
    : (language === 'ja' ? ja : en)['learn-empty'];
  renderInput();
  await tick();
  message(
    t(
      'Sepoliaの実データを受信しました。ブラウザー内で実行しています。',
      'Live Sepolia state received. The connectome is running in your browser.',
    ),
  );
}
async function poll() {
  if (polling || !source || !runner) return;
  polling = true;
  const token = generation,
    currentSource = source,
    currentRunner = runner;
  try {
    const fresh = await currentSource.read();
    if (token !== generation) return;
    currentRunner.observe(fresh);
    input = fresh;
    renderInput();
  } catch (e) {
    if (token === generation) error(e);
  } finally {
    polling = false;
  }
}
async function tick() {
  if (ticking || busy || !runner) return;
  ticking = true;
  const token = generation;
  try {
    const result = await runner.decide();
    if (token !== generation) return;
    lastDecision = result;
    const state = agent.snapshot();
    $('live').textContent = 'LIVE · SEPOLIA';
    document.body.dataset.ready = 'true';
    $('action').textContent =
      result.decision.action === 8
        ? t('休息', 'Rest')
        : ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'][result.decision.action];
    $('food').textContent = state.runtime.metrics.food;
    $('body-energy').textContent = `${Math.round(state.runtime.actor.energy * 100)}%`;
    $('policy').textContent = `v${state.version}`;
    document.body.dataset.policy = String(state.version);
    document.body.dataset.ticks = String(Math.round(state.runtime.time * 5));
    drawArena(state.runtime);
    drawGraph();
    renderButtons();
  } catch (e) {
    $('live').textContent = 'PAUSED';
    document.body.dataset.ready = 'false';
    error(e);
  } finally {
    ticking = false;
  }
}
function drawArena(s) {
  const canvas = $('arena'),
    c = canvas.getContext('2d'),
    scale = canvas.width / 36;
  c.fillStyle = '#14241f';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.strokeStyle = '#22372a';
  c.lineWidth = 0.5;
  for (let x = 0; x < 36; x += 2) {
    c.beginPath();
    c.moveTo(x * scale, 0);
    c.lineTo(x * scale, canvas.height);
    c.stroke();
  }
  for (let y = 0; y < 22; y += 2) {
    c.beginPath();
    c.moveTo(0, y * scale);
    c.lineTo(canvas.width, y * scale);
    c.stroke();
  }
  for (const h of s.world.hazards) {
    c.fillStyle = '#683c3d';
    c.strokeStyle = '#a46160';
    c.beginPath();
    c.arc(h.x * scale, h.y * scale, h.radius * scale, 0, Math.PI * 2);
    c.fill();
    c.stroke();
  }
  for (const f of s.world.foods) {
    c.fillStyle = '#bef082';
    c.beginPath();
    c.arc(f.x * scale, f.y * scale, 6, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#688d4a';
    c.beginPath();
    c.arc(f.x * scale, f.y * scale, 11, 0, Math.PI * 2);
    c.stroke();
  }
  const a = s.actor;
  c.save();
  c.translate(a.x * scale, a.y * scale);
  c.rotate(a.heading);
  c.fillStyle = '#b2c7d8bb';
  for (const side of [-1, 1]) {
    c.beginPath();
    c.ellipse(-4, side * 9, 14, 6, side * 0.45, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = '#f2d98c';
  c.lineWidth = 2;
  for (const side of [-1, 1])
    for (const x of [-7, 0, 7]) {
      c.beginPath();
      c.moveTo(x, side * 3);
      c.lineTo(x - 5, side * 15);
      c.stroke();
    }
  c.fillStyle = '#e8c772';
  c.beginPath();
  c.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#df8d63';
  c.beginPath();
  c.arc(12, 0, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
function drawGraph() {
  if (!input) return;
  const c = $('graph').getContext('2d');
  c.clearRect(0, 0, 700, 220);
  const positions = graph.nodes.map((_, i) =>
    i === 0 ? [105, 110] : [250 + ((i - 1) % 3) * 160, Math.floor((i - 1) / 3) * 110 + 55],
  );
  const indices = new Map(graph.nodes.map((n, i) => [String(n.id), i]));
  for (const edge of graph.edges) {
    const a = positions[indices.get(String(edge.pre))],
      b = positions[indices.get(String(edge.post))];
    if (!a || !b) continue;
    c.strokeStyle = '#4c704b';
    c.lineWidth = 1;
    c.beginPath();
    if (a === b) {
      c.arc(a[0], a[1] - 19, 13, 0, Math.PI * 2);
    } else {
      c.moveTo(...a);
      c.lineTo(...b);
    }
    c.stroke();
  }
  const response = neuralSignal(input.status.stimulus / 10000);
  graph.nodes.forEach((node, i) => {
    const [x, y] = positions[i];
    c.fillStyle = `hsl(90 45% ${30 + Math.min(1, response.activity[i] || 0) * 40}%)`;
    c.beginPath();
    c.arc(x, y, 17, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#c6dbc0';
    c.font = '16px system-ui';
    c.textAlign = 'center';
    c.fillText(node.type, x, y + 35);
  });
}
function renderEvaluation() {
  const before = evaluation.before[0].metrics,
    after = evaluation.after[0].metrics;
  const box = $('learning-result');
  box.replaceChildren();
  const p = document.createElement('p');
  p.textContent = evaluation.accepted
    ? t('基準を満たしたため採用しました。', 'Criteria passed: candidate adopted.')
    : t('基準を満たさず、現在のポリシーを維持しました。', 'Criteria failed: current policy retained.');
  box.append(p);
  const table = document.createElement('table');
  for (const row of [
    [t('選択用4シナリオ', '4 selection scenarios'), t('学習前', 'Before'), t('候補', 'Candidate')],
    [t('報酬', 'Reward'), before.reward.toFixed(2), after.reward.toFixed(2)],
    [t('餌', 'Food'), before.food.toFixed(2), after.food.toFixed(2)],
    [t('接触', 'Contacts'), before.contacts.toFixed(2), after.contacts.toFixed(2)],
    [
      t('最終エネルギー', 'Final energy'),
      `${(before.finalEnergy * 100).toFixed(1)}%`,
      `${(after.finalEnergy * 100).toFixed(1)}%`,
    ],
  ]) {
    const tr = document.createElement('tr');
    for (const v of row) {
      const td = document.createElement('td');
      td.textContent = v;
      tr.append(td);
    }
    table.append(tr);
  }
  box.append(table);
  const note = document.createElement('p');
  note.textContent = t(
    '合成環境・選択用データでの結果です。独立テストでの一般化や、生物由来の優位性を示すものではありません。',
    'Synthetic selection results, not independent generalization evidence or proof of a biological advantage.',
  );
  box.append(note);
}
async function train() {
  // A short pause lets the browser show the busy state before bounded synchronous training.
  message(t('学習と評価を実行中…', 'Training and evaluating…'));
  await new Promise((r) => setTimeout(r, 30));
  const profiles = [
    {
      name: 'current-chain-profile',
      energy: input.status.energy / 10000,
      stimulus: input.status.stimulus / 10000,
      mode: ['rest', 'explore', 'forage'][input.status.activity],
    },
  ];
  agent.train({ seed: 6217, seeds: [101, 102, 103, 104], profiles, ticks: 300, trials: 16 });
  agent.evaluate({ seeds: [201, 202, 203, 204], profiles, ticks: 300 });
  evaluation = agent.adopt();
  localStorage.setItem(storageKey(), JSON.stringify(await agent.exportPolicy()));
  renderEvaluation();
  message(
    t(
      '学習と比較が完了しました。結果とエネルギーのトレードオフを確認してください。',
      'Training and comparison complete. Review the result and energy tradeoff.',
    ),
  );
}
async function run(fn) {
  if (busy) return;
  busy = true;
  renderButtons();
  try {
    await fn();
  } catch (e) {
    error(e);
  } finally {
    busy = false;
    renderButtons();
  }
}
function submitted(hash) {
  $('transaction').hidden = false;
  $('transaction').href = `https://sepolia.etherscan.io/tx/${hash}`;
  $('transaction').textContent = `TX: ${hash}`;
  message(t('送信済み。ブロックへの取り込みを待っています…', 'Submitted. Waiting for block inclusion…'));
}
$('connect').onclick = () =>
  run(async () => {
    wallet = await connectWallet(window.ethereum);
    message(t('Sepoliaウォレットに接続しました。', 'Sepolia wallet connected.'));
  });
$('register').onclick = () =>
  run(async () => {
    const result = await registerAgent({ ethereum: window.ethereum, wallet, config, onSubmitted: submitted });
    await loadAgent(result.agentId);
  });
$('status-form').onsubmit = (e) => {
  e.preventDefault();
  run(async () => {
    const status = {
      activity: Number($('activity').value),
      energy: Number($('supply').value) * 100,
      stimulus: Number($('stimulus').value) * 100,
    };
    await sendStatus({
      ethereum: window.ethereum,
      wallet,
      config,
      agentId: selectedId,
      status,
      revision: input.status.revision,
      registeredOwner: input.owner,
      onSubmitted: submitted,
    });
    await poll();
    message(t('入力の変更をSepoliaで確認しました。', 'Input update confirmed on Sepolia.'));
  });
};
$('load').onclick = () => run(() => loadAgent($('agent-id').value));
$('refresh').onclick = () => run(() => (runner ? poll() : loadAgent($('agent-id').value)));
$('learn').onclick = () => run(train);
$('export').onclick = () =>
  run(async () => {
    const record = {
      deployment: config,
      decision: lastDecision,
      policy: await agent.exportPolicy(),
      learning: evaluation,
      exportedAt: new Date().toISOString(),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `bioagent-sepolia-${selectedId}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
for (const event of ['accountsChanged', 'chainChanged'])
  window.ethereum?.on?.(event, () => {
    wallet = null;
    renderButtons();
    message(t('ウォレットが変更されました。再接続してください。', 'Wallet changed. Reconnect to continue.'));
  });
translate();
try {
  config = await (await fetch('/config.json')).json();
  if (!config.registryAddress) throw Error(t('Registryの配置待ちです。', 'Registry deployment is pending.'));
  provider = readProvider();
  $('registry').href = `https://sepolia.etherscan.io/address/${config.registryAddress}`;
  $('agent-id').value = new URL(location.href).searchParams.get('agent') || config.demoAgentId;
  await loadAgent($('agent-id').value);
} catch (e) {
  error(e);
  $('live').textContent = 'UNAVAILABLE';
}

setInterval(() => {
  if (provider && !runner && !busy) run(() => loadAgent($('agent-id').value));
  else poll();
}, 12000);
setInterval(tick, 200);
