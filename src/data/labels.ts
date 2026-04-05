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

export const PERSONALITY_LABELS: Record<string, string> = {
  passionate: '熱血',
  cautious: '慎重',
  stubborn: '頑固',
  flexible: '柔軟',
  cunning: '狡猾',
};

export const CLUB_LABELS: Record<string, string> = {
  soccer: 'サッカー部',
  track: '陸上部',
  tennis: 'テニス部',
  art: '美術部',
  baseball: '野球部',
  brass: '吹奏楽部',
};

/** Day番号(1〜30)を「9/1」形式の日付文字列に変換（9月1日スタート） */
export function dayToDate(day: number): string {
  const d = new Date(2025, 8, day); // month=8 → 9月
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** currentTime（0〜240）を「15:00」形式の時刻文字列に変換 */
export function formatTime(currentTime: number): string {
  const totalMinutes = 15 * 60 + currentTime; // 15:00基準
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// 性格ごとのイニシャルアイコン背景色
export const PERSONALITY_ICON_COLORS: Record<string, string> = {
  passionate: '#E74C3C',
  cautious: '#3498DB',
  stubborn: '#7F8C8D',
  flexible: '#2ECC71',
  cunning: '#9B59B6',
};
