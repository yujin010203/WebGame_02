import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rainXPositions } from '../js/obstacles.js';

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
