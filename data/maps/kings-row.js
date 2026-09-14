// 왕의 길 (King's Row) — 혼합. 공격 관점 기준, 수비 포지션은 situations:['defense'] 로 표시
TACTICAL_MAPS['kings-row'] = {
  id:'kings-row', name:'왕의 길', en:"King's Row", mode:'hybrid', side:'atk',
  intro:'1거점(광장)은 정문 정면 돌파가 아니라 호텔 2층을 먼저 잡는 맵입니다. 카트 구간은 카트 옆·뒤에서, 마지막 공장은 2층 통로가 승부처입니다.',
  terrain: {
    roads: [
      { d:'M 6 31 L 24 31', w:7 },                 // 스폰 → 정문
      { d:'M 24 31 L 44 31', w:22 },               // 1거점 광장
      { d:'M 44 31 L 62 31', w:8 },                // 도로
      { d:'M 62 31 L 72 27 L 76 30', w:7 },        // 지하철 앞 → 공장 입구
      { d:'M 76 30 L 94 30', w:24 },               // 공장 내부
      { d:'M 44 40 L 54 50 L 66 44 L 68 36', w:4 },// 상점 골목(사이드)
      { d:'M 14 26 L 22 16 L 26 14', w:3.5 },      // 호텔 뒷계단
      { d:'M 48 28 L 50 22', w:3 }                 // 도로 건물 2층 계단
    ],
    buildings: [
      { x:24, y:6,  w:18, h:10, label:'호텔' },
      { x:24, y:44, w:20, h:9,  label:'상점가' },
      { x:46, y:12, w:12, h:6,  label:'도로변 건물' },
      { x:46, y:38, w:8,  h:6 },
      { x:60, y:36, w:8,  h:8,  label:'지하철' },
      { x:60, y:16, w:8,  h:9 },
      { x:74, y:8,  w:22, h:5,  label:'공장' },
      { x:74, y:44, w:22, h:6 },
      { x:0,  y:0,  w:100, h:4 }, { x:0, y:58, w:100, h:4 }, { x:0, y:0, w:4, h:62 }, { x:96, y:0, w:4, h:62 }
    ],
    stairs: [ { x:24, y:14, w:3, h:5 }, { x:48, y:22, w:2.5, h:5 }, { x:76, y:19, w:3, h:4 } ],
    objectives: [
      { type:'point', x:34, y:31, label:'A 거점' },
      { type:'cart',  d:'M 36 31 L 62 31 L 72 27 L 76 30 L 88 30', label:'카트 경로' },
      { type:'point', x:88, y:30, label:'B 종점' }
    ],
    spawns: [ { x:8, y:31, team:'atk', label:'공격 스폰' }, { x:94, y:30, team:'def', label:'수비 스폰' } ],
    labels: [ { x:20, y:24, t:'정문 아치' }, { x:64, y:33, t:'지하철 입구' } ]
  },
  keyPoints: [
    '1거점은 정문이 아니라 호텔 2층을 먼저 잡으세요. 위에서 보면 광장 전체가 보입니다.',
    '카트 구간은 카트 옆·뒤에 붙으세요. 도로 한가운데 서면 위도우의 표적입니다.',
    '이긴 뒤 상대 스폰 쪽으로 걷지 마세요. 공장 문 앞까지가 추격 한계선입니다.'
  ],
  positions: [
    { id:'kr-p1', x:26, y:34, type:'recommended', roles:['tank'], heroes:['라인하르트','오리사','시그마'], situations:['basic','fightStart','attack'], tags:['front'],
      title:'정문 안쪽 왼쪽 기둥', where:'정문 아치를 지나자마자 왼쪽 기둥 옆', why:'기둥이 엄폐물이 되고, 광장 전체를 보면서 라인을 잡을 수 있습니다.', when:'팀 5명이 정문 뒤에 모였을 때 첫 번째로 들어갑니다.', target:'거점 안 상대 탱커의 위치. 킬이 아니라 공간을 잡는 것이 목적입니다.', leave:'방벽이 30% 이하이거나 뒤를 봤을 때 팀이 정문 밖에 있으면 다시 정문 뒤로.',
      whyAdv:'정문 아치는 초크지만 통과 직후 기둥이 LOS를 끊어 줍니다. 호텔 2층 딜러와 같은 타이밍에 진입하면 상대 화력이 둘로 나뉩니다.',
      good:['호텔 2층에 우리 딜러가 올라간 뒤','상대 생존기(스즈·불사)가 빠졌을 때'], bad:['팀이 아직 스폰에서 걸어오는 중','상대 바스티온이 정면을 보고 있을 때'], caution:'기둥을 지나 광장 중앙까지 나가면 세 방향에서 맞습니다.',
      score:{ survive:7, angle:5, team:9, escape:7, pressure:7 } },
    { id:'kr-p2', x:33, y:18, type:'recommended', roles:['dps'], heroes:['애쉬','솔저: 76','소전','위도우메이커','한조'], situations:['basic','fightStart','attack','defense'], tags:['high','offangle'],
      title:'호텔 2층 발코니', where:'호텔 뒷계단으로 올라간 2층 발코니, 광장을 내려다보는 자리', why:'광장 전체가 보이고, 아래에서는 머리만 보입니다. 고지를 먹은 팀이 이 거점을 먹습니다.', when:'한타가 열리기 전에 미리 올라가 있습니다. 한타 중에 올라가면 계단에서 잘립니다.', target:'거점 안 상대 힐러, 정문을 보고 있는 상대 딜러', leave:'상대 다이브(윈스턴·겐지)가 계단으로 올라올 때, 또는 아래 팀이 무너질 때 즉시 내려갑니다.',
      whyAdv:'정문 초크와 90° 오프앵글이라 상대는 정문과 발코니를 동시에 볼 수 없습니다. 발코니 딜러가 첫 킬을 내면 정문이 열립니다.',
      good:['우리 탱커가 정문 기둥에서 라인을 잡고 있을 때','수비일 때는 한타 시작 전 항상'], bad:['우리 탱커가 후퇴 중일 때 (혼자 고립)','상대 윈스턴이 점프 쿨을 들고 발코니를 보고 있을 때'], caution:'발코니 난간 앞에 계속 서 있지 마세요. 쏘고 → 한 발 뒤로.',
      score:{ survive:7, angle:9, team:7, escape:6, pressure:8 } },
    { id:'kr-p3', x:40, y:16, type:'recommended', roles:['dps'], heroes:['트레이서','겐지','소전','솜브라'], situations:['fightStart','attack','advantage'], tags:['side','aggressive'],
      title:'호텔 발코니 끝 → 거점 뒤', where:'발코니 오른쪽 끝, 거점 뒤편으로 내려갈 수 있는 자리', why:'상대 힐러가 보통 거점 뒤 계단 근처에 섭니다. 여기서는 그 힐러의 옆·뒤가 보입니다.', when:'우리 탱커가 정문에서 압박을 시작해 상대 5명이 정문을 볼 때.', target:'상대 힐러의 시선과 생존기. 킬이 아니라 상대 2명이 뒤를 돌아보게 만드는 것.', leave:'리콜·질풍참 같은 이탈기를 썼거나, 상대 브리기테·캐서디가 나를 보기 시작하면 발코니로 복귀.',
      whyAdv:'사이드는 수단입니다. 정면 압박과 동시에 힐러를 흔들면 상대 힐러가 힐 대신 도망을 선택하고, 정면 탱커가 녹습니다.',
      good:['우리 5명 생존 + 탱커가 정면 압박 중','상대 브리기테 밀쳐내기가 빠졌을 때'], bad:['우리 팀이 4명 이하','우리 탱커가 후퇴 중','상대가 이미 발코니를 보고 있을 때'], caution:'거점 뒤까지 깊게 내려가면 돌아올 길이 계단 하나뿐입니다. 이탈기 없이 내려가지 마세요.',
      score:{ survive:5, angle:8, team:5, escape:6, pressure:9 } },
    { id:'kr-p4', x:25, y:22, type:'basic', roles:['support'], heroes:['아나','바티스트','키리코','메르시','젠야타'], situations:['basic','fightStart','attack'], tags:['safe','heal'],
      title:'호텔 1층 안쪽 코너', where:'정문을 지나 왼쪽, 호텔 1층 입구 안쪽 벽 뒤', why:'정문 기둥의 탱커와 2층 발코니의 딜러가 모두 시야에 들어오면서 상대에게는 벽에 가려집니다.', when:'탱커가 기둥에 자리 잡는 순간 같이 들어갑니다.', target:'힐: 지금 맞고 있는 사람 / 딜: 정문 앞으로 나온 적', leave:'탱커가 정문 밖으로 후퇴하면 같이 후퇴. 상대 플랭커가 호텔 뒷계단으로 오면 탱커 옆으로.',
      good:['팀이 정문·발코니에 자리를 잡았을 때'], bad:['상대 트레이서·겐지가 호텔 뒤로 도는 것을 봤을 때 (혼자 있으면 잘립니다)'], caution:'호텔 안쪽으로 너무 들어가면 발코니 딜러에게 힐이 안 닿습니다.',
      score:{ survive:8, angle:5, team:9, escape:8, pressure:3 } },
    { id:'kr-p5', x:20, y:38, type:'basic', roles:['support','dps','tank'], heroes:[], situations:['disadvantage','ourTankDead'], tags:['retreat','safe'],
      title:'정문 아치 뒤 (후퇴 위치)', where:'정문 아치 바깥쪽, 스폰 방향 벽 뒤', why:'상대가 광장에서 정문을 넘어오려면 초크를 지나야 합니다. 여기서 기다리면 상대가 초크에서 맞습니다.', when:'우리 탱커가 죽었거나 2명 이상 잘렸을 때. "빠져요" 콜과 함께.', target:'초크를 넘어오는 적. 넘어오지 않으면 싸우지 않습니다.', leave:'팀 5명이 다시 모이면 kr-p1으로 재진입.',
      good:['4:5 이하 상황','상대 궁이 살아 있어 뭉치면 안 될 때'], bad:['이미 이기고 있을 때 (여기 있으면 압박이 끊깁니다)'], caution:'후퇴는 도망이 아니라 다음 한타 준비입니다. 여기서 리그룹 후 5명으로.',
      score:{ survive:9, angle:4, team:8, escape:9, pressure:2 } },
    { id:'kr-p6', x:52, y:34, type:'recommended', roles:['tank'], heroes:['라인하르트','오리사','정커퀸','라마트라'], situations:['attack','advantage','enemyTankDead'], tags:['front'],
      title:'카트 옆 (도로 구간)', where:'카트 오른쪽 옆, 진행 방향 기준 살짝 앞', why:'카트가 엄폐물입니다. 카트 위에 서면 광역 궁의 표적이지만 옆에 붙으면 회복도 되고 방벽도 아낍니다.', when:'A 거점을 먹은 직후 팀이 카트에 모였을 때.', target:'도로 앞 건물 2층에서 쏘는 상대 딜러의 위치. 방벽으로 팀을 가리며 전진.', leave:'도로 2층에서 상대 위도우·애쉬가 계속 쏘면 카트를 멈추고 우리 딜러가 2층을 정리할 때까지 대기.',
      good:['상대 탱커가 죽었을 때 (공간을 먹으며 카트를 밉니다)'], bad:['우리 딜러가 아직 스폰에서 오는 중일 때'], caution:'카트보다 10m 이상 앞서지 마세요. 카트 회복 범위 밖입니다.',
      score:{ survive:7, angle:5, team:9, escape:6, pressure:7 } },
    { id:'kr-p7', x:52, y:20, type:'recommended', roles:['dps'], heroes:['애쉬','솔저: 76','한조','소전','파라'], situations:['attack','defense','fightStart'], tags:['high'],
      title:'도로변 건물 2층', where:'카트 도로 북쪽 건물 2층 창문', why:'카트 도로 전체와 지하철 입구가 내려다보입니다. 수비 팀의 핵심 자리이자 공격 팀이 뺏어야 하는 자리입니다.', when:'공격이면 카트가 도로에 들어오기 전에 먼저 올라갑니다. 수비면 카트가 A를 벗어나는 순간.', target:'지하철 입구 뒤 상대 힐러, 카트 옆 상대 탱커의 머리', leave:'상대 다이브가 계단으로 오거나 팀이 카트에서 밀려나면 내려갑니다.',
      good:['카트가 도로 구간에 있을 때'], bad:['우리 팀이 아직 A 거점 근처일 때 (너무 앞선 위치)'], caution:'창문 앞에 서서 계속 쏘지 마세요. 상대 저격수가 창문을 봅니다.',
      score:{ survive:6, angle:9, team:6, escape:6, pressure:8 } },
    { id:'kr-p8', x:64, y:42, type:'recommended', roles:['dps'], heroes:['트레이서','겐지','리퍼','솜브라'], situations:['attack','advantage','enemyTankDead'], tags:['side','aggressive'],
      title:'상점 골목 출구 (지하철 뒤)', where:'광장 남쪽 상점 골목을 지나 지하철 건물 뒤로 나오는 곳', why:'지하철 입구 뒤에 서 있는 상대 힐러·딜러의 뒤가 보입니다. 상대는 카트를 보고 있어 뒤를 놓칩니다.', when:'우리 탱커가 카트로 도로를 밀기 시작해 상대 시선이 카트에 묶였을 때.', target:'지하철 입구 뒤 힐러. 붙어서 한 명을 잡거나, 못 잡아도 2명이 뒤를 보게 만들기.', leave:'골목으로 다시 나가는 길이 하나입니다. 상대 2명이 돌아보면 즉시 골목으로.',
      whyAdv:'카트 정면 압박 + 골목 후방 압박이면 상대 힐러는 힐·도주 중 하나를 포기해야 합니다. 킬이 없어도 정면이 5:3이 됩니다.',
      good:['상대 탱커 사망 후 마무리 압박','우리 5명 생존 + 카트 전진 중'], bad:['우리 팀이 밀리는 중','상대 토르비욘 포탑·시메트라 포탑이 골목에 있을 때'], caution:'🔴 고급 루트입니다. 골목이 길어 돌아오는 데 10초 걸립니다. 뉴비는 kr-p7(2층)을 먼저 익히세요.',
      score:{ survive:4, angle:8, team:4, escape:4, pressure:10 } },
    { id:'kr-p9', x:46, y:36, type:'basic', roles:['support'], heroes:['아나','바티스트','메르시','키리코','루시우'], situations:['attack','advantage','basic'], tags:['safe','heal'],
      title:'카트 뒤 코너', where:'카트 뒤쪽, 남쪽 건물 모서리 옆', why:'카트가 정면 화력을 가려 주고, 2층 딜러와 카트 옆 탱커가 모두 힐 사거리 안입니다.', when:'카트가 움직이기 시작하면 같이 이동. 항상 카트 뒤에.', target:'힐: 카트 옆 탱커 / 딜: 2층 창문에 보이는 적', leave:'카트가 멈추고 팀이 후퇴하면 A 거점 뒤로. 카트 앞으로는 절대 나가지 않습니다.',
      good:['카트 전진 중'], bad:['상대 플랭커가 상점 골목 쪽에서 나올 때'], caution:'카트 위에 올라서지 마세요.',
      score:{ survive:8, angle:4, team:9, escape:7, pressure:3 } },
    { id:'kr-p10', x:77, y:33, type:'recommended', roles:['tank'], heroes:['라인하르트','시그마','오리사','라마트라'], situations:['attack','fightStart'], tags:['front'],
      title:'공장 문 안쪽 기둥', where:'공장 입구를 지나자마자 오른쪽 기둥 옆', why:'공장 안은 좁아 문 앞이 초크입니다. 문 안 기둥을 잡으면 팀이 안으로 들어올 공간이 생깁니다.', when:'우리 딜러가 2층 통로(kr-p11)에 올라간 것을 확인한 뒤.', target:'2층 통로에서 쏘는 상대 딜러의 위치, 종점 앞 상대 탱커', leave:'방벽이 깨지고 2층 우리 딜러가 죽었으면 문 밖(지하철 앞)으로.',
      good:['우리 궁 우위일 때'], bad:['상대 궁(그라비·타이어)이 살아 있을 때 문 안에 뭉치면 위험'], caution:'문 앞에서 5명이 뭉쳐 대기하지 마세요. 정커랫 유탄이 떨어집니다.',
      score:{ survive:6, angle:5, team:9, escape:5, pressure:8 } },
    { id:'kr-p11', x:84, y:16, type:'recommended', roles:['dps'], heroes:['소전','애쉬','솔저: 76','트레이서','겐지'], situations:['attack','defense','fightStart','advantage'], tags:['high','offangle'],
      title:'공장 2층 통로', where:'공장 왼쪽 계단으로 올라가는 2층 통로', why:'종점 전체가 내려다보입니다. 수비 팀이 여기 있으면 카트가 안 들어오고, 공격 팀이 뺏으면 종점이 열립니다.', when:'공격: 카트가 공장 문에 닿기 전에 미리. 수비: 카트가 지하철을 지나는 순간.', target:'종점 뒤 상대 힐러, 카트 옆 탱커', leave:'상대 다이브가 계단을 오르면 통로 반대편 끝으로 이동 후 내려가기.',
      good:['카트가 공장 안에 있을 때'], bad:['우리 팀이 지하철 앞에서 밀리는 중'], caution:'통로가 길고 좁아 정커랫 타이어·D.Va 자폭에 취약합니다. 궁 소리가 나면 계단으로.',
      score:{ survive:6, angle:10, team:6, escape:5, pressure:9 } },
    { id:'kr-p12', x:63, y:29, type:'basic', roles:['support','dps','tank'], heroes:[], situations:['disadvantage','ourTankDead'], tags:['retreat','safe'],
      title:'지하철 입구 안 (후퇴 위치)', where:'지하철 건물 입구 안쪽, 큰 힐팩 옆', why:'큰 힐팩이 바로 옆에 있고 입구가 좁아 상대가 쫓아오기 어렵습니다.', when:'공장 앞 한타에서 탱커가 죽었거나 2명 이상 잘렸을 때.', target:'입구로 쫓아오는 적만. 나가서 싸우지 않습니다.', leave:'팀 5명이 모이면 카트로 복귀.',
      good:['4:5 이하'], bad:['이기고 있을 때'], caution:'입구 안에서 5명이 뭉치면 궁 표적입니다. 힐만 받고 흩어지세요.',
      score:{ survive:9, angle:3, team:7, escape:8, pressure:2 } },
    { id:'kr-p13', x:40, y:36, type:'basic', roles:['tank'], heroes:['라인하르트','오리사','시그마'], situations:['defense'], tags:['front'],
      title:'거점 뒤 계단 앞 (수비)', where:'A 거점 오른쪽 뒤, 상점가 쪽 계단 앞', why:'정문·호텔 양쪽에서 오는 적을 모두 볼 수 있고, 뒤에 후퇴 길(도로)이 있습니다.', when:'수비 첫 한타. 호텔 2층 우리 딜러와 같은 타이밍.', target:'정문을 넘어오는 상대 탱커. 초크에서 막습니다.', leave:'호텔 2층을 뺏기면 거점을 버리고 도로 구간으로 후퇴.',
      good:['호텔 2층에 우리 딜러가 있을 때'], bad:['호텔 2층을 상대가 잡았을 때 (위에서 맞습니다)'], caution:'거점 정중앙에 서지 마세요. 세 방향 초크에서 다 보입니다.',
      score:{ survive:7, angle:6, team:8, escape:8, pressure:6 } }
  ],
  routes: [
    { id:'kr-r1', level:'newbie', points:[[8,31],[20,31],[26,34]], roles:['tank','support'], heroes:[], situations:['basic','fightStart','attack'],
      title:'🟢 기본 루트: 정문 → 왼쪽 기둥', from:'공격 스폰', via:'정문 아치', to:'광장 왼쪽 기둥(kr-p1)', purpose:'팀이 함께 들어가는 가장 안전한 길입니다. 처음엔 이 길만.', caution:'정문 아치에서 멈추지 마세요. 아치 자체가 초크라 유탄이 떨어집니다. 지나서 기둥까지.' },
    { id:'kr-r2', level:'side', points:[[8,31],[14,26],[22,16],[26,14],[33,18]], roles:['dps'], heroes:['애쉬','솔저: 76','소전','트레이서','겐지','한조'], situations:['basic','fightStart','attack'],
      title:'🟡 초보자 사이드: 호텔 뒷계단 → 2층 발코니', from:'공격 스폰', via:'호텔 뒤 골목 · 뒷계단', to:'호텔 2층 발코니(kr-p2)', purpose:'광장을 내려다보는 고지를 잡습니다. 사이드 중 가장 안전하고 팀과 가깝습니다.', caution:'한타가 이미 시작된 뒤 계단을 오르지 마세요. 한타 전에 미리 올라가 있는 길입니다.' },
    { id:'kr-r3', level:'flank', points:[[44,42],[54,50],[66,44],[68,36]], roles:['dps'], heroes:['트레이서','겐지','리퍼','솜브라'], situations:['attack','advantage','enemyTankDead'],
      title:'🔴 고급 플랭크: 상점 골목 → 지하철 뒤', from:'A 거점 남쪽', via:'상점 골목', to:'지하철 뒤 출구(kr-p8)', purpose:'카트를 보고 있는 상대 힐러의 뒤로 나갑니다. 시선 분산이 목적입니다.', caution:'골목이 길어 왕복 20초입니다. 우리 팀이 5명이고 카트가 전진 중일 때만. 팀이 무너지면 즉시 복귀.' },
    { id:'kr-r4', level:'side', points:[[48,30],[49,25],[52,20]], roles:['dps'], heroes:['애쉬','솔저: 76','한조','소전'], situations:['attack','defense','fightStart'],
      title:'🟡 사이드: 카트 → 도로변 건물 2층', from:'카트 옆', via:'건물 계단', to:'도로변 2층(kr-p7)', purpose:'도로 구간 고지를 잡습니다. 카트가 도로에 들어오기 전에.', caution:'계단이 좁습니다. 상대 정커랫이 계단에 덫을 놓는 곳입니다.' }
  ],
  highgrounds: [
    { id:'kr-h1', points:[[24,16],[42,16],[42,20],[24,20]], label:'호텔 2층 발코니', roles:['dps'], heroes:['소전','애쉬','솔저: 76','위도우메이커'], pros:['광장 전체 시야','정문 초크와 오프앵글','아래에서는 머리만 보임'], cons:['윈스턴·겐지 다이브에 취약','계단이 하나라 이탈이 느림'], caution:'수비·공격 모두 이 자리를 먹은 팀이 1거점을 가져갑니다.' },
    { id:'kr-h2', points:[[46,18],[58,18],[58,26],[46,26]], label:'도로변 건물 2층', roles:['dps'], heroes:['애쉬','한조','파라','소전'], pros:['카트 도로 전체 시야','지하철 입구까지 보임'], cons:['창문이 저격수에게 노출','팀과 거리가 멀어지기 쉬움'], caution:'창문 앞에 고정되지 마세요.' },
    { id:'kr-h3', points:[[75,13],[95,13],[95,19],[75,19]], label:'공장 2층 통로', roles:['dps'], heroes:['소전','애쉬','솔저: 76','트레이서'], pros:['종점 전체 시야','수비의 핵심 자리'], cons:['좁고 길어 광역 궁에 취약','계단 하나'], caution:'궁 소리가 나면 계단으로.' }
  ],
  dangers: [
    { id:'kr-d1', points:[[18,27],[24,27],[24,35],[18,35]], label:'정문 아치 (초크)', why:'광장 세 방향에서 모두 보입니다. 여기서 멈추면 유탄·저격의 표적입니다. 지나가는 곳이지 서 있는 곳이 아닙니다.', roles:['all'] },
    { id:'kr-d2', points:[[44,28],[62,28],[62,34],[44,34]], label:'도로 한가운데', why:'양쪽 건물 2층과 지하철 앞에서 모두 보이는 열린 도로입니다. 카트 옆이 아니면 서 있지 마세요.', roles:['all'] },
    { id:'kr-d3', points:[[72,26],[76,26],[76,34],[72,34]], label:'공장 문 앞', why:'공장 2층 통로에서 내려다보는 자리입니다. 문 앞에 5명이 뭉치면 궁 하나에 전멸합니다.', roles:['all'] }
  ],
  covers: [
    { id:'kr-c1', x:25, y:33, w:2, h:2.5, label:'정문 기둥' }, { id:'kr-c2', x:41, y:33, w:2, h:2.5, label:'거점 기둥' },
    { id:'kr-c3', x:68, y:37, w:3, h:2, label:'트럭' }, { id:'kr-c4', x:80, y:34, w:2, h:2.5, label:'공장 기둥' }
  ],
  packs: [
    { id:'kr-k1', x:30, y:11, size:'big', label:'호텔 안 큰 팩' }, { id:'kr-k2', x:64, y:22, size:'big', label:'지하철 안 큰 팩' }, { id:'kr-k3', x:90, y:42, size:'small', label:'공장 작은 팩' }
  ],
  fights: [
    { id:'kr-f1', x:34, y:31, r:8, label:'A 거점 광장', note:'첫 한타. 호텔 2층을 먹은 쪽이 이깁니다.' },
    { id:'kr-f2', x:52, y:31, r:6, label:'도로 구간', note:'카트 옆 vs 2층 창문 싸움.' },
    { id:'kr-f3', x:84, y:30, r:7, label:'공장 종점', note:'2층 통로가 승부처. 오버타임이 자주 납니다.' }
  ],
  quiz: [
    { id:'kr-q1', q:'트레이서가 A 거점 공격 때 상대 힐러의 시선을 흔들기 좋은 위치는?', answer:'kr-p3', hint:'호텔 발코니의 끝, 거점 뒤가 보이는 곳' },
    { id:'kr-q2', q:'애쉬·솔저가 광장 전체를 내려다보며 쏘는 자리는?', answer:'kr-p2', hint:'고지, 정문 초크와 90°' },
    { id:'kr-q3', q:'우리 탱커가 죽었을 때 지원가가 물러나야 할 곳은?', answer:'kr-p5', hint:'상대가 초크를 넘어와야 하는 곳' },
    { id:'kr-q4', q:'카트 구간에서 수비 팀 딜러의 핵심 자리는?', answer:'kr-p7', hint:'도로 전체가 보이는 창문' },
    { id:'kr-q5', q:'공격 팀 탱커가 첫 한타에서 자리 잡아야 할 곳은?', answer:'kr-p1', hint:'정문을 지나자마자, 기둥 옆' }
  ]
};
