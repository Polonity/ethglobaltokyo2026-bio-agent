import {
  Contract,
  ContractFactory,
  JsonRpcProvider,
  AbiCoder,
  MaxUint256,
  parseEther,
  formatEther,
  keccak256,
} from 'ethers';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { AquaProtocolContract } from '@1inch/aqua-sdk';
import { Address, HexString } from '@1inch/sdk-core';
import { verifyAquaFork } from '../full-apps/fork.mjs';
import { acquireExperimentLock } from '../full-apps/lock.mjs';
const artifact = async (name, file = 'SharedFlyMarket') =>
  JSON.parse(await readFile(`contracts/out/${file}.sol/${name}.json`));
export class SharedChain {
  async init(modelHash) {
    this.dir = process.env.FULL_APPS_STATE_DIR || '.local/shared-market';
    await mkdir(this.dir, { recursive: true });
    this.unlock = acquireExperimentLock(`${this.dir}/chain.lock`);
    const url = process.env.SHARED_RPC_URL || 'http://127.0.0.1:18551';
    if (new URL(url).hostname !== '127.0.0.1') throw Error('Loopback Anvil only');
    this.p = new JsonRpcProvider(url, 31337, { staticNetwork: true, cacheTimeout: -1, batchMaxCount: 1 });
    this.p.pollingInterval = 30;
    if (
      BigInt(await this.p.send('eth_chainId', [])) !== 31337n ||
      !(await this.p.send('web3_clientVersion', [])).startsWith('anvil/')
    )
      throw Error('Anvil required');
    const fork = await verifyAquaFork(
      this.p,
      process.env.AQUA_FORK_MANIFEST || '.local/aqua-fork/upstream.json',
    );
    // Dedicated demo wallets; never use existing maker/taker accounts 0 and 1.
    this.signers = await Promise.all([4, 5, 6].map((i) => this.p.getSigner(i)));
    let c;
    try {
      c = JSON.parse(await readFile(`${this.dir}/chain.json`));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    if (
      c &&
      (c.modelHash !== modelHash ||
        (await this.p.getBlock(c.block))?.hash !== c.blockHash ||
        (await this.p.getCode(c.app)) === '0x')
    )
      throw Error('Saved shared-market identity/chain changed: use a new state directory');
    if (!c) {
      const deploy = async (name, args = [], file = 'SharedFlyMarket', custom) => {
        const a = custom || (await artifact(name, file));
        const v = await new ContractFactory(a.abi, a.bytecode.object || a.bytecode, this.signers[0]).deploy(
          ...args,
        );
        await this.receipt(v.deploymentTransaction());
        return v;
      };
      const factory = await deploy(
        '',
        [],
        '',
        JSON.parse(
          await readFile(
            'node_modules/@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json',
          ),
        ),
      );
      const a = await deploy('SharedFlyToken', ['NECTAR']),
        b = await deploy('SharedFlyToken', ['POLLEN']);
      const router = await deploy('FlyV3Router', [factory.target, a.target, b.target]);
      const registry = await deploy('BioAgentRegistry', [], 'BioAgentRegistry');
      for (let i = 0; i < 4; i++)
        await this.receipt(
          await registry
            .connect(this.signers[i < 2 ? 0 : i - 1])
            .registerAgent(modelHash, `http://127.0.0.1:8814/#fly-${i}`),
        );
      const addresses = [await router.token0(), await router.token1()];
      const app = await deploy('SharedAquaFlyApp', [fork.aqua, ...addresses, registry.target]);
      for (const token of [a, b]) {
        await this.receipt(await token.approve(router.target, MaxUint256));
        await this.receipt(await token.approve(fork.aqua, MaxUint256));
        for (const signer of this.signers.slice(1)) {
          await this.receipt(await token.transfer(await signer.getAddress(), parseEther('100')));
          for (const to of [router.target, app.target])
            await this.receipt(await token.connect(signer).approve(to, MaxUint256));
        }
      }
      await this.receipt(await router.seed());
      for (const token of [a, b])
        await this.receipt(
          await token.transfer(
            await (await this.p.getSigner(7)).getAddress(),
            (await token.balanceOf(await this.signers[0].getAddress())) - parseEther('100'),
          ),
        );
      const block = await this.p.getBlock('latest');
      c = {
        modelHash,
        fork,
        router: router.target,
        pool: await router.pool(),
        app: app.target,
        registry: registry.target,
        tokens: addresses,
        wallets: await Promise.all(this.signers.map((s) => s.getAddress())),
        block: block.number,
        blockHash: block.hash,
      };
      await writeFile(`${this.dir}/chain.json`, JSON.stringify(c, null, 2));
    }
    this.c = c;
    this.registry = new Contract(
      c.registry,
      (await artifact('BioAgentRegistry', 'BioAgentRegistry')).abi,
      this.signers[0],
    );
    this.router = new Contract(c.router, (await artifact('FlyV3Router')).abi, this.signers[0]);
    this.app = new Contract(c.app, (await artifact('SharedAquaFlyApp')).abi, this.signers[0]);
    const abi = (await artifact('SharedFlyToken')).abi;
    this.tokens = c.tokens.map((t) => new Contract(t, abi, this.signers[0]));
    c.symbols = await Promise.all(this.tokens.map((t) => t.symbol()));
    this.pool = new Contract(
      c.pool,
      ['function slot0() view returns(uint160,int24,uint16,uint16,uint16,uint8,bool)'],
      this.p,
    );
    this.sdk = new AquaProtocolContract(new Address(c.fork.aqua));
    this.active = [null, null];
    // Persist strategies so a restart can dock them rather than leaving untracked offers.
    try {
      this.active = JSON.parse(await readFile(`${this.dir}/offers.json`));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    return c;
  }
  async receipt(tx) {
    const r = await tx.wait();
    if (!r || r.status !== 1) throw Error('Transaction failed');
    return r;
  }
  async record(tx, kind) {
    const r = await this.receipt(tx);
    return { kind, hash: r.hash, block: r.blockNumber, gasETH: formatEther(r.gasUsed * r.gasPrice) };
  }
  async market() {
    const slot = await this.pool.slot0();
    const block = await this.p.getBlock('latest');
    return {
      price: (Number(slot[0]) / 2 ** 96) ** 2,
      block: block.number,
      blockHash: block.hash,
      timestamp: block.timestamp,
    };
  }
  async balances() {
    return Promise.all(
      this.c.wallets.map((w) =>
        Promise.all(this.tokens.map(async (t) => Number(formatEther(await t.balanceOf(w))))),
      ),
    );
  }
  async stimulus(i, value) {
    const r = this.registry.connect(this.signers[i < 2 ? 0 : i - 1]),
      status = await r.getStatus(i + 1);
    const tx = await this.record(
      await r.updateStatus(
        i + 1,
        status.revision,
        2,
        7000,
        Math.round(Math.min(1, Math.max(0, value)) * 10000),
      ),
      'stimulus',
    );
    return { ...tx, revision: String(status.revision + 1n), agentId: i + 1 };
  }
  async offer(i, decision, price, stimulus) {
    const txs = [];
    const old = this.active[i];
    if (old) {
      const call = this.sdk.dock({
        app: new Address(this.c.app),
        strategyHash: new HexString(keccak256(old.bytes)),
        tokens: this.c.tokens.map((t) => new Address(t)),
      });
      txs.push(await this.record(await this.signers[0].sendTransaction(call), 'dock'));
    }
    this.active[i] = null;
    // Save invalidation before sending a replacement; stale stimulus also blocks old fills.
    await writeFile(`${this.dir}/offers.json`, JSON.stringify(this.active));
    if (decision.action !== 2) {
      const spread = decision.action === 0 ? 10 : 80;
      const block = await this.p.getBlock('latest');
      const bytes = AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32', 'bytes32'],
        [
          i + 1,
          stimulus.revision,
          spread,
          parseEther(price.toFixed(12)),
          block.timestamp + 90,
          this.c.modelHash,
          decision.policyHash,
        ],
      );
      const call = this.sdk.ship({
        app: new Address(this.c.app),
        strategy: new HexString(bytes),
        amountsAndTokens: this.c.tokens.map((t) => ({ token: new Address(t), amount: parseEther('100') })),
      });
      txs.push(await this.record(await this.signers[0].sendTransaction(call), 'ship'));
      this.active[i] = { bytes, spread, price, expiry: block.timestamp + 90 };
    }
    await writeFile(`${this.dir}/offers.json`, JSON.stringify(this.active));
    return txs;
  }
  async trade(i, direction, amount = '2') {
    const n = parseEther(amount),
      options = [];
    options.push({ route: 'Uniswap V3', out: await this.router.quote.staticCall(direction, n) });
    for (let maker = 0; maker < 2; maker++)
      if (this.active[maker]) {
        try {
          options.push({
            route: 'Aqua',
            maker,
            out: await this.app.quote(this.c.wallets[0], this.active[maker].bytes, direction, n),
          });
        } catch {
          /* expired/unavailable offers are not executable */
        }
      }
    options.sort((a, b) => (a.out > b.out ? -1 : a.out < b.out ? 1 : 0));
    const best = options[0];
    const min = (best.out * 9950n) / 10000n,
      deadline = (await this.p.getBlock('latest')).timestamp + 30,
      signer = this.signers[i - 1];
    const tx =
      best.route === 'Aqua'
        ? await this.app
            .connect(signer)
            .swap(this.c.wallets[0], this.active[best.maker].bytes, direction, n, min, deadline)
        : await this.router.connect(signer).swap(direction, n, min, deadline);
    const receipt = await this.receipt(tx);
    const output = this.tokens[direction ? 1 : 0];
    const actual = receipt.logs
      .map((l) => {
        try {
          return l.address.toLowerCase() === output.target.toLowerCase()
            ? output.interface.parseLog(l)
            : null;
        } catch {
          return null;
        }
      })
      .filter(
        (l) => l?.name === 'Transfer' && l.args.to.toLowerCase() === this.c.wallets[i - 1].toLowerCase(),
      )
      .reduce((v, l) => v + l.args.value, 0n);
    if (actual < min) throw Error('Confirmed output below minimum');
    return {
      kind: 'swap',
      hash: receipt.hash,
      block: receipt.blockNumber,
      gasETH: formatEther(receipt.gasUsed * receipt.gasPrice),
      route: best.route,
      maker: best.maker,
      direction,
      amountIn: amount,
      amountOut: formatEther(actual),
      input: this.c.symbols[direction ? 0 : 1],
      output: this.c.symbols[direction ? 1 : 0],
      quotes: options.map((o) => ({ ...o, out: formatEther(o.out) })),
    };
  }
  close() {
    this.p?.destroy();
    this.unlock?.();
  }
}
