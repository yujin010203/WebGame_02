import { CONFIG } from './config.js';

export function addStarToGauge(gauge, count = 1) {
  const g = gauge + count;
  const threshold = CONFIG.fever.starsToTrigger;
  if (g >= threshold) {
    return { gauge: g - threshold, triggered: true };
  }
  return { gauge: g, triggered: false };
}
