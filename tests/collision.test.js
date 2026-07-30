import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circlesOverlap, circleSegmentOverlap } from '../js/collision.js';

test('원-원: 겹침/비겹침', () => {
  assert.equal(circlesOverlap(0, 0, 10, 15, 0, 10), true);   // 거리15 < 20
  assert.equal(circlesOverlap(0, 0, 10, 25, 0, 10), false);  // 거리25 > 20
});

test('원-선분: 선분 위 근접 시 겹침', () => {
  // 수평선 (0,0)-(100,0), 원 중심 (50,5) r=6 → 거리 5 < 6
  assert.equal(circleSegmentOverlap(50, 5, 6, 0, 0, 100, 0), true);
  assert.equal(circleSegmentOverlap(50, 20, 6, 0, 0, 100, 0), false);
});

test('원-선분: 선분 끝점 밖은 끝점 거리로 판정', () => {
  // 원 (120,0) r=6, 선분 (0,0)-(100,0): 끝점(100,0)까지 거리 20 → 비겹침
  assert.equal(circleSegmentOverlap(120, 0, 6, 0, 0, 100, 0), false);
});
