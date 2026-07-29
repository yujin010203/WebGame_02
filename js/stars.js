// js/stars.js
import { CONFIG } from './config.js';
import { circlesOverlap } from './collision.js';

const PAD = 40;
const randX = () => PAD + Math.random() * (CONFIG.WIDTH - PAD * 2);
const randY = () => PAD + Math.random() * (CONFIG.HEIGHT - PAD * 2);

export class StarField {
  constructor() { this.stars = []; this.timer = 0; }

  update(dt, spawnMult = 1) {
    this.timer += dt;
    const interval = CONFIG.star.spawnIntervalSec * spawnMult;
    if (this.timer >= interval) {
      this.timer = 0;
      this.stars.push({ x: randX(), y: randY(), radius: CONFIG.star.radius, phase: Math.random() * 6.28 });
    }
  }

  collect(player, burst) {
    let n = 0;
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      if (circlesOverlap(player.x, player.y, player.radius, s.x, s.y, s.radius)) {
        burst.emit(s.x, s.y, { count: 12, speed: 90, life: 0.6, size: 3, color: '#ffe27a' });
        this.stars[i] = this.stars[this.stars.length - 1];
        this.stars.pop();
        n++;
      }
    }
    return n;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffe27a';
    ctx.shadowColor = '#ffe27a';
    ctx.shadowBlur = 18;
    for (const s of this.stars) {
      drawStar(ctx, s.x, s.y, s.radius);
    }
    ctx.restore();
  }
}

function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    const a2 = a + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(a2) * r * 0.45, cy + Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
}

export { drawStar };
