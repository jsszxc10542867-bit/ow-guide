/* =====================================================================
   오버워치 교과서 — app.js
   데이터: data/*.js (heroes, heroes-detail, situations, training, maps, glossary, quizzes, counters)
   저장: localStorage (서버·AI 호출 없음)
   ===================================================================== */

// ---------- 상수 ----------
const TOTAL_QUIZ = quizAnswers.length;
const SECTION_COUNT = 12;
const STORAGE_KEY = 'ow-guide-progress';
const SECTION_HASH = ['home','roles','tactics','maps','tips','advanced','heroes','training','stats','glossary','guides','basics'];
const HASH_ALIAS = { tactical: 3 };
const roleLabel = { tank:'돌격', dps:'공격', support:'지원' };
const roleIcon = { tank:'i-tank', dps:'i-dps', support:'i-support' };
const HERO_TAG_META = {
  'new':'🆕 2026 신규', 'aim-easy':'🎯 에임 쉬움', 'low-ops':'🧠 운영 난이도 낮음', 'mobile':'⚡ 기동성 높음',
  'aggressive':'🔥 공격적', 'stable':'🛡️ 안정적', 'solo':'👥 팀 의존도 낮음'
};

// ---------- 상태 ----------
let state = {
  answers: {},      // 퀴즈: { index: selected }
  section: 0,
  sit: {},          // 상황판단: { id: choiceIndex }
  xp: 0,
  deaths: {},       // 복기: { 'YYYY-MM-DD': { reasonId: count } }
  daily: {},        // 오늘의 훈련: { 'YYYY-MM-DD': { read:true, sitDone:true } }
  checklist: {},    // { 'YYYY-MM-DD': count }
  lastStudy: null,
  mode: 'normal',   // newbie | normal | advanced
  reco: null        // 플레이스타일 추천 결과 { picks:[...], date }
};
let currentSection = 0;
let sections, progressDots;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { /* 저장된 데이터가 없거나 손상됨 */ }
  ['answers', 'sit', 'deaths', 'daily', 'checklist', 'tmap', 'guides', 'lessons'].forEach(k => { if (!state[k] || typeof state[k] !== 'object') state[k] = {}; });
  if (typeof state.xp !== 'number') state.xp = 0;
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}
function touchStudy() { state.lastStudy = todayKey(); }

function resetProgress() {
  if (!confirm('퀴즈 답안, 상황판단 기록, XP 등 학습 진행도를 모두 초기화하시겠습니까?')) return;
  const mode = state.mode;
  state = { answers: {}, section: 0, sit: {}, xp: 0, deaths: {}, daily: {}, checklist: {}, lastStudy: null, mode, reco: null, tmap: {}, guides: {} };
  saveState();
  location.reload();
}

// ---------- XP / 레벨 ----------
function addXP(n, reason) {
  state.xp = Math.max(0, (state.xp || 0) + n);
  touchStudy();
  saveState();
  renderLevel();
  if (n > 0) toast(`+${n} XP · ${reason}`);
}
function levelInfo(xp) {
  let cur = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.xp) cur = l;
  const next = LEVELS.find(l => l.lv === cur.lv + 1);
  const pct = next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100;
  return { cur, next, pct };
}
function renderLevel() {
  const { cur, next, pct } = levelInfo(state.xp || 0);
  const pill = document.getElementById('level-pill');
  if (pill) pill.innerHTML = `<span class="lp-lv">Lv.${cur.lv}</span><span class="lp-xp">${state.xp || 0} XP</span><span class="lp-bar"><i style="width:${pct}%"></i></span>`;
  const el = document.getElementById('level-box');
  if (!el) return;
  el.innerHTML = `
    <div class="level-head"><span class="level-badge">Lv.${cur.lv}</span><strong>${cur.name}</strong>
      <span class="level-xp">${state.xp || 0} XP${next ? ` · 다음 레벨까지 ${next.xp - state.xp}` : ' · 최고 레벨'}</span></div>
    <div class="progress-bar level-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}
let toastTimer;
function toast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- 탭 / 섹션 ----------
// 사이트 안 이동 기록 (헤더 ← 버튼용: 브라우저 밖으로 나가지 않음)
const NAV_STACK = []; let _navBack = false;
function goBackInSite() { if (!NAV_STACK.length) return; _navBack = true; const i = NAV_STACK.pop(); switchSection(i); _navBack = false; }
// 내비 드롭다운
function toggleDd(id) { const el = document.getElementById(id); const open = !el.classList.contains('open'); closeDd(); if (open) { el.classList.add('open'); el.querySelector('.nav-dd-btn').setAttribute('aria-expanded', 'true'); } }
function closeDd() { document.querySelectorAll('.nav-dd.open').forEach(d => { d.classList.remove('open'); d.querySelector('.nav-dd-btn').setAttribute('aria-expanded', 'false'); }); }
document.addEventListener('click', e => { if (!e.target.closest('.nav-dd')) closeDd(); });
function updateDdState(index) {
  document.querySelectorAll('.nav-dd').forEach(dd => { const inGroup = !!dd.querySelector(`.nav-tab[data-index="${index}"]`); dd.querySelector('.nav-dd-btn').classList.toggle('in-group', inGroup); });
  const cur = document.getElementById('dd-learn-cur'); if (cur) { const t = document.querySelector(`#dd-learn .nav-tab[data-index="${index}"]`); cur.textContent = t ? t.textContent.replace(/^[^가-힣A-Za-z]+/, '').trim() : ''; }
}
function updateBackBtn() { const b = document.getElementById('back-btn'); if (b) b.hidden = NAV_STACK.length === 0; }
function switchSection(index, opts) {
  index = Math.max(0, Math.min(SECTION_COUNT - 1, index));
  if (typeof currentSection === 'number' && index !== currentSection && !_navBack) { NAV_STACK.push(currentSection); if (NAV_STACK.length > 50) NAV_STACK.shift(); }
  updateBackBtn();
  sections.forEach(section => section.classList.remove('active'));
  progressDots.forEach(dot => { dot.classList.remove('active'); dot.setAttribute('aria-selected', 'false'); dot.setAttribute('tabindex', '-1'); });
  currentSection = index;
  sections[currentSection].classList.add('active');
  progressDots[currentSection].classList.add('active');
  progressDots[currentSection].setAttribute('aria-selected', 'true');
  progressDots[currentSection].setAttribute('tabindex', '0');
  state.section = index;
  saveState();
  updateProgress();
  if (!(opts && opts.keepScroll)) window.scrollTo(0, 0);
  // 탭 이동은 브라우저 기록에 남깁니다(뒤로가기로 이전 탭 복귀). 같은 탭이면 기록을 늘리지 않습니다.
  if (!(opts && opts.noHash)) { const h = '#' + SECTION_HASH[index]; if (location.hash !== h) history.pushState(null, '', h); }
  updateBottomNav();
  closeDd(); updateDdState(index);
  document.querySelectorAll('.nav-dup').forEach(b => { const on = Number(b.dataset.index) === index; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
  if (typeof markLessonRead === 'function') markLessonRead(index);
  if (index === 0 && typeof renderHomeProgress === 'function') renderHomeProgress();
  if (index === 8) renderStats();
  if (index === 8 && typeof renderMistakes === 'function') renderMistakes();
  if (index === 10) renderGuideIndex();
  if (index === 3 && typeof tmInit === 'function') tmInit();
}
// ---------- 모바일 하단 탭바 · 시트 ----------
const NAV_ITEMS = [
  { i: 11, ic: '🎮', t: '게임 기본', d: '규칙 · 모드 · 승리 조건', g: 'learn' },
  { i: 1, ic: '👥', t: '캐릭터 역할', d: '탱커 · 딜러 · 힐러가 하는 일', g: 'learn' },
  { i: 2, ic: '🎯', t: '기초 전술', d: '한타 · 궁 관리 · 리그룹', g: 'learn' },
  { i: 3, ic: '🗺️', t: '맵과 포지셔닝', d: '실제 맵 위 전술 지도', g: 'learn' },
  { i: 4, ic: '🔥', t: '실전 팁', d: '안 죽는 법 · 콜 · 습관', g: 'learn' },
  { i: 5, ic: '🧠', t: '고급 전략', d: '조합 · 카운터 · 템포', g: 'learn' },
  { i: 7, ic: '🧪', t: '상황판단 훈련', d: '역할 → 영웅별 실전 판단', g: 'train' },
  { i: 6, ic: '🦸', t: '영웅별 핵심 공략', d: '53명 상세 · 운영 핵심 · 카운터', g: 'train' },
  { i: 10, ic: '📖', t: '심화 가이드', d: '멘탈 · 랭크 · 훈련 로드맵', g: 'train' },
  { i: 8, ic: '📊', t: '나의 학습 분석', d: '약점 · 점수 · 초기화', g: 'record' },
  { i: 9, ic: '📚', t: '용어 사전', d: '스태거 · 각 · 스즈…', g: 'record' }
];
function bnKeyOf(i) { return i === 0 ? 'home' : i === 7 ? 'train' : i === 6 ? 'heroes' : (i === 11 || i <= 5) ? 'learn' : 'more'; }
function updateBottomNav() {
  const k = bnKeyOf(currentSection);
  document.querySelectorAll('.bn-btn').forEach(b => b.classList.toggle('active', b.dataset.bn === k));
}
function openSheet(kind) {
  const sheet = document.getElementById('sheet'), bd = document.getElementById('sheet-backdrop'), body = document.getElementById('sheet-body');
  const item = (n, step) => `<button class="sheet-item ${currentSection === n.i ? 'active' : ''}" onclick="closeSheet(); switchSection(${n.i})"><span class="si-ic">${n.ic}</span><span><b>${n.t}</b><small>${n.d}</small></span>${step ? `<span class="si-step">${step}</span>` : ''}</button>`;
  if (kind === 'learn') {
    document.getElementById('sheet-title').textContent = '📖 배우기 — 순서대로 읽으세요';
    body.innerHTML = NAV_ITEMS.filter(n => n.g === 'learn').map((n, idx) => item(n, `${idx + 1}단계`)).join('');
  } else {
    document.getElementById('sheet-title').textContent = '☰ 더보기';
    body.innerHTML = `<div class="sheet-section">훈련하기</div>` + NAV_ITEMS.filter(n => n.g === 'train').map(n => item(n)).join('') +
      `<div class="sheet-section">내 기록</div>` + NAV_ITEMS.filter(n => n.g === 'record').map(n => item(n)).join('') +
      `<button class="sheet-item" onclick="closeSheet(); openSearch()"><span class="si-ic">🔍</span><span><b>전체 검색</b><small>영웅 · 용어 · 상황 · 가이드</small></span></button>`;
  }
  sheet.hidden = false; bd.hidden = false; document.body.style.overflow = 'hidden';
}
function closeSheet() {
  const sheet = document.getElementById('sheet'), bd = document.getElementById('sheet-backdrop');
  if (sheet) sheet.hidden = true; if (bd) bd.hidden = true; document.body.style.overflow = '';
}
function sectionFromHash() {
  const h = location.hash.replace('#', '');
  if (HASH_ALIAS[h] !== undefined) return HASH_ALIAS[h];
  const i = SECTION_HASH.indexOf(h);
  return i >= 0 ? i : null;
}
function updateProgress() {
  // 진행도 = 탭(30%) + 퀴즈(35%) + 상황판단(35%)
  const solved = Object.keys(state.answers).length;
  const correct = Object.entries(state.answers).filter(([i, a]) => quizAnswers[i] && quizAnswers[i].correct === a).length;
  const sitDone = Object.keys(state.sit).length;
  const sectionPart = ((currentSection + 1) / SECTION_COUNT) * 30;
  const quizPart = (solved / TOTAL_QUIZ) * 35;
  const sitPart = Math.min(1, sitDone / SITUATIONS.length) * 35;
  const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  const fill = document.getElementById('progress-fill'); if (fill) fill.style.width = (sectionPart + quizPart + sitPart) + '%';
  setT('score-solved', solved); setT('score-correct', correct); setT('score-sit', sitDone);
  if (solved === TOTAL_QUIZ) renderResult(correct);
}

// ---------- 학습 모드 (뉴비 / 일반 / 심화) ----------
function setMode(mode, silent) { state.mode = mode; saveState(); } // 학습 수준 스위치는 제거됨 — 심화 카드는 항상 표시(🔬 배지)

// ---------- 퀴즈 ----------
function initQuizCounters() {
  document.querySelectorAll('.quiz-container').forEach((c, i) => {
    const cnt = c.querySelector('.quiz-counter');
    if (cnt) cnt.textContent = `총 ${TOTAL_QUIZ}개 문제 중 ${i + 1}번째`;
    const fb = c.querySelector('.quiz-feedback');
    if (fb) { fb.setAttribute('role', 'status'); fb.setAttribute('aria-live', 'polite'); }
  });
  { const el = document.getElementById('score-total'); if (el) el.textContent = TOTAL_QUIZ; }
  document.querySelectorAll('.quiz-total').forEach(el => el.textContent = TOTAL_QUIZ);
}
function quizSectionIndex(quizIndex) {
  const fb = document.getElementById(`feedback-${quizIndex}`);
  return Array.from(sections).indexOf(fb.closest('.section'));
}
function checkAnswer(quizIndex, selectedAnswer, silent) {
  const feedback = document.getElementById(`feedback-${quizIndex}`);
  const container = feedback.closest('.quiz-container');
  const quiz = quizAnswers[quizIndex];
  if (container.classList.contains('answered') && !silent) return;   // 한 번 답하면 잠금
  const options = container.querySelectorAll('.quiz-option');
  options.forEach(o => o.classList.remove('selected-correct', 'selected-wrong'));
  container.classList.add('answered');
  if (selectedAnswer === quiz.correct) {
    feedback.classList.remove('incorrect');
    feedback.classList.add('correct', 'show');
    feedback.textContent = '✓ ' + quiz.message;
    options[selectedAnswer].classList.add('selected-correct');
  } else {
    feedback.classList.remove('correct');
    feedback.classList.add('incorrect', 'show');
    const explain = QUIZ_EXPLAIN[quizIndex] ? `<div class="quiz-explain">💡 ${QUIZ_EXPLAIN[quizIndex]}</div>` : '';
    feedback.innerHTML = `✗ 아쉽습니다. 정답: ${options[quiz.correct].textContent}${explain}`;
    options[selectedAnswer].classList.add('selected-wrong');
    options[quiz.correct].classList.add('selected-correct');
  }
  if (!silent) {
    state.answers[quizIndex] = selectedAnswer;
    addXP(selectedAnswer === quiz.correct ? XP_RULES.quizCorrect : XP_RULES.quizWrong, selectedAnswer === quiz.correct ? '퀴즈 정답' : '퀴즈 풀이');
    saveState();
    updateProgress();
  }
}
function quizCategoryScores() {
  const out = {};
  quizAnswers.forEach((q, i) => {
    if (!out[q.cat]) out[q.cat] = { total: 0, solved: 0, correct: 0 };
    out[q.cat].total++;
    if (state.answers[i] !== undefined) { out[q.cat].solved++; if (state.answers[i] === q.correct) out[q.cat].correct++; }
  });
  return out;
}
function recommendedTopics() {
  // 틀린 문항 + 상황판단 오답의 topic/cat을 모아 빈도순
  const score = {};
  quizAnswers.forEach((q, i) => { if (state.answers[i] !== undefined && state.answers[i] !== q.correct) score[q.topic] = (score[q.topic] || 0) + 2; });
  SITUATIONS.forEach(s => {
    const c = state.sit[s.id]; if (c === undefined) return;
    const v = s.choices[c].v;
    const t = DAILY_TOPICS.find(d => d.situation === s.id);
    if (v !== 'good' && t) score[t.key] = (score[t.key] || 0) + (v === 'bad' ? 2 : 1);
  });
  return Object.entries(score).sort((a, b) => b[1] - a[1]).map(([k]) => DAILY_TOPICS.find(d => d.key === k)).filter(Boolean);
}
function renderResult(correct) {
  const body = document.getElementById('result-body');
  const pct = Math.round((correct / TOTAL_QUIZ) * 100);
  let grade, msg;
  if (pct === 100) { grade = '🏆 완벽합니다!'; msg = '모든 문제를 맞히셨습니다. 이제 상황판단 훈련으로 가시면 됩니다!'; }
  else if (pct >= 80) { grade = '🥇 훌륭합니다'; msg = '기본기가 탄탄합니다. 틀린 부분만 다시 확인해 보세요.'; }
  else if (pct >= 60) { grade = '🥈 좋습니다'; msg = '핵심은 이해하셨습니다. 약한 파트를 복습해 보세요.'; }
  else { grade = '📖 복습이 필요합니다'; msg = '괜찮습니다! 틀린 문제의 파트로 돌아가 다시 읽어 보세요.'; }

  const wrong = Object.entries(state.answers).filter(([i, a]) => quizAnswers[i].correct !== a).map(([i]) => Number(i));
  const cats = quizCategoryScores();
  const catHtml = `<div class="result-cats">${Object.entries(cats).map(([k, v]) => {
    const p = v.solved ? Math.round((v.correct / v.solved) * 100) : 0;
    const cls = p >= 80 ? 'good' : p >= 50 ? 'mixed' : 'bad';
    return `<div class="result-cat"><span>${QUIZ_CATS[k]}</span><div class="mini-bar"><div class="mini-fill ${cls}" style="width:${p}%"></div></div><b>${p}%</b></div>`;
  }).join('')}</div>`;
  const reco = recommendedTopics().slice(0, 4);
  const recoHtml = reco.length ? `<div class="result-reco"><strong>📚 추천 학습 순서</strong><ol>${reco.map(t => `<li><a onclick="switchSection(${t.section})">${t.title}</a> — ${t.desc.split('.')[0]}.</li>`).join('')}</ol></div>` : '';
  const wrongHtml = wrong.length ? `
    <div class="result-wrong">
      <strong>❌ 틀린 문제 (${wrong.length}개)</strong>
      ${wrong.map(i => {
        const q = document.getElementById(`feedback-${i}`).closest('.quiz-container').querySelector('.quiz-question').textContent;
        const sec = quizSectionIndex(i);
        return `<div class="result-wrong-item">퀴즈 ${i + 1}. ${q.replace('❓', '').trim()}<br>
          <a onclick="goToQuiz(${i}, ${sec})">→ ${progressDots[sec].textContent.trim()} 파트로 이동</a></div>`;
      }).join('')}
    </div>` : '';
  body.innerHTML = `
    <div class="result-score">${correct} / ${TOTAL_QUIZ}</div>
    <div class="result-grade">${grade} <small>정답률 ${pct}%</small></div>
    <p>${msg}</p>
    ${catHtml}${recoHtml}${wrongHtml}
    <div style="display:flex;justify-content:center;flex-wrap:wrap;gap:0.5rem;margin-top:1.5rem;">
      <button class="btn btn-primary" onclick="retryQuiz()">🔄 퀴즈 다시 풀기</button>
      <button class="btn btn-outline" onclick="switchSection(7)">🧪 상황판단 훈련으로</button>
      <button class="btn btn-outline" onclick="switchSection(8)">📊 나의 학습 분석</button>
    </div>`;
}
function goToQuiz(quizIndex, sectionIndex) {
  switchSection(sectionIndex);
  setTimeout(() => document.getElementById(`feedback-${quizIndex}`).closest('.quiz-container').scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}
function retryQuiz() {
  state.answers = {};
  saveState();
  document.querySelectorAll('.quiz-container').forEach(c => {
    c.classList.remove('answered');
    c.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected-correct', 'selected-wrong'));
    const fb = c.querySelector('.quiz-feedback');
    fb.className = 'quiz-feedback'; fb.textContent = '';
  });
  document.getElementById('result-body').innerHTML = `<p style="color:var(--text-3);">${TOTAL_QUIZ}문제를 모두 풀면 결과가 여기에 표시됩니다.</p>`;
  switchSection(0);
}

// 포지셔닝 관련 퀴즈에 "지도에서 확인하기" 버튼
function addQuizMapLinks() {
  if (typeof TM_ENABLED !== 'undefined' && !TM_ENABLED) return;
  quizAnswers.forEach((q, i) => {
    if (q.cat !== 'positioning' && q.topic !== 'sideCond' && q.topic !== 'highground') return;
    const fb = document.getElementById(`feedback-${i}`); if (!fb) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline quiz-map-link'; btn.type = 'button';
    btn.textContent = '🗺️ 지도에서 확인하기';
    btn.onclick = () => tmOpen({ map: 'kings-row', sit: q.topic === 'sideCond' ? 'sidePush' : 'fightStart', role: q.topic === 'sideCond' || q.topic === 'highground' ? 'dps' : undefined });
    fb.insertAdjacentElement('afterend', btn);
  });
}

// ---------- 표: 모바일 카드형 라벨 ----------
function labelTableCells() {
  document.querySelectorAll('table.tbl').forEach(t => {
    const heads = Array.from(t.querySelectorAll('thead th')).map(th => th.textContent.trim());
    t.querySelectorAll('tbody tr').forEach(tr => {
      let col = 0;
      tr.querySelectorAll('td').forEach(td => {
        const span = td.colSpan || 1;
        if (span === 1 && heads[col]) td.dataset.label = heads[col];
        col += span;
      });
    });
  });
}

// ---------- 영웅 도감 ----------
let heroRole = 'all';
let heroTags = new Set();
// 영웅 초상화: assets/heroes/<slug>.webp (블리자드 공식 영웅 페이지 초상화, 팬 콘텐츠 정책에 따른 비상업적 사용)
function heroSlug(h) { return (h.en || h.name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); }
function heroAvatar(h, size) {
  return `<span class="hero-avatar role-${h.role}" style="--sz:${size}px" aria-hidden="true"><img src="assets/heroes/${heroSlug(h)}.webp" alt="${h.name}" loading="lazy" decoding="async" width="256" height="256" onerror="this.parentElement.classList.add('noimg');this.remove()"><svg class="av-fallback"><use href="#${roleIcon[h.role]}"/></svg></span>`;
}
function renderHeroes() {
  const grid = document.getElementById('hero-grid');
  grid.innerHTML = heroes.map((h, i) => `
    <div class="hero-card" data-role="${h.role}" data-newbie="${h.newbie}" role="button" tabindex="0" aria-label="${h.name} 상세 보기" onclick="openHero(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openHero(${i});}">
      <div class="hero-head">
        ${heroAvatar(h, 48)}
        <div class="hero-title">
          <span class="hero-name">${h.name}</span>
          <span class="hero-badges">${h.year === 2026 ? '<span class="hero-badge badge-new">NEW</span>' : ''}${h.newbie ? '<span class="hero-badge">뉴비 추천</span>' : ''}</span>
        </div>
        <span class="hero-role role-${h.role}"><svg><use href="#${roleIcon[h.role]}"/></svg>${roleLabel[h.role]}</span>
      </div>
      <div class="hero-meta"><span class="hero-diff" title="난이도 ${h.diff}/4">${'★'.repeat(h.diff)}${'☆'.repeat(4 - h.diff)}</span><span class="hero-tag">${h.tag}</span></div>
      <div class="hero-desc">${h.desc}</div>
      <div class="hero-more">자세히 보기 →</div>
      <svg class="hero-emblem"><use href="#${roleIcon[h.role]}"/></svg>
    </div>`).join('');
  // 태그 필터 버튼
  const tagWrap = document.getElementById('hero-tag-filters');
  if (tagWrap) tagWrap.innerHTML = Object.entries(HERO_TAG_META).map(([k, v]) => `<button class="filter-btn tag-btn" data-tag="${k}" aria-pressed="false" onclick="toggleHeroTag('${k}',this)">${v}</button>`).join('');
}
function filterHeroes(role, btn) {
  document.querySelectorAll('#hero-filters .filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
  heroRole = role;
  applyHeroFilter();
}
function toggleHeroTag(tag, btn) {
  if (heroTags.has(tag)) heroTags.delete(tag); else heroTags.add(tag);
  btn.classList.toggle('active', heroTags.has(tag)); btn.setAttribute('aria-pressed', heroTags.has(tag) ? 'true' : 'false');
  applyHeroFilter();
}
function clearHeroSearch() {
  document.getElementById('hero-search').value = '';
  applyHeroFilter();
  document.getElementById('hero-search').focus();
}
function normalize(str) { return String(str).toLowerCase().replace(/[\s.:·]/g, ''); }
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function heroSearchText(h) {
  const d = HERO_DETAILS[h.name] || {};
  const diffLabel = ['', '입문', '쉬움', '보통', '어려움'][h.diff] || '';
  const tagLabels = (d.tags || []).map(t => HERO_TAG_META[t]).join(' ');
  return normalize([h.name, h.en || '', roleLabel[h.role], h.tag, h.desc, diffLabel, d.attack || '', d.range || '', tagLabels, d.coach || '', h.year === 2026 ? '2026 신규 new' : ''].join(' '));
}
function applyHeroFilter() {
  const input = document.getElementById('hero-search');
  const q = normalize(input.value);
  document.getElementById('hero-search-wrap').classList.toggle('has-value', q.length > 0);
  let visible = 0;
  document.querySelectorAll('.hero-card').forEach((card, i) => {
    const h = heroes[i];
    const d = HERO_DETAILS[h.name] || { tags: [] };
    const roleOk = heroRole === 'all' || (heroRole === 'newbie' ? h.newbie : h.role === heroRole);
    const tagOk = [...heroTags].every(t => t === 'new' ? h.year === 2026 : (d.tags || []).includes(t));
    const textOk = !q || heroSearchText(h).includes(q);
    const show = roleOk && tagOk && textOk;
    card.classList.toggle('hidden', !show);
    if (show) visible++;
    const nameEl = card.querySelector('.hero-name');
    if (q && normalize(h.name).includes(q)) {
      const re = new RegExp(escapeRe(input.value.trim()), 'i');
      nameEl.innerHTML = h.name.replace(re, m => `<mark class="hl">${m}</mark>`);
    } else {
      nameEl.textContent = h.name;
    }
  });
  document.getElementById('hero-empty').style.display = visible ? 'none' : 'block';
  document.getElementById('hero-count').textContent = `${visible} / ${heroes.length}명`;
}

// ---------- 영웅 상세 모달 ----------
let lastFocus = null;
function openHero(i) {
  const h = heroes[i]; const d = HERO_DETAILS[h.name];
  const modal = document.getElementById('hero-modal');
  const body = document.getElementById('hero-modal-body');
  lastFocus = document.activeElement;
  const stat = (label, v) => `<div class="stat"><span>${label}</span><div class="stat-dots" aria-label="${label} ${v}/5">${'●'.repeat(v)}${'○'.repeat(5 - v)}</div></div>`;
  if (!d) {
    body.innerHTML = `<h2>${h.name}</h2><p>${h.desc}</p>`;
  } else {
    body.innerHTML = `
      <div class="hm-head role-${h.role}">
        ${heroAvatar(h, 72)}
        <div>
          <div class="hm-kicker">${roleLabel[h.role]} · ${h.tag} · 난이도 ${'★'.repeat(h.diff)}${'☆'.repeat(4 - h.diff)}${h.newbie ? ' · <span class="hero-badge">뉴비 추천</span>' : ''}</div>
          <h2 id="hero-modal-title">${h.name}</h2>
          <p class="hm-coach">💬 "${d.coach}"</p>
        </div>
      </div>
      <div class="hm-grid">
        <div class="hm-card"><h4>📋 기본 정보</h4>
          <ul class="kv small">
            <li><span>공격 방식</span><strong>${d.attack}</strong></li>
            <li><span>사거리</span><strong>${d.range}</strong></li>
            <li><span>추천 티어</span><strong>${d.tier}</strong></li>
          </ul>
          <div class="stats">${stat('기동성', d.mobility)}${stat('생존력', d.survive)}</div>
          <div class="hm-tags">${(d.tags || []).map(t => `<span class="pill">${HERO_TAG_META[t]}</span>`).join('') || '<span class="fig-muted">—</span>'}</div>
        </div>
        <div class="hm-card hm-first"><h4>🥇 처음 잡으면 이것부터</h4><p>${d.first}</p></div>
        <div class="hm-card"><h4>🎯 운영 핵심 5</h4><ol class="steps">${d.core.map(c => `<li>${c}</li>`).join('')}</ol></div>
        <div class="hm-card"><h4>🚫 하지 말아야 할 행동</h4><ul class="dont">${d.dont.map(c => `<li>${c}</li>`).join('')}</ul></div>
        <div class="hm-card"><h4>🧭 판단 기준</h4>
          <ul class="kv small">
            <li><span>언제 공격?</span><strong>${d.when.attack}</strong></li>
            <li><span>언제 후퇴?</span><strong>${d.when.retreat}</strong></li>
            <li><span>누구를 노림?</span><strong>${d.when.target}</strong></li>
            <li><span>어디서 싸움?</span><strong>${d.when.where}</strong></li>
          </ul></div>
        <div class="hm-card"><h4>💥 궁극기 사용법</h4>
          <ul class="kv small">
            <li><span>어떻게</span><strong>${d.ult.how}</strong></li>
            <li><span>🟢 좋은 상황</span><strong>${d.ult.good}</strong></li>
            <li><span>🔴 나쁜 상황</span><strong>${d.ult.bad}</strong></li>
          </ul></div>
        <div class="hm-card"><h4>🔀 카운터 (이 영웅이 힘든 상대)</h4><div class="hm-tags">${d.counters.map(n => heroLink(n)).join('')}</div></div>
        <div class="hm-card"><h4>🤝 추천 영웅 조합</h4><div class="hm-tags">${d.synergy.map(n => heroLink(n)).join('')}</div></div>
      </div>
      <div class="tip-box coach-note" style="margin-bottom:0"><div class="tip-title">💡 이것만 기억하세요</div><div class="tip-content">${d.coach}</div></div>
      <div style="margin-top:.9rem;display:flex;gap:.5rem;flex-wrap:wrap">${(typeof TM_ENABLED !== 'undefined' && !TM_ENABLED) ? '' : `<button class="btn btn-primary" onclick="closeModal('hero-modal'); tmOpen({hero:'${h.name.replace(/'/g, "\'")}'})">🗺️ 이 영웅의 맵 포지션 보기</button>`}</div>`;
  }
  modal.hidden = false; document.body.classList.add('modal-open');
  modal.querySelector('.modal-close').focus();
}
function heroLink(name) {
  const idx = heroes.findIndex(h => h.name === name);
  return idx >= 0 ? `<button class="pill pill-btn" onclick="openHero(${idx})">${name}</button>` : `<span class="pill">${name}</span>`;
}
function closeModal(id) {
  const m = document.getElementById(id || 'hero-modal');
  m.hidden = true; document.body.classList.remove('modal-open');
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

// ---------- 플레이스타일 영웅 추천 (점수 기반) ----------
const STYLE_QUESTIONS = [
  { key:'front',    text:'앞에서 싸우는 것이 좋다' },
  { key:'back',     text:'뒤에서 안전하게 싸우는 것이 좋다' },
  { key:'flank',    text:'적 뒤를 공격하고 싶다' },
  { key:'help',     text:'팀원을 도와주는 것이 좋다' },
  { key:'aim',      text:'에임으로 승부하고 싶다' },
  { key:'strategy', text:'전략적으로 플레이하고 싶다' },
  { key:'mobile',   text:'기동성 높은 영웅을 좋아한다' },
  { key:'tanky',    text:'실수해도 쉽게 죽지 않는 영웅을 원한다' }
];
function renderStyleQuiz() {
  const box = document.getElementById('style-quiz');
  if (!box) return;
  box.innerHTML = STYLE_QUESTIONS.map((q, i) => `<label class="check-item"><input type="checkbox" value="${q.key}" onchange="updateStyleCount()"> <span>${i + 1}. ${q.text}</span></label>`).join('');
  updateStyleCount();
}
function updateStyleCount() {
  const n = document.querySelectorAll('#style-quiz input:checked').length;
  const btn = document.getElementById('style-submit');
  if (btn) { btn.disabled = n === 0; btn.textContent = n ? `추천 영웅 보기 (${n}개 선택)` : '항목을 골라 주세요'; }
}
// 나중에 AI로 교체 가능한 진입점 — 현재는 로컬 점수 계산
function getHeroRecommendation(prefs, roleFilter) {
  const scored = heroes.map(h => {
    const d = HERO_DETAILS[h.name]; if (!d) return null;
    if (roleFilter && roleFilter !== 'all' && h.role !== roleFilter) return null;
    let score = 0; const matched = [];
    prefs.forEach(p => { const v = d.style[p] || 0; score += v; if (v >= 2) matched.push(p); });
    score += h.newbie ? 1.5 : 0;           // 입문 가산
    score -= (h.diff - 1) * 0.5;           // 난이도 감산
    return { h, d, score, matched };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}
function runStyleQuiz() {
  const prefs = [...document.querySelectorAll('#style-quiz input:checked')].map(i => i.value);
  if (!prefs.length) return;
  const role = document.getElementById('style-role').value;
  const top = getHeroRecommendation(prefs, role);
  const labels = Object.fromEntries(STYLE_QUESTIONS.map(q => [q.key, q.text]));
  const medals = ['🥇 1위', '🥈 2위', '🥉 3위'];
  document.getElementById('style-result').innerHTML = `
    <div class="reco-grid">${top.map((r, i) => `
      <div class="reco-card role-${r.h.role}">
        <div class="reco-rank">${medals[i]}</div>
        <div class="reco-name">${r.h.name} <span class="hero-role role-${r.h.role}">${roleLabel[r.h.role]}</span></div>
        <div class="reco-why"><strong>이유:</strong> ${r.matched.length ? r.matched.map(m => `"${labels[m]}"`).join(', ') + '에 잘 맞습니다.' : '선택하신 성향과 전반적으로 균형이 맞습니다.'}${r.h.newbie ? ' 입문 난도도 낮습니다.' : ''}</div>
        <div class="reco-coach">💬 ${r.d.coach}</div>
        <button class="btn btn-outline" onclick="openHero(${heroes.indexOf(r.h)})">상세 보기</button>
      </div>`).join('')}</div>`;
  state.reco = { picks: top.map(r => r.h.name), date: todayKey() };
  addXP(XP_RULES.recommend, '영웅 추천 완료');
}

// ---------- 맵 가이드 ----------
let mapMode = 'all';
function renderMaps() {
  const wrap = document.getElementById('map-list'); if (!wrap) return;
  const list = MAPS.filter(m => mapMode === 'all' || m.mode === mapMode);
  wrap.innerHTML = list.map((m, i) => `
    <details class="map-card" ${i === 0 && mapMode !== 'all' ? 'open' : ''}>
      <summary><span class="map-mode">${MAP_MODES[m.mode]}</span><strong>${m.name}</strong> <small>${m.en}</small></summary>
      <div class="map-body">
        <div class="map-grid">
          <div><h5>⛰️ 주요 고지</h5><ul>${m.high.map(x => `<li>${x}</li>`).join('')}</ul></div>
          <div><h5>🚪 주요 초크</h5><ul>${m.choke.map(x => `<li>${x}</li>`).join('')}</ul></div>
          <div><h5>🛣️ 메인 루트</h5><p>${m.main}</p></div>
          <div><h5>↪️ 사이드 루트</h5><ul>${m.side.map(x => `<li>${x}</li>`).join('')}</ul></div>
          <div><h5>🏥 주요 힐팩</h5><ul>${m.packs.map(x => `<li>${x}</li>`).join('')}</ul></div>
        </div>
        <ul class="kv small">
          <li><span>공격 시 주의</span><strong>${m.atk}</strong></li>
          <li><span>수비 시 주의</span><strong>${m.def}</strong></li>
          <li><span>🛡️ 탱커 위치</span><strong>${m.tank}</strong></li>
          <li><span>⚔️ 딜러 위치</span><strong>${m.dps}</strong></li>
          <li><span>💚 지원 위치</span><strong>${m.sup}</strong></li>
        </ul>
        <div class="tip-box coach-note"><div class="tip-title">🚫 이 맵에서 뉴비가 가장 많이 하는 실수</div><div class="tip-content">${m.mistake}</div></div>
      </div>
    </details>`).join('');
}
function filterMaps(mode, btn) {
  mapMode = mode;
  document.querySelectorAll('#map-filters .filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
  renderMaps();
}

// ---------- 상황판단 훈련 ----------
let sitCat = 'all', sitDiff = 'all', sitRole = 'all', sitHero = 'all';
// 상황의 실제 역할 = 내 영웅의 역할 (role:'any'인 문제도 영웅 기준으로 분류)
function sitRoleOf(s) { const h = heroes.find(x => x.name === s.hero); return h ? h.role : (s.role === 'any' ? 'dps' : s.role); }
let trainTool = 'situations';
function showTrainTool(id, btn) {
  trainTool = id;
  document.querySelectorAll('.train-tool').forEach(el => el.hidden = el.id !== 'tool-' + id);
  document.querySelectorAll('.subtab').forEach(b => { const on = b.dataset.tool === id; b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
  if (id === 'situations' || id === 'side') renderSituations(id === 'side');
  if (id === 'fight') renderFightStates();
  if (id === 'checklist') renderChecklist();
  if (id === 'review') renderReview();
}
function renderSituationFilters() {
  const cats = document.getElementById('sit-cat-filters'); if (!cats) return;
  cats.innerHTML = `<span class="f-label">유형</span><button class="filter-btn ${sitCat === 'all' ? 'active' : ''}" aria-pressed="${sitCat === 'all'}" onclick="setSitFilter('cat','all',this)">전체</button>` +
    Object.entries(SITUATION_CATS).filter(([k]) => k !== 'side').map(([k, v]) => `<button class="filter-btn ${sitCat === k ? 'active' : ''}" aria-pressed="${sitCat === k}" onclick="setSitFilter('cat','${k}',this)">${v.icon} ${v.label}</button>`).join('');
  renderSitRoleTabs(); renderSitHeroChips();
}
// 1단계: 역할 탭 (탱커 / 딜러 / 힐러)
function renderSitRoleTabs() {
  const el = document.getElementById('sit-role-tabs'); if (!el) return;
  const pool = SITUATIONS.filter(s => s.cat !== 'side');
  const cnt = r => pool.filter(s => r === 'all' || sitRoleOf(s) === r).length;
  const done = r => pool.filter(s => (r === 'all' || sitRoleOf(s) === r) && state.sit[s.id] !== undefined).length;
  const tabs = [['all', '전체', '📚'], ['tank', '탱커', '🛡️'], ['dps', '딜러', '⚔️'], ['support', '힐러', '💚']];
  el.innerHTML = tabs.map(([r, l, ic]) => `<button class="sit-role-tab ${sitRole === r ? 'active' : ''} r-${r}" role="tab" aria-selected="${sitRole === r}" onclick="setSitRole('${r}')"><span class="srt-icon">${ic}</span><span class="srt-label">${l}</span><span class="srt-count">${done(r)}/${cnt(r)}</span></button>`).join('');
}
function setSitRole(r) { sitRole = r; sitHero = 'all'; renderSitRoleTabs(); renderSitHeroChips(); renderSituations(false); }
// 2단계: 영웅 칩 (해당 역할에서 문제가 있는 영웅만, 문제 수 표시)
function renderSitHeroChips() {
  const el = document.getElementById('sit-hero-chips'); if (!el) return;
  const pool = SITUATIONS.filter(s => s.cat !== 'side' && (sitRole === 'all' || sitRoleOf(s) === sitRole));
  const byHero = {}; pool.forEach(s => { byHero[s.hero] = byHero[s.hero] || { n: 0, d: 0 }; byHero[s.hero].n++; if (state.sit[s.id] !== undefined) byHero[s.hero].d++; });
  const names = Object.keys(byHero).sort((a, b) => byHero[b].n - byHero[a].n || a.localeCompare(b, 'ko'));
  if (sitHero !== 'all' && !byHero[sitHero]) sitHero = 'all';
  el.innerHTML = `<span class="f-label">영웅</span><button class="filter-btn ${sitHero === 'all' ? 'active' : ''}" aria-pressed="${sitHero === 'all'}" onclick="setSitHero('all')">전체 (${pool.length})</button>` +
    names.map(n => `<button class="filter-btn hero-chip ${sitHero === n ? 'active' : ''}" aria-pressed="${sitHero === n}" onclick="setSitHero(this.dataset.h)" data-h="${n}">${n} <small>${byHero[n].d}/${byHero[n].n}</small></button>`).join('');
  const hint = document.getElementById('sit-hero-hint');
  if (hint) {
    if (sitHero === 'all') hint.innerHTML = sitRole === 'all' ? '역할을 고르면 그 역할의 영웅별 상황이 나옵니다. 내 주력 영웅부터 풀어 보세요.' : `${{ tank: '탱커', dps: '딜러', support: '힐러' }[sitRole]} 영웅별 상황입니다. 영웅을 누르면 그 영웅으로 겪는 판단만 모아 보여 드립니다.`;
    else { const d = HERO_DETAILS[sitHero]; hint.innerHTML = `<b>${sitHero}</b> 상황 ${byHero[sitHero].n}개${d ? ` · 💬 "${d.coach}"` : ''} <button class="pill pill-btn" onclick="openHero(${heroes.findIndex(h => h.name === sitHero)})">영웅 상세</button>`; }
  }
}
function setSitHero(n) { sitHero = n; renderSitHeroChips(); renderSituations(false); }
function setSitFilter(kind, val, btn) {
  if (kind === 'cat') sitCat = val; if (kind === 'diff') sitDiff = val;
  const wrap = btn.parentElement;
  wrap.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
  btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
  renderSituations(trainTool === 'side');
}
function sitVerdictOf(s) { const c = state.sit[s.id]; return c === undefined ? null : s.choices[c].v; }
function renderSituations(sideOnly) {
  const wrap = document.getElementById(sideOnly ? 'side-list' : 'sit-list'); if (!wrap) return;
  let list = SITUATIONS.filter(s => sideOnly ? s.cat === 'side' : s.cat !== 'side');
  if (!sideOnly) {
    if (sitCat !== 'all') list = list.filter(s => s.cat === sitCat);
    if (sitDiff !== 'all') list = list.filter(s => s.diff === sitDiff);
    if (sitRole !== 'all') list = list.filter(s => sitRoleOf(s) === sitRole);
    if (sitHero !== 'all') list = list.filter(s => s.hero === sitHero);
  }
  const done = list.filter(s => state.sit[s.id] !== undefined).length;
  const cnt = document.getElementById(sideOnly ? 'side-count' : 'sit-count');
  if (cnt) cnt.textContent = `${done} / ${list.length} 풀이`;
  wrap.innerHTML = list.length ? list.map(s => situationHTML(s)).join('') : '<div class="hero-empty">조건에 맞는 문제가 없습니다.</div>';
}
function situationHTML(s) {
  const cat = SITUATION_CATS[s.cat]; const diff = DIFF_META[s.diff];
  const chosen = state.sit[s.id];
  const roleTxt = roleLabel[sitRoleOf(s)] + ' · ' + s.hero;
  return `
  <div class="sit-card ${chosen !== undefined ? 'answered' : ''}" id="sit-${s.id}">
    <div class="sit-head">
      <span class="sit-cat">${cat.icon} ${cat.label} · ${s.sub}</span>
      <span class="sit-badges"><span class="diff-badge d-${s.diff}">${diff.icon} ${diff.label}</span><span class="diff-badge">${roleTxt}</span></span>
    </div>
    <h4 class="sit-title">${s.title}</h4>
    <div class="sit-setup">
      <div class="sit-teams">
        <div><span class="f-label">내 영웅</span> <strong>${s.hero}</strong></div>
        <div><span class="f-label">우리 팀</span> ${s.team.map(n => `<span class="pill tiny">${n}</span>`).join('')}</div>
        <div><span class="f-label">상대</span> ${s.enemy.map(n => `<span class="pill tiny enemy">${n}</span>`).join('')}</div>
      </div>
      <ul class="sit-facts">${s.facts.map(f => `<li>${f}</li>`).join('')}</ul>
    </div>
    <div class="sit-q">❓ ${s.q}</div>
    <div class="quiz-options sit-options" role="group" aria-label="선택지">
      ${s.choices.map((c, i) => `<button class="quiz-option ${chosen === i ? (c.v === 'good' ? 'selected-correct' : c.v === 'bad' ? 'selected-wrong' : 'selected-mixed') : ''} ${chosen !== undefined && i === s.best && chosen !== i ? 'best-mark' : ''}" onclick="answerSituation('${s.id}', ${i})" ${chosen !== undefined ? 'aria-disabled="true"' : ''}>${c.t}</button>`).join('')}
    </div>
    <div class="sit-result" id="sit-result-${s.id}" role="status" aria-live="polite">${chosen !== undefined ? situationResultHTML(s, chosen) : ''}</div>
  </div>`;
}
function situationResultHTML(s, i) {
  const c = s.choices[i]; const v = VERDICT_META[c.v];
  const bestTxt = i === s.best ? '' : `<p class="sit-best">✅ 가장 좋은 판단: <strong>${s.choices[s.best].t}</strong> — ${s.choices[s.best].why}</p>`;
  return `
    <div class="verdict ${v.cls}"><span class="verdict-icon">${v.icon}</span><strong>${v.label}</strong></div>
    <div class="why-grid">
      <div class="why-box"><h5><span class="kicker">WHY</span>왜 그런가</h5><p>${c.why}</p>${bestTxt}</div>
      <div class="why-box"><h5><span class="kicker">WHAT MATTERS NOW</span>지금 봐야 할 정보</h5><ul>${s.keyInfo.map(k => `<li>${k}</li>`).join('')}</ul></div>
      <div class="why-box"><h5><span class="kicker">OPTIONS</span>각 선택의 장점 / 위험</h5><ul>${s.choices.map((o, j) => `<li class="${j === i ? 'mine' : ''}">${VERDICT_META[o.v].icon} <strong>${o.t.replace(/^🟢 |^🟡 |^🔴 /, '')}</strong><br><small>${o.why}</small></li>`).join('')}</ul></div>
      <div class="why-box pro"><h5><span class="kicker">PRO VIEW</span>프로는 이렇게 봅니다</h5><p>${s.pro}</p></div>
    </div>
    <div class="tip-box coach-note"><div class="tip-title"><span class="kicker">WHAT TO CHECK NEXT</span> 다음 게임에서 확인할 것</div><div class="tip-content">${s.keyPoint}</div></div>`;
}
function answerSituation(id, i) {
  if (state.sit[id] !== undefined) return;
  const s = SITUATIONS.find(x => x.id === id);
  state.sit[id] = i;
  const v = s.choices[i].v;
  addXP(v === 'good' ? XP_RULES.sitGood : v === 'mixed' ? XP_RULES.sitMixed : XP_RULES.sitBad, v === 'good' ? '좋은 판단' : v === 'mixed' ? '판단 완료' : '판단 복기');
  saveState();
  const card = document.getElementById('sit-' + id);
  if (card) { card.outerHTML = situationHTML(s); const r = document.getElementById('sit-result-' + id); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  updateProgress();
  const cnt = document.getElementById(s.cat === 'side' ? 'side-count' : 'sit-count');
  if (cnt) { const m = cnt.textContent.match(/(\d+) \/ (\d+)/); if (m) cnt.textContent = `${Number(m[1]) + 1} / ${m[2]} 풀이`; }
  if (s.cat !== 'side') { renderSitRoleTabs(); renderSitHeroChips(); }
  // 오늘의 훈련 문제였다면 미션 표시
  const daily = getDailyTopic();
  if (daily.situation === id) { markDaily('sitDone'); renderDaily(); }
}
function resetSituations() {
  if (!confirm('상황판단 풀이 기록을 초기화하시겠습니까? (XP는 유지됩니다)')) return;
  state.sit = {}; saveState(); renderSituations(trainTool === 'side'); updateProgress();
}

// ---------- "지금 뭘 해야 하지?" 규칙 엔진 ----------
function renderAdvisor() {
  const form = document.getElementById('advisor-form'); if (!form) return;
  form.innerHTML = ADVISOR_FIELDS.map(f => `
    <div class="adv-field"><label for="adv-${f.key}">${f.label}</label>
      <select id="adv-${f.key}" onchange="runAdvisor()">${f.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`).join('');
}
// 나중에 AI로 교체 가능한 진입점 — 현재는 규칙 기반
function getSituationAdvice(input) {
  const hits = ADVISOR_RULES.filter(r => Object.entries(r.when).every(([k, vals]) => vals.includes(input[k])));
  hits.sort((a, b) => b.priority - a.priority);
  const top = hits.filter(r => r.id !== 'r_default').slice(0, 3);
  return top.length ? top : [ADVISOR_RULES.find(r => r.id === 'r_default')];
}
let advisorTouched = false;
function runAdvisor() {
  const input = {};
  ADVISOR_FIELDS.forEach(f => input[f.key] = document.getElementById('adv-' + f.key).value);
  const rules = getSituationAdvice(input);
  document.getElementById('advisor-result').innerHTML = rules.map((r, i) => {
    const v = VERDICT_META[r.verdict];
    return `<div class="adv-card ${v.cls} ${i === 0 ? 'primary' : ''}">
      <div class="adv-rank">${i === 0 ? '1순위' : i === 1 ? '2순위' : '3순위'} ${v.icon}</div>
      <h4>${r.title}</h4>
      <p class="adv-action">👉 ${r.action}</p>
      <p class="adv-why"><strong>왜:</strong> ${r.why}</p>
      <p class="adv-call">🗣️ 콜: ${r.call}</p>
    </div>`;
  }).join('');
  if (!advisorTouched) { advisorTouched = true; addXP(XP_RULES.advisor, '상황 조언 확인'); }
}

// ---------- 한타 상태 ----------
function renderFightStates() {
  const wrap = document.getElementById('fight-states'); if (!wrap || wrap.dataset.ready) return;
  wrap.dataset.ready = '1';
  wrap.innerHTML = `<div class="fight-btns" role="tablist">${FIGHT_STATES.map((f, i) => `<button class="filter-btn ${i === 0 ? 'active' : ''}" role="tab" aria-selected="${i === 0}" onclick="showFightState('${f.id}',this)">${f.icon} ${f.label}</button>`).join('')}</div><div id="fight-detail"></div>`;
  showFightState(FIGHT_STATES[0].id, wrap.querySelector('.filter-btn'));
}
function showFightState(id, btn) {
  const f = FIGHT_STATES.find(x => x.id === id); const v = VERDICT_META[f.verdict];
  btn.parentElement.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
  btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
  document.getElementById('fight-detail').innerHTML = `
    <div class="fight-card">
      <div class="verdict ${v.cls}"><span class="verdict-icon">${f.icon}</span><strong>${f.label}</strong> — ${f.priority}</div>
      <ol class="steps">${f.do.map(d => `<li>${d}</li>`).join('')}</ol>
      <ul class="kv small">
        <li><span>❤️ HP</span><strong>${f.hp}</strong></li>
        <li><span>💥 궁</span><strong>${f.ult}</strong></li>
        <li><span>📐 위치</span><strong>${f.pos}</strong></li>
        <li><span>⏳ 쿨다운</span><strong>${f.cd}</strong></li>
      </ul>
    </div>`;
}

// ---------- 한타 전 체크리스트 ----------
function renderChecklist() {
  const wrap = document.getElementById('checklist'); if (!wrap) return;
  wrap.innerHTML = PREFIGHT_CHECKLIST.map(c => `<label class="check-item big"><input type="checkbox" onchange="checklistChanged()"> <span>${c.text}<small>${c.tip}</small></span></label>`).join('');
  const n = (state.checklist[todayKey()] || 0);
  document.getElementById('checklist-done').textContent = n ? `오늘 ${n}번 확인했습니다` : '';
}
function checklistChanged() {
  const all = document.querySelectorAll('#checklist input');
  const checked = [...all].filter(i => i.checked).length;
  if (checked === all.length) {
    state.checklist[todayKey()] = (state.checklist[todayKey()] || 0) + 1;
    addXP(XP_RULES.checklist, '체크리스트 완료');
    setTimeout(() => { all.forEach(i => i.checked = false); renderChecklist(); }, 600);
  }
}

// ---------- 죽었을 때 복기 ----------
function renderReview() {
  const wrap = document.getElementById('review-list'); if (!wrap) return;
  wrap.innerHTML = DEATH_REASONS.map(r => `<label class="check-item"><input type="checkbox" value="${r.id}"> <span>${r.text}</span></label>`).join('');
  renderReviewStats();
}
function submitReview() {
  const picked = [...document.querySelectorAll('#review-list input:checked')].map(i => i.value);
  if (!picked.length) { toast('이유를 하나 이상 골라 주세요'); return; }
  const k = todayKey(); if (!state.deaths[k]) state.deaths[k] = {};
  picked.forEach(id => state.deaths[k][id] = (state.deaths[k][id] || 0) + 1);
  addXP(XP_RULES.review, '복기 완료');
  document.querySelectorAll('#review-list input').forEach(i => i.checked = false);
  const top = DEATH_REASONS.find(r => r.id === picked[0]);
  document.getElementById('review-feedback').innerHTML = `<div class="tip-box coach-note"><div class="tip-title">💡 다음엔 이렇게</div><div class="tip-content">${picked.map(id => { const r = DEATH_REASONS.find(x => x.id === id); return `<div><strong>${r.text}</strong> → ${r.fix}</div>`; }).join('')}</div></div>`;
  renderReviewStats();
}
function reviewStats(days) {
  const agg = {}; const keys = Object.keys(state.deaths).sort().slice(-days);
  let total = 0;
  keys.forEach(k => Object.entries(state.deaths[k]).forEach(([id, n]) => { agg[id] = (agg[id] || 0) + n; total += n; }));
  return { agg, total, list: Object.entries(agg).sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ r: DEATH_REASONS.find(x => x.id === id), n })) };
}
function renderReviewStats() {
  const el = document.getElementById('review-stats'); if (!el) return;
  const today = state.deaths[todayKey()] || {};
  const tList = Object.entries(today).sort((a, b) => b[1] - a[1]);
  const tTotal = tList.reduce((s, [, n]) => s + n, 0);
  const all = reviewStats(9999);
  const bar = (list, total) => list.slice(0, 5).map(([id, n]) => { const r = DEATH_REASONS.find(x => x.id === id); return `<div class="result-cat"><span>${r.text}</span><div class="mini-bar"><div class="mini-fill bad" style="width:${Math.round(n / total * 100)}%"></div></div><b>${n}회</b></div>`; }).join('');
  el.innerHTML = `
    <h4>📅 오늘 가장 많이 발생한 실수 ${tTotal ? `<small>(${tTotal}회 기록)</small>` : ''}</h4>
    ${tTotal ? `<div class="result-cats">${bar(tList, tTotal)}</div>` : '<p class="fig-muted">오늘 기록이 아직 없습니다. 죽은 직후 위에서 이유를 체크해 보세요.</p>'}
    ${all.total ? `<h4 style="margin-top:1rem">📈 전체 누적 <small>(${all.total}회)</small></h4><div class="result-cats">${bar(all.list.map(x => [x.r.id, x.n]), all.total)}</div>` : ''}`;
}

// ---------- 오늘의 훈련 (날짜 시드) ----------
function getDailyTopic() {
  const d = new Date();
  const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
  let x = Math.sin(seed) * 10000; x = x - Math.floor(x);
  return DAILY_TOPICS[Math.floor(x * DAILY_TOPICS.length)];
}
function markDaily(flag) {
  const k = todayKey(); if (!state.daily[k]) state.daily[k] = {};
  if (!state.daily[k][flag]) { state.daily[k][flag] = true; if (flag === 'sitDone') addXP(XP_RULES.daily, '오늘의 훈련 완료'); else saveState(); }
}
function renderDaily() {
  const box = document.getElementById('daily-box'); if (!box) return;
  const t = getDailyTopic(); const s = SITUATIONS.find(x => x.id === t.situation);
  const st = state.daily[todayKey()] || {};
  const done = st.sitDone || state.sit[t.situation] !== undefined;
  box.innerHTML = `
    <div class="daily-head"><span class="daily-kicker">${todayKey()}</span><span class="daily-sub">오늘은 이것 하나만 공부하세요.</span></div>
    <h3>오늘의 주제: ${t.title}</h3>
    <p>${t.desc}</p>
    <div class="daily-actions">
      <button class="btn btn-primary" onclick="goToDailySituation()">${done ? '✅ 문제 다시 보기' : '🧪 상황 문제 1개 풀기'}</button>
      <button class="btn btn-outline" onclick="switchSection(${t.section})">📖 관련 파트 읽기</button>
    </div>
    ${done ? `<div class="tip-box coach-note" style="margin-bottom:0"><div class="tip-title">🎯 오늘의 미션</div><div class="tip-content">"${t.mission}"<br><small>다음 게임에서 딱 이것 하나만 지켜 보세요.</small></div></div>` : `<p class="fig-muted" style="font-size:.85rem">문제를 풀면 오늘의 미션이 열립니다. (${s ? s.title : ''})</p>`}`;
  markDaily('read');
}
function goToDailySituation() {
  const t = getDailyTopic();
  switchSection(7);
  const tool = SITUATIONS.find(x => x.id === t.situation).cat === 'side' ? 'side' : 'situations';
  showTrainTool(tool, document.querySelector(`.subtab[data-tool="${tool}"]`));
  if (tool === 'situations') { sitCat = 'all'; sitDiff = 'all'; sitRole = 'all'; sitHero = 'all'; renderSituationFilters(); document.querySelectorAll('#sit-diff-filters .filter-btn, #sit-role-filters .filter-btn').forEach((b, i) => { b.classList.toggle('active', b.dataset.val === 'all'); }); renderSituations(false); }
  setTimeout(() => { const el = document.getElementById('sit-' + t.situation); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('flash'); } }, 80);
}

// ---------- 학습 통계 ----------
// 나중에 AI로 교체 가능한 진입점 — 현재는 로컬 집계
function getLearningAnalysis() {
  const solved = Object.keys(state.answers).length;
  const correct = Object.entries(state.answers).filter(([i, a]) => quizAnswers[i] && quizAnswers[i].correct === a).length;
  const cats = {}; const roles = { tank: { n: 0, s: 0 }, dps: { n: 0, s: 0 }, support: { n: 0, s: 0 } };
  let sitN = 0, sitScore = 0;
  const vScore = { good: 1, mixed: 0.5, bad: 0 };
  SITUATIONS.forEach(s => {
    const c = state.sit[s.id]; if (c === undefined) return;
    const sc = vScore[s.choices[c].v];
    sitN++; sitScore += sc;
    if (!cats[s.cat]) cats[s.cat] = { n: 0, s: 0 }; cats[s.cat].n++; cats[s.cat].s += sc;
    { const r = sitRoleOf(s); roles[r].n++; roles[r].s += sc; }
  });
  const catList = Object.entries(SITUATION_CATS).map(([k, m]) => ({ key: k, label: m.label, icon: m.icon, n: cats[k] ? cats[k].n : 0, pct: cats[k] ? Math.round(cats[k].s / cats[k].n * 100) : null }));
  const rated = catList.filter(c => c.n >= 2);
  const weakest = rated.length ? rated.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
  const strongest = rated.length ? rated.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  return {
    quiz: { solved, correct, pct: solved ? Math.round(correct / solved * 100) : 0 },
    sit: { n: sitN, pct: sitN ? Math.round(sitScore / sitN * 100) : 0 },
    judgment: sitN ? Math.round(sitScore / sitN * 100) : null,
    cats: catList, roles, weakest, strongest,
    quizCats: quizCategoryScores(),
    reco: recommendedTopics().slice(0, 3),
    lastStudy: state.lastStudy,
    level: levelInfo(state.xp || 0), xp: state.xp || 0
  };
}
function renderStats() {
  const el = document.getElementById('stats-body'); if (!el) return;
  const a = getLearningAnalysis();
  const scoreRow = (label, pct, n) => `<div class="result-cat"><span>${label}</span><div class="mini-bar"><div class="mini-fill ${pct === null ? '' : pct >= 75 ? 'good' : pct >= 50 ? 'mixed' : 'bad'}" style="width:${pct || 0}%"></div></div><b>${pct === null ? '—' : pct}</b><small>${n ? n + '문제' : '미풀이'}</small></div>`;
  const roleRow = (k) => { const r = a.roles[k]; const p = r.n ? Math.round(r.s / r.n * 100) : null; return scoreRow(roleLabel[k], p, r.n); };
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-tile"><div class="stat-num">${a.quiz.pct}%</div><div class="stat-label">퀴즈 정답률</div><small>${a.quiz.correct} / ${a.quiz.solved} (총 ${TOTAL_QUIZ})</small></div>
      <div class="stat-tile"><div class="stat-num">${a.judgment === null ? '—' : a.judgment}</div><div class="stat-label">상황판단 점수</div><small>${a.sit.n} / ${SITUATIONS.length} 풀이</small></div>
      <div class="stat-tile"><div class="stat-num">Lv.${a.level.cur.lv}</div><div class="stat-label">${a.level.cur.name}</div><small>${a.xp} XP</small></div>
      <div class="stat-tile"><div class="stat-num">${a.lastStudy ? a.lastStudy.slice(5).replace('-', '/') : '—'}</div><div class="stat-label">최근 학습 날짜</div><small>${a.lastStudy === todayKey() ? '오늘도 학습 중!' : '오늘 한 문제 풀어 보세요'}</small></div>
    </div>
    <div class="stats-cols">
      <div class="card"><h3><span class="card-icon">🧭</span>상황판단 분야별 점수</h3>
        <div class="result-cats">${a.cats.map(c => scoreRow(`${c.icon} ${c.label}`, c.pct, c.n)).join('')}</div>
        <p class="fig-muted" style="font-size:.82rem;margin-top:.5rem">좋은 판단 100 · 상황에 따라 다름 50 · 위험한 판단 0으로 계산합니다. 2문제 이상 풀어야 강점·약점에 반영됩니다.</p>
      </div>
      <div class="card"><h3><span class="card-icon">👥</span>역할별 점수</h3>
        <div class="result-cats">${['tank', 'dps', 'support'].map(roleRow).join('')}</div>
        <h3 style="margin-top:1rem"><span class="card-icon">📝</span>퀴즈 분야별</h3>
        <div class="result-cats">${Object.entries(a.quizCats).map(([k, v]) => scoreRow(QUIZ_CATS[k], v.solved ? Math.round(v.correct / v.solved * 100) : null, v.solved)).join('')}</div>
      </div>
    </div>
    <div class="stats-cols">
      <div class="card focus-card bad"><h3><span class="card-icon">🔴</span>현재 가장 먼저 공부해야 하는 것</h3>
        ${a.weakest ? `<div class="focus-big">${a.weakest.icon} ${a.weakest.label} 판단 <small>${a.weakest.pct}점</small></div>` : '<p class="fig-muted">상황판단 문제를 2개 이상 풀면 표시됩니다.</p>'}
        ${a.reco.length ? `<strong>추천 학습 순서</strong><ol class="steps">${a.reco.map(t => `<li><a onclick="switchSection(${t.section})">${t.title}</a> — ${t.mission}</li>`).join('')}</ol>` : ''}
      </div>
      <div class="card focus-card good"><h3><span class="card-icon">🟢</span>가장 잘하는 것</h3>
        ${a.strongest ? `<div class="focus-big">${a.strongest.icon} ${a.strongest.label} <small>${a.strongest.pct}점</small></div><p>이 분야는 이미 감각이 있습니다. 약한 분야에 시간을 쓰세요.</p>` : '<p class="fig-muted">상황판단 문제를 2개 이상 풀면 표시됩니다.</p>'}
        <div id="review-summary"></div>
      </div>
    </div>
    <div class="card"><h3><span class="card-icon">🏅</span>레벨 로드맵</h3>
      <div class="level-road">${LEVELS.map(l => `<div class="level-step ${a.level.cur.lv >= l.lv ? 'done' : ''} ${a.level.cur.lv === l.lv ? 'now' : ''}"><b>Lv.${l.lv}</b><span>${l.name}</span><small>${l.xp} XP</small></div>`).join('')}</div>
      <p class="fig-muted" style="font-size:.82rem;margin-top:.6rem">XP: 퀴즈 정답 +${XP_RULES.quizCorrect} · 상황판단 좋은 판단 +${XP_RULES.sitGood} · 오늘의 훈련 +${XP_RULES.daily} · 체크리스트 +${XP_RULES.checklist} · 복기 +${XP_RULES.review}</p>
    </div>
    <div style="text-align:center;margin-top:.5rem"><button class="btn btn-outline" onclick="resetProgress()">진행도 초기화</button></div>`;
  const rs = reviewStats(9999);
  const sum = document.getElementById('review-summary');
  if (sum && rs.total) sum.innerHTML = `<h4 style="margin-top:1rem">💀 복기: 가장 많이 한 실수</h4><div class="result-cats">${rs.list.slice(0, 3).map(x => `<div class="result-cat"><span>${x.r.text}</span><div class="mini-bar"><div class="mini-fill bad" style="width:${Math.round(x.n / rs.total * 100)}%"></div></div><b>${x.n}회</b></div>`).join('')}</div>`;
}

// ---------- 용어 사전 ----------
let glossaryCat = '전체';
const GLOSSARY_CATS = ['전체', '콜', '개념', '조합', '위치', '목표', '시스템', '은어', '밈'];
function setGlossaryCat(c) { glossaryCat = c; renderGlossary(document.getElementById('glossary-search').value); }
function renderGlossaryCats() {
  const el = document.getElementById('glossary-cats'); if (!el) return;
  el.innerHTML = GLOSSARY_CATS.map(c => `<button class="filter-btn${c === glossaryCat ? ' active' : ''}" onclick="setGlossaryCat('${c}')">${c}${c === '전체' ? '' : ` <small>${GLOSSARY.filter(g => (g.cat || '개념') === c).length}</small>`}</button>`).join('');
}
function renderGlossary(q) {
  const wrap = document.getElementById('glossary-list'); if (!wrap) return;
  renderGlossaryCats();
  const nq = normalize(q || '');
  const list = GLOSSARY.filter(g => (glossaryCat === '전체' || (g.cat || '개념') === glossaryCat) && (!nq || normalize([g.term, ...(g.alias || []), g.def, g.use].join(' ')).includes(nq)));
  document.getElementById('glossary-count').textContent = `${list.length} / ${GLOSSARY.length}개`;
  wrap.innerHTML = list.length ? list.map(g => `
    <div class="gl-card" id="gl-${encodeURIComponent(g.term)}">
      <div class="gl-term">${hl(g.term, q)}${g.alias && g.alias.length ? `<small> · ${g.alias.join(' · ')}</small>` : ''}</div>
      <p class="gl-def">${hl(g.def, q)}</p>
      ${g.use ? `<div class="gl-row"><span>실전에서는</span><strong>${g.use}</strong></div>` : ''}
      ${g.opposite ? `<div class="gl-row"><span>반대 행동</span><strong>${g.opposite}</strong></div>` : ''}
      ${g.related && g.related.length ? `<div class="gl-row"><span>관련 개념</span><span class="hm-tags">${g.related.map(r => `<button class="pill pill-btn" onclick="searchGlossary('${r}')">${r}</button>`).join('')}</span></div>` : ''}
    </div>`).join('') : '<div class="hero-empty">검색 결과가 없습니다.</div>';
}
function hl(text, q) {
  if (!q || !q.trim()) return text;
  return text.replace(new RegExp(escapeRe(q.trim()), 'gi'), m => `<mark class="hl">${m}</mark>`);
}
function searchGlossary(q) {
  const input = document.getElementById('glossary-search');
  glossaryCat = '전체'; input.value = q; renderGlossary(q);
  if (currentSection !== 9) switchSection(9);
  input.focus();
}

// ---------- 전체 검색 ----------
function openSearch() {
  const m = document.getElementById('search-modal');
  lastFocus = document.activeElement;
  m.hidden = false; document.body.classList.add('modal-open');
  const i = document.getElementById('global-search'); i.value = ''; i.focus();
  document.getElementById('search-results').innerHTML = '<p class="fig-muted">영웅 · 용어 · 맵 · 전략 · 상황판단 · 퀴즈를 한 번에 검색합니다. 예: "사이드", "스즈", "파라"</p>';
}
/* ===== 심화 가이드 (마크다운 리더) ===== */
let currentGuide = null;
function renderGuideIndex() {
  const el = document.getElementById('guide-index'); if (!el || typeof GUIDES === 'undefined') return;
  const read = GUIDES.filter(g => state.guides[g.id]).length;
  const groups = ['기초', '전략', '성장'];
  const groupDesc = { '기초': '먼저 읽으세요 — 영웅과 역할을 제대로 이해하는 단계', '전략': '골드 이상을 노린다면 — 조합·카운터·포지셔닝·랭크별 전략', '성장': '꾸준히 오르려면 — 훈련 계획·멘탈·프로 경기에서 배우기' };
  el.innerHTML = `<div class="guide-progress"><span>읽은 가이드 <b>${read}</b> / ${GUIDES.length}</span><div class="bar"><i style="width:${Math.round(read / GUIDES.length * 100)}%"></i></div><span>총 ${GUIDES.reduce((a, g) => a + g.min, 0)}분 분량</span></div>` +
    groups.map(gr => `<div class="guide-group">${gr} <span style="font-weight:600;letter-spacing:0;text-transform:none">· ${groupDesc[gr]}</span></div><div class="guide-grid">` +
      GUIDES.filter(g => g.group === gr).map(g => `<button class="guide-card ${state.guides[g.id] ? 'read' : ''}" onclick="openGuide('${g.id}')"><span class="gc-icon">${g.icon}</span><span><b>${g.title}</b><p>${g.sub}</p><small>약 ${g.min}분 · ${g.file.split('/').pop()}</small></span></button>`).join('') + '</div>').join('');
}
function openGuide(id, heading) {
  const g = (typeof GUIDES !== 'undefined' ? GUIDES : []).find(x => x.id === id); if (!g) return;
  if (currentSection !== 10) switchSection(10);
  currentGuide = id;
  document.getElementById('guide-index').hidden = true;
  const reader = document.getElementById('guide-reader'); reader.hidden = false;
  const body = document.getElementById('guide-body'); body.innerHTML = renderMarkdown(g.md);
  const i = GUIDES.indexOf(g);
  document.getElementById('guide-pos').textContent = `${g.icon} ${i + 1} / ${GUIDES.length} · 약 ${g.min}분`;
  document.getElementById('guide-prev').disabled = i === 0;
  document.getElementById('guide-next').textContent = i === GUIDES.length - 1 ? '목록으로' : '다음 가이드 →';
  const toc = document.getElementById('guide-toc');
  const hs = [...body.querySelectorAll('h2')];
  toc.innerHTML = hs.map(h => `<a onclick="document.getElementById('${h.id}').scrollIntoView({behavior:'smooth',block:'start'})">${h.textContent}</a>`).join('');
  toc.hidden = hs.length === 0;
  if (!state.guides[g.id]) { state.guides[g.id] = todayKey(); touchStudy(); saveState(); addXP(XP_RULES.guide || 10, `가이드 열람: ${g.title}`); }
  if (location.hash !== '#guides') history.pushState(null, '', '#guides');
  const target = heading && hs.find(h => h.textContent.trim() === heading);
  setTimeout(() => target ? target.scrollIntoView({ behavior: 'smooth', block: 'start' }) : window.scrollTo(0, 0), 30);
}
function closeGuide() { currentGuide = null; document.getElementById('guide-reader').hidden = true; document.getElementById('guide-index').hidden = false; renderGuideIndex(); window.scrollTo(0, 0); }
function stepGuide(d) {
  const i = GUIDES.findIndex(g => g.id === currentGuide); const n = i + d;
  if (n < 0) return; if (n >= GUIDES.length) { closeGuide(); return; }
  openGuide(GUIDES[n].id);
}
// 아주 작은 마크다운 렌더러 (제목·목록·코드펜스·표·인용·굵게·체크박스) — 외부 라이브러리 없음
function escHtml(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
// 가이드 본문의 영웅 이름(한글·영문)을 도감 상세 링크로 — 긴 이름부터 매칭, 영문은 단어 경계
let HERO_LINK_RE = null, HERO_LINK_MAP = null;
function linkHeroes(html) {
  if (!HERO_LINK_RE) {
    HERO_LINK_MAP = {}; const keys = [];
    heroes.forEach((h, i) => { [h.name, h.en].filter(Boolean).forEach(n => { HERO_LINK_MAP[n.toLowerCase()] = i; keys.push(n); }); });
    keys.sort((a, b) => b.length - a.length);
    const esc = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    HERO_LINK_RE = new RegExp('(?<![A-Za-z가-힣])(' + keys.map(esc).join('|') + ')(?![A-Za-z가-힣])', 'g');
  }
  return html.replace(HERO_LINK_RE, m => { const i = HERO_LINK_MAP[m.toLowerCase()]; return i === undefined ? m : `<a class="md-hero" onclick="openHero(${i})" title="${heroes[i].name} 도감 보기">${m}</a>`; });
}
function mdInline(t) {
  return linkHeroes(escHtml(t))
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function renderMarkdown(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = []; let i = 0, hn = 0;
  const isBlockStart = l => /^(#{1,4}\s|```|\||>|\s*([-*+]|\d+[.)])\s|\s*-{3,}\s*$)/.test(l);
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) { // 코드 펜스 — 닫는 펜스까지 그대로
      const buf = []; i++;
      // 원문에는 펜스 안에 또 ``` 가 끼어 있는 곳이 있어, 닫는 펜스는 "다음 내용이 일반 마크다운(제목·굵게·목록·표·구분선·문장)"일 때만 인정
      const closes = k => { let n = k + 1; while (n < lines.length && lines[n].trim() === '') n++; return n >= lines.length || /^(#{1,4}\s|\*\*|[-*+]\s|\d+[.)]\s|\||>|-{3,}\s*$|[가-힣A-Za-z"“(])/.test(lines[n]); };
      while (i < lines.length && !(/^```\s*$/.test(lines[i]) && closes(i))) { if (!/^```\s*$/.test(lines[i])) buf.push(lines[i]); i++; }
      i++; out.push('<pre><code>' + linkHeroes(escHtml(buf.join('\n'))) + '</code></pre>'); continue;
    }
    const h = l.match(/^(#{1,4})\s+(.+)/);
    if (h) { const lv = h[1].length; hn++; out.push(`<h${lv} id="gh-${hn}">${mdInline(h[2].replace(/\s+#+$/, ''))}</h${lv}>`); i++; continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body = rows.filter(r => !/^\|\s*:?-{2,}/.test(r));
      if (body.length) {
        out.push('<div class="tbl-wrap"><table><thead><tr>' + cells(body[0]).map(c => '<th>' + mdInline(c) + '</th>').join('') + '</tr></thead><tbody>' +
          body.slice(1).map(r => '<tr>' + cells(r).map(c => '<td>' + mdInline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>');
      }
      continue;
    }
    if (/^>/.test(l)) { const buf = []; while (i < lines.length && /^>/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; } out.push('<blockquote>' + mdInline(buf.join(' ')) + '</blockquote>'); continue; }
    const li = l.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)/);
    if (li) {
      const ordered = /\d/.test(li[2]); const items = []; let chk = false;
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)/);
        if (m) { const t = m[3]; const c = t.match(/^\[( |x|X)\]\s*(.*)/); if (c) { chk = true; items.push(`<li class="${c[1] !== ' ' ? 'on' : ''}">${mdInline(c[2])}</li>`); } else items.push('<li>' + mdInline(t) + '</li>'); i++; }
        else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, '<br>' + mdInline(lines[i].trim()) + '</li>'); i++; }
        else break;
      }
      out.push(`<${ordered ? 'ol' : 'ul'}${chk ? ' class="chk"' : ''}>` + items.join('') + `</${ordered ? 'ol' : 'ul'}>`); continue;
    }
    if (l.trim() === '') { i++; continue; }
    const buf = []; while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) { buf.push(lines[i]); i++; }
    if (buf.length) out.push('<p>' + mdInline(buf.join(' ')) + '</p>'); else i++;
  }
  return out.join('\n');
}

function buildSearchIndex() {
  const idx = [];
  heroes.forEach((h, i) => { const d = HERO_DETAILS[h.name] || {}; idx.push({ cat: '영웅', title: h.name, sub: `${roleLabel[h.role]} · ${h.tag}`, text: heroSearchText(h), go: () => { switchSection(6); openHero(i); } }); });
  GLOSSARY.forEach(g => idx.push({ cat: '용어', title: g.term, sub: g.def, text: normalize([g.term, ...(g.alias || []), g.def, g.use].join(' ')), go: () => searchGlossary(g.term) }));
  MAPS.forEach(m => idx.push({ cat: '맵', title: m.name, sub: MAP_MODES[m.mode] + ' · ' + m.mistake, text: normalize([m.name, m.en, MAP_MODES[m.mode], ...m.high, ...m.choke, m.main, ...m.side, m.atk, m.def, m.mistake].join(' ')), go: () => { switchSection(3); setTimeout(() => { const el = document.getElementById('map-list'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 60); } }));
  SITUATIONS.forEach(s => idx.push({ cat: '상황판단', title: s.title, sub: `${SITUATION_CATS[s.cat].label} · ${s.sub} · ${s.hero}`, text: normalize([s.title, s.sub, s.hero, ...s.team, ...s.enemy, ...s.facts, s.q, s.keyPoint, ...s.choices.map(c => c.t)].join(' ')), go: () => { switchSection(7); const tool = s.cat === 'side' ? 'side' : 'situations'; showTrainTool(tool, document.querySelector(`.subtab[data-tool="${tool}"]`)); if (tool === 'situations') { sitCat = 'all'; sitDiff = 'all'; sitRole = 'all'; sitHero = 'all'; renderSituationFilters(); renderSituations(false); } setTimeout(() => { const el = document.getElementById('sit-' + s.id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.classList.add('flash'); } }, 80); } }));
  // 전략 카드 (h3 제목 + 본문)
  document.querySelectorAll('.section').forEach((sec, si) => {
    if (si >= 7 && si !== 11) return;
    sec.querySelectorAll('.card').forEach(card => {
      const h = card.querySelector('h3'); if (!h || card.id === 'quiz-result') return;
      const title = h.textContent.trim();
      idx.push({ cat: '전략', title, sub: progressDots[si].textContent.trim(), text: normalize(card.textContent), go: () => { switchSection(si); setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); } });
    });
    sec.querySelectorAll('.quiz-container').forEach(qc => {
      const q = qc.querySelector('.quiz-question'); if (!q) return;
      idx.push({ cat: '퀴즈', title: q.textContent.replace('❓', '').trim(), sub: progressDots[si].textContent.trim(), text: normalize(qc.textContent), go: () => { switchSection(si); setTimeout(() => qc.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60); } });
    });
  });
  // 심화 가이드: 가이드 전체 + h2 소제목 단위
  (typeof GUIDES !== 'undefined' ? GUIDES : []).forEach(g => {
    idx.push({ cat: '가이드', title: g.title, sub: g.sub, text: normalize(g.title + ' ' + g.sub), go: () => openGuide(g.id) });
    let cur = null, buf = [];
    const flush = () => { if (cur) { const c = cur; idx.push({ cat: '가이드', title: c, sub: g.icon + ' ' + g.title, text: normalize(c + ' ' + buf.join(' ')), go: () => openGuide(g.id, c) }); } };
    g.md.split('\n').forEach(l => { const m = l.match(/^##\s+(.+)/); if (m) { flush(); cur = m[1].trim(); buf = []; } else if (cur) buf.push(l); });
    flush();
  });
  ['tank', 'dps', 'support'].forEach(r => idx.push({ cat: '역할', title: roleLabel[r], sub: '캐릭터 역할 파트', text: normalize(roleLabel[r] + ' 역할 ' + (r === 'tank' ? '탱커 돌격' : r === 'dps' ? '딜러 공격' : '힐러 지원')), go: () => switchSection(1) }));
  return idx;
}
let SEARCH_INDEX = null;
function runSearch(q) {
  const box = document.getElementById('search-results');
  const nq = normalize(q);
  if (nq.length < 1) { box.innerHTML = ''; return; }
  if (!SEARCH_INDEX) SEARCH_INDEX = buildSearchIndex();
  const hits = SEARCH_INDEX.filter(e => e.text.includes(nq) || normalize(e.title).includes(nq));
  if (!hits.length) { box.innerHTML = '<div class="hero-empty">검색 결과가 없습니다.</div>'; return; }
  const groups = {}; hits.forEach(h => { (groups[h.cat] = groups[h.cat] || []).push(h); });
  const order = ['영웅', '용어', '전략', '상황판단', '맵', '퀴즈', '역할'];
  box.innerHTML = `<div class="search-summary">${order.filter(c => groups[c]).map(c => `<span class="pill">${c} ${groups[c].length}개</span>`).join('')}</div>` +
    order.filter(c => groups[c]).map(c => `<div class="search-group"><h4>${c} <small>${groups[c].length}</small></h4>${groups[c].slice(0, 8).map(h => { const id = SEARCH_INDEX.indexOf(h); return `<button class="search-item" onclick="goSearch(${id})"><strong>${hl(h.title, q)}</strong><small>${hl(h.sub.slice(0, 90), q)}</small></button>`; }).join('')}${groups[c].length > 8 ? `<small class="fig-muted">외 ${groups[c].length - 8}개</small>` : ''}</div>`).join('');
}
function goSearch(id) { closeModal('search-modal'); SEARCH_INDEX[id].go(); }

// ---------- 코치 응답 (AI 연결용 진입점, 현재는 로컬) ----------
function getCoachResponse(question) {
  // 향후 API 연결 시 이 함수만 교체하면 됩니다. 현재는 검색 인덱스 기반 응답.
  if (!SEARCH_INDEX) SEARCH_INDEX = buildSearchIndex();
  const nq = normalize(question);
  return SEARCH_INDEX.filter(e => e.text.includes(nq)).slice(0, 3).map(e => `${e.cat}: ${e.title}`);
}

// ---------- 테마 ----------
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const icon = document.getElementById('theme-icon');
  const dark = document.body.classList.contains('dark-mode');
  icon.textContent = dark ? '☀️' : '🌙';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

// ---------- 초기화 ----------
window.addEventListener('DOMContentLoaded', () => {
  sections = document.querySelectorAll('.section');
  progressDots = Array.from(document.querySelectorAll('.nav-tab[data-index]:not(.nav-dup)')).sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('theme-icon').textContent = '☀️';
  }
  loadState();
  setMode(state.mode || 'normal', true);
  renderHeroes();
  applyHeroFilter();
  initQuizCounters();
  addQuizMapLinks();
  labelTableCells();
  renderLevel();
  renderDaily();
  renderMaps();
  renderStyleQuiz();
  renderSituationFilters();
  renderSituations(false);
  renderSituations(true);
  advisorTouched = true; renderAdvisor(); runAdvisor(); advisorTouched = false; // 첫 자동 실행은 XP 없음
  renderGlossary('');
  // 저장된 답안 복원
  Object.entries(state.answers).forEach(([i, a]) => { if (quizAnswers[i]) checkAnswer(Number(i), a, true); });
  const fromHash = sectionFromHash();
  switchSection(fromHash !== null ? fromHash : Math.min(state.section || 0, SECTION_COUNT - 1), { noHash: fromHash === null });
  try { const gq = new URLSearchParams(location.search).get('guide'); if (gq) openGuide(gq); } catch (e) {}
  // 키보드: 탭 좌우 이동, ESC로 모달 닫기, / 로 검색
  document.querySelector('.nav-groups').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); switchSection(currentSection + (e.key === 'ArrowRight' ? 1 : -1)); progressDots[currentSection].focus(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { document.querySelectorAll('.modal:not([hidden])').forEach(m => closeModal(m.id)); closeSheet(); }
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });
  // 맨 위로 버튼 · 히어로 통계
  const toTop = document.getElementById('to-top');
  if (toTop) window.addEventListener('scroll', () => toTop.classList.toggle('show', window.scrollY > 600), { passive: true });
  if (typeof renderLessonHeads === 'function') { renderLessonHeads(); renderProMindset(); renderHomeProgress(); }
  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setTxt('hb-heroes', heroes.length); setTxt('hb-sits', SITUATIONS.length); setTxt('hb-quiz', TOTAL_QUIZ); setTxt('hb-gl', GLOSSARY.length); setTxt('hf-sits', SITUATIONS.length + '문제');
  window.addEventListener('hashchange', () => { let i = sectionFromHash(); if (i === null && location.hash === '') i = 0; if (i !== null && i !== currentSection) switchSection(i, { noHash: true }); if (typeof closeSheet === 'function') closeSheet(); });
});
