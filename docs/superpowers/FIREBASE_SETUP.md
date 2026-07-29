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
