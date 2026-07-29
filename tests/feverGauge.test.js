import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addStarToGauge } from '../js/feverGauge.js';

test('임계치 미만: 누적만', () => {
  const r = addStarToGauge(3);
  assert.deepEqual(r, { gauge: 4, triggered: false });
});

test('정확히 10 도달: 발동 + 게이지 0', () => {
  const r = addStarToGauge(9);
  assert.deepEqual(r, { gauge: 0, triggered: true });
});

test('초과분 이월 없음(1개씩 증가라 최대 초과 0)', () => {
  const r = addStarToGauge(9, 1);
  assert.equal(r.triggered, true);
  assert.equal(r.gauge, 0);
});
