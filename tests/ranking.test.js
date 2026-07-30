import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNickname, isNewBest } from '../js/ranking.js';

test('닉네임: 트림·연속공백 축약·12자 제한', () => {
  assert.equal(normalizeNickname('  루미  '), '루미');
  assert.equal(normalizeNickname('a   b'), 'a b');
  assert.equal(normalizeNickname('x'.repeat(20)), 'x'.repeat(12));
});

test('닉네임: 빈 값은 Guest', () => {
  assert.equal(normalizeNickname('   '), 'Guest');
  assert.equal(normalizeNickname(''), 'Guest');
});

test('닉네임: Firestore 문서 id에 부적합한 문자 제거', () => {
  assert.equal(normalizeNickname('a/b'), 'ab');
  assert.equal(normalizeNickname('.'), 'Guest');
  assert.equal(normalizeNickname('..'), 'Guest');
});

test('최고점: 기존 없음/더 높음일 때 true', () => {
  assert.equal(isNewBest(null, 100), true);
  assert.equal(isNewBest(undefined, 0), true);
  assert.equal(isNewBest(100, 150), true);
  assert.equal(isNewBest(150, 150), false);
  assert.equal(isNewBest(200, 150), false);
});
