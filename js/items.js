// js/items.js
import { CONFIG } from './config.js';
import { circlesOverlap } from './collision.js';
import { drawStar } from './stars.js';

const PAD = 40;
const randX = () => PAD + Math.random() * (CONFIG.WIDTH - PAD * 2);
const randY = () => PAD + Math.random() * (CONFIG.HEIGHT - PAD * 2);

export class ItemField {
  constructor() { this.items = []; this.timer = 0; }

  update(dt, spawnMult = 1, burst = null, playerShielded = false) {
    this.timer += dt;
    const interval = CONFIG.star.spawnIntervalSec * spawnMult;
    if (this.timer >= interval) {
      this.timer = 0;
      const roll = Math.random();
      if (roll < CONFIG.items.shieldChancePerSpawn) {
        const shieldExists = this.items.some((it) => it.type === 'shield');
        if (!playerShielded && !shieldExists) {
          this.items.push({ x: randX(), y: randY(), type: 'shield', radius: 16, age: 0 });
        }
      } else if (roll < CONFIG.items.shieldChancePerSpawn + CONFIG.items.waveChancePerSpawn) {
        this.items.push({ x: randX(), y: randY(), type: 'wave', radius: 16, age: 0 });
      }
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.age += dt;
      if (it.age >= CONFIG.items.lifeSec) {
        if (burst) burst.emit(it.x, it.y, { count: 6, speed: 30, life: 0.4, size: 2,
          color: it.type === 'shield' ? '#6a8296' : '#96667f' });
        this.items[i] = this.items[this.items.length - 1];
        this.items.pop();
      }
    }
  }

  collect(player, burst) {
    const got = { shield: 0, wave: 0 };
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (circlesOverlap(player.x, player.y, player.radius, it.x, it.y, it.radius)) {
        got[it.type]++;
        burst.emit(it.x, it.y, { count: 14, speed: 100, life: 0.7, size: 3,
          color: it.type === 'shield' ? '#bfe3ff' : '#ffd0f0' });
        this.items[i] = this.items[this.items.length - 1];
        this.items.pop();
      }
    }
    return got;
  }

  draw(ctx) {
    ctx.save();
    for (const it of this.items) {
      if (it.type === 'shield') {
        ctx.strokeStyle = '#bfe3ff';
        ctx.shadowColor = '#bfe3ff';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffd0f0';
        ctx.shadowColor = '#ffd0f0';
        ctx.shadowBlur = 16;
        drawStar(ctx, it.x, it.y, it.radius);
      }
    }
    ctx.restore();
  }
}
