// Batch independent receipt/block reads to keep history replay within Worker request limits.
export function batchedRpc(endpoint, fetcher = fetch) {
  let pending = [],
    sequence = 0;
  async function flush() {
    const batch = pending;
    pending = [];
    for (let offset = 0; offset < batch.length; offset += 20) {
      const group = batch.slice(offset, offset + 20);
      try {
        const response = await fetcher(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            group.map(({ id, method, params }) => ({ jsonrpc: '2.0', id, method, params })),
          ),
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) throw Error('RPC unavailable');
        const rows = await response.json();
        if (!Array.isArray(rows)) throw Error('Invalid RPC batch');
        const byId = new Map(rows.map((row) => [row.id, row]));
        for (const item of group) {
          const row = byId.get(item.id);
          if (!row || row.error || !('result' in row)) item.reject(Error('RPC read failed'));
          else item.resolve(row.result);
        }
      } catch (error) {
        for (const item of group) item.reject(error);
      }
    }
  }
  return (method, params) =>
    new Promise((resolve, reject) => {
      pending.push({ id: ++sequence, method, params, resolve, reject });
      if (pending.length === 1) queueMicrotask(flush);
    });
}
