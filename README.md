# 루미 (Lumi) — 별빛을 모으는 아기 유령 ✨

새벽이 오기 전, 아기 유령 **루미**가 떨어진 별빛을 모으는 캐주얼 회피·수집 아케이드 게임입니다.
마우스·터치로 루미를 움직여 노란 별빛을 모으고, 붉은 빛과 장애물을 피해 최대한 오래 버티세요.

## 🎮 플레이

**▶ https://yujin010203.github.io/WebGame_02/**

- **조작:** 마우스 또는 손가락으로 루미를 움직입니다.
- **목표:** 별빛을 모아 점수를 올리고, HP가 0이 되기 전까지 오래 생존하세요.

## 규칙

| 요소 | 효과 |
|---|---|
| 🟡 별빛 | 모으면 HP +5, 점수 +100 |
| 🔴 붉은 빛(레이저) | 닿으면 **즉시 게임오버** (경고 후 발사) |
| 🟣 먼지(유도 오브) | 닿으면 HP −30 |
| 🔵 빗방울(소나기) | 닿으면 HP −20 |
| 🛡️ 방어막 | 피격 1회 무효 (붉은 빛 포함) |
| 🌊 파동 | 화면의 장애물 일괄 제거 |
| 🔥 피버 | 별 10개를 모으면 5초간 무적 + 장애물 파괴(파괴당 +200) |

- **점수:** 별 100점 · 피버 파괴 200점 · 생존 초당 10점
- **난이도:** 시간이 지날수록 장애물이 빨라지고 잦아집니다. 3분(180초)에 걸쳐 Lv1 → Lv10으로 상승합니다.
- **랭킹:** 게임오버 시 닉네임 기준 최고 점수가 저장되고 Top 10이 표시됩니다.

## 🛠 기술 스택

- **Vanilla JavaScript (ES Modules)** — 빌드 도구 없음
- **Canvas 2D** — 렌더링
- **Firebase Firestore** — 온라인 랭킹
- **GitHub Pages** — 정적 호스팅

## 로컬 실행

ES 모듈을 사용하므로 `index.html`을 파일로 직접 여는 대신 로컬 서버로 실행하세요.

```bash
npx serve
```

띄운 뒤 표시되는 주소(예: `http://localhost:3000`)를 브라우저에서 엽니다.

## 테스트

순수 로직(충돌·점수·난이도·랭킹 등)은 Node 내장 테스트 러너로 검증합니다.

```bash
npm test        # node --test
```

## 랭킹(Firebase) 설정

랭킹 기능은 Firebase 프로젝트가 있어야 동작합니다. 설정을 비워두면 랭킹만 비활성화되고 게임은 정상 동작합니다.
자세한 절차는 [`docs/superpowers/FIREBASE_SETUP.md`](docs/superpowers/FIREBASE_SETUP.md)를 참고하세요.

> Firebase 웹 앱의 `apiKey`는 비밀값이 아니며, 접근 제어는 Firestore 보안 규칙으로 처리됩니다.

## 프로젝트 구조

```
index.html          진입점 (시작/인트로/게임오버 화면 마크업)
css/style.css       스타일
js/
  main.js           게임 루프 · 씬 전환
  config.js         모든 튜닝 값(HP·점수·난이도·장애물)
  player.js         루미 이동/렌더/피격
  obstacles.js      레이저·오브·소나기
  stars.js items.js 별빛 · 아이템(방어막/파동)
  fever.js          피버 모드
  difficulty.js     시간 기반 난이도/레벨
  scoring.js        점수 계산
  ranking.js        닉네임 정규화 · 최고점 판정
  firebase.js       Firestore 저장/조회
  collision.js hud.js input.js audio.js particles.js  ...
tests/              node --test 유닛 테스트
```
