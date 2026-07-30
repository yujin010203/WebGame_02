// js/obstacles.js
import { CONFIG } from './config.js';
import { circlesOverlap, circleSegmentOverlap } from './collision.js';

const W = CONFIG.WIDTH, H = CONFIG.HEIGHT;

function makeLaser() {
  // 방향: 0 가로, 1 세로, 2 대각(↘), 3 대각(↙)
  const dir = Math.floor(Math.random() * 4);
  let x1, y1, x2, y2;
  if (dir === 0) { const y = Math.random() * H; x1 = 0; y1 = y; x2 = W; y2 = y; }
  else if (dir === 1) { const x = Math.random() * W; x1 = x; y1 = 0; x2 = x; y2 = H; }
  else if (dir === 2) { x1 = 0; y1 = Math.random() * H; x2 = W; y2 = y1 + (Math.random() * H - H / 2); }
  else { x1 = W; y1 = Math.random() * H; x2 = 0; y2 = y1 + (Math.random() * H - H / 2); }
  return { kind: 'laser', state: 'warn', t: 0, x1, y1, x2, y2 };
}

export class ObstacleField {
  constructor() { this.list = []; this.timer = 0; }

  update(dt, player, { speedMult = 1, spawnMult = 1 } = {}) {
    this.timer += dt;
    const interval = CONFIG.obstacle.baseSpawnIntervalSec * spawnMult;
    if (this.timer >= interval) {
      this.timer = 0;
      this._spawn(player, speedMult);
    }

    for (let i = this.list.length - 1; i >= 0; i--) {
      const o = this.list[i];
      let dead = false;
      if (o.kind === 'laser') {
        o.t += dt;
        if (o.state === 'warn' && o.t >= CONFIG.obstacle.laser.warnSec) { o.state = 'active'; o.t = 0; }
        else if (o.state === 'active' && o.t >= CONFIG.obstacle.laser.activeSec) dead = true;
      } else if (o.kind === 'orb') {
        o.life -= dt;
        const dx = player.x - o.x, dy = player.y - o.y;
        const d = Math.hypot(dx, dy) || 1;
        o.x += (dx / d) * o.speed * dt;
        o.y += (dy / d) * o.speed * dt;
        if (o.life <= 0) dead = true;
      } else if (o.kind === 'rain') {
        o.y += o.speed * dt;
        if (o.y - o.radius > H) dead = true;
      }
      if (dead) { this.list[i] = this.list[this.list.length - 1]; this.list.pop(); }
    }
  }

  _spawn(player, speedMult) {
    const roll = Math.random();
    if (roll < 0.34) {
      this.list.push(makeLaser());
    } else if (roll < 0.6) {
      this.list.push({
        kind: 'orb', x: Math.random() * W, y: Math.random() < 0.5 ? -20 : H + 20,
        radius: CONFIG.obstacle.orb.radius, speed: CONFIG.obstacle.orb.speed * speedMult,
        life: CONFIG.obstacle.orb.lifeSec,
      });
    } else {
      const n = 3 + Math.floor(Math.random() * 3); // 3~5개
      const xs = rainXPositions(n, W);
      for (let i = 0; i < n; i++) {
        this.list.push({
          kind: 'rain', x: xs[i], y: -10 - i * 30,
          radius: CONFIG.obstacle.rain.radius, speed: CONFIG.obstacle.rain.speed * speedMult,
        });
      }
    }
  }

  _isDamaging(o) {
    return o.kind !== 'laser' || o.state === 'active';
  }

  _overlapPlayer(o, player) {
    if (o.kind === 'laser') {
      if (o.state !== 'active') return false;
      return circleSegmentOverlap(player.x, player.y, player.radius, o.x1, o.y1, o.x2, o.y2);
    }
    return circlesOverlap(player.x, player.y, player.radius, o.x, o.y, o.radius);
  }

  hitsPlayer(player) {
    return this.list.some((o) => this._isDamaging(o) && this._overlapPlayer(o, player));
  }

  destroyAll(burst) {
    let n = 0;
    for (const o of this.list) {
      if (o.kind === 'laser') continue; // 레이저는 파동/피버로 못 부숨(순간 광선)
      burst.emit(o.x, o.y, { count: 16, speed: 120, life: 0.6, size: 3, color: '#ff9aa2' });
      n++;
    }
    this.list = this.list.filter((o) => o.kind === 'laser');
    return n;
  }

  feverCollide(player, burst) {
    let n = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const o = this.list[i];
      if (o.kind === 'laser') continue;
      if (this._overlapPlayer(o, player)) {
        burst.emit(o.x, o.y, { count: 18, speed: 140, life: 0.6, size: 3, color: '#ffffff' });
        this.list[i] = this.list[this.list.length - 1]; this.list.pop();
        n++;
      }
    }
    return n;
  }

  draw(ctx) {
    ctx.save();
    for (const o of this.list) {
      if (o.kind === 'laser') {
        if (o.state === 'warn') {
          ctx.strokeStyle = 'rgba(255,80,80,0.35)';
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 8]);
        } else {
          ctx.strokeStyle = 'rgba(255,90,90,0.95)';
          ctx.lineWidth = CONFIG.obstacle.laser.thickness;
          ctx.setLineDash([]);
          ctx.shadowColor = '#ff5a5a';
          ctx.shadowBlur = 20;
        }
        ctx.beginPath();
        ctx.moveTo(o.x1, o.y1); ctx.lineTo(o.x2, o.y2); ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur = 0;
      } else if (o.kind === 'orb') {
        ctx.fillStyle = 'rgba(180,160,255,0.9)';
        ctx.shadowColor = '#b4a0ff'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#aee1ff';
        ctx.shadowColor = '#aee1ff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

export function rainXPositions(n, width, rng = Math.random) {
  const cell = width / n;
  const xs = [];
  for (let i = 0; i < n; i++) {
    xs.push(cell * (i + 0.15 + rng() * 0.7)); // 각 셀 15%~85% 지점
  }
  return xs;
}
