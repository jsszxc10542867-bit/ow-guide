/* ============================================================
   home.js — 교과서 홈/레슨/기록 컴포넌트
   - MY PROGRESS(나의 성장) · PRO MINDSET · LESSON 헤더 · 오답노트 · 추천 훈련
   - 데이터는 app.js의 state / getLearningAnalysis / SITUATIONS 를 그대로 사용 (서버·AI 없음)
   ============================================================ */

// ---------- 레슨 메타 (배우기 6단계) ----------
const LESSON_META = {
  0: { no: '01', en: 'GAME FUNDAMENTALS', min: 8, diff: 1, headline: '오버워치는 "5명이 모여서 한타에 들어가느냐"의 게임입니다.', objectives: ['승리 조건과 모드별 목표를 이해한다', '왜 뭉쳐야 이기는지 설명할 수 있다', '첫 10판에서 지켜야 할 것을 정한다'] },
  1: { no: '02', en: 'ROLES', min: 9, diff: 1, headline: '탱커가 선 곳이 팀의 위치, 딜러는 각, 힐러는 "지금 맞는 사람".', objectives: ['1-2-2와 역할 패시브를 이해한다', '내 역할이 한타에서 해야 할 한 가지를 안다', '어떤 역할부터 시작할지 정한다'] },
  2: { no: '03', en: 'TACTICAL FUNDAMENTALS', min: 12, diff: 2, headline: '한타는 "누가 먼저 죽느냐"가 아니라 "누가 먼저 준비됐느냐"입니다.', objectives: ['한타의 시작·중간·끝을 구분한다', '궁 어드밴티지를 계산한다', '리그룹 타이밍을 판단한다'] },
  3: { no: '04', en: 'POSITIONING', min: 10, diff: 2, headline: '좋은 포지션은 "안 죽는 자리"가 아니라 "선택지가 많은 자리"입니다.', objectives: ['좋은 포지션의 조건을 이해한다', '실제 맵에서 고지·코너·시야선을 읽는다', '공격과 후퇴의 기준을 판단한다'] },
  4: { no: '05', en: 'SURVIVAL & HABITS', min: 8, diff: 2, headline: '죽지 않는 것이 가장 큰 딜입니다.', objectives: ['죽는 원인 5가지를 안다', '콜 3가지를 습관화한다', '판당 데스 목표를 세운다'] },
  5: { no: '06', en: 'ADVANCED STRATEGY', min: 14, diff: 3, headline: '상위 티어는 상대의 자원(궁·쿨·체력)을 보고 싸웁니다.', objectives: ['조합(다이브·브롤·포크)의 승리 조건을 안다', '쿨·궁 트래킹을 시작한다', '카운터픽 판단 기준을 세운다'] }
};

// ---------- PRO MINDSET (사고 단계) ----------
const PRO_MINDSET = [
  { tier: '초보', see: '적이 보인다.', think: '→ 공격한다.', note: '보이는 것에 반응합니다. 위치·자원은 생각하지 않습니다.' },
  { tier: '중급', see: '우리 팀 위치를 확인한다.', think: '→ 팀과 같이 들어간다.', note: '"혼자 죽지 않기"가 목표가 됩니다. 스태거가 줄어듭니다.' },
  { tier: '고급', see: '적의 자원을 확인한다.', think: '→ 궁·쿨이 빠진 순간 들어간다.', note: '상대 생존기·궁 게이지를 세기 시작합니다. 한타 승률이 바뀌는 지점입니다.' },
  { tier: '상위권', see: '내 위치가 어떤 선택지를 만드는지 본다.', think: '→ 각을 먼저 만들고 싸운다.', note: '포지션은 "안전"이 아니라 "선택지"입니다. 사이드·오프앵글이 여기서 나옵니다.' },
  { tier: '프로', see: '상대가 어떤 선택을 할 수밖에 없게 만들 것인가?', think: '→ 상대의 선택지를 지운다.', note: '싸움을 시작하기 전에 결과가 정해지도록 만듭니다. 이 교과서가 향하는 곳입니다.' }
];

// ---------- 성장 지표 계산 (기존 분석 함수 재사용) ----------
function growthMetrics() {
  const a = getLearningAnalysis();
  const cat = k => { const c = a.cats.find(x => x.key === k); return c && c.n ? c.pct : null; };
  const avg = arr => { const v = arr.filter(x => x !== null); return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null; };
  return {
    a,
    rows: [
      { key: 'gameiq', label: 'GAME IQ', ko: '게임 이해', pct: a.quiz.solved ? a.quiz.pct : null, hint: a.quiz.solved ? `${a.quiz.correct}/${a.quiz.solved} 정답` : '퀴즈를 풀면 채워집니다', go: 0 },
      { key: 'positioning', label: 'POSITIONING', ko: '포지셔닝', pct: avg([cat('positioning'), cat('side')]), hint: '포지션·사이드 판단', go: 3 },
      { key: 'teamfight', label: 'TEAMFIGHT', ko: '한타', pct: avg([cat('teamfight'), cat('ultimate'), cat('regroup')]), hint: '한타·궁·리그룹 판단', go: 2 },
      { key: 'decision', label: 'DECISION MAKING', ko: '판단력', pct: a.judgment, hint: a.sit.n ? `상황판단 ${a.sit.n}문제 기준` : '상황판단을 풀면 채워집니다', go: 7 }
    ]
  };
}

// 오답 목록 (state.sit 에서 good 이 아닌 선택)
function mistakeList() {
  return SITUATIONS.filter(s => { const c = state.sit[s.id]; return c !== undefined && s.choices[c].v !== 'good'; })
    .map(s => ({ s, c: state.sit[s.id], v: s.choices[state.sit[s.id]].v }))
    .sort((x, y) => (x.v === 'bad' ? 0 : 1) - (y.v === 'bad' ? 0 : 1));
}

// 다음 학습 추천: 약점 카테고리의 안 푼 문제 → 오늘의 훈련 → 첫 미완 레슨
function nextLesson() {
  const a = getLearningAnalysis();
  const t = getDailyTopic();
  if (a.weakest) {
    const s = SITUATIONS.find(x => x.cat === a.weakest.key && state.sit[x.id] === undefined);
    if (s) return { kind: 'sit', title: s.title, sub: `${a.weakest.icon} ${a.weakest.label} 약점 보강 · ${s.hero}`, min: 3, diff: s.diff === 'beginner' ? 1 : s.diff === 'intermediate' ? 2 : 3, go: () => openSituation(s.id) };
  }
  const lessonIdx = [0, 1, 2, 3, 4, 5].find(i => !(state.lessons || {})[i]);
  if (lessonIdx !== undefined) { const m = LESSON_META[lessonIdx]; return { kind: 'lesson', title: progressDots[lessonIdx].textContent.trim().replace(/^\S+\s/, ''), sub: `LESSON ${m.no} · ${m.en}`, min: m.min, diff: m.diff, go: () => switchSection(lessonIdx) }; }
  if (state.sit[t.situation] === undefined) return { kind: 'daily', title: t.title, sub: '오늘의 훈련 · ' + t.desc, min: 5, diff: 2, go: () => goToDailySituation() };
  const s = SITUATIONS.find(x => x.cat !== 'side' && state.sit[x.id] === undefined);
  return s ? { kind: 'sit', title: s.title, sub: `상황판단 · ${s.hero}`, min: 3, diff: 2, go: () => openSituation(s.id) } : { kind: 'done', title: '모든 상황판단을 풀었습니다', sub: '복기와 오답노트로 판단을 다듬으세요', min: 5, diff: 3, go: () => switchSection(8) };
}
let _nextLessonGo = null;
function goNextLesson() { if (_nextLessonGo) _nextLessonGo(); }
function openSituation(id) {
  const s = SITUATIONS.find(x => x.id === id); if (!s) return;
  switchSection(7);
  const tool = s.cat === 'side' ? 'side' : 'situations';
  showTrainTool(tool, document.querySelector(`.subtab[data-tool="${tool}"]`));
  if (tool === 'situations') { sitCat = 'all'; sitDiff = 'all'; sitRole = 'all'; sitHero = 'all'; renderSituationFilters(); renderSituations(false); }
  setTimeout(() => { const el = document.getElementById('sit-' + id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('flash'); } }, 80);
}
const starTxt = n => '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));

// ---------- MY PROGRESS (홈) ----------
function renderHomeProgress() {
  const el = document.getElementById('my-progress'); if (!el) return;
  const g = growthMetrics(); const nx = nextLesson(); _nextLessonGo = nx.go;
  const mistakes = mistakeList();
  const bar = r => `<button class="growth-row" onclick="switchSection(${r.go})" title="${r.hint}">
      <span class="growth-label"><b>${r.label}</b><small>${r.ko}</small></span>
      <span class="growth-bar"><i style="width:${r.pct === null ? 0 : r.pct}%"></i></span>
      <span class="growth-pct">${r.pct === null ? '—' : r.pct + '%'}</span></button>`;
  el.innerHTML = `
    <div class="sec-head"><span class="kicker">MY PROGRESS</span><h2>나의 성장</h2><span class="sec-side">Lv.${g.a.level.cur.lv} ${g.a.level.cur.name} · ${g.a.xp} XP${mistakes.length ? ` · <a onclick="switchSection(8)">오답 ${mistakes.length}개</a>` : ''}</span></div>
    <div class="growth-grid">
      <div class="growth-bars">${g.rows.map(bar).join('')}
        <p class="growth-note">${g.a.sit.n || g.a.quiz.solved ? '막대를 누르면 해당 파트로 이동합니다. 상황판단 2문제 이상부터 분야 점수가 잡힙니다.' : '아직 기록이 없습니다. 오른쪽 학습부터 시작하면 여기가 채워집니다.'}</p>
      </div>
      <div class="next-lesson">
        <span class="kicker">${nx.kind === 'daily' ? "TODAY'S PICK" : nx.kind === 'lesson' ? 'NEXT LESSON' : nx.kind === 'sit' ? 'RECOMMENDED' : 'ALL DONE'}</span>
        <div class="nl-sub">${nx.sub}</div>
        <h3 class="nl-title">${nx.title}</h3>
        <div class="nl-meta"><span>⏱ ${nx.min}분</span><span class="stars">${starTxt(nx.diff)}</span></div>
        <button class="btn btn-primary" onclick="goNextLesson()">학습 계속하기 →</button>
      </div>
    </div>`;
}

// ---------- PRO MINDSET (홈, 정적) ----------
function renderProMindset() {
  const el = document.getElementById('pro-mindset'); if (!el) return;
  el.innerHTML = `
    <div class="sec-head"><span class="kicker">PRO MINDSET</span><h2>같은 게임을 보고 있어도, 실력에 따라 보이는 것이 다릅니다</h2></div>
    <ol class="mindset">${PRO_MINDSET.map((m, i) => `<li class="mindset-step">
        <span class="ms-no">${i + 1}</span>
        <div class="ms-body"><span class="ms-tier">${m.tier}</span><p class="ms-see">${m.see} <em>${m.think}</em></p><p class="ms-note">${m.note}</p></div>
      </li>`).join('')}</ol>
    <p class="mindset-foot">상황판단 훈련의 모든 문제는 이 다섯 단계 중 "지금 나는 어디서 보고 있나"를 묻습니다. <a onclick="switchSection(7)">상황판단 훈련으로 →</a></p>`;
}

// ---------- LESSON 헤더 (배우기 6단계 섹션 상단) ----------
function renderLessonHeads() {
  document.querySelectorAll('.section').forEach((sec, i) => {
    const m = LESSON_META[i]; if (!m || sec.querySelector('.lesson-head')) return;
    const title = sec.querySelector('.section-title'); if (!title) return;
    const head = document.createElement('div'); head.className = 'lesson-head';
    head.innerHTML = `<div class="lh-top"><span class="kicker">LESSON ${m.no}</span><span class="kicker muted">${m.en}</span><span class="lh-meta">⏱ ${m.min}분 <span class="stars">${starTxt(m.diff)}</span></span></div>
      <p class="lh-headline">${m.headline}</p>
      <div class="lh-obj"><span class="kicker">LEARNING OBJECTIVES</span><ul>${m.objectives.map(o => `<li>${o}</li>`).join('')}</ul></div>`;
    // 홈(0)은 히어로 아래에, 나머지는 제목 바로 아래
    if (i === 0) { const hb = sec.querySelector('.hero-banner'); if (hb) hb.insertAdjacentElement('afterend', head); else title.insertAdjacentElement('afterend', head); }
    else title.insertAdjacentElement('afterend', head);
  });
}
function markLessonRead(i) { if (LESSON_META[i]) { state.lessons = state.lessons || {}; if (!state.lessons[i]) { state.lessons[i] = todayKey(); saveState(); } } }

// ---------- 오답노트 + 추천 훈련 (나의 학습 분석) ----------
function renderMistakes() {
  const el = document.getElementById('mistakes'); if (!el) return;
  const a = getLearningAnalysis(); const list = mistakeList(); const nx = nextLesson(); _nextLessonGo = nx.go;
  const weak = a.weakest ? `${a.weakest.icon} ${a.weakest.label} 판단 (${a.weakest.pct}점)` : '상황판단 2문제 이상 풀면 표시됩니다';
  el.innerHTML = `
    <div class="focus-pair">
      <div class="focus-tile"><span class="kicker">RECENT WEAKNESS</span><p class="ft-big">${weak}</p><small>가장 낮은 분야부터 보강합니다</small></div>
      <div class="focus-tile accent"><span class="kicker">RECOMMENDED TRAINING</span><p class="ft-big">${nx.title}</p><small>${nx.sub} · ⏱ ${nx.min}분 · ${starTxt(nx.diff)}</small><button class="btn btn-primary" onclick="goNextLesson()">훈련 시작 →</button></div>
    </div>
    <div class="sec-head" style="margin-top:1.6rem"><span class="kicker">MY MISTAKES</span><h2>오답노트 <small>${list.length}개</small></h2></div>
    ${list.length ? `<ol class="mistakes">${list.map(({ s, c, v }, idx) => `<li class="mistake"><button class="mistake-head" onclick="this.parentElement.classList.toggle('open')">
        <span class="mk-no">${String(idx + 1).padStart(2, '0')}</span>
        <span class="mk-main"><b>${s.sub}</b><small>${SITUATION_CATS[s.cat].icon} ${SITUATION_CATS[s.cat].label} · ${s.hero} · ${s.title}</small></span>
        <span class="mk-verdict ${v}">${VERDICT_META[v].icon} ${VERDICT_META[v].label}</span></button>
        <div class="mistake-body">
          <div class="mk-step"><span class="kicker">내 선택</span><p>${s.choices[c].t}</p><small>${s.choices[c].why}</small></div>
          <div class="mk-step good"><span class="kicker">정답</span><p>${s.choices[s.best].t}</p></div>
          <div class="mk-step"><span class="kicker">왜 틀렸는가</span><p>${s.choices[s.best].why}</p></div>
          <div class="mk-step"><span class="kicker">다음에는 무엇을 봐야 하는가</span><ul>${s.keyInfo.map(k => `<li>${k}</li>`).join('')}</ul><p class="mk-key">💡 ${s.keyPoint}</p></div>
          <button class="btn btn-outline" onclick="openSituation('${s.id}')">문제 다시 풀기 →</button>
        </div></li>`).join('')}</ol>`
      : `<p class="fig-muted">아직 오답이 없습니다. 상황판단 문제에서 "상황에 따라 다름" 또는 "위험한 판단"을 고르면 여기에 쌓입니다.</p>`}`;
}
