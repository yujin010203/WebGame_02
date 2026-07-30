import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { StarField } from '../js/stars.js';

test('별: lifeSec 경과 시 제거 + 소멸 이펙트', () => {
  const field = new StarField();
  field.stars.push({ x: 100, y: 100, radius: CONFIG.star.radius, phase: 0, age: 0 });
  const emitted = [];
  const burst = { emit: (x, y, o) => emitted.push({ x, y, o }) };

  // lifeSec 미만: 유지 (spawnMult 큼 → 신규 스폰 방지)
  field.update(CONFIG.star.lifeSec - 0.1, 999, burst);
  assert.equal(field.stars.length, 1);
  assert.equal(emitted.length, 0);

  // 누적으로 lifeSec 초과: 제거 + emit 1회
  field.update(0.2, 999, burst);
  assert.equal(field.stars.length, 0);
  assert.equal(emitted.length, 1);
});

test('별: burst 없이 update 호출해도 예외 없음', () => {
  const field = new StarField();
  field.stars.push({ x: 10, y: 10, radius: CONFIG.star.radius, phase: 0, age: CONFIG.star.lifeSec });
  assert.doesNotThrow(() => field.update(0.1, 999));
  assert.equal(field.stars.length, 0);
});
