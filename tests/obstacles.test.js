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

test('소나기: 인접 방울이 뭉치지 않음(간격 > 셀의 절반)', () => {
  const n = 4, W = 450;
  const cell = W / n;
  for (const r of [0, 0.5, 1]) {
    const xs = rainXPositions(n, W, () => r);
    for (let i = 1; i < n; i++) {
      assert.ok(xs[i] - xs[i - 1] > cell * 0.5);
    }
  }
});
