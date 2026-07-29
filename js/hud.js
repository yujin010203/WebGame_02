// js/hud.js
import { CONFIG } from './config.js';

export class ScreenShake {
  constructor() { this.t = 0; this.intensity = 0; }
  trigger(intensity = 10) { this.t = 0.3; this.intensity = intensity; }
  update(dt) { if (this.t > 0) this.t -= dt; }
  apply(ctx) {
    ctx.save();
    if (this.t > 0) {
      const m = this.intensity * (this.t / 0.3);
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
  }
  restore(ctx) { ctx.restore(); }
}

export class Hud {
  draw(ctx, { hp, score, stars, feverProgress, feverActive }) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = '14px system-ui';

    // HP 바 (좌상단)
    const bx = 16, by = 18, bw = 160, bh = 14;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    roundRect(ctx, bx, by, bw, bh, 7); ctx.fill();
    const ratio = Math.max(0, hp) / CONFIG.hp.max;
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#b9f6ff'); grad.addColorStop(1, '#ff9ed8');
    ctx.fillStyle = grad;
    roundRect(ctx, bx, by, bw * ratio, bh, 7); ctx.fill();
    ctx.fillStyle = '#e6ecff';
    ctx.fillText(`HP ${Math.ceil(Math.max(0, hp))}`, bx, by + bh + 16);

    // 점수/별 (우상단)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#e6ecff';
    ctx.font = '18px system-ui';
    ctx.fillText(`${score}`, CONFIG.WIDTH - 16, 30);
    ctx.font = '13px system-ui';
    ctx.fillStyle = '#ffe27a';
    ctx.fillText(`★ ${stars}`, CONFIG.WIDTH - 16, 50);

    // 피버 게이지 (하단 바)
    const fx = 16, fy = CONFIG.HEIGHT - 24, fw = CONFIG.WIDTH - 32, fh = 8;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(ctx, fx, fy, fw, fh, 4); ctx.fill();
    ctx.fillStyle = feverActive ? '#fff' : '#c9a9ff';
    roundRect(ctx, fx, fy, fw * Math.min(1, feverProgress), fh, 4); ctx.fill();

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
