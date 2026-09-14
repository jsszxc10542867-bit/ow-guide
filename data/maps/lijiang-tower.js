// 리장 타워 — 정원 (Lijiang Tower: Garden) — 쟁탈. 왼쪽 팀 관점 (대칭 맵)
TACTICAL_MAPS['lijiang-tower'] = {
  id:'lijiang-tower', name:'리장 타워 (정원)', en:'Lijiang Tower: Garden', mode:'control', side:'atk',
  intro:'거점 안에 5명이 설 필요가 없는 맵입니다. 정자 2층과 양쪽 발코니에서 싸우고, 거점에는 1명만 발을 걸치세요. 대칭 맵이라 상대도 같은 자리를 노립니다.',
  terrain: {
    roads: [
      { d:'M 6 31 L 24 31', w:8 },                      // 왼쪽 스폰 → 다리
      { d:'M 24 31 L 76 31', w:6 },                     // 중앙 다리·거점
      { d:'M 76 31 L 94 31', w:8 },                     // 오른쪽 스폰
      { d:'M 12 26 L 20 14 L 80 14 L 88 26', w:4 },     // 북쪽 정원 길
      { d:'M 12 36 L 20 48 L 80 48 L 88 36', w:4 },     // 남쪽 정원 길
      { d:'M 44 22 L 44 27 M 56 22 L 56 27', w:2.5 },   // 정자 2층 계단
      { d:'M 41 44 L 41 36 M 59 44 L 59 36', w:2.5 }    // 남쪽 발코니 계단
    ],
    buildings: [
      { x:26, y:18, w:12, h:8, label:'찻집' }, { x:62, y:18, w:12, h:8, label:'찻집' },
      { x:26, y:36, w:10, h:6 }, { x:64, y:36, w:10, h:6 },
      { x:42, y:8, w:16, h:6, label:'정자 뒤편' },
      { x:0, y:0, w:100, h:5 }, { x:0, y:56, w:100, h:6 }, { x:0, y:0, w:4, h:62 }, { x:96, y:0, w:4, h:62 },
      { x:8, y:8, w:8, h:12 }, { x:84, y:8, w:8, h:12 }, { x:8, y:42, w:8, h:12 }, { x:84, y:42, w:8, h:12 }
    ],
    stairs: [ { x:43, y:22, w:2.5, h:4 }, { x:55, y:22, w:2.5, h:4 }, { x:40, y:40, w:2.5, h:4 }, { x:58, y:40, w:2.5, h:4 } ],
    objectives: [ { type:'point', x:50, y:31, label:'거점 (정자)' } ],
    spawns: [ { x:8, y:31, team:'atk', label:'우리 스폰' }, { x:92, y:31, team:'def', label:'상대 스폰' } ],
    labels: [ { x:50, y:12, t:'북쪽 정원' }, { x:50, y:52, t:'남쪽 정원' }, { x:30, y:33, t:'다리' } ]
  },
  keyPoints: [
    '거점 안에 서지 마세요. 정자 2층·발코니에서 싸우고 1명만 발을 걸치면 게이지가 찹니다.',
    '99% 대 99%면 궁 개수가 승부입니다. 궁 없이 거점에 뛰어들지 마세요.',
    '대칭 맵입니다. 내가 좋은 자리라고 생각하는 곳은 상대도 노립니다. 먼저 도착하세요.'
  ],
  positions: [
    { id:'lj-p1', x:42, y:34, type:'recommended', roles:['tank'], heroes:['라인하르트','시그마','오리사','자리야'], situations:['basic','fightStart','attack','defense'], tags:['front'],
      title:'정자 정면 기둥', where:'다리를 건너 거점 바로 앞, 정자 왼쪽 기둥 옆', why:'기둥이 정면 화력을 가려 주고 거점에 발을 걸칠 수 있습니다. 여기서 라인을 잡으면 우리 딜러가 2층·발코니에 자리 잡을 시간이 생깁니다.', when:'첫 한타, 팀 5명이 다리 앞에 모였을 때.', target:'거점 안 상대 탱커. 밀어내기보다 버티며 우리 딜러가 각을 잡게 하는 것.', leave:'2층·발코니의 우리 딜러가 죽었거나 체력 40% 이하면 다리 뒤(lj-p4 옆)로.',
      whyAdv:'거점 중앙은 4방향 노출입니다. 기둥 옆은 남쪽 발코니 각을 끊어 상대 오프앵글 하나를 무효화합니다.',
      good:['우리 딜러가 2층에 올라간 뒤'], bad:['상대가 먼저 2층을 잡았을 때 (위에서 맞습니다)'], caution:'거점 중앙으로 걸어 들어가지 마세요.',
      score:{ survive:6, angle:5, team:9, escape:6, pressure:7 } },
    { id:'lj-p2', x:46, y:18, type:'recommended', roles:['dps'], heroes:['소전','애쉬','솔저: 76','한조','캐서디'], situations:['basic','fightStart','attack','defense'], tags:['high','offangle'],
      title:'정자 2층 통로', where:'북쪽 정원 길에서 계단으로 오르는 정자 2층', why:'거점 전체가 내려다보입니다. 이 맵의 승부처이며, 먼저 잡은 팀이 첫 한타를 이깁니다.', when:'한타 시작 전에 미리. 북쪽 정원 길로 올라갑니다.', target:'거점 안 상대 탱커의 머리, 다리 뒤 상대 힐러', leave:'상대 다이브가 반대편 계단으로 올라오면 우리 쪽 계단으로 내려가 정면 기둥 옆으로.',
      whyAdv:'2층은 양쪽 계단이 있어 상대도 올라옵니다. 통로 중앙이 아니라 우리 쪽 계단 옆에서 쏘면 이탈 경로가 유지됩니다.',
      good:['한타 시작 전','거점을 잡고 있을 때 (수비)'], bad:['상대 윈스턴·D.Va가 2층을 보고 있을 때','우리 탱커가 다리 뒤로 밀렸을 때'], caution:'통로 반대편 끝(상대 쪽)까지 가지 마세요. 상대 스폰이 가깝습니다.',
      score:{ survive:6, angle:10, team:7, escape:6, pressure:9 } },
    { id:'lj-p3', x:70, y:14, type:'recommended', roles:['dps'], heroes:['트레이서','겐지','솜브라','소전'], situations:['attack','advantage','enemyTankDead'], tags:['side','aggressive'],
      title:'북쪽 정원 끝 (상대 뒤)', where:'북쪽 정원 길을 끝까지 가서 상대 찻집 옆', why:'상대 힐러는 보통 오른쪽 다리 뒤에 섭니다. 여기서 그 힐러의 옆·뒤가 보입니다.', when:'우리 탱커가 거점 기둥에서 압박 중이고 상대 5명이 거점을 볼 때.', target:'상대 힐러의 시선. 한 명이 뒤를 돌아보면 성공입니다.', leave:'상대 스폰이 바로 옆입니다. 상대가 리스폰하면 즉시 북쪽 길로 복귀.',
      whyAdv:'대칭 맵의 후방은 상대 스폰과 붙어 있습니다. 리스폰 5초짜리 적을 상대로 오래 머무는 것은 손해입니다. 압박 → 이탈 5초 안에.',
      good:['상대 탱커 사망 직후','우리 5명 생존 + 궁 우위'], bad:['4:5 이하','상대가 방금 리스폰해서 이쪽으로 걸어올 때'], caution:'🔴 고급 루트. 상대 스폰 앞입니다. 뉴비는 lj-p2(2층)까지만.',
      score:{ survive:3, angle:8, team:4, escape:5, pressure:9 } },
    { id:'lj-p4', x:33, y:36, type:'basic', roles:['support'], heroes:['아나','바티스트','키리코','젠야타','메르시'], situations:['basic','fightStart','attack','defense'], tags:['safe','heal'],
      title:'우리 쪽 다리 뒤 건물 옆', where:'다리를 건너기 직전, 남쪽 작은 건물 모서리 옆', why:'정면 기둥의 탱커와 2층 딜러가 모두 힐 사거리 안이고, 건물이 남쪽 발코니 각을 막아 줍니다.', when:'탱커가 기둥에 자리 잡을 때 같이.', target:'힐: 기둥의 탱커 / 딜: 거점 앞으로 나온 적', leave:'탱커가 다리 뒤로 밀리면 스폰 앞 계단(lj-p5)으로.',
      good:['팀이 기둥·2층에 자리 잡았을 때'], bad:['상대 플랭커가 남쪽 정원 길로 오는 것을 봤을 때'], caution:'다리 위에 서지 마세요. 양쪽 발코니에서 다 보입니다.',
      score:{ survive:8, angle:5, team:9, escape:8, pressure:3 } },
    { id:'lj-p5', x:18, y:31, type:'basic', roles:['support','dps','tank'], heroes:[], situations:['disadvantage','ourTankDead'], tags:['retreat','safe'],
      title:'우리 스폰 앞 (후퇴 위치)', where:'스폰 문 바로 앞 넓은 공간', why:'상대가 다리를 건너와야 우리를 칠 수 있습니다. 스폰이 가까워 리스폰한 팀원과 바로 합류됩니다.', when:'탱커가 죽었거나 2명 이상 잘렸을 때.', target:'다리를 건너오는 적만.', leave:'5명이 모이면 다리 앞으로 재진입.',
      good:['4:5 이하','상대 궁이 살아 있을 때'], bad:['우리가 거점 99%로 이기고 있을 때 (거점을 비우면 안 됩니다)'], caution:'쟁탈은 오버타임 거점 사수가 예외입니다. 99% 상황이면 1명은 거점에 발을 걸치세요.',
      score:{ survive:9, angle:3, team:8, escape:10, pressure:1 } },
    { id:'lj-p6', x:40, y:46, type:'basic', roles:['dps','support'], heroes:['솔저: 76','캐서디','바티스트','일리아리'], situations:['basic','attack','defense'], tags:['offangle','high'],
      title:'남쪽 발코니 (오프앵글)', where:'남쪽 정원 길에서 계단으로 오르는 우리 쪽 발코니', why:'거점을 옆에서 봅니다. 상대가 정면 기둥과 2층을 보고 있으면 여기서는 아무도 나를 안 봅니다.', when:'2층에 이미 우리 딜러 한 명이 있을 때 두 번째 딜러 자리.', target:'거점 안 적의 옆구리, 2층으로 올라가는 적', leave:'상대가 남쪽 길로 돌아오는 것이 보이면 내려가 팀 옆으로.',
      whyAdv:'2층(정면 위)과 발코니(측면)의 십자 화력이면 상대는 어느 쪽도 엄폐할 수 없습니다.',
      good:['우리 딜러 둘이 2층과 발코니로 나뉠 때'], bad:['혼자 발코니에 있고 2층에 아무도 없을 때'], caution:'발코니는 상대 쪽 발코니와 마주 봅니다. 상대 저격수가 반대편에 있으면 자리를 옮기세요.',
      score:{ survive:6, angle:8, team:6, escape:7, pressure:7 } },
    { id:'lj-p7', x:50, y:35, type:'recommended', roles:['tank'], heroes:['라인하르트','오리사','정커퀸','윈스턴'], situations:['advantage','enemyTankDead'], tags:['front','aggressive'],
      title:'거점 안 오른쪽 기둥 (점령)', where:'거점 안쪽, 상대 쪽 다리를 보는 기둥 옆', why:'상대 탱커가 죽었거나 우리가 유리하면 거점을 실제로 잡아야 합니다. 이 기둥은 상대 다리를 막는 자리입니다.', when:'첫 킬이 났거나 상대 탱커가 죽었을 때.', target:'상대 다리를 건너오는 적. 초크에서 막습니다.', leave:'상대가 리스폰해서 5명이 되었고 우리 궁이 없으면 정면 기둥(lj-p1)으로.',
      good:['5:4 이상','상대 탱커 사망'], bad:['5:5 팽팽할 때 (거점 안은 사방 노출)'], caution:'거점 중앙이 아니라 기둥 옆입니다.',
      score:{ survive:5, angle:6, team:8, escape:5, pressure:9 } },
    { id:'lj-p8', x:48, y:40, type:'basic', roles:['support'], heroes:['루시우','키리코','브리기테','모이라'], situations:['advantage','enemyTankDead'], tags:['heal','safe'],
      title:'정자 남쪽 기둥 뒤 (거점 잡은 후)', where:'거점 남쪽 가장자리, 정자 기둥 뒤', why:'거점을 잡은 뒤 탱커와 발코니 딜러 사이. 정자 기둥이 상대 다리 방향 화력을 가려 줍니다.', when:'거점을 잡고 상대 리스폰을 기다릴 때.', target:'힐: 거점 안 탱커 / 딜: 다리를 건너오는 적', leave:'상대 5명이 다리를 건너 밀고 오면 우리 쪽 다리 뒤(lj-p4)로.',
      good:['거점 점령 중'], bad:['상대가 남쪽 정원 길로 돌아올 때'], caution:'거점 게이지를 채우는 건 1명이면 됩니다. 힐러가 거점 중앙에 서지 마세요.',
      score:{ survive:7, angle:5, team:9, escape:6, pressure:3 } }
  ],
  routes: [
    { id:'lj-r1', level:'newbie', points:[[8,31],[24,31],[42,34]], roles:['tank','support'], heroes:[], situations:['basic','fightStart','attack','defense'],
      title:'🟢 기본 루트: 다리 → 정자 정면 기둥', from:'우리 스폰', via:'다리', to:'정자 정면 기둥(lj-p1)', purpose:'가장 짧고 팀이 함께 가는 길입니다.', caution:'다리 위에서 멈추지 마세요. 양쪽 발코니에서 보입니다. 건너서 기둥까지.' },
    { id:'lj-r2', level:'side', points:[[12,26],[20,14],[40,14],[44,22],[46,18]], roles:['dps'], heroes:['소전','애쉬','솔저: 76','한조','캐서디'], situations:['basic','fightStart','attack','defense'],
      title:'🟡 초보자 사이드: 북쪽 정원 → 정자 2층', from:'우리 스폰', via:'북쪽 정원 길 · 찻집 옆 · 계단', to:'정자 2층(lj-p2)', purpose:'이 맵의 승부처인 2층 고지를 먼저 잡습니다.', caution:'한타 전에 미리. 큰 힐팩이 길에 있으니 먹으며 갑니다.' },
    { id:'lj-r3', level:'flank', points:[[46,14],[60,12],[70,14],[74,22]], roles:['dps'], heroes:['트레이서','겐지','솜브라'], situations:['attack','advantage','enemyTankDead'],
      title:'🔴 고급 플랭크: 북쪽 길 끝 → 상대 다리 뒤', from:'정자 2층 옆', via:'북쪽 정원 길 상대 쪽', to:'상대 찻집 옆(lj-p3)', purpose:'상대 힐러의 뒤를 흔듭니다. 시선 분산이 목적, 킬은 덤입니다.', caution:'상대 스폰 바로 옆입니다. 5초 압박 후 무조건 이탈. 우리 팀이 4명이면 가지 않습니다.' },
    { id:'lj-r4', level:'side', points:[[12,36],[20,48],[38,48],[41,44],[40,46]], roles:['dps','support'], heroes:['솔저: 76','캐서디','바티스트'], situations:['basic','attack','defense'],
      title:'🟡 사이드: 남쪽 정원 → 발코니', from:'우리 스폰', via:'남쪽 정원 길 · 계단', to:'남쪽 발코니(lj-p6)', purpose:'두 번째 딜러의 오프앵글 자리입니다.', caution:'2층에 아무도 없으면 발코니보다 2층이 먼저입니다.' }
  ],
  highgrounds: [
    { id:'lj-h1', points:[[42,15],[58,15],[58,22],[42,22]], label:'정자 2층 통로', roles:['dps'], heroes:['소전','애쉬','솔저: 76','한조'], pros:['거점 전체 시야','첫 한타의 승부처'], cons:['양쪽 계단으로 상대도 올라옴','통로가 좁아 광역 궁에 취약'], caution:'우리 쪽 계단 옆에서 쏘세요. 반대편 끝은 상대 땅입니다.' },
    { id:'lj-h2', points:[[36,43],[46,43],[46,50],[36,50]], label:'남쪽 발코니 (우리 쪽)', roles:['dps','support'], heroes:['솔저: 76','캐서디','바티스트'], pros:['거점 측면 오프앵글','상대가 정면을 볼 때 안 보임'], cons:['반대편 발코니와 마주 봄','혼자면 고립'], caution:'상대 발코니에 저격수가 있으면 옮기세요.' },
    { id:'lj-h3', points:[[54,43],[64,43],[64,50],[54,50]], label:'남쪽 발코니 (상대 쪽)', roles:['dps'], heroes:['트레이서','겐지'], pros:['상대 다리 뒤가 보임'], cons:['상대 스폰이 가까움'], caution:'유리할 때만.' }
  ],
  dangers: [
    { id:'lj-d1', points:[[46,27],[54,27],[54,35],[46,35]], label:'거점 정중앙', why:'2층·양쪽 발코니·양쪽 다리, 사방에서 보입니다. 게이지는 가장자리에서 1명이 걸쳐도 찹니다.', roles:['all'] },
    { id:'lj-d2', points:[[24,29],[38,29],[38,33],[24,33]], label:'다리 위', why:'양쪽 발코니에서 내려다보이는 열린 길입니다. 멈추지 말고 건너세요.', roles:['all'] },
    { id:'lj-d3', points:[[62,29],[76,29],[76,33],[62,33]], label:'상대 쪽 다리', why:'상대 스폰 앞입니다. 여기서 싸우면 상대 리스폰 5초·우리 20초입니다.', roles:['all'] }
  ],
  covers: [
    { id:'lj-c1', x:41, y:33, w:2, h:2.5, label:'정자 기둥' }, { id:'lj-c2', x:57, y:33, w:2, h:2.5, label:'정자 기둥' },
    { id:'lj-c3', x:49, y:39, w:2, h:2, label:'남쪽 기둥' }, { id:'lj-c4', x:36, y:35, w:2, h:2, label:'건물 모서리' }
  ],
  packs: [
    { id:'lj-k1', x:30, y:12, size:'big', label:'북쪽 정원 큰 팩' }, { id:'lj-k2', x:70, y:12, size:'big', label:'북쪽 정원 큰 팩(상대 쪽)' }, { id:'lj-k3', x:50, y:52, size:'small', label:'남쪽 작은 팩' }
  ],
  fights: [
    { id:'lj-f1', x:50, y:31, r:9, label:'거점 정자', note:'2층을 먹은 팀이 이깁니다.' },
    { id:'lj-f2', x:50, y:18, r:5, label:'정자 2층', note:'양쪽 계단에서 올라오는 다이브 싸움.' }
  ],
  quiz: [
    { id:'lj-q1', q:'이 맵의 첫 한타 승부처, 딜러가 먼저 잡아야 할 고지는?', answer:'lj-p2', hint:'거점 전체가 내려다보이는 곳' },
    { id:'lj-q2', q:'탱커가 첫 한타에서 라인을 잡을 자리는?', answer:'lj-p1', hint:'거점 바로 앞, 기둥 옆' },
    { id:'lj-q3', q:'트레이서가 상대 힐러의 뒤를 흔들 수 있는 고급 위치는?', answer:'lj-p3', hint:'북쪽 정원 길 끝' },
    { id:'lj-q4', q:'2명 이상 죽었을 때 물러나서 리그룹할 곳은?', answer:'lj-p5', hint:'상대가 다리를 건너와야 하는 곳' }
  ]
};
