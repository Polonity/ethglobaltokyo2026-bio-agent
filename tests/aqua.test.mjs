import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decideAqua } from '../packages/bio_agent/connectome/aqua-controller.js';
import { AquaProtocolContract } from '@1inch/aqua-sdk';
import { Address, HexString } from '@1inch/sdk-core';
import { AbiCoder, Interface, keccak256 } from 'ethers';
const graph = JSON.parse(readFileSync('packages/bio_agent/connectome/male-cns-slice.json'));
test('measured graph changes the action; no-edge control stays silent', () => {
  for (let id = 1; id <= 3; id++) {
    assert.equal(decideAqua(graph, 0, id).action, 'ship');
    const d = decideAqua(graph, 10000, id);
    assert.equal(d.action, 'dock');
    assert.equal(d.control.final.response, 0);
  }
  assert.equal(decideAqua(graph, 4000, 2).action, 'cautious');
  assert.notEqual(decideAqua(graph, 4000, 1).response, decideAqua(graph, 4000, 3).response);
});
test('reject coercion and out-of-domain values', () => {
  for (const n of ['100', NaN, Infinity, -1, 10001, 0.1]) assert.throws(() => decideAqua(graph, n, 1));
  assert.throws(() => decideAqua(graph, 1, 4));
});
test('official SDK matches the deployed Aqua ABI and strategy identity', () => {
  const a = new Address('0x0000000000000000000000000000000000000001');
  const sdk = new AquaProtocolContract(a);
  const strategy = new HexString(
    AbiCoder.defaultAbiCoder().encode(
      ['uint256', 'uint256', 'uint256', 'bytes32'],
      [1, 2, 30, '0x' + '11'.repeat(32)],
    ),
  );
  const abi = new Interface(JSON.parse(readFileSync('contracts/out/Aqua.sol/Aqua.json')).abi);
  const hash = AquaProtocolContract.calculateStrategyHash(strategy).toString();
  assert.equal(hash, keccak256(strategy.toString()));
  const ship = sdk.ship({ app: a, strategy, amountsAndTokens: [{ token: a, amount: 100n }] });
  assert.equal(abi.parseTransaction({ data: ship.data }).name, 'ship');
  assert.equal(abi.decodeFunctionData('ship', ship.data)[1], strategy.toString());
  const dock = sdk.dock({ app: a, strategyHash: new HexString(hash), tokens: [a] });
  assert.equal(abi.decodeFunctionData('dock', dock.data)[1], hash);
});
