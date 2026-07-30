# 루미 UI/게임플레이 폴리시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 루미 게임의 시작/게임/게임오버 화면 UI를 다듬고 게임플레이(추적 속도, 아이템 수명, 방어막 중복, 난이도/피버 표시, 소나기)를 조정한다.

**Architecture:** 신규 시스템 없이 기존 ES 모듈(`js/*.js`), `index.html`, `css/style.css`를 수정한다. 순수 로직(config·난이도·수명·방어막·소나기 분산)은 `node --test`로 검증하고, canvas 렌더·모달 등 브라우저 의존 부분은 헤드리스 스모크로 확인한다.

**Tech Stack:** Vanilla JS (ES modules), HTML5 Canvas, `node --test`, Google Fonts(Jua).

## Global Constraints

- 테스트 러너: `node --test` (프로젝트 루트에서 실행). 기존 23개 테스트는 계속 통과해야 함.
- 각 파일은 ES 모듈(`import/export`). `package.json`에 `"type": "module"`.
- 내부 해상도 고정: `CONFIG.WIDTH=450`, `CONFIG.HEIGHT=800`.
- 결정된 값(verbatim): 유령 `lerp=0.09`, 빗방울 `radius=5`, 별 `lifeSec=5`, 아이템 `lifeSec=3`, 난이도 레벨 `1~10`.
- 게임오버 흔들림은 **즉시 정지**(별도 연출 없음).
- 방어막: 플레이어 보유 중이거나 필드에 미획득 방어막이 있으면 **스폰 안 함**. 효과 중첩 없음(기존 유지).
- 오프라인 시 폰트는 브라우저 기본 폴백 — 게임 동작에 영향 없어야 함.
- 커밋 메시지 말미에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` 포함.

---

## File Structure

- `js/config.js` — 값 조정(lerp, rain.radius) + 신규 필드(star.lifeSec, items.lifeSec).
- `js/difficulty.js` — 기존 `difficultyAt` + 신규 `difficultyLevel`.
- `js/stars.js` — 별 수명(age) + 소멸 이펙트.
- `js/items.js` — 아이템 수명(age) + 소멸 이펙트 + 방어막 스폰 억제.
- `js/obstacles.js` — 소나기 x 분산 헬퍼 + 개수/크기 조정.
- `js/hud.js` — 난이도 `Lv N` 표기 + 피버 남은시간 표시(`formatFeverLabel`).
- `js/main.js` — 호출부 배선(수명/방어막/HUD 게이팅/난이도/피버), 흔들림 즉시 정지, 재시작/홈 콜백, 모달 콜백.
- `js/ui.js` — 게임오버 버튼(재시작/홈), 도움말/랭킹 모달 제어.
- `index.html` — 시작화면 버튼(게임 방법/랭킹 보기), 모달 마크업, 게임오버 버튼, Jua 폰트 링크.
- `css/style.css` — Jua 적용, 전체 크기 축소, 입력/버튼 위치, 결과·랭킹·모달 디자인.
- `tests/*` — config, difficulty, stars, items, obstacles, hud 로직 테스트.

---

### Task 1: config 값 조정 + 난이도 레벨 헬퍼

**Files:**
- Modify: `js/config.js`
- Modify: `js/difficulty.js`
- Test: `tests/config.test.js`, `tests/difficulty.test.js`

**Interfaces:**
- Produces: `CONFIG.player.lerp=0.09`, `CONFIG.obstacle.rain.radius=5`, `CONFIG.star.lifeSec=5`, `CONFIG.items.lifeSec=3`; `difficultyLevel(elapsedSec: number): number` (1..10).

- [ ] **Step 1: 난이도 레벨 실패 테스트 작성**

`tests/difficulty.test.js` 하단에 추가:
```js
import { difficultyAt, difficultyLevel } from '../js/difficulty.js';

test('난이도 레벨: t=0 → Lv 1', () => {
  assert.equal(difficultyLevel(0), 1);
});
test('난이도 레벨: rampSec 이상 → Lv 10', () => {
  assert.equal(difficultyLevel(120), 10);
  assert.equal(difficultyLevel(300), 10);
});
test('난이도 레벨: 중간(60초) → Lv 5', () => {
  assert.equal(difficultyLevel(60), 5); // 1 + floor(0.5*9)=1+4
});
test('난이도 레벨: 음수 입력은 Lv 1', () => {
  assert.equal(difficultyLevel(-10), 1);
});
```
(파일 상단 기존 `import { difficultyAt } from ...`를 위 통합 import로 교체)

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/difficulty.test.js`
Expected: FAIL — `difficultyLevel is not a function`

- [ ] **Step 3: `difficultyLevel` 구현**

`js/difficulty.js`에 추가:
```js
export function difficultyLevel(elapsedSec) {
  const d = CONFIG.difficulty;
  const t = Math.min(Math.max(elapsedSec, 0) / d.rampSec, 1);
  return 1 + Math.floor(t * 9);
}
```

- [ ] **Step 4: config 값 변경 + config 테스트 보강**

`js/config.js` 수정:
- `player.lerp`: `0.12` → `0.09`
- `star`: `radius: 11` 뒤에 `lifeSec: 5` 추가
- `obstacle.rain`: `radius: 7` → `radius: 5`
- `items`: `waveChancePerSpawn: 0.04` 뒤에 `lifeSec: 3` 추가

`tests/config.test.js` 하단에 추가:
```js
test('config: 조정된 값(lerp/rain/수명)', () => {
  assert.equal(CONFIG.player.lerp, 0.09);
  assert.equal(CONFIG.obstacle.rain.radius, 5);
  assert.equal(CONFIG.star.lifeSec, 5);
  assert.equal(CONFIG.items.lifeSec, 3);
});
```

- [ ] **Step 5: 전체 테스트 통과 확인**

Run: `node --test`
Expected: PASS (기존 + 신규 모두)

- [ ] **Step 6: 커밋**

```bash
git add js/config.js js/difficulty.js tests/config.test.js tests/difficulty.test.js
git commit -m "feat: config 값 조정 + 난이도 레벨(Lv 1~10) 헬퍼"
```

---

### Task 2: 별 수명 + 소멸 이펙트

**Files:**
- Modify: `js/stars.js`
- Modify: `js/main.js` (호출부에 `burst` 전달)
- Test: `tests/stars.test.js` (신규)

**Interfaces:**
- Consumes: `CONFIG.star.lifeSec`.
- Produces: `StarField.update(dt, spawnMult=1, burst=null)` — 별에 `age` 누적, `age >= lifeSec`이면 `burst.emit(...)` 후 제거. 별 객체 형태: `{ x, y, radius, phase, age }`.

- [ ] **Step 1: 실패 테스트 작성**

`tests/stars.test.js` 생성:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { StarField } from '../js/stars.js';

test('별: lifeSec 경과 시 제거 + 소멸 이펙트', () => {
  const field = new StarField();
  field.stars.push({ x: 100, y: 100, radius: CONFIG.star.radius, phase: 0, age: 0 });
  const emitted = [];
  const burst = { emit: (x, y, o) => emitted.push({ x, y, o }) };

  // lifeSec 미만: 유지 (spawnMult 큼 → 신규 스폰 방지)
  field.update(CONFIG.star.lifeSec - 0.1, 999, burst);
  assert.equal(field.stars.length, 1);
  assert.equal(emitted.length, 0);

  // 누적으로 lifeSec 초과: 제거 + emit 1회
  field.update(0.2, 999, burst);
  assert.equal(field.stars.length, 0);
  assert.equal(emitted.length, 1);
});

test('별: burst 없이 update 호출해도 예외 없음', () => {
  const field = new StarField();
  field.stars.push({ x: 10, y: 10, radius: CONFIG.star.radius, phase: 0, age: CONFIG.star.lifeSec });
  assert.doesNotThrow(() => field.update(0.1, 999));
  assert.equal(field.stars.length, 0);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/stars.test.js`
Expected: FAIL (별이 제거되지 않음 / age 미존재)

- [ ] **Step 3: `stars.js` 수정**

`update` 및 spawn 교체:
```js
update(dt, spawnMult = 1, burst = null) {
  this.timer += dt;
  const interval = CONFIG.star.spawnIntervalSec * spawnMult;
  if (this.timer >= interval) {
    this.timer = 0;
    this.stars.push({ x: randX(), y: randY(), radius: CONFIG.star.radius, phase: Math.random() * 6.28, age: 0 });
  }
  for (let i = this.stars.length - 1; i >= 0; i--) {
    const s = this.stars[i];
    s.age += dt;
    if (s.age >= CONFIG.star.lifeSec) {
      if (burst) burst.emit(s.x, s.y, { count: 6, speed: 30, life: 0.4, size: 2, color: '#8a7a4a' });
      this.stars[i] = this.stars[this.stars.length - 1];
      this.stars.pop();
    }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/stars.test.js`
Expected: PASS

- [ ] **Step 5: `main.js` 호출부 수정**

`js/main.js` `update()`의 `stars.update(dt, diff.spawnMult);`를:
```js
stars.update(dt, diff.spawnMult, burst);
```
로 변경.

- [ ] **Step 6: 문법 확인 + 전체 테스트**

Run: `node --check js/main.js && node --test`
Expected: 문법 OK, 전체 PASS

- [ ] **Step 7: 커밋**

```bash
git add js/stars.js js/main.js tests/stars.test.js
git commit -m "feat: 별 수명(5초) + 소멸 이펙트"
```

---

### Task 3: 아이템 수명 + 방어막 스폰 억제 + 소멸 이펙트

**Files:**
- Modify: `js/items.js`
- Modify: `js/main.js` (호출부에 `burst`, `player.shielded` 전달)
- Test: `tests/items.test.js` (신규)

**Interfaces:**
- Consumes: `CONFIG.items.lifeSec`, `CONFIG.items.shieldChancePerSpawn`, `CONFIG.items.waveChancePerSpawn`.
- Produces: `ItemField.update(dt, spawnMult=1, burst=null, playerShielded=false)` — 아이템에 `age` 누적, 만료 시 `burst.emit` 후 제거. 방어막 롤이어도 `playerShielded` 또는 필드에 `type==='shield'` 존재 시 스폰 생략. 아이템 형태: `{ x, y, type, radius, age }`.

- [ ] **Step 1: 실패 테스트 작성**

`tests/items.test.js` 생성:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { ItemField } from '../js/items.js';

const withRandom = (val, fn) => {
  const orig = Math.random; Math.random = () => val;
  try { return fn(); } finally { Math.random = orig; }
};

test('아이템: lifeSec 경과 시 제거 + 소멸 이펙트', () => {
  const field = new ItemField();
  field.items.push({ x: 50, y: 50, type: 'wave', radius: 16, age: 0 });
  const emitted = [];
  const burst = { emit: (x, y, o) => emitted.push({ x, y, o }) };
  field.update(CONFIG.items.lifeSec + 0.01, 999, burst, false);
  assert.equal(field.items.length, 0);
  assert.equal(emitted.length, 1);
});

test('아이템: 방어막 보유 중이면 방어막 스폰 안 함', () => {
  const field = new ItemField();
  field.timer = CONFIG.star.spawnIntervalSec; // 즉시 스폰 조건
  withRandom(0, () => field.update(0.001, 1, null, true)); // roll=0 → shield, playerShielded=true
  assert.equal(field.items.filter((i) => i.type === 'shield').length, 0);
});

test('아이템: 필드에 방어막 있으면 새 방어막 스폰 안 함', () => {
  const field = new ItemField();
  field.items.push({ x: 10, y: 10, type: 'shield', radius: 16, age: 0 });
  field.timer = CONFIG.star.spawnIntervalSec;
  withRandom(0, () => field.update(0.001, 1, null, false));
  assert.equal(field.items.filter((i) => i.type === 'shield').length, 1); // 그대로 1개
});

test('아이템: 조건 충족 시 방어막 스폰됨', () => {
  const field = new ItemField();
  field.timer = CONFIG.star.spawnIntervalSec;
  withRandom(0, () => field.update(0.001, 1, null, false));
  assert.equal(field.items.filter((i) => i.type === 'shield').length, 1);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/items.test.js`
Expected: FAIL

- [ ] **Step 3: `items.js` 수정**

`update` 교체:
```js
update(dt, spawnMult = 1, burst = null, playerShielded = false) {
  this.timer += dt;
  const interval = CONFIG.star.spawnIntervalSec * spawnMult;
  if (this.timer >= interval) {
    this.timer = 0;
    const roll = Math.random();
    if (roll < CONFIG.items.shieldChancePerSpawn) {
      const shieldExists = this.items.some((it) => it.type === 'shield');
      if (!playerShielded && !shieldExists) {
        this.items.push({ x: randX(), y: randY(), type: 'shield', radius: 16, age: 0 });
      }
    } else if (roll < CONFIG.items.shieldChancePerSpawn + CONFIG.items.waveChancePerSpawn) {
      this.items.push({ x: randX(), y: randY(), type: 'wave', radius: 16, age: 0 });
    }
  }
  for (let i = this.items.length - 1; i >= 0; i--) {
    const it = this.items[i];
    it.age += dt;
    if (it.age >= CONFIG.items.lifeSec) {
      if (burst) burst.emit(it.x, it.y, { count: 6, speed: 30, life: 0.4, size: 2,
        color: it.type === 'shield' ? '#6a8296' : '#96667f' });
      this.items[i] = this.items[this.items.length - 1];
      this.items.pop();
    }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/items.test.js`
Expected: PASS

- [ ] **Step 5: `main.js` 호출부 수정**

`js/main.js` `update()`의 `items.update(dt, diff.spawnMult);`를:
```js
items.update(dt, diff.spawnMult, burst, player.shielded);
```
로 변경.

- [ ] **Step 6: 문법 확인 + 전체 테스트**

Run: `node --check js/main.js && node --test`
Expected: 문법 OK, 전체 PASS

- [ ] **Step 7: 커밋**

```bash
git add js/items.js js/main.js tests/items.test.js
git commit -m "feat: 아이템 수명(3초) + 방어막 중복 스폰 방지 + 소멸 이펙트"
```

---

### Task 4: 소나기 분산 + 크기

**Files:**
- Modify: `js/obstacles.js`
- Test: `tests/obstacles.test.js` (신규)

**Interfaces:**
- Produces: `rainXPositions(n: number, width: number, rng=Math.random): number[]` — 길이 `n`, 각 원소가 폭을 `n`등분한 셀 i 내부에 위치(뭉치지 않음). `_spawn`의 rain 분기가 이를 사용, 개수 3~5.

- [ ] **Step 1: 실패 테스트 작성**

`tests/obstacles.test.js` 생성:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rainXPositions } from '../js/obstacles.js';

test('소나기: x좌표가 셀 단위로 고르게 분산', () => {
  const n = 5, W = 450;
  const xs = rainXPositions(n, W, () => 0.5);
  assert.equal(xs.length, n);
  const cell = W / n;
  for (let i = 0; i < n; i++) {
    assert.ok(xs[i] >= cell * i && xs[i] <= cell * (i + 1), `x[${i}]=${xs[i]} not in cell ${i}`);
  }
});

test('소나기: 인접 방울이 뭉치지 않음(간격 > 셀의 절반)', () => {
  const n = 4, W = 450;
  const cell = W / n;
  for (const r of [0, 0.5, 1]) {
    const xs = rainXPositions(n, W, () => r);
    for (let i = 1; i < n; i++) {
      assert.ok(xs[i] - xs[i - 1] > cell * 0.5);
    }
  }
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/obstacles.test.js`
Expected: FAIL — `rainXPositions is not a function`

- [ ] **Step 3: `obstacles.js` 수정**

파일 하단(맨 끝)에 export 헬퍼 추가:
```js
export function rainXPositions(n, width, rng = Math.random) {
  const cell = width / n;
  const xs = [];
  for (let i = 0; i < n; i++) {
    xs.push(cell * (i + 0.15 + rng() * 0.7)); // 각 셀 15%~85% 지점
  }
  return xs;
}
```
파일 상단 `import` 아래에 `rainXPositions`를 `_spawn`에서 쓰도록, `_spawn`의 rain 분기(마지막 `else`)를 교체:
```js
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
```
(`CONFIG.obstacle.rain.radius`는 Task 1에서 5로 변경됨 → 크기 감소 자동 반영)

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/obstacles.test.js`
Expected: PASS

- [ ] **Step 5: 문법 확인 + 전체 테스트**

Run: `node --check js/obstacles.js && node --test`
Expected: 문법 OK, 전체 PASS

- [ ] **Step 6: 커밋**

```bash
git add js/obstacles.js tests/obstacles.test.js
git commit -m "feat: 소나기 x좌표 균등 분산 + 크기 감소"
```

---

### Task 5: HUD — 난이도 표시 + 피버 남은시간, HUD 게이팅

**Files:**
- Modify: `js/hud.js`
- Modify: `js/main.js` (render 배선: HUD를 PLAYING에서만, level·fever 전달)
- Test: `tests/hud.test.js` (신규 — `formatFeverLabel`)

**Interfaces:**
- Consumes: `difficultyLevel` (Task 1), `Fever.remainingSec`/`CONFIG.fever.durationSec`.
- Produces: `formatFeverLabel(remainingSec: number): string` (예: `"FEVER 3.2초"`, 음수/0은 `"FEVER 0.0초"`). `Hud.draw(ctx, { hp, score, stars, level, feverProgress, feverActive, feverRemainingSec, feverDurationSec })`.

- [ ] **Step 1: 실패 테스트 작성**

`tests/hud.test.js` 생성:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatFeverLabel } from '../js/hud.js';

test('피버 라벨: 소수 1자리', () => {
  assert.equal(formatFeverLabel(3.2), 'FEVER 3.2초');
});
test('피버 라벨: 음수/0은 0.0으로', () => {
  assert.equal(formatFeverLabel(0), 'FEVER 0.0초');
  assert.equal(formatFeverLabel(-1), 'FEVER 0.0초');
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/hud.test.js`
Expected: FAIL — `formatFeverLabel is not a function`

- [ ] **Step 3: `hud.js` 수정**

파일 하단에 추가:
```js
export function formatFeverLabel(remainingSec) {
  return `FEVER ${Math.max(0, remainingSec).toFixed(1)}초`;
}
```
`Hud.draw` 시그니처와 하단 바/난이도 표기 교체:
```js
draw(ctx, { hp, score, stars, level, feverProgress, feverActive, feverRemainingSec = 0, feverDurationSec = 1 }) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = '14px system-ui';

  // HP 바 (좌상단) — 기존 그대로 유지
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

  // 점수/별/난이도 (우상단)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e6ecff';
  ctx.font = '18px system-ui';
  ctx.fillText(`${score}`, CONFIG.WIDTH - 16, 30);
  ctx.font = '13px system-ui';
  ctx.fillStyle = '#ffe27a';
  ctx.fillText(`★ ${stars}`, CONFIG.WIDTH - 16, 50);
  ctx.font = '12px system-ui';
  ctx.fillStyle = '#cbd5ff';
  ctx.fillText(`Lv ${level}`, CONFIG.WIDTH - 16, 70);

  // 피버 바 (하단)
  ctx.textAlign = 'left';
  const fx = 16, fy = CONFIG.HEIGHT - 24, fw = CONFIG.WIDTH - 32, fh = 8;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(ctx, fx, fy, fw, fh, 4); ctx.fill();
  if (feverActive) {
    const rem = Math.min(1, Math.max(0, feverRemainingSec) / feverDurationSec);
    ctx.fillStyle = '#fff';
    roundRect(ctx, fx, fy, fw * rem, fh, 4); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '12px system-ui';
    ctx.fillText(formatFeverLabel(feverRemainingSec), fx, fy - 6);
  } else {
    ctx.fillStyle = '#c9a9ff';
    roundRect(ctx, fx, fy, fw * Math.min(1, feverProgress), fh, 4); ctx.fill();
  }

  ctx.restore();
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/hud.test.js`
Expected: PASS

- [ ] **Step 5: `main.js` render 배선**

`js/main.js` 상단 import에 `difficultyLevel` 추가:
```js
import { difficultyAt, difficultyLevel } from './difficulty.js';
```
`render()`의 마지막 `hud.draw(...)` 호출을 `scene === 'PLAYING'` 가드 + 신규 인자로 교체:
```js
  shake.restore(ctx);
  if (scene === 'PLAYING') {
    hud.draw(ctx, {
      hp: player.hp, score: state.score, stars: state.stars,
      level: difficultyLevel(state.elapsedSec),
      feverProgress: fever.progress, feverActive: fever.active,
      feverRemainingSec: fever.remainingSec, feverDurationSec: CONFIG.fever.durationSec,
    });
  }
```
(기존 무조건 `hud.draw(...)` 한 줄을 위 블록으로 대체)

- [ ] **Step 6: 문법 확인 + 전체 테스트**

Run: `node --check js/main.js && node --check js/hud.js && node --test`
Expected: 문법 OK, 전체 PASS

- [ ] **Step 7: 커밋**

```bash
git add js/hud.js js/main.js tests/hud.test.js
git commit -m "feat: HUD 난이도(Lv) 표시 + 피버 남은시간 + 시작화면 HUD 숨김"
```

---

### Task 6: 게임오버 흔들림 즉시 정지 + 재시작/홈 버튼

**Files:**
- Modify: `js/main.js` (흔들림 리셋, onRestart/onHome 콜백)
- Modify: `js/ui.js` (onRestart/onHome 바인딩, hideAll 유지)
- Modify: `index.html` (`#screen-over` 버튼 2개)

**Interfaces:**
- Consumes: `createUI({ onStart, onRestart, onHome })`, `ui.showStart()`, `ui.hideAll()`.
- Produces: `다시 하기`(id `btn-restart`) → 즉시 재시작, `시작화면으로`(id `btn-home`) → 홈.

- [ ] **Step 1: `index.html` 버튼 마크업 수정**

`#screen-over`의 `<button id="btn-restart">다시 하기</button>`를 다음으로 교체:
```html
<div class="over-actions">
  <button id="btn-restart">다시 하기</button>
  <button id="btn-home" class="btn-secondary">시작화면으로</button>
</div>
```

- [ ] **Step 2: `ui.js` 콜백 배선**

`createUI({ onStart, onRestart })` → `createUI({ onStart, onRestart, onHome })`.
기존 `document.getElementById('btn-restart')...` 아래에 홈 버튼 바인딩 추가:
```js
document.getElementById('btn-restart').addEventListener('click', () => onRestart());
document.getElementById('btn-home').addEventListener('click', () => onHome());
```

- [ ] **Step 3: `main.js` 흔들림 정지 + 콜백 변경**

`onGameOver()` 함수 본문 첫 줄들에 흔들림 즉시 정지 추가(토큰 증가 직후):
```js
async function onGameOver() {
  const token = ++gameOverSeq;
  shake.t = 0; shake.intensity = 0;
  audio.stopBgm();
  ...
```
`createUI({...})` 콜백 교체:
```js
const ui = createUI({
  onStart: (raw) => { resetGame(); state.nickname = raw; scene = 'INTRO'; audio.startBgm(); ui.showIntro(() => { scene = 'PLAYING'; }); },
  onRestart: () => { resetGame(); scene = 'PLAYING'; ui.hideAll(); audio.startBgm(); },
  onHome: () => { scene = 'START'; ui.showStart(); },
});
```
(`resetGame()`은 `state.nickname`을 보존하므로 재시작 시 닉네임 유지됨)

- [ ] **Step 4: 문법 확인 + 전체 테스트**

Run: `node --check js/main.js && node --check js/ui.js && node --test`
Expected: 문법 OK, 전체 PASS(23+신규 유지)

- [ ] **Step 5: 커밋**

```bash
git add js/main.js js/ui.js index.html
git commit -m "feat: 게임오버 흔들림 즉시 정지 + 다시하기(즉시 재시작)/시작화면으로 버튼"
```

---

### Task 7: 시작화면·결과화면 스타일 (Jua 폰트/크기 축소/위치/카드 디자인) + 마크업

**Files:**
- Modify: `index.html` (Jua `<link>`, 시작화면 버튼/모달 마크업)
- Modify: `css/style.css`

**Interfaces:**
- Produces: 시작화면 버튼 `게임 방법`(id `btn-help`), `랭킹 보기`(id `btn-ranking-view`); 모달 `#modal-help`, `#modal-ranking`(각각 내부 `.modal-card`, 닫기 버튼 `.modal-close`, 랭킹 리스트 `#ranking-view`). Task 8이 이 id들을 사용.

- [ ] **Step 1: `index.html` `<head>`에 Jua 폰트 링크 추가**

`<link rel="stylesheet" href="css/style.css" />` **위**에 추가:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet" />
```

- [ ] **Step 2: `index.html` 시작화면 버튼 + 모달 마크업 추가**

`#screen-start`의 `<button id="btn-start">시작</button>` **아래**에 추가:
```html
<div class="start-actions">
  <button id="btn-help" class="btn-secondary">게임 방법</button>
  <button id="btn-ranking-view" class="btn-secondary">랭킹 보기</button>
</div>
```
`#overlay` div가 닫히는 `</div>` **다음, `<script>` 앞**에 모달 2개 추가:
```html
<div id="modal-help" class="modal hidden">
  <div class="modal-card">
    <h3>게임 방법</h3>
    <ul class="help-list">
      <li>마우스·손가락으로 <b>루미</b>를 움직여요.</li>
      <li>노란 <b>별빛</b>을 모으면 HP가 회복돼요.</li>
      <li>붉은 빛·먼지·장애물에 닿으면 HP가 줄어요.</li>
      <li><b>방어막</b>: 1회 피격 무효 · <b>파동</b>: 장애물 일괄 제거</li>
      <li><b>피버</b>: 별 10개를 모으면 5초간 무적 + 장애물 파괴</li>
      <li>장애물: 레이저(경고 후 발사) · 유도 오브 · 소나기</li>
    </ul>
    <h4>점수 기준</h4>
    <ul class="help-list">
      <li>별 1개 = 100점</li>
      <li>피버 중 장애물 파괴 = 200점</li>
      <li>생존 = 초당 10점</li>
    </ul>
    <button class="modal-close">닫기</button>
  </div>
</div>
<div id="modal-ranking" class="modal hidden">
  <div class="modal-card">
    <h3>랭킹 Top 10</h3>
    <ol id="ranking-view" class="ranking-list"><li class="loading">불러오는 중…</li></ol>
    <button class="modal-close">닫기</button>
  </div>
</div>
```

- [ ] **Step 3: `css/style.css` — Jua 적용 + 전체 크기 축소 + 위치**

`.screen h1` 규칙 교체 및 관련 크기 축소:
```css
.screen h1 { font-family: 'Jua', system-ui, sans-serif; font-size: 38px; letter-spacing: 1px; }
.screen h1 span { display: block; font-family: 'Jua', system-ui, sans-serif; font-size: 15px; color: #c9a9ff; letter-spacing: 5px; }
.story { margin: 10px 0 4px; font-size: 14px; color: #cbd5ff; }
.howto { font-size: 12px; color: #94a3c8; margin-bottom: 14px; }
#nickname {
  display: block; width: 200px; margin: 22px auto 12px; padding: 10px;
  border-radius: 10px; border: 1px solid #33406a; background: #131a33; color: #fff; text-align: center; font-size: 14px;
}
.overlay button {
  padding: 10px 28px; border: none; border-radius: 22px; cursor: pointer;
  background: linear-gradient(90deg, #b9f6ff, #ff9ed8); color: #10203a; font-weight: 700; font-size: 15px;
}
```
(`#nickname`의 `margin` 상단을 22px로 키워 입력창/시작버튼을 살짝 아래로 내림)

- [ ] **Step 4: `css/style.css` — 보조 버튼 + 액션 레이아웃 + 모달**

파일 하단에 추가:
```css
.start-actions, .over-actions { display: flex; gap: 10px; justify-content: center; margin-top: 12px; }
.overlay button.btn-secondary {
  background: transparent; color: #cbd5ff; border: 1px solid #3a4a7a; font-weight: 600; font-size: 13px; padding: 8px 16px;
}
.modal {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: rgba(4, 8, 20, 0.78); padding: 24px;
}
.modal.hidden { display: none; }
.modal-card {
  background: #131a33; border: 1px solid #33406a; border-radius: 16px;
  padding: 22px 24px; max-width: 320px; width: 100%; text-align: left; color: #e6ecff;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
}
.modal-card h3 { font-family: 'Jua', system-ui, sans-serif; font-size: 20px; margin-bottom: 12px; text-align: center; }
.modal-card h4 { font-size: 14px; margin: 14px 0 6px; color: #c9a9ff; }
.help-list { list-style: none; padding: 0; font-size: 13px; line-height: 1.7; color: #cbd5ff; }
.help-list b { color: #fff; }
.modal-card .modal-close { display: block; margin: 18px auto 0; }
```

- [ ] **Step 5: `css/style.css` — 결과/랭킹 카드 디자인**

`.result` 및 `#ranking` 규칙을 교체/보강:
```css
.result { display: flex; gap: 10px; justify-content: center; margin: 16px 0; }
.result > div {
  background: #131a33; border: 1px solid #2a3560; border-radius: 12px;
  padding: 12px 14px; min-width: 78px;
}
.result b { display: block; font-size: 24px; color: #fff; }
.result span { font-size: 11px; color: #94a3c8; }
.ranking-list, #ranking {
  list-style: none; text-align: left; max-width: 280px; margin: 8px auto 16px; padding: 0; font-size: 14px;
}
.ranking-list li, #ranking li {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 12px; border-radius: 8px; background: rgba(255,255,255,0.04); margin-bottom: 4px;
}
.ranking-list li.me, #ranking li.me { color: #ffe27a; font-weight: 700; background: rgba(255,226,122,0.12); }
.ranking-list li.loading, #ranking li.loading { justify-content: center; color: #94a3c8; background: none; }
```

- [ ] **Step 6: 검증 (서버+헤드리스 스모크 또는 브라우저 육안)**

정적 서버 실행 후 시작화면·모달 버튼·게임오버 카드가 렌더되는지 확인.
Run(예):
```bash
python -m http.server 8123 --bind 127.0.0.1
```
브라우저에서 `http://127.0.0.1:8123/index.html` 열어 시작화면 폰트/크기/버튼 확인.
Expected: `루미` 타이틀에 Jua 적용, 시작화면에 `게임 방법`·`랭킹 보기` 버튼 표시, UI가 이전보다 작아짐. (모달 열림/랭킹 로드는 Task 8에서 배선)

- [ ] **Step 7: 전체 테스트(회귀 확인) + 커밋**

Run: `node --test`
Expected: PASS (JS 로직 변경 없음)
```bash
git add index.html css/style.css
git commit -m "feat: 시작화면 Jua 폰트/크기 축소/버튼·모달 마크업 + 결과·랭킹 카드 디자인"
```

---

### Task 8: 도움말/랭킹 모달 동작 배선

**Files:**
- Modify: `js/ui.js` (모달 show/hide, 버튼 바인딩)
- Modify: `js/main.js` (도움말/랭킹 콜백, 랭킹 fetch)

**Interfaces:**
- Consumes: `#btn-help`, `#btn-ranking-view`, `#modal-help`, `#modal-ranking`, `#ranking-view`, `.modal-close`(Task 7); `fetchTop10`, `rankingToHtml`(firebase.js).
- Produces: `createUI({ ..., onHelp, onRanking })`; `ui.showHelp()`, `ui.showRankingModal()`, `ui.setRankingView(html)`.

- [ ] **Step 1: `ui.js` 모달 제어 추가**

`createUI` 인자에 `onHelp, onRanking` 추가, 함수 내부에 요소 조회·바인딩·메서드 추가:
```js
const mHelp = document.getElementById('modal-help');
const mRank = document.getElementById('modal-ranking');
const rankView = document.getElementById('ranking-view');

document.getElementById('btn-help').addEventListener('click', () => onHelp());
document.getElementById('btn-ranking-view').addEventListener('click', () => onRanking());
mHelp.querySelector('.modal-close').addEventListener('click', () => mHelp.classList.add('hidden'));
mRank.querySelector('.modal-close').addEventListener('click', () => mRank.classList.add('hidden'));

function showHelp() { mHelp.classList.remove('hidden'); }
function showRankingModal() { rankView.innerHTML = '<li class="loading">불러오는 중…</li>'; mRank.classList.remove('hidden'); }
function setRankingView(html) { rankView.innerHTML = html; }
```
`return { ... }`에 `showHelp, showRankingModal, setRankingView` 추가.

- [ ] **Step 2: `main.js` 콜백 배선**

`createUI({...})`에 콜백 추가:
```js
onHelp: () => ui.showHelp(),
onRanking: async () => {
  ui.showRankingModal();
  try {
    const top = await fetchTop10();
    ui.setRankingView(rankingToHtml(top, state.nickname));
  } catch {
    ui.setRankingView(rankingToHtml([], state.nickname));
  }
},
```
(`fetchTop10`, `rankingToHtml`는 이미 `main.js` 상단에서 import 되어 있음)

- [ ] **Step 3: 문법 확인 + 전체 테스트**

Run: `node --check js/main.js && node --check js/ui.js && node --test`
Expected: 문법 OK, 전체 PASS

- [ ] **Step 4: 헤드리스 스모크로 동작 확인**

정적 서버 실행 후: 시작화면 → `게임 방법` 클릭 시 도움말 모달 열림/닫힘, `랭킹 보기` 클릭 시 랭킹 모달 열림(미설정 시 "랭킹을 불러올 수 없어요"), 게임 진행 중 HUD에 `Lv`/피버 남은시간 표시, 게임오버 후 흔들림 없음·`다시 하기`/`시작화면으로` 동작 확인.

- [ ] **Step 5: 커밋**

```bash
git add js/ui.js js/main.js
git commit -m "feat: 시작화면 도움말/랭킹 모달 동작 배선"
```

---

## Self-Review

**Spec coverage:**
- 시작: 폰트(T7), 게임방법 팝업(T7·T8), 입력/버튼 위치(T7), HUD 숨김(T5), 크기 축소(T7), 랭킹 보기 버튼(T7·T8) ✅
- 게임: 추적 속도(T1), 별/아이템 수명+이펙트(T2·T3), 피버 표시(T5), 방어막 중복 방지(T3), 난이도 표시(T1·T5), 소나기 뭉침(T4), 빗방울 크기(T1·T4) ✅
- 게임오버: 흔들림 정지(T6), 시작화면 복귀 버튼(T6), 결과/랭킹 디자인(T7) ✅

**Placeholder scan:** 모든 스텝에 실제 코드/마크업 포함. TODO/TBD 없음.

**Type consistency:** `update(dt, spawnMult, burst[, playerShielded])` 시그니처가 stars/items/main 호출부 일치. `hud.draw` 인자 키가 main render 배선과 일치. `difficultyLevel` import 경로 일치. 모달 id(`btn-help`, `btn-ranking-view`, `modal-help`, `modal-ranking`, `ranking-view`, `.modal-close`)가 T7 마크업과 T8 배선에서 동일.

## 검증 노트
- 순수 로직: `node --test` (config, difficulty, stars, items, obstacles, hud).
- 브라우저 의존(canvas/모달): 헤드리스 Edge + 정적 서버 스모크(최종 리뷰 단계에서 전 구간 1회).
