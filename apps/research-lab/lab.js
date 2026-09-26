import { LearningBioAgent, ChainDecisionRunner } from '/packages/bioagent-framework/src/index.js';
import { ForagingBackend, AquaBackend } from '/packages/bioagent-framework/src/adapters.js';
const $ = (id) => document.getElementById(id),
  owner = '0x' + '11'.repeat(20),
  agents = {},
  saved = {};
let lang = 'ja',
  task = 'foraging',
  running = false,
  lastDecision = null,
  summary = null,
  chain = null;
const copy = {
  ja: {
    title: '判断と学習を、共通の枠組みで。',
    intro: 'チェーン入力をコネクトームへ渡し、根拠付きの判断と評価済みの学習成果を返す実験用フレームワーク。',
    taskLabel: '2つのアダプター、同じAPI',
    foraging: '採餌の判断を観察する',
    aqua: 'Aquaの人工目標を校正する',
    scope: 'この操作欄はローカルシミュレーションです。下段で実EVM入力の記録を再生できます。',
    stimulus: '刺激の強さ',
    step: '1ステップ',
    run: '動かす',
    stop: '止める',
    learningTitle: '学習 → 評価 → 採用 → 保存・復元',
    learningCopy:
      '学習データと別の条件で候補を評価します。採餌は報酬・餌・接触、Aquaは人工目標への誤差で採用を決めます。',
    train: '1. 学習',
    evaluate: '2. 評価',
    adopt: '3. 採用を判定',
    save: '方策を保存',
    restore: '方策を復元',
    ready: '準備完了 / 方策 v',
    trained: '候補を作成。まだ行動には反映していません。',
    evaluated: '評価完了。採用条件を確認できます。',
    accepted: '候補を採用しました / 方策 v',
    rejected: '条件を満たさないため、既存方策を維持しました。',
    saved: '方策をこのブラウザーのメモリーへ保存しました。',
    restored: '方策を復元しました。環境の状態はそのままです。',
    evidenceTitle: '未使用の60環境で比較',
    limit:
      '終了時エネルギーは0.72 → 0.36へ低下。直接入力の対照も同程度で、生物由来の優位や取引収益性は未証明です。',
    chainTitle: 'ローカルEVMの実記録を再生',
    chainCopy:
      '隔離Anvilに実デプロイしたRegistryの入力を再生します。過去の記録として、当時のブロック時刻で検証します。現在のチェーンへの接続・取引ではありません。',
    replay: '3入力 × 2アプリを再生',
    reward: '報酬',
    food: '採餌',
    contacts: '接触',
    version: '方策',
    response: '反応',
    action: '判断',
  },
  en: {
    title: 'One framework for decisions and learning.',
    intro:
      'Connect chain inputs to a connectome, then return traceable decisions and evaluated learning artifacts.',
    taskLabel: 'TWO ADAPTERS, ONE API',
    foraging: 'Observe foraging decisions',
    aqua: 'Calibrate an artificial Aqua target',
    scope: 'These controls run a local simulation. Replay recorded inputs from a real local EVM below.',
    stimulus: 'Stimulus',
    step: 'One step',
    run: 'Run',
    stop: 'Stop',
    learningTitle: 'Train → evaluate → adopt → save / restore',
    learningCopy:
      'Selection uses different scenarios from training. Foraging checks reward, food and contacts; Aqua checks error against an artificial target.',
    train: '1. Train',
    evaluate: '2. Evaluate',
    adopt: '3. Decide adoption',
    save: 'Save policy',
    restore: 'Restore policy',
    ready: 'Ready / policy v',
    trained: 'Candidate fitted; active behavior is unchanged.',
    evaluated: 'Evaluated. Review the adoption criteria.',
    accepted: 'Candidate adopted / policy v',
    rejected: 'Gate failed. Previous policy retained.',
    saved: 'Policy saved in this browser’s memory.',
    restored: 'Policy restored. Environment state is unchanged.',
    evidenceTitle: 'Compared on 60 unseen worlds',
    limit:
      'Final energy fell 0.72 → 0.36. Direct-input controls perform almost identically. Biological superiority and trading returns remain unproven.',
    chainTitle: 'Replay real local EVM records',
    chainCopy:
      'Replay inputs from a Registry deployed on isolated Anvil. Historical records are checked at their original block times. This is not a live chain connection or trade.',
    replay: 'Replay 3 inputs × 2 apps',
    reward: 'Reward',
    food: 'Food',
    contacts: 'Contacts',
    version: 'Policy',
    response: 'Response',
    action: 'Action',
  },
};
const t = (k) => copy[lang][k];
function current() {
  return agents[task];
}
function status() {
  return { activity: 2, energy: 7000, stimulus: Number($('stimulus').value) };
}
function init() {
  if (!agents[task])
    agents[task] = new LearningBioAgent(
      { id: `lab-${task}`, owner },
      task === 'foraging' ? new ForagingBackend({ seed: 324001 }) : new AquaBackend(),
    );
  current().observe(status());
  lastDecision = null;
  running = false;
  $('evaluate').disabled = !current().candidate;
  $('adopt').disabled = true;
  $('restore').disabled = !saved[task];
  $('comparison').textContent = '';
  $('phase').textContent = t('ready') + current().version;
  render();
}
function language() {
  document.documentElement.lang = lang;
  $('language').textContent = lang === 'ja' ? 'English' : '日本語';
  for (const [id, k] of Object.entries({
    title: 'title',
    intro: 'intro',
    'task-label': 'taskLabel',
    scope: 'scope',
    'stimulus-label': 'stimulus',
    step: 'step',
    'learning-title': 'learningTitle',
    'learning-copy': 'learningCopy',
    train: 'train',
    evaluate: 'evaluate',
    adopt: 'adopt',
    save: 'save',
    restore: 'restore',
    'evidence-title': 'evidenceTitle',
    limit: 'limit',
    'chain-title': 'chainTitle',
    'chain-copy': 'chainCopy',
    replay: 'replay',
  }))
    $(id).textContent = t(k);
  render();
}
function render() {
  $('task-title').textContent = t(task);
  $('run').textContent = t(running ? 'stop' : 'run');
  $('stimulus-value').textContent = (Number($('stimulus').value) / 100).toFixed(0) + '%';
  const a = current(),
    s = a.snapshot().runtime,
    metrics =
      task === 'foraging'
        ? [
            [t('reward'), s.metrics.reward.toFixed(2)],
            [t('food'), s.metrics.food],
            [t('contacts'), s.metrics.contacts],
            [t('version'), 'v' + a.version],
          ]
        : [
            [t('response'), lastDecision?.response.toFixed(4) || '—'],
            [t('action'), lastDecision?.action || '—'],
            [t('version'), 'v' + a.version],
          ];
  $('metrics').replaceChildren(
    ...metrics.map(([label, value]) => {
      const div = document.createElement('div');
      div.className = 'metric';
      const b = document.createElement('b');
      b.textContent = value;
      div.append(b, document.createTextNode(label));
      return div;
    }),
  );
  $('decision').textContent = lastDecision ? JSON.stringify(lastDecision) : '';
  const ctx = $('field').getContext('2d');
  ctx.clearRect(0, 0, 720, 440);
  if (task === 'foraging') {
    for (const h of s.world.hazards) {
      ctx.fillStyle = '#ddada4';
      ctx.beginPath();
      ctx.arc(h.x * 20, h.y * 20, h.radius * 20, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const f of s.world.foods) {
      ctx.fillStyle = '#eeb84e';
      ctx.beginPath();
      ctx.arc(f.x * 20, f.y * 20, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.save();
    ctx.translate(s.actor.x * 20, s.actor.y * 20);
    ctx.rotate(s.actor.heading || 0);
    ctx.fillStyle = '#087e74';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-9, -7);
    ctx.lineTo(-9, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#49685f';
    ctx.font = '16px sans-serif';
    ctx.fillText(
      `t=${s.time.toFixed(1)}s · energy=${s.actor.energy.toFixed(2)} · satiety=${s.actor.satiety.toFixed(2)}`,
      18,
      418,
    );
  } else {
    ctx.fillStyle = '#173b44';
    ctx.font = '24px sans-serif';
    ctx.fillText('Synthetic risk calibration', 35, 60);
    ctx.font = '18px sans-serif';
    ctx.fillText('risk → MaleCNS → learned gain → action', 35, 100);
    ctx.fillStyle = '#b8d5cf';
    ctx.fillRect(35, 190, 650, 40);
    ctx.fillStyle = '#087e74';
    ctx.fillRect(35, 190, 650 * Math.min(1, (lastDecision?.response || 0) / 0.3), 40);
    ctx.fillStyle = '#173b44';
    ctx.font = '40px sans-serif';
    ctx.fillText(lastDecision?.action || 'Ready', 35, 320);
  }
  if (summary) {
    const r = summary.rows.find((x) => x.encoder === 'malecns' && x.profile === 'default');
    $('evidence').innerHTML =
      `<div class="result">${r.before.reward.toFixed(2)} → ${r.after.reward.toFixed(2)}</div><p>${t('reward')} / 300 ticks · 5 searches × 60 worlds</p><p>${t('food')}: ${r.before.food.toFixed(2)} → ${r.after.food.toFixed(2)}<br>${t('contacts')}: ${r.before.contacts.toFixed(2)} → ${r.after.contacts.toFixed(2)}</p>`;
  }
}
function step() {
  lastDecision = current().step();
  render();
}
$('step').onclick = step;
$('run').onclick = () => {
  running = !running;
  render();
};
setInterval(() => {
  if (running) step();
}, 100);
$('task').onchange = () => {
  task = $('task').value;
  init();
};
$('language').onclick = () => {
  lang = lang === 'ja' ? 'en' : 'ja';
  language();
};
$('stimulus').oninput = () => {
  current().observe(status());
  render();
};
const profiles = [{ name: 'default', stimulus: 0.55, energy: 0.7 }];
$('train').onclick = () => {
  running = false;
  current().train({
    seed: 310001,
    seeds: [311000, 311019, 311038, 311057],
    profiles,
    ticks: 300,
    trials: 16,
  });
  $('evaluate').disabled = false;
  $('adopt').disabled = true;
  $('phase').textContent = t('trained');
  $('comparison').textContent = JSON.stringify(
    {
      candidate: current().candidate.policy,
      scope: 'small interactive training run; not the reported 5 × 60 study',
    },
    null,
    2,
  );
  render();
};
$('evaluate').onclick = () => {
  const result = current().evaluate({ seeds: [312000, 312019, 312038, 312057], profiles, ticks: 300 });
  $('adopt').disabled = false;
  $('phase').textContent = t('evaluated');
  $('comparison').textContent = JSON.stringify(result, null, 2);
};
$('adopt').onclick = () => {
  const r = current().adopt();
  $('phase').textContent = r.accepted ? t('accepted') + r.version : t('rejected');
  $('adopt').disabled = true;
  $('evaluate').disabled = true;
  render();
};
$('save').onclick = async () => {
  saved[task] = await current().exportPolicy();
  $('restore').disabled = false;
  $('phase').textContent = t('saved');
};
$('restore').onclick = async () => {
  await current().restorePolicy(saved[task]);
  $('adopt').disabled = true;
  $('evaluate').disabled = true;
  $('phase').textContent = t('restored');
  render();
};
$('replay').onclick = async () => {
  if (!chain) {
    $('chain-result').textContent = 'Run npm run test:framework:chain to generate local evidence first.';
    return;
  }
  const result = [];
  for (const Backend of [ForagingBackend, AquaBackend]) {
    const observation = chain.traces[0].observation;
    const a = new LearningBioAgent({ id: 'framework-chain-1', owner: observation.owner }, new Backend());
    const r = new ChainDecisionRunner(a, {
      chainId: chain.chainId,
      registry: chain.registry,
      agentId: '1',
      minConfirmations: 0,
    });
    for (const record of chain.traces) {
      r.observe(record.observation, record.observation.block.timestamp);
      const d = await r.decide(record.observation.block.timestamp);
      result.push({
        task: a.binding.task,
        revision: d.input.status.revision,
        blockHash: d.input.block.hash,
        decision: d.decision,
        policy: d.policy,
      });
    }
  }
  $('chain-result').textContent = JSON.stringify(
    { mode: 'archived-local-EVM-replay', decisions: result },
    null,
    2,
  );
};
init();
language();
Promise.all([
  fetch('/artifacts/bioagent-adaptation-20260926/summary.json').then((r) => (r.ok ? r.json() : null)),
  fetch('/artifacts/bioagent-adaptation-20260926/chain.json').then((r) => (r.ok ? r.json() : null)),
])
  .then(([s, c]) => {
    summary = s;
    chain = c;
    render();
  })
  .catch((e) => {
    $('evidence').textContent = e.message;
  });
