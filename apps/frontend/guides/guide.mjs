import { guideFor, bubbleGuide, bubbleSvg } from './content.mjs';
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
  const ja = lang === 'ja';
  root.append(
    el('div', `${w[mode]} · MaleCNS · ${ja ? 'ゲームの説明書' : 'Game manual'}`),
    el(sheet ? 'h1' : 'h3', g.name),
    el('h2', g.manual.mission),
    el('p', g.manual.role),
  );
  const start = el('section');
  start.className = 'guide-start';
  start.append(el('h3', ja ? '01 はじめてのプレイ' : '01 Your first play'));
  const steps = el('ol');
  for (const text of g.manual.steps) steps.append(el('li', text));
  start.append(steps);
  if (mode !== 'browser')
    start.append(
      el(
        'p',
        ja
          ? '途中で止めるには「停止」。進行中の動作が完了してから止まります。フェーズ表示は実行中・収集・学習・評価の進み具合を示します。'
          : 'Press Stop to end after the current action completes. The phase indicator tracks running, collection, learning and evaluation.',
      ),
    );
  root.append(start, el('h3', ja ? '02 画面の見方' : '02 Read the screen'));
  const visual = el('section');
  visual.className = 'guide-visuals';
  visual.append(el('h3', ja ? '実際の画面と見比べよう' : 'Match the manual to the actual screen'));
  visual.append(
    el(
      'p',
      ja
        ? 'ローカルアプリの実画面を切り出した図です。数値は撮影時の例です。番号の見出しから、このページの対応する場所へ移動できます。'
        : 'Crops of the actual local app. Values are examples from capture time. Numbered headings link to the matching area on this page.',
    ),
  );
  if (mode === 'reduced')
    visual.append(
      el(
        'p',
        ja
          ? '画像は全神経モードの参考画面です。選択中の7神経モードでは神経数と結果が異なります。'
          : 'Images show full mode for reference. Neuron counts and results differ in your selected seven-neuron mode.',
      ),
    );
  const names = ja
    ? ['操作する場所', 'ハエが反応する場所', '状態と成績', 'ブロックチェーンの証拠']
    : ['Where to act', 'Where flies respond', 'State and performance', 'Blockchain evidence'];
  const targets =
    mode !== 'browser'
      ? ['#live', '#arena', '#cards', '#tx']
      : {
          foraging: ['.control-panel', '#arena', '#body-readout', '#chain-panel'],
          market: ['.controls', '#field', '#cards', '.connection'],
          aqua: ['#send', '#brain', '#flies', '.evidence'],
        }[app];
  const explanations = ja
    ? [
        mode === 'browser'
          ? 'この操作で環境へ入力します。送信・適用と、画面上のローカル操作の違いは「はじめてのプレイ」を参照。'
          : '「現在の方策で動かす」で開始します。移動や売買の選択はハエが行います。',
        {
          foraging:
            '黄色い小粒＝蜜。桃色の円＝危険。顔のついた個体＝ハエ。蜜と危険はローカルの環境で、オンチェーン刺激と一緒に判断へ入力されます。',
          market:
            mode === 'browser'
              ? 'TOKEN0・TOKEN1・OBSERVEへの移動は保有・観察状態を表します。トークンを物理的に拾っているわけではありません。'
              : '線は観測した価格の履歴。顔は個体です。入力価格の出典はUniswapのSwapで、売買結果はペーパー口座に反映されます。',
          aqua:
            mode === 'browser'
              ? '光る図はMaleCNS部分回路の人工的な活動です。下の応答を戦略案へ変換します。'
              : '線は入力に使ったUniswap価格履歴です。feesは約定の手数料相当額。ハエの上下動は演出で、戦略は下のAction欄に表示されます。',
        }[app],
        mode === 'browser'
          ? '画面に表示された身体状態・保有状態・戦略を読みます。吹き出しは状態や行動の表現で、思考を直接読み取ったものではありません。'
          : '方策（Policy）＝使った方策、行動（Action）＝選んだ行動。Energy＝活動エネルギー、Fullness＝満腹度、Reserves＝蓄え。下の数値は各ゲームの成績です。',
        'ブロック・コントラクト・TXで入力や適用の出典を確認します。TXリンクを開くとreceiptを確認できます。ローカルAnvilの証拠です。',
      ]
    : [
        mode === 'browser'
          ? 'These controls change the environment. The first-play steps distinguish transaction submission from local actions.'
          : 'Run with current policy starts the experiment. The flies choose their own movement or trading actions.',
        {
          foraging:
            'Small yellow dots = nectar. Peach circles = hazards. Faces = flies. Food and hazards are local conditions, combined with onchain stimulus as decision inputs.',
          market:
            mode === 'browser'
              ? 'TOKEN0, TOKEN1 and OBSERVE show holding or observation states, not physical token collection.'
              : 'The line is observed price history; faces represent individuals. Uniswap Swap events supply prices; trade results affect paper accounts.',
          aqua:
            mode === 'browser'
              ? 'The glowing diagram shows artificial activity in a MaleCNS subcircuit. Its response is decoded into a strategy proposal.'
              : 'The line is input Uniswap price history; fees show gross fill differences. Fly bobbing is decorative. Read the chosen strategy in the Action card below.',
        }[app],
        mode === 'browser'
          ? 'Read body state, holdings or strategy here. Bubbles express state or actions, not directly decoded thoughts.'
          : 'Policy is the readout used; Action is the chosen action. Energy, Fullness and Reserves describe the body. The score depends on this game.',
        'Blocks, contracts and TXs identify input or application evidence. Open TX links to inspect receipts on local Anvil.',
      ];
  for (let i = 0; i < 4; i++) {
    const figure = el('figure'),
      heading = el(sheet ? 'strong' : 'a', `${i + 1}. ${names[i]}`);
    if (!sheet) {
      heading.href = '#';
      heading.onclick = (event) => {
        event.preventDefault();
        document.querySelector(targets[i])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
    }
    const img = el('img');
    img.src = `/guides/screens/${mode === 'browser' ? 'browser' : 'full'}-${app}-${lang}-${i + 1}.png`;
    img.alt = `${names[i]} — ${explanations[i]}`;
    const caption = el('figcaption');
    caption.append(heading, el('p', explanations[i]));
    figure.append(img, caption);
    visual.append(figure);
  }
  root.append(visual);
  const legend = el('div');
  legend.className = 'guide-legend';
  for (const [name, meaning] of g.legend) {
    const item = el('article');
    item.append(el('strong', name), el('p', meaning));
    legend.append(item);
  }
  root.append(legend);
  const bubbles = el('section');
  bubbles.className = 'guide-bubbles';
  bubbles.append(
    el('h3', ja ? '吹き出し図鑑：いま、どんな状況？' : 'Bubble field guide: what is happening?'),
  );
  bubbles.append(
    el(
      'p',
      ja
        ? '実際の表示文言に合わせた説明用の模式図です。同時にすべてが出るわけではありません。吹き出しは状態・判断・結果のラベルであり、感情の測定ではありません。'
        : 'Illustrations use the actual display labels; they are not live screenshots. These labels describe states, decisions and outcomes, not measured emotions.',
    ),
  );
  for (const group of bubbleGuide(app, lang, mode)) {
    bubbles.append(el('h3', group.title));
    if (group.id === 'browser' && mode !== 'browser')
      bubbles.append(
        el(
          'p',
          ja
            ? '以下は従来版だけの表示です。現在の全神経版には、この感情風の吹き出しは出ません。'
            : 'The following belong to the original browser app; these expressive captions do not appear in the full app.',
        ),
      );
    const grid = el('div');
    grid.className = 'bubble-grid';
    for (const item of group.items) {
      const figure = el('figure'),
        img = el('img'),
        caption = el('figcaption');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bubbleSvg(item));
      img.alt = item.label;
      caption.append(el('strong', item.label), el('p', item.meaning));
      figure.append(img, caption);
      grid.append(figure);
    }
    bubbles.append(grid);
    if (group.id === 'browser' && app === 'foraging')
      bubbles.append(
        el(
          'p',
          ja
            ? '表示の優先順位：学習 → 危険 → 獲得 → 休息 → 満腹 → 空腹 → 通常。たとえば空腹でも、直近で危険が記録されると「！」が優先されます。'
            : 'Priority: learning → danger → collection → rest → full → hungry → default. A recent danger record takes priority even when the fly is hungry.',
        ),
      );
    if (group.id === 'browser' && app === 'market')
      bubbles.append(
        el(
          'p',
          ja
            ? '表示の優先順位：学習 → 注文待ち → 保有中 → 見送り。買い／売り待ちは、約定完了とは区別します。'
            : 'Priority: learning → pending order → holding → waiting. Pending buy/sell captions do not mean a completed fill.',
        ),
      );
    if (group.id === 'browser' && app === 'aqua')
      bubbles.append(
        el(
          'p',
          ja
            ? '戦略の吹き出しが変わっても、まだ未反映の場合があります。「確認済み」とTXを照合してください。'
            : 'A changed strategy caption may still be unapplied. Check the confirmation state and TX.',
        ),
      );
  }
  root.append(bubbles);
  const status = el('details');
  status.open = sheet;
  status.append(el('summary', ja ? '身体・吹き出し・成績の読み方' : 'Body, bubbles and scores'));
  for (const key of ['body', 'bubbles']) status.append(section(w[key], g[key]));
  status.append(
    section(ja ? '成績と目標' : 'Scores and goals', g.manual.score),
    el('h3', w.metrics),
    definitions(g.metrics),
  );
  root.append(
    status,
    el('h3', ja ? '03 学び直して、もう一度' : '03 Learn and try again'),
    el('p', g.learning),
  );
  if (mode !== 'browser') root.append(el('p', g.phase));
  root.append(section(w.tryIt, g.tryIt));
  root.append(el('h3', ja ? '04 ゲームの裏側' : '04 Behind the game'));
  const flow = el('details');
  flow.open = sheet;
  flow.append(el('summary', g.flowTitle));
  const ol = el('ol');
  ol.className = 'guide-flow';
  for (const [name, meaning] of g.flow) {
    const item = el('li');
    item.append(el('strong', name.replace(/^[1-4]\s+/, '')), document.createTextNode(meaning));
    ol.append(item);
  }
  flow.append(ol, el('p', g.boundary));
  root.append(flow);
  const details = el('details');
  details.open = sheet;
  details.append(el('summary', g.more));
  details.append(
    section(w.model, g.model),
    el('h3', w.metrics),
    definitions(mode === 'browser' ? [g.numbers[0], g.numbers[3]] : g.numbers),
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
  const links = el('div');
  links.className = 'guide-links';
  const link = el('a', ja ? 'ゲームの説明書を開く・印刷する ↗' : 'Open / print the game manual ↗');
  link.href = `/guides/sheet.html?app=${app}&mode=${mode}&lang=${lang}`;
  link.target = '_blank';
  link.rel = 'noopener';
  links.append(link);
  root.append(links);
}
function trace(root, p, app, lang) {
  if (!p?.decisions?.length) return;
  const target = root.querySelector('.guide-trace');
  const traceKey = lang + ':' + p.decisions.map((d) => d.id).join(':');
  if (target.dataset.traceKey === traceKey) return;
  target.dataset.traceKey = traceKey;
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
