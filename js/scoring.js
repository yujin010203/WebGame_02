import { CONFIG } from './config.js';

export function computeScore({ stars, feverKills, survivedSec }) {
  const s = CONFIG.score;
  return stars * s.perStar
    + feverKills * s.feverKill
    + Math.floor(survivedSec) * s.survivalPerSec;
}
