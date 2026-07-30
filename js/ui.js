// js/ui.js
export function createUI({ onStart, onRestart }) {
  const overlay = document.getElementById('overlay');
  const sStart = document.getElementById('screen-start');
  const sIntro = document.getElementById('screen-intro');
  const sOver = document.getElementById('screen-over');
  const nickname = document.getElementById('nickname');

  document.getElementById('btn-start').addEventListener('click', () => onStart(nickname.value));
  document.getElementById('btn-restart').addEventListener('click', () => onRestart());

  const show = (el) => el.classList.remove('hidden');
  const hide = (el) => el.classList.add('hidden');

  function showStart() {
    overlay.classList.remove('hidden');
    show(sStart); hide(sIntro); hide(sOver);
  }
  function showIntro(onDone) {
    overlay.classList.remove('hidden');
    hide(sStart); show(sIntro); hide(sOver);
    setTimeout(() => { overlay.classList.add('hidden'); onDone(); }, 2500);
  }
  function showGameOver({ survivedSec, score, stars, rankingHtml }) {
    overlay.classList.remove('hidden');
    hide(sStart); hide(sIntro); show(sOver);
    document.getElementById('r-time').textContent = Math.floor(survivedSec);
    document.getElementById('r-score').textContent = score;
    document.getElementById('r-stars').textContent = stars;
    document.getElementById('ranking').innerHTML = rankingHtml;
  }
  function hideAll() { overlay.classList.add('hidden'); }

  return { showStart, showIntro, showGameOver, hideAll };
}
