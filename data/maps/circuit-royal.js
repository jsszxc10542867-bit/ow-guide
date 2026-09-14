// 서킷 로얄 (Circuit Royal) — 호위. 공격 관점 기준
TACTICAL_MAPS['circuit-royal'] = {
  id:'circuit-royal', name:'서킷 로얄', en:'Circuit Royal', mode:'escort', side:'atk',
  intro:'첫 구간의 긴 다리가 저격수 천국입니다. 다리 위를 걸어서 건너지 말고 다리 아래 통로로 우회하거나 방벽 뒤에 뭉쳐 한 번에 지나가세요. 상점 2층과 카지노 2층이 각 구간의 승부처입니다.',
  terrain: {
    roads: [
      { d:'M 6 31 L 42 31', w:7 },                       // 긴 다리
      { d:'M 12 31 L 14 40 L 38 40 L 42 34', w:4 },      // 다리 아래 통로
      { d:'M 42 31 L 62 31', w:14 },                     // 상점가
      { d:'M 62 31 L 74 31', w:5 },                      // 터널
      { d:'M 74 31 L 94 31', w:22 },                     // 카지노
      { d:'M 46 40 L 54 48 L 60 46 L 66 40', w:3.5 },    // 상점 뒷길 (플랭크)
      { d:'M 48 26 L 48 22 L 50 18', w:2.5 },            // 상점 2층 계단
      { d:'M 78 26 L 78 21', w:2.5 }                     // 카지노 2층 계단
    ],
    buildings: [
      { x:36, y:12, w:6, h:10, label:'다리 끝 탑' },
      { x:44, y:10, w:12, h:6, label:'상점' },
      { x:44, y:42, w:14, h:8, label:'상점 뒷건물' },
      { x:62, y:20, w:12, h:8, label:'터널 위' }, { x:62, y:36, w:12, h:8 },
      { x:76, y:6, w:16, h:6, label:'카지노' }, { x:76, y:44, w:18, h:6 },
      { x:0, y:0, w:100, h:4 }, { x:0, y:56, w:100, h:6 }, { x:0, y:0, w:4, h:62 }, { x:96, y:0, w:4, h:62 },
      { x:10, y:8, w:22, h:8, label:'해안 절벽' }, { x:12, y:46, w:26, h:6 }
    ],
    stairs: [ { x:47, y:22, w:2.5, h:4 }, { x:77, y:21, w:2.5, h:4 }, { x:12, y:34, w:3, h:3 } ],
    objectives: [ { type:'cart', d:'M 12 31 L 42 31 L 62 31 L 74 31 L 88 31', label:'카트 경로' }, { type:'point', x:88, y:31, label:'종점' } ],
    spawns: [ { x:8, y:31, team:'atk', label:'공격 스폰' }, { x:94, y:31, team:'def', label:'수비 스폰' } ],
    labels: [ { x:26, y:27, t:'긴 다리 (저격 구간)' }, { x:26, y:43, t:'다리 아래 통로' }, { x:68, y:31, t:'터널' } ]
  },
  keyPoints: [
    '다리 위를 걸어서 건너지 마세요. 다리 아래 통로로 돌거나 방벽 뒤에 뭉쳐 한 번에.',
    '상점 2층을 잡으면 첫 구간이 끝납니다. 카트보다 2층이 먼저입니다.',
    '터널은 초크입니다. 터널 안에 5명이 뭉치면 궁 하나에 전멸합니다.'
  ],
  positions: [
    { id:'cr-p1', x:38, y:40, type:'basic', roles:['tank','dps','support'], heroes:[], situations:['basic','attack','fightStart'], tags:['safe','front'],
      title:'다리 아래 통로 출구', where:'다리 아래 통로를 지나 상점가로 올라오기 직전', why:'다리 위 저격 각을 완전히 피해서 상점가 바로 앞까지 옵니다. 뉴비에게 가장 안전한 첫 구간 진입로입니다.', when:'첫 한타. 팀 전체가 통로를 통해 여기 모입니다.', target:'없음. 모이는 자리입니다. 5명이 모이면 상점가로 한 번에 나갑니다.', leave:'5명이 모이면 카트 옆(cr-p2)과 2층(cr-p4)으로 나뉘어 진입.',
      good:['첫 한타 진입 전 리그룹'], bad:['한타가 이미 상점가에서 열렸을 때 (여기서 기다리면 4:5)'], caution:'통로 출구에 오래 서 있으면 상대 정커랫이 유탄을 굴립니다.',
      score:{ survive:9, angle:2, team:9, escape:9, pressure:2 } },
    { id:'cr-p2', x:40, y:31, type:'recommended', roles:['tank'], heroes:['라인하르트','시그마','오리사','라마트라'], situations:['basic','attack','fightStart'], tags:['front'],
      title:'다리 끝 (방벽 유지)', where:'다리 끝, 상점가로 들어가는 입구 옆', why:'상점가 정면과 2층을 동시에 볼 수 있고, 뒤에 다리 아래 통로가 후퇴로입니다.', when:'팀이 통로 출구에 모인 뒤 첫 진입.', target:'상점가 카트 옆 상대 탱커. 2층 상대 딜러는 우리 딜러 몫.', leave:'방벽이 깨지고 2층에 상대 딜러가 살아 있으면 통로로 후퇴.',
      whyAdv:'다리 끝은 상대 저격수의 마지막 각입니다. 방벽을 45°로 세워 2층 창문과 정면을 동시에 가리는 각이 있습니다.',
      good:['우리 딜러가 2층으로 올라갈 때 시선을 끌기'], bad:['팀이 아직 다리 위·통로 안에 있을 때'], caution:'다리 위로 다시 돌아가지 마세요.',
      score:{ survive:6, angle:5, team:8, escape:7, pressure:7 } },
    { id:'cr-p3', x:39, y:18, type:'recommended', roles:['dps'], heroes:['위도우메이커','애쉬','한조','소전'], situations:['defense','fightStart'], tags:['high','offangle'],
      title:'다리 끝 탑 (수비 저격)', where:'다리가 끝나는 곳 북쪽의 탑 위', why:'긴 다리 전체가 한눈에 보입니다. 수비 팀 저격수가 첫 킬을 내는 자리입니다.', when:'수비 첫 한타. 공격 팀이 스폰에서 나올 때부터.', target:'다리 위를 걸어오는 적. 힐러·딜러 우선.', leave:'상대 다이브(윈스턴·D.Va·겐지)가 탑 계단으로 오면 상점 2층으로 이동.',
      good:['공격 팀이 다리 위로 걸어올 때'], bad:['공격 팀이 다리 아래 통로로 우회했을 때 (여기서는 안 보입니다. 상점 2층으로)'], caution:'한 자리에서 2발 이상 쏘지 마세요. 위치가 들킵니다.',
      score:{ survive:7, angle:10, team:5, escape:6, pressure:9 } },
    { id:'cr-p4', x:50, y:18, type:'recommended', roles:['dps'], heroes:['소전','애쉬','솔저: 76','한조','캐서디'], situations:['basic','attack','defense','fightStart','advantage'], tags:['high','offangle'],
      title:'상점 2층', where:'상점가 북쪽 상점 건물 2층 창문', why:'상점가 전체와 터널 입구가 내려다보입니다. 공격이 여기를 뺏으면 첫 구간이 끝나고, 수비가 지키면 카트가 안 들어옵니다.', when:'공격: 통로 출구에서 카트가 상점가에 들어오기 전에. 수비: 다리 끝 탑을 뺏겼을 때.', target:'카트 옆 상대 탱커의 머리, 터널 입구 상대 힐러', leave:'상대 다이브가 계단을 오르면 계단 반대쪽 창문으로 뛰어내려 카트 옆으로.',
      whyAdv:'상점 2층은 다리 끝 탑과 터널을 잇는 축입니다. 여기를 가진 팀이 양쪽 오프앵글을 모두 갖습니다.',
      good:['카트가 상점가에 있을 때'], bad:['팀이 아직 통로 안에 있을 때'], caution:'창문 앞에 고정되지 마세요.',
      score:{ survive:6, angle:9, team:7, escape:6, pressure:9 } },
    { id:'cr-p5', x:26, y:40, type:'basic', roles:['support'], heroes:['아나','바티스트','메르시','키리코','일리아리'], situations:['basic','attack','fightStart'], tags:['safe','heal'],
      title:'다리 아래 통로 안', where:'다리 아래 통로 중간, 큰 힐팩 옆', why:'저격 각이 없고 큰 힐팩이 있습니다. 첫 한타 전 팀을 채우는 자리입니다.', when:'첫 진입 전 대기. 팀이 상점가로 나가면 통로 출구(cr-p1)로 따라갑니다.', target:'힐: 통로 출구의 탱커', leave:'팀이 상점가에서 밀리면 여기로 다시. 다리 위로는 절대 안 갑니다.',
      good:['첫 한타 준비'], bad:['팀이 이미 상점가에서 싸우는 중 (힐이 안 닿습니다)'], caution:'통로 안이 어두워 플랭커를 늦게 봅니다. 뒤를 자주 보세요.',
      score:{ survive:9, angle:2, team:7, escape:9, pressure:1 } },
    { id:'cr-p6', x:62, y:44, type:'recommended', roles:['dps'], heroes:['트레이서','겐지','리퍼','솜브라'], situations:['attack','advantage','enemyTankDead'], tags:['side','aggressive'],
      title:'상점 뒷길 출구 (터널 옆)', where:'상점가 남쪽 뒷길을 지나 터널 옆으로 나오는 곳', why:'터널 입구 뒤에 서는 상대 힐러의 옆·뒤가 보입니다. 상대는 상점가 정면을 보고 있습니다.', when:'우리 탱커가 카트를 상점가로 밀기 시작해 상대 시선이 정면에 묶였을 때.', target:'터널 입구 뒤 힐러. 한 명이 뒤를 돌아보면 성공.', leave:'뒷길이 돌아가는 유일한 길입니다. 상대 2명이 보면 즉시 뒷길로.',
      good:['상대 탱커 사망 후','5명 생존 + 카트 전진'], bad:['우리 팀이 통로 안에 있을 때','상대 포탑이 뒷길에 있을 때'], caution:'🔴 고급 루트. 뉴비는 cr-p4(2층)까지만.',
      score:{ survive:4, angle:8, team:4, escape:5, pressure:9 } },
    { id:'cr-p7', x:44, y:37, type:'basic', roles:['support','dps','tank'], heroes:[], situations:['disadvantage','ourTankDead'], tags:['retreat','safe'],
      title:'상점가 남쪽 코너 (후퇴 위치)', where:'상점가 남쪽 건물 모서리, 통로 출구 옆', why:'상대가 쫓아오려면 상점가 열린 공간을 건너야 합니다. 뒤에 통로가 있어 더 빠질 수 있습니다.', when:'탱커가 죽었거나 2명 이상 잘렸을 때.', target:'상점가를 건너오는 적만.', leave:'5명이 모이면 카트로 복귀. 더 밀리면 통로(cr-p5)로.',
      good:['4:5 이하'], bad:['이기고 있을 때'], caution:'후퇴 중 다리 위로 올라가지 마세요. 저격 각입니다.',
      score:{ survive:8, angle:4, team:8, escape:9, pressure:2 } },
    { id:'cr-p8', x:63, y:34, type:'recommended', roles:['tank'], heroes:['라인하르트','오리사','시그마','정커퀸'], situations:['attack','advantage'], tags:['front'],
      title:'터널 입구 (카트 옆)', where:'터널 입구 남쪽 벽 옆, 카트 옆', why:'터널은 초크입니다. 입구 벽 옆에서 방벽을 들면 카트가 터널을 통과할 시간이 생깁니다.', when:'상점가를 정리하고 카트가 터널에 닿을 때.', target:'터널 반대편 카지노 입구의 상대 탱커', leave:'터널 안에서 상대 궁 소리가 나면 즉시 상점가로.',
      good:['상점 2층을 우리가 잡은 뒤'], bad:['상대 궁(그라비·타이어·자폭)이 살아 있을 때 터널 안 진입'], caution:'터널 안에 5명이 뭉치지 마세요. 탱커만 앞, 나머지는 입구 밖.',
      score:{ survive:6, angle:4, team:8, escape:5, pressure:7 } },
    { id:'cr-p9', x:84, y:16, type:'recommended', roles:['dps'], heroes:['소전','애쉬','솔저: 76','트레이서','파라'], situations:['attack','defense','fightStart','advantage'], tags:['high','offangle'],
      title:'카지노 2층', where:'카지노 왼쪽 계단으로 오르는 2층 발코니', why:'종점 전체가 내려다보입니다. 수비의 마지막 자리이자 공격이 뺏어야 하는 자리.', when:'공격: 카트가 터널을 나오기 전에 먼저. 수비: 카트가 상점가를 벗어나는 순간.', target:'종점 뒤 상대 힐러, 카트 옆 탱커', leave:'상대 다이브가 계단을 오르면 반대편으로 내려가 카트 옆.',
      good:['카트가 카지노 안에 있을 때'], bad:['팀이 아직 터널 앞일 때'], caution:'발코니 난간 앞에 서지 마세요.',
      score:{ survive:6, angle:10, team:6, escape:5, pressure:9 } },
    { id:'cr-p10', x:70, y:33, type:'basic', roles:['support'], heroes:['아나','바티스트','메르시','키리코','루시우'], situations:['attack','advantage'], tags:['heal','safe'],
      title:'터널 안 카트 뒤', where:'터널 안, 카트 바로 뒤', why:'터널 벽이 양옆을 막아 정면만 신경 쓰면 됩니다. 카트가 정면을 가립니다.', when:'카트가 터널을 지나는 동안.', target:'힐: 터널 입구 탱커', leave:'상대 궁 소리 → 즉시 상점가로. 터널 안은 궁 표적입니다.',
      good:['카트 터널 통과 중'], bad:['상대 D.Va 자폭·정커랫 타이어가 있을 때'], caution:'터널 안 힐러는 플랭커에게 뒤를 잡히기 쉽습니다. 뒤를 보세요.',
      score:{ survive:7, angle:3, team:9, escape:5, pressure:2 } },
    { id:'cr-p11', x:56, y:36, type:'basic', roles:['support','dps','tank'], heroes:[], situations:['disadvantage','ourTankDead'], tags:['retreat','safe'],
      title:'상점가 뒤 (2구간 후퇴 위치)', where:'터널 앞 상점가 남쪽 벽 옆', why:'터널 초크를 상대가 넘어와야 합니다. 상점 2층에 우리 딜러가 있으면 초크가 두 방향에서 막힙니다.', when:'터널·카지노 한타에서 탱커가 죽었을 때.', target:'터널을 넘어오는 적만.', leave:'5명이 모이면 터널 입구로 재진입.',
      good:['4:5 이하'], bad:['이기고 있을 때'], caution:'후퇴는 다음 한타 준비입니다. 여기서 리그룹.',
      score:{ survive:8, angle:4, team:8, escape:8, pressure:2 } }
  ],
  routes: [
    { id:'cr-r1', level:'newbie', points:[[8,31],[12,32],[14,40],[38,40],[42,34]], roles:['tank','support','dps'], heroes:[], situations:['basic','attack','fightStart'],
      title:'🟢 기본 루트: 다리 아래 통로 → 상점가', from:'공격 스폰', via:'다리 아래 통로 (큰 힐팩)', to:'통로 출구(cr-p1) → 상점가', purpose:'저격 각을 완전히 피하는 가장 안전한 길입니다. 첫 한타는 무조건 이 길로.', caution:'통로가 길어 카트가 혼자 다리 위에 남습니다. 카트는 첫 한타를 이긴 뒤 밉니다.' },
    { id:'cr-r2', level:'side', points:[[42,34],[48,26],[48,22],[50,18]], roles:['dps'], heroes:['소전','애쉬','솔저: 76','한조','캐서디'], situations:['basic','attack','defense','fightStart'],
      title:'🟡 초보자 사이드: 상점가 → 상점 2층', from:'통로 출구', via:'상점 계단', to:'상점 2층(cr-p4)', purpose:'첫 구간의 승부처를 잡습니다. 팀이 정면 시선을 잡을 때 올라갑니다.', caution:'계단이 좁습니다. 상대 정커랫 덫·시메트라 포탑 주의.' },
    { id:'cr-r3', level:'flank', points:[[46,40],[54,48],[60,46],[62,44]], roles:['dps'], heroes:['트레이서','겐지','리퍼','솜브라'], situations:['attack','advantage','enemyTankDead'],
      title:'🔴 고급 플랭크: 상점 뒷길 → 터널 옆', from:'상점가 남쪽', via:'상점 뒷길', to:'터널 옆(cr-p6)', purpose:'터널 입구 뒤 힐러의 뒤로 나갑니다. 시선 분산.', caution:'돌아오는 길이 하나. 우리 5명 + 카트 전진 중일 때만.' },
    { id:'cr-r4', level:'side', points:[[74,31],[78,26],[78,21],[84,16]], roles:['dps'], heroes:['소전','애쉬','솔저: 76','트레이서'], situations:['attack','defense','fightStart'],
      title:'🟡 사이드: 터널 출구 → 카지노 2층', from:'터널 출구', via:'카지노 왼쪽 계단', to:'카지노 2층(cr-p9)', purpose:'마지막 구간 고지를 잡습니다.', caution:'터널을 나오자마자 계단으로. 카지노 바닥 중앙에 서지 마세요.' }
  ],
  highgrounds: [
    { id:'cr-h1', points:[[36,12],[42,12],[42,22],[36,22]], label:'다리 끝 탑', roles:['dps'], heroes:['위도우메이커','애쉬','한조'], pros:['긴 다리 전체 시야','수비 첫 킬 자리'], cons:['다이브에 고립','통로 우회를 못 봄'], caution:'공격 팀이 통로로 오면 상점 2층으로 옮기세요.' },
    { id:'cr-h2', points:[[44,10],[56,10],[56,22],[44,22]], label:'상점 2층', roles:['dps'], heroes:['소전','애쉬','솔저: 76','한조'], pros:['상점가·터널 입구 시야','첫 구간 승부처'], cons:['창문이 노출','계단 하나'], caution:'창문 앞 고정 금지.' },
    { id:'cr-h3', points:[[76,10],[92,10],[92,20],[76,20]], label:'카지노 2층', roles:['dps'], heroes:['소전','애쉬','솔저: 76','파라'], pros:['종점 전체 시야'], cons:['광역 궁에 취약','계단 하나'], caution:'궁 소리 → 계단.' }
  ],
  dangers: [
    { id:'cr-d1', points:[[12,28],[40,28],[40,34],[12,34]], label:'긴 다리 위', why:'수비 저격수가 다리 전체를 봅니다. 걸어서 건너면 한 명씩 잘립니다. 통로로 우회하거나 방벽 뒤에 뭉쳐 한 번에.', roles:['all'] },
    { id:'cr-d2', points:[[60,28],[66,28],[66,34],[60,34]], label:'터널 입구', why:'좁은 초크. 5명이 뭉치면 궁 하나에 전멸합니다. 탱커만 앞, 나머지는 입구 밖.', roles:['all'] },
    { id:'cr-d3', points:[[78,27],[90,27],[90,36],[78,36]], label:'카지노 바닥 중앙', why:'카지노 2층에서 내려다보는 열린 공간입니다. 2층을 먼저 잡거나 벽 옆으로.', roles:['all'] }
  ],
  covers: [
    { id:'cr-c1', x:41, y:33, w:2, h:2.5, label:'다리 끝 기둥' }, { id:'cr-c2', x:58, y:33, w:2.5, h:2, label:'상점가 차량' },
    { id:'cr-c3', x:76, y:34, w:2, h:2.5, label:'카지노 입구 기둥' }, { id:'cr-c4', x:86, y:36, w:3, h:2, label:'카지노 테이블' }
  ],
  packs: [
    { id:'cr-k1', x:24, y:43, size:'big', label:'다리 아래 큰 팩' }, { id:'cr-k2', x:68, y:25, size:'small', label:'터널 옆 작은 팩' }, { id:'cr-k3', x:88, y:42, size:'big', label:'카지노 큰 팩' }
  ],
  fights: [
    { id:'cr-f1', x:44, y:31, r:7, label:'다리 끝 · 상점가 입구', note:'통로로 우회한 팀이 상점 2층을 먼저 잡으면 이깁니다.' },
    { id:'cr-f2', x:64, y:31, r:5, label:'터널 입구', note:'초크 싸움. 궁 관리가 전부.' },
    { id:'cr-f3', x:84, y:31, r:7, label:'카지노 종점', note:'2층 싸움. 오버타임이 자주 납니다.' }
  ],
  quiz: [
    { id:'cr-q1', q:'첫 한타 전에 팀이 안전하게 모이는 자리는?', answer:'cr-p1', hint:'저격 각이 없는 통로 끝' },
    { id:'cr-q2', q:'첫 구간의 승부처, 딜러가 잡아야 할 고지는?', answer:'cr-p4', hint:'상점가와 터널 입구가 보이는 창문' },
    { id:'cr-q3', q:'수비 팀 위도우가 첫 킬을 노리는 자리는?', answer:'cr-p3', hint:'긴 다리가 한눈에 보이는 곳' },
    { id:'cr-q4', q:'터널 구간에서 탱커가 방벽을 들 자리는?', answer:'cr-p8', hint:'초크 입구 벽 옆' }
  ]
};
