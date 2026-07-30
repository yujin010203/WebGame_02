import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore } from '../js/scoring.js';

test('별만: 3개 → 300', () => {
  assert.equal(computeScore({ stars: 3, feverKills: 0, survivedSec: 0 }), 300);
});

test('별+피버+생존: 5별,2파괴,12.7초 → 500+400+120 = 1020', () => {
  assert.equal(computeScore({ stars: 5, feverKills: 2, survivedSec: 12.7 }), 1020);
});

test('생존초는 내림 처리', () => {
  assert.equal(computeScore({ stars: 0, feverKills: 0, survivedSec: 9.9 }), 90);
});
