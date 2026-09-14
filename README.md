# 오버워치 뉴비 완벽 가이드 — Coach Playbook

정적 웹 + JavaScript + localStorage로만 동작하는 오버워치 2 입문 학습 사이트입니다. 서버·로그인·AI API 호출이 없습니다.

https://jsszxc10542867-bit.github.io/ow-guide/

## 구조

```
index.html          마크업 + CSS (탭 10개)
app.js              모든 동작 (탭, 퀴즈, 상황판단, 규칙 엔진, 통계, 검색, 모달)
tmap.js             🧭 전술 지도 모듈 (SVG 렌더, 마커/루트/레이어, 줌·이동, 필터, 추천, 암기 모드, 맵 퀴즈)
data/
  maps/_schema.js   전술 지도 데이터 구조 설명 + TACTICAL_MAPS 선언
  maps/kings-row.js, lijiang-tower.js, circuit-royal.js   전술 지도 3개 (지형·포지션·루트·고지·위험·엄폐·힐팩·교전·퀴즈)
  map-situations.js 전술 지도 상황 목록, 레이어, "지금 어디 있어야 하지?" 규칙
  heroes.js         영웅 44명 기본 카드 (name, role, diff, newbie, tag, desc)
  heroes-detail.js  영웅 상세 (HERO_DETAILS: 공격 방식, 운영 핵심 5, 하지 말아야 할 행동, 궁, 카운터, 조합, 태그, 플레이스타일 점수)
  situations.js     상황판단 문제 60개 (SITUATIONS) + 카테고리/난이도/판정 메타
  training.js       "지금 뭘 해야 하지?" 규칙(ADVISOR_RULES), 한타 상태(FIGHT_STATES), 체크리스트, 복기 항목, 오늘의 훈련 주제, 레벨/XP
  maps.js           맵 12개 (고지·초크·루트·힐팩·역할별 위치·흔한 실수)
  glossary.js       용어 62개 (정의·실전 표현·반대 행동·관련 개념)
  quizzes.js        객관식 퀴즈 정답·분야·오답 해설 (문항 HTML은 index.html)
  counters.js       카운터 픽 표, 조합 상성
assets/             로고, OG 이미지
```

## 콘텐츠 추가 방법

- **상황판단 문제**: `data/situations.js`의 `SITUATIONS` 배열에 객체 추가. `cat`이 `side`면 "사이드 vs 본대" 탭에, 그 외는 상황판단 탭에 자동 표시됩니다.
- **영웅**: `data/heroes.js`에 카드 추가 후 `data/heroes-detail.js`에 같은 이름으로 상세 추가.
- **맵**: `data/maps.js`의 `MAPS`에 추가. 모드 키는 `MAP_MODES` 참고.
- **용어**: `data/glossary.js`의 `GLOSSARY`에 추가. 전체 검색·용어 탭에 자동 반영.
- **전술 지도 맵**: `data/maps/_schema.js`의 구조대로 `data/maps/<id>.js`를 만들고 `index.html`에 `<script src="data/maps/<id>.js">`를 추가하면 맵 선택 버튼에 자동 표시됩니다. 좌표는 0~100 × 0~62. 공유 링크: `?map=<id>&hero=<이름>&sit=<상황>&pos=<포지션id>&detail=1#tactical`
- **퀴즈**: `index.html`에 문항 블록 추가 + `data/quizzes.js`의 `quizAnswers`·`QUIZ_EXPLAIN`에 같은 순서로 추가. 번호·총계는 자동 계산.

## AI 연결 지점 (현재는 로컬 데이터)

`app.js`의 다음 함수만 교체하면 됩니다.

- `getSituationAdvice(input)` — 규칙 엔진
- `getHeroRecommendation(prefs, role)` — 플레이스타일 점수 계산
- `getLearningAnalysis()` — 학습 통계 집계
- `getCoachResponse(question)` — 검색 인덱스 기반 응답
- `getMapPositionAdvice(input, map)` (tmap.js) — 전술 지도 포지션 추천 규칙

## 저장 데이터

`localStorage['ow-guide-progress']` 한 키에 퀴즈 답안, 상황판단 기록, XP, 복기 통계, 오늘의 훈련 진행, 학습 수준(뉴비/일반/심화)이 저장됩니다. "진행도 초기화" 버튼으로 삭제할 수 있습니다.
