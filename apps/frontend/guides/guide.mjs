import { guideFor } from './content.mjs';
const titles = {
  ja: {
    body: '身体の状態',
    bubbles: '吹き出しとの関係',
    metrics: '数値の読み方',
    model: 'コネクトームが担う部分',
    learning: '学習と採用',
    tryIt: 'まず試すこと',
    full: '全神経アプリ',
    reduced: '7神経比較モード',
    browser: '従来のブラウザー版',
  },
  en: {
    body: 'Body state',
    bubbles: 'What bubbles mean',
    metrics: 'Reading the numbers',
    model: 'What the connectome does',
    learning: 'Learning and adoption',
    tryIt: 'Try this first',
    full: 'Full-population app',
    reduced: 'Seven-neuron comparison mode',
    browser: 'Original browser app',
  },
};
const el = (tag, text) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
};
function section(title, text) {
  const f = document.createDocumentFragment();
  f.append(el('h3', title), el('p', text));
  return f;
}
function definitions(rows) {
  const dl = el('dl');
  for (const [term, meaning] of rows) dl.append(el('dt', term), el('dd', meaning));
  return dl;
}
function mount(root, app, lang, mode, sheet = false) {
  const key = [app, lang, mode, sheet].join(':');
  if (root.dataset.guideKey === key) return;
  root.dataset.guideKey = key;
  root.classList.add('bio-guide');
  root.setAttribute('data-no-i18n', '');
  root.replaceChildren();
  const g = guideFor(app, lang, mode),
    w = titles[lang];
  root.append(
    el('div', `${w[mode]} · MaleCNS · ${g.title}`),
    el(sheet ? 'h1' : 'h3', g.name),
    el('p', g.goal),
  );
  const legend = el('div');
  legend.className = 'guide-legend';
  for (const [name, meaning] of g.legend) {
    const item = el('article');
    item.append(el('strong', name), el('p', meaning));
    legend.append(item);
  }
  root.append(legend);
  const route = el('p', g.flow.map(([name]) => name).join(' → '));
  route.className = 'guide-label';
  root.append(route);
  const flow = el('details');
  flow.open = sheet;
  flow.append(el('summary', g.flowTitle));
  const ol = el('ol');
  ol.className = 'guide-flow';
  for (const [name, meaning] of g.flow) {
    const item = el('li');
    item.append(el('strong', name), document.createTextNode(meaning));
    ol.append(item);
  }
  flow.append(ol, el('p', g.boundary));
  root.append(flow);
  const details = el('details');
  details.open = sheet;
  details.append(el('summary', g.more));
  for (const key of ['body', 'bubbles', 'model', 'learning']) details.append(section(w[key], g[key]));
  if (mode !== 'browser') details.append(el('p', g.phase));
  details.append(
    el('h3', w.metrics),
    definitions([...g.metrics, ...(mode === 'browser' ? [g.numbers[0], g.numbers[3]] : g.numbers)]),
    el('p', g.biology),
  );
  root.append(details);
  const trace = el('div');
  trace.className = 'guide-trace';
  trace.append(
    el(
      'strong',
      mode === 'browser' ? (lang === 'ja' ? '証拠の見つけ方' : 'Where to find evidence') : g.traceTitle,
    ),
    el(
      'p',
      mode === 'browser'
        ? lang === 'ja'
          ? 'この画面のTXリンク・観測値・学習結果のパネルで、入力の出典と行動を照合してください。下のシートには各表示の意味をまとめています。'
          : 'Use this screen’s TX links, observations and learning panels to connect inputs to actions. The sheet below explains each display.'
        : g.idle,
    ),
  );
  root.append(trace);
  root.append(section(w.tryIt, g.tryIt));
  const links = el('div');
  links.className = 'guide-links';
  const link = el('a', g.sheet);
  link.href = `/guides/sheet.html?app=${app}&mode=${mode}&lang=${lang}`;
  link.target = '_blank';
  link.rel = 'noopener';
  links.append(link);
  root.append(links);
}
function trace(root, p, app, lang) {
  if (!p?.decisions?.length) return;
  const target = root.querySelector('.guide-trace');
  target.replaceChildren(el('strong', guideFor(app, lang).traceTitle));
  const list = el('ol'),
    ja = lang === 'ja',
    o = p.outcomes?.[0];
  const input =
    app === 'foraging' ? o?.source?.statuses?.[0] : app === 'market' ? o?.source?.decision : o?.source?.input;
  const inputLine = el('li');
  if (input) {
    inputLine.append(
      document.createTextNode(
        ja
          ? app === 'foraging'
            ? `確認済み刺激 ${input.stimulus}/10000 = ${(input.stimulus / 10000).toFixed(2)}。 `
            : `価格履歴 ${Number(input.price).toFixed(5)} token1/token0。 `
          : app === 'foraging'
            ? `Confirmed stimulus ${input.stimulus}/10000 = ${(input.stimulus / 10000).toFixed(2)}. `
            : `Recorded price ${Number(input.price).toFixed(5)} token1/token0. `,
      ),
    );
    const a = el('a', `Block ${input.blockNumber} · ${input.transactionHash?.slice(0, 12)}…`);
    a.href = '/tx/' + input.transactionHash;
    a.target = '_blank';
    a.rel = 'noopener';
    inputLine.append(a);
  } else inputLine.textContent = ja ? '入力の出典を確認中' : 'Checking the input source';
  list.append(inputLine);
  const n = p.neural;
  list.append(
    el(
      'li',
      ja
        ? `MaleCNS ${n.neuronsPerIndividual.toLocaleString()}神経 / 個体 → 活動を集計 → 行動readout。累積神経step ${n.tick}。`
        : `MaleCNS ${n.neuronsPerIndividual.toLocaleString()} neurons / individual → activity summaries → action readout. Neural step ${n.tick}.`,
    ),
  );
  for (const [i, d] of p.decisions.entries()) {
    const f = p.snapshot?.flies?.[i],
      out = p.outcomes?.[i];
    let result;
    if (app === 'foraging')
      result = ja
        ? `蜜${f?.score ?? 0}個、${out?.metrics?.collected ? '今回は蜜を獲得' : out?.metrics?.hit ? '今回は危険に接触' : '今回は獲得なし'}`
        : `${f?.score ?? 0} nectar collected; ${out?.metrics?.collected ? 'collected this step' : out?.metrics?.hit ? 'hit a hazard' : 'no collection this step'}`;
    else if (app === 'market') result = `paper PnL ${(Number(f?.pnl ?? 0) / 1e18).toFixed(3)} token1`;
    else
      result = ja
        ? `${out?.metrics?.filled ? '実テスト約定あり' : 'この行動で約定なし'}、代理報酬 ${Number(out?.reward ?? 0).toFixed(3)}`
        : `${out?.metrics?.filled ? 'actual test fill' : 'no fill this action'}; proxy reward ${Number(out?.reward ?? 0).toFixed(3)}`;
    const actionNames =
      app === 'foraging'
        ? ja
          ? ['東へ', '南東へ', '南へ', '南西へ', '西へ', '北西へ', '北へ', '北東へ', '休息']
          : ['East', 'SE', 'South', 'SW', 'West', 'NW', 'North', 'NE', 'Rest']
        : app === 'market'
          ? ja
            ? ['待機', '買い', '売り']
            : ['Hold', 'Buy', 'Sell']
          : ja
            ? ['狭い提示', '広い提示', '撤回']
            : ['Tight quote', 'Wide quote', 'Withdraw'];
    list.append(
      el(
        'li',
        `${['MOMO', 'SORA'][i]} · Policy v${d.policyVersion} · ${ja ? '行動' : 'Action'} ${actionNames[d.action]} (#${d.action}) → ${result}`,
      ),
    );
  }
  target.append(
    list,
    el(
      'small',
      ja
        ? '直近に完了した行動の記録です。現在表示中の段階とタイミングが異なる場合があります。'
        : 'The most recently completed action; its timing may differ from the current phase.',
    ),
  );
}
const params = new URLSearchParams(location.search),
  sheet = Boolean(document.querySelector('[data-guide-sheet]'));
if (sheet) {
  const app = ['foraging', 'market', 'aqua'].includes(params.get('app')) ? params.get('app') : 'foraging';
  const mode = ['full', 'reduced', 'browser'].includes(params.get('mode')) ? params.get('mode') : 'full';
  const select = document.querySelector('#sheet-language');
  select.value = ['ja', 'en'].includes(params.get('lang')) ? params.get('lang') : 'system';
  const render = () => {
    const lang =
      select.value === 'system' ? (navigator.language.startsWith('ja') ? 'ja' : 'en') : select.value;
    document.documentElement.lang = lang;
    document.title = guideFor(app, lang, mode).name;
    document.querySelector('#sheet-print').textContent =
      lang === 'ja' ? '印刷 / PDF保存' : 'Print / Save PDF';
    document.querySelector('#sheet-back').textContent = lang === 'ja' ? 'アプリへ戻る' : 'Back to the app';
    document.querySelector('#sheet-back').href = app === 'foraging' ? '/' : '/' + app;
    mount(document.querySelector('[data-guide-sheet]'), app, lang, mode, true);
  };
  select.onchange = render;
  document.querySelector('#sheet-print').onclick = () => window.print();
  render();
} else {
  const roots = [...document.querySelectorAll('[data-bio-guide]')];
  for (const root of roots)
    if (root.dataset.mode === 'full' && ['foraging', 'market', 'aqua'].includes(location.pathname.slice(1)))
      root.dataset.app = location.pathname.slice(1);
  const render = () =>
    roots.forEach((root) =>
      mount(
        root,
        root.dataset.app || 'foraging',
        document.documentElement.lang === 'ja' ? 'ja' : 'en',
        root.dataset.mode || 'full',
      ),
    );
  new MutationObserver(render).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
  });
  render();
  addEventListener('bio-guide-state', ({ detail }) => {
    for (const root of roots) {
      root.dataset.app = detail.app;
      root.dataset.mode = detail.mode;
      mount(root, detail.app, detail.lang, detail.mode);
      trace(root, detail.p, detail.app, detail.lang);
    }
  });
}
