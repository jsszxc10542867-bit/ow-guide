// 객관식 퀴즈 정답 데이터 (문항 HTML은 index.html 각 탭에 있음, 순서대로 대응)
// cat: 결과 화면 분야별 점수용  topic: 추천 학습 순서용 키워드
const QUIZ_CATS = { basics:'게임 기본', roles:'캐릭터 역할', tactics:'한타·전술', positioning:'포지셔닝', practical:'실전', advanced:'고급 전략', heroes:'영웅' };
const quizAnswers = [
  { correct: 1, cat:'basics',      topic:'regroup5', message: "정답! 해골 2개 = 후퇴 신호. 3:5로 버티는 것보다 리그룹해서 5:5로 여는 게 이깁니다." },
  { correct: 2, cat:'basics',      topic:'hp50',     message: "정답! 파란색은 보호막. 안 맞으면 저절로 찹니다. 쉬게 두지 말고 계속 압박하세요." },
  { correct: 0, cat:'basics',      topic:'swap',     message: "정답! 리치 길고 포킹 강한 쪽은 자리만 먹고 대치. 들어와야 하는 건 상대입니다." },
  { correct: 1, cat:'roles',       topic:'lookBack', message: "정답! 탱커는 생존이 쉽고 게임의 기본을 배우기에 최적입니다." },
  { correct: 1, cat:'roles',       topic:'lookBack', message: "정답! 탱커는 팀의 방패 역할을 합니다." },
  { correct: 1, cat:'roles',       topic:'healDeal', message: "정답! 힐러는 팀원들의 체력을 관리하는 것이 가장 중요합니다." },
  { correct: 1, cat:'tactics',     topic:'stagger',  message: "정답! 팀원이 부활할 때까지 안전한 곳에서 기다려야 합니다." },
  { correct: 1, cat:'tactics',     topic:'healLos',  message: "정답! 힐러를 무시하면 팀 전체가 빠르게 죽습니다." },
  { correct: 1, cat:'tactics',     topic:'regroup5', message: "정답! 팀과 함께 작전을 공유하는 의사소통이 가장 중요합니다." },
  { correct: 1, cat:'positioning', topic:'highground', message: "정답! 높은 곳에서 적을 내려다보는 것이 가장 유리합니다." },
  { correct: 1, cat:'positioning', topic:'ultCount', message: "정답! 팀을 분산하고 엄폐물 뒤에 숨어야 합니다." },
  { correct: 1, cat:'positioning', topic:'highground', message: "정답! 여러 번 플레이하면서 천천히 배우는 것이 최고의 방법입니다." },
  { correct: 1, cat:'practical',   topic:'sideCond', message: "정답! 딜러는 탱커 뒤에서 안전하게 위치해야 합니다." },
  { correct: 1, cat:'practical',   topic:'hp50',     message: "정답! 체력이 낮으면 안전한 곳으로 물러나 회복해야 합니다." },
  { correct: 1, cat:'practical',   topic:'target',   message: "정답! 팀에게 알리고 함께 힐러를 처치하는 것이 중요합니다!" },
  { correct: 1, cat:'advanced',    topic:'swap',     message: "정답! 다이브 > 포킹 > 러시 > 다이브. 다이브는 뭉쳐서 받아치는 러시에 약합니다." },
  { correct: 0, cat:'advanced',    topic:'cdTrack',  message: "정답! 생존기가 빠진 10초가 들어갈 타이밍입니다. \"스즈 빠졌어요\" 콜과 함께 진입하세요." },
  { correct: 2, cat:'advanced',    topic:'ultSave',  message: "정답! 궁 어드밴티지는 한타를 열지 말지 정하는 1순위 기준입니다." },
  { correct: 1, cat:'heroes',      topic:'swap',     message: "정답! 솔저: 76은 기본 히트스캔에 자힐까지 있어 딜러 입문에 최적입니다." },
  { correct: 0, cat:'heroes',      topic:'swap',     message: "정답! 공중 영웅은 히트스캔으로 잡습니다. 투사체로는 맞추기 어렵습니다." },
  { correct: 2, cat:'heroes',      topic:'healLos',  message: "정답! 레즈하다 죽으면 2명 손해입니다. 안전할 때만 쓰세요." }
];
// 오답 시 한 줄 해설 (index = 퀴즈 번호)
const QUIZ_EXPLAIN = [
  '왼쪽 위 초상화의 해골이 2개 이상이면 후퇴 신호입니다. 소수로 버티면 한 명씩 더 잘려 리스폰만 꼬입니다.',
  '흰색 체력 · 노란 방어력(피해 감소) · 파란 보호막(자동 재생) · 초록 과다 체력(임시). 보호막은 쉬게 두면 다시 찹니다.',
  '판 시작 전 질문 ①: 누가 리치가 길고 포킹이 강한가. 짧은 쪽이 들어가야 하고, 긴 쪽은 대치를 유도합니다.',
  '탱커는 체력이 많아 잘 죽지 않고, 맨 앞에서 "왜 이겼고 왜 졌는지"가 가장 잘 보입니다.',
  '탱커의 일은 킬이 아니라 팀이 딜을 넣을 공간을 만드는 것입니다.',
  '힐러의 우선순위는 ① 탱커 살려서 라인 유지 ② 지금 맞는 사람 ③ 여유 시 딜 ④ 내가 안 죽기.',
  '혼자 남았을 때 가장 좋은 플레이는 죽지 않는 것입니다. 죽으면 스태거로 다음 한타도 4명이 됩니다.',
  '힐러가 죽으면 힐이 끊겨 팀 전체가 빠르게 녹습니다. 백라인을 지키는 것이 곧 팀을 지키는 것입니다.',
  '좋은 콜은 짧게, 대상 + 위치 + 상태. "아나 피 없음 왼쪽". 자랑·비난은 콜이 아닙니다.',
  '고지를 먹은 팀이 한타를 이깁니다. 위에서 아래는 다 보이고 아래에서 위는 머리만 보입니다.',
  '뭉쳐 있으면 광역 궁(그라비·타이어)의 표적이 됩니다. 적당히 분산하고 엄폐물 옆에.',
  '맵은 실전에서 천천히 익히되, 사용자 지정 게임에서 2분 걷기로 고지·팩·사이드만 먼저 확인하면 빠릅니다.',
  '딜러가 탱커보다 앞에 서면 상대 5명이 딜러를 먼저 봅니다. 탱커 옆·뒤 또는 고지가 딜 포지션입니다.',
  '체력 50% 이하면 코너. "한 발만 더"가 딜러 사망 원인 1위입니다.',
  '혼자 힐러에게 돌격하면 상대 팀이 돌아봅니다. 팀에 알리고 같이 노려야 확정입니다.',
  '조합 상성: 다이브 > 포킹 > 러시 > 다이브. 다이브는 뭉쳐서 받아치는 러시(브리기테·메이)에 약합니다.',
  '스즈가 빠진 14초는 상대에게 CC 해제·무적이 없는 시간입니다. 지금이 진입 타이밍입니다.',
  '궁 2 vs 0이면 그냥 들어가서 이깁니다. 기다리면 상대 궁이 차서 우위가 사라집니다.',
  '솔저: 76은 기본 히트스캔 + 생체장 자힐이 있어 딜러 입문에 가장 좋습니다. 겐지·위도우는 난도 최상입니다.',
  '공중 영웅(파라·에코)은 히트스캔(캐서디·애쉬·솔저)으로만 잡습니다. 투사체는 공중을 맞추기 어렵습니다.',
  '레즈는 안전할 때만. 적 앞에서 레즈하면 둘 다 죽어 2명 손해입니다.'
];
