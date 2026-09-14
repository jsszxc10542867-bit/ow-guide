// 전술 지도: 상황 정의, 레이어, "지금 어디 있어야 하지?" 규칙, 본대 vs 사이드 판단 (모두 규칙 기반, AI 없음)
const MAP_SITUATIONS = [
  { key:'basic',        label:'기본',           icon:'📍', desc:'뉴비가 이해하기 쉬운 기본 포지션' },
  { key:'attackStart',  label:'공격 시작',      icon:'🔥', desc:'공격 팀이 진행하며 잡는 위치' },
  { key:'fightStart',   label:'한타 시작',      icon:'⚔️', desc:'교전 직전 추천 위치' },
  { key:'defense',      label:'수비',           icon:'🛡️', desc:'수비 팀 핵심 위치' },
  { key:'enemyTankIn',  label:'적 탱커 진입',   icon:'🚨', desc:'적 탱커가 본대를 보고 있을 때 → 사이드가 열립니다' },
  { key:'enemyUlt',     label:'적 궁극기 사용', icon:'💥', desc:'궁을 피하고 시간을 버는 위치' },
  { key:'allyDead',     label:'아군 한 명 사망', icon:'❌', desc:'위험한 사이드는 숨기고 본대 합류 위치 강조' },
  { key:'enemyDead',    label:'적 한 명 사망',  icon:'💀', desc:'공간을 넓히며 압박하는 위치' },
  { key:'regroup',      label:'리그룹',         icon:'🔁', desc:'후퇴해 5명을 맞추는 위치' },
  { key:'retake',       label:'리테이크',       icon:'↩️', desc:'뺏긴 목표를 다시 열 때 모이는 위치' },
  { key:'objective',    label:'오브젝트 압박',  icon:'🎯', desc:'거점·카트를 밀 때의 위치' },
  { key:'sidePush',     label:'사이드 압박',    icon:'🧭', desc:'조건이 맞을 때의 사이드 위치' }
];
// 상황별로 숨길 태그 (예: 아군 사망 시 깊은 사이드 숨김)
const SITUATION_HIDE_TAGS = { allyDead:['aggressive'], regroup:['aggressive', 'side'], enemyUlt:['aggressive'] };

const MAP_LAYERS = [
  { key:'positions',  label:'포지션',      icon:'🟢', basic:true },
  { key:'routes',     label:'사이드 루트', icon:'🔵', basic:true },
  { key:'highs',      label:'고지대',      icon:'🟣', basic:false },
  { key:'dangers',    label:'위험 지역',   icon:'🔴', basic:false },
  { key:'sightlines', label:'시야각',      icon:'👁️', basic:false },
  { key:'covers',     label:'엄폐물',      icon:'⚪', basic:false },
  { key:'packs',      label:'힐팩',        icon:'💚', basic:false },
  { key:'fights',     label:'주요 교전',   icon:'🎯', basic:false }
];
const POSITION_TYPES = {
  main:'메인 포지션', side:'사이드 포지션', safe:'안전 포지션', defense:'수비 포지션', retreat:'후퇴·리그룹 포지션', retake:'리테이크 포지션'
};
const TAG_LABEL = { side:'사이드', high:'고지', safe:'안전', front:'전선', retreat:'후퇴', aggressive:'공격적', offangle:'오프앵글', heal:'힐 시야' };

// ---------- "지금 어디 있어야 하지?" ----------
const MAP_ADVISOR_FIELDS = [
  { key:'fight', label:'한타 상태', options:[['pre','시작 전'],['mid','한타 중'],['win','우리 유리'],['lose','우리 불리']] },
  { key:'ally',  label:'아군 생존', options:[['5','5명'],['4','4명'],['3','3명 이하']] },
  { key:'enemy', label:'적 생존',   options:[['5','5명'],['4','4명'],['3','3명 이하']] },
  { key:'tank',  label:'우리 탱커', options:[['engaging','정면에서 압박 중'],['holding','버티는 중'],['retreat','후퇴 중'],['dead','사망']] },
  { key:'enemyTank', label:'적 탱커', options:[['main','본대를 보고 있음'],['side','우리 쪽으로 들어옴'],['dead','사망']] },
  { key:'hp',    label:'내 체력',   options:[['high','높음'],['low','낮음']] },
  { key:'esc',   label:'생존기',    options:[['yes','있음'],['no','없음']] }
];
// 규칙: 위에서부터 첫 매칭. tags 우선순위 순으로 포지션을 찾고, situation 으로 2차 필터
const MAP_ADVISOR_RULES = [
  { id:'m_tankdead', when:i => i.tank === 'dead', role:'any', tags:['retreat','safe'], situation:'allyDead', verdict:'bad',
    title:'후퇴 위치로 — 탱커 없이는 공간이 없습니다', why:['탱커가 죽으면 팀이 설 공간이 사라집니다','상대가 초크를 넘어와야 하는 자리에서 리스폰(약 10초)을 기다리세요','사이드·고지는 지금 고립입니다'] },
  { id:'m_lowhp', when:i => i.hp === 'low' && i.esc === 'no', role:'any', tags:['safe','retreat','heal'], situation:'regroup', verdict:'bad',
    title:'엄폐 · 힐러 시야로', why:['체력이 낮고 생존기가 없으면 다음 피격에 죽습니다','힐러가 보이는 안전 위치로 먼저','3초 뒤에 다시 나오면 됩니다'] },
  { id:'m_outnum', when:i => Number(i.ally) <= Number(i.enemy) - 2 || i.fight === 'lose' || i.tank === 'retreat', role:'any', tags:['retreat','safe'], situation:'regroup', verdict:'bad',
    title:'후퇴 위치 — 다음 한타를 준비하세요', why:['인원이 밀리거나 탱커가 후퇴 중이면 사이드·고지는 고립입니다','팀과 같은 방향으로 빠져 5명을 맞추세요','후퇴는 도망이 아니라 다음 한타 준비입니다'] },
  { id:'m_enemytankdead', when:i => i.enemyTank === 'dead' || Number(i.ally) >= Number(i.enemy) + 1 || i.fight === 'win',
    roleTags:{ tank:['front','aggressive'], dps:['side','aggressive','high'], support:['heal','safe'] }, situation:'enemyDead', verdict:'good',
    title:'전진 — 공간을 먹을 시간입니다', why:['상대 탱커가 없거나 인원이 유리하면 상대는 설 곳이 없습니다','탱커는 앞으로, 딜러는 사이드·고지에서 압박, 힐러는 탱커를 따라갑니다','단, 상대 스폰 앞까지는 금지'] },
  { id:'m_enemytank_in', when:i => i.enemyTank === 'side' && i.tank !== 'dead',
    roleTags:{ tank:['front'], dps:['safe','high'], support:['safe','heal'] }, situation:'enemyTankIn', verdict:'mixed',
    title:'적 탱커가 우리 쪽으로 들어옵니다 — 뭉쳐서 받아치기', why:['적 탱커가 들어오면 사이드로 나가지 말고 뭉쳐서 받아치는 것이 유리합니다','탱커는 앞에서 막고, 딜러는 팀 옆 고지에서 탱커 머리를','힐러는 탱커 시야를 유지하세요'] },
  { id:'m_pre', when:i => i.fight === 'pre',
    roleTags:{ tank:['front'], dps:['high','offangle'], support:['safe','heal'] }, situation:'fightStart', verdict:'good',
    title:'한타 전 — 고지와 라인을 먼저', why:['딜러는 고지·오프앵글에 미리 올라가 있습니다','탱커는 기둥 옆에서 라인을, 힐러는 둘 다 보이는 코너에','한타 중에 올라가면 계단에서 잘립니다'] },
  { id:'m_mid_engaging', when:i => i.fight === 'mid' && i.tank === 'engaging' && Number(i.ally) === 5 && i.esc === 'yes',
    roleTags:{ tank:['front'], dps:['side','offangle'], support:['heal','safe'] }, situation:'enemyTankIn', verdict:'good',
    title:'탱커가 정면을 잡고 있습니다 — 사이드가 열렸습니다', why:['적 탱커의 시선을 분산시킬 수 있습니다','본대 지원이 가능한 거리를 유지하세요','도망 경로(이탈기·골목)를 확보한 상태에서만'] },
  { id:'m_mid_holding', when:i => i.fight === 'mid',
    roleTags:{ tank:['front'], dps:['high','offangle'], support:['heal','safe'] }, situation:'objective', verdict:'mixed',
    title:'팀 옆 고지·오프앵글 — 깊은 사이드는 아직', why:['탱커가 버티는 중이거나 조건이 하나라도 빠지면 깊은 사이드는 고립입니다','팀 근처 고지에서 각을 보세요','이탈기가 돌아오면 그때 사이드'] },
  { id:'m_default', when:() => true, roleTags:{ tank:['front'], dps:['high'], support:['safe','heal'] }, situation:'basic', verdict:'mixed',
    title:'기본 포지션', why:['탱커는 기둥 옆 라인','딜러는 고지','힐러는 팀이 다 보이는 코너'] }
];

// ---------- 본대 vs 사이드 판단 ----------
const SIDE_JUDGE_FIELDS = [
  { key:'allyTankAlive', label:'아군 탱커 생존', yes:'살아 있음', no:'사망' },
  { key:'allySupportSafe', label:'아군 지원가가 안전한 위치', yes:'안전', no:'위험' },
  { key:'enemyTankOnMain', label:'적 탱커가 우리 본대를 보고 있음', yes:'본대를 봄', no:'다른 곳' },
  { key:'enemyDpsNotWatching', label:'적 딜러가 사이드를 보고 있지 않음', yes:'안 봄', no:'이미 봄' },
  { key:'enemyCdDown', label:'적 주요 쿨다운(스즈·불사·슬립) 빠짐', yes:'빠짐', no:'살아 있음' },
  { key:'escapeRoute', label:'내 이탈기·탈출 경로', yes:'있음', no:'없음' },
  { key:'numbers', label:'인원', options:[['adv','우리 우위'],['even','같음'],['dis','우리 열세']] }
];
function judgeSideOrMain(i) {
  const reasons = [];
  if (!i.allyTankAlive) reasons.push('아군 탱커가 없으면 본대가 무너집니다 → 본대');
  if (i.numbers === 'dis') reasons.push('수적 열세에서 사이드는 5:3을 만드는 지름길입니다 → 본대');
  if (!i.escapeRoute) reasons.push('탈출 경로가 없으면 사이드는 죽는 자리입니다 → 본대');
  if (!i.allySupportSafe) reasons.push('지원가가 위험하면 딜러가 뒤를 지켜야 합니다 → 본대');
  if (reasons.length) return { verdict:'main', title:'🔴 본대에 있으세요', reasons };
  const good = [];
  if (i.enemyTankOnMain) good.push('적 탱커가 본대를 보고 있어 시선 분산이 통합니다');
  if (i.enemyDpsNotWatching) good.push('적 딜러가 사이드를 보고 있지 않습니다');
  if (i.enemyCdDown) good.push('적 핵심 쿨다운이 빠져 압박이 확정 킬로 이어질 수 있습니다');
  if (i.numbers === 'adv') good.push('수적 우위라 깊게 들어가도 팀이 버팁니다');
  if (good.length >= 3 || (i.enemyTankOnMain && i.enemyDpsNotWatching)) return { verdict:'side', title:'🟢 사이드로 가세요', reasons: good.concat(['조건이 바뀌면(탱커 후퇴·아군 사망) 즉시 복귀']) };
  return { verdict:'short', title:'🟡 짧은 사이드각까지만', reasons: good.concat(['조건이 2개 이하입니다. 팀 옆 고지·측면 각에서 압박하고 깊게 들어가지 마세요']) };
}
