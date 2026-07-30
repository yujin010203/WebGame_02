// js/fever.js
import { CONFIG } from './config.js';
import { addStarToGauge } from './feverGauge.js';

export class Fever {
  constructor() { this.gauge = 0; this.active = false; this.remainingSec = 0; }

  get progress() { return this.gauge / CONFIG.fever.starsToTrigger; }

  addStars(n = 1) {
    let triggered = false;
    for (let i = 0; i < n; i++) {
      const r = addStarToGauge(this.gauge, 1);
      this.gauge = r.gauge;
      if (r.triggered) triggered = true;
    }
    if (triggered) {
      this.active = true;
      this.remainingSec = CONFIG.fever.durationSec;
    }
    return triggered;
  }

  update(dt) {
    if (!this.active) return;
    this.remainingSec -= dt;
    if (this.remainingSec <= 0) { this.active = false; this.remainingSec = 0; }
  }
}
