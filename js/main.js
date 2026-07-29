// js/main.js
import { CONFIG } from './config.js';
import { DustField, ParticleSystem } from './particles.js';
import { Player } from './player.js';
import { createPointerInput } from './input.js';
import { StarField } from './stars.js';
import { ItemField } from './items.js';
import { ObstacleField } from './obstacles.js';
import { Fever } from './fever.js';
import { Hud, ScreenShake } from './hud.js';
import { computeScore } from './scoring.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// 내부 해상도는 CONFIG.WIDTH×HEIGHT로 고정, CSS 크기만 화면에 맞춰 스케일.
function resize() {
  const margin = 0.98;
  const scale = Math.min(
    (window.innerWidth * margin) / CONFIG.WIDTH,
    (window.innerHeight * margin) / CONFIG.HEIGHT,
  );
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CONFIG.WIDTH * dpr;
  canvas.height = CONFIG.HEIGHT * dpr;
  canvas.style.width = `${CONFIG.WIDTH * scale}px`;
  canvas.style.height = `${CONFIG.HEIGHT * scale}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();
const dust = new DustField(CONFIG.WIDTH, CONFIG.HEIGHT);
const input = createPointerInput(canvas);
const trail = new ParticleSystem();
const player = new Player(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.7);
const stars = new StarField();
const items = new ItemField();
const obstacles = new ObstacleField();
const burst = new ParticleSystem();
const fever = new Fever();
const hud = new Hud();
const shake = new ScreenShake();
const state = { stars: 0, feverKills: 0, elapsedSec: 0 };

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30); // 초 단위, 스파이크 클램프
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

function update(dt) {
  // 씬 상태머신은 Task 12에서 채운다. 지금은 빈 루프.
  dust.update(dt);
  player.update(dt, input.target.x, input.target.y, trail);
  trail.update(dt);
  stars.update(dt, 1);
  items.update(dt, 1);
  const got = stars.collect(player, burst);
  if (got) { player.heal(CONFIG.hp.starHeal * got); fever.addStars(got); state.stars += got; }
  const items_got = items.collect(player, burst);
  if (items_got.shield) player.shielded = true;
  if (items_got.wave) obstacles.destroyAll(burst);
  obstacles.update(dt, player, { speedMult: 1, spawnMult: 1 });
  if (fever.active) {
    state.feverKills += obstacles.feverCollide(player, burst);
  } else if (obstacles.hitsPlayer(player)) {
    if (player.shielded) { player.shielded = false; player.invulnSec = CONFIG.hp.invulnSec; }
    else if (player.hit(CONFIG.hp.hitDamage)) { shake.trigger(12); }
  }
  fever.update(dt);
  burst.update(dt);
  shake.update(dt);
  state.elapsedSec += dt;
  state.score = computeScore({ stars: state.stars, feverKills: state.feverKills, survivedSec: state.elapsedSec });
}

function render() {
  shake.apply(ctx);
  ctx.fillStyle = CONFIG.BG;
  ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  dust.draw(ctx);
  trail.draw(ctx);
  stars.draw(ctx);
  items.draw(ctx);
  obstacles.draw(ctx);
  burst.draw(ctx);
  player.draw(ctx, { fever: fever.active });
  shake.restore(ctx);
  hud.draw(ctx, { hp: player.hp, score: state.score, stars: state.stars, feverProgress: fever.progress, feverActive: fever.active });
}

requestAnimationFrame(frame);
