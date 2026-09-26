const $ = (id) => document.getElementById(id);
const apps = ['foraging', 'market', 'aqua'];
let app = apps.includes(location.pathname.slice(1)) ? location.pathname.slice(1) : 'foraging';
let lang = 'en',
  state = null,
  pending = false,
  connected = false,
  selectedPane = 'help',
  operationError = '';
const history = Object.fromEntries(apps.map((a) => [a, { run: null, tick: 0, points: [] }]));
const visuals = [
  { x: 0, y: 0 },
  { x: 0, y: 0 },
];
const colors = ['#efbb7e', '#b7c7ff'];
const assets = Object.fromEntries(
  ['bioagent', 'sugar-crystal'].map((n) => {
    const image = new Image();
    image.src = `/assets/${n}.png`;
    return [n, image];
  }),
);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const t = (ja, en) => (lang === 'ja' ? ja : en);
const put = (id, text) => {
  $(id).textContent = text;
};
const node = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const sign = (value, digits = 3) => {
  const v = Number(value);
  if (!Number.isFinite(v)) return '—';
  const min = 10 ** -digits;
  return v === 0
    ? (0).toFixed(digits)
    : `${v > 0 ? '+' : '−'}${Math.abs(v) < min ? '<' + min.toFixed(digits) : Math.abs(v).toFixed(digits)}`;
};
const units = () => state?.display?.market?.[1]?.symbol || 'token1';
const baseUnit = () => state?.display?.market?.[0]?.symbol || 'token0';
const aquaTokens = () =>
  state?.display?.aqua?.[$('variant').value] || [{ symbol: 'NECTAR' }, { symbol: 'POLLEN' }];
function amount(value) {
  return Number(value || 0) / 1e18;
}
function phase(p) {
  if (pending) return t('指示を送信しています…', 'Sending instructions…');
  if (!connected) return t('接続を確認しています…', 'Checking connection…');
  if (state?.busy && state.busy.app !== app) return t('別のアプリが実行中です', 'Another app is running');
  return (
    {
      live: t('観察中', 'Observing'),
      collect: t('経験を集めています', 'Collecting experience'),
      training: t('学び直し中', 'Learning'),
      selection: t('学習結果を比べています', 'Comparing policies'),
      test: t('新しい条件で確認中', 'Testing new conditions'),
      complete: t('今回の観察が終了しました', 'This run is complete'),
      stopped: t('停止中', 'Stopped'),
      error: t('処理を完了できませんでした', 'Could not finish this run'),
    }[p?.phase] || t('はじめる準備ができました', 'Ready to begin')
  );
}
function actionLabel(p, i) {
  const d = p?.decisions?.[i];
  if (!d) return '—';
  if (p.phase === 'training') return t('？ 学び直し中', '? Learning');
  return (
    {
      foraging: [
        t('東へ', 'East'),
        t('南東へ', 'South-east'),
        t('南へ', 'South'),
        t('南西へ', 'South-west'),
        t('西へ', 'West'),
        t('北西へ', 'North-west'),
        t('北へ', 'North'),
        t('北東へ', 'North-east'),
        t('休んでいます', 'Resting'),
      ],
      market: [t('待っています', 'Holding'), t('買う', 'Buy'), t('売る', 'Sell')],
      aqua: [t('狭く提示', 'Tight offer'), t('広く提示', 'Wide offer'), t('提示を撤回', 'Withdraw')],
    }[app][d.action] || '—'
  );
}
function thought(p, i) {
  const f = p?.snapshot?.flies?.[i],
    m = p?.outcomes?.[i]?.metrics;
  if (!f) return '';
  if (p.phase === 'training') return t('？ 学び直し中', '? Learning');
  if (app === 'foraging') {
    if (m?.hit) return t('！ あぶない', '! Watch out');
    if (m?.collected) return t('♡ みつを見つけた！', '♡ Found nectar!');
    if (p.decisions?.[i]?.action === 8) return t('すやすや…', 'Zzz…');
    if (f.satiety > 0.8) return t('おなかいっぱい', 'So full');
    if (f.satiety < 0.15) return t('おなかすいた…', 'Hungry…');
    return t('みつ、どこ？', 'Where is nectar?');
  }
  return actionLabel(p, i);
}
function translate() {
  lang =
    $('language').value === 'system'
      ? navigator.language.startsWith('ja')
        ? 'ja'
        : 'en'
      : $('language').value;
  document.documentElement.lang = lang;
  render();
}
$('language').value = localStorage.getItem('full-app-language') || 'system';
$('language').onchange = () => {
  localStorage.setItem('full-app-language', $('language').value);
  translate();
};
$('stimulus').oninput = () => put('stimulus-value', Math.round(Number($('stimulus').value) * 100) + '%');
$('variant').onchange = () => render();
for (const b of document.querySelectorAll('button[data-app]'))
  b.onclick = () => {
    app = b.dataset.app;
    historyReplace();
    render();
  };
function historyReplace() {
  window.history.replaceState({}, '', `/${app}`);
  document.body.dataset.app = app;
  visuals.forEach((v) => (v.x = 0));
}
function openDetails(pane = 'help', section) {
  selectedPane = pane;
  renderDetails();
  if (!$('details-dialog').open) $('details-dialog').showModal();
  if (section) setTimeout(() => $(section)?.scrollIntoView({ block: 'start' }), 50);
}
$('open-details').onclick = () => openDetails();
$('close-details').onclick = () => $('details-dialog').close();
$('close-receipt').onclick = () => $('receipt-dialog').close();
for (const b of document.querySelectorAll('[data-detail]')) b.onclick = () => openDetails('help');
for (const b of document.querySelectorAll('[data-pane]'))
  b.onclick = () => {
    selectedPane = b.dataset.pane;
    renderDetails();
  };
for (const id of ['details-dialog', 'receipt-dialog'])
  $(id).addEventListener('click', (e) => {
    if (e.target === $(id)) {
      const r = $(id).getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        $(id).close();
    }
  });
// The manual's links reveal their actual destination even when it lives in another modal tab.
$('app-guide').addEventListener('click', (e) => {
  const link = e.target.closest('.guide-visuals figcaption a');
  if (!link) return;
  const i = [...$('app-guide').querySelectorAll('.guide-visuals figcaption a')].indexOf(link);
  if (i === 3) {
    openDetails('evidence');
  } else {
    $('details-dialog').close();
  }
});
async function operation(operation) {
  if (pending || !connected) return;
  pending = true;
  operationError = '';
  render();
  try {
    const r = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app,
        variant: $('variant').value,
        operation,
        stimulus: Number($('stimulus').value),
      }),
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error);
    await poll();
  } catch (e) {
    operationError = e.message;
    put('error', e.message);
  } finally {
    pending = false;
    render();
  }
}
$('live').onclick = () => operation('live');
$('learn').onclick = () => operation('learn');
$('stop').onclick = async () => {
  pending = true;
  operationError = '';
  render();
  try {
    const r = await fetch('/api/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!r.ok) throw Error('Stop request failed');
    await poll();
  } catch (e) {
    operationError = e.message;
    put('error', e.message);
  } finally {
    pending = false;
    render();
  }
};
function render() {
  document.body.dataset.app = app;
  document.querySelector('.network').textContent = connected
    ? '● Anvil · local'
    : t('○ 接続待ち', '○ Connecting');
  $('language').options[0].textContent = t('システム', 'System');
  const p = state?.latest?.[app],
    flies = p?.snapshot?.flies || [];
  for (const b of document.querySelectorAll('button[data-app]')) {
    b.textContent = {
      foraging: t('みつの箱庭', 'Nectar garden'),
      market: t('PnLバトル', 'PnL battle'),
      aqua: t('Aqua流動性', 'Aqua liquidity'),
    }[b.dataset.app];
    b.classList.toggle('active', b.dataset.app === app);
    b.setAttribute('aria-current', b.dataset.app === app ? 'page' : 'false');
  }
  put(
    'eyebrow',
    {
      foraging: 'A LITTLE WORLD, A LIFE OF ITS OWN',
      market: 'TWO FLIES. ONE MARKET.',
      aqua: 'ONE WALLET. TWO STRATEGISTS.',
    }[app],
  );
  put(
    'app-title',
    {
      foraging: t('みつを探す、小さな毎日。', 'A little life in the garden.'),
      market: t('どちらのハエが、増やせる？', 'Who grows their balance?'),
      aqua: t('出す、広げる、引き上げる。', 'Offer. Widen. Withdraw.'),
    }[app],
  );
  put(
    'intro',
    {
      foraging: t(
        '環境に刺激を与えて、2匹の食事と休息を見守ろう。',
        'Set a stimulus. Watch two flies forage and rest.',
      ),
      market: t(
        '同じ相場を、違う判断で。仮想資金の増減を見届けよう。',
        'The same market, different decisions. Watch their virtual funds change.',
      ),
      aqua: t(
        '価格の変化に合わせて、ハエが流動性の提示方法を選びます。',
        'Flies choose how to offer liquidity as observed prices change.',
      ),
    }[app],
  );
  put('status', phase(p));
  put(
    'progress-label',
    p?.total
      ? t(
          `今の工程：${Math.round(((p.tick || 0) / p.total) * 100)}%`,
          `Current phase: ${Math.round(((p.tick || 0) / p.total) * 100)}%`,
        )
      : t('2匹の行動を観察できます', 'Two individuals to observe'),
  );
  $('progress').value = p?.tick || 0;
  $('progress').max = p?.total || 1;
  put(
    'score-heading',
    {
      foraging: t('集めたみつ', 'Nectar collected'),
      market: t('損益ランキング', 'Profit & loss'),
      aqua: t('いま選んでいる戦略', 'Selected strategies'),
    }[app],
  );
  put(
    'score-context',
    app === 'foraging'
      ? t('今回の観察で集めた数', 'Collected during this run')
      : app === 'market'
        ? t(`初期資金 100 ${units()} / 個体 · 仮想取引`, `Start: 100 ${units()} per fly · paper trades`)
        : t(
            `取引ペア ${aquaTokens()
              .map((x) => x.symbol)
              .join(' / ')} · テスト資金`,
            `Pair ${aquaTokens()
              .map((x) => x.symbol)
              .join(' / ')} · test funds`,
          ),
  );
  put(
    'control-title',
    app === 'foraging'
      ? t('箱庭への指示', 'Garden controls')
      : app === 'market'
        ? t('バトルの進行', 'Battle controls')
        : t('Aquaへの指示', 'Aqua controls'),
  );
  put('stimulus-label', t('刺激の強さ', 'Stimulus'));
  put(
    'live',
    app === 'foraging'
      ? t('刺激を送って観察', 'Send stimulus & watch')
      : app === 'market'
        ? t('バトルをはじめる', 'Start battle')
        : t('自律運用をはじめる', 'Start autonomous run'),
  );
  put('stop', t('停止', 'Stop'));
  put('learn', t('学び直す', 'Learn again'));
  put(
    'control-help',
    app === 'foraging'
      ? t(
          '開始時にコントラクトへ刺激を記録します。値の変更は次の開始時に反映。',
          'Starting records stimulus in the contract. Slider changes apply to the next run.',
        )
      : app === 'market'
        ? t(
            '記録済みUniswap相場で競争。売買は仮想口座のみ。',
            'Compete on recorded Uniswap prices. Trades affect paper accounts only.',
          )
        : t(
            '選んだ戦略をship / dockで適用。停止しても登録済みの提示は残ります。',
            'Applies choices via ship / dock. Stopping the run leaves registered offers in place.',
          ),
  );
  $('stimulus-control').hidden = app !== 'foraging';
  $('live').disabled = $('learn').disabled = pending || !connected || Boolean(state?.busy);
  $('stop').disabled = pending || !state?.busy;
  $('variant').disabled = Boolean(state?.busy) || pending;
  if (p?.phase === 'error') put('error', p.error || '');
  else if (connected) put('error', operationError);
  const hasSnapshot = Boolean(p?.snapshot);
  $('idle-note').hidden = hasSnapshot;
  put('idle-note', t('下のボタンから、観察をはじめましょう。', 'Start a run using the controls below.'));
  const cards = $('cards');
  cards.replaceChildren();
  const values = flies.map((f) =>
    app === 'foraging' ? f.score : app === 'market' ? amount(f.pnl) : f.reward,
  );
  for (let i = 0; i < 2; i++) {
    const f = flies[i],
      card = node('article', undefined, 'card');
    card.dataset.agent = String(i);
    const top = node('div', undefined, 'card-top');
    top.append(node('strong', ['MOMO', 'SORA'][i]));
    if (f && values[0] !== values[1])
      top.append(
        node('span', i === values.indexOf(Math.max(...values)) ? t('リード中', 'Leading') : '', 'badge'),
      );
    card.append(top);
    if (app === 'aqua') {
      card.append(
        node(
          'p',
          f
            ? actionLabel(p, i)
            : state?.aquaState?.[$('variant').value]?.strategies?.[i]?.length
              ? t('前回の提示が登録中', 'Previous offer registered')
              : t('まだ選択していません', 'No choice yet'),
          'action-label',
        ),
      );
      const opts = node('div', undefined, 'strategy-options');
      [t('狭く', 'Tight'), t('広く', 'Wide'), t('撤回', 'Withdraw')].forEach((x, j) =>
        opts.append(node('span', x, p?.decisions?.[i]?.action === j ? 'selected' : '')),
      );
      card.append(opts);
      const spread = f?.last?.spread;
      card.append(
        node(
          'p',
          f
            ? spread
              ? `${t('提示幅', 'Spread')} ${(spread / 100).toFixed(2)}%`
              : t('提示なし', 'No offer')
            : '—',
          'card-caption',
        ),
      );
    }
    const n = node(
      'div',
      f ? (app === 'foraging' ? String(f.score) : sign(values[i])) : '—',
      'number ' +
        (f && app !== 'foraging' ? (values[i] > 0 ? 'gain' : values[i] < 0 ? 'loss' : 'neutral') : ''),
    );
    n.append(node('small', app === 'foraging' ? t('個', 'pieces') : app === 'market' ? units() : 'pt'));
    card.append(n);
    if (app === 'foraging') {
      const meter = node('div', undefined, 'body-meter');
      meter.append(node('span', t('元気', 'Energy')));
      const m = node('meter');
      m.min = 0;
      m.max = 1;
      m.value = f?.energy || 0;
      m.setAttribute('aria-label', t('活動エネルギー', 'Activity energy'));
      meter.append(m, node('span', f ? `${Math.round(f.energy * 100)}%` : '—'));
      card.append(meter, node('p', f ? thought(p, i) : t('出発前', 'Before departure'), 'action-label'));
    } else if (app === 'market') {
      card.append(
        node(
          'p',
          f
            ? `${sign(amount(f.pnl), 2)}% · ${t('資産', 'Equity')} ${amount(f.equity).toFixed(3)} ${units()}`
            : '—',
          'card-caption',
        ),
      );
      card.append(
        node(
          'p',
          f
            ? BigInt(f.units) > 0n
              ? t(`${baseUnit()}を保有中`, `Holding ${baseUnit()}`)
              : t('ポジションなし', 'No position')
            : '—',
          'action-label',
        ),
      );
      card.append(
        node(
          'p',
          f ? `${t('今回', 'This run')} ${f.trades} ${t('取引', 'trades')} · ${actionLabel(p, i)}` : '',
          'card-caption',
        ),
      );
    } else {
      card.append(
        node(
          'p',
          t('代理価格による評価 · 実現PnLではありません', 'Proxy-price score · not realized PnL'),
          'card-caption',
        ),
      );
      card.append(
        node(
          'p',
          f
            ? `${f.fills} ${t('回約定', 'fills')} · ${f.last?.filled ? t('直近：約定済み', 'Last: filled') : f.last?.action === 2 ? t('直近：撤回済み', 'Last: withdrawn') : t('直近：提示中・未約定', 'Last: offered, not filled')}`
            : '',
          'card-caption',
        ),
      );
    }
    cards.append(card);
  }
  $('proxy-caption').hidden = app !== 'aqua';
  put(
    'proxy-caption',
    t(
      `代理価格：Uniswapの${baseUnit()}価格変化率を、${aquaTokens()[0].symbol}の評価に使用。`,
      `Price proxy: Uniswap ${baseUnit()} price changes value ${aquaTokens()[0].symbol}.`,
    ),
  );
  $('battle-panel').hidden = app !== 'market';
  put('battle-heading', t('スタートから、どれだけ増減？', 'Change since the start'));
  put('battle-unit', units());
  put(
    'battle-caption',
    t('中央がゼロ。右は利益、左は損失。', 'Zero is the center. Right = profit; left = loss.'),
  );
  $('battle-bars').replaceChildren();
  const scale = Math.max(1, ...values.map(Math.abs));
  for (let i = 0; i < 2; i++) {
    const row = node('div', undefined, 'battle-row'),
      head = node('header');
    head.append(
      node('span', ['MOMO', 'SORA'][i]),
      node('strong', flies[i] ? `${sign(values[i])} ${units()}` : '—'),
    );
    const track = node('div', undefined, 'bar-track'),
      bar = node('div', undefined, 'bar-fill ' + (values[i] < 0 ? 'negative' : ''));
    const width = flies[i] ? (Math.abs(values[i]) / scale) * 48 : 0;
    bar.style.width = width + '%';
    bar.style.left = (values[i] < 0 ? 50 - width : 50) + '%';
    track.append(bar);
    row.append(head, track);
    $('battle-bars').append(row);
  }
  $('scene-legend').replaceChildren();
  if (app === 'foraging') {
    const im = new Image();
    im.src = '/assets/sugar-crystal.png';
    im.alt = '';
    const a = node('span');
    a.append(im, document.createTextNode(t('みつを集める', 'Collect nectar')));
    $('scene-legend').append(a, node('span', t('赤い輪＝危険', 'Red rings = hazards')));
  } else
    $('scene-legend').append(
      node(
        'span',
        app === 'market'
          ? t(`損益の推移 · ${units()}建て`, `PnL history · in ${units()}`)
          : t('ハエが選んだ提示方法を表示', 'Showing each fly’s selected offer'),
      ),
    );
  $('arena').setAttribute(
    'aria-label',
    app === 'foraging'
      ? t('ハエの位置・みつ・危険を表示する箱庭', 'Garden showing fly positions, nectar and hazards')
      : app === 'market'
        ? t(
            '2匹の損益推移。正確な数値は成績カードを参照',
            'PnL history for two flies. Exact values appear in score cards',
          )
        : t('2匹が選んだAqua戦略', 'Aqua strategies chosen by two flies'),
  );
  window.dispatchEvent(
    new CustomEvent('bio-guide-state', {
      detail: { app, lang, mode: $('variant').value === 'legacy' ? 'reduced' : 'full', p },
    }),
  );
  renderDetails();
}
function renderDetails() {
  const p = state?.latest?.[app];
  put('details-title', t('詳しく見る', 'A closer look'));
  put('open-details', 'ⓘ');
  $('open-details').setAttribute('aria-label', t('説明と技術情報を開く', 'Open help and technical details'));
  for (const b of document.querySelectorAll('[data-pane]')) {
    b.textContent = {
      help: t('遊び方・数値の意味', 'How to play & scores'),
      evidence: t('チェーン・実装', 'Chain & implementation'),
      learning: t('学習・比較', 'Learning & comparison'),
    }[b.dataset.pane];
    b.setAttribute('aria-selected', String(selectedPane === b.dataset.pane));
    $('pane-' + b.dataset.pane).hidden = selectedPane !== b.dataset.pane;
  }
  const explanation =
    app === 'foraging'
      ? t(
          'みつの個数がスコアです。元気は活動エネルギー（%）。ハエの位置と蜜の取得は実際の計算結果、背景の植物は装飾です。',
          'Nectar count is your score. Energy is remaining activity energy (%). Fly positions and collection come from actual simulation; background plants are decorative.',
        )
      : app === 'market'
        ? t(
            `損益＝現在の清算評価額 − 初期資金100 ${units()}。単位はテストトークン${units()}で、ETHではありません。売却見積もり・プール手数料・想定取引費用を含む仮想口座の損益です。グラフはこの画面で受信した観測点を描き、ゼロからの増減を表示します。`,
            `PnL = current liquidation equity − initial 100 ${units()}. The unit is the test token ${units()}, not ETH. Includes liquidation quotes, pool fees and assumed transaction costs. The chart plots observations received in this page, relative to zero.`,
          )
        : t(
            `Aquaの取引ペアは${aquaTokens()
              .map((x) => x.symbol)
              .join(
                ' / ',
              )}です。代理評価 pt は、${aquaTokens()[0].symbol}の増減 ×（次のUniswap価格 ÷ 今の価格）＋ ${aquaTokens()[1].symbol}の増減、を各約定で累積します。参照する価格は${baseUnit()}を${units()}で測った別ペアの価格です。${aquaTokens()[1].symbol}相当を基準に正規化した評価ポイントであり、ETH・実現利益・実際のトークン価格オラクルではありません。`,
            `Aqua trades ${aquaTokens()
              .map((x) => x.symbol)
              .join(
                ' / ',
              )}. Proxy points sum: change in ${aquaTokens()[0].symbol} × (next Uniswap price / current price) + change in ${aquaTokens()[1].symbol}. The source price is ${baseUnit()} in ${units()}, a different pair. Points use a normalized ${aquaTokens()[1].symbol}-equivalent reference, not ETH, realized profit or a token-price oracle.`,
          );
  $('metric-help').replaceChildren(
    node('h3', t('この画面で見るもの', 'What this screen shows')),
    node('p', explanation, 'help-box'),
  );
  put('evidence-heading', t('入力と実行の証拠', 'Input and execution evidence'));
  put(
    'connection',
    state
      ? `Anvil 31337 · ${app === 'market' ? state.chain.market.pool : state.chain.registries[$('variant').value][app]}`
      : t('接続待ち', 'Waiting for connection'),
  );
  put(
    'evidence-help',
    t(
      'このアプリはローカル実験です。TXを開くと実際のreceiptを確認できます。市場の売買自体はペーパー、Aquaはテストトークンの実取引です。',
      'This is a local experiment. Open a TX for its actual receipt. Market trades are paper; Aqua trades real test tokens.',
    ),
  );
  const links = [];
  if (p?.snapshot?.lastEvent) links.push(p.snapshot.lastEvent);
  for (const o of p?.outcomes || []) {
    links.push(...(o.metrics?.transactions || []), ...(o.source?.statuses || []));
    for (const k of ['decision', 'fill', 'mark', 'input', 'nextMark'])
      if (o.source?.[k]) links.push(o.source[k]);
  }
  const txKey = lang + ':' + links.map((x) => x.transactionHash).join();
  if ($('tx').dataset.key !== txKey) {
    $('tx').dataset.key = txKey;
    $('tx').replaceChildren();
    const unique = [
      ...new Map(
        links
          .filter((x) => /^0x[0-9a-f]{64}$/i.test(x.transactionHash || ''))
          .map((x) => [x.transactionHash, x]),
      ).values(),
    ];
    for (const x of unique) {
      const a = node('a', `Block ${x.blockNumber} · ${x.transactionHash}`);
      a.href = '/tx/' + x.transactionHash;
      a.onclick = (e) => {
        e.preventDefault();
        openReceipt(a.href);
      };
      $('tx').append(a);
    }
    if (!unique.length) $('tx').append(node('p', t('まだ実行記録がありません。', 'No run evidence yet.')));
  }
  put('model-heading', t('モデルと計算', 'Model and computation'));
  put(
    'neural',
    p?.neural
      ? `${p.neural.neuronsPerIndividual.toLocaleString()} ${t('神経 / 個体', 'neurons / fly')} · ${p.neural.inferenceMs.toFixed(1)} ms / decision`
      : 'MaleCNS',
  );
  put(
    'model-limits',
    t(
      '実測MaleCNS接続構造を使い、動力学・感覚変換・行動readoutは人工設計です。感情や生物学的忠実性の実証ではありません。',
      'Measured MaleCNS topology; engineered dynamics, sensory mapping and action readout. This does not establish biological fidelity or measured emotions.',
    ),
  );
  put('model-link', t('モデルの来歴を確認', 'Inspect model provenance'));
  $('model-link').href = `/models/${$('variant').value}/${app}`;
  $('aqua-proof').replaceChildren();
  if (app === 'aqua' && state?.aquaState) {
    const current = state.aquaState[$('variant').value];
    $('aqua-proof').append(
      node('h3', t('共有ウォレットと登録済み戦略', 'Shared wallet and registered strategies')),
      node('p', current.wallet),
    );
    current.strategies.forEach((hashes, i) => {
      $('aqua-proof').append(
        node('p', `${['MOMO', 'SORA'][i]} · ${hashes.length} ${t('件登録中', 'registered')}`),
      );
      for (const hash of hashes) $('aqua-proof').append(node('p', hash, 'strategy-hash'));
    });
  }

  if (app === 'aqua')
    for (const [i, o] of (p?.outcomes || []).entries()) {
      $('aqua-proof').append(
        node('h3', ['MOMO', 'SORA'][i]),
        node(
          'p',
          `${t('評価価格比', 'Valuation price ratio')}: ${Number(o.metrics?.relativeMark).toFixed(6)}× · ${t('入力', 'Input')} block ${o.source?.input?.blockNumber} → ${t('評価', 'Valuation')} block ${o.source?.nextMark?.blockNumber}`,
        ),
        node(
          'p',
          t(
            '仮想提示は1戦略につき各トークン100。共有ウォレットの同じ資産を参照し、別々に預け入れているわけではありません。',
            'Each active strategy offers 100 of each token virtually. Strategies refer to the same shared-wallet assets; they are not separate deposits.',
          ),
        ),
      );
    }
  put('learning-heading', t('保存済みの学習結果', 'Saved learning evaluations'));
  put(
    'learning-help',
    t(
      '行動結果を集めてreadoutを学習し、評価が改善した個体だけ採用します。全工程には時間がかかります。表は過去に完了した実験の結果です。',
      'Collect outcomes, fit a readout, and adopt only improved individuals. The full job takes time. This table contains previously completed experiments.',
    ),
  );
  put('th-model', t('モデル', 'Model'));
  put('th-before', t('学習前', 'Before'));
  put('th-after', t('候補', 'Candidate'));
  put('th-test', t('別条件', 'New test'));
  $('comparison').replaceChildren();
  for (const v of ['full', 'legacy']) {
    const r = state?.reports?.[`${app}:${v}`];
    if (!r) continue;
    const row = node('tr');
    [v, ...['before', 'after', 'test'].map((k) => r[k].map((x) => sign(x, 2)).join(' / '))].forEach((x) =>
      row.append(node('td', x)),
    );
    $('comparison').append(row);
  }
  put(
    'learning-unit',
    t(
      `MOMO / SORA の順。単位：${app === 'market' ? units() : app === 'aqua' ? '代理評価 pt' : '学習用報酬 pt（みつの個数とは別）'}`,
      `MOMO / SORA. Unit: ${app === 'market' ? units() : app === 'aqua' ? 'proxy points' : 'training reward points (not nectar count)'}`,
    ),
  );
  put('summary', p?.report ? `Policy v${p.report.versions.join(' / v')}` : '');
}
async function openReceipt(url) {
  put('receipt-title', t('トランザクションの記録', 'Transaction receipt'));
  $('receipt-body').replaceChildren(node('p', t('読み込み中…', 'Loading…')));
  if (!$('receipt-dialog').open) $('receipt-dialog').showModal();
  try {
    const r = await fetch(url);
    if (!r.ok) throw Error(`HTTP ${r.status}`);
    const x = await r.json();
    $('receipt-body').replaceChildren(node('p', 'Anvil · 31337'));
    for (const [label, value] of [
      [t('ハッシュ', 'Hash'), x.hash || x.transactionHash],
      [t('状態', 'Status'), Number(x.status) === 1 ? t('成功', 'Success') : t('失敗', 'Failed')],
      [t('ブロック', 'Block'), x.blockNumber],
      ['From', x.from],
      ['To', x.to],
      [t('使用ガス（gas単位）', 'Gas used (gas units)'), x.gasUsed],
    ]) {
      const row = node('div', undefined, 'receipt-row');
      row.append(node('strong', label), node('span', String(value)));
      $('receipt-body').append(row);
    }
    const a = node('a', t('元のJSONを開く', 'Open raw JSON'));
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    $('receipt-body').append(a);
  } catch (e) {
    $('receipt-body').replaceChildren(node('p', e.message));
  }
}
$('app-guide').addEventListener('click', (e) => {
  const a = e.target.closest('.guide-trace a');
  if (a) {
    e.preventDefault();
    openReceipt(a.href);
  }
});
async function poll() {
  try {
    const r = await fetch('/api/state');
    if (!r.ok) throw Error(`HTTP ${r.status}`);
    state = await r.json();
    connected = true;
    for (const a of apps) {
      const p = state.latest[a],
        h = history[a];
      if (!p?.snapshot) continue;
      if (h.run !== p.startedAt) {
        h.run = p.startedAt;
        h.tick = 0;
        h.points = [{ tick: 0, values: [0, 0] }];
      }
      if (p.tick !== h.tick) {
        h.tick = p.tick;
        h.points.push({
          tick: p.tick,
          values: p.snapshot.flies.map((f) =>
            a === 'market' ? amount(f.pnl) : a === 'foraging' ? f.score : f.reward,
          ),
        });
        if (h.points.length > 1000) h.points.splice(1, 1);
      }
    }
    render();
  } catch (e) {
    connected = false;
    render();
    put(
      'error',
      t(
        '接続が途切れました。最後の観測値を表示しています。',
        'Connection lost. Showing the last observation.',
      ),
    );
  }
}
let lastFrame = 0;
function text(c, str, x, y, size = 13, color = '#ecf5df', align = 'center') {
  c.font = `600 ${size}px system-ui`;
  c.fillStyle = color;
  c.textAlign = align;
  c.fillText(str, x, y);
}
function drawFly(c, x, y, heading, i, p) {
  const s = p?.snapshot?.flies?.[i],
    learning = p?.phase === 'training';
  c.save();
  c.translate(x, y);
  c.shadowColor = colors[i];
  c.shadowBlur = 17;
  c.strokeStyle = colors[i];
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(0, 16, 27, 8, 0, 0, Math.PI * 2);
  c.stroke();
  c.shadowBlur = 0;
  const size = 78;
  c.save();
  if (app === 'foraging' && !learning) c.rotate(heading + Math.PI / 2);
  if (assets.bioagent.complete && assets.bioagent.naturalWidth)
    c.drawImage(assets.bioagent, -size / 2, -size / 2, size, size);
  c.restore();
  text(c, ['MOMO', 'SORA'][i], 0, 58, 11, colors[i]);
  const label = thought(p, i);
  if (label) {
    c.font = '600 12px system-ui';
    const width = c.measureText(label).width + 24;
    c.fillStyle = learning ? '#eedff6' : '#f9f4dd';
    c.beginPath();
    c.roundRect(-width / 2, -78, width, 27, 11);
    c.fill();
    text(c, label, 0, -60, 12, '#344739');
  }
  c.restore();
}
function draw(now) {
  requestAnimationFrame(draw);
  if (now - lastFrame < 1000 / 30) return;
  lastFrame = now;
  const canvas = $('arena'),
    r = canvas.getBoundingClientRect(),
    ratio = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(r.width * ratio) || canvas.height !== Math.round(r.height * ratio)) {
    canvas.width = Math.round(r.width * ratio);
    canvas.height = Math.round(r.height * ratio);
  }
  const c = canvas.getContext('2d');
  c.setTransform(ratio, 0, 0, ratio, 0, 0);
  const w = r.width,
    h = r.height;
  c.clearRect(0, 0, w, h);
  const mobile = w <= 700,
    side = mobile ? 35 : w <= 1000 ? 270 : 350,
    b = {
      x: side,
      y: mobile ? 140 : 135,
      w: Math.max(180, w - side * 2),
      h: mobile ? 255 : Math.max(270, h - 360),
    };
  const p = state?.latest?.[app],
    snapshot = p?.snapshot;
  if (app === 'foraging') {
    if (!snapshot) return;
    const xy = (f) => ({ x: b.x + (f.x / 36) * b.w, y: b.y + (f.y / 22) * b.h });
    for (const hazard of snapshot.world.hazards) {
      const v = xy(hazard);
      c.fillStyle = '#eeb89818';
      c.strokeStyle = '#eb9270a6';
      c.lineWidth = 2;
      c.setLineDash([5, 5]);
      c.beginPath();
      c.ellipse(v.x, v.y, (hazard.radius / 36) * b.w, (hazard.radius / 22) * b.h, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.setLineDash([]);
    }
    for (const food of snapshot.world.foods) {
      const v = xy(food);
      c.save();
      c.shadowColor = '#ffc56d';
      c.shadowBlur = 14;
      if (assets['sugar-crystal'].complete && assets['sugar-crystal'].naturalWidth)
        c.drawImage(assets['sugar-crystal'], v.x - 21, v.y - 21, 42, 42);
      c.restore();
    }
    snapshot.flies.forEach((f, i) => {
      const v = xy(f),
        old = visuals[i];
      if (!old.x || reducedMotion.matches || p.phase === 'training') {
        old.x = v.x;
        old.y = v.y;
      } else {
        old.x += (v.x - old.x) * 0.2;
        old.y += (v.y - old.y) * 0.2;
      }
      drawFly(c, old.x, old.y, f.heading, i, p);
    });
  } else if (app === 'market') {
    if (!snapshot) return;
    const points = history.market.points,
      span = Math.max(1, ...points.flatMap((p) => p.values.map(Math.abs)));
    const height = Math.min(260, b.h),
      zero = b.y + height / 2;
    c.strokeStyle = '#aacaa337';
    c.lineWidth = 1;
    for (const y of [zero - height / 2, zero, zero + height / 2]) {
      c.beginPath();
      c.moveTo(b.x, y);
      c.lineTo(b.x + b.w, y);
      c.stroke();
    }
    text(c, `0 ${units()}`, b.x, zero - 10, 10, '#bacbb6', 'left');
    text(c, `+${span.toFixed(2)}`, b.x, b.y - 14, 10, '#bacbb6', 'left');
    text(c, `−${span.toFixed(2)}`, b.x, b.y + height + 18, 10, '#bacbb6', 'left');
    for (let i = 0; i < 2; i++) {
      c.strokeStyle = colors[i];
      c.lineWidth = 3;
      c.beginPath();
      points.forEach((p, j) => {
        const x = b.x + (p.tick / Math.max(points.at(-1)?.tick || 1, 1)) * b.w,
          y = zero - (p.values[i] / span) * (height / 2);
        j ? c.lineTo(x, y) : c.moveTo(x, y);
      });
      c.stroke();
      drawFly(c, b.x + b.w * (i === 0 ? 0.28 : 0.72), b.y + height + 115, 0, i, p);
      text(
        c,
        `${sign(amount(snapshot.flies[i].pnl))} ${units()}`,
        b.x + b.w * (i === 0 ? 0.28 : 0.72),
        b.y + height + 192,
        14,
        colors[i],
      );
    }
  } else {
    const center = b.x + b.w / 2,
      walletY = b.y + (mobile ? 265 : 435);
    if (!mobile) {
      c.strokeStyle = '#c7e3bf66';
      c.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) {
        c.setLineDash(p?.decisions?.[i]?.action === 2 ? [4, 5] : []);
        c.beginPath();
        c.moveTo(center, walletY - 28);
        c.lineTo(b.x + b.w * (i === 0 ? 0.25 : 0.75), b.y + 352);
        c.stroke();
      }
      c.setLineDash([]);
      c.fillStyle = '#173b31ed';
      c.beginPath();
      c.roundRect(center - 120, walletY - 25, 240, 48, 14);
      c.fill();
      text(c, t('同じウォレットの資産を共有', 'One wallet · shared assets'), center, walletY - 4, 12);
      text(
        c,
        t('仮想提示枠：各トークン100', 'Virtual offer: 100 of each token'),
        center,
        walletY + 13,
        10,
        '#c2d9ad',
      );
    }
    const aw = Math.min(220, b.w / 2 - 12);
    for (let i = 0; i < 2; i++) {
      const x = b.x + b.w * (i === 0 ? 0.25 : 0.75),
        y = b.y + (mobile ? 95 : 170),
        f = snapshot?.flies?.[i],
        a = p?.decisions?.[i]?.action;
      c.fillStyle = '#ffffff06';
      c.strokeStyle = colors[i] + '55';
      c.lineWidth = 1;
      c.beginPath();
      c.roundRect(x - aw / 2, y - 35, aw, mobile ? 170 : 210, 22);
      c.fill();
      c.stroke();
      if (snapshot) {
        drawFly(c, x, y + 30, 0, i, p);
        text(
          c,
          a === 2
            ? t('流動性を撤回', 'Withdrawn')
            : a === undefined
              ? '—'
              : `${t('提示幅', 'Spread')} ${(f.last.spread / 100).toFixed(2)}%`,
          x,
          y + 120,
          12,
          colors[i],
        );
        text(c, `${f.fills} ${t('回約定', 'fills')}`, x, y + 144, 11, '#bdcdb6');
      }
    }
  }
}
translate();
poll();
setInterval(poll, 500);
requestAnimationFrame(draw);
