/* =====================================================================
   전술 지도 모듈 (tmap.js)
   데이터: data/maps/_schema.js, data/maps/*.js, data/map-situations.js
   SVG 전용 (게임 이미지 사용 안 함). AI·서버 호출 없음.
   ===================================================================== */
const TM = {
  mapId: null, role: 'all', hero: 'all', sit: 'basic', layers: {}, detail: false,
  selected: null,                 // { kind, id }
  view: { x: 0, y: 0, w: 100, h: 62 },
  memory: null,                   // 암기 모드 상태 { q, revealed }
  quizMode: null,                 // 맵 퀴즈 상태
  inited: false
};
const TM_VB = { w: 100, h: 62 };
const TM_XP = { study: 10, advisor: 20, memory: 15, quiz: 20 };
const TM_ROUTE_META = { newbie: { label: '기본 루트', color: '#22a06b' }, side: { label: '초보자 사이드', color: '#e0a300' }, flank: { label: '고급 플랭크', color: '#e0363f' } };

function tmMaps() { return Object.values(TACTICAL_MAPS); }
function tmMap() { return TACTICAL_MAPS[TM.mapId]; }
function tmState() {
  if (!state.tmap || typeof state.tmap !== 'object') state.tmap = {};
  ['studied', 'memory', 'quiz', 'advisor'].forEach(k => { if (!state.tmap[k]) state.tmap[k] = {}; });
  return state.tmap;
}

// ---------- 초기화 ----------
function tmInit() {
  if (TM.inited) return;
  TM.inited = true;
  const maps = tmMaps();
  if (!maps.length) return;
  MAP_LAYERS.forEach(l => TM.layers[l.key] = l.basic);
  tmRenderMapButtons();
  tmRenderSitButtons();
  tmRenderLayerToggles();
  tmRenderAdvisorForm();
  tmSelectMap(maps[0].id, true);
  tmBindViewport();
  // 공유 링크: ?map=...&hero=...&sit=...&pos=...
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('map') && TACTICAL_MAPS[q.get('map')]) tmSelectMap(q.get('map'), true);
    if (q.get('sit')) tmSetSit(q.get('sit'));
    if (q.get('hero') && tmHeroInMap(q.get('hero'))) tmSetHero(q.get('hero'));
    if (q.get('pos')) tmSelect('position', q.get('pos'));
    if (q.get('detail') === '1' && !TM.detail) tmToggleDetail();
  } catch (e) {}
}
function tmRenderMapButtons() {
  document.getElementById('tm-maps').innerHTML = tmMaps().map(m => `<button class="filter-btn" data-map="${m.id}" aria-pressed="false" onclick="tmSelectMap('${m.id}')"><span class="map-mode">${MAP_MODES[m.mode]}</span> ${m.name}</button>`).join('');
}
function tmRenderSitButtons() {
  document.getElementById('tm-sits').innerHTML = MAP_SITUATIONS.map(s => `<button class="filter-btn" data-sit="${s.key}" aria-pressed="false" title="${s.desc}" onclick="tmSetSit('${s.key}')">${s.icon} ${s.label}</button>`).join('');
}
function tmRenderLayerToggles() {
  document.getElementById('tm-layers').innerHTML = MAP_LAYERS.map(l => `<label class="tm-layer"><input type="checkbox" data-layer="${l.key}" ${TM.layers[l.key] ? 'checked' : ''} onchange="tmToggleLayer('${l.key}', this.checked)"> ${l.icon} ${l.label}</label>`).join('');
}
function tmRenderHeroButtons() {
  const map = tmMap();
  const used = new Set();
  map.positions.forEach(p => p.heroes.forEach(h => used.add(h)));
  map.routes.forEach(r => r.heroes.forEach(h => used.add(h)));
  const list = heroes.filter(h => used.has(h.name) && (TM.role === 'all' || h.role === TM.role));
  document.getElementById('tm-heroes').innerHTML = `<button class="filter-btn ${TM.hero === 'all' ? 'active' : ''}" aria-pressed="${TM.hero === 'all'}" onclick="tmSetHero('all')">전체</button>` +
    list.map(h => `<button class="filter-btn ${TM.hero === h.name ? 'active' : ''}" aria-pressed="${TM.hero === h.name}" onclick="tmSetHero('${h.name}')">${h.name}</button>`).join('');
}

// ---------- 선택 ----------
function tmSelectMap(id, silent) {
  TM.mapId = id; TM.selected = null; TM.memory = null; TM.quizMode = null;
  document.querySelectorAll('#tm-maps .filter-btn').forEach(b => { const on = b.dataset.map === id; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  const st = tmState();
  if (!st.studied[id]) { st.studied[id] = todayKey(); if (!silent) addXP(TM_XP.study, `${tmMap().name} 지도 학습`); else saveState(); }
  if (TM.hero !== 'all' && !tmHeroInMap(TM.hero)) TM.hero = 'all';
  tmRenderHeroButtons();
  tmSetSit(TM.sit, true);
  tmResetView();
  tmRender();
  tmRenderKeyPoints();
  tmRenderDetail();
  tmRenderQuizPanel();
}
function tmHeroInMap(name) { const m = tmMap(); return m.positions.some(p => p.heroes.includes(name)) || m.routes.some(r => r.heroes.includes(name)); }
function tmSetRole(role, btn) {
  TM.role = role;
  document.querySelectorAll('#tm-roles .filter-btn').forEach(b => { const on = b === btn; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  if (TM.hero !== 'all') { const h = heroes.find(x => x.name === TM.hero); if (h && role !== 'all' && h.role !== role) TM.hero = 'all'; }
  tmRenderHeroButtons(); tmApplyFilter();
}
function tmSetHero(name) { TM.hero = name; tmRenderHeroButtons(); tmApplyFilter(); }
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
  const b = document.getElementById('tm-detail-btn'); b.textContent = TM.detail ? '🔽 기본 정보만 보기' : '🔎 상세 정보 보기'; b.setAttribute('aria-pressed', TM.detail);
}

// ---------- 매칭 ----------
function tmMatch(obj) {
  const roleOk = TM.role === 'all' || !obj.roles || obj.roles.includes(TM.role) || obj.roles.includes('all');
  const heroOk = tmHeroOk(obj);
  const sitOk = !obj.situations || obj.situations.includes(TM.sit);
  return roleOk && heroOk && sitOk;
}
function tmHeroOk(obj) { return TM.hero === 'all' || !obj.heroes || (obj.heroes.length === 0 && (obj.roles || []).includes(heroRoleOf(TM.hero))) || (obj.heroes || []).includes(TM.hero); }
function heroRoleOf(name) { const h = heroes.find(x => x.name === name); return h ? h.role : null; }
function tmApplyFilter() {
  const svg = document.getElementById('tm-svg'); if (!svg) return;
  const map = tmMap();
  svg.querySelectorAll('[data-kind]').forEach(el => {
    const obj = tmFind(el.dataset.kind, el.dataset.id); if (!obj) return;
    if (el.dataset.kind === 'position' || el.dataset.kind === 'route' || el.dataset.kind === 'high') {
      const m = tmMatch(obj);
      el.classList.toggle('tm-dim', !m);
      // 영웅을 고르면 그 영웅과 무관한 포지션은 숨기고, 관련 있지만 상황이 다른 것은 흐리게
      if (el.dataset.kind === 'position') el.classList.toggle('tm-hide', TM.hero !== 'all' && !tmHeroOk(obj));
    }
  });
  // 현재 조건에 맞는 포지션 수
  const n = map.positions.filter(tmMatch).length;
  const el = document.getElementById('tm-count'); if (el) el.textContent = `조건에 맞는 포지션 ${n}개 · 클릭하면 설명이 열립니다`;
}
function tmApplyLayers() {
  const svg = document.getElementById('tm-svg'); if (!svg) return;
  MAP_LAYERS.forEach(l => { const g = svg.querySelector(`[data-layer="${l.key}"]`); if (g) g.classList.toggle('tm-hide', !TM.layers[l.key]); });
}
function tmFind(kind, id) {
  const m = tmMap();
  const src = { position: m.positions, route: m.routes, high: m.highgrounds, danger: m.dangers, cover: m.covers, pack: m.packs, fight: m.fights }[kind] || [];
  return src.find(o => o.id === id);
}

// ---------- 렌더 ----------
function tmPoly(points) { return points.map(p => p.join(',')).join(' '); }
function tmRender() {
  const m = tmMap(); const t = m.terrain;
  const cap = r => r.w > 8 ? 'butt' : 'round';
  const roads = t.roads.map(r => `<path d="${r.d}" class="tm-road" stroke-width="${r.w}" stroke-linecap="${cap(r)}"/>`).join('');
  const roadEdges = t.roads.map(r => `<path d="${r.d}" class="tm-road-edge" stroke-width="${r.w + 0.8}" stroke-linecap="${cap(r)}"/>`).join('');
  const blds = t.buildings.map(b => `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.r || 0.8}" class="tm-bld"/>${b.label ? `<text x="${b.x + b.w / 2}" y="${b.y + b.h / 2 + 0.9}" class="tm-bld-label">${b.label}</text>` : ''}`).join('');
  const stairs = t.stairs.map(s => `<g class="tm-stairs"><rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}"/>${[0.25, 0.5, 0.75].map(f => `<line x1="${s.x}" y1="${s.y + s.h * f}" x2="${s.x + s.w}" y2="${s.y + s.h * f}"/>`).join('')}</g>`).join('');
  const cartLabelPos = d => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); const i = Math.floor(n.length / 4) * 2; return { x: (n[i] + n[i + 2]) / 2, y: (n[i + 1] + n[i + 3]) / 2 + 4 }; };
  const objs = t.objectives.map(o => o.type === 'cart'
    ? `<path d="${o.d}" class="tm-cart"/><text x="${cartLabelPos(o.d).x}" y="${cartLabelPos(o.d).y}" class="tm-label muted">${o.label}</text>`
    : `<g class="tm-point"><circle cx="${o.x}" cy="${o.y}" r="4.2"/><circle cx="${o.x}" cy="${o.y}" r="2.2"/><text x="${o.x}" y="${o.y - 5.2}" class="tm-label">${o.label}</text></g>`).join('');
  const spawns = t.spawns.map(s => `<g class="tm-spawn ${s.team}"><rect x="${s.x - 6}" y="${s.y - 3}" width="12" height="6" rx="1.2"/><text x="${s.x}" y="${s.y + 1}">${s.label}</text></g>`).join('');
  const labels = (t.labels || []).map(l => `<text x="${l.x}" y="${l.y}" class="tm-label muted">${l.t}</text>`).join('');

  const highs = m.highgrounds.map(h => `<polygon points="${tmPoly(h.points)}" class="tm-high" data-kind="high" data-id="${h.id}" tabindex="0" role="button" aria-label="고지대 ${h.label}" onclick="tmSelect('high','${h.id}')" onkeydown="tmKey(event,'high','${h.id}')"><title>🟣 ${h.label}</title></polygon>`).join('');
  const dangers = m.dangers.map(d => `<polygon points="${tmPoly(d.points)}" class="tm-danger" data-kind="danger" data-id="${d.id}" tabindex="0" role="button" aria-label="위험지역 ${d.label}" onclick="tmSelect('danger','${d.id}')" onkeydown="tmKey(event,'danger','${d.id}')"><title>🔴 ${d.label}</title></polygon>`).join('');
  const covers = m.covers.map(c => `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="0.4" class="tm-cover" data-kind="cover" data-id="${c.id}" onclick="tmSelect('cover','${c.id}')"><title>⚪ ${c.label}</title></rect>`).join('');
  const packs = m.packs.map(p => `<g class="tm-pack ${p.size}" data-kind="pack" data-id="${p.id}" onclick="tmSelect('pack','${p.id}')"><circle cx="${p.x}" cy="${p.y}" r="${p.size === 'big' ? 1.9 : 1.4}"/><text x="${p.x}" y="${p.y + 0.8}">+</text><title>💚 ${p.label}</title></g>`).join('');
  const fights = m.fights.map(f => `<g class="tm-fight" data-kind="fight" data-id="${f.id}" onclick="tmSelect('fight','${f.id}')"><circle cx="${f.x}" cy="${f.y}" r="${f.r}"/><text x="${f.x}" y="${f.y - f.r - 1}">🎯 ${f.label}</text><title>🎯 ${f.label}</title></g>`).join('');
  const routes = m.routes.map(r => {
    const pts = r.points.map(p => p.join(',')).join(' ');
    return `<g class="tm-route lv-${r.level}" data-kind="route" data-id="${r.id}" tabindex="0" role="button" aria-label="${r.title}" onclick="tmSelect('route','${r.id}')" onkeydown="tmKey(event,'route','${r.id}')">
      <polyline points="${pts}" class="tm-route-hit"/>
      <polyline points="${pts}" class="tm-route-line" marker-end="url(#tm-arrow-${r.level})"/>
      <circle cx="${r.points[0][0]}" cy="${r.points[0][1]}" r="1" class="tm-route-start"/><title>${r.title}</title></g>`;
  }).join('');
  const positions = m.positions.map(p => {
    const ic = { tank: '탱', dps: '딜', support: '힐' };
    const roleTxt = p.roles.length === 1 ? ic[p.roles[0]] : '★';
    return `<g class="tm-pos ${p.type}" data-kind="position" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.type === 'recommended' ? '추천' : '기본'} 포지션 ${p.title}" onclick="tmSelect('position','${p.id}')" onkeydown="tmKey(event,'position','${p.id}')">
      <circle cx="${p.x}" cy="${p.y}" r="3.4" class="tm-pos-ring"/><circle cx="${p.x}" cy="${p.y}" r="2.4" class="tm-pos-dot"/><text x="${p.x}" y="${p.y + 0.85}" class="tm-pos-txt">${roleTxt}</text><title>${p.type === 'recommended' ? '🟢' : '🔵'} ${p.title}</title></g>`;
  }).join('');

  document.getElementById('tm-svg').innerHTML = `
    <defs>
      <pattern id="tm-hatch" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="1.6" stroke="#e0363f" stroke-width="0.5" opacity=".7"/></pattern>
      ${Object.entries(TM_ROUTE_META).map(([k, v]) => `<marker id="tm-arrow-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 10 5 0 10z" fill="${v.color}"/></marker>`).join('')}
    </defs>
    <rect x="0" y="0" width="100" height="62" class="tm-ground"/>
    <g class="tm-terrain">${roadEdges}${roads}${blds}${stairs}${objs}${spawns}${labels}</g>
    <g data-layer="highs">${highs}</g>
    <g data-layer="dangers">${dangers}</g>
    <g data-layer="fights">${fights}</g>
    <g data-layer="covers">${covers}</g>
    <g data-layer="packs">${packs}</g>
    <g data-layer="routes">${routes}</g>
    <g data-layer="positions">${positions}</g>
    <g id="tm-overlay"></g>`;
  tmApplyLayers(); tmApplyFilter(); tmApplyView();
  document.getElementById('tm-title').textContent = `${m.name} · ${MAP_MODES[m.mode]}`;
  document.getElementById('tm-intro').textContent = m.intro;
}
function tmKey(e, kind, id) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tmSelect(kind, id); } }
function tmRenderKeyPoints() {
  const m = tmMap();
  document.getElementById('tm-keypoints').innerHTML = `<div class="tip-box coach-note" style="margin:0"><div class="tip-title">💡 ${m.name} — 이것만 기억하세요</div><div class="tip-content"><ol class="steps" style="margin:.3rem 0 0">${m.keyPoints.map(k => `<li>${k}</li>`).join('')}</ol></div></div>`;
}

// ---------- 선택 & 상세 ----------
function tmSelect(kind, id) {
  if (TM.memory && !TM.memory.revealed) return;   // 암기 모드 중에는 클릭 판정만
  TM.selected = { kind, id };
  document.querySelectorAll('#tm-svg .tm-selected').forEach(el => el.classList.remove('tm-selected'));
  const el = document.querySelector(`#tm-svg [data-kind="${kind}"][data-id="${id}"]`); if (el) el.classList.add('tm-selected');
  tmRenderDetail();
  const panel = document.getElementById('tm-detail');
  if (window.innerWidth < 900) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function tmStars(score) {
  const avg = (score.survive + score.angle + score.team + score.escape + score.pressure) / 5 / 2;
  const full = Math.floor(avg), half = avg - full >= 0.5;
  return { text: '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(5 - full - (half ? 1 : 0)), num: avg.toFixed(1) };
}
function tmScoreBar(label, v) { return `<div class="result-cat"><span>${label}</span><div class="mini-bar"><div class="mini-fill ${v >= 8 ? 'good' : v >= 5 ? 'mixed' : 'bad'}" style="width:${v * 10}%"></div></div><b>${v}/10</b><small></small></div>`; }
function tmHeroPills(list) { return list && list.length ? list.map(n => { const i = heroes.findIndex(h => h.name === n); return i >= 0 ? `<button class="pill pill-btn" onclick="tmSetHero('${n}')">${n}</button>` : `<span class="pill">${n}</span>`; }).join('') : '<span class="fig-muted">역할 전체</span>'; }
function tmRolePills(roles) { return (roles || []).map(r => r === 'all' ? '<span class="pill">모든 역할</span>' : `<span class="pill">${{ tank: '🛡️ 돌격', dps: '⚔️ 공격', support: '💚 지원' }[r]}</span>`).join(''); }
function tmRenderDetail() {
  const box = document.getElementById('tm-detail');
  if (!TM.selected) {
    box.innerHTML = `<div class="tm-empty"><div class="tm-empty-icon">🗺️</div><p><strong>지도의 마커를 눌러 보세요.</strong></p><p class="fig-muted">🟢 추천 포지션 · 🟡 사이드 루트를 누르면 <b>어디 · 왜 · 언제 · 무엇을 노림 · 언제 빠짐</b>을 알려 드립니다.</p></div>`;
    return;
  }
  const { kind, id } = TM.selected; const o = tmFind(kind, id); if (!o) return;
  const adv = document.body.classList.contains('mode-advanced');
  if (kind === 'position') {
    const st = tmStars(o.score);
    const sits = o.situations.map(s => MAP_SITUATIONS.find(x => x.key === s)).filter(Boolean).map(s => `<span class="diff-badge">${s.icon} ${s.label}</span>`).join(' ');
    box.innerHTML = `
      <div class="tm-d-head ${o.type}"><span class="tm-d-kicker">${o.type === 'recommended' ? '🟢 추천 포지션' : '🔵 기본 포지션'}</span><h3>${o.title}</h3><div class="tm-d-tags">${tmRolePills(o.roles)} ${o.tags.map(t => `<span class="pill tiny">${TAG_LABEL[t] || t}</span>`).join('')}</div></div>
      <ul class="kv small tm-formula">
        <li><span>📍 어디?</span><strong>${o.where}</strong></li>
        <li><span>❓ 왜?</span><strong>${adv && o.whyAdv ? o.whyAdv : o.why}</strong></li>
        <li><span>⏱️ 언제?</span><strong>${o.when}</strong></li>
        <li><span>🎯 무엇을 노림?</span><strong>${o.target}</strong></li>
        <li><span>🏃 언제 빠짐?</span><strong>${o.leave}</strong></li>
      </ul>
      <div class="tm-d-cols">
        <div class="why-box"><h5>🟢 좋은 상황</h5><ul>${o.good.map(g => `<li>${g}</li>`).join('')}</ul></div>
        <div class="why-box"><h5>🔴 나쁜 상황</h5><ul>${o.bad.map(g => `<li>${g}</li>`).join('')}</ul></div>
      </div>
      <div class="tm-d-heroes"><h5>추천 영웅</h5><div class="hm-tags">${tmHeroPills(o.heroes)}</div></div>
      <div class="tm-d-sits"><h5>적용 상황</h5>${sits}</div>
      <div class="tm-score"><h5>포지션 점수 <span class="tm-stars">${st.text} ${st.num} / 5</span></h5>
        <div class="result-cats">${tmScoreBar('생존성', o.score.survive)}${tmScoreBar('딜각', o.score.angle)}${tmScoreBar('팀 연계', o.score.team)}${tmScoreBar('탈출 가능성', o.score.escape)}${tmScoreBar('압박 능력', o.score.pressure)}</div></div>
      <div class="tip-box coach-note" style="margin-bottom:0"><div class="tip-title">⚠️ 주의</div><div class="tip-content">${o.caution}</div></div>`;
  } else if (kind === 'route') {
    const meta = TM_ROUTE_META[o.level];
    box.innerHTML = `
      <div class="tm-d-head route lv-${o.level}"><span class="tm-d-kicker" style="color:${meta.color}">${o.title.slice(0, 2)} ${meta.label}</span><h3>${o.title.replace(/^..\s*/, '')}</h3><div class="tm-d-tags">${tmRolePills(o.roles)}</div></div>
      <div class="tm-route-steps">
        <div class="tm-step"><span>출발</span><strong>${o.from}</strong></div><div class="tm-arrow">↓</div>
        <div class="tm-step"><span>중간</span><strong>${o.via}</strong></div><div class="tm-arrow">↓</div>
        <div class="tm-step"><span>도착</span><strong>${o.to}</strong></div>
      </div>
      <ul class="kv small tm-formula"><li><span>🎯 목적</span><strong>${o.purpose}</strong></li><li><span>⚠️ 주의</span><strong>${o.caution}</strong></li></ul>
      <div class="tm-d-heroes"><h5>추천 영웅</h5><div class="hm-tags">${tmHeroPills(o.heroes)}</div></div>
      ${o.level !== 'newbie' ? `<div class="tip-box coach-note" style="margin-bottom:0"><div class="tip-title">🧭 사이드는 목적이 아니라 수단입니다</div><div class="tip-content"><b>좋은 조건:</b> 본대가 안정적 · 적이 본대를 보고 있음 · 내가 탈출할 수 있음 · 상대 시선을 빼는 것이 팀에 도움<br><b>나쁜 조건:</b> 우리 탱커가 위험 · 수적 열세 · 혼자 고립 · 적이 이미 사이드를 봄 · 내가 죽으면 한타가 끝남<br><small>본대가 무너지면 즉시 복귀하세요.</small></div></div>` : ''}`;
  } else if (kind === 'high') {
    box.innerHTML = `
      <div class="tm-d-head high"><span class="tm-d-kicker">🟣 고지대</span><h3>${o.label}</h3><div class="tm-d-tags">${tmRolePills(o.roles)}</div></div>
      <div class="tm-d-cols"><div class="why-box"><h5>장점</h5><ul>${o.pros.map(x => `<li>${x}</li>`).join('')}</ul></div><div class="why-box"><h5>단점</h5><ul>${o.cons.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
      <div class="tm-d-heroes"><h5>추천 영웅</h5><div class="hm-tags">${tmHeroPills(o.heroes)}</div></div>
      <div class="tip-box coach-note" style="margin-bottom:0"><div class="tip-title">⚠️ 주의</div><div class="tip-content">${o.caution}</div></div>`;
  } else if (kind === 'danger') {
    box.innerHTML = `<div class="tm-d-head danger"><span class="tm-d-kicker">🔴 위험 지역</span><h3>${o.label}</h3></div><p class="tm-d-p">${o.why}</p>`;
  } else if (kind === 'fight') {
    box.innerHTML = `<div class="tm-d-head fight"><span class="tm-d-kicker">🎯 주요 교전 지역</span><h3>${o.label}</h3></div><p class="tm-d-p">${o.note}</p>`;
  } else if (kind === 'pack') {
    box.innerHTML = `<div class="tm-d-head pack"><span class="tm-d-kicker">💚 힐팩</span><h3>${o.label}</h3></div><p class="tm-d-p">${o.size === 'big' ? '큰 팩 250 · 약 15초마다 리스폰. 체력이 없을 때 힐러를 찾는 것보다 빠를 때가 많습니다.' : '작은 팩 75 · 약 10초마다 리스폰.'}</p>`;
  } else if (kind === 'cover') {
    box.innerHTML = `<div class="tm-d-head cover"><span class="tm-d-kicker">⚪ 엄폐물</span><h3>${o.label}</h3></div><p class="tm-d-p">좋은 자리 = "쏘고 → 한 발 뒤로 → 안 보임". 이 엄폐물 옆에 서면 그것이 됩니다.</p>`;
  }
}

// ---------- 뷰포트 (줌/이동) ----------
function tmApplyView() {
  const svg = document.getElementById('tm-svg'); if (!svg) return;
  const v = TM.view; svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
  svg.classList.toggle('zoomed', v.w < TM_VB.w - 0.5);
}
function tmClamp() {
  const v = TM.view;
  v.w = Math.min(TM_VB.w, Math.max(TM_VB.w / 4, v.w)); v.h = v.w * TM_VB.h / TM_VB.w;
  v.x = Math.min(TM_VB.w - v.w, Math.max(0, v.x)); v.y = Math.min(TM_VB.h - v.h, Math.max(0, v.y));
}
function tmZoom(factor, cx, cy) {
  const v = TM.view;
  if (cx === undefined) { cx = v.x + v.w / 2; cy = v.y + v.h / 2; }
  const nw = v.w / factor;
  v.x = cx - (cx - v.x) / factor; v.y = cy - (cy - v.y) / factor; v.w = nw; v.h = nw * TM_VB.h / TM_VB.w;
  tmClamp(); tmApplyView();
}
function tmResetView() { TM.view = { x: 0, y: 0, w: TM_VB.w, h: TM_VB.h }; tmApplyView(); }
function tmSvgPoint(svg, clientX, clientY) {
  const r = svg.getBoundingClientRect(); const v = TM.view;
  return { x: v.x + (clientX - r.left) / r.width * v.w, y: v.y + (clientY - r.top) / r.height * v.h };
}
function tmBindViewport() {
  const svg = document.getElementById('tm-svg'); if (!svg) return;
  const ptrs = new Map(); let dragging = false, moved = false, pinchDist = 0, last = null;
  svg.addEventListener('wheel', e => { e.preventDefault(); const p = tmSvgPoint(svg, e.clientX, e.clientY); tmZoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y); }, { passive: false });
  svg.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) { dragging = true; moved = false; last = { x: e.clientX, y: e.clientY }; }
    if (ptrs.size === 2) { const a = [...ptrs.values()]; pinchDist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); }
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const a = [...ptrs.values()]; const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (pinchDist) { const mid = tmSvgPoint(svg, (a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2); tmZoom(d / pinchDist, mid.x, mid.y); }
      pinchDist = d; moved = true; return;
    }
    if (!dragging || !last) return;
    const dx = e.clientX - last.x, dy = e.clientY - last.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    const r = svg.getBoundingClientRect(); const v = TM.view;
    v.x -= dx / r.width * v.w; v.y -= dy / r.height * v.h; tmClamp(); tmApplyView();
    last = { x: e.clientX, y: e.clientY };
  });
  const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinchDist = 0; if (ptrs.size === 0) { dragging = false; last = null; } };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up); svg.addEventListener('pointerleave', e => { if (!e.buttons) up(e); });
  // 드래그 후 클릭 무시
  svg.addEventListener('click', e => {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; return; }
    if (TM.memory && !TM.memory.revealed) { const p = tmSvgPoint(svg, e.clientX, e.clientY); tmMemoryClick(p); }
  }, true);
}

// ---------- "지금 어디 있어야 하지?" ----------
function tmRenderAdvisorForm() {
  const f = document.getElementById('tm-adv-form'); if (!f) return;
  f.innerHTML = `<div class="adv-field"><label for="tma-role">내 역할</label><select id="tma-role"><option value="tank">🛡️ 돌격</option><option value="dps" selected>⚔️ 공격</option><option value="support">💚 지원</option></select></div>` +
    MAP_ADVISOR_FIELDS.map(x => `<div class="adv-field"><label for="tma-${x.key}">${x.label}</label><select id="tma-${x.key}">${x.options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>`).join('');
}
function tmToggleAdvisor() {
  const box = document.getElementById('tm-advisor'); box.hidden = !box.hidden;
  if (!box.hidden) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
// 규칙 기반 추천 (AI 없음). 나중에 교체 가능한 진입점.
function getMapPositionAdvice(input, map) {
  const rule = MAP_ADVISOR_RULES.find(r => r.when(input));
  const tags = rule.roleTags ? rule.roleTags[input.role] : rule.tags;
  const roleOk = p => p.roles.includes(input.role) || p.roles.includes('all');
  const heroOk = p => input.hero === 'all' || p.heroes.length === 0 || p.heroes.includes(input.hero);
  // 1) 상황 + 역할 + 태그 우선순위, 2) 태그만, 3) 역할만
  let picks = [];
  for (const t of tags) picks.push(...map.positions.filter(p => roleOk(p) && p.tags.includes(t) && p.situations.includes(rule.situation) && heroOk(p)));
  if (!picks.length) for (const t of tags) picks.push(...map.positions.filter(p => roleOk(p) && p.tags.includes(t) && heroOk(p)));
  if (!picks.length) for (const t of tags) picks.push(...map.positions.filter(p => roleOk(p) && p.tags.includes(t)));
  if (!picks.length) picks = map.positions.filter(roleOk);
  picks = [...new Set(picks)];
  return { rule, picks: picks.slice(0, 2), tags };
}
function tmRunAdvisor() {
  const input = { role: document.getElementById('tma-role').value, hero: TM.hero };
  MAP_ADVISOR_FIELDS.forEach(x => input[x.key] = document.getElementById('tma-' + x.key).value);
  const { rule, picks } = getMapPositionAdvice(input, tmMap());
  const v = VERDICT_META[rule.verdict];
  const out = document.getElementById('tm-adv-result');
  if (!picks.length) { out.innerHTML = '<p class="fig-muted">이 맵에 해당 역할 포지션 데이터가 없습니다.</p>'; return; }
  out.innerHTML = `<div class="adv-card ${v.cls} primary"><div class="adv-rank">${v.icon} 지금 추천 위치</div><h4>${rule.title}</h4><p class="adv-why"><strong>왜 여기인가?</strong> ${rule.why}</p>
    <div class="hm-tags" style="margin-top:.6rem">${picks.map((p, i) => `<button class="btn ${i === 0 ? 'btn-primary' : 'btn-outline'}" onclick="tmSelect('position','${p.id}')">${i === 0 ? '🟢 ' : '🔵 '}${p.title}</button>`).join('')}</div></div>`;
  // 지도에 표시: 추천 마커 강조 + 상황 필터 맞춤
  TM.role = input.role; document.querySelectorAll('#tm-roles .filter-btn').forEach(b => { const on = b.dataset.role === input.role; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  tmRenderHeroButtons(); tmSetSit(rule.situation, true); tmApplyFilter();
  const ov = document.getElementById('tm-overlay');
  ov.innerHTML = picks.map((p, i) => `<g class="tm-now ${i === 0 ? 'first' : ''}"><circle cx="${p.x}" cy="${p.y}" r="5.5"/><text x="${p.x}" y="${p.y - 6.5}">${i === 0 ? '🟢 지금 여기' : '🔵 대안'}</text></g>`).join('');
  tmSelect('position', picks[0].id);
  const st = tmState(); const k = TM.mapId + ':' + rule.id;
  if (!st.advisor[k]) { st.advisor[k] = 1; addXP(TM_XP.advisor, '맵 상황판단'); }
}

// ---------- 암기 모드 / 맵 퀴즈 ----------
function tmRenderQuizPanel() {
  const m = tmMap(); const st = tmState();
  const done = m.quiz.filter(q => st.memory[q.id]).length, doneQ = m.quiz.filter(q => st.quiz[q.id]).length;
  document.getElementById('tm-quiz-status').textContent = `암기 ${done}/${m.quiz.length} · 퀴즈 ${doneQ}/${m.quiz.length}`;
  document.getElementById('tm-quiz-body').innerHTML = '';
}
function tmStartMemory() {
  const m = tmMap(); const st = tmState();
  const pool = m.quiz.filter(q => !st.memory[q.id]); const list = pool.length ? pool : m.quiz;
  const q = list[Math.floor(Math.random() * list.length)];
  TM.memory = { q, revealed: false }; TM.quizMode = null; TM.selected = null;
  document.getElementById('tm-svg').classList.add('tm-memory');
  document.getElementById('tm-overlay').innerHTML = '';
  document.getElementById('tm-quiz-body').innerHTML = `<div class="tm-q"><div class="quiz-title">👀 암기 모드</div><p class="tm-q-text">❓ ${q.q}</p><p class="fig-muted">지도에서 그 위치를 직접 클릭하세요. (마커는 숨겨져 있습니다)</p><div id="tm-q-result" role="status" aria-live="polite"></div><button class="btn btn-outline" onclick="tmEndMemory()">그만하기</button></div>`;
  tmRenderDetail();
}
function tmMemoryClick(p) {
  const { q } = TM.memory; const target = tmFind('position', q.answer); if (!target) return;
  const d = Math.hypot(p.x - target.x, p.y - target.y);
  const ok = d <= 6;
  TM.memory.revealed = true;
  document.getElementById('tm-svg').classList.remove('tm-memory');
  const ov = document.getElementById('tm-overlay');
  ov.innerHTML = `<g class="tm-now first"><circle cx="${target.x}" cy="${target.y}" r="5.5"/><text x="${target.x}" y="${target.y - 6.5}">정답 위치</text></g><circle cx="${p.x}" cy="${p.y}" r="1.6" class="${ok ? 'tm-click-ok' : 'tm-click-bad'}"/>`;
  const st = tmState(); let xpTxt = '';
  if (ok && !st.memory[q.id]) { st.memory[q.id] = 1; addXP(TM_XP.memory, '암기 모드 정답'); xpTxt = ` (+${TM_XP.memory} XP)`; } else saveState();
  document.getElementById('tm-q-result').innerHTML = ok
    ? `<div class="verdict v-good"><span class="verdict-icon">🟢</span><strong>정답${xpTxt}</strong> — ${target.title}</div>`
    : `<div class="verdict v-bad"><span class="verdict-icon">🔴</span><strong>다시 생각해 보세요.</strong> 정답: ${target.title} <small>(힌트: ${q.hint})</small></div>`;
  document.getElementById('tm-q-result').insertAdjacentHTML('beforeend', `<div class="hm-tags" style="margin-top:.5rem"><button class="btn btn-primary" onclick="tmStartMemory()">다음 문제</button><button class="btn btn-outline" onclick="tmSelect('position','${target.id}')">위치 설명 보기</button></div>`);
  tmRenderQuizPanelKeepBody();
}
function tmRenderQuizPanelKeepBody() { const m = tmMap(); const st = tmState(); document.getElementById('tm-quiz-status').textContent = `암기 ${m.quiz.filter(q => st.memory[q.id]).length}/${m.quiz.length} · 퀴즈 ${m.quiz.filter(q => st.quiz[q.id]).length}/${m.quiz.length}`; }
function tmEndMemory() { TM.memory = null; document.getElementById('tm-svg').classList.remove('tm-memory'); document.getElementById('tm-overlay').innerHTML = ''; tmRenderQuizPanel(); }
function tmStartQuiz() {
  const m = tmMap(); const st = tmState();
  const pool = m.quiz.filter(q => !st.quiz[q.id]); const list = pool.length ? pool : m.quiz;
  const q = list[Math.floor(Math.random() * list.length)];
  const answer = tmFind('position', q.answer);
  const others = m.positions.filter(p => p.id !== q.answer).sort(() => Math.random() - 0.5).slice(0, 2);
  const opts = [answer, ...others].sort(() => Math.random() - 0.5);
  TM.memory = null; TM.quizMode = { q }; document.getElementById('tm-svg').classList.remove('tm-memory');
  document.getElementById('tm-quiz-body').innerHTML = `<div class="tm-q"><div class="quiz-title">📝 맵 퀴즈</div><p class="tm-q-text">❓ ${q.q}</p><div class="quiz-options">${opts.map(o => `<button class="quiz-option" onclick="tmAnswerQuiz('${q.id}','${o.id}',this)">${o.title}</button>`).join('')}</div><div id="tm-q-result" role="status" aria-live="polite"></div></div>`;
}
function tmAnswerQuiz(qid, pid, btn) {
  const m = tmMap(); const q = m.quiz.find(x => x.id === qid); const ok = pid === q.answer;
  btn.parentElement.querySelectorAll('.quiz-option').forEach(b => { b.setAttribute('aria-disabled', 'true'); b.onclick = null; });
  btn.classList.add(ok ? 'selected-correct' : 'selected-wrong');
  if (!ok) [...btn.parentElement.children].find(b => b.textContent === tmFind('position', q.answer).title).classList.add('selected-correct');
  const st = tmState(); let xpTxt = '';
  if (ok && !st.quiz[qid]) { st.quiz[qid] = 1; addXP(TM_XP.quiz, '맵 퀴즈 정답'); xpTxt = ` (+${TM_XP.quiz} XP)`; } else saveState();
  const target = tmFind('position', q.answer);
  document.getElementById('tm-q-result').innerHTML = (ok ? `<div class="verdict v-good"><span class="verdict-icon">🟢</span><strong>정답${xpTxt}</strong></div>` : `<div class="verdict v-bad"><span class="verdict-icon">🔴</span><strong>아쉽습니다.</strong> 힌트: ${q.hint}</div>`) +
    `<div class="hm-tags" style="margin-top:.5rem"><button class="btn btn-primary" onclick="tmStartQuiz()">다음 문제</button><button class="btn btn-outline" onclick="tmSelect('position','${target.id}')">지도에서 보기</button></div>`;
  tmSelect('position', target.id);
  tmRenderQuizPanelKeepBody();
}

// ---------- 외부 진입 (영웅 도감 / 퀴즈 연결) ----------
function tmOpen(opts) {
  opts = opts || {};
  switchSection(10);
  tmInit();
  if (opts.map && TACTICAL_MAPS[opts.map]) tmSelectMap(opts.map);
  if (opts.role) { const b = document.querySelector(`#tm-roles .filter-btn[data-role="${opts.role}"]`); if (b) tmSetRole(opts.role, b); }
  if (opts.hero) {
    const r = heroRoleOf(opts.hero);
    if (r) { const b = document.querySelector(`#tm-roles .filter-btn[data-role="${r}"]`); if (b) tmSetRole(r, b); }
    // 이 영웅이 들어간 맵을 우선
    if (!tmHeroInMap(opts.hero)) { const m = tmMaps().find(x => x.positions.some(p => p.heroes.includes(opts.hero))); if (m) tmSelectMap(m.id); }
    if (tmHeroInMap(opts.hero)) tmSetHero(opts.hero);
  }
  if (opts.sit) tmSetSit(opts.sit);
  setTimeout(() => document.getElementById('tm-map-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}
