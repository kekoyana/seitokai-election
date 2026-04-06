// Japanese data labels
export type DataCategory =
  | 'hairstyle' | 'hobby' | 'attribute' | 'mood' | 'time'
  | 'personality' | 'club' | 'affinity'
  | 'faction' | 'factionPlatform' | 'factionDescription'
  | 'location' | 'floor'
  | 'orgName' | 'orgDescription' | 'orgType'
  | 'orgLeaderTitle' | 'orgSubLeaderTitle';

export const jaData: Record<string, Record<string, string>> = {
  hairstyle: {
    straight: 'ストレート', ponytail: 'ポニーテール', twintail: 'ツインテール',
    braid: '三つ編み', wavy: 'ウェーブ', bun: 'お団子', bob: 'ボブカット',
  },
  hobby: {
    love: '恋バナ', game: 'ゲーム', sns: 'SNS', sports_hobby: 'スポーツ',
    study: '勉強', video: '動画', music: '音楽', reading: '読書',
    fashion: 'ファッション', fortune: '占い',
  },
  attribute: {
    glasses: 'メガネ', blonde: '金髪', young: '幼い', adult: '大人',
    flat: '貧乳', busty: '巨乳', energetic_social: '陽キャ', introverted: '陰キャ',
    serious: '真面目', delinquent: '不良', fashionable: 'おしゃれ', airhead: '天然',
    cool: 'クール', energetic: '元気', sporty: '体育',
    straight: 'ストレート', ponytail: 'ポニーテール', twintail: 'ツインテール',
    braid: '三つ編み', wavy: 'ウェーブ', bun: 'お団子', bob: 'ボブカット',
  },
  mood: {
    furious: '激怒', upset: '不機嫌', normal: '平常', favorable: '好意的', devoted: '心酔',
  },
  time: {
    morning: '朝', lunch: '昼', afternoon: '午後', afterschool: '放課後',
  },
  personality: {
    passionate: '熱血', cautious: '慎重', stubborn: '頑固', flexible: '柔軟', cunning: '狡猾',
  },
  club: {
    soccer: 'サッカー部', track: '陸上部', tennis: 'テニス部',
    art: '美術部', baseball: '野球部', brass: '吹奏楽部', student_council: '生徒会',
  },
  affinity: {
    devoted: '心酔', trust: '信頼', friendly: '好意', neutral: '普通',
    wary: '警戒', dislike: '不快', hostile: '敵意',
  },
  faction: {
    conservative: '保守', progressive: '革新', sports: '体育',
  },
  factionPlatform: {
    conservative: '保守派 ─ 伝統と秩序',
    progressive: '革新派 ─ 変革と自由',
    sports: '体育派 ─ 結束と活力',
  },
  factionDescription: {
    conservative: '伝統と規律を重んじる。校則の厳格化・制服の維持を主張。',
    progressive: '変革と自由を掲げる。制服廃止・SNS活用など新しい学園を提案。',
    sports: '体育系の結束を重視。部活の予算拡充・体育館改修を公約。',
  },
  location: {
    class1a: '教室 1-A', class1b: '教室 1-B', class1c: '教室 1-C', class1d: '教室 1-D',
    class2a: '教室 2-A', class2b: '教室 2-B', class2c: '教室 2-C', class2d: '教室 2-D',
    class3a: '教室 3-A', class3b: '教室 3-B', class3c: '教室 3-C', class3d: '教室 3-D',
    track_field: '陸上競技場', soccer_field: 'サッカーグラウンド',
    baseball_field: '野球グラウンド', tennis_court: 'テニスコート',
    music_room: '吹奏楽室', art_room: '美術室', broadcast_room: '放送室',
    courtyard: '中庭', library: '図書室', cafeteria: '食堂',
    nurses_office: '保健室', rooftop: '屋上', student_council: '生徒会室',
    corridor_1f: '1階廊下', corridor_2f: '2階廊下', corridor_3f: '3階廊下',
    corridor_ground: 'グラウンド',
  },
  floor: {
    '1f': '1階', '2f': '2階', '3f': '3階', ground: 'グラウンド',
  },
  orgName: {
    class1a: '1-A組', class1b: '1-B組', class1c: '1-C組', class1d: '1-D組',
    class2a: '2-A組', class2b: '2-B組', class2c: '2-C組', class2d: '2-D組',
    class3a: '3-A組', class3b: '3-B組', class3c: '3-C組', class3d: '3-D組',
    club_track: '陸上部', club_soccer: 'サッカー部', club_baseball: '野球部',
    club_tennis: 'テニス部', club_brass: '吹奏楽部', club_art: '美術部',
    club_student_council: '生徒会',
  },
  orgDescription: {
    class1a: 'ゆいの明るさでまとまるクラス。大事なことはみんなの多数決で決める。',
    class1b: '大輝の熱血リーダーシップで動くクラス。ノリと勢いで突き進む。',
    class1c: 'あかねの慎重な進行のもと、話し合いを重ねて結論を出すクラス。',
    class1d: '翼の自由な空気が流れるクラス。面倒なことは多数決でサクッと決める。',
    class2a: 'あおいのデータ重視の議論が特徴。全員の意見を聞いてから結論を出す。',
    class2b: '蓮のルールが絶対のクラス。規律正しく、脱線は許されない。',
    class2c: 'さくらが裏で根回しするクラス。表向きは委員に任せつつ実権を握る。',
    class2d: '美月のノリで盛り上がるクラス。多数決で決めてすぐ行動に移す。',
    class3a: '翔太の穏やかな進行で、丁寧に合議して決めるクラス。',
    class3b: '悠人の理想に引っ張られるクラス。議論は熱いが最後はリーダーが決める。',
    class3c: '学の方針が絶対のクラス。成績至上主義で反論は通りにくい。',
    class3d: '獅堂の熱血リーダーシップで動くクラス。体育会系の結束力が強い。',
    club_track: '健太の背中を追って走る部活。個人競技だが結束は固い。',
    club_soccer: '蒼太の献身的なプレーがチームの柱。泥臭く全員で勝利を目指す。',
    club_baseball: '大地の声がグラウンドに響く伝統校。上下関係がしっかりした体育会系。',
    club_tennis: '美咲の柔らかいまとめ方で和気あいあい。練習メニューもみんなで決める。',
    club_brass: '翔太がパートリーダーの意見を丁寧にまとめる。ハーモニー重視の部活。',
    club_art: 'あかりの行動力と情熱が部の方向性を決める。自由な表現を重んじる。',
    club_student_council: '鷹山が率いる学園の中枢。校内行事の企画・運営を担う。',
  },
  orgType: {
    dictatorship: '独裁型', council: '衆議型', delegation: '委任型', majority: '多数型',
  },
  orgLeaderTitle: {
    club_student_council: '生徒会長',
  },
  orgSubLeaderTitle: {
    club_student_council: '副会長',
  },
};
