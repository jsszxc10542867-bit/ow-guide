# 오버워치 교과서

정적 웹 + JavaScript + localStorage로만 동작하는 오버워치 2 입문 학습 사이트입니다. 서버·로그인·AI API 호출이 없습니다.

https://jsszxc10542867-bit.github.io/ow-guide/

## 구조

```
index.html          마크업 + CSS (탭 10개)
app.js              모든 동작 (탭, 퀴즈, 상황판단, 규칙 엔진, 통계, 검색, 모달)
home.js             🏠 홈 대시보드(index 0)·레슨 헤더·기록 컴포넌트 — 게임 기본 레슨은 section 11(#basics) (LESSON_META 레슨 헤더, PRO_MINDSET, MY PROGRESS 성장 지표, 오답노트, 추천 훈련)
tmap.js             🧭 전술 지도 모듈 — 현재 TM_ENABLED=false(점검 중): 마커 좌표 인게임 검증 후 true로 켜면 뷰어·퀴즈 링크·도감 버튼이 다시 열림 (SVG 렌더, 마커/루트/레이어, 줌·이동, 필터, 추천, 암기 모드, 맵 퀴즈)
data/
  maps/schema.js   전술 지도 데이터 구조 설명 + TACTICAL_MAPS 선언
  maps/kings-row.js, lijiang-tower.js, circuit-royal.js   전술 지도 3개 (지형·포지션·루트·고지·위험·엄폐·힐팩·교전·퀴즈)
  map-situations.js 전술 지도 상황 목록, 레이어, "지금 어디 있어야 하지?" 규칙
  heroes.js         영웅 53명 기본 카드 (2025 벤데타, 2026 신규 8명 포함: 안란·엠레·도미나·미즈키·제트팩 캣·시에라·시온·D.Mon) (name, role, diff, newbie, tag, desc)
  heroes-insight.js 영웅 분류·해설 인사이트 (HERO_INSIGHT: 해설 기준 4축·필터 플래그·분류 요약·프로 강의 요약·출처) — 옵치토크쇼 기본개념서 4편 + 투유/플레타/희성/말카 영웅별 강의 기반
  heroes-detail.js  영웅 상세 (HERO_DETAILS: 공격 방식, 운영 핵심 5, 하지 말아야 할 행동, 궁, 카운터, 조합, 태그, 플레이스타일 점수)
  situations.js     상황판단 문제 (SITUATIONS) + 카테고리/난이도/판정 메타
  situations-heroes.js  영웅별 추가 상황판단 문제 (SITUATIONS에 합쳐짐, 탭에서 역할→영웅으로 분류)
  situations-new2026.js 2026 신규 영웅 상황판단 문제 (영웅당 3개)
  situations-lectures.js 프로·해설 강의 사례 상황판단 26문제 (src: 출처, 플레타·투유·옵치토크쇼·프로즈·R·희성·말카)
  situations-heroes2.js 영웅별 상황판단 2차 — 문제가 없던 14명 (영웅당 2개)
  training.js       "지금 뭘 해야 하지?" 규칙(ADVISOR_RULES), 한타 상태(FIGHT_STATES), 체크리스트, 복기 항목, 오늘의 훈련 주제, 레벨/XP
  maps.js           맵 12개 (고지·초크·루트·힐팩·역할별 위치·흔한 실수)
  glossary.js       용어 62개 (정의·실전 표현·반대 행동·관련 개념)
  quizzes.js        객관식 퀴즈 정답·분야·오답 해설 (문항 HTML은 index.html)
  counters.js       카운터 픽 표, 조합 상성
  guides.js         심화 가이드 9편 (GUIDES: 마크다운 원문 포함, 사이트 내 리더로 렌더) — guides/phase3/*.md 에서 생성
guides/phase3/      심화 가이드 마크다운 원본 (Phase 3: 캐릭터·역할·팀 전술·랭크·카운터·포지셔닝·훈련 로드맵·멘탈·프로 사례)
assets/             로고, OG 이미지
  heroes/           영웅 초상화 53장 (<영문 슬러그>.webp, 256px). 출처: overwatch.blizzard.com 공식 영웅 페이지 — Blizzard 팬 콘텐츠 정책에 따른 비상업적 사용. 신규 영웅은 같은 방식으로 추가
```

## 콘텐츠 추가 방법

- **상황판단 문제**: `data/situations.js`의 `SITUATIONS` 배열에 객체 추가. `cat`이 `side`면 "사이드 vs 본대" 탭에, 그 외는 상황판단 탭에 자동 표시됩니다.
- **영웅**: `data/heroes.js`에 카드 추가 후 `data/heroes-detail.js`에 같은 이름으로 상세 추가. `data/heroes-insight.js`에 axis/flags/summary를 넣으면 카드 배지·분류 필터·모달 분류 카드가 자동 표시됩니다.
- **맵**: `data/maps.js`의 `MAPS`에 추가. 모드 키는 `MAP_MODES` 참고.
- **용어**: `data/glossary.js`의 `GLOSSARY`에 추가. 전체 검색·용어 탭에 자동 반영.
- **전술 지도 맵 추가**: ① StatBanana(https://overwatch.statbanana.com/images)에서 오버헤드 PNG를 받아 `assets/maps/<id>/<id>-overhead.png`에 저장하고 `attribution.txt` 작성 ② `data/maps/registry.js`에 `image/width/height` 지정 ③ `data/maps/kings-row.js`를 복사해 `data/maps/<id>.js` 작성 (좌표는 `P(px, py)`로 0~1 정규화) ④ `index.html`에 `<script src="data/maps/<id>.js">` 추가. 이미지가 없는 맵은 자동으로 "준비 중"으로 표시되며 가짜 지도는 만들지 않습니다. 공유 링크: `?map=<id>&hero=<이름>&sit=<상황>&pos=<포지션id>&detail=1#maps`
- **맵 이미지 사용 조건**: StatBanana 무료 저작물 조건(원본 무변경 재배포 금지, 로고 유지 또는 출처 표기). 본 사이트는 무료이며 로고 유지 + 출처 표기 둘 다 적용. 상업적 전환 시 재확인 필요.
- **퀴즈**: `index.html`에 문항 블록 추가 + `data/quizzes.js`의 `quizAnswers`·`QUIZ_EXPLAIN`에 같은 순서로 추가. 번호·총계는 자동 계산.

## AI 연결 지점 (현재는 로컬 데이터)

`app.js`의 다음 함수만 교체하면 됩니다.

- `getSituationAdvice(input)` — 규칙 엔진
- `getHeroRecommendation(prefs, role)` — 플레이스타일 점수 계산
- `getLearningAnalysis()` — 학습 통계 집계
- `getCoachResponse(question)` — 검색 인덱스 기반 응답
- `getMapPositionAdvice(input, map)` (tmap.js) — 전술 지도 포지션 추천 규칙
- `judgeSideOrMain(input)` (data/map-situations.js) — 본대 vs 사이드 판단 규칙

## 저장 데이터

`localStorage['ow-guide-progress']` 한 키에 퀴즈 답안, 상황판단 기록, XP, 복기 통계, 오늘의 훈련 진행, 학습 수준(뉴비/일반/심화)이 저장됩니다. "진행도 초기화" 버튼으로 삭제할 수 있습니다.
