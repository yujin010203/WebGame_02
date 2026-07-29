// js/input.js
import { CONFIG } from './config.js';

export function createPointerInput(canvas) {
  const target = { x: CONFIG.WIDTH / 2, y: CONFIG.HEIGHT / 2 };
  function toInternal(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    target.x = ((clientX - rect.left) / rect.width) * CONFIG.WIDTH;
    target.y = ((clientY - rect.top) / rect.height) * CONFIG.HEIGHT;
  }
  canvas.addEventListener('pointermove', (e) => toInternal(e.clientX, e.clientY));
  canvas.addEventListener('pointerdown', (e) => toInternal(e.clientX, e.clientY));
  return { get target() { return target; } };
}
