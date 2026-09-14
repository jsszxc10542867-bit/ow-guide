// 왕의 길 (King's Row) — 혼합. 실제 오버헤드 이미지(StatBanana) 위 전술 데이터.
// 좌표: 원본 이미지 픽셀(1000×989)을 P()로 0~1 정규화. 이미지 방향: 공격 스폰 = 우하단, A 거점 = 우하단 광장(파란 원), B 종점 = 좌상단 공장.
// TODO: Verify coordinates against actual King's Row overhead image — 아래 verified:false 항목은 인게임 확인 후 좌표 보정 필요.
(function () {
  const W = 1000, H = 989;
  const P = (x, y) => ({ x: x / W, y: y / H });
  const poly = pts => pts.map(([x, y]) => [x / W, y / H]);

  TACTICAL_MAPS['kings-row'] = {
    id: 'kings-row', name: '왕의 길', en: "King's Row", mode: 'hybrid', side: 'atk',
    intro: '1거점(광장)은 정문 정면 돌파가 아니라 호텔 2층을 먼저 잡는 맵입니다. 거리 구간은 카트 옆·뒤에서, 마지막 공장은 2층 통로가 승부처입니다.',
    keyPoints: [
      '1거점은 정문이 아니라 호텔 2층을 먼저 잡으세요. 위에서 보면 광장 전체가 보입니다.',
      '거리 구간은 카트 옆·뒤에 붙으세요. 거리 한가운데 서면 저격의 표적입니다.',
      '이긴 뒤 상대 스폰 쪽으로 걷지 마세요. 공장 문 앞까지가 추격 한계선입니다.'
    ],
    spawns: [
      { id: 'kr-s-atk', ...P(800, 830), team: 'atk', label: '공격 스폰', verified: false },
      { id: 'kr-s-def', ...P(95, 150), team: 'def', label: '수비 스폰', verified: false }
    ],
    objectives: [
      { id: 'kr-o-a', type: 'point', ...P(785, 685), label: 'A 거점', verified: true },
      { id: 'kr-o-b', type: 'point', ...P(160, 160), label: 'B 종점', verified: false },
      { id: 'kr-o-cart', type: 'cart', points: poly([[760, 690], [700, 600], [640, 530], [590, 470], [540, 430], [470, 400], [420, 340], [360, 275], [300, 225], [230, 190], [170, 165]]), label: '카트 경로', verified: false }
    ],
    positions: [
      { id: 'kr-p1', ...P(740, 722), type: 'main', roles: ['tank'], heroes: ['라인하르트', '오리사', '시그마'], situations: ['basic', 'attackStart', 'fightStart', 'objective'], tags: ['front'], verified: false,
        title: 'A 거점 남쪽 기둥 (메인)', where: '광장 남쪽 입구를 지나자마자 기둥 옆', why: '기둥이 엄폐가 되고 광장 전체가 보이면서 라인을 잡을 수 있습니다.', when: '팀 5명이 광장 입구에 모였을 때 첫 번째로 들어갑니다.', target: '거점 안 상대 탱커의 위치. 킬이 아니라 공간이 목적입니다.', leave: '방벽 30% 이하거나 뒤에 팀이 없으면 입구 밖으로.',
        whyAdv: '입구 초크를 지나자마자 기둥이 LOS를 끊어 줍니다. 호텔 2층 딜러와 같은 타이밍에 들어가면 상대 화력이 둘로 나뉩니다.',
        advantages: ['기둥 엄폐', '광장 전체 시야', '후퇴로(입구)가 바로 뒤'], risks: ['광장 중앙까지 나가면 세 방향 노출', '팀이 아직 스폰이면 혼자 녹음'],
        good: ['호텔 2층에 우리 딜러가 올라간 뒤', '상대 생존기(스즈·불사)가 빠졌을 때'], bad: ['팀이 아직 스폰에서 걸어오는 중', '상대 바스티온이 정면을 보고 있을 때'], caution: '기둥을 지나 광장 중앙까지 나가지 마세요.',
        score: { survive: 7, angle: 5, team: 9, escape: 7, pressure: 7 } },
      { id: 'kr-p2', ...P(632, 655), type: 'main', roles: ['dps'], heroes: ['애쉬', '솔저: 76', '소전', '위도우메이커', '한조'], situations: ['basic', 'fightStart', 'attackStart', 'defense', 'objective'], tags: ['high', 'offangle'], verified: false,
        title: '호텔 2층 발코니', where: '광장 서쪽 호텔 2층, 거점을 내려다보는 발코니', why: '광장 전체가 보이고 아래에서는 머리만 보입니다. 이 자리를 먹은 팀이 1거점을 가져갑니다.', when: '한타가 열리기 전에 미리. 한타 중에 계단을 오르면 잘립니다.', target: '거점 안 상대 힐러, 입구를 보고 있는 상대 딜러', leave: '상대 다이브가 계단으로 올라오거나 아래 팀이 무너지면 즉시 내려갑니다.',
        whyAdv: '입구 초크와 90° 오프앵글이라 상대는 입구와 발코니를 동시에 볼 수 없습니다. 발코니 딜러의 첫 킬이 입구를 엽니다.',
        advantages: ['높은 시야', '엄폐 가능', '본대 지원 가능'], risks: ['다이브에 취약', '혼자 오래 있으면 위험'],
        good: ['우리 탱커가 기둥에서 라인을 잡을 때', '수비면 한타 시작 전 항상'], bad: ['우리 탱커가 후퇴 중일 때', '상대 윈스턴이 점프 쿨을 들고 발코니를 볼 때'], caution: '난간 앞에 계속 서 있지 마세요. 쏘고 → 한 발 뒤로.',
        score: { survive: 7, angle: 9, team: 7, escape: 6, pressure: 8 } },
      { id: 'kr-p3', ...P(600, 612), type: 'side', roles: ['dps'], heroes: ['트레이서', '겐지', '소전', '솜브라'], situations: ['fightStart', 'attackStart', 'enemyTankIn', 'sidePush', 'enemyDead'], tags: ['side', 'aggressive'], verified: false,
        title: '호텔 옆 골목 → 거점 북쪽 (사이드)', where: '호텔 북쪽 옆 골목 끝, 거점 뒤편이 보이는 곳', why: '상대 힐러는 보통 거점 북쪽 계단 근처에 섭니다. 여기서는 그 힐러의 옆·뒤가 보입니다.', when: '우리 탱커가 입구에서 압박을 시작해 상대 5명이 입구를 볼 때.', target: '상대 힐러의 시선과 생존기. 킬이 아니라 상대 2명이 뒤를 돌아보게 만드는 것.', leave: '이탈기를 썼거나 상대 브리기테·캐서디가 나를 보기 시작하면 골목으로 복귀.',
        whyAdv: '사이드는 수단입니다. 정면 압박과 동시에 힐러를 흔들면 힐러가 힐 대신 도망을 선택하고 정면 탱커가 녹습니다.',
        advantages: ['상대 힐러 시선 분산', '골목이 이탈로'], risks: ['거점 뒤까지 깊게 가면 돌아올 길이 하나', '팀이 4명이면 고립'],
        good: ['우리 5명 생존 + 탱커가 정면 압박 중', '상대 브리기테 밀쳐내기가 빠졌을 때'], bad: ['우리 팀 4명 이하', '우리 탱커 후퇴 중', '상대가 이미 골목을 보고 있을 때'], caution: '이탈기 없이 거점 뒤로 내려가지 마세요.',
        score: { survive: 5, angle: 8, team: 5, escape: 6, pressure: 9 } },
      { id: 'kr-p4', ...P(690, 760), type: 'safe', roles: ['support'], heroes: ['아나', '바티스트', '키리코', '메르시', '젠야타'], situations: ['basic', 'fightStart', 'attackStart', 'objective'], tags: ['safe', 'heal'], verified: false,
        title: '광장 남서 건물 안 코너', where: '광장 남쪽 입구 옆 건물 입구 안쪽 벽 뒤', why: '기둥의 탱커와 호텔 발코니 딜러가 모두 시야에 들어오면서 상대에게는 벽에 가려집니다.', when: '탱커가 기둥에 자리 잡는 순간 같이 들어갑니다.', target: '힐: 지금 맞고 있는 사람 / 딜: 입구 앞으로 나온 적', leave: '탱커가 입구 밖으로 후퇴하면 같이. 플랭커가 남쪽 골목으로 오면 탱커 옆으로.',
        advantages: ['벽 엄폐', '탱커·발코니 모두 힐 사거리'], risks: ['건물 안으로 너무 들어가면 발코니에 힐이 안 닿음'],
        good: ['팀이 기둥·발코니에 자리 잡았을 때'], bad: ['상대 트레이서·겐지가 남쪽으로 도는 것을 봤을 때'], caution: '건물 안쪽 깊이 들어가지 마세요.',
        score: { survive: 8, angle: 5, team: 9, escape: 8, pressure: 3 } },
      { id: 'kr-p5', ...P(762, 790), type: 'retreat', roles: ['support', 'dps', 'tank'], heroes: [], situations: ['allyDead', 'regroup'], tags: ['retreat', 'safe'], verified: false,
        title: '스폰 앞 거리 (후퇴 위치)', where: '광장 남쪽 입구 바깥, 스폰 방향 벽 뒤', why: '상대가 광장에서 넘어오려면 입구 초크를 지나야 합니다. 여기서 기다리면 상대가 초크에서 맞습니다.', when: '우리 탱커가 죽었거나 2명 이상 잘렸을 때. "빠져요" 콜과 함께.', target: '초크를 넘어오는 적만. 넘어오지 않으면 싸우지 않습니다.', leave: '5명이 모이면 kr-p1으로 재진입.',
        advantages: ['스폰이 가까움', '상대가 초크를 지나야 함'], risks: ['이기고 있을 때 여기 있으면 압박이 끊김'],
        good: ['4:5 이하', '상대 궁이 살아 있어 뭉치면 안 될 때'], bad: ['이미 이기고 있을 때'], caution: '후퇴는 도망이 아니라 다음 한타 준비입니다.',
        score: { survive: 9, angle: 4, team: 8, escape: 9, pressure: 2 } },
      { id: 'kr-p6', ...P(640, 540), type: 'main', roles: ['tank'], heroes: ['라인하르트', '오리사', '정커퀸', '라마트라'], situations: ['attackStart', 'objective', 'enemyDead'], tags: ['front'], verified: false,
        title: '카트 옆 (거리 구간)', where: '카트 진행 방향 오른쪽 옆, 살짝 앞', why: '카트가 엄폐물입니다. 카트 위에 서면 광역 궁 표적이지만 옆에 붙으면 회복도 되고 방벽도 아낍니다.', when: 'A 거점을 먹은 직후 팀이 카트에 모였을 때.', target: '거리 2층 창문에서 쏘는 상대 딜러 위치. 방벽으로 팀을 가리며 전진.', leave: '2층에서 계속 맞으면 카트를 멈추고 우리 딜러가 2층을 정리할 때까지 대기.',
        advantages: ['카트 회복', '카트 엄폐'], risks: ['카트보다 10m 앞서면 회복 범위 밖'],
        good: ['상대 탱커가 죽었을 때'], bad: ['우리 딜러가 아직 스폰일 때'], caution: '카트보다 앞서지 마세요.',
        score: { survive: 7, angle: 5, team: 9, escape: 6, pressure: 7 } },
      { id: 'kr-p7', ...P(590, 335), type: 'main', roles: ['dps'], heroes: ['애쉬', '솔저: 76', '한조', '소전', '파라'], situations: ['attackStart', 'defense', 'fightStart', 'objective'], tags: ['high'], verified: false,
        title: '거리 2층 창문', where: '거리 북쪽 건물 2층, 카트 도로를 내려다보는 창문', why: '카트 도로와 다리 아래 입구가 내려다보입니다. 수비의 핵심 자리이자 공격이 뺏어야 하는 자리입니다.', when: '공격은 카트가 거리에 들어오기 전에 먼저. 수비는 카트가 A를 벗어나는 순간.', target: '다리 아래 상대 힐러, 카트 옆 탱커의 머리', leave: '상대 다이브가 계단으로 오거나 팀이 카트에서 밀려나면 내려갑니다.',
        advantages: ['도로 전체 시야'], risks: ['창문이 저격수에게 노출', '팀과 멀어지기 쉬움'],
        good: ['카트가 거리 구간에 있을 때'], bad: ['우리 팀이 아직 A 근처일 때'], caution: '창문 앞에 고정되지 마세요.',
        score: { survive: 6, angle: 9, team: 6, escape: 6, pressure: 8 } },
      { id: 'kr-p8', ...P(515, 490), type: 'side', roles: ['dps'], heroes: ['트레이서', '겐지', '리퍼', '솜브라'], situations: ['attackStart', 'enemyDead', 'sidePush', 'enemyTankIn'], tags: ['side', 'aggressive'], verified: false,
        title: '왼쪽 골목 출구 (거리 뒤)', where: '거리 남쪽 골목을 지나 다리 아래 입구 뒤로 나오는 곳', why: '다리 아래에 서는 상대 힐러·딜러의 뒤가 보입니다. 상대는 카트를 보고 있어 뒤를 놓칩니다.', when: '우리 탱커가 카트로 거리를 밀기 시작해 상대 시선이 카트에 묶였을 때.', target: '다리 아래 힐러. 못 잡아도 2명이 뒤를 보게 만들기.', leave: '골목 되돌아가는 길이 하나입니다. 상대 2명이 돌아보면 즉시.',
        whyAdv: '카트 정면 압박 + 골목 후방 압박이면 상대 힐러는 힐·도주 중 하나를 포기해야 합니다.',
        advantages: ['후방 시선 분산'], risks: ['왕복 20초', '포탑이 골목에 있으면 진입 불가'],
        good: ['상대 탱커 사망 후 마무리', '우리 5명 + 카트 전진 중'], bad: ['우리 팀이 밀리는 중', '상대 포탑이 골목에 있을 때'], caution: '🔴 고급 루트. 뉴비는 2층 창문(kr-p7)을 먼저.',
        score: { survive: 4, angle: 8, team: 4, escape: 4, pressure: 10 } },
      { id: 'kr-p9', ...P(665, 585), type: 'safe', roles: ['support'], heroes: ['아나', '바티스트', '메르시', '키리코', '루시우'], situations: ['attackStart', 'objective', 'basic', 'enemyDead'], tags: ['safe', 'heal'], verified: false,
        title: '카트 뒤 코너', where: '카트 뒤, 남쪽 건물 모서리 옆', why: '카트가 정면 화력을 가려 주고 2층 딜러와 탱커가 모두 힐 사거리 안입니다.', when: '카트가 움직이면 같이. 항상 카트 뒤.', target: '힐: 카트 옆 탱커 / 딜: 2층 창문에 보이는 적', leave: '카트가 멈추고 팀이 후퇴하면 A 거점 뒤로. 카트 앞으로는 절대 안 나갑니다.',
        advantages: ['카트 엄폐', '탱커·2층 힐 사거리'], risks: ['플랭커가 남쪽 골목에서 나옴'],
        good: ['카트 전진 중'], bad: ['상대 플랭커가 골목에서 나올 때'], caution: '카트 위에 서지 마세요.',
        score: { survive: 8, angle: 4, team: 9, escape: 7, pressure: 3 } },
      { id: 'kr-p10', ...P(330, 252), type: 'main', roles: ['tank'], heroes: ['라인하르트', '시그마', '오리사', '라마트라'], situations: ['attackStart', 'fightStart', 'objective'], tags: ['front'], verified: false,
        title: '공장 입구 기둥', where: '공장 입구를 지나자마자 기둥 옆', why: '공장 안은 좁아 문 앞이 초크입니다. 문 안 기둥을 잡으면 팀이 들어올 공간이 생깁니다.', when: '우리 딜러가 2층 통로(kr-p11)에 올라간 것을 확인한 뒤.', target: '2층 통로의 상대 딜러 위치, 종점 앞 상대 탱커', leave: '방벽이 깨지고 2층 우리 딜러가 죽었으면 문 밖으로.',
        advantages: ['기둥 엄폐', '팀 진입 공간'], risks: ['문 앞 5명 뭉치면 궁 표적'],
        good: ['우리 궁 우위'], bad: ['상대 궁(그라비·타이어)이 살아 있을 때'], caution: '문 앞에서 뭉쳐 대기하지 마세요.',
        score: { survive: 6, angle: 5, team: 9, escape: 5, pressure: 8 } },
      { id: 'kr-p11', ...P(262, 192), type: 'main', roles: ['dps'], heroes: ['소전', '애쉬', '솔저: 76', '트레이서', '겐지'], situations: ['attackStart', 'defense', 'fightStart', 'objective', 'enemyDead'], tags: ['high', 'offangle'], verified: false,
        title: '공장 2층 통로', where: '공장 안 계단으로 오르는 2층 통로', why: '종점 전체가 내려다보입니다. 수비가 여기 있으면 카트가 안 들어오고, 공격이 뺏으면 종점이 열립니다.', when: '공격: 카트가 공장 문에 닿기 전에 미리. 수비: 카트가 거리를 지나는 순간.', target: '종점 뒤 상대 힐러, 카트 옆 탱커', leave: '상대 다이브가 계단을 오르면 통로 반대편으로 이동 후 내려가기.',
        advantages: ['종점 전체 시야'], risks: ['좁고 길어 광역 궁에 취약'],
        good: ['카트가 공장 안에 있을 때'], bad: ['우리 팀이 문 앞에서 밀리는 중'], caution: '궁 소리가 나면 계단으로.',
        score: { survive: 6, angle: 10, team: 6, escape: 5, pressure: 9 } },
      { id: 'kr-p12', ...P(472, 412), type: 'retreat', roles: ['support', 'dps', 'tank'], heroes: [], situations: ['allyDead', 'regroup', 'retake'], tags: ['retreat', 'safe'], verified: false,
        title: '다리 아래 통로 (후퇴·리테이크)', where: '거리 끝 다리 아래 통로 안, 힐팩 옆', why: '입구가 좁아 상대가 쫓아오기 어렵고 힐팩이 옆에 있습니다. 공장 앞 한타를 다시 열 때 모이는 자리이기도 합니다.', when: '공장 앞 한타에서 탱커가 죽었거나 2명 이상 잘렸을 때.', target: '입구로 쫓아오는 적만.', leave: '팀 5명이 모이면 카트로 복귀.',
        advantages: ['힐팩', '좁은 입구'], risks: ['안에서 5명 뭉치면 궁 표적'],
        good: ['4:5 이하', '리테이크 준비'], bad: ['이기고 있을 때'], caution: '힐만 받고 흩어지세요.',
        score: { survive: 9, angle: 3, team: 7, escape: 8, pressure: 2 } },
      { id: 'kr-p13', ...P(722, 620), type: 'defense', roles: ['tank'], heroes: ['라인하르트', '오리사', '시그마'], situations: ['defense'], tags: ['front'], verified: false,
        title: '거점 북쪽 계단 앞 (수비)', where: 'A 거점 북쪽, 거리로 이어지는 계단 앞', why: '남쪽 입구·호텔 양쪽에서 오는 적을 모두 볼 수 있고, 뒤에 후퇴로(거리)가 있습니다.', when: '수비 첫 한타. 호텔 2층 우리 딜러와 같은 타이밍.', target: '입구를 넘어오는 상대 탱커. 초크에서 막습니다.', leave: '호텔 2층을 뺏기면 거점을 버리고 거리 구간으로.',
        advantages: ['양쪽 진입로 시야', '후퇴로 확보'], risks: ['호텔 2층을 뺏기면 위에서 맞음'],
        good: ['호텔 2층에 우리 딜러가 있을 때'], bad: ['호텔 2층을 상대가 잡았을 때'], caution: '거점 정중앙에 서지 마세요.',
        score: { survive: 7, angle: 6, team: 8, escape: 8, pressure: 6 } },
      { id: 'kr-p14', ...P(522, 456), type: 'defense', roles: ['dps', 'support'], heroes: ['위도우메이커', '애쉬', '바티스트', '한조'], situations: ['defense', 'retake'], tags: ['high', 'offangle'], verified: false,
        title: '거리 다리 위 (수비)', where: '거리 끝을 가로지르는 다리 위', why: '거리 전체를 정면으로 내려다봅니다. 카트가 거리를 지나는 동안 수비 저격수의 자리입니다.', when: '카트가 A를 벗어나 거리로 들어올 때.', target: '카트 옆 탱커, 거리로 나오는 딜러', leave: '상대가 다리 아래 통로로 우회해 올라오면 공장 2층으로.',
        advantages: ['거리 정면 시야'], risks: ['왼쪽 골목 우회에 취약'],
        good: ['카트가 거리에 있을 때'], bad: ['상대 플랭커가 골목으로 올라올 때'], caution: '한 자리에서 2발 이상 쏘지 마세요.',
        score: { survive: 6, angle: 9, team: 6, escape: 6, pressure: 8 } }
    ],
    routes: [
      { id: 'kr-r1', level: 'newbie', points: poly([[800, 830], [772, 770], [758, 728], [740, 722]]), roles: ['tank', 'support'], heroes: [], situations: ['basic', 'fightStart', 'attackStart'], verified: false,
        title: '기본 루트: 스폰 → 광장 남쪽 기둥', from: '공격 스폰', via: '남쪽 거리', to: '광장 남쪽 기둥(kr-p1)', purpose: '팀이 함께 들어가는 가장 안전한 길입니다. 처음엔 이 길만.',
        useWhen: '첫 한타, 팀 5명이 모여서 이동할 때.', avoidWhen: '없음 — 항상 쓸 수 있는 길입니다. 단, 입구에서 멈추지 마세요.', needs: ['팀 5명'], escape: '왔던 길로 스폰 방향.', distance: '본대와 항상 같이.', caution: '입구 초크에서 멈추면 유탄이 떨어집니다. 지나서 기둥까지.' },
      { id: 'kr-r2', level: 'side', points: poly([[800, 830], [745, 782], [672, 735], [640, 700], [632, 655]]), roles: ['dps'], heroes: ['애쉬', '솔저: 76', '소전', '트레이서', '겐지', '한조'], situations: ['basic', 'fightStart', 'attackStart'], verified: false,
        title: '초보자 사이드: 서쪽 골목 → 호텔 2층 발코니', from: '공격 스폰', via: '광장 서쪽 골목 · 호텔 계단', to: '호텔 2층 발코니(kr-p2)', purpose: '광장을 내려다보는 고지를 잡습니다. 사이드 중 가장 안전하고 팀과 가깝습니다.',
        useWhen: '한타 시작 전에 미리 올라갈 때.', avoidWhen: '한타가 이미 시작된 뒤 (계단에서 잘립니다).', needs: ['탱커가 입구에 자리 잡음'], escape: '계단으로 내려가 팀 옆으로.', distance: '팀과 20m 이내.', caution: '이 사이드는 항상 가야 하는 것이 아닙니다. 아군 본대가 버티고 있을 때 쓰세요.' },
      { id: 'kr-r3', level: 'flank', points: poly([[660, 600], [612, 588], [566, 548], [540, 518], [515, 490]]), roles: ['dps'], heroes: ['트레이서', '겐지', '리퍼', '솜브라'], situations: ['attackStart', 'enemyDead', 'sidePush'], verified: false,
        title: '고급 플랭크: 남쪽 골목 → 다리 아래 뒤', from: '카트 남쪽', via: '남쪽 골목', to: '왼쪽 골목 출구(kr-p8)', purpose: '카트를 보고 있는 상대 힐러의 뒤로 나갑니다. 시선 분산이 목적입니다.',
        useWhen: '우리 5명 생존 + 카트가 전진 중 + 상대 시선이 카트에 묶였을 때.', avoidWhen: '아군 탱커가 죽었거나 4:5일 때. 상대 포탑이 골목에 있을 때.', needs: ['이탈기 1개', '팀 5명'], escape: '골목 되돌아가기 (왕복 20초).', distance: '깊습니다. 본대가 무너지면 즉시 복귀.', caution: '아군 탱커가 죽었다면 깊게 들어가지 마세요.' },
      { id: 'kr-r4', level: 'side', points: poly([[640, 540], [606, 470], [598, 400], [590, 335]]), roles: ['dps'], heroes: ['애쉬', '솔저: 76', '한조', '소전'], situations: ['attackStart', 'defense', 'fightStart'], verified: false,
        title: '사이드: 카트 → 거리 2층 창문', from: '카트 옆', via: '북쪽 건물 계단', to: '거리 2층 창문(kr-p7)', purpose: '거리 구간 고지를 잡습니다. 카트가 거리에 들어오기 전에.',
        useWhen: '카트가 A를 막 벗어났을 때.', avoidWhen: '팀이 아직 A 광장에 있을 때 (너무 앞선 위치).', needs: ['탱커가 카트 옆에 있음'], escape: '계단으로 내려가 카트 뒤로.', distance: '카트에서 15m 이내.', caution: '계단이 좁습니다. 정커랫 덫 주의.' }
    ],
    highgrounds: [
      { id: 'kr-h1', points: poly([[600, 622], [668, 622], [668, 700], [600, 700]]), label: '호텔 2층 발코니', roles: ['dps'], heroes: ['소전', '애쉬', '솔저: 76', '위도우메이커'], verified: false,
        why: '광장 전체가 내려다보이는 1거점의 승부처입니다.', who: '히트스캔·저격 딜러, 여유가 있으면 바티스트.', when: '한타 시작 전에 미리.', how: '서쪽 골목에서 호텔 계단으로.', counter: '윈스턴·D.Va 다이브, 겐지 벽타기로 올라옵니다.',
        pros: ['광장 전체 시야', '입구 초크와 오프앵글'], cons: ['다이브에 취약', '계단 하나'], caution: '수비·공격 모두 이 자리를 먹은 팀이 1거점을 가져갑니다.' },
      { id: 'kr-h2', points: poly([[555, 298], [626, 298], [626, 376], [555, 376]]), label: '거리 2층 창문', roles: ['dps'], heroes: ['애쉬', '한조', '파라', '소전'], verified: false,
        why: '카트 도로 전체와 다리 아래 입구가 보입니다.', who: '히트스캔·투사체 딜러.', when: '카트가 거리에 들어오기 전.', how: '북쪽 건물 계단.', counter: '트레이서·겐지가 계단으로, 파라·에코가 공중으로.',
        pros: ['도로 전체 시야'], cons: ['창문 노출', '팀과 거리'], caution: '창문 앞 고정 금지.' },
      { id: 'kr-h3', points: poly([[494, 428], [562, 428], [562, 486], [494, 486]]), label: '거리 끝 다리', roles: ['dps', 'support'], heroes: ['위도우메이커', '애쉬', '바티스트'], verified: false,
        why: '거리를 정면으로 내려다보는 수비의 저격 자리입니다.', who: '수비 저격수, 바티스트.', when: '카트가 거리에 있을 때.', how: '다리 양쪽 계단.', counter: '왼쪽 골목으로 우회한 플랭커.',
        pros: ['거리 정면 시야'], cons: ['우회에 취약'], caution: '한 자리 2발 금지.' },
      { id: 'kr-h4', points: poly([[212, 158], [304, 158], [304, 216], [212, 216]]), label: '공장 2층 통로', roles: ['dps'], heroes: ['소전', '애쉬', '솔저: 76', '트레이서'], verified: false,
        why: '종점 전체가 내려다보이는 마지막 승부처입니다.', who: '기동 있는 딜러(소전·트레이서).', when: '공격은 카트가 문에 닿기 전, 수비는 카트가 거리를 지날 때.', how: '공장 안 계단.', counter: '광역 궁(타이어·자폭), 다이브.',
        pros: ['종점 전체 시야'], cons: ['좁고 길어 궁에 취약'], caution: '궁 소리 → 계단.' }
    ],
    dangers: [
      { id: 'kr-d1', points: poly([[708, 584], [746, 604], [700, 660], [662, 640]]), label: '거점 북쪽 계단 초크', why: '거점과 거리 사이 좁은 계단입니다. 여기서 멈추면 양쪽에서 유탄·저격이 떨어집니다. 지나가는 곳이지 서 있는 곳이 아닙니다.', verified: false },
      { id: 'kr-d2', points: poly([[620, 468], [648, 484], [568, 556], [540, 540]]), label: '거리 한가운데', why: '2층 창문·다리 위에서 모두 보이는 열린 거리입니다. 카트 옆이 아니면 서 있지 마세요.', verified: false },
      { id: 'kr-d3', points: poly([[344, 226], [372, 250], [326, 286], [300, 262]]), label: '공장 문 앞', why: '공장 2층 통로에서 내려다보는 자리입니다. 문 앞에 5명이 뭉치면 궁 하나에 전멸합니다.', verified: false },
      { id: 'kr-d4', points: poly([[755, 655], [815, 655], [815, 715], [755, 715]]), label: 'A 거점 정중앙', why: '호텔 발코니·북쪽 계단·남쪽 입구 세 방향에서 보입니다. 점령은 가장자리에서 1명이면 됩니다.', verified: false },
      { id: 'kr-d5', points: poly([[762, 748], [800, 770], [770, 820], [732, 798]]), label: '스폰 앞 거리 (수비 시)', why: '수비 팀이 여기까지 밀고 오면 공격 스폰이 코앞입니다. 상대 리스폰 5초 vs 우리 20초 — 수비는 절대 여기서 싸우지 마세요.', verified: false }
    ],
    sightlines: [
      { id: 'kr-l1', from: P(632, 655), to: P(790, 690), fromId: 'kr-p2', label: '발코니 → A 거점', verified: false },
      { id: 'kr-l2', from: P(590, 335), to: P(650, 470), fromId: 'kr-p7', label: '2층 창문 → 거리', verified: false },
      { id: 'kr-l3', from: P(262, 192), to: P(335, 252), fromId: 'kr-p11', label: '공장 2층 → 입구', verified: false },
      { id: 'kr-l4', from: P(522, 456), to: P(640, 540), fromId: 'kr-p14', label: '다리 → 거리 정면', verified: false }
    ],
    covers: [
      { id: 'kr-c1', ...P(745, 716), label: '남쪽 입구 기둥', verified: false },
      { id: 'kr-c2', ...P(720, 690), label: '거점 기둥', verified: false },
      { id: 'kr-c3', ...P(700, 762), label: '광장 앞 트럭', verified: false },
      { id: 'kr-c4', ...P(322, 262), label: '공장 입구 기둥', verified: false }
    ],
    packs: [
      { id: 'kr-k1', ...P(616, 640), size: 'big', label: '호텔 안 큰 팩', verified: false },
      { id: 'kr-k2', ...P(482, 470), size: 'big', label: '다리 아래 큰 팩', verified: false },
      { id: 'kr-k3', ...P(240, 214), size: 'small', label: '공장 작은 팩', verified: false }
    ],
    fights: [
      { id: 'kr-f1', ...P(785, 685), r: 0.045, label: 'A 거점 광장', note: '첫 한타. 호텔 2층을 먹은 쪽이 이깁니다.' },
      { id: 'kr-f2', ...P(600, 480), r: 0.035, label: '거리 구간', note: '카트 옆 vs 2층 창문·다리 싸움.' },
      { id: 'kr-f3', ...P(240, 200), r: 0.04, label: '공장 종점', note: '2층 통로가 승부처. 오버타임이 자주 납니다.' }
    ],
    quiz: [
      { id: 'kr-q1', q: '트레이서가 A 거점 공격 때 상대 힐러의 시선을 흔들기 좋은 위치는?', answer: 'kr-p3', hint: '호텔 옆 골목 끝, 거점 뒤가 보이는 곳' },
      { id: 'kr-q2', q: '애쉬·솔저가 광장 전체를 내려다보며 쏘는 자리는?', answer: 'kr-p2', hint: '고지, 입구 초크와 90°' },
      { id: 'kr-q3', q: '우리 탱커가 죽었을 때 지원가가 물러나야 할 곳은?', answer: 'kr-p5', hint: '상대가 초크를 넘어와야 하는 곳' },
      { id: 'kr-q4', q: '카트 구간에서 수비 팀 딜러의 핵심 자리는?', answer: 'kr-p7', hint: '도로 전체가 보이는 창문' },
      { id: 'kr-q5', q: '공격 팀 탱커가 첫 한타에서 자리 잡아야 할 곳은?', answer: 'kr-p1', hint: '남쪽 입구를 지나자마자, 기둥 옆' }
    ]
  };
})();
