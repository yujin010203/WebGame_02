import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hpToVisual } from '../js/playerVisual.js';

test('HP 100%: 최대 크기/밝기, 위험 아님', () => {
  const v = hpToVisual(100);
  assert.equal(v.ratio, 1);
  assert.equal(v.sizeScale, 1);
  assert.equal(v.alpha, 1);
  assert.equal(v.shadowBlur, 40);
  assert.equal(v.danger, false);
});

test('HP 0%: 최소 크기 0.5, alpha 0.5', () => {
  const v = hpToVisual(0);
  assert.equal(v.sizeScale, 0.5);
  assert.equal(v.alpha, 0.5);
  assert.equal(v.shadowBlur, 0);
  assert.equal(v.danger, true);
});

test('HP 20%: 위험 경계 포함', () => {
  assert.equal(hpToVisual(20).danger, true);
  assert.equal(hpToVisual(21).danger, false);
});

test('HP는 0..100로 clamp', () => {
  assert.equal(hpToVisual(140).ratio, 1);
  assert.equal(hpToVisual(-10).ratio, 0);
});
