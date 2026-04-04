import type { Organization } from '../types';

export const ORGANIZATIONS: Organization[] = [
  // ===== クラス =====
  {
    id: 'class1a',
    name: '1-A組',
    description: 'ゆいの明るさでまとまるクラス。大事なことはみんなの多数決で決める。',
    type: 'majority',       // flexible → majority
    leaderId: 'sato_yui',
    subLeaderIds: ['ogawa_haruka'],
    memberIds: ['inoue_momoka'],
  },
  {
    id: 'class1b',
    name: '1-B組',
    description: '大輝の熱血リーダーシップで動くクラス。ノリと勢いで突き進む。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 'tanaka_daiki',
    subLeaderIds: ['endo_ryota'],
    memberIds: ['shimizu_nana'],
  },
  {
    id: 'class1c',
    name: '1-C組',
    description: 'あかねの慎重な進行のもと、話し合いを重ねて結論を出すクラス。',
    type: 'council',        // cautious → council
    leaderId: 'miyazaki_akane',
    subLeaderIds: ['aoki_sora'],
    memberIds: ['morita_chihiro'],
  },
  {
    id: 'class1d',
    name: '1-D組',
    description: '翼の自由な空気が流れるクラス。面倒なことは多数決でサクッと決める。',
    type: 'majority',       // flexible → majority
    leaderId: 'hashimoto_tsubasa',
    subLeaderIds: ['nishida_kaito'],
    memberIds: ['hayashi_riko'],
  },
  {
    id: 'class2a',
    name: '2-A組',
    description: 'あおいのデータ重視の議論が特徴。全員の意見を聞いてから結論を出す。',
    type: 'council',        // cautious → council
    leaderId: 'watanabe_aoi',
    subLeaderIds: ['fujita_mei'],
    memberIds: ['ueda_takumi'],
  },
  {
    id: 'class2b',
    name: '2-B組',
    description: '蓮のルールが絶対のクラス。規律正しく、脱線は許されない。',
    type: 'dictatorship',   // stubborn → dictatorship
    leaderId: 'yamamoto_ren',
    subLeaderIds: ['kimura_yuna'],
    memberIds: ['murakami_sota'],
  },
  {
    id: 'class2c',
    name: '2-C組',
    description: 'さくらが裏で根回しするクラス。表向きは委員に任せつつ実権を握る。',
    type: 'delegation',     // cunning → delegation
    leaderId: 'nakamura_sakura',
    subLeaderIds: ['yoshida_hinata'],
    memberIds: ['okamoto_rin'],
  },
  {
    id: 'class2d',
    name: '2-D組',
    description: '美月のノリで盛り上がるクラス。多数決で決めてすぐ行動に移す。',
    type: 'majority',       // flexible → majority
    leaderId: 'kato_mitsuki',
    subLeaderIds: ['goto_hayato'],
    memberIds: ['sakamoto_miu'],
  },
  {
    id: 'class3a',
    name: '3-A組',
    description: '翔太の穏やかな進行で、丁寧に合議して決めるクラス。',
    type: 'council',        // cautious → council
    leaderId: 'suzuki_shota',
    subLeaderIds: ['yamaguchi_ryo'],
    memberIds: ['ikeda_kotone'],
  },
  {
    id: 'class3b',
    name: '3-B組',
    description: '悠人の理想に引っ張られるクラス。議論は熱いが最後はリーダーが決める。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 'takahashi_yuto',
    subLeaderIds: ['otsuka_itsuki'],
    memberIds: ['tanabe_misaki'],
  },
  {
    id: 'class3c',
    name: '3-C組',
    description: '学の方針が絶対のクラス。成績至上主義で反論は通りにくい。',
    type: 'dictatorship',   // stubborn → dictatorship
    leaderId: 'saito_manabu',
    subLeaderIds: ['kawano_shiori'],
    memberIds: ['maeda_taiga'],
  },
  {
    id: 'class3d',
    name: '3-D組',
    description: '健太が寡黙に率いるクラス。背中で語るリーダーに皆がついていく。',
    type: 'dictatorship',   // stubborn → dictatorship
    leaderId: 'matsumoto_kenta',
    subLeaderIds: ['noguchi_saki'],
    memberIds: ['ishikawa_yusuke'],
  },
  // ===== 部活 =====
  {
    id: 'club_track',
    name: '陸上部',
    description: '健太の背中を追って走る部活。個人競技だが結束は固い。',
    type: 'dictatorship',   // stubborn → dictatorship
    leaderId: 'matsumoto_kenta',
    subLeaderIds: ['goto_hayato'],
    memberIds: ['maeda_taiga'],
  },
  {
    id: 'club_soccer',
    name: 'サッカー部',
    description: '蒼太の献身的なプレーがチームの柱。泥臭く全員で勝利を目指す。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 'murakami_sota',
    subLeaderIds: ['tanaka_daiki'],
    memberIds: ['endo_ryota'],
  },
  {
    id: 'club_baseball',
    name: '野球部',
    description: '大地の声がグラウンドに響く伝統校。上下関係がしっかりした体育会系。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 'iwata_daichi',
    subLeaderIds: ['noguchi_saki'],
    memberIds: ['hashimoto_tsubasa', 'nishida_kaito'],
  },
  {
    id: 'club_tennis',
    name: 'テニス部',
    description: '美咲の柔らかいまとめ方で和気あいあい。練習メニューもみんなで決める。',
    type: 'majority',       // flexible → majority
    leaderId: 'tanabe_misaki',
    subLeaderIds: ['kato_mitsuki'],
    memberIds: ['fujita_mei'],
  },
  {
    id: 'club_brass',
    name: '吹奏楽部',
    description: '翔太がパートリーダーの意見を丁寧にまとめる。ハーモニー重視の部活。',
    type: 'council',        // cautious → council
    leaderId: 'suzuki_shota',
    subLeaderIds: ['ogawa_haruka'],
    memberIds: ['yamaguchi_ryo'],
  },
  {
    id: 'club_art',
    name: '美術部',
    description: '悠人の美学が部の方向性を決める。自由に見えて強い信念がある。',
    type: 'dictatorship',   // passionate → dictatorship
    leaderId: 'takahashi_yuto',
    subLeaderIds: ['yoshida_hinata'],
    memberIds: ['morita_chihiro'],
  },
];

/** 体育会系の部活ID */
export const SPORTS_CLUB_IDS = new Set(['club_track', 'club_soccer', 'club_baseball', 'club_tennis']);
/** 文化系の部活ID */
export const CULTURE_CLUB_IDS = new Set(['club_brass', 'club_art']);

export const ORGANIZATION_TYPE_LABELS: Record<string, string> = {
  dictatorship: '独裁型',
  council: '衆議型',
  delegation: '委任型',
  majority: '多数型',
};
