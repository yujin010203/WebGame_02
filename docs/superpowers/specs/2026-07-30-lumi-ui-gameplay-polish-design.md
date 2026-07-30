# 루미 UI/게임플레이 폴리시 — 설계 문서

날짜: 2026-07-30
브랜치: `feat/lumi-polish`
베이스: `master` (`6d53dad`)

기존 "루미 별빛을 모으는 아기 유령" 게임에 대한 UI 다듬기 + 게임플레이 조정 패스.
새 시스템을 추가하지 않고 기존 모듈(`js/*.js`, `index.html`, `css/style.css`)을 수정한다.

## 결정 사항 (사용자 승인)

- 타이틀 폰트: **Jua** (Google Fonts, 오프라인 시 기본폰트 폴백)
- 난이도 표시: **레벨 Lv 1~10** (경과 0~120초를 10단계로)
- 게임오버 버튼: **`다시 하기` = 즉시 재시작(인트로 생략, 닉네임 유지)** + **`시작화면으로` = 홈**
- 방어막: **보유 중이거나 필드에 미획득 방어막이 있으면 새 방어막 스폰 안 함** (효과 중첩은 기존대로 없음)
- 게임오버 화면 흔들림: **즉시 정지** (별도 연출 없음, 버그 수정)

---

## 시작 화면

### 1. 타이틀 폰트 (Jua)
- `index.html` `<head>`에 Google Fonts `Jua` `<link>` 추가.
- `css/style.css`에서 `.screen h1`(및 `span`)에 `font-family: 'Jua', system-ui, sans-serif`.
- 네트워크 실패 시 브라우저가 폴백 폰트를 자동 사용 → 게임 동작에 영향 없음.

### 2. 게임 방법 팝업
- 시작 화면(`#screen-start`)에 `게임 방법` 버튼 추가.
- 클릭 시 모달(`#modal-help`) 표시. 내용:
  - 조작: 마우스/손가락으로 루미 이동
  - 목표: 노란 별빛 획득(HP 회복), 붉은 빛/장애물 회피
  - 점수 기준: 별 100 / 피버 파괴 200 / 생존 초당 10
  - 아이템: 방어막(1회 피격 무효), 파동(장애물 일괄 제거)
  - 피버: 별 10개 모으면 5초간 무적 + 장애물 파괴
  - 장애물 3종: 레이저(경고 후 발사), 유도 오브, 소나기
- `닫기` 버튼으로 시작 화면 복귀.

### 3. 랭킹 보기 팝업
- 시작 화면에 `랭킹 보기` 버튼 추가.
- 클릭 시 모달(`#modal-ranking`) 표시 → `fetchTop10()` 호출해 Top 10 렌더(`rankingToHtml`).
- 로딩 중 "불러오는 중…", Firebase 미설정/실패 시 "랭킹을 불러올 수 없어요" 폴백.
- `닫기` 버튼으로 복귀.

### 4. 입력창/시작버튼 위치 + 전체 크기 축소
- 닉네임 입력 + 시작 버튼을 살짝 아래로 (간격 `margin` 조정).
- 타이틀/문구/입력창/버튼의 폰트 크기·여백을 전반적으로 축소 (CSS만).

### 5. 게임 UI 미리보이기 방지
- HUD(HP 바, 점수, 별, 피버 게이지, 난이도)는 `scene === 'PLAYING'`일 때만 렌더.
- `main.js` `render()`에서 `hud.draw(...)` 호출을 `PLAYING` 조건으로 가드.
- 유령(player)·배경 먼지는 시작 화면에서도 계속 렌더(요구: 유령은 보여도 됨).

---

## 게임 화면

### 6. 유령 추적 속도
- `CONFIG.player.lerp` 0.12 → **0.09**. (약간 더 느리게 따라옴)

### 7. 별/아이템 수명 + 소멸 이펙트
- `CONFIG`에 `star.lifeSec = 5`, `items.lifeSec = 3` 추가.
- `StarField`/`ItemField`의 객체에 `age` 필드 추가, `update`에서 `age += dt`.
- `age >= lifeSec`이면 제거하면서 소멸 이펙트: `burst.emit`로 옅은(저속·짧은 수명) 파티클 팟.
- 이를 위해 `StarField.update(dt, spawnMult, burst)`, `ItemField.update(dt, spawnMult, burst, playerShielded)` 시그니처로 확장.
- 획득(`collect`) 시에는 기존 이펙트 유지(수명 만료 이펙트와 구분: 만료는 더 흐릿하게).

### 8. 피버 상태 표시(남은 시간)
- `Fever`는 이미 `active`, `remainingSec`, `CONFIG.fever.durationSec` 보유.
- `hud.draw`에 `feverRemainingSec`, `feverDurationSec` 전달.
- 피버 발동 중: 하단 바를 `remainingSec / durationSec` 비율의 **남은 시간 게이지**로 표시(밝은 색) + `FEVER n.n초` 텍스트.
- 비발동 시: 기존처럼 피버 게이지 진행도 표시.

### 9. 방어막 중복 방지
- `ItemField.update`에 `playerShielded` 인자 추가.
- 방어막 롤 발생 시, `playerShielded === true` 또는 이미 필드에 `type==='shield'` 아이템이 있으면 **스폰하지 않음**(그 스폰 사이클은 아무것도 생성 안 함).

### 10. 난이도 표시(Lv 1~10)
- `difficulty.js`에 `difficultyLevel(elapsedSec)` 추가:
  `1 + floor(min(elapsedSec / rampSec, 1) * 9)` → 1..10.
- `main.js`에서 계산해 `hud.draw`에 `level` 전달, HUD에 `Lv N` 표기.

### 11. 소나기 뭉침 해결 + 크기 감소
- `obstacles.js` `_spawn`의 rain 분기:
  - 개수 `n = 3 + floor(rand*3)` → **3~5개**.
  - x좌표를 화면 폭을 `n`등분한 셀 중앙 ± 지터로 **고르게 분산**(한곳에 뭉치지 않게).
  - y는 소폭 스태거 유지.
- `CONFIG.obstacle.rain.radius` 7 → **5**.

---

## 게임오버 / 랭킹 화면

### 12. 흔들림 즉시 정지
- 원인: `main.js` `update()`가 `scene !== 'PLAYING'`에서 조기 반환 → 그 뒤의 `shake.update(dt)`가 게임오버 후 호출되지 않아 마지막 피격의 흔들림이 지속됨.
- 수정: `onGameOver()` 시작에서 `shake.t = 0; shake.intensity = 0;`로 즉시 정지.

### 13. 버튼 구성
- `index.html` `#screen-over`: `다시 하기`, `시작화면으로` 두 버튼.
- `ui.js`: `onRestart`(즉시 재시작), `onHome`(시작화면) 콜백 분리.
- `main.js`:
  - `다시 하기` → `resetGame()` 후 `scene = 'PLAYING'`, 오버레이 숨김(인트로 생략, 닉네임 유지, BGM 재시작).
  - `시작화면으로` → `scene = 'START'`, `ui.showStart()`.

### 14. 결과/랭킹 UI 디자인
- `.result`(시간/점수/별)를 카드형 스타일로.
- `#ranking` 리스트에 순위 배지·본인 하이라이트 등 시각 정리 (CSS만).

---

## 테스트

순수 로직 유닛 테스트(`node --test`) 추가/갱신:
- `difficulty.test.js`: `difficultyLevel` — t=0 → Lv 1, 램프 이상 → Lv 10, 중간값 경계.
- `config.test.js`: 변경된 값 반영(`player.lerp=0.09`, `rain.radius=5`, `star.lifeSec=5`, `items.lifeSec=3`).
- 별/아이템 수명 만료 로직: `StarField`/`ItemField`가 DOM/Canvas에 의존하지 않는 부분만 테스트(더미 `burst`로 만료 후 배열에서 제거되는지).
- 방어막 스폰 억제: `ItemField.update`에 `playerShielded=true` 또는 필드에 shield 존재 시 shield 미생성 검증(확률 롤은 `Math.random` 스텁으로 고정).

canvas 렌더·모달 토글 등 브라우저 의존 부분은 유닛 테스트 대상 아님 → 실제 실행(헤드리스 Edge) 스모크로 확인.

## 영향 파일
`index.html`, `css/style.css`, `js/config.js`, `js/main.js`, `js/ui.js`, `js/hud.js`, `js/stars.js`, `js/items.js`, `js/obstacles.js`, `js/difficulty.js`, `js/fever.js`(무변경 가능), 및 `tests/*`.

## 비목표 (YAGNI)
- 오디오 파일 추가, Firebase 실제 연동, 신규 장애물/아이템, 반응형 재설계는 범위 밖.
