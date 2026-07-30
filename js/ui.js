// js/ui.js
export function createUI({ onStart, onRestart, onHome, onHelp, onRanking }) {
  const overlay = document.getElementById('overlay');
  const sStart = document.getElementById('screen-start');
  const sIntro = document.getElementById('screen-intro');
  const sOver = document.getElementById('screen-over');
  const nickname = document.getElementById('nickname');
  const mHelp = document.getElementById('modal-help');
  const mRank = document.getElementById('modal-ranking');
  const rankView = document.getElementById('ranking-view');

  document.getElementById('btn-start').addEventListener('click', () => onStart(nickname.value));
  document.getElementById('btn-restart').addEventListener('click', () => onRestart());
  document.getElementById('btn-home').addEventListener('click', () => onHome());
  document.getElementById('btn-help').addEventListener('click', () => onHelp());
  document.getElementById('btn-ranking-view').addEventListener('click', () => onRanking());
  mHelp.querySelector('.modal-close').addEventListener('click', () => mHelp.classList.add('hidden'));
  mRank.querySelector('.modal-close').addEventListener('click', () => mRank.classList.add('hidden'));

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

  function showHelp() { mHelp.classList.remove('hidden'); }
  function showRankingModal() { rankView.innerHTML = '<li class="loading">불러오는 중…</li>'; mRank.classList.remove('hidden'); }
  function setRankingView(html) { rankView.innerHTML = html; }

  return { showStart, showIntro, showGameOver, hideAll, showHelp, showRankingModal, setRankingView };
}
