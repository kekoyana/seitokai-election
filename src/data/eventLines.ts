/**
 * イベント会話セリフ（落とし物・おつかい）
 * 性格×性別で口調が変わる
 */
import type { Personality, Gender } from '../types';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ============================
// 落とし物: 持ち主のお礼セリフ
// ============================
const LOST_ITEM_THANKS: Record<Personality, Record<Gender, string[]>> = {
  passionate: {
    male: [
      'マジで！？ 助かったぜ、ありがとな！',
      'おおっ、探してたんだよ！ サンキュー！',
    ],
    female: [
      'えっ、ホント！？ ありがとう、嬉しい！',
      'わぁ、見つけてくれたの！？ ありがとう！',
    ],
  },
  cautious: {
    male: [
      'あ、それ僕のです…。ありがとうございます、助かりました。',
      '落としてたんだ…。わざわざ届けてくれてありがとう。',
    ],
    female: [
      'あっ…探してたの。届けてくれてありがとう。',
      'よかった、見つかって…。ありがとうね。',
    ],
  },
  stubborn: {
    male: [
      '…ああ、それか。わざわざ悪いな。',
      'ん、すまない。助かった。',
    ],
    female: [
      'あら、わざわざ？ …ありがとう。',
      'そう、私のね。…ありがとう、助かるわ。',
    ],
  },
  flexible: {
    male: [
      'あっ、それ俺の！ ありがとー、マジ助かる！',
      'おー！探してたんだよね。ありがとう！',
    ],
    female: [
      'あっ、探してたの！ わざわざありがとう！',
      'えー、届けてくれたの？ ありがとう～！',
    ],
  },
  cunning: {
    male: [
      'おや、わざわざ届けてくれるとは…。ありがとう、恩に着るよ。',
      'ふぅん、拾ってくれたんだ。…感謝するよ。',
    ],
    female: [
      'あら、届けてくれたの？ 優しいのね、ありがとう。',
      'ふふ、拾ってくれたんだ。…ありがとうね。',
    ],
  },
};

// ============================
// おつかい: 届け先のお礼セリフ
// ============================
const ERRAND_THANKS: Record<Personality, Record<Gender, string[]>> = {
  passionate: {
    male: [
      'おっ、わざわざ持ってきてくれたのか！ ありがとな！',
      'サンキュー！ 助かるぜ！',
    ],
    female: [
      'わぁ、届けてくれたの！？ ありがとう！',
      'ホントに！？ わざわざありがとう！',
    ],
  },
  cautious: {
    male: [
      '届けてくれたんですか…。ありがとうございます。',
      'わざわざすみません。助かります。',
    ],
    female: [
      'わざわざ届けてくれたの…？ ありがとう。',
      '届けてくれたんだ…。ありがとうね。',
    ],
  },
  stubborn: {
    male: [
      '…わざわざ悪いな。受け取っておく。',
      'ああ、頼んでたやつか。すまないな。',
    ],
    female: [
      'あら、届けてくれたの。…ありがとう。',
      'そう。わざわざ悪いわね。',
    ],
  },
  flexible: {
    male: [
      'おー、ありがとー！ 助かるわ～。',
      'わざわざ持ってきてくれたの？ サンキュー！',
    ],
    female: [
      'わざわざ届けてくれたの？ ありがとう！',
      'えー、ありがとう！ 嬉しい～！',
    ],
  },
  cunning: {
    male: [
      'ほう、わざわざ届けてくれるとはね。ありがとう。',
      '気が利くね。…感謝するよ。',
    ],
    female: [
      'あら、律儀ね。ありがとう。',
      'ふふ、わざわざ？ 嬉しいわ、ありがとう。',
    ],
  },
};

// ============================
// おつかい: 依頼元が「お礼言っておくね」
// ============================
const ERRAND_RELAY_THANKS: Record<Personality, Record<Gender, string[]>> = {
  passionate: {
    male: [
      'よっしゃ、あいつにもお礼言っとくわ！',
      'サンキュー！ あいつにも伝えとくな！',
    ],
    female: [
      'ありがとう！ あの子にもお礼言っとくね！',
      'やった！ ちゃんとお礼言わなきゃ！',
    ],
  },
  cautious: {
    male: [
      '助かったよ。あちらにもお礼を伝えておくね。',
      'ありがとう…。ちゃんとお礼は伝えるよ。',
    ],
    female: [
      'ありがとう…。あの子にもお礼言っておくね。',
      '助かったわ。ちゃんとお礼伝えるね。',
    ],
  },
  stubborn: {
    male: [
      '…あいつにも礼は言っておく。',
      'ああ、ちゃんと伝えておく。',
    ],
    female: [
      'あの子にもお礼は伝えておくわ。',
      '…ちゃんとお礼は言っておくから。',
    ],
  },
  flexible: {
    male: [
      'ありがとー！ あの人にもお礼言っとくね！',
      'サンキュー！ ちゃんと伝えとくよ！',
    ],
    female: [
      'ありがとう！ あの子にもお礼言わなきゃ！',
      'えへへ、ちゃんと伝えるね！',
    ],
  },
  cunning: {
    male: [
      'ふふ、律儀だね。あちらにも伝えておくよ。',
      '感謝するよ。ちゃんと伝えておく。',
    ],
    female: [
      'ありがとう。あの子にもちゃんと伝えておくわね。',
      'ふふ、助かったわ。お礼は伝えておくね。',
    ],
  },
};

// ============================
// おつかい: 依頼セリフ（性格×性別）
// ============================
const ERRAND_REQUEST: Record<Personality, Record<Gender, string[]>> = {
  passionate: {
    male: [
      'なぁ、{target}に{item}届けてくれない？ 頼むわ！',
      'ちょっとお願い！ {target}に{item}渡してほしいんだけど！',
    ],
    female: [
      'ねぇねぇ、{target}に{item}届けてくれない？',
      '{target}に{item}渡してほしいんだけど、お願いできる？',
    ],
  },
  cautious: {
    male: [
      'あの…{target}に{item}を届けてもらえないかな。',
      'ごめん、{target}に{item}を渡してほしいんだけど…。',
    ],
    female: [
      '{target}に{item}を届けてくれると助かるんだけど…。',
      'あの、{target}に{item}を渡してもらえる…？',
    ],
  },
  stubborn: {
    male: [
      '{target}に{item}を届けてくれ。頼んだ。',
      'すまないが、{target}に{item}を渡してもらえるか。',
    ],
    female: [
      '{target}に{item}を届けてもらえる？',
      '悪いけど、{target}に{item}を渡してちょうだい。',
    ],
  },
  flexible: {
    male: [
      'ねぇ、{target}に{item}届けてくれない？',
      '{target}に{item}渡してほしいんだけど、いいかな？',
    ],
    female: [
      'ねぇ、{target}に{item}届けてくれない？',
      '{target}に{item}渡してほしいんだけど、お願い！',
    ],
  },
  cunning: {
    male: [
      'ちょっとお願いがあるんだけど…{target}に{item}を届けてくれないかな。',
      '{target}に{item}を渡してほしいんだ。頼めるかい？',
    ],
    female: [
      'ねぇ、お願いがあるの。{target}に{item}を届けてくれない？',
      '{target}に{item}を渡してほしいんだけど…いいかしら？',
    ],
  },
};

const ERRAND_FOLLOW_UP: Record<Personality, Record<Gender, string[]>> = {
  passionate: {
    male: [
      '{target}、今どこにいるかわかんねぇんだよな。頼んだぜ！',
      '{target}探すの面倒でさ…お願い！',
    ],
    female: [
      '{target}、今どこにいるかわかんなくて…お願い！',
      '{target}に会ったら渡しといて！ よろしく！',
    ],
  },
  cautious: {
    male: [
      '{target}、今どこにいるかわからなくて…お願いできる？',
      '{target}を探してるんだけど見つからなくて…。',
    ],
    female: [
      '{target}、どこにいるかわからなくて…ごめんね。',
      '{target}に会ったらお願いしてもいい…？',
    ],
  },
  stubborn: {
    male: [
      '{target}の居場所がわからん。頼めるか。',
      '{target}を探す暇がなくてな。すまない。',
    ],
    female: [
      '{target}がどこにいるかわからないの。お願いできる？',
      '{target}を探してる時間がなくて…。頼めるかしら。',
    ],
  },
  flexible: {
    male: [
      '{target}、今どこにいるかわかんないんだよね。お願いできる？',
      '{target}探すの大変そうでさ～。頼んでいい？',
    ],
    female: [
      '{target}、今どこにいるかわかんなくて～。お願い！',
      '{target}に会ったら渡してくれると嬉しいな！',
    ],
  },
  cunning: {
    male: [
      '{target}の居場所がつかめなくてね…。頼めるかな。',
      '{target}、なかなか捕まらなくてさ。お願いできる？',
    ],
    female: [
      '{target}がどこにいるかわからなくて…。お願いできるかしら。',
      '{target}、なかなか会えなくて…。頼んでもいい？',
    ],
  },
};

// ============================
// プレイヤー側セリフ（性別のみ）
// ============================
const PLAYER_DELIVER_LOST: Record<Gender, string[]> = {
  male: [
    'これ、{owner}のじゃない？',
    '{owner}、これ落としてなかった？',
  ],
  female: [
    'これ、{owner}のじゃない？',
    '{owner}、これ落としてたよ。',
  ],
};

const PLAYER_DELIVER_ERRAND: Record<Gender, string[]> = {
  male: [
    '{from}から{item}を預かってきたよ。',
    '{from}に頼まれて{item}を届けに来た。',
  ],
  female: [
    '{from}から{item}を預かってきたよ。',
    '{from}に頼まれて{item}を届けに来たの。',
  ],
};

const PLAYER_ACCEPT_ERRAND: Record<Gender, string[]> = {
  male: [
    'わかった、届けておくよ。',
    'いいよ、任せて。',
    'おっけー、行ってくる。',
  ],
  female: [
    'わかった、届けておくね。',
    'いいよ、任せて。',
    'うん、行ってくるね。',
  ],
};

// ============================
// 公開API
// ============================

export function getLostItemThanks(personality: Personality, gender: Gender): string {
  return pick(LOST_ITEM_THANKS[personality]?.[gender] ?? LOST_ITEM_THANKS.flexible.male);
}

export function getErrandThanks(personality: Personality, gender: Gender): string {
  return pick(ERRAND_THANKS[personality]?.[gender] ?? ERRAND_THANKS.flexible.male);
}

export function getErrandRelayThanks(personality: Personality, gender: Gender, fromNickname: string): string {
  const line = pick(ERRAND_RELAY_THANKS[personality]?.[gender] ?? ERRAND_RELAY_THANKS.flexible.male);
  return line.replace('{from}', fromNickname);
}

export function getErrandRequest(personality: Personality, gender: Gender, targetNickname: string, itemName: string): string {
  const line = pick(ERRAND_REQUEST[personality]?.[gender] ?? ERRAND_REQUEST.flexible.male);
  return line.replace('{target}', targetNickname).replace('{item}', itemName);
}

export function getErrandFollowUp(personality: Personality, gender: Gender, targetNickname: string): string {
  const line = pick(ERRAND_FOLLOW_UP[personality]?.[gender] ?? ERRAND_FOLLOW_UP.flexible.male);
  return line.replace('{target}', targetNickname);
}

export function getPlayerDeliverLost(gender: Gender, ownerNickname: string, itemName: string): string {
  const line = pick(PLAYER_DELIVER_LOST[gender]);
  return line.replace('{owner}', ownerNickname).replace('{item}', itemName);
}

export function getPlayerDeliverErrand(gender: Gender, fromNickname: string, itemName: string): string {
  const line = pick(PLAYER_DELIVER_ERRAND[gender]);
  return line.replace('{from}', fromNickname).replace('{item}', itemName);
}

export function getPlayerAcceptErrand(gender: Gender): string {
  return pick(PLAYER_ACCEPT_ERRAND[gender]);
}
