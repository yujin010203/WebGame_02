import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';

test('config: 화면·HP 기본값', () => {
  assert.equal(CONFIG.WIDTH, 450);
  assert.equal(CONFIG.HEIGHT, 800);
  assert.equal(CONFIG.hp.max, 100);
  assert.equal(CONFIG.hp.hitDamage, 20);
  assert.equal(CONFIG.hp.starHeal, 5);
});

test('config: 점수·피버 값', () => {
  assert.equal(CONFIG.score.perStar, 100);
  assert.equal(CONFIG.score.feverKill, 200);
  assert.equal(CONFIG.score.survivalPerSec, 10);
  assert.equal(CONFIG.fever.starsToTrigger, 10);
  assert.equal(CONFIG.fever.durationSec, 5);
});

test('config: 유령 최소 크기 비율 0.5, 위험 임계 0.2', () => {
  assert.equal(CONFIG.player.minSizeRatio, 0.5);
  assert.equal(CONFIG.hp.dangerRatio, 0.2);
});

test('config: 조정된 값(lerp/rain/수명)', () => {
  assert.equal(CONFIG.player.lerp, 0.12);
  assert.equal(CONFIG.obstacle.rain.radius, 5);
  assert.equal(CONFIG.star.lifeSec, 5);
  assert.equal(CONFIG.items.lifeSec, 3);
});
