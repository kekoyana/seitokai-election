import type {
  CandidateInfo, CandidateId, CandidateStudent, Location, Student, HobbyTopic, HobbyPreference,
  HairStyle, Attribute, PreferenceAttr, Personality, LocationId, Floor, Gender
} from './types';

import tanakaDaikiPortrait from '../assets/portraits/tanaka_daiki.png';
import yamamotoRenPortrait from '../assets/portraits/yamamoto_ren.png';
import satoYuiPortrait from '../assets/portraits/sato_yui.png';
import watanabeAoiPortrait from '../assets/portraits/watanabe_aoi.png';
import nakamuraSakuraPortrait from '../assets/portraits/nakamura_sakura.png';
import takahashiYutoPortrait from '../assets/portraits/takahashi_yuto.png';
import matsumotoKentaPortrait from '../assets/portraits/matsumoto_kenta.png';
import miyazakiAkanePortrait from '../assets/portraits/miyazaki_akane.png';
import hashimotoTsubasaPortrait from '../assets/portraits/hashimoto_tsubasa.png';
import katoMitsukiPortrait from '../assets/portraits/kato_mitsuki.png';
import suzukiShotaPortrait from '../assets/portraits/suzuki_shota.png';
import saitoManabuPortrait from '../assets/portraits/saito_manabu.png';
import takayamaSeiichiPortrait from '../assets/portraits/takayama_seiichi.png';
import yuukiAkariPortrait from '../assets/portraits/yuuki_akari.png';
import shidoTsuyoshiPortrait from '../assets/portraits/shido_tsuyoshi.png';
// 追加キャラクター
import ogawaHarukaPortrait from '../assets/portraits/ogawa_haruka.png';
import inoueMomokaPortrait from '../assets/portraits/inoue_momoka.png';
import endoRyotaPortrait from '../assets/portraits/endo_ryota.png';
import shimizuNanaPortrait from '../assets/portraits/shimizu_nana.png';
import aokiSoraPortrait from '../assets/portraits/aoki_sora.png';
import moritaChihiroPortrait from '../assets/portraits/morita_chihiro.png';
import nishidaKaitoPortrait from '../assets/portraits/nishida_kaito.png';
import hayashiRikoPortrait from '../assets/portraits/hayashi_riko.png';
import fujitaMeiPortrait from '../assets/portraits/fujita_mei.png';
import uedaTakumiPortrait from '../assets/portraits/ueda_takumi.png';
import kimuraYunaPortrait from '../assets/portraits/kimura_yuna.png';
import murakamiSotaPortrait from '../assets/portraits/murakami_sota.png';
import yoshidaHinataPortrait from '../assets/portraits/yoshida_hinata.png';
import okamotoRinPortrait from '../assets/portraits/okamoto_rin.png';
import gotoHayatoPortrait from '../assets/portraits/goto_hayato.png';
import sakamotoMiuPortrait from '../assets/portraits/sakamoto_miu.png';
import yamaguchiRyoPortrait from '../assets/portraits/yamaguchi_ryo.png';
import ikedaKotonePortrait from '../assets/portraits/ikeda_kotone.png';
import otsukaItsukiPortrait from '../assets/portraits/otsuka_itsuki.png';
import tanabeMisakiPortrait from '../assets/portraits/tanabe_misaki.png';
import kawanoShioriPortrait from '../assets/portraits/kawano_shiori.png';
import maedaTaigaPortrait from '../assets/portraits/maeda_taiga.png';
import noguchiSakiPortrait from '../assets/portraits/noguchi_saki.png';
import ishikawaYusukePortrait from '../assets/portraits/ishikawa_yusuke.png';
import iwataDaichiPortrait from '../assets/portraits/iwata_daichi.png';

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
  { id: 'broadcast_room', name: '放送室' },
  { id: 'courtyard', name: '中庭' },
  { id: 'library', name: '図書室' },
  { id: 'cafeteria', name: '食堂' },
  { id: 'nurses_office', name: '保健室' },
  { id: 'corridor_1f', name: '1階廊下' },
  { id: 'corridor_2f', name: '2階廊下' },
  { id: 'corridor_3f', name: '3階廊下' },
  { id: 'corridor_ground', name: 'グラウンド' },
];

// フロア関連データ
export const LOCATION_FLOOR_MAP: Record<LocationId, Floor> = {
  corridor_1f: '1f',
  class1a: '1f', class1b: '1f', class1c: '1f', class1d: '1f',
  courtyard: '1f', cafeteria: '1f', library: '1f', nurses_office: '1f',
  corridor_2f: '2f',
  class2a: '2f', class2b: '2f', class2c: '2f', class2d: '2f',
  music_room: '2f', art_room: '2f', broadcast_room: '2f',
  corridor_3f: '3f',
  class3a: '3f', class3b: '3f', class3c: '3f', class3d: '3f',
  corridor_ground: 'ground',
  track_field: 'ground', soccer_field: 'ground',
  baseball_field: 'ground', tennis_court: 'ground',
};

export const FLOOR_ROOMS: Record<Floor, LocationId[]> = {
  '1f': ['class1a', 'class1b', 'class1c', 'class1d', 'courtyard', 'cafeteria', 'library', 'nurses_office'],
  '2f': ['class2a', 'class2b', 'class2c', 'class2d', 'music_room', 'art_room', 'broadcast_room'],
  '3f': ['class3a', 'class3b', 'class3c', 'class3d'],
  'ground': ['track_field', 'soccer_field', 'baseball_field', 'tennis_court'],
};

export const FLOOR_ADJACENCY: Record<Floor, Floor[]> = {
  '1f': ['2f', 'ground'],
  '2f': ['1f', '3f'],
  '3f': ['2f'],
  'ground': ['1f'],
};

export const FLOOR_LABELS: Record<Floor, string> = {
  '1f': '1階',
  '2f': '2階',
  '3f': '3階',
  'ground': 'グラウンド',
};

// 行動ごとの時間コスト（分）
export const TIME_COST = {
  ENTER_ROOM: 5,
  CHANGE_FLOOR: 10,
  GO_OUTSIDE: 15,
  GO_INSIDE: 10,
  TALK: 15,
  PERSUADE: 30,
  NURSE_REST: 60,
  TRAINING: 30,
} as const;

// 一日の最大時間（15:00から19:00 = 240分）
export const MAX_TIME = 240;

export const MOVE_COST = {
  ENTER_ROOM: 1,
  EXIT_ROOM: 0,
  CHANGE_FLOOR: 2,
  GO_OUTSIDE: 3,
  GO_INSIDE: 2,
} as const;

export function getFloorFromLocation(loc: LocationId): Floor {
  return LOCATION_FLOOR_MAP[loc];
}

export function isCorridorLocation(loc: LocationId): boolean {
  return loc.startsWith('corridor_');
}

export function getCorridorForFloor(floor: Floor): LocationId {
  return `corridor_${floor}` as LocationId;
}

export function getFloorMoveCost(from: Floor, to: Floor): number {
  if (from === '1f' && to === 'ground') return MOVE_COST.GO_OUTSIDE;
  if (from === 'ground' && to === '1f') return MOVE_COST.GO_INSIDE;
  return MOVE_COST.CHANGE_FLOOR;
}

function makeHobbies(
  likes: HobbyTopic[],
  dislikes: HobbyTopic[]
): Record<HobbyTopic, HobbyPreference> {
  const all: HobbyTopic[] = ['love', 'game', 'sns', 'sports_hobby', 'study', 'video', 'music', 'reading', 'fashion', 'fortune'];
  const result = {} as Record<HobbyTopic, HobbyPreference>;
  for (const h of all) {
    if (likes.includes(h)) result[h] = 'like';
    else if (dislikes.includes(h)) result[h] = 'dislike';
    else result[h] = 'neutral';
  }
  return result;
}

// 性格×属性から口癖を決定する
export { getCatchphrase } from './catchphrase';

export const STUDENTS: Student[] = [
  // 既存5名（ポートレートあり）
  {
    id: 'tanaka_daiki',
    name: '田中大輝',
    nickname: 'ダイキ',
    gender: 'male',
    className: '1-B',
    clubId: 'soccer',
    description: '素直で裏表がない。考えるより先に体が動くタイプ。友達思いで、意外にもゲーム好きというインドアな一面もある。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['game', 'sports_hobby'], ['love', 'reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 25, progressive: 25, sports: 50 },
    attributes: ['energetic_social', 'energetic', 'sporty'] as Attribute[],
    likedAttributes: ['energetic', 'sporty', 'energetic_social', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'cool', 'braid'] as PreferenceAttr[],
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
    nickname: '委員長',
    gender: 'male',
    className: '2-B',
    clubId: null,
    description: '規則第一の委員長気質。正義感は強いが融通が利かない。実は猫を3匹飼っており、誰にも言えないゲーム好き。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['study'], ['sports_hobby', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 55, progressive: 20, sports: 25 },
    attributes: ['introverted', 'serious', 'cool', 'glasses'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'blonde', 'busty'] as PreferenceAttr[],
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
    nickname: 'ゆい',
    gender: 'female',
    className: '1-A',
    clubId: null,
    description: '天真爛漫で誰とでも仲良くなれるムードメーカー。空気を読むのが上手だが、周囲に流されがちな一面も。',
    hairStyle: 'straight' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['love', 'sns', 'fortune'], ['study', 'reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 40, sports: 30 },
    attributes: ['energetic_social', 'airhead', 'energetic'] as Attribute[],
    likedAttributes: ['fashionable', 'energetic_social', 'energetic', 'twintail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'serious', 'bun'] as PreferenceAttr[],
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
    nickname: 'あおい',
    gender: 'female',
    className: '2-A',
    clubId: null,
    description: '冷静沈着だが内に秘めた情熱がある。SNSフォロワー1万人の分析力を持つ。データで物事を判断する。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['sns', 'reading'], ['sports_hobby', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['introverted', 'cool', 'fashionable'] as Attribute[],
    likedAttributes: ['cool', 'fashionable', 'serious', 'bob'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'delinquent', 'airhead', 'twintail'] as PreferenceAttr[],
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
    nickname: 'さくら',
    gender: 'female',
    className: '2-C',
    clubId: null,
    description: '表面はにこやかだが裏で人間関係を把握している策士。観察眼が鋭く、情報収集を怠らない。',
    hairStyle: 'wavy' as HairStyle,
    personality: 'cunning' as Personality,
    hobbies: makeHobbies(['sns', 'fashion', 'fortune'], ['sports_hobby', 'study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 60, progressive: 25, sports: 15 },
    attributes: ['airhead', 'fashionable', 'young', 'flat'] as Attribute[],
    likedAttributes: ['fashionable', 'adult', 'cool', 'wavy', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'energetic', 'young', 'braid'] as PreferenceAttr[],
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
    nickname: 'ユウト',
    gender: 'male',
    className: '3-B',
    clubId: 'art',
    description: '理想家で情熱的。自分の信念のためなら衝突も厭わない。美術部で油絵を描き、作品をSNSで発信している。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sns'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 20, progressive: 60, sports: 20 },
    attributes: ['cool', 'serious'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'airhead', 'twintail'] as PreferenceAttr[],
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
    nickname: 'ケンタ',
    gender: 'male',
    className: '3-D',
    clubId: 'track',
    description: '寡黙だが芯が強い。一度決めたら絶対に曲げない。後輩の面倒見は良く、格闘ゲームが密かな趣味。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['game'], ['reading', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 20, progressive: 15, sports: 65 },
    attributes: ['sporty', 'serious'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail', 'flat'] as PreferenceAttr[],
    dislikedAttributes: ['fashionable', 'airhead', 'wavy'] as PreferenceAttr[],
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
    nickname: 'あかね',
    gender: 'female',
    className: '1-C',
    clubId: null,
    description: '引っ込み思案だが芯は強い。図書委員で読書好き。読書アカウントをSNSで運営し、慎重に物事を進める。',
    hairStyle: 'braid' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['reading', 'sns', 'fortune'], ['sports_hobby']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 30, sports: 40 },
    attributes: ['introverted', 'serious', 'glasses'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool', 'braid'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'ponytail'] as PreferenceAttr[],
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
    nickname: 'つばさ',
    gender: 'male',
    className: '1-D',
    clubId: 'baseball',
    description: 'ゲームと動画が大好きな自由人。深く考えるのは苦手だが、柔軟な発想で周りを驚かせることがある。',
    hairStyle: 'straight' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['game', 'video'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['energetic_social', 'airhead'] as Attribute[],
    likedAttributes: ['energetic', 'airhead', 'twintail'] as PreferenceAttr[],
    dislikedAttributes: ['serious', 'cool', 'bun'] as PreferenceAttr[],
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
    nickname: 'みっちゃん',
    gender: 'female',
    className: '2-D',
    clubId: 'tennis',
    description: '明るくて面倒見のいいスポーツ少女。恋バナが大好きで、テニス部ではムードメーカー的存在。',
    hairStyle: 'ponytail' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['love', 'sports_hobby'], ['reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 15, progressive: 25, sports: 60 },
    attributes: ['energetic', 'sporty', 'energetic_social', 'busty'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'glasses', 'wavy'] as PreferenceAttr[],
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
    nickname: 'ショウ',
    gender: 'male',
    className: '3-A',
    clubId: 'brass',
    description: '物腰柔らかで社交的だが、慎重に人を見極める一面もある。音楽を愛し、吹奏楽部でクラリネットを担当。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['love', 'music'], ['sports_hobby']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 50, progressive: 30, sports: 20 },
    attributes: ['cool', 'fashionable'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'adult', 'bob', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'delinquent', 'twintail'] as PreferenceAttr[],
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
    nickname: 'ガク',
    gender: 'male',
    className: '3-C',
    clubId: null,
    description: '学年トップクラスの秀才。頑固で自分の信念を曲げない。勉強と読書が生きがいで、流行には無関心。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['study', 'reading'], ['game', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 70, progressive: 15, sports: 15 },
    attributes: ['introverted', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'straight', 'braid'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'energetic_social', 'busty'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 15, intel: 90, maxHp: 75 },
    affinity: 0,
    talkCount: 0,
    portrait: saitoManabuPortrait,
    candidateId: null,
    playable: true,
  },
  // === 追加キャラクター（サブリーダー・メンバー、ポートレートなし） ===
  // 1-A サブリーダー
  {
    id: 'ogawa_haruka',
    name: '小川はるか',
    nickname: 'はるちゃん',
    gender: 'female',
    className: '1-A',
    clubId: 'brass',
    description: 'おっとりした性格だが音楽への情熱は人一倍。フルート担当で、占いが日課。',
    hairStyle: 'bun' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['music', 'fortune'], ['game']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 40, progressive: 35, sports: 25 },
    attributes: ['airhead', 'young', 'flat'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'wavy'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'sporty', 'straight'] as PreferenceAttr[],
    stats: { speech: 45, athletic: 25, intel: 55, maxHp: 80 },
    affinity: 0,
    talkCount: 0,
    portrait: ogawaHarukaPortrait,
    candidateId: null,
    playable: false,
  },
  // 1-A メンバー
  {
    id: 'inoue_momoka',
    name: '井上桃花',
    nickname: 'モモ',
    gender: 'female',
    className: '1-A',
    clubId: null,
    description: 'SNSで占い配信をしている1年生。明るいが計算高い一面もあり、情報通。',
    hairStyle: 'twintail' as HairStyle,
    personality: 'cunning' as Personality,
    hobbies: makeHobbies(['sns', 'fortune', 'fashion'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 20, progressive: 55, sports: 25 },
    attributes: ['fashionable', 'young', 'energetic_social', 'flat'] as Attribute[],
    likedAttributes: ['fashionable', 'energetic_social', 'twintail', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['serious', 'introverted', 'braid'] as PreferenceAttr[],
    stats: { speech: 60, athletic: 30, intel: 50, maxHp: 85 },
    affinity: 0,
    talkCount: 0,
    portrait: inoueMomokaPortrait,
    candidateId: null,
    playable: false,
  },
  // 1-B サブリーダー
  {
    id: 'endo_ryota',
    name: '遠藤涼太',
    nickname: 'リョウタ',
    gender: 'male',
    className: '1-B',
    clubId: 'soccer',
    description: '体力自慢でサッカー部の期待の星。素直すぎて騙されやすいが、誰からも好かれる。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sports_hobby', 'video'], ['study', 'reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 15, progressive: 25, sports: 60 },
    attributes: ['sporty', 'energetic', 'young'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'glasses', 'braid'] as PreferenceAttr[],
    stats: { speech: 25, athletic: 75, intel: 20, maxHp: 115 },
    affinity: 0,
    talkCount: 0,
    portrait: endoRyotaPortrait,
    candidateId: null,
    playable: false,
  },
  // 1-B メンバー
  {
    id: 'shimizu_nana',
    name: '清水菜々',
    nickname: 'ナナ',
    gender: 'female',
    className: '1-B',
    clubId: null,
    description: '恋バナが大好きなクラスのムードメーカー。誰にでも合わせられるが、芯がない。',
    hairStyle: 'wavy' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['love', 'fashion'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 35, progressive: 40, sports: 25 },
    attributes: ['energetic_social', 'fashionable'] as Attribute[],
    likedAttributes: ['fashionable', 'energetic_social', 'wavy'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'serious', 'straight'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 35, intel: 35, maxHp: 90 },
    affinity: 0,
    talkCount: 0,
    portrait: shimizuNanaPortrait,
    candidateId: null,
    playable: false,
  },
  // 1-C サブリーダー
  {
    id: 'aoki_sora',
    name: '青木蒼',
    nickname: 'アオ',
    gender: 'male',
    className: '1-C',
    clubId: null,
    description: '文学少年で図書委員。議論好きで弁が立つ。穏やかだが、実は変革派に共感している。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['reading', 'study'], ['sports_hobby', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 25, progressive: 50, sports: 25 },
    attributes: ['introverted', 'glasses', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'ponytail'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 15, intel: 70, maxHp: 70 },
    affinity: 0,
    talkCount: 0,
    portrait: aokiSoraPortrait,
    candidateId: null,
    playable: false,
  },
  // 1-C メンバー
  {
    id: 'morita_chihiro',
    name: '森田千尋',
    nickname: 'ちーちゃん',
    gender: 'female',
    className: '1-C',
    clubId: 'art',
    description: '美術部の新入り。独特のセンスで水彩画を描く。おっとりしていて周囲に流されやすい。',
    hairStyle: 'bob' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['music', 'fashion'], ['sports_hobby']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['introverted', 'young', 'flat'] as Attribute[],
    likedAttributes: ['cool', 'fashionable', 'bob'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'delinquent', 'ponytail'] as PreferenceAttr[],
    stats: { speech: 35, athletic: 20, intel: 55, maxHp: 75 },
    affinity: 0,
    talkCount: 0,
    portrait: moritaChihiroPortrait,
    candidateId: null,
    playable: false,
  },
  // 1-D サブリーダー
  {
    id: 'nishida_kaito',
    name: '西田海斗',
    nickname: 'カイト',
    gender: 'male',
    className: '1-D',
    clubId: 'baseball',
    description: '野球一筋の硬派な1年生。口数は少ないが、一度決めたことはやり通す根性の持ち主。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['sports_hobby', 'game'], ['fashion', 'love']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 15, sports: 55 },
    attributes: ['sporty', 'serious'] as Attribute[],
    likedAttributes: ['sporty', 'serious', 'straight', 'flat'] as PreferenceAttr[],
    dislikedAttributes: ['airhead', 'fashionable', 'wavy'] as PreferenceAttr[],
    stats: { speech: 20, athletic: 70, intel: 30, maxHp: 110 },
    affinity: 0,
    talkCount: 0,
    portrait: nishidaKaitoPortrait,
    candidateId: null,
    playable: false,
  },
  // 1-D メンバー
  {
    id: 'hayashi_riko',
    name: '林りこ',
    nickname: 'りこりん',
    gender: 'female',
    className: '1-D',
    clubId: null,
    description: 'ゲームと動画鑑賞が趣味のインドア派。おとなしいが、好きな話題になると止まらない。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['game', 'video'], ['sports_hobby']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 35, progressive: 45, sports: 20 },
    attributes: ['introverted', 'glasses', 'flat'] as Attribute[],
    likedAttributes: ['introverted', 'glasses', 'braid'] as PreferenceAttr[],
    dislikedAttributes: ['energetic_social', 'sporty', 'busty'] as PreferenceAttr[],
    stats: { speech: 30, athletic: 10, intel: 60, maxHp: 65 },
    affinity: 0,
    talkCount: 0,
    portrait: hayashiRikoPortrait,
    candidateId: null,
    playable: false,
  },
  // 2-A サブリーダー
  {
    id: 'fujita_mei',
    name: '藤田芽衣',
    nickname: 'メイ',
    gender: 'female',
    className: '2-A',
    clubId: 'tennis',
    description: 'テニス部の実力者で負けず嫌い。社交的でSNSも活用するが、本心を見せない一面がある。',
    hairStyle: 'ponytail' as HairStyle,
    personality: 'cunning' as Personality,
    hobbies: makeHobbies(['sports_hobby', 'sns'], ['reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 20, progressive: 40, sports: 40 },
    attributes: ['sporty', 'fashionable', 'energetic', 'busty'] as Attribute[],
    likedAttributes: ['sporty', 'fashionable', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'airhead', 'bun'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 65, intel: 50, maxHp: 95 },
    affinity: 0,
    talkCount: 0,
    portrait: fujitaMeiPortrait,
    candidateId: null,
    playable: false,
  },
  // 2-A メンバー
  {
    id: 'ueda_takumi',
    name: '上田拓海',
    nickname: 'タク',
    gender: 'male',
    className: '2-A',
    clubId: null,
    description: '真面目で堅実な努力家。目立つことは嫌いだが、周囲からの信頼は厚い。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['study', 'reading'], ['sns', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 55, progressive: 30, sports: 15 },
    attributes: ['serious', 'introverted'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'wavy'] as PreferenceAttr[],
    stats: { speech: 40, athletic: 30, intel: 70, maxHp: 80 },
    affinity: 0,
    talkCount: 0,
    portrait: uedaTakumiPortrait,
    candidateId: null,
    playable: false,
  },
  // 2-B サブリーダー
  {
    id: 'kimura_yuna',
    name: '木村ゆな',
    nickname: 'ゆなち',
    gender: 'female',
    className: '2-B',
    clubId: null,
    description: 'ファッション好きのギャル風だが成績優秀。見た目と中身のギャップで周囲を驚かせる。',
    hairStyle: 'wavy' as HairStyle,
    personality: 'cunning' as Personality,
    hobbies: makeHobbies(['fashion', 'sns', 'love'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 25, progressive: 50, sports: 25 },
    attributes: ['fashionable', 'blonde', 'energetic_social', 'busty'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'wavy', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['serious', 'introverted', 'braid'] as PreferenceAttr[],
    stats: { speech: 65, athletic: 35, intel: 60, maxHp: 85 },
    affinity: 0,
    talkCount: 0,
    portrait: kimuraYunaPortrait,
    candidateId: null,
    playable: false,
  },
  // 2-B メンバー
  {
    id: 'murakami_sota',
    name: '村上蒼太',
    nickname: 'ソウタ',
    gender: 'male',
    className: '2-B',
    clubId: 'soccer',
    description: 'サッカー部の頑張り屋。口下手だが行動で示すタイプ。動画鑑賞も好き。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sports_hobby', 'video'], ['reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 20, progressive: 20, sports: 60 },
    attributes: ['sporty', 'energetic'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['fashionable', 'cool', 'twintail'] as PreferenceAttr[],
    stats: { speech: 20, athletic: 70, intel: 25, maxHp: 115 },
    affinity: 0,
    talkCount: 0,
    portrait: murakamiSotaPortrait,
    candidateId: null,
    playable: false,
  },
  // 2-C サブリーダー
  {
    id: 'yoshida_hinata',
    name: '吉田ひなた',
    nickname: 'ひなた',
    gender: 'female',
    className: '2-C',
    clubId: 'art',
    description: '美術部の副部長。穏やかで聞き上手だが、芸術への審美眼は厳しい。保守的な価値観を持つ。',
    hairStyle: 'braid' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['music', 'reading'], ['game', 'sports_hobby']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 50, progressive: 30, sports: 20 },
    attributes: ['cool', 'serious'] as Attribute[],
    likedAttributes: ['cool', 'serious', 'fashionable', 'braid'] as PreferenceAttr[],
    dislikedAttributes: ['airhead', 'energetic_social', 'twintail'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 20, intel: 65, maxHp: 80 },
    affinity: 0,
    talkCount: 0,
    portrait: yoshidaHinataPortrait,
    candidateId: null,
    playable: false,
  },
  // 2-C メンバー
  {
    id: 'okamoto_rin',
    name: '岡本凜',
    nickname: 'りんちゃん',
    gender: 'female',
    className: '2-C',
    clubId: null,
    description: 'お菓子作りが得意な家庭科委員。面倒見がよく、悩み相談をよく受ける。',
    hairStyle: 'bun' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['love', 'fortune', 'video'], ['sports_hobby']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 40, progressive: 35, sports: 25 },
    attributes: ['airhead', 'young', 'energetic_social', 'flat'] as Attribute[],
    likedAttributes: ['energetic_social', 'airhead', 'twintail'] as PreferenceAttr[],
    dislikedAttributes: ['cool', 'delinquent', 'straight'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 25, intel: 45, maxHp: 90 },
    affinity: 0,
    talkCount: 0,
    portrait: okamotoRinPortrait,
    candidateId: null,
    playable: false,
  },
  // 2-D サブリーダー
  {
    id: 'goto_hayato',
    name: '後藤隼人',
    nickname: 'ハヤト',
    gender: 'male',
    className: '2-D',
    clubId: 'track',
    description: '陸上部の短距離エース。明るく社交的だが、勝負の時は真剣。保守派の家庭で育った。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sports_hobby', 'music'], ['reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 35, progressive: 15, sports: 50 },
    attributes: ['sporty', 'energetic', 'energetic_social'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail', 'flat'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'glasses', 'bun'] as PreferenceAttr[],
    stats: { speech: 35, athletic: 80, intel: 25, maxHp: 120 },
    affinity: 0,
    talkCount: 0,
    portrait: gotoHayatoPortrait,
    candidateId: null,
    playable: false,
  },
  // 2-D メンバー
  {
    id: 'sakamoto_miu',
    name: '坂本美羽',
    nickname: 'ミウ',
    gender: 'female',
    className: '2-D',
    clubId: null,
    description: '音楽好きでイヤホンが手放せない。マイペースで我が道を行くタイプ。',
    hairStyle: 'bob' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['music', 'video'], ['love', 'sports_hobby']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['cool', 'introverted'] as Attribute[],
    likedAttributes: ['cool', 'introverted', 'bob'] as PreferenceAttr[],
    dislikedAttributes: ['energetic_social', 'sporty', 'twintail'] as PreferenceAttr[],
    stats: { speech: 40, athletic: 20, intel: 55, maxHp: 75 },
    affinity: 0,
    talkCount: 0,
    portrait: sakamotoMiuPortrait,
    candidateId: null,
    playable: false,
  },
  // 3-A サブリーダー
  {
    id: 'yamaguchi_ryo',
    name: '山口涼',
    nickname: 'リョウ',
    gender: 'male',
    className: '3-A',
    clubId: 'brass',
    description: '吹奏楽部でトランペット担当。冷静で論理的。音楽理論に詳しく、保守的な価値観の持ち主。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['music', 'study'], ['game']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 55, progressive: 25, sports: 20 },
    attributes: ['cool', 'serious', 'glasses'] as Attribute[],
    likedAttributes: ['serious', 'cool', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'wavy'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 25, intel: 75, maxHp: 80 },
    affinity: 0,
    talkCount: 0,
    portrait: yamaguchiRyoPortrait,
    candidateId: null,
    playable: false,
  },
  // 3-A メンバー
  {
    id: 'ikeda_kotone',
    name: '池田琴音',
    nickname: 'コトネ',
    gender: 'female',
    className: '3-A',
    clubId: null,
    description: '勉強熱心な学級委員。几帳面で人に厳しいが、実は恋バナに弱い。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['study', 'love'], ['game', 'video']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 60, progressive: 25, sports: 15 },
    attributes: ['serious', 'glasses', 'adult', 'busty'] as Attribute[],
    likedAttributes: ['serious', 'adult', 'straight', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['airhead', 'delinquent', 'twintail'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 20, intel: 80, maxHp: 75 },
    affinity: 0,
    talkCount: 0,
    portrait: ikedaKotonePortrait,
    candidateId: null,
    playable: false,
  },
  // 3-B サブリーダー
  {
    id: 'otsuka_itsuki',
    name: '大塚樹',
    nickname: 'イツキ',
    gender: 'male',
    className: '3-B',
    clubId: null,
    description: '弁が立つ議論好き。ディベート部出身で、どんな立場でも論じられる。革新派に傾倒。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sns', 'reading'], ['sports_hobby']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 15, progressive: 60, sports: 25 },
    attributes: ['energetic', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'energetic', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['airhead', 'sporty', 'bun'] as PreferenceAttr[],
    stats: { speech: 75, athletic: 30, intel: 65, maxHp: 85 },
    affinity: 0,
    talkCount: 0,
    portrait: otsukaItsukiPortrait,
    candidateId: null,
    playable: false,
  },
  // 3-B メンバー
  {
    id: 'tanabe_misaki',
    name: '田辺美咲',
    nickname: 'ミサキ',
    gender: 'female',
    className: '3-B',
    clubId: 'tennis',
    description: 'テニス部の3年生。礼儀正しく温厚だが、勝負になると別人のように闘志を燃やす。',
    hairStyle: 'ponytail' as HairStyle,
    personality: 'flexible' as Personality,
    hobbies: makeHobbies(['sports_hobby', 'love'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 35, progressive: 30, sports: 35 },
    attributes: ['sporty', 'energetic_social', 'busty'] as Attribute[],
    likedAttributes: ['sporty', 'energetic_social', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'cool', 'braid'] as PreferenceAttr[],
    stats: { speech: 45, athletic: 60, intel: 40, maxHp: 100 },
    affinity: 0,
    talkCount: 0,
    portrait: tanabeMisakiPortrait,
    candidateId: null,
    playable: false,
  },
  // 3-C サブリーダー
  {
    id: 'kawano_shiori',
    name: '河野しおり',
    nickname: 'しおりん',
    gender: 'female',
    className: '3-C',
    clubId: null,
    description: '成績優秀で真面目な図書委員長。保守寄りだが、斎藤には対等に意見する唯一の存在。',
    hairStyle: 'braid' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['reading', 'study'], ['game', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 50, progressive: 35, sports: 15 },
    attributes: ['serious', 'glasses', 'introverted'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'braid'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'busty'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 15, intel: 85, maxHp: 70 },
    affinity: 0,
    talkCount: 0,
    portrait: kawanoShioriPortrait,
    candidateId: null,
    playable: false,
  },
  // 3-C メンバー
  {
    id: 'maeda_taiga',
    name: '前田大河',
    nickname: 'タイガ',
    gender: 'male',
    className: '3-C',
    clubId: 'track',
    description: '陸上部の長距離ランナー。寡黙で不器用だが、仲間思い。勉強は苦手だが根性がある。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['sports_hobby'], ['study', 'reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 15, progressive: 15, sports: 70 },
    attributes: ['sporty', 'serious'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['fashionable', 'airhead', 'wavy'] as PreferenceAttr[],
    stats: { speech: 15, athletic: 85, intel: 15, maxHp: 125 },
    affinity: 0,
    talkCount: 0,
    portrait: maedaTaigaPortrait,
    candidateId: null,
    playable: false,
  },
  // 3-D サブリーダー
  {
    id: 'noguchi_saki',
    name: '野口咲希',
    nickname: 'サキ',
    gender: 'female',
    className: '3-D',
    clubId: 'baseball',
    description: '野球部のマネージャー。しっかり者で面倒見がいい。保守的な考えの持ち主。',
    hairStyle: 'ponytail' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['sports_hobby', 'love'], ['game']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 45, progressive: 20, sports: 35 },
    attributes: ['energetic_social', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'sporty', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'twintail'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 45, intel: 55, maxHp: 90 },
    affinity: 0,
    talkCount: 0,
    portrait: noguchiSakiPortrait,
    candidateId: null,
    playable: false,
  },
  // 3-D メンバー
  {
    id: 'ishikawa_yusuke',
    name: '石川悠介',
    nickname: 'ユウスケ',
    gender: 'male',
    className: '3-D',
    clubId: null,
    description: '不良っぽい見た目だが情に厚い。獅堂を男として尊敬しており、忠誠心が高い。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['game', 'sports_hobby'], ['study', 'reading']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 10, progressive: 15, sports: 75 },
    attributes: ['delinquent', 'energetic', 'adult'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'delinquent', 'wavy'] as PreferenceAttr[],
    dislikedAttributes: ['serious', 'glasses', 'braid'] as PreferenceAttr[],
    stats: { speech: 30, athletic: 65, intel: 15, maxHp: 120 },
    affinity: 0,
    talkCount: 0,
    portrait: ishikawaYusukePortrait,
    candidateId: null,
    playable: false,
  },
  {
    id: 'iwata_daichi',
    name: '岩田大地',
    nickname: 'ダイチ',
    gender: 'male',
    className: '3-D',
    clubId: 'baseball',
    description: '野球部キャプテン。声が大きく面倒見がいい熱血漢。後輩からの信頼は厚く、試合ではチームを鼓舞する。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sports_hobby', 'video'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 20, progressive: 25, sports: 55 },
    attributes: ['sporty', 'energetic'] as Attribute[],
    likedAttributes: ['energetic', 'ponytail', 'cool'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'glasses', 'airhead'] as PreferenceAttr[],
    stats: { speech: 35, athletic: 85, intel: 20, maxHp: 100 },
    affinity: 0,
    talkCount: 0,
    portrait: iwataDaichiPortrait,
    candidateId: null,
    playable: false,
  },
  // 候補者（説得不可）
  {
    id: 'takayama_seiichi',
    name: '鷹山誠一',
    nickname: '鷹山先輩',
    gender: 'male',
    className: '3-A',
    clubId: null,
    description: '物静かで威厳がある。親が議員という家庭環境もあり、政治や伝統に強い信念を持つ。言葉を選んで話す慎重派。',
    hairStyle: 'straight' as HairStyle,
    personality: 'cautious' as Personality,
    hobbies: makeHobbies(['reading', 'study'], ['sports_hobby', 'game']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 80, progressive: 10, sports: 10 },
    attributes: ['cool', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'cool', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'ponytail'] as PreferenceAttr[],
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
    nickname: 'あかりん',
    gender: 'female',
    className: '3-C',
    clubId: 'art',
    description: '3年生ながら誰よりも行動力がある。新しいことに挑戦するのが好きで、最後の学園祭を最高のものにするため生徒会長選挙に立候補した。SNSでの発信力が武器。',
    hairStyle: 'ponytail' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sns', 'fashion'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 10, progressive: 80, sports: 10 },
    attributes: ['energetic_social', 'energetic', 'fashionable', 'busty'] as Attribute[],
    likedAttributes: ['energetic', 'fashionable', 'energetic_social', 'bob', 'wavy'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'serious', 'bun'] as PreferenceAttr[],
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
    nickname: '獅堂',
    gender: 'male',
    className: '3-D',
    clubId: 'track',
    description: '体育会系のリーダー。議論は苦手だが、体を動かすことへの情熱は誰にも負けない。仲間との絆を大切にする。',
    hairStyle: 'straight' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sports_hobby'], ['reading', 'study']),
    revealedHobbies: new Set<HobbyTopic>(),
    support: { conservative: 10, progressive: 10, sports: 80 },
    attributes: ['sporty', 'energetic', 'energetic_social'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'cool', 'braid'] as PreferenceAttr[],
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
  // 追加キャラクター
  ogawa_haruka: 'music_room',
  endo_ryota: 'soccer_field',
  morita_chihiro: 'art_room',
  nishida_kaito: 'baseball_field',
  fujita_mei: 'tennis_court',
  murakami_sota: 'soccer_field',
  yoshida_hinata: 'art_room',
  goto_hayato: 'track_field',
  yamaguchi_ryo: 'music_room',
  tanabe_misaki: 'tennis_court',
  maeda_taiga: 'track_field',
  noguchi_saki: 'baseball_field',
  iwata_daichi: 'baseball_field',
};

// 生徒の場所スケジュール（currentTime: 0=15:00, 240=19:00）
// 戻り値 null = 帰宅済み（どこにもいない）
export function getStudentLocation(studentId: string, _timeSlot: string, day: number, currentTime: number = 0): LocationId | null {
  const student = STUDENTS.find(s => s.id === studentId);
  if (!student) return 'class1b';

  const classLoc = CLASS_LOCATION_MAP[student.className] ?? 'class1b';
  // 生徒ごとに決定論的な乱数シード
  const seed = day * 7 + studentId.charCodeAt(0) + (studentId.charCodeAt(1) ?? 0) * 13;
  const rand = seed % 5;
  const hasClub = studentId in CLUB_LOCATION_MAP;
  const clubLoc = CLUB_LOCATION_MAP[studentId];

  // 15:00-16:00 (0-60): 放課後すぐ
  if (currentTime < 60) {
    if (hasClub) {
      // 部活組: 半数は教室でまだ準備中、半数は部活場所へ
      return rand < 2 ? classLoc : clubLoc;
    }
    // 帰宅組: 教室・中庭・図書室・食堂
    const options: LocationId[] = [classLoc, 'courtyard', 'library', 'cafeteria'];
    return options[rand % options.length];
  }

  // 16:00-17:00 (60-120): 部活本番
  if (currentTime < 120) {
    if (hasClub) return clubLoc;
    // 帰宅組: ぶらぶら、一部は教室に残る
    const options: LocationId[] = [classLoc, 'courtyard', 'library', 'cafeteria'];
    return options[(rand + 1) % options.length];
  }

  // 17:00-18:00 (120-180): 部活後半、帰宅組の一部が帰宅
  if (currentTime < 180) {
    if (hasClub) {
      // 部活組: まだ活動中、ごく一部は休憩で移動
      return rand < 4 ? clubLoc : 'courtyard';
    }
    // 帰宅組: 約40%が帰宅
    if (rand < 2) return null;
    const options: LocationId[] = ['courtyard', 'library', classLoc];
    return options[rand % options.length];
  }

  // 18:00-19:00 (180-240): 大半が帰宅
  if (hasClub) {
    // 部活組: 約40%が帰宅、残りは部活場所
    if (rand < 2) return null;
    return clubLoc;
  }
  // 帰宅組: 約80%が帰宅
  if (rand < 4) return null;
  return 'library';
}

// 候補者の場所スケジュール（候補者は選挙期間中なので帰宅しない）
export function getCandidateLocation(candidateId: CandidateId, _timeSlot: string, day: number, currentTime: number = 0): LocationId {
  const seed = day * 7 + candidateId.charCodeAt(0);
  const classMap: Record<CandidateId, LocationId> = {
    conservative: 'class3a',
    progressive: 'class3c',
    sports: 'class3d',
  };
  const classLoc = classMap[candidateId];

  const clubMap: Partial<Record<CandidateId, LocationId>> = {
    progressive: 'art_room',
    sports: 'track_field',
  };

  // 15:00-16:00: 教室で選挙準備 or 中庭で演説
  if (currentTime < 60) {
    return seed % 2 === 0 ? classLoc : 'courtyard';
  }
  // 16:00-17:30: 部活がある候補者は部活、ない候補者は中庭・食堂で活動
  if (currentTime < 150) {
    return clubMap[candidateId] ?? (seed % 2 === 0 ? 'courtyard' : 'cafeteria');
  }
  // 17:30-19:00: 中庭や廊下で最後の選挙活動
  const lateOptions: LocationId[] = ['courtyard', 'cafeteria', 'library'];
  return lateOptions[seed % lateOptions.length];
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
  sports_hobby: 'スポーツ',
  study: '勉強',
  video: '動画',
  music: '音楽',
  reading: '読書',
  fashion: 'ファッション',
  fortune: '占い',
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
  // 髪型（好み・苦手用）
  straight: 'ストレート',
  ponytail: 'ポニーテール',
  twintail: 'ツインテール',
  braid: '三つ編み',
  wavy: 'ウェーブ',
  bun: 'お団子',
  bob: 'ボブカット',
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

// 思想の100%横積み上げバーグラフ
export function renderSupportBar(
  support: { conservative: number; progressive: number; sports: number },
  height = 14,
  showLabel = true,
): string {
  const total = support.conservative + support.progressive + support.sports;
  if (total === 0) return '';
  const cPct = Math.round(support.conservative / total * 100);
  const pPct = Math.round(support.progressive / total * 100);
  const sPct = 100 - cPct - pPct;
  const cColor = CANDIDATE_INFO[0].color;
  const pColor = CANDIDATE_INFO[1].color;
  const sColor = CANDIDATE_INFO[2].color;
  const fontSize = Math.max(9, Math.round(height * 0.65));
  const seg = (pct: number, color: string, label: string, radius: string) =>
    pct > 0 ? `<div style="
      width:${pct}%; height:${height}px;
      background:${color};
      display:flex; align-items:center; justify-content:center;
      font-size:${fontSize}px; color:#fff; font-weight:bold;
      white-space:nowrap; overflow:hidden;
      ${radius}
    ">${showLabel && pct >= 12 ? `${label}${pct}` : ''}</div>` : '';

  return `<div style="display:flex; width:100%; border-radius:4px; overflow:hidden; box-shadow:inset 0 1px 2px rgba(0,0,0,0.1);">
    ${seg(cPct, cColor, '保', 'border-radius:4px 0 0 4px;')}
    ${seg(pPct, pColor, '革', '')}
    ${seg(sPct, sColor, '体', 'border-radius:0 4px 4px 0;')}
  </div>`;
}

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
