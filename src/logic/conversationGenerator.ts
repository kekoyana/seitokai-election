import type { Student, HobbyTopic, Personality, Gender, PreferenceAttr } from '../types';
import { HOBBY_LABELS, ATTRIBUTE_LABELS } from '../data';
import {
  getTalkLines, getPlayerLines, getNarrationResults, getTalkAffinityGroup,
  getChitchatLines, getChitchatNarrations,
} from '../data/conversationLines';
import { t } from '../i18n';
import { getStudentName } from '../data/students';

export interface ConversationStep {
  speaker: 'student' | 'player';
  name: string;
  portrait: string | null;
  text: string;
  effectHtml?: string;
}

export interface ConversationResult {
  text: string;
  effectHtml: string;
  affinityGain?: number;
}

export interface ConversationData {
  steps: ConversationStep[];
  result: ConversationResult;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 恋愛感情時にセリフをしどろもどろに変換する
 * 元のセリフに吃音・言い淀みを追加して照れている様子を表現
 */
function flusterLine(line: string): string {
  // 「」の中身を取り出す
  const match = line.match(/^「(.+)」$/);
  if (!match) return line;
  const inner = match[1];

  // ランダムに複数の変換を適用
  const transforms: ((s: string) => string)[] = [
    // 最初の文字を吃音にする（ひらがな・カタカナ）
    (s) => {
      const first = s.charAt(0);
      if (/[ぁ-んァ-ヶ]/.test(first)) {
        return `${first}、${first}${s.slice(1)}`;
      }
      return s;
    },
    // 途中に「…」を挟む
    (s) => {
      const mid = Math.floor(s.length * 0.4);
      if (mid > 2 && mid < s.length - 2) {
        return `${s.slice(0, mid)}…${s.slice(mid)}`;
      }
      return s;
    },
    // 末尾に照れた付加を追加
    (s) => {
      const suffixes = ['…な、なんでもない', '…って、違うけど', '…あ、えっと', '…'];
      // 既存の末尾記号を除去
      const trimmed = s.replace(/[！？!?…。]+$/, '');
      return trimmed + pick(suffixes);
    },
  ];

  // 1〜2個の変換をランダムに適用
  const shuffled = transforms.sort(() => Math.random() - 0.5);
  const count = Math.random() < 0.5 ? 1 : 2;
  let result = inner;
  for (let i = 0; i < count; i++) {
    result = shuffled[i](result);
  }

  return `「${result}」`;
}

/** 恋愛感情時の相手セリフ差し替え（50%の確率で専用セリフ、50%でしどろもどろ変換） */
function applyLoveFlustered(originalLine: string): string {
  const LOVE_LINES = [
    'え、えっと…あの…',
    'そ、そんなこと言われたら…',
    '…っ！べ、別にあなたのためじゃ…',
    'あ、あの、話が頭に入ってこなくて…',
    'な、なんでこんなにドキドキ…',
    'ち、近いです…！集中できない…',
    'あ…えっと…その…',
    'な、何見てるの…？',
  ];
  if (Math.random() < 0.4) {
    return `「${pick(LOVE_LINES)}」`;
  }
  return flusterLine(originalLine);
}

export function generateConversationData(
  student: Student,
  playerName: string,
  playerPortrait: string | null,
  playerPersonality: Personality,
  playerGender: Gender,
  revealedHobby: HobbyTopic | null,
  affinityGain: number,
  isInLove: boolean = false,
): ConversationData {
  const steps: ConversationStep[] = [];
  const studentLines = getTalkLines(student.personality, student.gender);
  const playerLines = getPlayerLines(playerPersonality, playerGender);
  const level = getTalkAffinityGroup(student.affinity);

  // 恋愛感情時はセリフをしどろもどろにする変換関数
  const maybeFlustered = (line: string): string =>
    isInLove ? applyLoveFlustered(line) : line;

  // 1. プレイヤーが話しかける
  steps.push({
    speaker: 'player',
    name: playerName,
    portrait: playerPortrait,
    text: `「${pick(playerLines.greeting)}」`,
  });

  // 2. 相手の挨拶
  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: maybeFlustered(`「${pick(studentLines.greeting[level])}」`),
  });

  // 3. 趣味の話題（解禁された場合）
  if (revealedHobby) {
    const pref = student.hobbies[revealedHobby];
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const reactionLine = pick(studentLines.hobbyReaction[pref]);

    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '▲';

    // プレイヤーが趣味を振る
    steps.push({
      speaker: 'player',
      name: playerName,
      portrait: playerPortrait,
      text: `「${pick(playerLines.hobbyPrompt)}」`,
    });

    // 相手のリアクション
    steps.push({
      speaker: 'student',
      name: student.name,
      portrait: student.portrait,
      text: maybeFlustered(`「${reactionLine}」`),
      effectHtml: `<span style="color:${prefColor};">${prefIcon} ${hobbyName}</span>`,
    });
  }

  // 4. 別れの挨拶
  steps.push({
    speaker: 'player',
    name: playerName,
    portrait: playerPortrait,
    text: `「${pick(playerLines.farewell)}」`,
  });

  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: maybeFlustered(`「${pick(studentLines.farewell[level])}」`),
  });

  // 結果（ポップアップ用）
  const resultType = affinityGain > 0 ? 'positive' : affinityGain < 0 ? 'negative' : 'neutral';
  const affinityColor = affinityGain > 0 ? '#7EC850' : affinityGain < 0 ? '#F07070' : '#999';
  const affinitySign = affinityGain >= 0 ? '+' : '';

  const resultEffectParts: string[] = [];
  if (revealedHobby) {
    const pref = student.hobbies[revealedHobby];
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '▲';
    resultEffectParts.push(`<span style="color:${prefColor};">${prefIcon} ${hobbyName}</span>`);
  }
  resultEffectParts.push(`<span style="color:${affinityColor};">${t('conversation.affinityDisplay', { sign: affinitySign, value: affinityGain })}</span>`);

  const result: ConversationResult = {
    text: pick(getNarrationResults()[resultType]),
    effectHtml: resultEffectParts.join('<br>'),
  };

  return { steps, result };
}

/**
 * 雑談データを生成（生徒から話しかけてくる）
 * 短い会話で好感度が微量変動する
 */
export function generateChitchatData(
  student: Student,
  playerName: string,
  playerPortrait: string | null,
  playerPersonality: Personality,
  playerGender: Gender,
  revealedHobby: HobbyTopic | null = null,
  isInLove: boolean = false,
): ConversationData {
  const steps: ConversationStep[] = [];
  const chitchatLines = getChitchatLines(student.personality, student.gender);
  const playerLines = getPlayerLines(playerPersonality, playerGender);

  // 恋愛感情時はセリフをしどろもどろにする変換関数
  const maybeFlustered = (line: string): string =>
    isInLove ? applyLoveFlustered(line) : line;

  // 1. 生徒が話しかけてくる
  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: maybeFlustered(`「${pick(chitchatLines.opener)}」`),
  });

  // 2. プレイヤーの応答
  steps.push({
    speaker: 'player',
    name: playerName,
    portrait: playerPortrait,
    text: `「${pick(playerLines.greeting)}」`,
  });

  // 3. 雑談の内容
  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: maybeFlustered(`「${pick(chitchatLines.topic)}」`),
  });

  // 3.5. 趣味が判明した場合
  if (revealedHobby) {
    const pref = student.hobbies[revealedHobby];
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const studentTalkLines = getTalkLines(student.personality, student.gender);
    const reactionLine = pick(studentTalkLines.hobbyReaction[pref]);
    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '▲';

    steps.push({
      speaker: 'student',
      name: student.name,
      portrait: student.portrait,
      text: maybeFlustered(`「${reactionLine}」`),
      effectHtml: `<span style="color:${prefColor};">${prefIcon} ${hobbyName}</span>`,
    });
  }

  // 4. 締め
  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: maybeFlustered(`「${pick(chitchatLines.closer)}」`),
  });

  const affinityGain = Math.random() < 0.7 ? 1 : 2;
  const resultEffectParts: string[] = [];
  if (revealedHobby) {
    const pref = student.hobbies[revealedHobby];
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '▲';
    resultEffectParts.push(`<span style="color:${prefColor};">${prefIcon} ${hobbyName}</span>`);
  }
  resultEffectParts.push(`<span style="color:#7EC850;">${t('conversation.affinityDisplay', { sign: '+', value: affinityGain })}</span>`);

  const result: ConversationResult = {
    text: pick(getChitchatNarrations()),
    effectHtml: resultEffectParts.join('<br>'),
    affinityGain,
  };

  return { steps, result };
}

/** ログ用の要約テキストを生成（actionLogs に追加する用） */
export function generateTalkLogSummary(
  student: Student,
  revealedHobby: HobbyTopic | null,
  affinityGain: number,
): string {
  const parts: string[] = [];
  parts.push(t('conversation.talkLogSummary', { name: getStudentName(student) }));

  if (revealedHobby) {
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const pref = student.hobbies[revealedHobby];
    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '▲';
    parts.push(`<span style="color:${prefColor};">${prefIcon}${hobbyName}</span>`);
  }

  const affinityColor = affinityGain > 0 ? '#7EC850' : affinityGain < 0 ? '#F07070' : '#999';
  const affinitySign = affinityGain >= 0 ? '+' : '';
  parts.push(`<span style="color:${affinityColor};">${t('conversation.affinityDisplay', { sign: affinitySign, value: affinityGain })}</span>`);

  return parts.join(' ');
}

/** 噂話で判明した情報 */
export interface GossipReveal {
  targetId: string;
  targetName: string;
  hobby?: { topic: HobbyTopic; pref: 'like' | 'dislike' | 'neutral' };
  likedAttr?: PreferenceAttr;
  dislikedAttr?: PreferenceAttr;
}

/**
 * 噂話データを生成
 * 会話相手と同じクラス・部活の生徒について情報を聞き出す
 */
export function generateGossipData(
  student: Student,
  playerName: string,
  playerPortrait: string | null,
  playerPersonality: Personality,
  playerGender: Gender,
  reveal: GossipReveal,
  affinityGain: number,
): ConversationData {
  const steps: ConversationStep[] = [];
  const studentLines = getTalkLines(student.personality, student.gender);
  const playerLines = getPlayerLines(playerPersonality, playerGender);
  const level = getTalkAffinityGroup(student.affinity);

  // 1. プレイヤーが話しかける
  const askLines = [
    t('conversation.gossipAsk1'),
    t('conversation.gossipAsk2'),
    t('conversation.gossipAsk3'),
  ];
  steps.push({
    speaker: 'player',
    name: playerName,
    portrait: playerPortrait,
    text: `「${pick(askLines)}」`,
  });

  // 2. 噂の内容
  const revealParts: string[] = [];
  if (reveal.hobby) {
    const hobbyName = HOBBY_LABELS[reveal.hobby.topic] ?? reveal.hobby.topic;
    const prefLabel = reveal.hobby.pref === 'like' ? t('conversation.prefLike') : reveal.hobby.pref === 'dislike' ? t('conversation.prefDislike') : t('conversation.prefNormal');
    const gossipLines = [
      t('conversation.gossipHobby1', { target: reveal.targetName, hobby: hobbyName, pref: prefLabel }),
      t('conversation.gossipHobby2', { target: reveal.targetName, hobby: hobbyName, pref: prefLabel }),
      t('conversation.gossipHobby3', { target: reveal.targetName, hobby: hobbyName, pref: prefLabel }),
    ];
    steps.push({
      speaker: 'student',
      name: student.name,
      portrait: student.portrait,
      text: `「${pick(gossipLines)}」`,
    });
    const prefColor = reveal.hobby.pref === 'like' ? '#7EC850' : reveal.hobby.pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = reveal.hobby.pref === 'like' ? '♥' : reveal.hobby.pref === 'dislike' ? '✗' : '▲';
    revealParts.push(`<span style="color:${prefColor};">${prefIcon}${hobbyName}</span>`);
  }
  if (reveal.likedAttr) {
    const attrName = ATTRIBUTE_LABELS[reveal.likedAttr] ?? reveal.likedAttr;
    const gossipLines = [
      t('conversation.gossipLiked1', { target: reveal.targetName, attr: attrName }),
      t('conversation.gossipLiked2', { target: reveal.targetName, attr: attrName }),
    ];
    steps.push({
      speaker: 'student',
      name: getStudentName(student),
      portrait: student.portrait,
      text: `「${pick(gossipLines)}」`,
    });
    revealParts.push(`<span style="color:#27AE60;">${t('conversation.gossipLikedLabel', { attr: attrName })}</span>`);
  }
  if (reveal.dislikedAttr) {
    const attrName = ATTRIBUTE_LABELS[reveal.dislikedAttr] ?? reveal.dislikedAttr;
    const gossipLines = [
      t('conversation.gossipDisliked1', { target: reveal.targetName, attr: attrName }),
      t('conversation.gossipDisliked2', { target: reveal.targetName, attr: attrName }),
    ];
    steps.push({
      speaker: 'student',
      name: getStudentName(student),
      portrait: student.portrait,
      text: `「${pick(gossipLines)}」`,
    });
    revealParts.push(`<span style="color:#C0392B;">${t('conversation.gossipDislikedLabel', { attr: attrName })}</span>`);
  }

  // 4. お礼
  steps.push({
    speaker: 'player',
    name: playerName,
    portrait: playerPortrait,
    text: `「${t('conversation.gossipThanks')}」`,
  });

  steps.push({
    speaker: 'student',
    name: getStudentName(student),
    portrait: student.portrait,
    text: `「${pick(studentLines.farewell[level])}」`,
  });

  // 結果
  const affinityColor = affinityGain > 0 ? '#7EC850' : affinityGain < 0 ? '#F07070' : '#999';
  const affinitySign = affinityGain >= 0 ? '+' : '';
  const effectParts = [
    t('conversation.gossipResultInfo', { from: reveal.targetName, info: revealParts.join(' ') }),
    `<span style="color:${affinityColor};">${t('conversation.affinityDisplay', { sign: affinitySign, value: affinityGain })}</span>`,
  ];

  return {
    steps,
    result: {
      text: t('conversation.gossipResultText', { speaker: getStudentName(student), target: reveal.targetName }),
      effectHtml: effectParts.join('<br>'),
    },
  };
}

/** 噂話のログ要約 */
export function generateGossipLogSummary(
  student: Student,
  reveal: GossipReveal,
  affinityGain: number,
): string {
  const parts: string[] = [];
  parts.push(t('conversation.gossipLogSummary', { speaker: getStudentName(student), target: reveal.targetName }));

  const infoParts: string[] = [];
  if (reveal.hobby) {
    const hobbyName = HOBBY_LABELS[reveal.hobby.topic] ?? reveal.hobby.topic;
    const prefColor = reveal.hobby.pref === 'like' ? '#7EC850' : reveal.hobby.pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = reveal.hobby.pref === 'like' ? '♥' : reveal.hobby.pref === 'dislike' ? '✗' : '▲';
    infoParts.push(`<span style="color:${prefColor};">${prefIcon}${hobbyName}</span>`);
  }
  if (reveal.likedAttr) {
    const attrName = ATTRIBUTE_LABELS[reveal.likedAttr] ?? reveal.likedAttr;
    infoParts.push(`<span style="color:#27AE60;">${t('conversation.gossipLogLiked', { attr: attrName })}</span>`);
  }
  if (reveal.dislikedAttr) {
    const attrName = ATTRIBUTE_LABELS[reveal.dislikedAttr] ?? reveal.dislikedAttr;
    infoParts.push(`<span style="color:#C0392B;">${t('conversation.gossipLogDisliked', { attr: attrName })}</span>`);
  }
  if (infoParts.length > 0) parts.push(infoParts.join(' '));

  const affinityColor = affinityGain > 0 ? '#7EC850' : affinityGain < 0 ? '#F07070' : '#999';
  const affinitySign = affinityGain >= 0 ? '+' : '';
  parts.push(`<span style="color:${affinityColor};">${t('conversation.affinityDisplay', { sign: affinitySign, value: affinityGain })}</span>`);

  return parts.join(' ');
}
