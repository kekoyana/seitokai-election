import type { Organization } from '../types';

export const ORGANIZATIONS: Organization[] = [
  // ===== クラス =====
  {
    id: 'class1a',
    name: '1-A組',
    description: 'ゆいの明るさでまとまるクラス。大事なことはみんなの多数決で決める。',
    type: 'majority',       // flexible → majority
    leaderId: 's10151',
    subLeaderIds: ['s10152'],
    memberIds: ['s10153'],
  },
  {
    id: 'class1b',
    name: '1-B組',
    description: '大輝の熱血リーダーシップで動くクラス。ノリと勢いで突き進む。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 's10201',
    subLeaderIds: ['s10202'],
    memberIds: ['s10251'],
  },
  {
    id: 'class1c',
    name: '1-C組',
    description: 'あかねの慎重な進行のもと、話し合いを重ねて結論を出すクラス。',
    type: 'council',        // cautious → council
    leaderId: 's10351',
    subLeaderIds: ['s10301'],
    memberIds: ['s10352'],
  },
  {
    id: 'class1d',
    name: '1-D組',
    description: '翼の自由な空気が流れるクラス。面倒なことは多数決でサクッと決める。',
    type: 'majority',       // flexible → majority
    leaderId: 's10401',
    subLeaderIds: ['s10402'],
    memberIds: ['s10451'],
  },
  {
    id: 'class2a',
    name: '2-A組',
    description: 'あおいのデータ重視の議論が特徴。全員の意見を聞いてから結論を出す。',
    type: 'council',        // cautious → council
    leaderId: 's20151',
    subLeaderIds: ['s20152'],
    memberIds: ['s20101'],
  },
  {
    id: 'class2b',
    name: '2-B組',
    description: '蓮のルールが絶対のクラス。規律正しく、脱線は許されない。',
    type: 'dictatorship',   // stubborn → dictatorship
    leaderId: 's20201',
    subLeaderIds: ['s20251'],
    memberIds: ['s20202'],
  },
  {
    id: 'class2c',
    name: '2-C組',
    description: 'さくらが裏で根回しするクラス。表向きは委員に任せつつ実権を握る。',
    type: 'delegation',     // cunning → delegation
    leaderId: 's20351',
    subLeaderIds: ['s20352'],
    memberIds: ['s20353'],
  },
  {
    id: 'class2d',
    name: '2-D組',
    description: '美月のノリで盛り上がるクラス。多数決で決めてすぐ行動に移す。',
    type: 'majority',       // flexible → majority
    leaderId: 's20451',
    subLeaderIds: ['s20401'],
    memberIds: ['s20452'],
  },
  {
    id: 'class3a',
    name: '3-A組',
    description: '翔太の穏やかな進行で、丁寧に合議して決めるクラス。',
    type: 'council',        // cautious → council
    leaderId: 's30102',
    subLeaderIds: ['s30103'],
    memberIds: ['s30151', 's30101'],
  },
  {
    id: 'class3b',
    name: '3-B組',
    description: '悠人の理想に引っ張られるクラス。議論は熱いが最後はリーダーが決める。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 's30201',
    subLeaderIds: ['s30202'],
    memberIds: ['s30251'],
  },
  {
    id: 'class3c',
    name: '3-C組',
    description: '学の方針が絶対のクラス。成績至上主義で反論は通りにくい。',
    type: 'dictatorship',   // stubborn → dictatorship
    leaderId: 's30301',
    subLeaderIds: ['s30352'],
    memberIds: ['s30302', 's30351'],
  },
  {
    id: 'class3d',
    name: '3-D組',
    description: '獅堂の熱血リーダーシップで動くクラス。体育会系の結束力が強い。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 's30401',
    subLeaderIds: ['s30402'],
    memberIds: ['s30451', 's30403'],
  },
  // ===== 部活 =====
  {
    id: 'club_track',
    name: '陸上部',
    description: '健太の背中を追って走る部活。個人競技だが結束は固い。',
    type: 'dictatorship',   // stubborn → dictatorship
    leaderId: 's30402',
    subLeaderIds: ['s20401'],
    memberIds: ['s30302'],
  },
  {
    id: 'club_soccer',
    name: 'サッカー部',
    description: '蒼太の献身的なプレーがチームの柱。泥臭く全員で勝利を目指す。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 's20202',
    subLeaderIds: ['s10201'],
    memberIds: ['s10202'],
  },
  {
    id: 'club_baseball',
    name: '野球部',
    description: '大地の声がグラウンドに響く伝統校。上下関係がしっかりした体育会系。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 's30404',
    subLeaderIds: ['s30451'],
    memberIds: ['s10401', 's10402'],
  },
  {
    id: 'club_tennis',
    name: 'テニス部',
    description: '美咲の柔らかいまとめ方で和気あいあい。練習メニューもみんなで決める。',
    type: 'majority',       // flexible → majority
    leaderId: 's30251',
    subLeaderIds: ['s20451'],
    memberIds: ['s20152'],
  },
  {
    id: 'club_brass',
    name: '吹奏楽部',
    description: '翔太がパートリーダーの意見を丁寧にまとめる。ハーモニー重視の部活。',
    type: 'council',        // cautious → council
    leaderId: 's30102',
    subLeaderIds: ['s10152'],
    memberIds: ['s30103'],
  },
  {
    id: 'club_art',
    name: '美術部',
    description: 'あかりの行動力と情熱が部の方向性を決める。自由な表現を重んじる。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 's30351',
    subLeaderIds: ['s20352'],
    memberIds: ['s10352', 's30201'],
  },
  {
    id: 'club_student_council',
    name: '生徒会',
    description: '鷹山が率いる学園の中枢。校内行事の企画・運営を担う。',
    type: 'dictatorship',
    leaderId: 's30101',
    subLeaderIds: ['s20201'],
    memberIds: ['s30151'],
    leaderTitle: '生徒会長',
    subLeaderTitle: '副会長',
  },
];

/** 体育会系の部活ID */
export const SPORTS_CLUB_IDS = new Set(['club_track', 'club_soccer', 'club_baseball', 'club_tennis']);
/** 文化系の部活ID */
export const CULTURE_CLUB_IDS = new Set(['club_brass', 'club_art', 'club_student_council']);

export const ORGANIZATION_TYPE_LABELS: Record<string, string> = {
  dictatorship: '独裁型',
  council: '衆議型',
  delegation: '委任型',
  majority: '多数型',
};
