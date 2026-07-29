// js/firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getFirestore, doc, runTransaction, collection, query, orderBy, limit, getDocs, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { normalizeNickname, isNewBest } from './ranking.js';

// ↓↓↓ Firebase 콘솔에서 발급받은 값으로 교체 (docs/superpowers/FIREBASE_SETUP.md 참고)
const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
};

let db = null;
if (firebaseConfig.projectId) {
  try { db = getFirestore(initializeApp(firebaseConfig)); } catch { db = null; }
}

export function isConfigured() { return db !== null; }

export async function submitScore({ nickname, score, stars, survivedSec }) {
  if (!db) return;
  const id = normalizeNickname(nickname);
  const ref = doc(db, 'scores', id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists() ? snap.data().score : null;
    if (isNewBest(existing, score)) {
      tx.set(ref, { nickname: id, score, stars, survivedSec: Math.floor(survivedSec), createdAt: serverTimestamp() });
    }
  });
}

export async function fetchTop10() {
  if (!db) return [];
  const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ nickname: d.data().nickname, score: d.data().score }));
}

export function rankingToHtml(list, myNickname) {
  if (!list.length) return '<li class="loading">랭킹을 불러올 수 없어요</li>';
  const me = normalizeNickname(myNickname);
  return list.map((r, i) =>
    `<li class="${r.nickname === me ? 'me' : ''}"><span>${i + 1}. ${escapeHtml(r.nickname)}</span><span>${r.score}</span></li>`
  ).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
