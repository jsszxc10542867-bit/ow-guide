// ===== 전술 지도 데이터 구조 =====
// 모든 좌표는 0~100 (viewBox 100×62). 새 맵은 이 파일의 구조를 따라 data/maps/<id>.js 에 추가하고
// index.html 의 <script src="data/maps/<id>.js"> 를 넣으면 자동으로 목록에 표시됩니다.
//
// TACTICAL_MAPS[id] = {
//   id, name, en, mode, side:'atk'|'def' (기본 관점), intro,
//   terrain: {                          // 단순화한 2D 전술 지도 (실제 게임 이미지 사용 안 함)
//     roads:     [{ d:'M x y L x y ...', w }],          // 길 (넓이)
//     buildings: [{ x,y,w,h, label?, r? }],             // 건물·벽 덩어리
//     stairs:    [{ x,y,w,h, rot? }],                   // 계단
//     objectives:[{ type:'point', x,y, label } | { type:'cart', d:'M ...', label }],
//     spawns:    [{ x,y, team:'atk'|'def', label }],
//     labels:    [{ x,y, t }]
//   },
//   keyPoints: ['...','...','...'],                     // 이것만 기억하세요 (최대 3)
//   positions: [{ id, x,y, type:'recommended'|'basic', roles:[...], heroes:[...],
//                 situations:['basic','fightStart','attack','defense','advantage','disadvantage','enemyTankDead','ourTankDead'],
//                 tags:['side','high','safe','front','retreat','aggressive','offangle','heal'],
//                 title, where, why, when, target, leave, whyAdv?, good:[...], bad:[...], caution,
//                 score:{ survive, angle, team, escape, pressure } (1~10) }],
//   routes:    [{ id, level:'newbie'|'side'|'flank', points:[[x,y],...], roles, heroes, situations,
//                 title, from, via, to, purpose, caution }],
//   highgrounds:[{ id, points:[[x,y],...], label, roles, heroes, pros:[...], cons:[...], caution }],
//   dangers:   [{ id, points:[[x,y],...], label, why, roles:['all'] }],
//   covers:    [{ id, x,y,w,h, label }],
//   packs:     [{ id, x,y, size:'big'|'small', label }],
//   fights:    [{ id, x,y, r, label, note }],
//   quiz:      [{ id, q, answer:<position|highground|route id>, hint }]
// }
const TACTICAL_MAPS = {};
