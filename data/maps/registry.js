// ===== 전술 지도 레지스트리 =====
// 실제 이미지가 있는 맵만 image 를 지정합니다. image 가 없으면 "준비 중"으로 표시됩니다.
// 이미지 출처: StatBanana Overwatch Overhead Maps (https://overwatch.statbanana.com/images)
//   - 사용 조건: 무료 저작물에서만 사용, 원본 무변경 재배포 금지, 코너 로고 유지 또는
//     "Overhead map courtesy of https://statbanana.com" 표기. (본 사이트는 무료 가이드이며 둘 다 지킵니다)
//   - 상업적 전환 시 조건 재확인 필요. 이미지 다운로드 기능은 제공하지 않습니다.
// 좌표계: 모든 전술 데이터는 0~1 정규화 좌표 (x = px / width, y = px / height)
const TACTICAL_MAPS = {};
const MAP_REGISTRY = [
  { id:'kings-row',      name:'왕의 길',          en:"King's Row",           mode:'hybrid',  image:'assets/maps/kings-row/kings-row-overhead.webp', width:1000, height:989,
    attribution:'Overhead map courtesy of https://statbanana.com/', source:'https://overwatch.statbanana.com/images' },
  { id:'eichenwalde',    name:'아이헨발데',        en:'Eichenwalde',          mode:'hybrid',  image:null },
  { id:'dorado',         name:'도라도',            en:'Dorado',               mode:'escort',  image:null },
  { id:'hollywood',      name:'할리우드',          en:'Hollywood',            mode:'hybrid',  image:null },
  { id:'junkertown',     name:'정커타운',          en:'Junkertown',           mode:'escort',  image:null },
  { id:'route-66',       name:'66번 국도',         en:'Route 66',             mode:'escort',  image:null },
  { id:'rialto',         name:'리알토',            en:'Rialto',               mode:'escort',  image:null },
  { id:'numbani',        name:'눔바니',            en:'Numbani',              mode:'hybrid',  image:null },
  { id:'blizzard-world', name:'블리자드 월드',     en:'Blizzard World',       mode:'hybrid',  image:null },
  { id:'gibraltar',      name:'감시 기지: 지브롤터', en:'Watchpoint: Gibraltar', mode:'escort',  image:null },
  { id:'lijiang-tower',  name:'리장 타워',         en:'Lijiang Tower',        mode:'control', image:null },
  { id:'circuit-royal',  name:'서킷 로얄',         en:'Circuit Royal',        mode:'escort',  image:null }
];
// 새 맵 추가: 1) assets/maps/<id>/<id>-overhead.png 저장 + attribution.txt  2) 위 목록에 image/width/height 지정
//            3) data/maps/<id>.js 에 TACTICAL_MAPS['<id>'] = {...} 작성 (kings-row.js 구조 참고)  4) index.html 에 script 추가
