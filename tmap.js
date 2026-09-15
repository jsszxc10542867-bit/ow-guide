/* =====================================================================
   MapViewer — 실제 오버헤드 맵 이미지 + SVG 전술 오버레이 (tmap.js)
   데이터: data/maps/registry.js (맵 목록·이미지·출처), data/maps/<id>.js (전술 데이터, 0~1 정규화 좌표),
          data/map-situations.js (상황·레이어·규칙)
   이미지 출처: StatBanana (https://overwatch.statbanana.com/images) — 무료 저작물 사용 조건, 로고 유지 + 출처 표기
   AI·서버 호출 없음. 현재 선택된 맵 이미지만 로딩합니다.
   ===================================================================== */
const TM = {
  mapId: null, role: 'all', hero: 'all', sit: 'basic', layers: {}, detail: false,
  selected: null, view: { s: 1, x: 0, y: 0 }, memory: null, quiz: null, inited: false, mode: 'view'
};
const TM_XP = { study: 10, advisor: 20, memory: 15, quiz: 20 };
const TM_ROUTE_META = { newbie: { label: '기본 루트', color: '#22a06b' }, side: { label: '초보자 사이드', color: '#2f80ed' }, flank: { label: '고급 플랭크', color: '#e0363f' } };
const TM_POS_COLOR = { main: '#22a06b', side: '#2f80ed', safe: '#22a06b', defense: '#8c52ff', retreat: '#e0a300', retake: '#e0a300' };

function tmReg(id) { return MAP_REGISTRY.find(m => m.id === (id || TM.mapId)); }
function tmMap() { return TACTICAL_MAPS[TM.mapId]; }
function tmW() { return tmReg().width || 1000; }
function tmH() { return tmReg().height || 1000; }
function X(v) { return v * tmW(); }
function Y(v) { return v * tmH(); }
function tmState() {
  if (!state.tmap || typeof state.tmap !== 'object') state.tmap = {};
  ['studied', 'memory', 'quiz', 'advisor'].forEach(k => { if (!state.tmap[k]) state.tmap[k] = {}; });
  return state.tmap;
}

// ---------- 초기화 ----------
function tmInit() {
  if (TM.inited) return;
  TM.inited = true;
  MAP_LAYERS.forEach(l => TM.layers[l.key] = l.basic);
  const sel = document.getElementById('tm-map-select');
  sel.innerHTML = MAP_REGISTRY.map(m => `<option value="${m.id}" ${!m.image ? 'disabled' : ''}>${m.name} (${m.en})${m.image ? '' : ' — 준비 중'}</option>`).join('');
  document.getElementById('tm-sits').innerHTML = MAP_SITUATIONS.map(s => `<button class="filter-btn" data-sit="${s.key}" aria-pressed="false" title="${s.desc}" onclick="tmSetSit('${s.key}')">${s.icon} ${s.label}</button>`).join('');
  tmRenderLayerToggles();
  tmRenderAdvisorForm();
  tmRenderSideJudgeForm();
  tmBindViewport();
  const first = MAP_REGISTRY.find(m => m.image && TACTICAL_MAPS[m.id]);
  tmSelectMap(first ? first.id : MAP_REGISTRY[0].id, true);
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('map') && TACTICAL_MAPS[q.get('map')]) tmSelectMap(q.get('map'), true);
    if (q.get('sit')) tmSetSit(q.get('sit'));
    if (q.get('hero') && tmHeroInMap(q.get('hero'))) tmSetHero(q.get('hero'));
    if (q.get('pos')) tmSelect('position', q.get('pos'));
    if (q.get('detail') === '1' && !TM.detail) tmToggleDetail();
  } catch (e) {}
}
function tmRenderLayerToggles() {
  document.getElementById('tm-layers').innerHTML = MAP_LAYERS.map(l => `<label class="tm-layer"><input type="checkbox" data-layer="${l.key}" ${TM.layers[l.key] ? 'checked' : ''} onchange="tmToggleLayer('${l.key}', this.checked)"> ${l.icon} ${l.label}</label>`).join('');
}
function tmRenderHeroSelect() {
  const map = tmMap(); const used = new Set();
  if (map) { map.positions.forEach(p => p.heroes.forEach(h => used.add(h))); map.routes.forEach(r => r.heroes.forEach(h => used.add(h))); }
  const list = heroes.filter(h => used.has(h.name) && (TM.role === 'all' || h.role === TM.role));
  const sel = document.getElementById('tm-hero-select');
  sel.innerHTML = `<option value="all">전체 영웅</option>` + list.map(h => `<option value="${h.name}">${h.name} (${roleLabel[h.role]})</option>`).join('');
  sel.value = TM.hero === 'all' || !list.some(h => h.name === TM.hero) ? 'all' : TM.hero;
}

// ---------- 맵 선택 ----------
function tmSelectMap(id, silent) {
  TM.mapId = id; TM.selected = null; TM.memory = null; TM.quiz = null; TM.mode = 'view';
  const reg = tmReg(); const map = tmMap();
  document.getElementById('tm-map-select').value = id;
  const ready = !!(reg.image && map);
  document.getElementById('tm-viewer').hidden = !ready;
  document.getElementById('tm-placeholder').hidden = ready;
  document.getElementById('tm-title').textContent = `${reg.name} · ${MAP_MODES[reg.mode] || reg.mode}`;
  if (!ready) {
    document.getElementById('tm-placeholder').innerHTML = `<div class="tm-empty"><div class="tm-empty-icon">🗺️</div><p><strong>${reg.name} — 준비 중</strong></p><p class="fig-muted">이 맵은 아직 실제 오버헤드 이미지와 전술 데이터가 없습니다. 가짜 지도는 표시하지 않습니다.<br>추가 방법: <code>assets/maps/${reg.id}/${reg.id}-overhead.png</code> 저장 → <code>data/maps/registry.js</code>에 image 지정 → <code>data/maps/${reg.id}.js</code> 작성</p></div>`;
    document.getElementById('tm-intro').textContent = '';
    document.getElementById('tm-keypoints').innerHTML = '';
    document.getElementById('tm-detail').innerHTML = '';
    return;
  }
  const st = tmState();
  if (!st.studied[id]) { st.studied[id] = todayKey(); if (!silent) addXP(TM_XP.study, `${map.name} 지도 학습`); else saveState(); }
  if (TM.hero !== 'all' && !tmHeroInMap(TM.hero)) TM.hero = 'all';
  // 이미지: 현재 맵만 로딩 (lazy)
  const img = document.getElementById('tm-img');
  if (img.getAttribute('src') !== reg.image) { img.src = reg.image; img.alt = `${map.name} 오버헤드 맵 (StatBanana)`; }
  document.getElementById('tm-stage').style.aspectRatio = `${reg.width} / ${reg.height}`;
  document.getElementById('tm-svg').setAttribute('viewBox', `0 0 ${reg.width} ${reg.height}`);
  document.getElementById('tm-attribution').innerHTML = `${reg.attribution.replace('https://statbanana.com/', '<a href="https://statbanana.com/" target="_blank" rel="noopener">StatBanana</a>')} · <a href="${reg.source}" target="_blank" rel="noopener">overwatch.statbanana.com/images</a><br><small>Map imagery provided by StatBanana. Tactical annotations are created for this guide.</small>`;
  tmRenderHeroSelect();
  tmSetSit(TM.sit, true);
  tmResetView();
  tmRender();
  tmRenderKeyPoints();
  tmRenderDetail();
  tmRenderQuizStatus();
  document.getElementById('tm-quiz-body').innerHTML = '';
}
function tmHeroInMap(name) { const m = tmMap(); return !!m && (m.positions.some(p => p.heroes.includes(name)) || m.routes.some(r => r.heroes.includes(name))); }
function tmSetRole(role, btn) {
  TM.role = role;
  document.querySelectorAll('#tm-roles .filter-btn').forEach(b => { const on = b.dataset.role === role; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  if (TM.hero !== 'all') { const h = heroes.find(x => x.name === TM.hero); if (h && role !== 'all' && h.role !== role) TM.hero = 'all'; }
  tmRenderHeroSelect(); tmApplyFilter();
}
function tmSetHero(name) { TM.hero = name; tmRenderHeroSelect(); tmApplyFilter(); }
function tmSetSit(key, silent) {
  TM.sit = key;
  document.querySelectorAll('#tm-sits .filter-btn').forEach(b => { const on = b.dataset.sit === key; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  const meta = MAP_SITUATIONS.find(s => s.key === key);
  const el = document.getElementById('tm-sit-desc'); if (el) el.textContent = meta ? `${meta.icon} ${meta.label}: ${meta.desc}` : '';
  if (!silent) tmApplyFilter();
}
function tmToggleLayer(key, on) { TM.layers[key] = on; tmApplyLayers(); }
function tmToggleDetail() {
  TM.detail = !TM.detail;
  MAP_LAYERS.forEach(l => { if (!l.basic) TM.layers[l.key] = TM.detail; });
  tmRenderLayerToggles(); tmApplyLayers();
  const b = document.getElementById('tm-detail-btn'); b.textContent = TM.detail ? '🔽 기본 정보만' : '🔎 상세 정보'; b.setAttribute('aria-pressed', TM.detail);
}

// ---------- 매칭 ----------
function heroRoleOf(name) { const h = heroes.find(x => x.name === name); return h ? h.role : null; }
function tmHeroOk(obj) { return TM.hero === 'all' || !obj.heroes || (obj.heroes.length === 0 && (obj.roles || []).includes(heroRoleOf(TM.hero))) || (obj.heroes || []).includes(TM.hero); }
function tmMatch(obj) {
  const roleOk = TM.role === 'all' || !obj.roles || obj.roles.includes(TM.role) || obj.roles.includes('all');
  const sitOk = !obj.situations || obj.situations.includes(TM.sit);
  const hide = (SITUATION_HIDE_TAGS[TM.sit] || []).some(t => (obj.tags || []).includes(t));
  return roleOk && tmHeroOk(obj) && sitOk && !hide;
}
function tmApplyFilter() {
  const svg = document.getElementById('tm-svg'); const map = tmMap(); if (!svg || !map) return;
  const hideTags = SITUATION_HIDE_TAGS[TM.sit] || [];
  svg.querySelectorAll('[data-kind]').forEach(el => {
    const obj = tmFind(el.dataset.kind, el.dataset.id); if (!obj) return;
    const k = el.dataset.kind;
    if (k === 'position' || k === 'route' || k === 'high' || k === 'sight') {
      const m = tmMatch(obj);
      el.classList.toggle('tm-dim', !m);
      const hiddenBySit = hideTags.some(t => (obj.tags || []).includes(t));
      el.classList.toggle('tm-hide', (TM.hero !== 'all' && !tmHeroOk(obj)) || (k === 'position' && hiddenBySit));
    }
  });
  const n = map.positions.filter(tmMatch).length;
  document.getElementById('tm-count').textContent = `조건에 맞는 포지션 ${n}개 · 마커를 누르면 설명이 열립니다`;
}
function tmApplyLayers() {
  const svg = document.getElementById('tm-svg'); if (!svg) return;
  MAP_LAYERS.forEach(l => { const g = svg.querySelector(`[data-layer="${l.key}"]`); if (g) g.classList.toggle('tm-hide', !TM.layers[l.key]); });
}
function tmFind(kind, id) {
  const m = tmMap(); if (!m) return null;
  const src = { position: m.positions, route: m.routes, high: m.highgrounds, danger: m.dangers, cover: m.covers, pack: m.packs, fight: m.fights, sight: m.sightlines }[kind] || [];
  return src.find(o => o.id === id);
}

// ---------- 렌더 (SVG 오버레이) ----------
function tmPts(points) { return points.map(([x, y]) => `${X(x)},${Y(y)}`).join(' '); }
function tmRender() {
  const m = tmMap(); const W = tmW();
  const u = W / 1000; // 1000px 기준 스케일
  const spawns = m.spawns.map(s => `<g class="tm-spawn ${s.team}"><rect x="${X(s.x) - 34 * u}" y="${Y(s.y) - 12 * u}" width="${68 * u}" height="${24 * u}" rx="${6 * u}"/><text x="${X(s.x)}" y="${Y(s.y) + 4.5 * u}" font-size="${12 * u}">${s.label}</text></g>`).join('');
  const objs = m.objectives.map(o => o.type === 'cart'
    ? `<polyline points="${tmPts(o.points)}" class="tm-cart" stroke-width="${5 * u}"/>`
    : `<g class="tm-point"><circle cx="${X(o.x)}" cy="${Y(o.y)}" r="${26 * u}" stroke-width="${3 * u}"/><circle cx="${X(o.x)}" cy="${Y(o.y)}" r="${9 * u}"/><text x="${X(o.x)}" y="${Y(o.y) - 32 * u}" font-size="${14 * u}" class="tm-label">${o.label}</text></g>`).join('');
  const highs = m.highgrounds.map(h => `<g class="tm-high" data-kind="high" data-id="${h.id}" tabindex="0" role="button" aria-label="고지대 ${h.label}" onclick="tmSelect('high','${h.id}')" onkeydown="tmKey(event,'high','${h.id}')"><polygon points="${tmPts(h.points)}" stroke-width="${2.5 * u}"/><text x="${X(h.points[0][0]) + 6 * u}" y="${Y(h.points[0][1]) + 16 * u}" font-size="${11 * u}">HIGH GROUND</text><title>🟣 ${h.label}</title></g>`).join('');
  const dangers = m.dangers.map(d => `<polygon points="${tmPts(d.points)}" class="tm-danger" data-kind="danger" data-id="${d.id}" tabindex="0" role="button" aria-label="위험 지역 ${d.label}" stroke-width="${2 * u}" onclick="tmSelect('danger','${d.id}')" onkeydown="tmKey(event,'danger','${d.id}')"><title>🔴 ${d.label}</title></polygon>`).join('');
  const sights = (m.sightlines || []).map(l => `<g class="tm-sight" data-kind="sight" data-id="${l.id}" onclick="tmSelect('sight','${l.id}')"><line x1="${X(l.from.x)}" y1="${Y(l.from.y)}" x2="${X(l.to.x)}" y2="${Y(l.to.y)}" stroke-width="${2 * u}" marker-end="url(#tm-arrow-sight)"/><title>👁️ ${l.label}</title></g>`).join('');
  const covers = m.covers.map(c => `<g class="tm-cover" data-kind="cover" data-id="${c.id}" onclick="tmSelect('cover','${c.id}')"><rect x="${X(c.x) - 7 * u}" y="${Y(c.y) - 7 * u}" width="${14 * u}" height="${14 * u}" rx="${2 * u}" stroke-width="${1.5 * u}"/><title>⚪ ${c.label}</title></g>`).join('');
  const packs = m.packs.map(p => `<g class="tm-pack" data-kind="pack" data-id="${p.id}" onclick="tmSelect('pack','${p.id}')"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${(p.size === 'big' ? 10 : 7.5) * u}" stroke-width="${1.5 * u}"/><text x="${X(p.x)}" y="${Y(p.y) + 4.5 * u}" font-size="${13 * u}">+</text><title>💚 ${p.label}</title></g>`).join('');
  const fights = m.fights.map(f => `<g class="tm-fight" data-kind="fight" data-id="${f.id}" onclick="tmSelect('fight','${f.id}')"><circle cx="${X(f.x)}" cy="${Y(f.y)}" r="${X(f.r)}" stroke-width="${2 * u}"/><text x="${X(f.x)}" y="${Y(f.y) - X(f.r) - 6 * u}" font-size="${12 * u}">🎯 ${f.label}</text><title>🎯 ${f.label}</title></g>`).join('');
  const routes = m.routes.map(r => {
    const pts = tmPts(r.points);
    return `<g class="tm-route lv-${r.level}" data-kind="route" data-id="${r.id}" tabindex="0" role="button" aria-label="${r.title}" onclick="tmSelect('route','${r.id}')" onkeydown="tmKey(event,'route','${r.id}')">
      <polyline points="${pts}" class="tm-route-hit" stroke-width="${24 * u}"/>
      <polyline points="${pts}" class="tm-route-glow" stroke-width="${9 * u}"/>
      <polyline points="${pts}" class="tm-route-line" stroke-width="${4.5 * u}" marker-end="url(#tm-arrow-${r.level})"/>
      <circle cx="${X(r.points[0][0])}" cy="${Y(r.points[0][1])}" r="${5 * u}" class="tm-route-start" stroke-width="${2 * u}"/><title>${r.title}</title></g>`;
  }).join('');
  const positions = m.positions.map(p => {
    const ic = { tank: '탱', dps: '딜', support: '힐' };
    const roleTxt = p.roles.length === 1 ? ic[p.roles[0]] : '★';
    return `<g class="tm-pos t-${p.type}" data-kind="position" data-id="${p.id}" tabindex="0" role="button" aria-label="${POSITION_TYPES[p.type] || ''} ${p.title}" onclick="tmSelect('position','${p.id}')" onkeydown="tmKey(event,'position','${p.id}')">
      <circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${20 * u}" class="tm-pos-ring" stroke-width="${3 * u}"/>
      <circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${13 * u}" class="tm-pos-dot" stroke-width="${2.5 * u}" style="fill:${TM_POS_COLOR[p.type] || '#22a06b'}"/>
      <text x="${X(p.x)}" y="${Y(p.y) + 4.5 * u}" class="tm-pos-txt" font-size="${11 * u}">${roleTxt}</text>
      <text x="${X(p.x)}" y="${Y(p.y) - 18 * u}" class="tm-pos-label" font-size="${11 * u}">${p.title.split(' (')[0]}</text><title>${p.title}</title></g>`;
  }).join('');
  document.getElementById('tm-svg').innerHTML = `
    <defs>
      <pattern id="tm-hatch" width="${8 * u}" height="${8 * u}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="${8 * u}" stroke="#e0363f" stroke-width="${2.5 * u}" opacity=".75"/></pattern>
      ${Object.entries(TM_ROUTE_META).map(([k, v]) => `<marker id="tm-arrow-${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10z" fill="${v.color}"/></marker>`).join('')}
      <marker id="tm-arrow-sight" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10z" fill="#ffd166"/></marker>
    </defs>
    <g class="tm-base">${objs}${spawns}</g>
    <g data-layer="dangers">${dangers}</g>
    <g data-layer="highs">${highs}</g>
    <g data-layer="fights">${fights}</g>
    <g data-layer="sightlines">${sights}</g>
    <g data-layer="covers">${covers}</g>
    <g data-layer="packs">${packs}</g>
    <g data-layer="routes">${routes}</g>
    <g data-layer="positions">${positions}</g>
    <g id="tm-overlay"></g>`;
  tmApplyLayers(); tmApplyFilter();
  document.getElementById('tm-intro').textContent = m.intro;
}
function tmKey(e, kind, id) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tmSelect(kind, id); } }
function tmRenderKeyPoints() {
  const m = tmMap();
  document.getElementById('tm-keypoints').innerHTML = `<div class="tip-box coach-note" style="margin:0"><div class="tip-title">💡 ${m.name} — 이것만 기억하세요</div><div class="tip-content"><ol class="steps" style="margin:.3rem 0 0">${m.keyPoints.map(k => `<li>${k}</li>`).join('')}</ol></div></div>`;
}

// ---------- 선택 & 상세 ----------
function tmSelect(kind, id) {
  if (TM.mode === 'memory' || TM.mode === 'quiz') return;
  TM.selected = { kind, id };
  document.querySelectorAll('#tm-svg .tm-selected').forEach(el => el.classList.remove('tm-selected'));
  const el = document.querySelector(`#tm-svg [data-kind="${kind}"][data-id="${id}"]`); if (el) el.classList.add('tm-selected');
  tmRenderDetail();
  if (window.innerWidth < 900) document.getElementById('tm-detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function tmStars(score) {
  const avg = (score.survive + score.angle + score.team + score.escape + score.pressure) / 5 / 2;
  const full = Math.floor(avg), half = avg - full >= 0.5;
  return { text: '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(5 - full - (half ? 1 : 0)), num: avg.toFixed(1) };
}
function tmScoreBar(label, v) { return `<div class="result-cat"><span>${label}</span><div class="mini-bar"><div class="mini-fill ${v >= 8 ? 'good' : v >= 5 ? 'mixed' : 'bad'}" style="width:${v * 10}%"></div></div><b>${v}/10</b><small></small></div>`; }
function tmHeroPills(list) { return list && list.length ? list.map(n => heroes.some(h => h.name === n) ? `<button class="pill pill-btn" onclick="tmSetHero('${n}')">${n}</button>` : `<span class="pill">${n}</span>`).join('') : '<span class="fig-muted">역할 전체</span>'; }
function tmRolePills(roles) { return (roles || []).map(r => r === 'all' ? '<span class="pill">모든 역할</span>' : `<span class="pill">${{ tank: '🛡️ 돌격', dps: '⚔️ 공격', support: '💚 지원' }[r]}</span>`).join(''); }
function tmVerifyNote(o) { return o.verified === false ? `<p class="tm-verify">📌 좌표는 오버헤드 이미지를 보고 배치했습니다. 인게임과 다르면 <code>data/maps/${TM.mapId}.js</code>의 <code>${o.id}</code> 좌표를 보정해 주세요.</p>` : ''; }
function tmRenderDetail() {
  const box = document.getElementById('tm-detail'); if (!tmMap()) return;
  if (!TM.selected) {
    box.innerHTML = `<div class="tm-empty"><div class="tm-empty-icon">🗺️</div><p><strong>지도의 마커를 눌러 보세요.</strong></p><p class="fig-muted">🟢 포지션 · 🔵 사이드 루트 · 🟣 고지 · 🔴 위험 지역을 누르면 <b>어디 · 왜 · 언제 · 무엇을 노림 · 언제 빠짐</b>을 알려 드립니다.</p><p class="fig-muted" style="font-size:.82rem">먼저 위의 <b>🤔 지금 어디에 있어야 하지?</b>로 추천 위치부터 보셔도 됩니다.</p></div>`;
    return;
  }
  const { kind, id } = TM.selected; const o = tmFind(kind, id); if (!o) return;
  if (kind === 'position') {
    const st = tmStars(o.score);
    const sits = o.situations.map(s => MAP_SITUATIONS.find(x => x.key === s)).filter(Boolean).map(s => `<span class="diff-badge">${s.icon} ${s.label}</span>`).join(' ');
    box.innerHTML = `
      <div class="tm-d-head" style="border-color:${TM_POS_COLOR[o.type]}"><span class="tm-d-kicker">${POSITION_TYPES[o.type] || '포지션'}</span><h3>${o.title}</h3><div class="tm-d-tags">${tmRolePills(o.roles)} ${o.tags.map(t => `<span class="pill tiny">${TAG_LABEL[t] || t}</span>`).join('')}</div></div>
      <div class="tm-d-heroes"><h5>추천 영웅</h5><div class="hm-tags">${tmHeroPills(o.heroes)}</div></div>
      <div class="tm-d-cols">
        <div class="why-box"><h5>👍 장점</h5><ul>${(o.advantages || o.good).map(g => `<li>${g}</li>`).join('')}</ul></div>
        <div class="why-box"><h5>⚠️ 주의</h5><ul>${(o.risks || o.bad).map(g => `<li>${g}</li>`).join('')}</ul></div>
      </div>
      <ul class="kv small tm-formula">
        <li><span>📍 어디?</span><strong>${o.where}</strong></li>
        <li><span>❓ 왜?</span><strong>${o.why}</strong>${o.whyAdv ? `<br><small>🔬 심화: ${o.whyAdv}</small>` : ''}</li>
        <li><span>⏱️ 언제 사용?</span><strong>${o.when}</strong></li>
        <li><span>🎯 무엇을 노림?</span><strong>${o.target}</strong></li>
        <li><span>🏃 언제 빠짐?</span><strong>${o.leave}</strong></li>
      </ul>
      <div class="tm-d-cols">
        <div class="why-box"><h5>🟢 좋은 상황</h5><ul>${o.good.map(g => `<li>${g}</li>`).join('')}</ul></div>
        <div class="why-box"><h5>🔴 나쁜 상황</h5><ul>${o.bad.map(g => `<li>${g}</li>`).join('')}</ul></div>
      </div>
      <div class="tm-d-sits"><h5>적용 상황</h5>${sits}</div>
      <div class="tm-score"><h5>포지션 점수 <span class="tm-stars">${st.text} ${st.num} / 5</span></h5>
        <div class="result-cats">${tmScoreBar('생존성', o.score.survive)}${tmScoreBar('딜각', o.score.angle)}${tmScoreBar('팀 연계', o.score.team)}${tmScoreBar('탈출 가능성', o.score.escape)}${tmScoreBar('압박 능력', o.score.pressure)}</div></div>
      <div class="tip-box coach-note" style="margin-bottom:0"><div class="tip-title">⚠️ 주의</div><div class="tip-content">${o.caution}</div></div>${tmVerifyNote(o)}`;
  } else if (kind === 'route') {
    const meta = TM_ROUTE_META[o.level];
    box.innerHTML = `
      <div class="tm-d-head" style="border-color:${meta.color}"><span class="tm-d-kicker" style="color:${meta.color}">${o.level === 'newbie' ? '🟢' : o.level === 'side' ? '🔵' : '🔴'} ${meta.label}</span><h3>${o.title}</h3><div class="tm-d-tags">${tmRolePills(o.roles)}</div></div>
      <div class="tm-route-steps">
        <div class="tm-step"><span>출발</span><strong>${o.from}</strong></div><div class="tm-arrow">↓</div>
        <div class="tm-step"><span>중간</span><strong>${o.via}</strong></div><div class="tm-arrow">↓</div>
        <div class="tm-step"><span>도착</span><strong>${o.to}</strong></div>
      </div>
      <ul class="kv small tm-formula">
        <li><span>🎯 목적</span><strong>${o.purpose}</strong></li>
        <li><span>✅ 언제 사용?</span><strong>${o.useWhen}</strong></li>
        <li><span>⛔ 언제 안 됨?</span><strong>${o.avoidWhen}</strong></li>
        <li><span>📋 필요 조건</span><strong>${(o.needs || []).join(' · ')}</strong></li>
        <li><span>🏃 탈출 방법</span><strong>${o.escape}</strong></li>
        <li><span>📏 본대와 거리</span><strong>${o.distance}</strong></li>
      </ul>
      <div class="tm-d-heroes"><h5>추천 영웅</h5><div class="hm-tags">${tmHeroPills(o.heroes)}</div></div>
      <div class="tip-box coach-note" style="margin-bottom:0"><div class="tip-title">${o.level === 'newbie' ? '⚠️ 주의' : '🧭 사이드는 목적이 아니라 수단입니다'}</div><div class="tip-content">${o.caution}${o.level !== 'newbie' ? '<br><small><b>좋은 조건:</b> 본대 안정 · 적이 본대를 봄 · 탈출 가능 · 시선 분산이 팀에 도움 / <b>나쁜 조건:</b> 우리 탱커 위험 · 수적 열세 · 혼자 고립 · 적이 이미 사이드를 봄</small>' : ''}</div></div>${tmVerifyNote(o)}`;
  } else if (kind === 'high') {
    box.innerHTML = `
      <div class="tm-d-head" style="border-color:#8c52ff"><span class="tm-d-kicker">🟣 HIGH GROUND</span><h3>${o.label}</h3><div class="tm-d-tags">${tmRolePills(o.roles)}</div></div>
      <ul class="kv small tm-formula">
        <li><span>❓ 왜 중요?</span><strong>${o.why}</strong></li>
        <li><span>👤 누가?</span><strong>${o.who}</strong></li>
        <li><span>⏱️ 언제?</span><strong>${o.when}</strong></li>
        <li><span>🪜 어떻게 진입?</span><strong>${o.how}</strong></li>
        <li><span>🔀 누가 견제?</span><strong>${o.counter}</strong></li>
      </ul>
      <div class="tm-d-cols"><div class="why-box"><h5>장점</h5><ul>${o.pros.map(x => `<li>${x}</li>`).join('')}</ul></div><div class="why-box"><h5>단점</h5><ul>${o.cons.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
      <div class="tm-d-heroes"><h5>추천 영웅</h5><div class="hm-tags">${tmHeroPills(o.heroes)}</div></div>
      <div class="tip-box coach-note" style="margin-bottom:0"><div class="tip-title">⚠️ 주의</div><div class="tip-content">${o.caution}</div></div>${tmVerifyNote(o)}`;
  } else if (kind === 'danger') {
    box.innerHTML = `<div class="tm-d-head" style="border-color:#e0363f"><span class="tm-d-kicker">🔴 위험 지역</span><h3>${o.label}</h3></div><p class="tm-d-p">${o.why}</p>${tmVerifyNote(o)}`;
  } else if (kind === 'sight') {
    const from = tmFind('position', o.fromId);
    box.innerHTML = `<div class="tm-d-head" style="border-color:#ffd166"><span class="tm-d-kicker">👁️ 시야각</span><h3>${o.label}</h3></div><p class="tm-d-p">이 방향으로 적 진입로가 보입니다. ${from ? `출발 포지션: <button class="pill pill-btn" onclick="tmSelect('position','${from.id}')">${from.title}</button>` : ''}</p><p class="tm-d-p">반대로, 이 선 위에 서 있는 아군은 그 포지션에서 보인다는 뜻입니다. 적이 그 자리를 잡았다면 이 선을 피하세요.</p>`;
  } else if (kind === 'fight') {
    box.innerHTML = `<div class="tm-d-head" style="border-color:#f99e1a"><span class="tm-d-kicker">🎯 주요 교전 지역</span><h3>${o.label}</h3></div><p class="tm-d-p">${o.note}</p>`;
  } else if (kind === 'pack') {
    box.innerHTML = `<div class="tm-d-head" style="border-color:#2fae6c"><span class="tm-d-kicker">💚 힐팩</span><h3>${o.label}</h3></div><p class="tm-d-p">${o.size === 'big' ? '큰 팩 250 · 약 15초마다 리스폰. 체력이 없을 때 힐러를 찾는 것보다 빠를 때가 많습니다.' : '작은 팩 75 · 약 10초마다 리스폰.'}</p>${tmVerifyNote(o)}`;
  } else if (kind === 'cover') {
    box.innerHTML = `<div class="tm-d-head" style="border-color:var(--text-3)"><span class="tm-d-kicker">⚪ 엄폐물</span><h3>${o.label}</h3></div><p class="tm-d-p">좋은 자리 = "쏘고 → 한 발 뒤로 → 안 보임". 이 엄폐물 옆에 서면 그것이 됩니다.</p>${tmVerifyNote(o)}`;
  }
}

// ---------- 뷰포트 (줌/이동: CSS transform, 이미지와 SVG가 함께 움직임) ----------
const TM_ZOOM = { min: 1, max: 6 };
function tmApplyView() {
  const stage = document.getElementById('tm-stage'); if (!stage) return;
  const v = TM.view;
  stage.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
  document.getElementById('tm-viewer').classList.toggle('zoomed', v.s > 1.01);
}
function tmClamp() {
  const vp = document.getElementById('tm-viewport'); const v = TM.view;
  v.s = Math.min(TM_ZOOM.max, Math.max(TM_ZOOM.min, v.s));
  const w = vp.clientWidth, h = vp.clientHeight;
  v.x = Math.min(0, Math.max(w - w * v.s, v.x)); v.y = Math.min(0, Math.max(h - h * v.s, v.y));
}
function tmZoom(factor, cx, cy) {
  const vp = document.getElementById('tm-viewport'); const v = TM.view;
  if (cx === undefined) { cx = vp.clientWidth / 2; cy = vp.clientHeight / 2; }
  const ns = Math.min(TM_ZOOM.max, Math.max(TM_ZOOM.min, v.s * factor)); const k = ns / v.s;
  v.x = cx - (cx - v.x) * k; v.y = cy - (cy - v.y) * k; v.s = ns;
  tmClamp(); tmApplyView();
}
function tmResetView() { TM.view = { s: 1, x: 0, y: 0 }; tmApplyView(); }
function tmImgPoint(clientX, clientY) {
  const r = document.getElementById('tm-stage').getBoundingClientRect();
  return { x: (clientX - r.left) / r.width, y: (clientY - r.top) / r.height };   // 0~1 정규화
}
function tmBindViewport() {
  const vp = document.getElementById('tm-viewport'); if (!vp) return;
  const ptrs = new Map(); let dragging = false, moved = false, pinchDist = 0, last = null;
  vp.addEventListener('wheel', e => { e.preventDefault(); const r = vp.getBoundingClientRect(); tmZoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  vp.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) { dragging = true; moved = false; last = { x: e.clientX, y: e.clientY }; }
    if (ptrs.size === 2) { const a = [...ptrs.values()]; pinchDist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
    vp.setPointerCapture(e.pointerId);
  });
  vp.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = vp.getBoundingClientRect();
    if (ptrs.size === 2) {
      const a = [...ptrs.values()]; const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (pinchDist) tmZoom(d / pinchDist, (a[0].x + a[1].x) / 2 - r.left, (a[0].y + a[1].y) / 2 - r.top);
      pinchDist = d; moved = true; return;
    }
    if (!dragging || !last) return;
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    TM.view.x += dx; TM.view.y += dy; tmClamp(); tmApplyView();
    last = { x: e.clientX, y: e.clientY };
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinchDist = 0; if (ptrs.size === 0) { dragging = false; last = null; } };
  vp.addEventListener('pointerup', up); vp.addEventListener('pointercancel', up);
  vp.addEventListener('click', e => {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; return; }
    if (TM.mode === 'memory' && TM.memory && !TM.memory.revealed) tmMemoryClick(tmImgPoint(e.clientX, e.clientY));
  }, true);
  window.addEventListener('resize', () => { tmClamp(); tmApplyView(); });
}

// ---------- "지금 어디에 있어야 하지?" ----------
function tmRenderAdvisorForm() {
  const f = document.getElementById('tm-adv-form'); if (!f) return;
  f.innerHTML = `<div class="adv-field"><label for="tma-role">내 역할</label><select id="tma-role" onchange="tmRenderAdvisorHero()"><option value="tank">🛡️ 돌격</option><option value="dps" selected>⚔️ 공격</option><option value="support">💚 지원</option></select></div>
    <div class="adv-field"><label for="tma-hero">영웅</label><select id="tma-hero"></select></div>` +
    MAP_ADVISOR_FIELDS.map(x => `<div class="adv-field"><label for="tma-${x.key}">${x.label}</label><select id="tma-${x.key}">${x.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`).join('');
  tmRenderAdvisorHero();
}
function tmRenderAdvisorHero() {
  const role = document.getElementById('tma-role').value; const sel = document.getElementById('tma-hero');
  sel.innerHTML = `<option value="all">상관없음</option>` + heroes.filter(h => h.role === role).map(h => `<option value="${h.name}">${h.name}</option>`).join('');
}
function tmToggleSideJudge() { const box = document.getElementById('tm-side-judge'); box.hidden = !box.hidden; if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
function tmToggleAdvisor() { const box = document.getElementById('tm-advisor'); box.hidden = !box.hidden; if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
// 규칙 기반 추천 (AI 없음). 나중에 교체 가능한 진입점.
function getMapPositionAdvice(input, map) {
  const rule = MAP_ADVISOR_RULES.find(r => r.when(input));
  const tags = rule.roleTags ? rule.roleTags[input.role] : rule.tags;
  const roleOk = p => p.roles.includes(input.role) || p.roles.includes('all');
  const heroOk = p => input.hero === 'all' || p.heroes.length === 0 || p.heroes.includes(input.hero);
  let picks = [];
  for (const t of tags) picks.push(...map.positions.filter(p => roleOk(p) && p.tags.includes(t) && p.situations.includes(rule.situation) && heroOk(p)));
  if (!picks.length) for (const t of tags) picks.push(...map.positions.filter(p => roleOk(p) && p.tags.includes(t) && heroOk(p)));
  if (!picks.length) for (const t of tags) picks.push(...map.positions.filter(p => roleOk(p) && p.tags.includes(t)));
  if (!picks.length) picks = map.positions.filter(roleOk);
  picks = [...new Set(picks)];
  return { rule, picks: picks.slice(0, 2), tags };
}
function tmRunAdvisor() {
  const map = tmMap(); if (!map) return;
  const input = { role: document.getElementById('tma-role').value, hero: document.getElementById('tma-hero').value };
  MAP_ADVISOR_FIELDS.forEach(x => input[x.key] = document.getElementById('tma-' + x.key).value);
  const { rule, picks } = getMapPositionAdvice(input, map);
  const v = VERDICT_META[rule.verdict];
  const out = document.getElementById('tm-adv-result');
  if (!picks.length) { out.innerHTML = '<p class="fig-muted">이 맵에 해당 역할 포지션 데이터가 없습니다.</p>'; return; }
  const main = picks[0]; const nextRoute = map.routes.find(r => r.level !== 'newbie' && r.roles.includes(input.role) && tmMatchRouteTo(r, main));
  const retreat = map.positions.find(p => p.tags.includes('retreat'));
  out.innerHTML = `<div class="adv-card ${v.cls} primary">
    <div class="adv-rank">⭐ 지금 추천</div><h4>${main.title}</h4>
    <p class="adv-action">${rule.title}</p>
    <div class="tm-reason"><strong>이유</strong><ul>${rule.why.map(w => `<li>${w}</li>`).join('')}</ul></div>
    <div class="tm-next"><span>다음 행동</span><strong>${main.target}</strong></div>
    <div class="tm-next"><span>도망</span><strong>${main.leave}${retreat ? ` → <button class="pill pill-btn" onclick="tmSelect('position','${retreat.id}')">${retreat.title}</button>` : ''}</strong></div>
    <div class="hm-tags" style="margin-top:.6rem">${picks.map((p, i) => `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-outline'}" onclick="tmSelect('position','${p.id}')">${i === 0 ? '⭐ ' : '🔵 대안: '}${p.title}</button>`).join('')}${nextRoute ? `<button class="btn btn-outline" onclick="tmSelect('route','${nextRoute.id}')">🔵 가는 길 보기</button>` : ''}</div></div>`;
  TM.role = input.role; document.querySelectorAll('#tm-roles .filter-btn').forEach(b => { const on = b.dataset.role === input.role; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  TM.hero = input.hero !== 'all' && tmHeroInMap(input.hero) ? input.hero : 'all';
  tmRenderHeroSelect(); tmSetSit(rule.situation, true); tmApplyFilter();
  const u = tmW() / 1000;
  document.getElementById('tm-overlay').innerHTML = picks.map((p, i) => `<g class="tm-now ${i === 0 ? 'first' : ''}"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${30 * u}" stroke-width="${3 * u}"/><text x="${X(p.x)}" y="${Y(p.y) - 36 * u}" font-size="${13 * u}">${i === 0 ? '⭐ 지금 여기' : '🔵 대안'}</text></g>`).join('');
  tmSelect('position', main.id);
  const st = tmState(); const k = TM.mapId + ':' + rule.id;
  if (!st.advisor[k]) { st.advisor[k] = 1; addXP(TM_XP.advisor, '맵 상황판단'); }
}
function tmMatchRouteTo(r, p) { const [lx, ly] = r.points[r.points.length - 1]; return Math.hypot(lx - p.x, ly - p.y) < 0.03; }

// ---------- 본대 vs 사이드 ----------
function tmRenderSideJudgeForm() {
  const f = document.getElementById('tm-side-form'); if (!f) return;
  f.innerHTML = SIDE_JUDGE_FIELDS.map(x => x.options
    ? `<div class="adv-field"><label for="tms-${x.key}">${x.label}</label><select id="tms-${x.key}">${x.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`
    : `<div class="adv-field"><label for="tms-${x.key}">${x.label}</label><select id="tms-${x.key}"><option value="1">${x.yes}</option><option value="0">${x.no}</option></select></div>`).join('');
}
function tmRunSideJudge() {
  const i = {};
  SIDE_JUDGE_FIELDS.forEach(x => { const v = document.getElementById('tms-' + x.key).value; i[x.key] = x.options ? v : v === '1'; });
  const r = judgeSideOrMain(i);
  const cls = r.verdict === 'side' ? 'v-good' : r.verdict === 'short' ? 'v-mixed' : 'v-bad';
  document.getElementById('tm-side-result').innerHTML = `<div class="adv-card ${cls} primary"><h4>${r.title}</h4><ul class="tm-reason-list">${r.reasons.map(x => `<li>${x}</li>`).join('')}</ul><p class="fig-muted" style="font-size:.82rem;margin-top:.5rem">사이드는 목적이 아니라 수단입니다. 조건이 바뀌면 판단도 바뀝니다.</p></div>`;
  const map = tmMap(); if (!map) return;
  const want = r.verdict === 'side' ? ['side'] : r.verdict === 'short' ? ['high', 'offangle'] : ['front', 'safe'];
  const picks = map.positions.filter(p => want.some(t => p.tags.includes(t))).slice(0, 3);
  const u = tmW() / 1000;
  document.getElementById('tm-overlay').innerHTML = picks.map(p => `<g class="tm-now first"><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${28 * u}" stroke-width="${3 * u}"/></g>`).join('');
  if (picks[0]) tmSelect('position', picks[0].id);
}

// ---------- 학습: 연습 모드(지도 클릭) / 퀴즈(지도 위 A·B·C·D) ----------
function tmRenderQuizStatus() {
  const m = tmMap(); const st = tmState(); if (!m) return;
  document.getElementById('tm-quiz-status').textContent = `연습 ${m.quiz.filter(q => st.memory[q.id]).length}/${m.quiz.length} · 퀴즈 ${m.quiz.filter(q => st.quiz[q.id]).length}/${m.quiz.length}`;
}
function tmSetMode(mode) {
  TM.mode = mode;
  document.querySelectorAll('.tm-mode-btn').forEach(b => { const on = b.dataset.mode === mode; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  document.getElementById('tm-overlay').innerHTML = '';
  document.getElementById('tm-svg').classList.remove('tm-memory');
  if (mode === 'view') { TM.memory = null; TM.quiz = null; document.getElementById('tm-quiz-body').innerHTML = ''; tmRenderDetail(); }
  if (mode === 'memory') tmStartMemory();
  if (mode === 'quiz') tmStartQuiz();
}
function tmPickQuestion(kind) {
  const m = tmMap(); const st = tmState(); const pool = m.quiz.filter(q => !st[kind][q.id]); const list = pool.length ? pool : m.quiz;
  return list[Math.floor(Math.random() * list.length)];
}
function tmStartMemory() {
  const q = tmPickQuestion('memory');
  TM.memory = { q, revealed: false }; TM.mode = 'memory'; TM.selected = null;
  document.getElementById('tm-svg').classList.add('tm-memory');
  document.getElementById('tm-overlay').innerHTML = '';
  document.getElementById('tm-quiz-body').innerHTML = `<div class="tm-q"><div class="quiz-title">👀 연습 모드</div><p class="tm-q-text">❓ ${q.q}</p><p class="fig-muted">실제 지도에서 그 위치를 직접 클릭하세요. (마커는 숨겨져 있습니다)</p><div id="tm-q-result" role="status" aria-live="polite"></div><button class="btn btn-outline" onclick="tmSetMode('view')">그만하기</button></div>`;
  document.getElementById('tm-detail').innerHTML = '';
}
function tmMemoryClick(p) {
  const { q } = TM.memory; const target = tmFind('position', q.answer); if (!target) return;
  const d = Math.hypot((p.x - target.x) * tmW(), (p.y - target.y) * tmH());
  const ok = d <= 45;   // 이미지 픽셀 기준 반경
  TM.memory.revealed = true;
  document.getElementById('tm-svg').classList.remove('tm-memory');
  const u = tmW() / 1000;
  document.getElementById('tm-overlay').innerHTML = `<g class="tm-now first"><circle cx="${X(target.x)}" cy="${Y(target.y)}" r="${30 * u}" stroke-width="${3 * u}"/><text x="${X(target.x)}" y="${Y(target.y) - 36 * u}" font-size="${13 * u}">정답 위치</text></g><circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${8 * u}" class="${ok ? 'tm-click-ok' : 'tm-click-bad'}"/>`;
  const st = tmState(); let xpTxt = '';
  if (ok && !st.memory[q.id]) { st.memory[q.id] = 1; addXP(TM_XP.memory, '연습 모드 정답'); xpTxt = ` (+${TM_XP.memory} XP)`; } else saveState();
  document.getElementById('tm-q-result').innerHTML = (ok
    ? `<div class="verdict v-good"><span class="verdict-icon">🟢</span><strong>정답${xpTxt}</strong> — ${target.title}</div>`
    : `<div class="verdict v-bad"><span class="verdict-icon">🔴</span><strong>다시 생각해 보세요.</strong> 정답: ${target.title} <small>(힌트: ${q.hint})</small></div>`) +
    `<p class="tm-d-p" style="margin:.4rem 0">${target.why}</p><div class="hm-tags" style="margin-top:.5rem"><button class="btn btn-primary" onclick="tmStartMemory()">다음 문제</button><button class="btn btn-outline" onclick="tmSetMode('view'); tmSelect('position','${target.id}')">위치 설명 보기</button></div>`;
  tmRenderQuizStatus();
}
function tmStartQuiz() {
  const m = tmMap(); const q = tmPickQuestion('quiz');
  const answer = tmFind('position', q.answer);
  const others = m.positions.filter(p => p.id !== q.answer).sort(() => Math.random() - 0.5).slice(0, 3);
  const opts = [answer, ...others].sort(() => Math.random() - 0.5);
  const letters = ['A', 'B', 'C', 'D'];
  TM.quiz = { q, opts }; TM.mode = 'quiz'; TM.selected = null;
  document.getElementById('tm-svg').classList.add('tm-memory');
  const u = tmW() / 1000;
  document.getElementById('tm-overlay').innerHTML = opts.map((o, i) => `<g class="tm-choice" onclick="tmAnswerQuiz(${i})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'){tmAnswerQuiz(${i})}"><circle cx="${X(o.x)}" cy="${Y(o.y)}" r="${18 * u}" stroke-width="${3 * u}"/><text x="${X(o.x)}" y="${Y(o.y) + 6 * u}" font-size="${16 * u}">${letters[i]}</text></g>`).join('');
  document.getElementById('tm-quiz-body').innerHTML = `<div class="tm-q"><div class="quiz-title">📝 맵 퀴즈</div><p class="tm-q-text">❓ ${q.q}</p><p class="fig-muted">지도 위의 A·B·C·D 중 하나를 클릭하세요.</p><div class="quiz-options">${opts.map((o, i) => `<button class="quiz-option" id="tm-opt-${i}" onclick="tmAnswerQuiz(${i})"><b style="margin-right:.4rem">${letters[i]}</b>${o.title}</button>`).join('')}</div><div id="tm-q-result" role="status" aria-live="polite"></div><button class="btn btn-outline" style="margin-top:.5rem" onclick="tmSetMode('view')">그만하기</button></div>`;
  document.getElementById('tm-detail').innerHTML = '';
}
function tmAnswerQuiz(i) {
  if (!TM.quiz || TM.quiz.done) return;
  const { q, opts } = TM.quiz; const ok = opts[i].id === q.answer; TM.quiz.done = true;
  opts.forEach((o, j) => { const b = document.getElementById('tm-opt-' + j); b.setAttribute('aria-disabled', 'true'); b.onclick = null; if (o.id === q.answer) b.classList.add('selected-correct'); else if (j === i) b.classList.add('selected-wrong'); });
  document.querySelectorAll('#tm-overlay .tm-choice').forEach((g, j) => { g.classList.add(opts[j].id === q.answer ? 'ok' : j === i ? 'bad' : 'off'); g.onclick = null; });
  const st = tmState(); let xpTxt = '';
  if (ok && !st.quiz[q.id]) { st.quiz[q.id] = 1; addXP(TM_XP.quiz, '맵 퀴즈 정답'); xpTxt = ` (+${TM_XP.quiz} XP)`; } else saveState();
  const target = tmFind('position', q.answer);
  document.getElementById('tm-q-result').innerHTML = (ok ? `<div class="verdict v-good"><span class="verdict-icon">🟢</span><strong>정답${xpTxt}</strong></div>` : `<div class="verdict v-bad"><span class="verdict-icon">🔴</span><strong>아쉽습니다.</strong> 정답: ${target.title} <small>(힌트: ${q.hint})</small></div>`) +
    `<p class="tm-d-p" style="margin:.4rem 0"><strong>이유:</strong> ${target.why}</p><div class="hm-tags" style="margin-top:.5rem"><button class="btn btn-primary" onclick="tmStartQuiz()">다음 문제</button><button class="btn btn-outline" onclick="tmSetMode('view'); tmSelect('position','${target.id}')">지도에서 보기</button></div>`;
  tmRenderQuizStatus();
}

// ---------- 외부 진입 (영웅 도감 / 퀴즈 연결) ----------
function tmOpen(opts) {
  opts = opts || {};
  switchSection(3);
  tmInit();
  if (opts.map && TACTICAL_MAPS[opts.map]) tmSelectMap(opts.map);
  if (opts.role) { const b = document.querySelector(`#tm-roles .filter-btn[data-role="${opts.role}"]`); if (b) tmSetRole(opts.role, b); }
  if (opts.hero) {
    const r = heroRoleOf(opts.hero);
    if (r) { const b = document.querySelector(`#tm-roles .filter-btn[data-role="${r}"]`); if (b) tmSetRole(r, b); }
    if (!tmHeroInMap(opts.hero)) { const m = MAP_REGISTRY.find(x => TACTICAL_MAPS[x.id] && TACTICAL_MAPS[x.id].positions.some(p => p.heroes.includes(opts.hero))); if (m) tmSelectMap(m.id); }
    if (tmHeroInMap(opts.hero)) tmSetHero(opts.hero);
  }
  if (opts.sit) tmSetSit(opts.sit);
  setTimeout(() => document.getElementById('tm-map-viewer').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}
