# 루미(Lumi) 별빛 미니게임 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HTML5 Canvas + Vanilla JS(ES 모듈)로 모바일 세로 비율의 탑다운 감성 미니게임 "루미"를 만들고, Firebase Firestore 기반 Top10 랭킹을 붙인다.

**Architecture:** 엔티티 배열 + 씬 상태머신(`START → INTRO → PLAYING → GAMEOVER`). `requestAnimationFrame` + `deltaTime` 루프. 고정 내부 해상도 450×800을 CSS로 스케일. 순수 로직(점수/난이도/HP비주얼/충돌/피버/최고점)은 DOM 없는 순수 함수 모듈로 분리해 `node --test`로 단위 테스트하고, 렌더링/씬은 수동 검증 체크리스트로 확인.

**Tech Stack:** Vanilla JavaScript (ES modules), HTML5 Canvas 2D, Web Audio(파일 로드), Firebase JS SDK v10 (Firestore, CDN ESM). 빌드 도구 없음. 테스트: Node 내장 `node:test` + `node:assert`.

## Global Constraints

- 내부 해상도 고정: **450 × 800** (9:16 근사). 세로 비율 우선, 모바일 터치 지원.
- 외부 이미지 에셋 없음 — 모든 그래픽은 Canvas 절차적 드로잉.
- 모든 밸런스 수치는 `js/config.js` 한 곳에 상수로 모은다. 매직넘버 금지.
- 배경색 `#0F172A`. UI 문구는 한국어.
- HP 최대 100 / 시작 100 / 피격 −15 / 무적 1초 / 별 +100점·HP+10·피버게이지+1 / 생존 초당 +10점 / 피버 파괴 +200점 / 피버 발동 별 게이지 10 · 5초 / 유령 크기 HP비례 최저 50% / 위험 연출 HP ≤ 20%.
- 점수 = 별×100 + 피버파괴×200 + floor(생존초)×10.
- Firebase 미설정·네트워크 실패·오디오 파일 부재 시에도 게임은 정상 동작(graceful degradation).
- ES 모듈은 브라우저(`<script type="module">`)와 Node(`"type":"module"`) 양쪽에서 동일하게 import 가능해야 함. 순수 로직 모듈은 DOM/`window`/`canvas`를 import 시점에 참조하지 않는다.
- 커밋 자주. 각 태스크 끝에서 커밋.

---

## File Structure

```
package.json          # { "type": "module" } — Node ESM + node --test
index.html            # 캔버스 + 시작/게임오버 DOM 오버레이
css/style.css         # 레이아웃, 오버레이, 반응형 스케일
js/
  config.js           # 모든 밸런스 상수 (CONFIG)
  scoring.js          # computeScore() — 순수
  difficulty.js       # difficultyAt() — 순수
  playerVisual.js     # hpToVisual() — 순수
  collision.js        # circlesOverlap, circleSegmentOverlap — 순수
  feverGauge.js       # addStarToGauge() — 순수
  ranking.js          # isNewBest(), normalizeNickname() — 순수
  particles.js        # 공용 파티클 시스템 (트레일/폭발/배경먼지)
  player.js           # 루미: lerp 이동, HP연동 렌더, 트레일 방출
  stars.js            # 노란 별 스폰/획득
  items.js            # 달빛 쉴드, 별똥별 파동
  obstacles.js        # 레이저(예고선), 유도 Orb, 소나기 빗방울
  fever.js            # 피버(슈퍼노바) 상태·렌더 래퍼 (feverGauge 사용)
  hud.js              # HP바/점수/별/피버게이지/화면흔들림
  audio.js            # assets/audio 로드·재생 (없으면 no-op)
  firebase.js         # Firestore 제출(최고점만)/Top10 조회 (ranking 사용)
  ui.js               # 시작/인트로/게임오버 DOM 오버레이 제어
  main.js             # 부트스트랩, 리사이즈, 게임 루프, 씬 상태머신, 상태 객체
tests/                # *.test.js (node --test)
assets/audio/         # 사용자 mp3 배치 위치 (README로 안내)
docs/superpowers/FIREBASE_SETUP.md   # Firebase 콘솔 생성 가이드
```

각 순수 모듈은 대응하는 `*.test.js`를 가진다. 렌더/씬 모듈은 수동 검증.

---

### Task 1: 프로젝트 스캐폴드 + 게임 루프 + 반응형 캔버스

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/main.js`
- Create: `js/config.js`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `js/config.js` → `export const CONFIG` (아래 Task 2에서 전체 필드 정의; 이 태스크에서는 `WIDTH:450, HEIGHT:800, BG:'#0F172A'`만 우선 정의)
  - `js/main.js` → 브라우저에서 로드 시 캔버스 초기화 + `requestAnimationFrame` 루프 시작. 전역 export 없음.

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "lumi-star-collector",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: config.js 최소 정의**

```js
// js/config.js
export const CONFIG = {
  WIDTH: 450,
  HEIGHT: 800,
  BG: '#0F172A',
};
```

- [ ] **Step 3: index.html 작성**

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>루미 — 별빛을 모으는 아기 유령</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="stage">
    <canvas id="game"></canvas>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: style.css 작성 (세로 비율 레터박스 + 터치 스크롤 방지)**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body {
  height: 100%;
  background: #050914;
  overflow: hidden;
  touch-action: none;
  font-family: system-ui, -apple-system, sans-serif;
}
#stage {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
#game {
  display: block;
  background: #0F172A;
  border-radius: 12px;
  box-shadow: 0 0 60px rgba(80, 120, 255, 0.15);
}
```

- [ ] **Step 5: main.js — 캔버스 setup, devicePixelRatio, 리사이즈, dt 루프**

```js
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
```

- [ ] **Step 6: 수동 검증**

`index.html`을 브라우저로 연다(로컬 서버 권장: `python -m http.server` 후 `http://localhost:8000`). 확인:
- 세로 직사각형 캔버스가 화면 중앙에 보이고 "Lumi loop OK" 텍스트가 뜬다.
- 브라우저 창 크기를 바꿔도 비율 유지하며 캔버스가 리사이즈된다.
- 콘솔에 에러 없음.

- [ ] **Step 7: Commit**

```bash
git add package.json index.html css/style.css js/main.js js/config.js
git commit -m "feat: 프로젝트 스캐폴드 + 반응형 캔버스 게임 루프"
```

---

### Task 2: config.js 전체 밸런스 상수

**Files:**
- Modify: `js/config.js`
- Test: `tests/config.test.js`

**Interfaces:**
- Consumes: (없음)
- Produces: `CONFIG` 전체 필드. 이후 모든 태스크가 참조.

- [ ] **Step 1: 실패 테스트 작성 — 불변식 검증**

```js
// tests/config.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';

test('config: 화면·HP 기본값', () => {
  assert.equal(CONFIG.WIDTH, 450);
  assert.equal(CONFIG.HEIGHT, 800);
  assert.equal(CONFIG.hp.max, 100);
  assert.equal(CONFIG.hp.hitDamage, 15);
  assert.equal(CONFIG.hp.starHeal, 10);
});

test('config: 점수·피버 값', () => {
  assert.equal(CONFIG.score.perStar, 100);
  assert.equal(CONFIG.score.feverKill, 200);
  assert.equal(CONFIG.score.survivalPerSec, 10);
  assert.equal(CONFIG.fever.starsToTrigger, 10);
  assert.equal(CONFIG.fever.durationSec, 5);
});

test('config: 유령 최소 크기 비율 0.5, 위험 임계 0.2', () => {
  assert.equal(CONFIG.player.minSizeRatio, 0.5);
  assert.equal(CONFIG.hp.dangerRatio, 0.2);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/config.test.js`
Expected: FAIL (CONFIG.hp 등 undefined)

- [ ] **Step 3: config.js 전체 작성**

```js
// js/config.js
export const CONFIG = {
  WIDTH: 450,
  HEIGHT: 800,
  BG: '#0F172A',

  hp: {
    max: 100,
    start: 100,
    hitDamage: 15,
    starHeal: 10,
    invulnSec: 1,       // 피격 후 무적 시간
    dangerRatio: 0.2,   // 이하에서 깜빡임
  },

  score: {
    perStar: 100,
    feverKill: 200,
    survivalPerSec: 10,
  },

  fever: {
    starsToTrigger: 10,
    durationSec: 5,
    bonusPerKill: 200,
  },

  player: {
    baseRadius: 22,
    minSizeRatio: 0.5,   // HP 0%일 때 크기 비율
    lerp: 0.12,          // 감속 추적 계수
    baseShadowBlur: 40,
    trailPerSec: 40,     // 초당 트레일 파티클 방출 수 (HP 100% 기준)
  },

  star: {
    spawnIntervalSec: 1.4,
    radius: 11,
  },

  obstacle: {
    laser: { warnSec: 1, activeSec: 0.35, thickness: 14 },
    orb: { speed: 70, radius: 16, lifeSec: 5 },
    rain: { speed: 320, radius: 7 },
    baseSpawnIntervalSec: 1.6,
  },

  difficulty: {
    rampSec: 120,        // 이 시간에 걸쳐 최대 난이도로 램프업
    maxSpeedMult: 2.2,   // 이동 속도 최대 배율
    minSpawnMult: 0.45,  // 스폰 간격 최소 배율(=더 자주)
  },

  items: {
    shieldChancePerSpawn: 0.06,  // 별 스폰 시 쉴드로 대체될 확률
    waveChancePerSpawn: 0.04,    // 별똥별 파동 확률
  },

  background: {
    dustCount: 60,
  },
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/config.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/config.js tests/config.test.js
git commit -m "feat: 전체 밸런스 상수 config 정의 + 불변식 테스트"
```

---

### Task 3: scoring.js — 점수 계산 (순수·TDD)

**Files:**
- Create: `js/scoring.js`
- Test: `tests/scoring.test.js`

**Interfaces:**
- Consumes: `CONFIG.score`
- Produces: `export function computeScore({ stars, feverKills, survivedSec }) → number`

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/scoring.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeScore } from '../js/scoring.js';

test('별만: 3개 → 300', () => {
  assert.equal(computeScore({ stars: 3, feverKills: 0, survivedSec: 0 }), 300);
});

test('별+피버+생존: 5별,2파괴,12.7초 → 500+400+120 = 1020', () => {
  assert.equal(computeScore({ stars: 5, feverKills: 2, survivedSec: 12.7 }), 1020);
});

test('생존초는 내림 처리', () => {
  assert.equal(computeScore({ stars: 0, feverKills: 0, survivedSec: 9.9 }), 90);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/scoring.test.js`
Expected: FAIL ("computeScore is not a function")

- [ ] **Step 3: 구현**

```js
// js/scoring.js
import { CONFIG } from './config.js';

export function computeScore({ stars, feverKills, survivedSec }) {
  const s = CONFIG.score;
  return stars * s.perStar
    + feverKills * s.feverKill
    + Math.floor(survivedSec) * s.survivalPerSec;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/scoring.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/scoring.js tests/scoring.test.js
git commit -m "feat: 점수 계산 함수 computeScore"
```

---

### Task 4: difficulty.js — 난이도 곡선 (순수·TDD)

**Files:**
- Create: `js/difficulty.js`
- Test: `tests/difficulty.test.js`

**Interfaces:**
- Consumes: `CONFIG.difficulty`
- Produces: `export function difficultyAt(elapsedSec) → { speedMult:number, spawnMult:number }`
  - `speedMult`: 장애물 이동 속도 배율 (1 → maxSpeedMult)
  - `spawnMult`: 스폰 간격 배율 (1 → minSpawnMult, 작을수록 자주)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/difficulty.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { difficultyAt } from '../js/difficulty.js';

test('t=0: 배율 1', () => {
  const d = difficultyAt(0);
  assert.equal(d.speedMult, 1);
  assert.equal(d.spawnMult, 1);
});

test('rampSec(120) 이상: 최대 난이도로 고정', () => {
  const d = difficultyAt(300);
  assert.equal(d.speedMult, 2.2);
  assert.equal(d.spawnMult, 0.45);
});

test('중간(60초): 선형 보간', () => {
  const d = difficultyAt(60);
  assert.ok(Math.abs(d.speedMult - 1.6) < 1e-9);   // 1 + 0.5*(2.2-1)
  assert.ok(Math.abs(d.spawnMult - 0.725) < 1e-9); // 1 - 0.5*(1-0.45)
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/difficulty.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

```js
// js/difficulty.js
import { CONFIG } from './config.js';

export function difficultyAt(elapsedSec) {
  const d = CONFIG.difficulty;
  const t = Math.min(Math.max(elapsedSec, 0) / d.rampSec, 1);
  return {
    speedMult: 1 + t * (d.maxSpeedMult - 1),
    spawnMult: 1 - t * (1 - d.minSpawnMult),
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/difficulty.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/difficulty.js tests/difficulty.test.js
git commit -m "feat: 시간 기반 난이도 곡선 difficultyAt"
```

---

### Task 5: playerVisual.js — HP→비주얼 매핑 (순수·TDD)

**Files:**
- Create: `js/playerVisual.js`
- Test: `tests/playerVisual.test.js`

**Interfaces:**
- Consumes: `CONFIG.player`, `CONFIG.hp`
- Produces: `export function hpToVisual(hp) → { ratio, sizeScale, alpha, shadowBlur, danger }`
  - `ratio`: hp/max clamp 0..1
  - `sizeScale`: minSizeRatio..1 (선형)
  - `alpha`: 0.5..1
  - `shadowBlur`: 0..baseShadowBlur
  - `danger`: ratio ≤ dangerRatio

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/playerVisual.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hpToVisual } from '../js/playerVisual.js';

test('HP 100%: 최대 크기/밝기, 위험 아님', () => {
  const v = hpToVisual(100);
  assert.equal(v.ratio, 1);
  assert.equal(v.sizeScale, 1);
  assert.equal(v.alpha, 1);
  assert.equal(v.shadowBlur, 40);
  assert.equal(v.danger, false);
});

test('HP 0%: 최소 크기 0.5, alpha 0.5', () => {
  const v = hpToVisual(0);
  assert.equal(v.sizeScale, 0.5);
  assert.equal(v.alpha, 0.5);
  assert.equal(v.shadowBlur, 0);
  assert.equal(v.danger, true);
});

test('HP 20%: 위험 경계 포함', () => {
  assert.equal(hpToVisual(20).danger, true);
  assert.equal(hpToVisual(21).danger, false);
});

test('HP는 0..100로 clamp', () => {
  assert.equal(hpToVisual(140).ratio, 1);
  assert.equal(hpToVisual(-10).ratio, 0);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/playerVisual.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

```js
// js/playerVisual.js
import { CONFIG } from './config.js';

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

export function hpToVisual(hp) {
  const ratio = clamp01(hp / CONFIG.hp.max);
  const min = CONFIG.player.minSizeRatio;
  return {
    ratio,
    sizeScale: min + (1 - min) * ratio,
    alpha: 0.5 + 0.5 * ratio,
    shadowBlur: CONFIG.player.baseShadowBlur * ratio,
    danger: ratio <= CONFIG.hp.dangerRatio,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/playerVisual.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/playerVisual.js tests/playerVisual.test.js
git commit -m "feat: HP→유령 비주얼 매핑 hpToVisual"
```

---

### Task 6: collision.js — 충돌 판정 (순수·TDD)

**Files:**
- Create: `js/collision.js`
- Test: `tests/collision.test.js`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `export function circlesOverlap(ax, ay, ar, bx, by, br) → boolean`
  - `export function circleSegmentOverlap(cx, cy, r, x1, y1, x2, y2) → boolean` (레이저 선분 판정)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/collision.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { circlesOverlap, circleSegmentOverlap } from '../js/collision.js';

test('원-원: 겹침/비겹침', () => {
  assert.equal(circlesOverlap(0, 0, 10, 15, 0, 10), true);   // 거리15 < 20
  assert.equal(circlesOverlap(0, 0, 10, 25, 0, 10), false);  // 거리25 > 20
});

test('원-선분: 선분 위 근접 시 겹침', () => {
  // 수평선 (0,0)-(100,0), 원 중심 (50,5) r=6 → 거리 5 < 6
  assert.equal(circleSegmentOverlap(50, 5, 6, 0, 0, 100, 0), true);
  assert.equal(circleSegmentOverlap(50, 20, 6, 0, 0, 100, 0), false);
});

test('원-선분: 선분 끝점 밖은 끝점 거리로 판정', () => {
  // 원 (120,0) r=6, 선분 (0,0)-(100,0): 끝점(100,0)까지 거리 20 → 비겹침
  assert.equal(circleSegmentOverlap(120, 0, 6, 0, 0, 100, 0), false);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/collision.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

```js
// js/collision.js
export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy <= rr * rr;
}

function pointSegmentDistSq(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.min(Math.max(t, 0), 1);
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const ex = px - cx;
  const ey = py - cy;
  return ex * ex + ey * ey;
}

export function circleSegmentOverlap(cx, cy, r, x1, y1, x2, y2) {
  return pointSegmentDistSq(cx, cy, x1, y1, x2, y2) <= r * r;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/collision.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/collision.js tests/collision.test.js
git commit -m "feat: 원-원/원-선분 충돌 판정 유틸"
```

---

### Task 7: feverGauge.js — 피버 게이지 로직 (순수·TDD)

**Files:**
- Create: `js/feverGauge.js`
- Test: `tests/feverGauge.test.js`

**Interfaces:**
- Consumes: `CONFIG.fever.starsToTrigger`
- Produces: `export function addStarToGauge(gauge, count = 1) → { gauge:number, triggered:boolean }`
  - 게이지가 임계치 도달 시 `triggered:true`, 게이지는 초과분만 남기고 리셋.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/feverGauge.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addStarToGauge } from '../js/feverGauge.js';

test('임계치 미만: 누적만', () => {
  const r = addStarToGauge(3);
  assert.deepEqual(r, { gauge: 4, triggered: false });
});

test('정확히 10 도달: 발동 + 게이지 0', () => {
  const r = addStarToGauge(9);
  assert.deepEqual(r, { gauge: 0, triggered: true });
});

test('초과분 이월 없음(1개씩 증가라 최대 초과 0)', () => {
  const r = addStarToGauge(9, 1);
  assert.equal(r.triggered, true);
  assert.equal(r.gauge, 0);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/feverGauge.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

```js
// js/feverGauge.js
import { CONFIG } from './config.js';

export function addStarToGauge(gauge, count = 1) {
  const g = gauge + count;
  const threshold = CONFIG.fever.starsToTrigger;
  if (g >= threshold) {
    return { gauge: g - threshold, triggered: true };
  }
  return { gauge: g, triggered: false };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/feverGauge.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/feverGauge.js tests/feverGauge.test.js
git commit -m "feat: 피버 게이지 누적/발동 로직"
```

---

### Task 8: ranking.js — 닉네임 정규화 + 최고점 판정 (순수·TDD)

**Files:**
- Create: `js/ranking.js`
- Test: `tests/ranking.test.js`

**Interfaces:**
- Consumes: (없음)
- Produces:
  - `export function normalizeNickname(raw) → string` (trim, 연속 공백 1칸, 최대 12자, 빈 값이면 'Guest')
  - `export function isNewBest(existingScore, candidateScore) → boolean` (existing이 null/undefined거나 candidate가 더 크면 true)

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/ranking.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNickname, isNewBest } from '../js/ranking.js';

test('닉네임: 트림·연속공백 축약·12자 제한', () => {
  assert.equal(normalizeNickname('  루미  '), '루미');
  assert.equal(normalizeNickname('a   b'), 'a b');
  assert.equal(normalizeNickname('x'.repeat(20)), 'x'.repeat(12));
});

test('닉네임: 빈 값은 Guest', () => {
  assert.equal(normalizeNickname('   '), 'Guest');
  assert.equal(normalizeNickname(''), 'Guest');
});

test('최고점: 기존 없음/더 높음일 때 true', () => {
  assert.equal(isNewBest(null, 100), true);
  assert.equal(isNewBest(undefined, 0), true);
  assert.equal(isNewBest(100, 150), true);
  assert.equal(isNewBest(150, 150), false);
  assert.equal(isNewBest(200, 150), false);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/ranking.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

```js
// js/ranking.js
export function normalizeNickname(raw) {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 12);
  return cleaned.length > 0 ? cleaned : 'Guest';
}

export function isNewBest(existingScore, candidateScore) {
  return existingScore == null || candidateScore > existingScore;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/ranking.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/ranking.js tests/ranking.test.js
git commit -m "feat: 닉네임 정규화 + 최고점 판정"
```

---

### Task 9: particles.js — 공용 파티클 시스템 + 배경 먼지

**Files:**
- Create: `js/particles.js`
- Modify: `js/main.js` (배경 먼지 렌더 확인용 임시 연결)

**Interfaces:**
- Consumes: `CONFIG`
- Produces:
  - `export class ParticleSystem` — `emit(x, y, opts)`, `update(dt)`, `draw(ctx)`, `count`
  - `export class DustField` — 생성자 `(width, height, count)`, `update(dt)`, `draw(ctx)`

**참고:** 렌더링 태스크이므로 수동 검증. 파티클은 `{x,y,vx,vy,life,maxLife,size,color}` 배열로 관리하고 수명 다하면 스왑-제거.

- [ ] **Step 1: particles.js 작성**

```js
// js/particles.js
import { CONFIG } from './config.js';

export class ParticleSystem {
  constructor() { this.list = []; }
  get count() { return this.list.length; }

  emit(x, y, { count = 1, speed = 30, life = 0.6, size = 3, color = '#ffffff', spread = Math.PI * 2 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * spread;
      const s = speed * (0.4 + Math.random() * 0.6);
      this.list.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life, maxLife: life,
        size: size * (0.6 + Math.random() * 0.6),
        color,
      });
    }
  }

  update(dt) {
    const arr = this.list;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.life -= dt;
      if (p.life <= 0) { arr[i] = arr[arr.length - 1]; arr.pop(); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.list) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export class DustField {
  constructor(width, height, count = CONFIG.background.dustCount) {
    this.w = width; this.h = height;
    this.dust = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1.5,
      vy: 4 + Math.random() * 10,
      a: 0.2 + Math.random() * 0.4,
    }));
  }
  update(dt) {
    for (const d of this.dust) {
      d.y += d.vy * dt;
      if (d.y > this.h) { d.y = 0; d.x = Math.random() * this.w; }
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#cbd5ff';
    for (const d of this.dust) {
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
```

- [ ] **Step 2: main.js에 임시 연결 (검증용)**

`main.js` 상단 import에 `import { DustField } from './particles.js';` 추가. `resize()` 아래에 `const dust = new DustField(CONFIG.WIDTH, CONFIG.HEIGHT);` 추가. `update(dt)`에 `dust.update(dt);`, `render()`의 배경 fill 직후에 `dust.draw(ctx);` 추가.

- [ ] **Step 3: 수동 검증**

브라우저 새로고침 → 밤하늘 배경 위로 은은한 먼지 입자들이 아래로 천천히 떠다니고, 화면 밖으로 나가면 위에서 다시 나타난다. 콘솔 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add js/particles.js js/main.js
git commit -m "feat: 공용 파티클 시스템 + 배경 먼지 필드"
```

---

### Task 10: player.js — 루미 이동·HP 비주얼·트레일

**Files:**
- Create: `js/player.js`
- Modify: `js/main.js` (플레이어/입력 임시 연결)
- Create: `js/input.js`

**Interfaces:**
- Consumes: `CONFIG.player`, `hpToVisual` (Task 5), `ParticleSystem` (Task 9)
- Produces:
  - `js/input.js` → `export function createPointerInput(canvas) → { get target():{x,y} }` (캔버스 내부 좌표계로 변환된 포인터 목표)
  - `js/player.js` → `export class Player`
    - 생성자 `(x, y)`
    - 속성: `x, y, hp, invulnSec, radius`(현재 렌더 반경), `shielded`(Task 11에서 사용, 기본 false)
    - `update(dt, targetX, targetY, trail)` — lerp 이동 + 트레일 방출, `invulnSec` 감소
    - `draw(ctx, { fever = false } = {})` — HP 연동 크기/glow/alpha/깜빡임, 피버 시 무지개
    - `hit(damage)` — 무적 아닐 때만 HP 감소하고 무적 시작, 실제 피격 시 true 반환
    - `heal(amount)` — HP += (최대 clamp)

- [ ] **Step 1: input.js 작성 (포인터→내부좌표)**

```js
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
```

- [ ] **Step 2: player.js 작성**

```js
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
```

- [ ] **Step 3: main.js 임시 연결**

`main.js`에 `import { Player } from './player.js';`, `import { createPointerInput } from './input.js';`, `import { ParticleSystem } from './particles.js';` 추가. 초기화에 `const input = createPointerInput(canvas); const trail = new ParticleSystem(); const player = new Player(CONFIG.WIDTH/2, CONFIG.HEIGHT*0.7);`. `update(dt)`에 `player.update(dt, input.target.x, input.target.y, trail); trail.update(dt);`. `render()`에서 배경/먼지 다음에 `trail.draw(ctx); player.draw(ctx);` 추가하고 임시 텍스트 제거.

- [ ] **Step 4: 수동 검증**

- 유령이 마우스/터치를 부드럽게(감속) 따라온다.
- 이동 시 은은한 꼬리 파티클이 남는다.
- 콘솔에서 `player.hp = 10` 강제 설정 시 유령이 작아지고 어두워지며 깜빡인다.

- [ ] **Step 5: Commit**

```bash
git add js/input.js js/player.js js/main.js
git commit -m "feat: 루미 lerp 이동 + HP연동 렌더 + 꼬리 트레일 + 포인터 입력"
```

---

### Task 11: stars.js + items.js — 별 스폰/획득 & 특수 아이템

**Files:**
- Create: `js/stars.js`
- Create: `js/items.js`

**Interfaces:**
- Consumes: `CONFIG.star`, `CONFIG.items`, `circlesOverlap` (Task 6), `ParticleSystem`
- Produces:
  - `js/stars.js` → `export class StarField`
    - `update(dt, spawnMult)` — 타이머 기반 스폰(간격 = spawnIntervalSec × spawnMult)
    - `collect(player, burst) → number` — 유령과 겹친 별 제거, 획득 개수 반환
    - `draw(ctx)`
  - `js/items.js` → `export class ItemField`
    - `update(dt, spawnMult)` — 희귀 스폰(쉴드/파동)
    - `collect(player, burst) → { shield:number, wave:number }` — 획득 시 종류별 개수
    - `draw(ctx)`
    - 각 아이템: `{ x, y, type:'shield'|'wave', radius }`

**참고:** 스폰 위치는 화면 내 랜덤(가장자리 40px 여백). 별 색상 노랑 `#ffe27a`.

- [ ] **Step 1: stars.js 작성**

```js
// js/stars.js
import { CONFIG } from './config.js';
import { circlesOverlap } from './collision.js';

const PAD = 40;
const randX = () => PAD + Math.random() * (CONFIG.WIDTH - PAD * 2);
const randY = () => PAD + Math.random() * (CONFIG.HEIGHT - PAD * 2);

export class StarField {
  constructor() { this.stars = []; this.timer = 0; }

  update(dt, spawnMult = 1) {
    this.timer += dt;
    const interval = CONFIG.star.spawnIntervalSec * spawnMult;
    if (this.timer >= interval) {
      this.timer = 0;
      this.stars.push({ x: randX(), y: randY(), radius: CONFIG.star.radius, phase: Math.random() * 6.28 });
    }
  }

  collect(player, burst) {
    let n = 0;
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      if (circlesOverlap(player.x, player.y, player.radius, s.x, s.y, s.radius)) {
        burst.emit(s.x, s.y, { count: 12, speed: 90, life: 0.6, size: 3, color: '#ffe27a' });
        this.stars[i] = this.stars[this.stars.length - 1];
        this.stars.pop();
        n++;
      }
    }
    return n;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffe27a';
    ctx.shadowColor = '#ffe27a';
    ctx.shadowBlur = 18;
    for (const s of this.stars) {
      drawStar(ctx, s.x, s.y, s.radius);
    }
    ctx.restore();
  }
}

function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    const a2 = a + Math.PI / 5;
    ctx.lineTo(cx + Math.cos(a2) * r * 0.45, cy + Math.sin(a2) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
}

export { drawStar };
```

- [ ] **Step 2: items.js 작성**

```js
// js/items.js
import { CONFIG } from './config.js';
import { circlesOverlap } from './collision.js';
import { drawStar } from './stars.js';

const PAD = 40;
const randX = () => PAD + Math.random() * (CONFIG.WIDTH - PAD * 2);
const randY = () => PAD + Math.random() * (CONFIG.HEIGHT - PAD * 2);

export class ItemField {
  constructor() { this.items = []; this.timer = 0; }

  update(dt, spawnMult = 1) {
    this.timer += dt;
    // 별과 같은 주기 기준으로 확률 롤
    const interval = CONFIG.star.spawnIntervalSec * spawnMult;
    if (this.timer >= interval) {
      this.timer = 0;
      const roll = Math.random();
      if (roll < CONFIG.items.shieldChancePerSpawn) {
        this.items.push({ x: randX(), y: randY(), type: 'shield', radius: 16 });
      } else if (roll < CONFIG.items.shieldChancePerSpawn + CONFIG.items.waveChancePerSpawn) {
        this.items.push({ x: randX(), y: randY(), type: 'wave', radius: 16 });
      }
    }
  }

  collect(player, burst) {
    const got = { shield: 0, wave: 0 };
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (circlesOverlap(player.x, player.y, player.radius, it.x, it.y, it.radius)) {
        got[it.type]++;
        burst.emit(it.x, it.y, { count: 14, speed: 100, life: 0.7, size: 3,
          color: it.type === 'shield' ? '#bfe3ff' : '#ffd0f0' });
        this.items[i] = this.items[this.items.length - 1];
        this.items.pop();
      }
    }
    return got;
  }

  draw(ctx) {
    ctx.save();
    for (const it of this.items) {
      if (it.type === 'shield') {
        ctx.strokeStyle = '#bfe3ff';
        ctx.shadowColor = '#bfe3ff';
        ctx.shadowBlur = 16;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(it.x, it.y, it.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ffd0f0';
        ctx.shadowColor = '#ffd0f0';
        ctx.shadowBlur = 16;
        drawStar(ctx, it.x, it.y, it.radius);
      }
    }
    ctx.restore();
  }
}
```

- [ ] **Step 3: main.js 임시 연결 + 수동 검증**

`main.js`에 `StarField`, `ItemField`, 그리고 획득 폭발용 `burst = new ParticleSystem()` 추가. update에서 `stars.update(dt,1); items.update(dt,1); const got = stars.collect(player, burst); if (got) player.heal(CONFIG.hp.starHeal); items.collect(player, burst); burst.update(dt);`. render에서 별/아이템/버스트 draw. 확인: 노란 별이 주기적으로 생기고, 유령이 닿으면 폭발 파티클과 함께 사라지며 HP가 회복된다. 쉴드/파동 아이템이 가끔 등장한다.

- [ ] **Step 4: Commit**

```bash
git add js/stars.js js/items.js js/main.js
git commit -m "feat: 별 스폰/획득 + 특수 아이템(쉴드/파동)"
```

---

### Task 12: obstacles.js — 레이저·유도 Orb·소나기 빗방울

**Files:**
- Create: `js/obstacles.js`

**Interfaces:**
- Consumes: `CONFIG.obstacle`, `circlesOverlap`, `circleSegmentOverlap`
- Produces: `export class ObstacleField`
  - `update(dt, player, { speedMult, spawnMult })` — 스폰 + 이동 + 수명 관리
  - `hitsPlayer(player) → boolean` — 활성(무적 아닌 데미지 판정) 장애물이 유령과 충돌하는지
  - `destroyAll(burst)` — 화면 내 파괴 가능한 장애물 제거(별똥별 파동/피버용), 파괴 개수 반환
  - `feverCollide(player, burst) → number` — 피버 중 충돌한 장애물 파괴 후 개수 반환
  - `draw(ctx)`
  - 내부 타입: `laser`(state: 'warn'|'active'), `orb`, `rain`

**참고:** 레이저는 경고 1초(붉은 반투명 예고선, 데미지 없음) → active(굵고 밝은 레이저, 데미지) → 소멸. 가로/세로/대각선 랜덤. Orb는 유령을 향해 접근, lifeSec 후 소멸. Rain은 위에서 아래 낙하, 화면 벗어나면 제거.

- [ ] **Step 1: obstacles.js 작성**

```js
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
      const n = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        this.list.push({
          kind: 'rain', x: Math.random() * W, y: -10 - i * 30,
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
```

- [ ] **Step 2: main.js 임시 연결 + 수동 검증**

`main.js`에 `ObstacleField` 추가, update에서 `obstacles.update(dt, player, {speedMult:1, spawnMult:1}); if (obstacles.hitsPlayer(player)) player.hit(CONFIG.hp.hitDamage);`, render에서 `obstacles.draw(ctx)`. 확인:
- 레이저: 붉은 점선 예고선이 1초 뜬 뒤 굵은 광선으로 바뀌고 곧 사라진다. 광선에 닿으면 HP 감소 + 무적 1초.
- Orb: 보라빛 덩어리가 유령을 천천히 쫓다 5초 후 사라진다.
- Rain: 하늘빛 방울들이 위에서 빠르게 떨어진다.

- [ ] **Step 3: Commit**

```bash
git add js/obstacles.js js/main.js
git commit -m "feat: 장애물 3종(레이저/유도Orb/소나기) + 충돌 판정"
```

---

### Task 13: fever.js — 슈퍼노바 피버 모드

**Files:**
- Create: `js/fever.js`

**Interfaces:**
- Consumes: `CONFIG.fever`, `addStarToGauge` (Task 7)
- Produces: `export class Fever`
  - 속성: `gauge`(0..starsToTrigger), `active`(boolean), `remainingSec`
  - `addStars(n) → boolean` — 게이지 누적, 발동되면 true 반환하며 피버 시작
  - `update(dt)` — active 시 remainingSec 감소, 0이면 종료
  - `progress → number` — 게이지 진행률 0..1 (HUD용)

- [ ] **Step 1: fever.js 작성**

```js
// js/fever.js
import { CONFIG } from './config.js';
import { addStarToGauge } from './feverGauge.js';

export class Fever {
  constructor() { this.gauge = 0; this.active = false; this.remainingSec = 0; }

  get progress() { return this.gauge / CONFIG.fever.starsToTrigger; }

  addStars(n = 1) {
    let triggered = false;
    for (let i = 0; i < n; i++) {
      const r = addStarToGauge(this.gauge, 1);
      this.gauge = r.gauge;
      if (r.triggered) triggered = true;
    }
    if (triggered) {
      this.active = true;
      this.remainingSec = CONFIG.fever.durationSec;
    }
    return triggered;
  }

  update(dt) {
    if (!this.active) return;
    this.remainingSec -= dt;
    if (this.remainingSec <= 0) { this.active = false; this.remainingSec = 0; }
  }
}
```

- [ ] **Step 2: main.js 통합 + 수동 검증**

`main.js`에 `const fever = new Fever();`. 별 획득 처리 변경: `const got = stars.collect(player, burst); if (got) { player.heal(CONFIG.hp.starHeal * got); fever.addStars(got); state.stars += got; }`. update에 `fever.update(dt);`. 피버 중 처리: `if (fever.active) { const k = obstacles.feverCollide(player, burst); state.feverKills += k; } else if (!fever.active && obstacles.hitsPlayer(player)) { /* 피격 처리(Task 14에서 쉴드 포함) */ }`. player.draw에 `{ fever: fever.active }` 전달.

확인: 별 10개를 모으면 유령이 무지개빛으로 빛나고 5초간 장애물에 닿으면 장애물이 파괴된다(피격 없음). 5초 후 원래대로 돌아온다.

- [ ] **Step 3: Commit**

```bash
git add js/fever.js js/main.js
git commit -m "feat: 슈퍼노바 피버 모드(무적+장애물 파괴)"
```

---

### Task 14: hud.js — HP바/점수/별/피버게이지 + 화면 흔들림 + 피격 통합

**Files:**
- Create: `js/hud.js`
- Modify: `js/main.js` (중앙 상태 객체 + 피격/쉴드/파동/화면흔들림 통합)

**Interfaces:**
- Consumes: `CONFIG`, `computeScore` (Task 3)
- Produces: `export class Hud`
  - `draw(ctx, { hp, score, stars, feverProgress, feverActive })`
  - `export class ScreenShake` — `trigger(intensity)`, `update(dt)`, `apply(ctx)`(save+translate), `restore(ctx)`

- [ ] **Step 1: hud.js 작성**

```js
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
```

- [ ] **Step 2: main.js — 중앙 상태 객체 + 피격/쉴드/파동/흔들림 통합**

`main.js`에 상태 객체 도입:
```js
const state = { stars: 0, feverKills: 0, elapsedSec: 0 };
const hud = new Hud();
const shake = new ScreenShake();
```
피격 처리(피버 아닐 때):
```js
if (!fever.active && obstacles.hitsPlayer(player)) {
  if (player.shielded) { player.shielded = false; player.invulnSec = CONFIG.hp.invulnSec; }
  else if (player.hit(CONFIG.hp.hitDamage)) { shake.trigger(12); }
}
```
아이템 처리:
```js
const items_got = items.collect(player, burst);
if (items_got.shield) player.shielded = true;
if (items_got.wave) obstacles.destroyAll(burst);
```
시간/점수:
```js
state.elapsedSec += dt;
const score = computeScore({ stars: state.stars, feverKills: state.feverKills, survivedSec: state.elapsedSec });
```
render: `shake.apply(ctx)`로 전체 씬을 감싸고(배경~플레이어), 마지막에 `shake.restore(ctx)` 후 HUD는 흔들림 밖에서 그린다 → `hud.draw(ctx, { hp: player.hp, score, stars: state.stars, feverProgress: fever.progress, feverActive: fever.active })`.

- [ ] **Step 3: 수동 검증**

- 좌상단 HP 바가 파스텔 그라데이션으로 HP에 연동. 우상단 점수/별 카운트 표시. 하단 피버 게이지가 별 획득마다 채워진다.
- 피격 시 화면이 짧게 흔들린다.
- 쉴드 보유 중 피격하면 HP 안 깎이고 쉴드만 사라진다.
- 파동 아이템 획득 시 화면 내 장애물(레이저 제외)이 폭발하며 사라진다.

- [ ] **Step 4: Commit**

```bash
git add js/hud.js js/main.js
git commit -m "feat: HUD(HP/점수/별/피버게이지) + 화면흔들림 + 쉴드/파동 통합"
```

---

### Task 15: ui.js + 씬 상태머신 — 시작/인트로/게임오버 오버레이

**Files:**
- Modify: `index.html` (오버레이 DOM 추가)
- Modify: `css/style.css` (오버레이 스타일)
- Create: `js/ui.js`
- Modify: `js/main.js` (씬 상태머신 `START→INTRO→PLAYING→GAMEOVER`, 게임 리셋)

**Interfaces:**
- Consumes: (없음, DOM 제어)
- Produces: `js/ui.js` → `export function createUI({ onStart, onRestart })`
  - 반환: `{ showStart(), showIntro(onDone), showGameOver({ survivedSec, score, stars, rankingHtml }), hideAll() }`
  - `onStart(nickname)` — 시작 버튼 클릭 시 정규화 전 원본 닉네임 전달
  - `showIntro(onDone)` — 세계관 문구 2.5초 노출 후 `onDone()` 호출

- [ ] **Step 1: index.html에 오버레이 추가**

```html
<!-- #stage 안, canvas 다음에 추가 -->
<div id="overlay" class="overlay hidden">
  <!-- 시작 화면 -->
  <div id="screen-start" class="screen">
    <h1>루미<span>Lumi</span></h1>
    <p class="story">별빛을 모아 나만의 작은 우주를 채워요.</p>
    <p class="howto">마우스·손가락으로 루미를 움직여 노란 별빛을 모으고, 붉은 빛과 먼지를 피하세요.</p>
    <input id="nickname" maxlength="12" placeholder="닉네임 입력" />
    <button id="btn-start">시작</button>
  </div>
  <!-- 인트로 -->
  <div id="screen-intro" class="screen hidden">
    <p class="intro-text">새벽, 모두가 잠든 밤.<br/>아기 유령 루미는 아침이 오기 전<br/>떨어진 별빛을 모아야 해요.</p>
  </div>
  <!-- 게임오버 -->
  <div id="screen-over" class="screen hidden">
    <h2>아침이 밝았어요</h2>
    <div class="result">
      <div><b id="r-time">0</b><span>버틴 시간(초)</span></div>
      <div><b id="r-score">0</b><span>최종 점수</span></div>
      <div><b id="r-stars">0</b><span>모은 별</span></div>
    </div>
    <h3>랭킹 Top 10</h3>
    <ol id="ranking"><li class="loading">불러오는 중…</li></ol>
    <button id="btn-restart">다시 하기</button>
  </div>
</div>
```

- [ ] **Step 2: css/style.css에 오버레이 스타일 추가**

```css
.overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(8, 12, 28, 0.82);
  color: #e6ecff; text-align: center; padding: 24px;
}
.overlay.hidden, .screen.hidden { display: none; }
.screen { max-width: 90%; }
.screen h1 { font-size: 44px; letter-spacing: 2px; }
.screen h1 span { display: block; font-size: 16px; color: #c9a9ff; letter-spacing: 6px; }
.story { margin: 14px 0 6px; color: #cbd5ff; }
.howto { font-size: 13px; color: #94a3c8; margin-bottom: 18px; }
#nickname {
  display: block; width: 220px; margin: 0 auto 14px; padding: 12px;
  border-radius: 10px; border: 1px solid #33406a; background: #131a33; color: #fff; text-align: center;
}
.overlay button {
  padding: 12px 32px; border: none; border-radius: 24px; cursor: pointer;
  background: linear-gradient(90deg, #b9f6ff, #ff9ed8); color: #10203a; font-weight: 700; font-size: 16px;
}
.intro-text { font-size: 20px; line-height: 1.8; color: #dbe4ff; }
.result { display: flex; gap: 18px; justify-content: center; margin: 16px 0; }
.result b { display: block; font-size: 26px; }
.result span { font-size: 12px; color: #94a3c8; }
#ranking { text-align: left; max-width: 260px; margin: 8px auto 18px; padding-left: 20px; font-size: 14px; }
#ranking li { padding: 3px 0; display: flex; justify-content: space-between; }
#ranking li.me { color: #ffe27a; font-weight: 700; }
```

- [ ] **Step 3: ui.js 작성**

```js
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
```

- [ ] **Step 4: main.js — 씬 상태머신 + 리셋**

`scene` 변수(`'START'|'INTRO'|'PLAYING'|'GAMEOVER'`) 도입. `update(dt)`는 `scene === 'PLAYING'`일 때만 게임 로직 수행. 엔티티/상태를 초기화하는 `resetGame()` 함수 작성(player, stars, items, obstacles, fever, state 재생성). UI 콜백:
```js
const ui = createUI({
  onStart: (raw) => { state.nickname = raw; resetGame(); scene = 'INTRO'; ui.showIntro(() => { scene = 'PLAYING'; }); },
  onRestart: () => { scene = 'START'; ui.showStart(); },
});
ui.showStart();
```
`update`에서 PLAYING 중 `player.hp <= 0`이면 `scene = 'GAMEOVER'`로 전환하고 게임오버 처리 함수 호출(랭킹은 Task 17에서 붙임; 지금은 `rankingHtml`에 빈 목록 전달). render는 항상 씬을 그린다(게임오버 시에도 마지막 프레임 유지).

- [ ] **Step 5: 수동 검증**

- 시작 화면: 타이틀/조작법/닉네임 입력/시작 버튼. 시작 클릭 → 세계관 문구 2.5초 → 게임 시작.
- HP 0 → 게임오버 화면에 버틴 시간/점수/별 개수 표시. "다시 하기" → 시작 화면으로.

- [ ] **Step 6: Commit**

```bash
git add index.html css/style.css js/ui.js js/main.js
git commit -m "feat: 시작/인트로/게임오버 오버레이 + 씬 상태머신"
```

---

### Task 16: audio.js — 효과음/BGM 파일 연동 (graceful no-op)

**Files:**
- Create: `js/audio.js`
- Create: `assets/audio/README.md`
- Modify: `js/main.js` (효과음 트리거 연결)

**Interfaces:**
- Consumes: (없음)
- Produces: `export const audio` — `{ load(), play(name), startBgm(), stopBgm() }`
  - `name`: `'star' | 'hit' | 'fever' | 'item'`
  - 파일이 없거나 로드 실패 시 조용히 무시(no-op). 첫 사용자 입력 후 재생(자동재생 정책).

- [ ] **Step 1: audio.js 작성**

```js
// js/audio.js
const FILES = {
  star: 'assets/audio/star.mp3',
  hit: 'assets/audio/hit.mp3',
  fever: 'assets/audio/fever.mp3',
  item: 'assets/audio/item.mp3',
};
const BGM = 'assets/audio/bgm.mp3';

class AudioManager {
  constructor() { this.buffers = {}; this.bgm = null; this.enabled = true; }

  load() {
    for (const [name, url] of Object.entries(FILES)) {
      const a = new Audio();
      a.src = url;
      a.preload = 'auto';
      a.addEventListener('error', () => { this.buffers[name] = null; }); // 파일 없으면 비활성
      this.buffers[name] = a;
    }
    this.bgm = new Audio();
    this.bgm.src = BGM;
    this.bgm.loop = true;
    this.bgm.volume = 0.4;
    this.bgm.addEventListener('error', () => { this.bgm = null; });
  }

  play(name) {
    const a = this.buffers[name];
    if (!a) return;
    try { const c = a.cloneNode(); c.volume = 0.6; c.play().catch(() => {}); } catch {}
  }

  startBgm() { if (this.bgm) this.bgm.play().catch(() => {}); }
  stopBgm() { if (this.bgm) { this.bgm.pause(); this.bgm.currentTime = 0; } }
}

export const audio = new AudioManager();
```

- [ ] **Step 2: assets/audio/README.md 작성**

```markdown
# 오디오 파일

아래 파일을 이 폴더에 넣으면 자동으로 재생됩니다. 없으면 무음으로 동작합니다.

- `star.mp3` — 별 획득
- `hit.mp3` — 피격
- `fever.mp3` — 피버 발동
- `item.mp3` — 특수 아이템 획득
- `bgm.mp3` — 배경음악(루프)
```

- [ ] **Step 3: main.js 연결**

부트스트랩에서 `import { audio } from './audio.js'; audio.load();`. `onStart`에서 `audio.startBgm();`. 트리거: 별 획득 시 `audio.play('star')`, 피격 시 `audio.play('hit')`, 피버 발동(`fever.addStars`가 true) 시 `audio.play('fever')`, 아이템 획득 시 `audio.play('item')`. 게임오버 시 `audio.stopBgm()`.

- [ ] **Step 4: 수동 검증**

- 오디오 파일이 없는 상태에서 게임이 에러 없이 정상 동작(콘솔에 치명적 에러 없음, 무음).
- (선택) 임시 mp3를 넣으면 해당 이벤트에서 소리가 난다.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js assets/audio/README.md js/main.js
git commit -m "feat: 효과음/BGM 파일 연동(파일 없으면 무음)"
```

---

### Task 17: firebase.js — Firestore Top10 랭킹 + 설정 가이드

**Files:**
- Create: `js/firebase.js`
- Create: `docs/superpowers/FIREBASE_SETUP.md`
- Modify: `js/main.js` (게임오버 시 제출/조회 연결)

**Interfaces:**
- Consumes: `normalizeNickname`, `isNewBest` (Task 8)
- Produces: `js/firebase.js`
  - `export function isConfigured() → boolean`
  - `export async function submitScore({ nickname, score, stars, survivedSec }) → void` (기존 최고점보다 높을 때만 트랜잭션 덮어쓰기)
  - `export async function fetchTop10() → Array<{ nickname, score }>`
  - `export function rankingToHtml(list, myNickname) → string` (내 닉네임 하이라이트)

- [ ] **Step 1: firebase.js 작성 (config 미설정 시 비활성)**

```js
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
```

- [ ] **Step 2: FIREBASE_SETUP.md 작성**

```markdown
# Firebase 랭킹 설정 가이드

1. https://console.firebase.google.com 에서 **프로젝트 만들기**.
2. 좌측 **빌드 → Firestore Database → 데이터베이스 만들기** (테스트 모드로 시작).
3. 프로젝트 설정(⚙️) → **내 앱 → 웹 앱 추가(</>)** → 앱 등록 후 표시되는 `firebaseConfig` 값 복사.
4. `js/firebase.js` 상단 `firebaseConfig`에 apiKey/authDomain/projectId/appId 붙여넣기.
5. 실행 후 게임오버 시 점수가 `scores` 컬렉션에 저장되고 Top10이 표시되는지 확인.

## 배포용 보안 규칙(권장)
테스트 모드는 30일 후 만료됩니다. 아래로 교체하세요(읽기 공개, 쓰기는 점수 필드 형식 검증):

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /scores/{nick} {
          allow read: if true;
          allow write: if request.resource.data.score is number
                        && request.resource.data.score >= 0;
        }
      }
    }

> config를 비워두면 랭킹만 비활성화되고 게임은 정상 동작합니다.
```

- [ ] **Step 3: main.js 게임오버 연결**

게임오버 처리 함수(async):
```js
async function onGameOver() {
  audio.stopBgm();
  const score = computeScore({ stars: state.stars, feverKills: state.feverKills, survivedSec: state.elapsedSec });
  ui.showGameOver({ survivedSec: state.elapsedSec, score, stars: state.stars,
    rankingHtml: '<li class="loading">불러오는 중…</li>' });
  try {
    await submitScore({ nickname: state.nickname, score, stars: state.stars, survivedSec: state.elapsedSec });
    const top = await fetchTop10();
    document.getElementById('ranking').innerHTML = rankingToHtml(top, state.nickname);
  } catch {
    document.getElementById('ranking').innerHTML = rankingToHtml([], state.nickname);
  }
}
```
PLAYING 중 `player.hp <= 0` && scene 전환 시 한 번만 `onGameOver()` 호출(중복 방지 플래그).

- [ ] **Step 4: 수동 검증**

- config 비어있는 상태: 게임오버 시 "랭킹을 불러올 수 없어요" 표시, 게임은 정상.
- config 채운 상태(선택): 점수 제출 → Top10 표시, 같은 닉네임 재플레이 시 최고점만 갱신.

- [ ] **Step 5: Commit**

```bash
git add js/firebase.js docs/superpowers/FIREBASE_SETUP.md js/main.js
git commit -m "feat: Firestore Top10 랭킹(최고점만) + 설정 가이드"
```

---

### Task 18: 난이도 통합 + 최종 다듬기 + 플레이테스트

**Files:**
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `difficultyAt` (Task 4)
- Produces: (없음 — 최종 통합)

- [ ] **Step 1: 난이도 곡선 연결**

`update(dt)` PLAYING 블록에서:
```js
const diff = difficultyAt(state.elapsedSec);
stars.update(dt, diff.spawnMult);
items.update(dt, diff.spawnMult);
obstacles.update(dt, player, { speedMult: diff.speedMult, spawnMult: diff.spawnMult });
```

- [ ] **Step 2: 전체 테스트 스위트 실행**

Run: `node --test`
Expected: 모든 순수 로직 테스트 PASS (config/scoring/difficulty/playerVisual/collision/feverGauge/ranking)

- [ ] **Step 3: 통합 플레이테스트 체크리스트**

브라우저(로컬 서버)에서 확인:
- [ ] 시작→인트로→플레이→게임오버→다시하기 전체 흐름 정상.
- [ ] 유령 lerp 이동 + 꼬리 트레일 자연스러움. 모바일 터치로도 조작됨(반응형 크기).
- [ ] HP에 따라 유령 크기/후광/투명도 변화, 20% 이하 깜빡임.
- [ ] 별 획득 +100점·HP+10·피버게이지 상승. 피격 −15·화면흔들림·무적 1초.
- [ ] 별 10개 → 피버(무지개+무적+장애물 파괴+200점), 5초 후 종료.
- [ ] 레이저 예고선→발사, Orb 추적 후 소멸, 소나기 낙하 모두 동작.
- [ ] 쉴드 1회 방어, 파동 장애물 전멸.
- [ ] 시간 경과 시 스폰 잦아지고 빨라짐(체감).
- [ ] 오디오 파일 없어도 에러 없음. Firebase 미설정 시 게임 정상 + 랭킹 안내 문구.

- [ ] **Step 4: 발견된 이슈 수정 후 최종 커밋**

```bash
git add -A
git commit -m "feat: 난이도 곡선 통합 + 최종 통합 플레이테스트 반영"
```

---

## Self-Review (플랜 작성자 체크 결과)

**1. 스펙 커버리지:**
- 세로 비율/모바일 터치 → Task 1, 10. 유령 lerp/트레일/HP비주얼 → Task 5, 10. 배경/먼지 → Task 9. HP바 → Task 14. 피격/회복/무적/화면흔들림 → Task 10, 14. 별 획득/점수 → Task 3, 11. 특수아이템(쉴드/파동) → Task 11, 14. 피버 → Task 7, 13. 장애물 3종+예고선 → Task 12. 난이도 상승 → Task 4, 18. 시작/인트로/게임오버 화면 → Task 15. Firebase Top10(최고점만) → Task 8, 17. 사운드 → Task 16. → 누락 없음.

**2. 플레이스홀더 스캔:** 모든 코드 스텝에 실제 코드 포함. "적절히 처리" 류 표현 없음.

**3. 타입 일관성:** `computeScore({stars,feverKills,survivedSec})`, `difficultyAt→{speedMult,spawnMult}`, `hpToVisual→{ratio,sizeScale,alpha,shadowBlur,danger}`, `addStarToGauge→{gauge,triggered}`, `normalizeNickname/isNewBest`, `ObstacleField.hitsPlayer/destroyAll/feverCollide`, `Fever.addStars/progress/active` — 태스크 간 시그니처 일치 확인.
