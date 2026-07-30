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
import { difficultyAt, difficultyLevel } from './difficulty.js';
import { createUI } from './ui.js';
import { audio } from './audio.js';
import { submitScore, fetchTop10, rankingToHtml } from './firebase.js';

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
const hud = new Hud();
const shake = new ScreenShake();
audio.load();

let scene = 'START';
let trail, player, stars, items, obstacles, burst, fever, state;
let gameOverSeq = 0;

function resetGame() {
  trail = new ParticleSystem();
  player = new Player(CONFIG.WIDTH / 2, CONFIG.HEIGHT * 0.7);
  stars = new StarField();
  items = new ItemField();
  obstacles = new ObstacleField();
  burst = new ParticleSystem();
  fever = new Fever();
  state = { stars: 0, feverKills: 0, elapsedSec: 0, score: 0, nickname: state?.nickname ?? '' };
  shake.t = 0;
  shake.intensity = 0;
}

const ui = createUI({
  onStart: (raw) => { resetGame(); state.nickname = raw; scene = 'INTRO'; audio.startBgm(); ui.showIntro(() => { scene = 'PLAYING'; }); },
  onRestart: () => { resetGame(); scene = 'PLAYING'; ui.hideAll(); audio.startBgm(); },
  onHome: () => { scene = 'START'; ui.showStart(); },
});

async function onGameOver() {
  const token = ++gameOverSeq;
  shake.t = 0; shake.intensity = 0;
  audio.stopBgm();
  const score = computeScore({ stars: state.stars, feverKills: state.feverKills, survivedSec: state.elapsedSec });
  ui.showGameOver({
    survivedSec: state.elapsedSec,
    score,
    stars: state.stars,
    rankingHtml: '<li class="loading">불러오는 중…</li>',
  });
  try {
    await submitScore({ nickname: state.nickname, score, stars: state.stars, survivedSec: state.elapsedSec });
  } catch {}
  try {
    const top = await fetchTop10();
    if (token === gameOverSeq) document.getElementById('ranking').innerHTML = rankingToHtml(top, state.nickname);
  } catch {
    if (token === gameOverSeq) document.getElementById('ranking').innerHTML = rankingToHtml([], state.nickname);
  }
}

resetGame();
ui.showStart();

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30); // 초 단위, 스파이크 클램프
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

function update(dt) {
  dust.update(dt);
  if (scene !== 'PLAYING') return;
  player.update(dt, input.target.x, input.target.y, trail);
  trail.update(dt);
  const diff = difficultyAt(state.elapsedSec);
  stars.update(dt, diff.spawnMult, burst);
  items.update(dt, diff.spawnMult, burst, player.shielded);
  const got = stars.collect(player, burst);
  if (got) {
    player.heal(CONFIG.hp.starHeal * got);
    const feverTriggered = fever.addStars(got);
    state.stars += got;
    audio.play('star');
    if (feverTriggered) audio.play('fever');
  }
  const items_got = items.collect(player, burst);
  if (items_got.shield) { player.shielded = true; audio.play('item'); }
  if (items_got.wave) { obstacles.destroyAll(burst); audio.play('item'); }
  obstacles.update(dt, player, { speedMult: diff.speedMult, spawnMult: diff.spawnMult });
  if (fever.active) {
    state.feverKills += obstacles.feverCollide(player, burst);
  } else if (obstacles.hitsPlayer(player)) {
    if (player.shielded) { player.shielded = false; player.invulnSec = CONFIG.hp.invulnSec; }
    else if (player.hit(CONFIG.hp.hitDamage)) { shake.trigger(12); audio.play('hit'); }
  }
  fever.update(dt);
  burst.update(dt);
  shake.update(dt);
  state.elapsedSec += dt;
  state.score = computeScore({ stars: state.stars, feverKills: state.feverKills, survivedSec: state.elapsedSec });
  if (player.hp <= 0) {
    scene = 'GAMEOVER';
    onGameOver();
  }
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
  if (scene === 'PLAYING') {
    hud.draw(ctx, {
      hp: player.hp, score: state.score, stars: state.stars,
      level: difficultyLevel(state.elapsedSec),
      feverProgress: fever.progress, feverActive: fever.active,
      feverRemainingSec: fever.remainingSec, feverDurationSec: CONFIG.fever.durationSec,
    });
  }
}

requestAnimationFrame(frame);
