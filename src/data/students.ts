import type {
  Student, HobbyTopic, HobbyPreference,
  HairStyle, Attribute, PreferenceAttr, Personality, LocationId
} from '../types';
import { CLASS_LOCATION_MAP } from './locations';
import { getLang } from '../i18n';
import { EN_STUDENT_DATA } from '../i18n/en-students';

import tanakaDaikiPortrait from '../../assets/portraits/tanaka_daiki.webp';
import yamamotoRenPortrait from '../../assets/portraits/yamamoto_ren.webp';
import satoYuiPortrait from '../../assets/portraits/sato_yui.webp';
import watanabeAoiPortrait from '../../assets/portraits/watanabe_aoi.webp';
import nakamuraSakuraPortrait from '../../assets/portraits/nakamura_sakura.webp';
import takahashiYutoPortrait from '../../assets/portraits/takahashi_yuto.webp';
import matsumotoKentaPortrait from '../../assets/portraits/matsumoto_kenta.webp';
import miyazakiAkanePortrait from '../../assets/portraits/miyazaki_akane.webp';
import hashimotoTsubasaPortrait from '../../assets/portraits/hashimoto_tsubasa.webp';
import katoMitsukiPortrait from '../../assets/portraits/kato_mitsuki.webp';
import suzukiShotaPortrait from '../../assets/portraits/suzuki_shota.webp';
import saitoManabuPortrait from '../../assets/portraits/saito_manabu.webp';
import takayamaSeiichiPortrait from '../../assets/portraits/takayama_seiichi.webp';
import yuukiAkariPortrait from '../../assets/portraits/yuuki_akari.webp';
import shidoTsuyoshiPortrait from '../../assets/portraits/shido_tsuyoshi.webp';
// 追加キャラクター
import ogawaHarukaPortrait from '../../assets/portraits/ogawa_haruka.webp';
import inoueMomokaPortrait from '../../assets/portraits/inoue_momoka.webp';
import endoRyotaPortrait from '../../assets/portraits/endo_ryota.webp';
import shimizuNanaPortrait from '../../assets/portraits/shimizu_nana.webp';
import aokiSoraPortrait from '../../assets/portraits/aoki_sora.webp';
import moritaChihiroPortrait from '../../assets/portraits/morita_chihiro.webp';
import nishidaKaitoPortrait from '../../assets/portraits/nishida_kaito.webp';
import hayashiRikoPortrait from '../../assets/portraits/hayashi_riko.webp';
import fujitaMeiPortrait from '../../assets/portraits/fujita_mei.webp';
import uedaTakumiPortrait from '../../assets/portraits/ueda_takumi.webp';
import kimuraYunaPortrait from '../../assets/portraits/kimura_yuna.webp';
import murakamiSotaPortrait from '../../assets/portraits/murakami_sota.webp';
import yoshidaHinataPortrait from '../../assets/portraits/yoshida_hinata.webp';
import okamotoRinPortrait from '../../assets/portraits/okamoto_rin.webp';
import gotoHayatoPortrait from '../../assets/portraits/goto_hayato.webp';
import sakamotoMiuPortrait from '../../assets/portraits/sakamoto_miu.webp';
import yamaguchiRyoPortrait from '../../assets/portraits/yamaguchi_ryo.webp';
import ikedaKotonePortrait from '../../assets/portraits/ikeda_kotone.webp';
import otsukaItsukiPortrait from '../../assets/portraits/otsuka_itsuki.webp';
import tanabeMisakiPortrait from '../../assets/portraits/tanabe_misaki.webp';
import kawanoShioriPortrait from '../../assets/portraits/kawano_shiori.webp';
import maedaTaigaPortrait from '../../assets/portraits/maeda_taiga.webp';
import noguchiSakiPortrait from '../../assets/portraits/noguchi_saki.webp';
import ishikawaYusukePortrait from '../../assets/portraits/ishikawa_yusuke.webp';
import iwataDaichiPortrait from '../../assets/portraits/iwata_daichi.webp';

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

export { getCatchphrase } from '../catchphrase';

export const STUDENTS: Student[] = [
  // 派閥の中心人物（3名）
  {
    id: 's30101',
    name: '鷹山誠一',
    nickname: '鷹山先輩',
    gender: 'male',
    className: '3-A',
    clubId: 'student_council',
    description: '威厳があり、一度決めたら曲げない頑固な性格。親が議員という家庭環境もあり、政治や伝統に強い信念を持つ。慎重だが妥協を許さない。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['reading', 'study'], ['sports_hobby', 'game']),
    revealedHobbies: new Set<HobbyTopic>(),
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 80, progressive: 10, sports: 10 },
    attributes: ['cool', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'cool', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'ponytail'] as PreferenceAttr[],
    stats: { speech: 85, athletic: 30, intel: 90, maxHp: 80 },
    affinity: 0,
    portrait: takayamaSeiichiPortrait,
    playable: true,
  },
  {
    id: 's30351',
    name: '結城あかり',
    nickname: 'あかりん',
    gender: 'female',
    className: '3-C',
    clubId: 'art',
    description: '3年生ながら誰よりも行動力がある。新しいことに挑戦するのが好きで、最後の学園祭を最高のものにしたいと考えている。SNSでの発信力が武器。',
    hairStyle: 'ponytail' as HairStyle,
    personality: 'passionate' as Personality,
    hobbies: makeHobbies(['sns', 'fashion'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(),
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 10, progressive: 80, sports: 10 },
    attributes: ['energetic_social', 'energetic', 'fashionable', 'busty'] as Attribute[],
    likedAttributes: ['energetic', 'fashionable', 'energetic_social'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'serious', 'cool'] as PreferenceAttr[],
    stats: { speech: 80, athletic: 50, intel: 65, maxHp: 95 },
    affinity: 0,
    portrait: yuukiAkariPortrait,
    playable: true,
  },
  {
    id: 's30401',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 10, progressive: 10, sports: 80 },
    attributes: ['sporty', 'energetic', 'energetic_social'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'cool', 'braid'] as PreferenceAttr[],
    stats: { speech: 40, athletic: 95, intel: 25, maxHp: 130 },
    affinity: 0,
    portrait: shidoTsuyoshiPortrait,
    playable: true,
  },
  // プレイアブルキャラクター
  {
    id: 's10201',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 25, progressive: 25, sports: 50 },
    attributes: ['energetic_social', 'energetic', 'sporty'] as Attribute[],
    likedAttributes: ['energetic', 'sporty', 'energetic_social', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'cool', 'braid'] as PreferenceAttr[],
    stats: { speech: 30, athletic: 80, intel: 25, maxHp: 120 },
    affinity: 0,
    portrait: tanakaDaikiPortrait,

    playable: true,
  },
  {
    id: 's20201',
    name: '山本蓮',
    nickname: '委員長',
    gender: 'male',
    className: '2-B',
    clubId: 'student_council',
    description: '規則第一の委員長気質。正義感は強いが融通が利かない。実は猫を3匹飼っており、誰にも言えないゲーム好き。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['study', 'game'], ['sports_hobby', 'fashion']),
    revealedHobbies: new Set<HobbyTopic>(),
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 55, progressive: 20, sports: 25 },
    attributes: ['introverted', 'serious', 'cool', 'glasses'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'blonde', 'busty'] as PreferenceAttr[],
    stats: { speech: 60, athletic: 20, intel: 85, maxHp: 80 },
    affinity: 0,
    portrait: yamamotoRenPortrait,

    playable: true,
  },
  {
    id: 's10151',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 30, progressive: 40, sports: 30 },
    attributes: ['energetic_social', 'airhead', 'energetic'] as Attribute[],
    likedAttributes: ['fashionable', 'energetic_social', 'energetic', 'airhead'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'serious', 'cool'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 40, intel: 35, maxHp: 100 },
    affinity: 0,
    portrait: satoYuiPortrait,

    playable: true,
  },
  {
    id: 's20151',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['introverted', 'cool', 'fashionable'] as Attribute[],
    likedAttributes: ['cool', 'fashionable', 'serious', 'adult'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'delinquent', 'airhead', 'energetic'] as PreferenceAttr[],
    stats: { speech: 70, athletic: 15, intel: 80, maxHp: 85 },
    affinity: 0,
    portrait: watanabeAoiPortrait,

    playable: true,
  },
  {
    id: 's20351',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 60, progressive: 25, sports: 15 },
    attributes: ['airhead', 'fashionable', 'young', 'flat'] as Attribute[],
    likedAttributes: ['fashionable', 'adult', 'cool', 'serious', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'energetic', 'young', 'introverted'] as PreferenceAttr[],
    stats: { speech: 75, athletic: 25, intel: 65, maxHp: 90 },
    affinity: 0,
    portrait: nakamuraSakuraPortrait,

    playable: true,
  },
  // 追加7名
  {
    id: 's30201',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 20, progressive: 60, sports: 20 },
    attributes: ['cool', 'serious'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'airhead', 'twintail'] as PreferenceAttr[],
    stats: { speech: 65, athletic: 35, intel: 70, maxHp: 90 },
    affinity: 0,
    portrait: takahashiYutoPortrait,

    playable: true,
  },
  {
    id: 's30402',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 20, progressive: 15, sports: 65 },
    attributes: ['sporty', 'serious'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail', 'flat'] as PreferenceAttr[],
    dislikedAttributes: ['fashionable', 'airhead', 'wavy'] as PreferenceAttr[],
    stats: { speech: 25, athletic: 90, intel: 30, maxHp: 130 },
    affinity: 0,
    portrait: matsumotoKentaPortrait,

    playable: true,
  },
  {
    id: 's10351',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 30, progressive: 30, sports: 40 },
    attributes: ['introverted', 'serious', 'glasses'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool', 'adult'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'fashionable'] as PreferenceAttr[],
    stats: { speech: 40, athletic: 15, intel: 75, maxHp: 70 },
    affinity: 0,
    portrait: miyazakiAkanePortrait,

    playable: true,
  },
  {
    id: 's10401',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['energetic_social', 'airhead'] as Attribute[],
    likedAttributes: ['energetic', 'airhead', 'twintail'] as PreferenceAttr[],
    dislikedAttributes: ['serious', 'cool', 'bun'] as PreferenceAttr[],
    stats: { speech: 45, athletic: 45, intel: 40, maxHp: 100 },
    affinity: 0,
    portrait: hashimotoTsubasaPortrait,

    playable: true,
  },
  {
    id: 's20451',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 15, progressive: 25, sports: 60 },
    attributes: ['energetic', 'sporty', 'energetic_social', 'busty'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'energetic_social'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'glasses', 'serious'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 70, intel: 30, maxHp: 110 },
    affinity: 0,
    portrait: katoMitsukiPortrait,

    playable: true,
  },
  {
    id: 's30102',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 50, progressive: 30, sports: 20 },
    attributes: ['cool', 'fashionable'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'adult', 'bob', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'delinquent', 'twintail'] as PreferenceAttr[],
    stats: { speech: 70, athletic: 20, intel: 65, maxHp: 85 },
    affinity: 0,
    portrait: suzukiShotaPortrait,

    playable: true,
  },
  {
    id: 's30301',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 70, progressive: 15, sports: 15 },
    attributes: ['introverted', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'straight', 'braid'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'energetic_social', 'busty'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 15, intel: 90, maxHp: 75 },
    affinity: 0,
    portrait: saitoManabuPortrait,

    playable: true,
  },
  // === 追加キャラクター（サブリーダー・メンバー、ポートレートなし） ===
  // 1-A サブリーダー
  {
    id: 's10152',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 40, progressive: 35, sports: 25 },
    attributes: ['airhead', 'young', 'flat'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'serious'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'sporty', 'energetic'] as PreferenceAttr[],
    stats: { speech: 45, athletic: 25, intel: 55, maxHp: 80 },
    affinity: 0,
    portrait: ogawaHarukaPortrait,

    playable: false,
  },
  // 1-A メンバー
  {
    id: 's10153',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 20, progressive: 55, sports: 25 },
    attributes: ['fashionable', 'young', 'energetic_social', 'flat'] as Attribute[],
    likedAttributes: ['fashionable', 'energetic_social', 'cool', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['serious', 'introverted', 'sporty'] as PreferenceAttr[],
    stats: { speech: 60, athletic: 30, intel: 50, maxHp: 85 },
    affinity: 0,
    portrait: inoueMomokaPortrait,

    playable: false,
  },
  // 1-B サブリーダー
  {
    id: 's10202',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 15, progressive: 25, sports: 60 },
    attributes: ['sporty', 'energetic', 'young'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'glasses', 'braid'] as PreferenceAttr[],
    stats: { speech: 25, athletic: 75, intel: 20, maxHp: 115 },
    affinity: 0,
    portrait: endoRyotaPortrait,

    playable: false,
  },
  // 1-B メンバー
  {
    id: 's10251',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 35, progressive: 40, sports: 25 },
    attributes: ['energetic_social', 'fashionable'] as Attribute[],
    likedAttributes: ['fashionable', 'energetic_social', 'energetic'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'serious', 'delinquent'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 35, intel: 35, maxHp: 90 },
    affinity: 0,
    portrait: shimizuNanaPortrait,

    playable: false,
  },
  // 1-C サブリーダー
  {
    id: 's10301',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 25, progressive: 50, sports: 25 },
    attributes: ['introverted', 'glasses', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'ponytail'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 15, intel: 70, maxHp: 70 },
    affinity: 0,
    portrait: aokiSoraPortrait,

    playable: false,
  },
  // 1-C メンバー
  {
    id: 's10352',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['introverted', 'young', 'flat'] as Attribute[],
    likedAttributes: ['cool', 'fashionable', 'airhead'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'delinquent', 'energetic'] as PreferenceAttr[],
    stats: { speech: 35, athletic: 20, intel: 55, maxHp: 75 },
    affinity: 0,
    portrait: moritaChihiroPortrait,

    playable: false,
  },
  // 1-D サブリーダー
  {
    id: 's10402',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 30, progressive: 15, sports: 55 },
    attributes: ['sporty', 'serious'] as Attribute[],
    likedAttributes: ['sporty', 'serious', 'straight', 'flat'] as PreferenceAttr[],
    dislikedAttributes: ['airhead', 'fashionable', 'wavy'] as PreferenceAttr[],
    stats: { speech: 20, athletic: 70, intel: 30, maxHp: 110 },
    affinity: 0,
    portrait: nishidaKaitoPortrait,

    playable: false,
  },
  // 1-D メンバー
  {
    id: 's10451',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 35, progressive: 45, sports: 20 },
    attributes: ['introverted', 'glasses', 'flat'] as Attribute[],
    likedAttributes: ['introverted', 'glasses', 'serious'] as PreferenceAttr[],
    dislikedAttributes: ['energetic_social', 'sporty', 'busty'] as PreferenceAttr[],
    stats: { speech: 30, athletic: 10, intel: 60, maxHp: 65 },
    affinity: 0,
    portrait: hayashiRikoPortrait,

    playable: false,
  },
  // 2-A サブリーダー
  {
    id: 's20152',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 20, progressive: 40, sports: 40 },
    attributes: ['sporty', 'fashionable', 'energetic', 'busty'] as Attribute[],
    likedAttributes: ['sporty', 'fashionable', 'energetic'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'airhead', 'serious'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 65, intel: 50, maxHp: 95 },
    affinity: 0,
    portrait: fujitaMeiPortrait,

    playable: false,
  },
  // 2-A メンバー
  {
    id: 's20101',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 55, progressive: 30, sports: 15 },
    attributes: ['serious', 'introverted'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'wavy'] as PreferenceAttr[],
    stats: { speech: 40, athletic: 30, intel: 70, maxHp: 80 },
    affinity: 0,
    portrait: uedaTakumiPortrait,

    playable: false,
  },
  // 2-B サブリーダー
  {
    id: 's20251',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 25, progressive: 50, sports: 25 },
    attributes: ['fashionable', 'blonde', 'energetic_social', 'busty'] as Attribute[],
    likedAttributes: ['fashionable', 'cool', 'blonde', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['serious', 'introverted', 'glasses'] as PreferenceAttr[],
    stats: { speech: 65, athletic: 35, intel: 60, maxHp: 85 },
    affinity: 0,
    portrait: kimuraYunaPortrait,

    playable: false,
  },
  // 2-B メンバー
  {
    id: 's20202',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 20, progressive: 20, sports: 60 },
    attributes: ['sporty', 'energetic'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['fashionable', 'cool', 'twintail'] as PreferenceAttr[],
    stats: { speech: 20, athletic: 70, intel: 25, maxHp: 115 },
    affinity: 0,
    portrait: murakamiSotaPortrait,

    playable: false,
  },
  // 2-C サブリーダー
  {
    id: 's20352',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 50, progressive: 30, sports: 20 },
    attributes: ['cool', 'serious'] as Attribute[],
    likedAttributes: ['cool', 'serious', 'fashionable', 'glasses'] as PreferenceAttr[],
    dislikedAttributes: ['airhead', 'energetic_social', 'delinquent'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 20, intel: 65, maxHp: 80 },
    affinity: 0,
    portrait: yoshidaHinataPortrait,

    playable: false,
  },
  // 2-C メンバー
  {
    id: 's20353',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 40, progressive: 35, sports: 25 },
    attributes: ['airhead', 'young', 'energetic_social', 'flat'] as Attribute[],
    likedAttributes: ['energetic_social', 'airhead', 'energetic'] as PreferenceAttr[],
    dislikedAttributes: ['cool', 'delinquent', 'serious'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 25, intel: 45, maxHp: 90 },
    affinity: 0,
    portrait: okamotoRinPortrait,

    playable: false,
  },
  // 2-D サブリーダー
  {
    id: 's20401',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 35, progressive: 15, sports: 50 },
    attributes: ['sporty', 'energetic', 'energetic_social'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail', 'flat'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'glasses', 'bun'] as PreferenceAttr[],
    stats: { speech: 35, athletic: 80, intel: 25, maxHp: 120 },
    affinity: 0,
    portrait: gotoHayatoPortrait,

    playable: false,
  },
  // 2-D メンバー
  {
    id: 's20452',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 30, progressive: 45, sports: 25 },
    attributes: ['cool', 'introverted'] as Attribute[],
    likedAttributes: ['cool', 'introverted', 'fashionable'] as PreferenceAttr[],
    dislikedAttributes: ['energetic_social', 'sporty', 'airhead'] as PreferenceAttr[],
    stats: { speech: 40, athletic: 20, intel: 55, maxHp: 75 },
    affinity: 0,
    portrait: sakamotoMiuPortrait,

    playable: false,
  },
  // 3-A サブリーダー
  {
    id: 's30103',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 55, progressive: 25, sports: 20 },
    attributes: ['cool', 'serious', 'glasses'] as Attribute[],
    likedAttributes: ['serious', 'cool', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'wavy'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 25, intel: 75, maxHp: 80 },
    affinity: 0,
    portrait: yamaguchiRyoPortrait,

    playable: false,
  },
  // 3-A メンバー
  {
    id: 's30151',
    name: '池田琴音',
    nickname: 'コトネ',
    gender: 'female',
    className: '3-A',
    clubId: 'student_council',
    description: '勉強熱心な生徒会書記。几帳面で人に厳しいが、実は恋バナに弱い。',
    hairStyle: 'straight' as HairStyle,
    personality: 'stubborn' as Personality,
    hobbies: makeHobbies(['study', 'love'], ['game', 'video']),
    revealedHobbies: new Set<HobbyTopic>(),
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 60, progressive: 25, sports: 15 },
    attributes: ['serious', 'glasses', 'adult', 'busty'] as Attribute[],
    likedAttributes: ['serious', 'adult', 'cool', 'busty'] as PreferenceAttr[],
    dislikedAttributes: ['airhead', 'delinquent', 'energetic_social'] as PreferenceAttr[],
    stats: { speech: 55, athletic: 20, intel: 80, maxHp: 75 },
    affinity: 0,
    portrait: ikedaKotonePortrait,

    playable: false,
  },
  // 3-B サブリーダー
  {
    id: 's30202',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 15, progressive: 60, sports: 25 },
    attributes: ['energetic', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'energetic', 'energetic_social', 'straight'] as PreferenceAttr[],
    dislikedAttributes: ['sporty', 'bun'] as PreferenceAttr[],
    stats: { speech: 75, athletic: 30, intel: 65, maxHp: 85 },
    affinity: 0,
    portrait: otsukaItsukiPortrait,

    playable: false,
  },
  // 3-B メンバー
  {
    id: 's30251',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 35, progressive: 30, sports: 35 },
    attributes: ['sporty', 'energetic_social', 'busty'] as Attribute[],
    likedAttributes: ['sporty', 'energetic_social', 'energetic'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'cool', 'serious'] as PreferenceAttr[],
    stats: { speech: 45, athletic: 60, intel: 40, maxHp: 100 },
    affinity: 0,
    portrait: tanabeMisakiPortrait,

    playable: false,
  },
  // 3-C サブリーダー
  {
    id: 's30352',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 50, progressive: 35, sports: 15 },
    attributes: ['serious', 'glasses', 'introverted'] as Attribute[],
    likedAttributes: ['serious', 'glasses', 'cool'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'energetic_social', 'busty'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 15, intel: 85, maxHp: 70 },
    affinity: 0,
    portrait: kawanoShioriPortrait,

    playable: false,
  },
  // 3-C メンバー
  {
    id: 's30302',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 15, progressive: 15, sports: 70 },
    attributes: ['sporty', 'serious'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'ponytail'] as PreferenceAttr[],
    dislikedAttributes: ['fashionable', 'airhead', 'wavy'] as PreferenceAttr[],
    stats: { speech: 15, athletic: 85, intel: 15, maxHp: 125 },
    affinity: 0,
    portrait: maedaTaigaPortrait,

    playable: false,
  },
  // 3-D サブリーダー
  {
    id: 's30451',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 45, progressive: 20, sports: 35 },
    attributes: ['energetic_social', 'serious'] as Attribute[],
    likedAttributes: ['serious', 'sporty', 'energetic'] as PreferenceAttr[],
    dislikedAttributes: ['delinquent', 'airhead', 'fashionable'] as PreferenceAttr[],
    stats: { speech: 50, athletic: 45, intel: 55, maxHp: 90 },
    affinity: 0,
    portrait: noguchiSakiPortrait,

    playable: false,
  },
  // 3-D メンバー
  {
    id: 's30403',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 10, progressive: 15, sports: 75 },
    attributes: ['delinquent', 'energetic', 'adult'] as Attribute[],
    likedAttributes: ['sporty', 'energetic', 'delinquent', 'wavy', 'fashionable', 'airhead'] as PreferenceAttr[],
    dislikedAttributes: ['serious', 'glasses', 'braid'] as PreferenceAttr[],
    stats: { speech: 30, athletic: 65, intel: 15, maxHp: 120 },
    affinity: 0,
    portrait: ishikawaYusukePortrait,

    playable: false,
  },
  {
    id: 's30404',
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
    revealedLikes: [],
    revealedDislikes: [],
    support: { conservative: 20, progressive: 25, sports: 55 },
    attributes: ['sporty', 'energetic'] as Attribute[],
    likedAttributes: ['energetic', 'ponytail', 'cool'] as PreferenceAttr[],
    dislikedAttributes: ['introverted', 'glasses', 'airhead'] as PreferenceAttr[],
    stats: { speech: 35, athletic: 85, intel: 20, maxHp: 100 },
    affinity: 0,
    portrait: iwataDaichiPortrait,

    playable: false,
  },
];

/** チュートリアル対戦相手（渡辺あおい） */
export function getTutorialOpponent(): Student {
  const s = STUDENTS.find(s => s.id === 's20151')!;
  return {
    ...s,
    revealedHobbies: new Set<HobbyTopic>(['sns', 'sports_hobby']),
    revealedLikes: [],
    revealedDislikes: [],
    affinity: 10,  // 好感度少しあり（チュートリアルで初期バーが少し有利に）
  };
}

// 部活スケジュール（放課後の場所）
const CLUB_LOCATION_MAP: Record<string, LocationId> = {
  s10201: 'soccer_field',    // 田中大輝
  s30402: 'track_field',     // 松本健太
  s20451: 'tennis_court',    // 加藤美月
  s30201: 'art_room',        // 高橋悠人
  s10401: 'baseball_field',  // 橋本翼
  s30102: 'music_room',      // 鈴木翔太
  s10351: 'library',         // 宮崎あかね
  s10152: 'music_room',      // 小川はるか
  s10202: 'soccer_field',    // 遠藤涼太
  s10352: 'art_room',        // 森田千尋
  s10402: 'baseball_field',  // 西田海斗
  s20152: 'tennis_court',    // 藤田芽衣
  s20202: 'soccer_field',    // 村上蒼太
  s20352: 'art_room',        // 吉田ひなた
  s20401: 'track_field',     // 後藤隼人
  s30103: 'music_room',      // 山口涼
  s30251: 'tennis_court',    // 田辺美咲
  s30302: 'track_field',     // 前田大河
  s30451: 'baseball_field',  // 野口咲希
  s30404: 'baseball_field',  // 岩田大地
  s30351: 'art_room',        // 結城あかり
  s30401: 'track_field',     // 獅堂剛
  s30101: 'student_council', // 鷹山誠一（生徒会）
  s20201: 'student_council', // 山本蓮（生徒会）
  s30151: 'student_council', // 池田琴音（生徒会）
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

export function getStudentName(student: Student): string {
  if (getLang() === 'en') {
    return EN_STUDENT_DATA[student.id]?.name ?? student.name;
  }
  return student.name;
}

export function getStudentNickname(student: Student): string {
  if (getLang() === 'en') {
    return EN_STUDENT_DATA[student.id]?.nickname ?? student.nickname;
  }
  return student.nickname;
}

export function getStudentDescription(student: Student): string {
  if (getLang() === 'en') {
    return EN_STUDENT_DATA[student.id]?.description ?? student.description;
  }
  return student.description;
}
