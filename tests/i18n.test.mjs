import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLanguage, translate } from '../apps/frontend/i18n.js';
test('system default and explicit preferences', () => {
  assert.equal(resolveLanguage('system', 'ja-JP'), 'ja');
  assert.equal(resolveLanguage('system', 'en-US'), 'en');
  assert.equal(resolveLanguage('system', 'fr-FR'), 'en');
  assert.equal(resolveLanguage('en', 'ja-JP'), 'en');
  assert.equal(resolveLanguage('ja', 'en-US'), 'ja');
  assert.equal(resolveLanguage('invalid', 'ja'), 'ja');
});
test('nested status messages translate without changing evidence', () => {
  const hash = `0x${'ab'.repeat(32)}`;
  assert.equal(translate(`送信済み ${hash}`, 'en'), `Submitted ${hash}`);
  assert.equal(translate('蜜: 北東 / 近くの危険: あり', 'en'), 'Nectar: northeast / Nearby danger: yes');
  assert.equal(
    translate('接続待ち: revision の欠番を検知', 'en'),
    'Connection pending: Missing revision detected',
  );
  assert.equal(translate('POLICY KEPT', 'ja'), '方策を保持');
  assert.equal(translate('3 agents active', 'ja'), '3匹が競技中');
  assert.equal(translate(hash, 'ja'), hash);
  assert.equal(translate('BioAgentStatusUpdated', 'en'), 'BioAgentStatusUpdated');
});
