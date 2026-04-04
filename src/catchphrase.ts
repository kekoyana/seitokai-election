import type { Personality, Attribute } from './types';

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
