import { WORLD_SCHEMA } from '../../packages/bio_agent/browser/tx-world.js';
import { BrowserProvider, Contract } from 'ethers';
import abi from '../../contracts/abi/BioAgentRegistry.json';
import { addTxFood, statusFoodEvent } from '../../packages/bio_agent/browser/tx-food.js';
import { MALE_CNS, verifyMaleAssets } from '../../packages/bio_agent/connectome/male-cns.js';
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
    this.foodStorageKey = `tx-food-consumed:${config.chainId}:${config.registryAddress.toLowerCase()}`;
    this.consumedFood = new Set(JSON.parse(localStorage.getItem(this.foodStorageKey) || '[]'));
    this.lastTx = null;
    this.message = `${config.networkName} · Loading registered agents`;
    this.stage = 'connecting';
    this.syncing = false;
  }
  persistFood() {
    for (const event of this.arena.world.foodEvents || [])
      if (event.consumed) this.consumedFood.add(event.id);
    localStorage.setItem(this.foodStorageKey, JSON.stringify([...this.consumedFood]));
  }
  restoreFood() {
    for (const e of this.arena.world.foodEvents || []) if (this.consumedFood.has(e.id)) e.consumed = true;
    this.arena.world.foods = this.arena.world.foods.filter((f) => !this.consumedFood.has(f.id));
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
    if (digest !== this.config.modelHash && this.config.modelHash !== MALE_CNS.graphSha256)
      throw new Error('モデル manifest が登録内容と一致しません');
    const snapshot = await request('/api/chain/snapshot');
    if (snapshot.agents.length !== this.config.agentIds.length)
      throw new Error('Registered agent count mismatch');
    if (reset) {
      const paused = this.arena.paused;
      Object.assign(
        this.arena,
        new Arena(this.arena.seed, { agentCount: this.config.agentIds.length, txFood: true }),
      );
      this.arena.paused = paused;
      this.seen.clear();
      this.lastTx = null;
      this.arena.log('system', 'CHAIN RESYNC', 'チェーンの巻戻りを検知。現在の入力から新しい競争を開始');
    }
    if (!snapshot.environment) throw Error('Confirmed environment TX required');
    this.checkEvent(snapshot.environment);
    this.arena.applyWorld(snapshot.environment);
    this.seen.add(snapshot.environment.eventId);
    for (const agent of snapshot.agents) {
      this.checkEvent(agent.cause);
      this.arena.applyAgentStatus(agent.agentId, agent.status, agent.cause);
      this.seen.add(agent.cause.eventId);
    }
    for (const event of snapshot.events || [])
      if (event.name === 'BioAgentStatusUpdated')
        addTxFood(this.arena.world, statusFoodEvent(event), this.consumedFood);
    this.restoreFood();
    this.cursor = { blockNumber: snapshot.blockNumber, blockHash: snapshot.blockHash };
    this.ready = true;
    this.stage = 'connected';
    this.message = `${this.config.networkName} · ${snapshot.agents.length} registered agents connected`;
    this.notify();
  }
  checkEvent(event) {
    if (
      String(event.chainId) !== String(this.config.chainId) ||
      event.registryAddress.toLowerCase() !== this.config.registryAddress.toLowerCase() ||
      !this.config.agentIds.includes(event.agentId)
    )
      throw new Error('想定外のコントラクトイベント');
  }
  ingest(events) {
    for (const event of events) {
      this.checkEvent(event);
      if (this.seen.has(event.eventId)) continue;
      if (event.name === 'BioAgentStimulusAccepted') {
        if (event.schema === WORLD_SCHEMA && event.agentId === '1') this.arena.applyWorld(event);
        this.seen.add(event.eventId);
        continue;
      }
      if (event.name !== 'BioAgentStatusUpdated') continue;
      const fly = this.arena.flies[Number(event.agentId) - 1];
      if (fly.chain && BigInt(event.status.revision) !== BigInt(fly.chain.revision) + 1n)
        throw Object.assign(new Error('revision の欠番を検知'), { reset: true });
      const before = this.arena.world.foods.length;
      this.arena.applyAgentStatus(event.agentId, event.status, event);
      if (this.arena.finished && this.arena.world.foods.length > before) {
        const paused = this.arena.paused;
        this.arena.nextRound();
        this.arena.paused = paused;
      }
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
          this.message = `${this.config.networkName} · Reconnected`;
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
  async connectWallet() {
    if (!window.ethereum?.request)
      throw new Error('Browser wallet required / ブラウザーウォレットが必要です');
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainId = '0x' + BigInt(this.config.chainId).toString(16);
    if (BigInt(await window.ethereum.request({ method: 'eth_chainId' })) !== BigInt(chainId))
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
    const provider = new BrowserProvider(window.ethereum, 'any'),
      signer = await provider.getSigner();
    this.wallet = { provider, signer, address: await signer.getAddress() };
    return this.wallet;
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
      let sent;
      if (this.config.walletMode === 'browser') {
        await this.connectWallet();
        if (this.wallet.address.toLowerCase() !== fly.chain.cause.writer.toLowerCase())
          throw new Error('Only the agent owner can send; scheduled stimuli remain available to watch.');
        const registry = new Contract(this.config.registryAddress, abi, this.wallet.signer);
        const tx = await registry.updateStatus(
          agentId,
          fly.chain.revision,
          status.activity,
          status.energy,
          status.stimulus,
        );
        sent = { transactionHash: tx.hash, agentId, stage: 'submitted' };
      } else {
        sent = await request('/api/chain/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId, expectedRevision: fly.chain.revision, ...status }),
        });
      }
      this.lastTx = { ...sent, applied: false };
      if (fly.chain?.cause.transactionHash === sent.transactionHash) {
        this.lastTx.applied = true;
        this.lastTx.event = fly.chain.cause;
      }
      this.stage = 'submitted';
      this.message = `送信済み ${sent.transactionHash}`;
      this.notify();
      for (let i = 0; i < 180; i++) {
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
        await new Promise((r) => setTimeout(r, this.config.walletMode === 'browser' ? 1000 : 250));
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
