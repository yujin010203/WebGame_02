import { test } from 'node:test';
import assert from 'node:assert/strict';
import { difficultyAt } from '../js/difficulty.js';

test('t=0: 배율 1', () => {
  const d = difficultyAt(0);
  assert.equal(d.speedMult, 1);
  assert.equal(d.spawnMult, 1);
});

test('rampSec(120) 이상: 최대 난이도로 고정', () => {
  const d = difficultyAt(300);
  assert.ok(Math.abs(d.speedMult - 2.2) < 1e-9);
  assert.ok(Math.abs(d.spawnMult - 0.45) < 1e-9);
});

test('중간(60초): 선형 보간', () => {
  const d = difficultyAt(60);
  assert.ok(Math.abs(d.speedMult - 1.6) < 1e-9);   // 1 + 0.5*(2.2-1)
  assert.ok(Math.abs(d.spawnMult - 0.725) < 1e-9); // 1 - 0.5*(1-0.45)
});
