const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
let state,
  language = localStorage.getItem('shared-language') || 'system';
$('#language').value = language;
const ja = () => language === 'ja' || (language === 'system' && navigator.language.startsWith('ja'));
const t = (en, jp) => (ja() ? jp : en);
const signed = (x) => (x >= 0 ? '+' : '') + x.toFixed(4);
function modal(title, body) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = body;
  $('#modal').showModal();
}
$('#close').onclick = () => $('#modal').close();
$('#language').onchange = (e) => {
  language = e.target.value;
  localStorage.setItem('shared-language', language);
  render();
};
async function post(path, body = {}) {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const v = await r.json();
  if (!r.ok) throw Error(v.error);
  return v;
}
const action = (fn) => async () => {
  try {
    await fn();
    await refresh();
  } catch (e) {
    modal(t('Action failed', '操作に失敗しました'), `<p>${esc(e.message)}</p>`);
  }
};
$('#start').onclick = action(() => post('/api/run'));
$('#stop').onclick = action(() => post('/api/stop'));
$('#apply').onclick = action(() =>
  post('/api/targets', { targets: [+$('#target0').value / 100, +$('#target1').value / 100] }),
);
for (let i = 0; i < 2; i++)
  $(`#target${i}`).oninput = (e) => ($(`#value${i}`).textContent = e.target.value + '%');
$('#help').onclick = () =>
  modal(
    t('How this garden trades', '共有市場の遊び方'),
    `
<p><small>Powered by Aqua — © Degensoft Ltd 2025.</small></p>
<p>${t('Four flies, one pair of local test tokens. No outside trader is required: KOHARU and HINATA are the buyers and sellers.', '4匹が同じテスト通貨のペアを使います。KOHARUとHINATAが買い手・売り手になるので、外部の参加者がいなくても取引が成立します。')}</p>
<p>🌸 <b>MOMO / SORA</b> — ${t('Two Aqua strategies share one maker wallet. Tight (10 bps), wide (80 bps), or withdraw. An offer is not income: only a confirmed fill moves tokens.', '1つのウォレットからAquaに2つの戦略を提示。狭いスプレッド（10 bps）、広いスプレッド（80 bps）、撤回を選びます。提示だけでは収入はなく、約定したときに通貨が移動します。')}</p>
<p>🛒 <b>KOHARU / HINATA</b> — ${t('Separate wallets. Their chosen target token share becomes a neural input. The readout chooses hold/buy/sell; each order compares executable Aqua and Uniswap quotes and selects the greatest token output, before gas. No order is forced to fill an Aqua offer.', '個別のウォレットを持ち、目標の保有割合を神経回路への入力にします。待機・購入・売却を判定し、注文時にAquaとUniswapの見積もりを比較。ガス代を除く受取量が多い方へ発注します。Aquaでの約定を強制しません。')}</p>
<p>💭 ? → ${t('Thinking: all 166,700 classified MaleCNS neurons are evaluated per fly.', '考え中：各個体でMaleCNSの分類済み166,700ニューロンを計算。')}<br>🧠 → ${t('Online readout learning from confirmed outcomes; exploratory actions are labeled. Not a validated profit strategy.', '約定結果から読み出し部分をオンライン学習。探索行動には表示を付けます。利益が検証された戦略ではありません。')}<br>💤 → ${t('Hold / no trade. Quiet markets and no fills are valid outcomes.', '待機。売買しない・約定しない状態も正常です。')}</p>
<p>${t('PnL is current wallet value minus its starting value, marked at the Uniswap spot price in the displayed quote token. It includes inventory price changes and swap costs; it is not realized profit and excludes gas. Gas is separately in ETH. A test token has no monetary value.', '損益は現在の残高をUniswapのスポット価格で評価し、開始時評価額との差を表示します。単位は表示中の評価通貨。保有資産の価格変化・売買コストを含み、確定利益ではなく、ガス代は含みません。ガス代は別途ETHで表示。テスト通貨に金銭的価値はありません。')}</p>
<p>${t('Pause, adjust target shares and apply, then run. When the targets are reached trading can slow down. All transactions stay on a local Ethereum fork (Anvil 31337); links open actual local receipts, not Etherscan.', '一時停止→目標保有割合を調整・適用→再開してください。目標に近づけば取引が減ることもあります。取引先はローカルEthereumフォーク（Anvil 31337）。TXリンクは実際のローカル領収書を開きます。')}</p>`,
  );
$('#details').onclick = () =>
  modal(
    t('On-chain evidence & resources', 'オンチェーン証跡・リソース'),
    `<p>MaleCNS: ${state.metrics.neuronsPerFly || 166700} neurons × 4 · ${state.metrics.connections || '—'} edges / fly</p><p>${t('Four-fly neural time', '4匹の推論時間')}: ${(state.metrics.neuralMs || 0).toFixed(1)} ms · Python peak RSS ${(state.metrics.peakRSSMiB || 0).toFixed(1)} MiB</p><p>${t('Latest cycle', '直近の処理周期')}: ${(state.metrics.cycleMs || 0).toFixed(0)} ms</p><p>${t('Official Aqua on local Ethereum fork', 'ローカルEthereumフォークの公式Aqua')}: <code>${esc(state.config.fork.aqua)}</code></p><p>Uniswap V3 pool: <code>${esc(state.config.pool)}</code></p><p>Tokens: ${state.config.tokens.map((x, i) => `${esc(state.config.symbols[i])}: <code>${x}</code>`).join('<br>')}</p><p>${t('Live UI animation is independent of neural/transaction timing. Target cycle: 4 seconds, slower if computation takes longer. Policies adapt experimentally online; no held-out profitability claim.', '画面のアニメーションと神経計算・TXの周期は独立しています。目標周期4秒、処理が長ければ間隔を延ばします。学習は実験的なオンライン適応であり、未使用データでの利益検証はしていません。')}</p><pre>${esc(
      JSON.stringify(
        state.flies.map((f) => ({
          name: f.name,
          policyHash: f.policyHash,
          updates: f.updates,
          reward: f.reward,
        })),
        null,
        2,
      ),
    )}</pre>`,
  );
function render() {
  if (!state) return;
  document.documentElement.lang = ja() ? 'ja' : 'en';
  const texts = {
    '#network': t('● Ethereum fork · local', '● Ethereumフォーク · ローカル'),
    '#eyebrow': t('FOUR FLIES · ONE SHARED MARKET', '4匹のハエ・ひとつの市場'),
    '#title': t('A little living exchange.', 'ハエたちの小さな取引所。'),
    '#subtitle': t(
      'Two offer liquidity. Two choose where to trade. Watch real test tokens move.',
      '2匹が流動性を提示し、2匹が取引先を選ぶ。テスト通貨が実際に動きます。',
    ),
    '#aqua-label': t('MOMO + SORA · shared wallet', 'MOMO + SORA · 共有ウォレット'),
    '#uni-label': t('Same tokens · 0.3% pool fee', '同じ通貨 · プール手数料0.3%'),
    '#summary-title': t('Wallet PnL', 'ウォレットの評価損益'),
    '#control-title': t('Steer the garden', '市場への指示'),
    '#start': t('▶ Run', '▶ 動かす'),
    '#stop': t('Ⅱ Pause', 'Ⅱ 一時停止'),
    '#apply': t('Apply targets', '目標を適用'),
    '#fills-title': t('Confirmed trades', '成立した取引'),
    '#details': t('ⓘ Evidence & brain', 'ⓘ 証跡・神経回路'),
    '#pnl-note': t(
      'Mark-to-market · swap costs included · gas excluded',
      '時価評価・売買コスト込み・ガス代を除く',
    ),
    '#target-note': t(
      `Target wallet value held in ${state.config.symbols[0]}. Pause to edit.`,
      `${state.config.symbols[0]}で保有したい資産価値の割合。一時停止して変更できます。`,
    ),
    '#price-label': `1 ${state.config.symbols[0]}`,
    '#price': `${state.price.toFixed(5)} ${state.config.symbols[1]}`,
  };
  for (const [key, value] of Object.entries(texts)) $(key).textContent = value;
  const phases = {
    idle: t('Ready', '準備完了'),
    thinking: t('💭 Sensing & thinking', '💭 刺激を受けて考え中'),
    offering: t('🌸 Updating Aqua offers', '🌸 Aquaへの提示を更新中'),
    trading: t('🛒 Comparing quotes & trading', '🛒 見積もり比較・売買中'),
    learning: t('🧠 Learning from outcomes', '🧠 結果から学習中'),
    watching: t('Watching the market', '市場を観察中'),
    paused: t('Paused · existing offers expire automatically', '一時停止中・既存の提示は期限切れになります'),
    error: t('Stopped on error', 'エラーで停止'),
  };
  $('#status').textContent =
    `${phases[state.phase] || state.phase} · #${state.tick}${state.error ? ' · ' + state.error : ''}`;
  for (const id of ['#start', '#apply', '#target0', '#target1']) $(id).disabled = state.running;
  $('#stop').disabled = !state.running;
  $('#scores').innerHTML = ['MOMO + SORA', 'KOHARU', 'HINATA']
    .map(
      (name, i) =>
        `<div class="score"><span>${name}</span><b class="${state.pnl[i] >= 0 ? 'positive' : 'negative'}">${signed(state.pnl[i])} ${esc(state.config.symbols[1])}</b></div>`,
    )
    .join('');
  const thinking = ['thinking', 'learning'].includes(state.phase);
  if (!$('#flies').children.length)
    $('#flies').innerHTML = state.flies
      .map(
        (f, i) =>
          `<div class="fly" id="fly-${i}"><span class="bubble"></span><img src="/fly.png" alt="${f.name}" style="filter:drop-shadow(0 8px 9px #0006) hue-rotate(${i * 20}deg)"><b>${f.name}</b></div>`,
      )
      .join('');
  state.flies.forEach((f, i) => {
    const el = $(`#fly-${i}`);
    const small = innerWidth < 700;
    const x =
      i < 2
        ? small
          ? 10 + i * 20
          : 10 + i * 12
        : (f.route === 'Aqua' ? (small ? 16 : 20) : small ? 61 : 43) + (i - 2) * 7;
    el.style.left = x + '%';
    el.style.top = i < 2 ? '29%' : '65%';
    el.dataset.thinking = thinking;
    const labels = {
      idle: '…',
      tight: t('🌸 Tight · 10 bps', '🌸 狭く提示 · 10 bps'),
      wide: t('🌸 Wide · 80 bps', '🌸 広く提示 · 80 bps'),
      withdrawn: t('💤 Withdrawn', '💤 提示を撤回'),
      hold: t('💤 Hold', '💤 様子を見る'),
      buy: t('🛒 Buy ', '🛒 買う ') + state.config.symbols[0],
      sell: t('🪙 Sell ', '🪙 売る ') + state.config.symbols[0],
      thinking: '?',
    };
    el.querySelector('.bubble').textContent = thinking
      ? state.phase === 'learning'
        ? '🧠 ?'
        : '💭 ?'
      : (labels[f.status] || f.status) + (f.exploration ? t(' · exploring', ' · 探索中') : '');
  });
  $('#flow').textContent =
    `Aqua ${state.routes.Aqua} ${t('fills', '約定')} · Uniswap ${state.routes['Uniswap V3']} ${t('swaps', '売買')} · ${t('Same ERC20 pair. Actual transfers.', '共通のERC20ペア。実際の残高移動。')}`;
  const fills = state.transactions.filter((x) => x.kind === 'swap').slice(0, 3);
  $('#fills').innerHTML = fills.length
    ? fills
        .map(
          (x) =>
            `<div class="fill">${esc(x.route)} · ${esc(x.amountIn)} ${esc(x.input)} → ${Number(x.amountOut).toFixed(4)} ${esc(x.output)}<br><button data-tx="${x.hash}">TX ${x.hash.slice(0, 10)}… ↗</button> · ${Number(x.gasETH).toFixed(7)} ETH gas</div>`,
        )
        .join('')
    : `<small>${t('No fills yet. Offers alone produce no trading income.', 'まだ約定はありません。提示だけでは取引収入は発生しません。')}</small>`;
  for (const button of document.querySelectorAll('[data-tx]'))
    button.onclick = async () => {
      const data = await (await fetch('/api/tx/' + button.dataset.tx)).json();
      const tx = state.transactions.find((x) => x.hash === button.dataset.tx);
      modal(
        t('Confirmed local transaction', '確認済みローカルトランザクション'),
        `<p>${t('Actual local fork receipt. This hash does not exist on public Etherscan.', 'ローカルフォークで実際に成立したTXです。公開Etherscanには存在しません。')}</p><pre>${esc(JSON.stringify({ trade: tx, receipt: data }, null, 2))}</pre>`,
      );
    };
  const c = $('#chart'),
    ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  const h = state.history,
    max = Math.max(0.01, ...h.flatMap((x) => x.pnl.map(Math.abs)));
  ctx.strokeStyle = '#ffffff30';
  ctx.beginPath();
  ctx.moveTo(0, 75);
  ctx.lineTo(500, 75);
  ctx.stroke();
  ['#b5f5bb', '#ffd994', '#b8c3ff'].forEach((color, i) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    h.forEach((x, j) => {
      const a = (j / Math.max(1, h.length - 1)) * 500,
        b = 75 - (x.pnl[i] / max) * 65;
      j ? ctx.lineTo(a, b) : ctx.moveTo(a, b);
    });
    ctx.stroke();
  });
}
async function refresh() {
  state = await (await fetch('/api/state')).json();
  render();
}
async function poll() {
  try {
    await refresh();
  } catch (e) {
    $('#status').textContent = t('Connection interrupted', '接続が途切れました');
  }
  setTimeout(poll, 700);
}
poll();
