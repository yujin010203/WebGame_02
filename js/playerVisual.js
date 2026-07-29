import { CONFIG } from './config.js';

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

export function hpToVisual(hp) {
  const ratio = clamp01(hp / CONFIG.hp.max);
  const min = CONFIG.player.minSizeRatio;
  return {
    ratio,
    sizeScale: min + (1 - min) * ratio,
    alpha: 0.5 + 0.5 * ratio,
    shadowBlur: CONFIG.player.baseShadowBlur * ratio,
    danger: ratio <= CONFIG.hp.dangerRatio,
  };
}
