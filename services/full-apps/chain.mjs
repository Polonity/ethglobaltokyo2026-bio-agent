import defaultWorld from '../../packages/bio_agent/browser/foraging-world.json' with { type: 'json' };
import { WORLD_SCHEMA, validateWorldInput } from '../../packages/bio_agent/browser/tx-world.js';
// Dedicated Anvil-only experiment. Actual Uniswap V3 and Aqua test-token effects.
import {
  Contract,
  ContractFactory,
  JsonRpcProvider,
  Interface,
  MaxUint256,
  parseEther,
  AbiCoder,
  keccak256,
  toUtf8Bytes,
  toUtf8String,
} from 'ethers';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { AquaProtocolContract } from '@1inch/aqua-sdk';
import { Address, HexString } from '@1inch/sdk-core';
import { acquireExperimentLock } from './lock.mjs';
import { verifyAquaFork } from './fork.mjs';
const atom = 10n ** 18n;
const coder = AbiCoder.defaultAbiCoder();
const strategyTypes = ['uint256', 'uint256', 'uint256', 'bytes32', 'bytes32'];
const swapAbi = new Interface([
  'event Swap(address indexed sender,address indexed recipient,int256 amount0,int256 amount1,uint160 sqrtPriceX96,uint128 liquidity,int24 tick)',
]);
export class FullChain {
  constructor(url = process.env.FULL_RPC_URL || 'http://127.0.0.1:18550') {
    if (new URL(url).hostname !== '127.0.0.1') throw Error('Dedicated loopback Anvil only');
    this.provider = new JsonRpcProvider(url, 31337, {
      staticNetwork: true,
      cacheTimeout: -1,
      batchMaxCount: 1,
      batchStallTime: 0,
    });
    this.provider.pollingInterval = 20;
    this.url = url;
    this.stateDir = process.env.FULL_APPS_STATE_DIR || '.local/full-apps';
  }
  async receipt(transaction) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const receipt = await this.provider.getTransactionReceipt(transaction.hash);
      if (receipt) {
        if (receipt.status !== 1) throw Error(`Transaction reverted: ${transaction.hash}`);
        return receipt;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw Error(`Receipt timeout; inspect before retrying: ${transaction.hash}`);
  }
  async setup(brain) {
    this.releaseLock ||= acquireExperimentLock(`${this.stateDir}/experiment.lock`);
    const p = this.provider;
    if (
      BigInt(await p.send('eth_chainId', [])) !== 31337n ||
      !(await p.send('web3_clientVersion', [])).startsWith('anvil/')
    )
      throw Error('Anvil required');
    this.signer = await p.getSigner(0);
    this.taker = await p.getSigner(1);
    const officialFork = process.env.AQUA_FORK_MANIFEST
      ? await verifyAquaFork(p, process.env.AQUA_FORK_MANIFEST)
      : null;
    const modelHash = '0x' + createHash('sha256').update(JSON.stringify(brain)).digest('hex');
    let saved;
    try {
      saved = JSON.parse(await readFile(`${this.stateDir}/chain.json`, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (
      saved &&
      saved.modelHash === modelHash &&
      (saved.officialFork?.codeHash || null) === (officialFork?.codeHash || null) &&
      saved.rpcUrl === this.url &&
      (await p.getCode(saved.market.harness)) !== '0x' &&
      (await p.getBlock(saved.blockNumber))?.hash === saved.blockHash
    ) {
      this.config = saved;
      await this.attach();
      return saved;
    }
    const deploy = async (file, name, args = []) => {
      const a = JSON.parse(await readFile(file || `contracts/out/${name}.sol/${name}.json`));
      const c = await new ContractFactory(a.abi, a.bytecode.object || a.bytecode, this.signer).deploy(
        ...args,
      );
      await this.receipt(c.deploymentTransaction());
      return c;
    };
    const factory = await deploy(
      'node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json',
    );
    const a = await deploy('contracts/out/LocalMarket.sol/LocalMarketToken.json', '', ['NECTAR']);
    const b = await deploy('contracts/out/LocalMarket.sol/LocalMarketToken.json', '', ['POLLEN']);
    const harness = await deploy(null, 'FullLocalMarket', [
      await factory.getAddress(),
      await a.getAddress(),
      await b.getAddress(),
    ]);
    for (const token of [a, b])
      await this.receipt(await token.transfer(await harness.getAddress(), 100000n * atom));
    await this.receipt(await harness.seed());
    const aquaAddress = officialFork ? officialFork.aqua : await (await deploy(null, 'Aqua')).getAddress();
    const cfg = {
      rpcUrl: this.url,
      modelHash,
      brainHash: brain.brainHash,
      owner: await this.signer.getAddress(),
      market: {
        factory: await factory.getAddress(),
        harness: await harness.getAddress(),
        pool: await harness.pool(),
      },
      aqua: aquaAddress,
      officialFork,
      foragingWorldInput: true,
      registries: {},
      aquaApps: {},
    };
    for (const variant of ['full', 'legacy']) {
      cfg.registries[variant] = {};
      for (const app of ['foraging', 'market', 'aqua']) {
        const registry = await deploy(
          null,
          app === 'foraging' ? 'BioAgentStimulusRegistry' : 'BioAgentRegistry',
        );
        for (let i = 0; i < 2; i++)
          await this.receipt(
            await registry.registerAgent(modelHash, `http://127.0.0.1:8812/models/${variant}/${app}`),
          );
        cfg.registries[variant][app] = await registry.getAddress();
      }
      const t0 = await deploy('contracts/out/AquaFlyApp.sol/AquaTestToken.json', '', [`NECTAR-${variant}`]);
      const t1 = await deploy('contracts/out/AquaFlyApp.sol/AquaTestToken.json', '', [`POLLEN-${variant}`]);
      const app = await deploy(null, 'AquaFlyApp', [
        cfg.aqua,
        await t0.getAddress(),
        await t1.getAddress(),
        cfg.registries[variant].aqua,
      ]);
      for (const token of [t0, t1]) {
        await this.receipt(await token.approve(cfg.aqua, MaxUint256));
        await this.receipt(await token.transfer(await this.taker.getAddress(), 500n * atom));
        await this.receipt(await token.connect(this.taker).approve(await app.getAddress(), MaxUint256));
      }
      cfg.aquaApps[variant] = {
        app: await app.getAddress(),
        tokens: [await t0.getAddress(), await t1.getAddress()],
      };
    }
    const tip = await p.getBlock('latest');
    cfg.blockNumber = tip.number;
    cfg.blockHash = tip.hash;
    await mkdir(this.stateDir, { recursive: true });
    await writeFile(`${this.stateDir}/chain.json`, JSON.stringify(cfg, null, 2) + '\n');
    this.config = cfg;
    await this.attach();
    return cfg;
  }
  async attach() {
    if (!this.config.foragingWorldInput) {
      const a = JSON.parse(
        await readFile('contracts/out/BioAgentStimulusRegistry.sol/BioAgentStimulusRegistry.json'),
      );
      for (const variant of ['full', 'legacy']) {
        const registry = await new ContractFactory(a.abi, a.bytecode.object, this.signer).deploy();
        await this.receipt(registry.deploymentTransaction());
        for (let i = 0; i < 2; i++)
          await this.receipt(
            await registry.registerAgent(
              this.config.modelHash,
              `http://127.0.0.1:8812/models/${variant}/foraging`,
            ),
          );
        this.config.registries[variant].foraging = await registry.getAddress();
      }
      this.config.foragingWorldInput = true;
      await writeFile(`${this.stateDir}/chain.json`, JSON.stringify(this.config, null, 2) + '\n');
    }
    const artifact = async (file, name) =>
      JSON.parse(await readFile(`contracts/out/${file}.sol/${name}.json`));
    this.harness = new Contract(
      this.config.market.harness,
      (await artifact('FullLocalMarket', 'FullLocalMarket')).abi,
      this.signer,
    );
    this.registries = {};
    this.apps = {};
    const regAbi = (await artifact('BioAgentStimulusRegistry', 'BioAgentStimulusRegistry')).abi;
    const appAbi = (await artifact('AquaFlyApp', 'AquaFlyApp')).abi;
    const tokenAbi = (await artifact('AquaFlyApp', 'AquaTestToken')).abi;
    for (const variant of ['full', 'legacy']) {
      this.registries[variant] = Object.fromEntries(
        Object.entries(this.config.registries[variant]).map(([app, address]) => [
          app,
          new Contract(address, regAbi, this.signer),
        ]),
      );
      const c = this.config.aquaApps[variant];
      this.apps[variant] = {
        contract: new Contract(c.app, appAbi, this.signer),
        tokens: c.tokens.map((t) => new Contract(t, tokenAbi, this.signer)),
        active: [[], []],
      };
    }
    const logAbi = new Interface([
      'event Shipped(address maker,address app,bytes32 strategyHash,bytes strategy)',
      'event Docked(address maker,address app,bytes32 strategyHash)',
    ]);
    const logs = await this.provider.getLogs({
      address: this.config.aqua,
      fromBlock: this.config.blockNumber,
      toBlock: 'latest',
    });
    for (const log of logs) {
      const event = logAbi.parseLog(log);
      if (!event) continue;
      const variant = ['full', 'legacy'].find(
        (v) => this.config.aquaApps[v].app.toLowerCase() === event.args.app.toLowerCase(),
      );
      if (!variant || event.args.maker.toLowerCase() !== this.config.owner.toLowerCase()) continue;
      if (event.name === 'Shipped') {
        const [id] = coder.decode(strategyTypes, event.args.strategy);
        if (id === 1n || id === 2n) this.apps[variant].active[Number(id) - 1].push(event.args.strategyHash);
      } else
        for (const list of this.apps[variant].active) {
          const i = list.indexOf(event.args.strategyHash);
          if (i >= 0) list.splice(i, 1);
        }
    }
    this.sdk = new AquaProtocolContract(new Address(this.config.aqua));
  }
  async configureForaging(variant, seed) {
    const registry = this.registries[variant].foraging;
    const configuration = { ...defaultWorld, seed };
    const nonce = await registry.stimulusNonce(1);
    const receipt = await this.receipt(
      await registry.submitStimulus(1, nonce, WORLD_SCHEMA, toUtf8Bytes(JSON.stringify(configuration))),
    );
    const log = receipt.logs.find((l) => {
      try {
        return registry.interface.parseLog(l)?.name === 'BioAgentStimulusAccepted';
      } catch {
        return false;
      }
    });
    if (!log) throw Error('Environment event missing');
    const e = registry.interface.parseLog(log);
    return {
      name: e.name,
      chainId: '31337',
      registryAddress: await registry.getAddress(),
      agentId: '1',
      nonce: e.args.nonce.toString(),
      schema: e.args.schema,
      configuration: validateWorldInput(JSON.parse(toUtf8String(e.args.payload))),
      transactionHash: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: String(receipt.blockNumber),
      logIndex: String(log.index),
      receiptVerified: true,
    };
  }
  async stimulus(app, variant, agent, value) {
    const registry = this.registries[variant][app],
      status = await registry.getStatus(agent + 1);
    const receipt = await this.receipt(
      await registry.updateStatus(agent + 1, status.revision, 2, 7000, Math.round(value * 10000)),
    );
    const event = receipt.logs
      .map((l) => {
        try {
          return registry.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((e) => e?.name === 'BioAgentStatusUpdated');
    if (!event) throw Error('Confirmed stimulus event missing');
    return {
      kind: 'confirmed-bioagent-status',
      chainId: Number((await this.provider.getNetwork()).chainId),
      logIndex: receipt.logs.find((l) => {
        try {
          return registry.interface.parseLog(l)?.name === 'BioAgentStatusUpdated';
        } catch {
          return false;
        }
      }).index,
      registry: await registry.getAddress(),
      agentId: agent + 1,
      revision: String(event.args.revision),
      transactionHash: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      stimulus: Number(event.args.stimulus),
      energy: Number(event.args.energy),
      activity: Number(event.args.activity),
    };
  }
  async move(zeroForOne, amount = '1') {
    const receipt = await this.receipt(
      await this.harness.movePriceAmount(zeroForOne, parseEther(amount), { gasLimit: 500000n }),
    );
    const log = receipt.logs.find(
      (l) =>
        l.address.toLowerCase() === this.config.market.pool.toLowerCase() &&
        l.topics[0] === swapAbi.getEvent('Swap').topicHash,
    );
    if (!log) throw Error('Actual Uniswap Swap required');
    const parsed = swapAbi.parseLog(log),
      block = await this.provider.getBlock(receipt.blockNumber);
    if (block.hash !== receipt.blockHash) throw Error('Noncanonical market observation');
    return {
      kind: 'confirmed-uniswap-v3-swap',
      transactionHash: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      logIndex: log.index,
      pool: this.config.market.pool,
      sqrtPriceX96: String(parsed.args.sqrtPriceX96),
      price: (Number(parsed.args.sqrtPriceX96) / 2 ** 96) ** 2,
      amount,
      zeroForOne,
    };
  }
  async validateTape(tape) {
    if (tape.config.pool !== this.config.market.pool || tape.events.length < 911)
      throw Error('Current Anvil market tape required');
    for (const event of [tape.events[0], tape.events.at(-1)]) {
      if (
        event.pool !== this.config.market.pool ||
        (await this.provider.getBlock(event.blockNumber))?.hash !== event.blockHash
      )
        throw Error('Market tape belongs to a different chain history');
    }
    // The submission fork serves Aqua only; Aqua consumes confirmed Swap logs, not historical quotes.
    // Anvil fork historical calls to newly deployed V3 bytecode are not supported reliably.
    if (!this.config.officialFork) await this.quote('buy', atom, tape.events[0]);
  }
  async quote(side, amount, event) {
    if ((await this.provider.getBlock(event.blockNumber))?.hash !== event.blockHash)
      throw Error('Quote source changed');
    const output = await this.harness.quote.staticCall(side === 'sell', amount, {
      blockTag: event.blockNumber,
    });
    return {
      amountIn: String(amount),
      amountOut: String(output),
      blockNumber: event.blockNumber,
      blockHash: event.blockHash,
      outputIncludesPoolFeesAndImpact: true,
    };
  }
  async aquaAction(variant, agent, action, policyHash, stimulus, zeroForOne, fillAccepted = true) {
    const record = await this.stimulus('aqua', variant, agent, stimulus),
      app = this.apps[variant],
      cfg = this.config.aquaApps[variant],
      transactions = [record];
    const send = async (call) => {
      const receipt = await this.receipt(await this.signer.sendTransaction({ to: call.to, data: call.data }));
      transactions.push({
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: String(receipt.gasUsed),
      });
      return receipt;
    };
    for (const oldHash of app.active[agent])
      await send(
        this.sdk.dock({
          app: new Address(cfg.app),
          strategyHash: new HexString(oldHash),
          tokens: cfg.tokens.map((t) => new Address(t)),
        }),
      );
    app.active[agent] = [];
    const before = await Promise.all(app.tokens.map((t) => t.balanceOf(this.config.owner)));
    let fee = 0,
      filled = false,
      spread = 0;
    if (action !== 2) {
      spread = action === 0 ? 30 : 800;
      const bytes = coder.encode(strategyTypes, [
        agent + 1,
        BigInt(record.revision),
        spread,
        this.config.modelHash,
        policyHash,
      ]);
      const hash = keccak256(bytes);
      await send(
        this.sdk.ship({
          app: new Address(cfg.app),
          strategy: new HexString(bytes),
          amountsAndTokens: cfg.tokens.map((t) => ({ token: new Address(t), amount: parseEther('100') })),
        }),
      );
      app.active[agent] = [hash];
      if (fillAccepted) {
        const minimum = (atom * BigInt(10000 - spread)) / 10000n;
        const receipt = await this.receipt(
          await app.contract.connect(this.taker).swap(this.config.owner, bytes, zeroForOne, atom, minimum),
        );
        const event = receipt.logs
          .map((l) => {
            try {
              return app.contract.interface.parseLog(l);
            } catch {
              return null;
            }
          })
          .find((e) => e?.name === 'Filled');
        if (!event) throw Error('Aqua fill event missing');
        transactions.push({
          kind: 'actual-aqua-fill',
          transactionHash: receipt.hash,
          blockHash: receipt.blockHash,
          blockNumber: receipt.blockNumber,
          amountIn: String(event.args.amountIn),
          amountOut: String(event.args.amountOut),
        });
        fee = Number(event.args.amountIn - event.args.amountOut) / Number(atom);
        filled = true;
      }
    }
    const after = await Promise.all(app.tokens.map((t) => t.balanceOf(this.config.owner)));
    return {
      action,
      spread,
      filled,
      quoteAccepted: fillAccepted,
      fee,
      tokenChanges: after.map((v, i) => Number(v - before[i]) / Number(atom)),
      transactions,
      revision: record.revision,
    };
  }
  close() {
    this.provider.destroy();
    this.releaseLock?.();
    this.releaseLock = null;
  }
}
