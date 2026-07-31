import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rainXPositions, ObstacleField } from '../js/obstacles.js';

test('소나기: x좌표가 셀 단위로 고르게 분산', () => {
  const n = 5, W = 450;
  const xs = rainXPositions(n, W, () => 0.5);
  assert.equal(xs.length, n);
  const cell = W / n;
  for (let i = 0; i < n; i++) {
    assert.ok(xs[i] >= cell * i && xs[i] <= cell * (i + 1), `x[${i}]=${xs[i]} not in cell ${i}`);
  }
});

test('소나기: 인덱스별 난수가 달라도 각 방울이 자기 셀 안에 있어 겹치지 않음', () => {
  const n = 5, W = 450, cell = W / n;
  const seq = [0, 0.99, 0.5, 0.2, 0.8];
  let k = 0;
  const xs = rainXPositions(n, W, () => seq[k++ % seq.length]);
  for (let i = 0; i < n; i++) {
    assert.ok(xs[i] >= cell * i && xs[i] <= cell * (i + 1), `x[${i}]=${xs[i]} not in cell ${i}`);
  }
  // 서로 다른 셀에 위치 → 정렬 순서 유지, 겹침 없음
  for (let i = 1; i < n; i++) {
    assert.ok(xs[i] > xs[i - 1]);
  }
});

test('레이저 활성 충돌: laserHitsPlayer만 true (즉사 판정)', () => {
  const field = new ObstacleField();
  const player = { x: 200, y: 100, radius: 22 };
  field.list.push({ kind: 'laser', state: 'active', t: 0, x1: 0, y1: 100, x2: 450, y2: 100 });
  assert.equal(field.laserHitsPlayer(player), true);
  assert.equal(field.nonLaserDamage(player), 0);
});

test('레이저 경고(warn) 상태는 충돌로 치지 않음', () => {
  const field = new ObstacleField();
  const player = { x: 200, y: 100, radius: 22 };
  field.list.push({ kind: 'laser', state: 'warn', t: 0, x1: 0, y1: 100, x2: 450, y2: 100 });
  assert.equal(field.laserHitsPlayer(player), false);
});

test('오브(먼지) 충돌: nonLaserDamage=20 (빗방울보다 10 더 아픔)', () => {
  const field = new ObstacleField();
  const player = { x: 200, y: 200, radius: 22 };
  field.list.push({ kind: 'orb', x: 200, y: 200, radius: 16, speed: 70, life: 5 });
  assert.equal(field.nonLaserDamage(player), 20);
  assert.equal(field.laserHitsPlayer(player), false);
});

test('빗방울(소나기) 충돌: nonLaserDamage=10', () => {
  const field = new ObstacleField();
  const player = { x: 200, y: 200, radius: 22 };
  field.list.push({ kind: 'rain', x: 200, y: 200, radius: 5, speed: 320 });
  assert.equal(field.nonLaserDamage(player), 10);
});
