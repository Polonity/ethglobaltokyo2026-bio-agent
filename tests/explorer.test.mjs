import test from 'node:test';
import assert from 'node:assert/strict';
import { transactionLink } from '../apps/frontend/explorer.js';
const hash = `0x${'ab'.repeat(32)}`;
test('explorer links respect network identity and validate transaction hashes', () => {
  assert.equal(transactionLink('31337', hash).href, `/api/chain/receipt?hash=${hash}`);
  assert.equal(transactionLink(11155111, hash).href, `https://sepolia.etherscan.io/tx/${hash}`);
  assert.equal(transactionLink('1', hash).href, `https://etherscan.io/tx/${hash}`);
  assert.equal(transactionLink('999', hash), null);
  assert.equal(transactionLink('1', 'javascript:alert(1)'), null);
  assert.equal(transactionLink('31337', undefined), null);
});
