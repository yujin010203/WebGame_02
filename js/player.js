// js/player.js
import { CONFIG } from './config.js';
import { hpToVisual } from './playerVisual.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = CONFIG.hp.start;
    this.invulnSec = 0;
    this.shielded = false;
    this.radius = CONFIG.player.baseRadius;
    this._trailAcc = 0;
    this._blink = 0;
  }

  update(dt, targetX, targetY, trail) {
    const k = CONFIG.player.lerp;
    this.x += (targetX - this.x) * k;
    this.y += (targetY - this.y) * k;
    if (this.invulnSec > 0) this.invulnSec -= dt;
    this._blink += dt;

    const v = hpToVisual(this.hp);
    this.radius = CONFIG.player.baseRadius * v.sizeScale;

    // 트레일 방출량은 HP 비율에 비례(풍성함)
    this._trailAcc += CONFIG.player.trailPerSec * v.ratio * dt;
    while (this._trailAcc >= 1) {
      this._trailAcc -= 1;
      trail.emit(this.x, this.y, {
        count: 1, speed: 12, life: 0.5,
        size: 3 * v.sizeScale, color: '#e6f0ff',
      });
    }
  }

  draw(ctx, { fever = false } = {}) {
    const v = hpToVisual(this.hp);

    // 위험(HP≤20%) 깜빡임: 특정 주기에 렌더 스킵
    if (v.danger && Math.floor(this._blink * 8) % 2 === 0) return;
    // 무적 중 반짝임
    let alpha = v.alpha;
    if (this.invulnSec > 0 && Math.floor(this._blink * 12) % 2 === 0) alpha *= 0.4;

    ctx.save();
    ctx.globalAlpha = alpha;

    if (fever) {
      const hue = (this._blink * 240) % 360;
      ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
      ctx.shadowBlur = 60;
      ctx.fillStyle = `hsl(${hue}, 100%, 85%)`;
    } else {
      ctx.shadowColor = '#a9c7ff';
      ctx.shadowBlur = v.shadowBlur;
      ctx.fillStyle = '#f5f8ff';
    }

    // 몸통
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, Math.PI, 0);
    // 아래쪽 물결 꼬리
    const r = this.radius;
    ctx.lineTo(this.x + r, this.y + r * 0.8);
    for (let i = 0; i < 3; i++) {
      const wx = this.x + r - (r * 2 / 3) * (i + 0.5);
      ctx.quadraticCurveTo(wx, this.y + r * 1.2, this.x + r - (r * 2 / 3) * (i + 1), this.y + r * 0.8);
    }
    ctx.closePath();
    ctx.fill();

    // 눈
    ctx.shadowBlur = 0;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#2b3a67';
    ctx.beginPath();
    ctx.arc(this.x - r * 0.35, this.y - r * 0.1, r * 0.12, 0, Math.PI * 2);
    ctx.arc(this.x + r * 0.35, this.y - r * 0.1, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // 쉴드 링
    if (this.shielded) {
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#bfe3ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#bfe3ff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(this.x, this.y, r + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  hit(damage) {
    if (this.invulnSec > 0) return false;
    this.hp = Math.max(0, this.hp - damage);
    this.invulnSec = CONFIG.hp.invulnSec;
    return true;
  }

  heal(amount) {
    this.hp = Math.min(CONFIG.hp.max, this.hp + amount);
  }
}
