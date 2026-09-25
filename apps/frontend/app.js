const el = (id) => document.getElementById(id);

async function request(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}

async function refresh() {
  const { runs } = await request('/api/runs');
  el('runs').replaceChildren();
  for (const run of runs) {
    const row = document.createElement('tr');
    for (const value of [run.id, new Date(run.created_at).toLocaleString('ja-JP'), run.stimulus.source, run.stimulus.block_number, run.state.activation.toFixed(2), run.state.action]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    el('runs').append(row);
  }
  if (runs.length) {
    el('action').textContent = runs[0].state.action;
    el('activation').textContent = runs[0].state.activation.toFixed(2);
    el('model').textContent = runs[0].state.model_version;
  }
  el('status').textContent = runs.length ? `最近の ${runs.length} 件を表示` : 'まだ実行はありません。模擬入力を実行してください。';
}

el('step').addEventListener('click', async () => {
  el('step').disabled = true;
  try {
    await request('/api/demo/step', { method: 'POST' });
    await refresh();
  } catch (error) {
    el('status').textContent = `実行結果を確認できませんでした: ${error.message}`;
  } finally {
    el('step').disabled = false;
  }
});
refresh().catch((error) => { el('status').textContent = `接続できません: ${error.message}`; });
