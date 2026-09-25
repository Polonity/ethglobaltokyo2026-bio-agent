import { verifyMaleAssets } from '../../packages/bio_agent/connectome/male-cns.js';
import { Arena, MODEL } from '../../packages/bio_agent/browser/arena.js';
async function request(path, options) {
  const response = await fetch(path, options);
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || `HTTP ${response.status}`);
    error.reset = body.reset;
    throw error;
  }
  return body;
}
export class ChainSession {
  constructor(arena, config, notify) {
    this.arena = arena;
    this.config = config;
    this.notify = notify;
    this.ready = false;
    this.busy = false;
    this.cursor = null;
    this.seen = new Set();
    this.lastTx = null;
    this.message = 'Anvil の登録情報を読み込み中';
    this.stage = 'connecting';
    this.syncing = false;
  }
  async initialize(reset = false) {
    const manifestResponse = await fetch(`/models/${MODEL}.json`);
    const bytes = await manifestResponse.arrayBuffer();
    await verifyMaleAssets(JSON.parse(new TextDecoder().decode(bytes)));
    const digest =
      '0x' +
      [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
        .map((v) => v.toString(16).padStart(2, '0'))
        .join('');
    if (digest !== this.config.modelHash) throw new Error('モデル manifest が登録内容と一致しません');
    const snapshot = await request('/api/chain/snapshot');
    if (snapshot.agents.length !== 3) throw new Error('3匹の登録が必要です');
    if (reset) {
      const paused = this.arena.paused;
      Object.assign(this.arena, new Arena(this.arena.seed, { agentCount: 3 }));
      this.arena.paused = paused;
      this.seen.clear();
      this.lastTx = null;
      this.arena.log('system', 'CHAIN RESYNC', 'チェーンの巻戻りを検知。現在の入力から新しい競争を開始');
    }
    for (const agent of snapshot.agents) {
      this.checkEvent(agent.cause);
      this.arena.applyAgentStatus(agent.agentId, agent.status, agent.cause);
      this.seen.add(agent.cause.eventId);
    }
    this.cursor = { blockNumber: snapshot.blockNumber, blockHash: snapshot.blockHash };
    this.ready = true;
    this.stage = 'connected';
    this.message = 'Anvil 接続済み · 3匹の登録を確認';
    this.notify();
  }
  checkEvent(event) {
    if (
      event.chainId !== '31337' ||
      event.registryAddress.toLowerCase() !== this.config.registryAddress.toLowerCase() ||
      !this.config.agentIds.includes(event.agentId)
    )
      throw new Error('想定外のコントラクトイベント');
  }
  ingest(events) {
    for (const event of events) {
      if (event.name !== 'BioAgentStatusUpdated') continue;
      this.checkEvent(event);
      if (this.seen.has(event.eventId)) continue;
      const fly = this.arena.flies[Number(event.agentId) - 1];
      if (fly.chain && BigInt(event.status.revision) !== BigInt(fly.chain.revision) + 1n)
        throw Object.assign(new Error('revision の欠番を検知'), { reset: true });
      this.arena.applyAgentStatus(event.agentId, event.status, event);
      this.seen.add(event.eventId);
      if (this.lastTx?.transactionHash === event.transactionHash) {
        this.lastTx.applied = true;
        this.lastTx.event = event;
      }
    }
  }
  async sync() {
    if (this.syncing) return;
    this.syncing = true;
    try {
      if (!this.cursor) await this.initialize();
      else {
        const batch = await request(
          `/api/chain/events?after=${this.cursor.blockNumber}&hash=${this.cursor.blockHash}`,
        );
        this.ingest(batch.events);
        this.cursor = { blockNumber: batch.blockNumber, blockHash: batch.blockHash };
        this.ready = true;
        if (!this.busy && this.stage === 'offline') {
          this.stage = 'connected';
          this.message = 'Anvil に再接続しました';
        }
      }
    } catch (error) {
      this.ready = false;
      this.stage = 'offline';
      this.message = `接続待ち: ${error.message}`;
      if (error.reset) {
        try {
          await this.initialize(true);
        } catch (retry) {
          this.message = retry.message;
        }
      }
    } finally {
      this.syncing = false;
      this.notify();
    }
  }
  async send(agentId, status) {
    if (!this.ready || this.busy) throw new Error('接続または送信完了を待ってください');
    const fly = this.arena.flies[Number(agentId) - 1];
    this.busy = true;
    this.lastTx = null;
    this.stage = 'submitting';
    this.message = `Agent #${agentId} のトランザクションを送信中`;
    this.notify();
    try {
      const sent = await request('/api/chain/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, expectedRevision: fly.chain.revision, ...status }),
      });
      this.lastTx = { ...sent, applied: false };
      if (fly.chain?.cause.transactionHash === sent.transactionHash) {
        this.lastTx.applied = true;
        this.lastTx.event = fly.chain.cause;
      }
      this.stage = 'submitted';
      this.message = `送信済み ${sent.transactionHash}`;
      this.notify();
      for (let i = 0; i < 80; i++) {
        const receipt = await request(`/api/chain/receipt?hash=${sent.transactionHash}`);
        if (receipt.stage === 'reverted') throw new Error('トランザクションが revert しました');
        if (receipt.stage === 'mined') {
          this.stage = 'mined';
          this.message = `Block ${receipt.blockNumber} に採掘済み · イベント受信待ち`;
          await this.sync();
          if (this.lastTx.applied) {
            this.stage = 'applied';
            this.message = `Agent #${agentId} に適用済み · revision ${this.lastTx.event.status.revision}`;
            return this.lastTx;
          }
        }
        this.notify();
        await new Promise((r) => setTimeout(r, 250));
      }
      throw new Error('適用待ちです。Tx とイベントの記録を確認してください（自動再送はしません）');
    } catch (error) {
      this.stage = 'error';
      this.message = error.message;
      throw error;
    } finally {
      this.busy = false;
      this.notify();
    }
  }
}
