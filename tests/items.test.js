import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { ItemField } from '../js/items.js';

const withRandom = (val, fn) => {
  const orig = Math.random; Math.random = () => val;
  try { return fn(); } finally { Math.random = orig; }
};

test('아이템: lifeSec 경과 시 제거 + 소멸 이펙트', () => {
  const field = new ItemField();
  field.items.push({ x: 50, y: 50, type: 'wave', radius: 16, age: 0 });
  const emitted = [];
  const burst = { emit: (x, y, o) => emitted.push({ x, y, o }) };
  field.update(CONFIG.items.lifeSec + 0.01, 999, burst, false);
  assert.equal(field.items.length, 0);
  assert.equal(emitted.length, 1);
});

test('아이템: 방어막 보유 중이면 방어막 스폰 안 함', () => {
  const field = new ItemField();
  field.timer = CONFIG.star.spawnIntervalSec; // 즉시 스폰 조건
  withRandom(0, () => field.update(0.001, 1, null, true)); // roll=0 → shield, playerShielded=true
  assert.equal(field.items.filter((i) => i.type === 'shield').length, 0);
});

test('아이템: 필드에 방어막 있으면 새 방어막 스폰 안 함', () => {
  const field = new ItemField();
  field.items.push({ x: 10, y: 10, type: 'shield', radius: 16, age: 0 });
  field.timer = CONFIG.star.spawnIntervalSec;
  withRandom(0, () => field.update(0.001, 1, null, false));
  assert.equal(field.items.filter((i) => i.type === 'shield').length, 1); // 그대로 1개
});

test('아이템: 조건 충족 시 방어막 스폰됨', () => {
  const field = new ItemField();
  field.timer = CONFIG.star.spawnIntervalSec;
  withRandom(0, () => field.update(0.001, 1, null, false));
  assert.equal(field.items.filter((i) => i.type === 'shield').length, 1);
});
