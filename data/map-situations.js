// 전술 지도: 상황 정의 + "지금 어디 있어야 하지?" 규칙
const MAP_SITUATIONS = [
  { key:'basic',         label:'기본',          icon:'📍', desc:'뉴비가 이해하기 쉬운 기본 포지션' },
  { key:'fightStart',    label:'한타 시작',     icon:'⚔️', desc:'교전 직전 추천 위치' },
  { key:'attack',        label:'공격',          icon:'🔥', desc:'공격 팀 진행 위치' },
  { key:'defense',       label:'수비',          icon:'🛡️', desc:'수비 팀 핵심 위치' },
  { key:'advantage',     label:'우리 유리',     icon:'🟢', desc:'공간을 넓히는 위치' },
  { key:'disadvantage',  label:'우리 불리',     icon:'🔴', desc:'생존·후퇴 중심' },
  { key:'enemyTankDead', label:'적 탱커 사망',  icon:'💀', desc:'공격적으로 전진' },
  { key:'ourTankDead',   label:'우리 탱커 사망', icon:'❌', desc:'후퇴·생존 중심' }
];
const MAP_LAYERS = [
  { key:'positions', label:'포지션',      icon:'🟢', basic:true },
  { key:'routes',    label:'사이드 루트', icon:'🟡', basic:true },
  { key:'highs',     label:'고지대',      icon:'🟣', basic:false },
  { key:'dangers',   label:'위험지역',    icon:'🔴', basic:false },
  { key:'covers',    label:'엄폐물',      icon:'⚪', basic:false },
  { key:'packs',     label:'힐팩',        icon:'💚', basic:false },
  { key:'fights',    label:'주요 교전',   icon:'🎯', basic:false }
];
const TAG_LABEL = { side:'사이드', high:'고지', safe:'안전', front:'전선', retreat:'후퇴', aggressive:'공격적', offangle:'오프앵글', heal:'힐 시야' };

// 포지션 추천 입력 항목
const MAP_ADVISOR_FIELDS = [
  { key:'fight', label:'한타 상태', options:[['pre','시작 전'],['mid','한타 중'],['win','우리 유리'],['lose','우리 불리']] },
  { key:'ally',  label:'아군 생존', options:[['5','5명'],['4','4명'],['3','3명 이하']] },
  { key:'enemy', label:'적 생존',   options:[['5','5명'],['4','4명'],['3','3명 이하']] },
  { key:'tank',  label:'우리 탱커', options:[['engaging','정면에서 압박 중'],['holding','버티는 중'],['retreat','후퇴 중'],['dead','사망']] },
  { key:'enemyTank', label:'적 탱커', options:[['alive','생존'],['dead','사망']] },
  { key:'hp',    label:'내 체력',   options:[['high','높음'],['low','낮음']] },
  { key:'esc',   label:'생존기',    options:[['yes','있음'],['no','없음']] }
];

// 규칙: 위에서부터 첫 매칭. tags 우선순위 순으로 포지션을 찾고, situation 으로 2차 필터
const MAP_ADVISOR_RULES = [
  { id:'m_tankdead', when:i => i.tank === 'dead', role:'any', tags:['retreat','safe'], situation:'ourTankDead', verdict:'bad',
    title:'후퇴 위치로 — 탱커 없이는 공간이 없습니다', why:'탱커가 죽으면 팀이 설 공간이 사라집니다. 상대가 초크를 넘어와야 하는 후퇴 위치에서 리스폰(약 10초)을 기다리세요.' },
  { id:'m_lowhp', when:i => i.hp === 'low' && i.esc === 'no', role:'any', tags:['safe','retreat','heal'], situation:'disadvantage', verdict:'bad',
    title:'엄폐 · 힐러 시야로', why:'체력이 낮고 생존기가 없으면 다음 피격에 죽습니다. 힐러가 보이는 안전 위치로 먼저.' },
  { id:'m_outnum', when:i => Number(i.ally) <= Number(i.enemy) - 2 || i.fight === 'lose' || i.tank === 'retreat', role:'any', tags:['retreat','safe'], situation:'disadvantage', verdict:'bad',
    title:'후퇴 위치 — 다음 한타를 준비하세요', why:'인원이 밀리거나 탱커가 후퇴 중이면 사이드·고지는 고립입니다. 팀과 같은 방향으로 빠져 5명을 맞추세요.' },
  { id:'m_enemytankdead', when:i => i.enemyTank === 'dead' || Number(i.ally) >= Number(i.enemy) + 1 || i.fight === 'win',
    roleTags:{ tank:['front','aggressive'], dps:['side','aggressive','high'], support:['heal','safe'] }, situation:'enemyTankDead', verdict:'good',
    title:'전진 — 공간을 먹을 시간입니다', why:'상대 탱커가 없거나 인원이 유리하면 상대는 설 곳이 없습니다. 탱커는 앞으로, 딜러는 사이드·고지에서 압박, 힐러는 탱커를 따라갑니다. 단, 상대 스폰 앞까지는 금지.' },
  { id:'m_pre', when:i => i.fight === 'pre',
    roleTags:{ tank:['front'], dps:['high','offangle'], support:['safe','heal'] }, situation:'fightStart', verdict:'good',
    title:'한타 전 — 고지와 라인을 먼저', why:'한타가 열리기 전에 딜러는 고지·오프앵글에 올라가 있고, 탱커는 기둥 옆에서 라인을, 힐러는 둘 다 보이는 코너에 섭니다. 한타 중에 올라가면 계단에서 잘립니다.' },
  { id:'m_mid_engaging', when:i => i.fight === 'mid' && i.tank === 'engaging' && Number(i.ally) === 5,
    roleTags:{ tank:['front'], dps:['side','offangle'], support:['heal','safe'] }, situation:'attack', verdict:'good',
    title:'탱커가 정면을 잡고 있습니다 — 사이드가 열렸습니다', why:'상대 5명이 우리 탱커를 보고 있을 때가 사이드 조건입니다. 딜러는 옆에서 상대 힐러의 시선을 흔들고, 힐러는 탱커 시야를 유지하세요. 이탈기 하나는 남기고.' },
  { id:'m_mid_holding', when:i => i.fight === 'mid',
    roleTags:{ tank:['front'], dps:['high','offangle'], support:['heal','safe'] }, situation:'attack', verdict:'mixed',
    title:'팀 옆 고지·오프앵글 — 깊은 사이드는 아직', why:'탱커가 버티는 중이거나 인원이 5명이 아니면 깊은 사이드는 고립입니다. 팀 근처 고지에서 각을 보세요.' },
  { id:'m_default', when:() => true, roleTags:{ tank:['front'], dps:['high'], support:['safe','heal'] }, situation:'basic', verdict:'mixed',
    title:'기본 포지션', why:'탱커는 기둥 옆 라인, 딜러는 고지, 힐러는 팀이 다 보이는 코너.' }
];
