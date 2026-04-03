import type {
  CandidateInfo, CandidateId, CandidateStudent, Location, Student, HobbyTopic, HobbyPreference,
  HairStyle, Attribute, Personality, LocationId
} from './types';

import tanakaDaikiPortrait from '../portraits/tanaka_daiki.png';
import yamamotoRenPortrait from '../portraits/yamamoto_ren.png';
import satoYuiPortrait from '../portraits/sato_yui.png';
import watanabeAoiPortrait from '../portraits/watanabe_aoi.png';
import nakamuraSakuraPortrait from '../portraits/nakamura_sakura.png';
import takahashiYutoPortrait from '../portraits/takahashi_yuto.png';
import matsumotoKentaPortrait from '../portraits/matsumoto_kenta.png';
import miyazakiAkanePortrait from '../portraits/miyazaki_akane.png';
import hashimotoTsubasaPortrait from '../portraits/hashimoto_tsubasa.png';
import katoMitsukiPortrait from '../portraits/kato_mitsuki.png';
import suzukiShotaPortrait from '../portraits/suzuki_shota.png';
import saitoManabuPortrait from '../portraits/saito_manabu.png';
import takayamaSeiichiPortrait from '../portraits/takayama_seiichi.png';
import yuukiAkariPortrait from '../portraits/yuuki_akari.png';
import shidoTsuyoshiPortrait from '../portraits/shido_tsuyoshi.png';

// 候補者の表示情報（色・公約）
export const CANDIDATE_INFO: CandidateInfo[] = [
  {
    id: 'conservative',
    color: '#1B3A6B',
    accentColor: '#2E5FAC',
    description: '伝統と規律を重んじる。校則の厳格化・制服の維持を主張。',
    platform: '保守派 ─ 伝統と秩序',
  },
  {
    id: 'progressive',
    color: '#C45A00',
    accentColor: '#E07820',
    description: '変革と自由を掲げる。制服廃止・SNS活用など新しい学園を提案。',
    platform: '革新派 ─ 変革と自由',
  },
  {
    id: 'sports',
    color: '#A00000',
    accentColor: '#D02020',
    description: '体育系の結束を重視。部活の予算拡充・体育館改修を公約。',
    platform: '体育派 ─ 結束と活力',
  },
];


// CandidateIdからCandidateInfoを取得するヘルパー
export function getCandidateInfo(id: CandidateId): CandidateInfo {
  return CANDIDATE_INFO.find(c => c.id === id)!;
}

export const LOCATIONS: Location[] = [
  { id: 'class1a', name: '教室 1-A' },
  { id: 'class1b', name: '教室 1-B' },
  { id: 'class1c', name: '教室 1-C' },
  { id: 'class1d', name: '教室 1-D' },
  { id: 'class2a', name: '教室 2-A' },
  { id: 'class2b', name: '教室 2-B' },
  { id: 'class2c', name: '教室 2-C' },
  { id: 'class2d', name: '教室 2-D' },
  { id: 'class3a', name: '教室 3-A' },
  { id: 'class3b', name: '教室 3-B' },
  { id: 'class3c', name: '教室 3-C' },
  { id: 'class3d', name: '教室 3-D' },
  { id: 'track_field', name: '陸上競技場' },
  { id: 'soccer_field', name: 'サッカーグラウンド' },
  { id: 'baseball_field', name: '野球グラウンド' },
  { id: 'tennis_court', name: 'テニスコート' },
  { id: 'music_room', name: '吹奏楽室' },
  { id: 'art_room', name: '美術室' },
  { id: 'courtyard', name: '中庭' },
  { id: 'library', name: '図書室' },
  { id: 'cafeteria', name: '食堂' },
];

function makeHobbies(
  likes: HobbyTopic[],
  dislikes: HobbyTopic[]
): Record<HobbyTopic, HobbyPreference> {
  const all: HobbyTopic[] = ['love', 'game', 'sns', 'sports', 'study', 'video', 'music', 'reading', 'fashion'];
  const result = {} as Record<HobbyTopic, HobbyPreference>;
  for (const h of all) {
    if (likes.includes(h)) result[h] = 'like';
    else if (dislikes.includes(h)) result[h] = 'dislike';
    else result[h] = 'neutral';
  }
  return result;
}

// 性格×属性から口癖を決定する
const CATCHPHRASE_MAP: Record<string, Record<string, string>> = {
  passionate: {
    sporty: 'よっしゃ、いっちょやるか！',
    energetic: '燃えてきたぜ！',
    energetic_social: 'みんなで盛り上がろうぜ！',
    serious: '本気で行くぞ！',
    _default: '負けねぇぞ！',
  },
  cautious: {
    cool: '…まず状況を整理しましょう',
    introverted: 'もう少し考えさせて…',
    serious: 'データで見ると…',
    fashionable: '慎重にいきたいかな',
    _default: '一旦落ち着こう',
  },
  stubborn: {
    serious: '規則ですから',
    cool: '…譲る気はない',
    introverted: 'それは違うと思う',
    sporty: '俺は曲げねぇ',
    _default: '自分の考えは変わらない',
  },
  flexible: {
    airhead: 'えー、それめっちゃいいじゃん！',
    energetic_social: 'いいね、それもアリだね！',
    energetic: 'どっちも楽しそう！',
    fashionable: 'うんうん、わかるかも〜',
    _default: 'まあ、なんとかなるよ',
  },
  cunning: {
    airhead: 'ふふ、そうなんだ？',
    fashionable: 'あら、面白いこと言うのね',
    cool: '…それ、本気で言ってる？',
    introverted: 'へぇ…そういう考えもあるんだ',
    _default: 'なるほどね…',
  },
};

export function getCatchphrase(personality: Personality, attributes: Attribute[]): string {
  const map = CATCHPHRASE_MAP[personality] ?? {};
  for (const attr of attributes) {
    if (map[attr]) return map[attr];
  }
  return map['_default'] ?? '…';
}

export const STUDENTS: Student[] = [
  // 既存5名（ポートレートあり）
  {
    id: 'tanaka_daiki',
    name: '田中大輝',
    className: '1-B',
    clubId: 'soccer',
    description: '素直で裏表がない。考えるより先に体が動くタイプ。友達思いで、意外にもゲーム好きというインドアな一面もある。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['game', 'sports'], ['love', 'reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 25, progressive: 25, sports: 50 },
    attributes: ['energetic_social', 'energetic', 'sporty'] as Attribute[],
    likedAttributes: ['energetic', 'sporty', 'energetic_social'] as Attribute[],
    dislikedAttributes: ['introverted', 'cool'] as Attribute[],
    stats: { speech: 30, athletic: 80, intel: 25, maxHp: 120 },
    affinity: 0,
    talkCount: 0,
    portrait: tanakaDaikiPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'yamamoto_ren',
    name: '山本蓮',
    className: '2-B',
    clubId: null,
    description: '規則第一の委員長気質。正義感は強いが融通が利かない。実は猫を3匹飼っており、誰にも言えないゲーム好き。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['study'], ['sports', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 55, progressive: 20, sports: 25 },
    attributes: ['introverted', 'serious', 'cool', 'glasses'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool'] as Attribute[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'blonde'] as Attribute[],
    stats: { speech: 60, athletic: 20, intel: 85, maxHp: 80 },
    affinity: 0,
    talkCount: 0,
    portrait: yamamotoRenPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'sato_yui',
    name: '佐藤ゆい',
    className: '1-A',
    clubId: null,
    description: '天真爛漫で誰とでも仲良くなれるムードメーカー。空気を読むのが上手だが、周囲に流されがちな一面も。',
    hairStyle: 'straight' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['love', 'sns'], ['study', 'reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 40, sports: 30 },
    attributes: ['energetic_social', 'airhead', 'energetic'] as Attribute[],
    likedAttributes: ['fashionable', 'energetic_social', 'energetic'] as Attribute[],
    dislikedAttributes: ['introverted', 'serious'] as Attribute[],
    stats: { speech: 50, athletic: 40, intel: 35, maxHp: 100 },
    affinity: 0,
    talkCount: 0,
    portrait: satoYuiPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'watanabe_aoi',
    name: '渡辺あおい',
    className: '2-A',
    clubId: null,
    description: '冷静沈着だが内に秘めた情熱がある。SNSフォロワー1万人の分析力を持つ。データで物事を判断する。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['sns', 'reading'], ['sports', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['introverted', 'cool', 'fashionable'] as Attribute[],
    likedAttributes: ['cool', 'fashionable', 'serious'] as Attribute[],
    dislikedAttributes: ['sporty', 'delinquent', 'airhead'] as Attribute[],
    stats: { speech: 70, athletic: 15, intel: 80, maxHp: 85 },
    affinity: 0,
    talkCount: 0,
    portrait: watanabeAoiPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'nakamura_sakura',
    name: '中村さくら',
    className: '2-C',
    clubId: null,
    description: '表面はにこやかだが裏で人間関係を把握している策士。観察眼が鋭く、情報収集を怠らない。',
    hairStyle: 'wavy' as HairStyle,
    personality: 'cunning' as Personality,
    hobbies: makeHobbies(['sns', 'fashion'], ['sports', 'study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 60, progressive: 25, sports: 15 },
    attributes: ['airhead', 'fashionable', 'young'] as Attribute[],
    likedAttributes: ['fashionable', 'adult', 'cool'] as Attribute[],
    dislikedAttributes: ['sporty', 'energetic', 'young'] as Attribute[],
    stats: { speech: 75, athletic: 25, intel: 65, maxHp: 90 },
    affinity: 0,
    talkCount: 0,
    portrait: nakamuraSakuraPortrait,
    candidateId: null,
    playable: true,
  },
  // 追加7名
  {
    id: 'takahashi_yuto',
    name: '高橋悠人',
    className: '3-B',
    clubId: 'art',
    description: '理想家で情熱的。自分の信念のためなら衝突も厭わない。美術部で油絵を描き、作品をSNSで発信している。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sns'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 20, progressive: 60, sports: 20 },
    attributes: ['cool', 'serious'] as Attribute[],
    likedAttributes: ['fashionable', 'cool'] as Attribute[],
    dislikedAttributes: ['sporty', 'airhead'] as Attribute[],
    stats: { speech: 65, athletic: 35, intel: 70, maxHp: 90 },
    affinity: 0,
    talkCount: 0,
    portrait: takahashiYutoPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'matsumoto_kenta',
    name: '松本健太',
    className: '3-D',
    clubId: 'track',
    description: '寡黙だが芯が強い。一度決めたら絶対に曲げない。後輩の面倒見は良く、格闘ゲームが密かな趣味。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['game'], ['reading', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 20, progressive: 15, sports: 65 },
    attributes: ['sporty', 'serious'] as Attribute[],
    likedAttributes: ['sporty', 'energetic'] as Attribute[],
    dislikedAttributes: ['fashionable', 'airhead'] as Attribute[],
    stats: { speech: 25, athletic: 90, intel: 30, maxHp: 130 },
    affinity: 0,
    talkCount: 0,
    portrait: matsumotoKentaPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'miyazaki_akane',
    name: '宮崎あかね',
    className: '1-C',
    clubId: null,
    description: '引っ込み思案だが芯は強い。図書委員で読書好き。読書アカウントをSNSで運営し、慎重に物事を進める。',
    hairStyle: 'braid' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['reading', 'sns'], ['sports']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 35, progressive: 35, sports: 30 },
    attributes: ['introverted', 'serious', 'glasses'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool'] as Attribute[],
    dislikedAttributes: ['delinquent', 'energetic_social'] as Attribute[],
    stats: { speech: 40, athletic: 15, intel: 75, maxHp: 70 },
    affinity: 0,
    talkCount: 0,
    portrait: miyazakiAkanePortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'hashimoto_tsubasa',
    name: '橋本翼',
    className: '1-D',
    clubId: 'baseball',
    description: 'ゲームと動画が大好きな自由人。深く考えるのは苦手だが、柔軟な発想で周りを驚かせることがある。',
    hairStyle: 'straight' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['game', 'video'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['energetic_social', 'airhead'] as Attribute[],
    likedAttributes: ['energetic', 'airhead'] as Attribute[],
    dislikedAttributes: ['serious', 'cool'] as Attribute[],
    stats: { speech: 45, athletic: 45, intel: 40, maxHp: 100 },
    affinity: 0,
    talkCount: 0,
    portrait: hashimotoTsubasaPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'kato_mitsuki',
    name: '加藤美月',
    className: '2-D',
    clubId: 'tennis',
    description: '明るくて面倒見のいいスポーツ少女。恋バナが大好きで、テニス部ではムードメーカー的存在。',
    hairStyle: 'ponytail' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['love', 'sports'], ['reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 15, progressive: 25, sports: 60 },
    attributes: ['energetic', 'sporty', 'energetic_social'] as Attribute[],
    likedAttributes: ['sporty', 'energetic'] as Attribute[],
    dislikedAttributes: ['introverted', 'glasses'] as Attribute[],
    stats: { speech: 50, athletic: 70, intel: 30, maxHp: 110 },
    affinity: 0,
    talkCount: 0,
    portrait: katoMitsukiPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'suzuki_shota',
    name: '鈴木翔太',
    className: '3-A',
    clubId: 'brass',
    description: '物腰柔らかで社交的だが、慎重に人を見極める一面もある。音楽を愛し、吹奏楽部でクラリネットを担当。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['love', 'music'], ['sports']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 50, progressive: 30, sports: 20 },
    attributes: ['cool', 'fashionable'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'adult'] as Attribute[],
    dislikedAttributes: ['sporty', 'delinquent'] as Attribute[],
    stats: { speech: 70, athletic: 20, intel: 65, maxHp: 85 },
    affinity: 0,
    talkCount: 0,
    portrait: suzukiShotaPortrait,
    candidateId: null,
    playable: true,
  },
  {
    id: 'saito_manabu',
    name: '斎藤学',
    className: '3-C',
    clubId: null,
    description: '学年トップクラスの秀才。頑固で自分の信念を曲げない。勉強と読書が生きがいで、流行には無関心。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['study', 'reading'], ['game', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 70, progressive: 15, sports: 15 },
    attributes: ['introverted', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'glasses'] as Attribute[],
    dislikedAttributes: ['delinquent', 'airhead', 'energetic_social'] as Attribute[],
    stats: { speech: 55, athletic: 15, intel: 90, maxHp: 75 },
    affinity: 0,
    talkCount: 0,
    portrait: saitoManabuPortrait,
    candidateId: null,
    playable: true,
  },
  // 候補者（説得不可）
  {
    id: 'takayama_seiichi',
    name: '鷹山誠一',
    className: '3-A',
    clubId: null,
    description: '物静かで威厳がある。親が議員という家庭環境もあり、政治や伝統に強い信念を持つ。言葉を選んで話す慎重派。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['reading', 'study'], ['sports', 'game']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 80, progressive: 10, sports: 10 },
    attributes: ['cool', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'cool'] as Attribute[],
    dislikedAttributes: ['delinquent', 'airhead'] as Attribute[],
    stats: { speech: 85, athletic: 30, intel: 90, maxHp: 80 },
    affinity: 0,
    talkCount: 0,
    portrait: takayamaSeiichiPortrait,
    candidateId: 'conservative' as CandidateId,
    playable: false,
  },
  {
    id: 'yuuki_akari',
    name: '結城あかり',
    className: '2-A',
    clubId: 'art',
    description: '活発で行動力抜群。新しいことに挑戦するのが好きで、学園の変革を本気で目指している。SNSでの発信力が武器。',
    hairStyle: 'ponytail' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sns', 'fashion'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 10, progressive: 80, sports: 10 },
    attributes: ['energetic_social', 'energetic', 'fashionable'] as Attribute[],
    likedAttributes: ['energetic', 'fashionable', 'energetic_social'] as Attribute[],
    dislikedAttributes: ['introverted', 'serious'] as Attribute[],
    stats: { speech: 80, athletic: 50, intel: 65, maxHp: 95 },
    affinity: 0,
    talkCount: 0,
    portrait: yuukiAkariPortrait,
    candidateId: 'progressive' as CandidateId,
    playable: false,
  },
  {
    id: 'shido_tsuyoshi',
    name: '獅堂剛',
    className: '3-D',
    clubId: 'track',
    description: '体育会系のリーダー。議論は苦手だが、体を動かすことへの情熱は誰にも負けない。仲間との絆を大切にする。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sports'], ['reading', 'study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 10, progressive: 10, sports: 80 },
    attributes: ['sporty', 'energetic', 'energetic_social'] as Attribute[],
    likedAttributes: ['sporty', 'energetic'] as Attribute[],
    dislikedAttributes: ['introverted', 'cool'] as Attribute[],
    stats: { speech: 40, athletic: 95, intel: 25, maxHp: 130 },
    affinity: 0,
    talkCount: 0,
    portrait: shidoTsuyoshiPortrait,
    candidateId: 'sports' as CandidateId,
    playable: false,
  },
];

// 候補者生徒配列（STUDENTS の candidateId !== null のものに CandidateInfo を統合）
export const CANDIDATES: CandidateStudent[] = STUDENTS
  .filter((s): s is Student & { candidateId: CandidateId } => s.candidateId !== null)
  .map(s => {
    const info = CANDIDATE_INFO.find(c => c.id === s.candidateId)!;
    return {
      ...s,
      id: s.candidateId,
      candidateId: s.candidateId,
      color: info.color,
      accentColor: info.accentColor,
      description: info.description,
      platform: info.platform,
    };
  });

// クラス名からLocationIdを返す
const CLASS_LOCATION_MAP: Record<string, LocationId> = {
  '1-A': 'class1a',
  '1-B': 'class1b',
  '1-C': 'class1c',
  '1-D': 'class1d',
  '2-A': 'class2a',
  '2-B': 'class2b',
  '2-C': 'class2c',
  '2-D': 'class2d',
  '3-A': 'class3a',
  '3-B': 'class3b',
  '3-C': 'class3c',
  '3-D': 'class3d',
};

// 部活スケジュール（放課後の場所）
const CLUB_LOCATION_MAP: Record<string, LocationId> = {
  tanaka_daiki: 'soccer_field',
  matsumoto_kenta: 'track_field',
  kato_mitsuki: 'tennis_court',
  takahashi_yuto: 'art_room',
  hashimoto_tsubasa: 'baseball_field',
  suzuki_shota: 'music_room',
  miyazaki_akane: 'library',
};

// 生徒の場所スケジュール
export function getStudentLocation(studentId: string, timeSlot: string, day: number): LocationId {
  // 生徒のクラスを引くためにSTUDENTSを参照
  const student = STUDENTS.find(s => s.id === studentId);
  if (!student) return 'class1b';

  const classLoc = CLASS_LOCATION_MAP[student.className] ?? 'class1b';
  const rand = (day * 7 + studentId.charCodeAt(0)) % 3;

  switch (timeSlot) {
    case 'morning':
      return classLoc;

    case 'lunch': {
      // ランダムで食堂か中庭
      return rand < 2 ? 'cafeteria' : 'courtyard';
    }

    case 'afternoon':
      return classLoc;

    case 'afterschool': {
      const clubLoc = CLUB_LOCATION_MAP[studentId];
      if (clubLoc) return clubLoc;
      // 帰宅組: 教室・中庭・図書室をランダム
      const options: LocationId[] = [classLoc, 'courtyard', 'library'];
      return options[rand % options.length];
    }

    default:
      return classLoc;
  }
}

// 候補者の場所スケジュール
export function getCandidateLocation(candidateId: CandidateId, timeSlot: string, day: number): LocationId {
  const rand = (day * 7 + candidateId.charCodeAt(0)) % 3;
  const classMap: Record<CandidateId, LocationId> = {
    conservative: 'class3a', // 鷹山: 3-A
    progressive: 'class2a',  // 結城: 2-A
    sports: 'class3d',       // 獅堂: 3-D
  };
  const classLoc = classMap[candidateId];

  const clubMap: Partial<Record<CandidateId, LocationId>> = {
    progressive: 'art_room',   // 結城あかり → 美術部
    sports: 'track_field',     // 獅堂剛 → 陸上部
  };

  switch (timeSlot) {
    case 'morning': return classLoc;
    case 'lunch': return rand < 2 ? 'cafeteria' : 'courtyard';
    case 'afternoon': return classLoc;
    case 'afterschool': {
      return clubMap[candidateId] ?? 'courtyard';
    }
    default: return classLoc;
  }
}

export const FACTION_LABELS: Record<string, string> = {
  conservative: '保守',
  progressive: '革新',
  sports: '体育',
};

export const HAIRSTYLE_LABELS: Record<string, string> = {
  straight: 'ストレート',
  ponytail: 'ポニーテール',
  twintail: 'ツインテール',
  braid: '三つ編み',
  wavy: 'ウェーブ',
  bun: 'お団子',
  bob: 'ボブカット',
};

export const HOBBY_LABELS: Record<string, string> = {
  love: '恋バナ',
  game: 'ゲーム',
  sns: 'SNS',
  sports: 'スポーツ',
  study: '勉強',
  video: '動画',
  music: '音楽',
  reading: '読書',
  fashion: 'ファッション',
};

export const ATTRIBUTE_LABELS: Record<string, string> = {
  glasses: 'メガネ',
  blonde: '金髪',
  young: '幼い',
  adult: '大人',
  flat: '貧乳',
  busty: '巨乳',
  energetic_social: '陽キャ',
  introverted: '陰キャ',
  serious: '真面目',
  delinquent: '不良',
  fashionable: 'おしゃれ',
  airhead: '天然',
  cool: 'クール',
  energetic: '元気',
  sporty: '体育',
};

export const MOOD_LABELS: Record<string, string> = {
  furious: '激怒',
  upset: '不機嫌',
  normal: '平常',
  favorable: '好意的',
  devoted: '心酔',
};

export const TIME_LABELS: Record<string, string> = {
  morning: '朝',
  lunch: '昼',
  afternoon: '午後',
  afterschool: '放課後',
};

// 性格ごとのイニシャルアイコン背景色
export const PERSONALITY_ICON_COLORS: Record<string, string> = {
  passionate: '#E74C3C',
  cautious: '#3498DB',
  stubborn: '#7F8C8D',
  flexible: '#2ECC71',
  cunning: '#9B59B6',
};

// イニシャルアイコンHTMLを生成するユーティリティ
export function renderInitialIcon(
  name: string,
  personality: string,
  size: number,
  borderColor?: string
): string {
  const initial = name.charAt(0);
  const bg = PERSONALITY_ICON_COLORS[personality] ?? '#888';
  const border = borderColor ? `border:2px solid ${borderColor};` : 'border:2px solid rgba(255,255,255,0.4);';
  return `
    <div style="
      width:${size}px; height:${size}px; border-radius:50%;
      background:${bg}; color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:${Math.round(size * 0.4)}px; font-weight:bold;
      flex-shrink:0; ${border}
    ">${initial}</div>
  `;
}
