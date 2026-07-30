import { CONFIG } from './config.js';

export function difficultyAt(elapsedSec) {
  const d = CONFIG.difficulty;
  const t = Math.min(Math.max(elapsedSec, 0) / d.rampSec, 1);
  return {
    speedMult: 1 + t * (d.maxSpeedMult - 1),
    spawnMult: 1 - t * (1 - d.minSpawnMult),
  };
}
