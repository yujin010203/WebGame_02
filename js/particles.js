// js/particles.js
import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor() { this.list = []; }
  get count() { return this.list.length; }

  emit(x, y, { count = 1, speed = 30, life = 0.6, size = 3, color = '#ffffff', spread = Math.PI * 2 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * spread;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.list.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life, maxLife: life,
        size: size * (0.6 + Math.random() * 0.6),
        color,
      });
    }
  }

  update(dt) {
    const arr = this.list;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.life -= dt;
      if (p.life <= 0) { arr[i] = arr[arr.length - 1]; arr.pop(); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.list) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class DustField {
  constructor(width, height, count = CONFIG.background.dustCount) {
    this.w = width; this.h = height;
    this.dust = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1.5,
      vy: 4 + Math.random() * 10,
      a: 0.2 + Math.random() * 0.4,
    }));
  }
  update(dt) {
    for (const d of this.dust) {
      d.y += d.vy * dt;
      if (d.y > this.h) { d.y = 0; d.x = Math.random() * this.w; }
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#cbd5ff';
    for (const d of this.dust) {
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
