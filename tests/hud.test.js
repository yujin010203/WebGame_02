import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatFeverLabel } from '../js/hud.js';

test('피버 라벨: 소수 1자리', () => {
  assert.equal(formatFeverLabel(3.2), 'FEVER 3.2초');
});
test('피버 라벨: 음수/0은 0.0으로', () => {
  assert.equal(formatFeverLabel(0), 'FEVER 0.0초');
  assert.equal(formatFeverLabel(-1), 'FEVER 0.0초');
});
