// Describe recorded decisions and receipts, not invented biological intentions.
export function narrative(f, state, ja = false) {
  const t = (en, jp) => (ja ? jp : en);
  const token = state.config.symbols[0],
    quote = state.config.symbols[1];
  const signed = (x) => (x >= 0 ? '+' : '') + x.toFixed(4);
  const completed = f.result?.cycle === state.tick;
  if (state.running && (state.phase === 'thinking' || f.status === 'thinking'))
    return {
      badge: '?',
      title: t('Reading the market…', '市場と残高を考え中…'),
      reason: t('Price + holdings → MaleCNS', '価格・保有比率 → MaleCNS'),
      result: null,
    };
  if (state.running && state.phase === 'learning')
    return {
      badge: '?',
      title: t('Learning from this result', 'この結果を学び直し中'),
      reason: t('Updating the action readout', '次の判断に使う重みを更新'),
      result: null,
    };
  const result = completed
    ? `${f.result.sharedWallet ? t('Shared wallet Δ', '共有口座の増減') : t('Wallet Δ', '口座の増減')} ${signed(f.result.valuationChange)} ${quote}`
    : null;
  if (f.role === 'maker') {
    if (f.status === 'idle')
      return {
        badge: 'LP',
        title: t('Ready to offer liquidity', '流動性の提示を準備'),
        reason: t('My strategy uses the shared wallet', '共有ウォレットで私の戦略を動かす'),
        result: null,
      };
    const withdrawn = f.status === 'withdrawn';
    return {
      badge: withdrawn ? 'WAIT' : 'LP',
      title: withdrawn
        ? t('My offer is withdrawn', '私の提示は撤回中')
        : t(`Offer spread: ${f.spread} bps`, `提示幅：${f.spread} bps`),
      reason: completed
        ? f.result.fills
          ? t(`${f.result.fills} fills on my offer`, `私の提示で${f.result.fills}件約定`)
          : t('No fill on my offer this cycle', '今回は私の提示に約定なし')
        : t('Updating my Aqua strategy', 'Aquaの提示条件を更新中'),
      result,
      delta: completed ? f.result.valuationChange : null,
      note: f.exploration
        ? t('Exploratory decision', '探索で選んだ行動')
        : t('Neural readout decision', '神経活動の読み出しで選択'),
    };
  }
  const holding = Number.isFinite(f.holding)
    ? `${Math.round(f.holding * 100)}% → ${Math.round(f.target * 100)}%`
    : null;
  if (f.status === 'hold' || f.status === 'idle')
    return {
      badge: 'WAIT',
      title: t('Staying here · no order', 'ここで待機・発注なし'),
      reason: holding
        ? `${token}: ${holding} ${t('target', 'が目標')}`
        : t('Waiting for a market input', '市場からの入力を待っています'),
      result,
      delta: completed ? f.result.valuationChange : null,
    };
  const buy = f.status === 'buy';
  const title = t(`${buy ? 'Buy' : 'Sell'} ${token}`, `${token}を${buy ? '買う' : '売る'}`);
  if (!f.trade)
    return {
      badge: '…',
      title,
      reason: t('Comparing quotes / waiting for receipt', '見積もり比較・約定確認中'),
      result: null,
      note: f.exploration
        ? t('Exploring a different action', '別の行動を探索中')
        : holding
          ? `${token}: ${holding}`
          : null,
    };
  const tx = f.trade,
    options = tx.quotes;
  const alternative = options.find((o) => o.route !== tx.route);
  const difference = alternative ? Number(options[0].out) - Number(alternative.out) : null;
  const routeReason = alternative
    ? difference > 1e-8
      ? t(
          `${tx.route}: +${difference.toFixed(4)} ${tx.output} vs ${alternative.route}`,
          `${tx.route}へ：${alternative.route}より受取 +${difference.toFixed(4)} ${tx.output}`,
        )
      : t(`${tx.route}: tied best quote`, `${tx.route}へ：最良見積もりが同額`)
    : t(`${tx.route}: only available venue`, `${tx.route}へ：利用可能な経路`);
  return {
    badge: 'TX',
    title,
    reason: routeReason,
    result,
    delta: completed ? f.result.valuationChange : null,
    note: t(
      `Received ${Number(tx.amountOut).toFixed(4)} ${tx.output} · not profit`,
      `受取 ${Number(tx.amountOut).toFixed(4)} ${tx.output}・利益額ではありません`,
    ),
    decision:
      (f.exploration ? t('Exploring', '探索行動') : t('Readout decision', '読み出しの判断')) +
      (holding ? ` · ${token} ${holding}` : ''),
    hash: tx.hash,
  };
}
