// js/main.js
import { CONFIG } from './config.js';

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
}

function render() {
  ctx.fillStyle = CONFIG.BG;
  ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
  // 확인용 임시 텍스트
  ctx.fillStyle = '#8899ff';
  ctx.font = '20px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Lumi loop OK', CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2);
}

requestAnimationFrame(frame);
