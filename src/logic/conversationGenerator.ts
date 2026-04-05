import type { Student, HobbyTopic, Personality, Gender, PreferenceAttr } from '../types';
import { HOBBY_LABELS, ATTRIBUTE_LABELS } from '../data';
import {
  getTalkLines, getPlayerLines, NARRATION_RESULTS, getTalkAffinityGroup,
  getChitchatLines, CHITCHAT_NARRATIONS,
} from '../data/conversationLines';

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

export function generateConversationData(
  student: Student,
  playerName: string,
  playerPortrait: string | null,
  playerPersonality: Personality,
  playerGender: Gender,
  revealedHobby: HobbyTopic | null,
  affinityGain: number,
): ConversationData {
  const steps: ConversationStep[] = [];
  const studentLines = getTalkLines(student.personality, student.gender);
  const playerLines = getPlayerLines(playerPersonality, playerGender);
  const level = getTalkAffinityGroup(student.affinity);

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
    text: `「${pick(studentLines.greeting[level])}」`,
  });

  // 3. 趣味の話題（解禁された場合）
  if (revealedHobby) {
    const pref = student.hobbies[revealedHobby];
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const reactionLine = pick(studentLines.hobbyReaction[pref]);

    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '―';

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
      text: `「${reactionLine}」`,
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
    text: `「${pick(studentLines.farewell[level])}」`,
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
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '―';
    resultEffectParts.push(`<span style="color:${prefColor};">${prefIcon} ${hobbyName}</span>`);
  }
  resultEffectParts.push(`<span style="color:${affinityColor};">好感度 ${affinitySign}${affinityGain}</span>`);

  const result: ConversationResult = {
    text: pick(NARRATION_RESULTS[resultType]),
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
): ConversationData {
  const steps: ConversationStep[] = [];
  const chitchatLines = getChitchatLines(student.personality, student.gender);
  const playerLines = getPlayerLines(playerPersonality, playerGender);

  // 1. 生徒が話しかけてくる
  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: `「${pick(chitchatLines.opener)}」`,
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
    text: `「${pick(chitchatLines.topic)}」`,
  });

  // 3.5. 趣味が判明した場合
  if (revealedHobby) {
    const pref = student.hobbies[revealedHobby];
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const studentTalkLines = getTalkLines(student.personality, student.gender);
    const reactionLine = pick(studentTalkLines.hobbyReaction[pref]);
    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '―';

    steps.push({
      speaker: 'student',
      name: student.name,
      portrait: student.portrait,
      text: `「${reactionLine}」`,
      effectHtml: `<span style="color:${prefColor};">${prefIcon} ${hobbyName}</span>`,
    });
  }

  // 4. 締め
  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: `「${pick(chitchatLines.closer)}」`,
  });

  const affinityGain = Math.random() < 0.7 ? 1 : 2;
  const resultEffectParts: string[] = [];
  if (revealedHobby) {
    const pref = student.hobbies[revealedHobby];
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '―';
    resultEffectParts.push(`<span style="color:${prefColor};">${prefIcon} ${hobbyName}</span>`);
  }
  resultEffectParts.push(`<span style="color:#7EC850;">好感度 +${affinityGain}</span>`);

  const result: ConversationResult = {
    text: pick(CHITCHAT_NARRATIONS),
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
  parts.push(`${student.name}と会話した。`);

  if (revealedHobby) {
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const pref = student.hobbies[revealedHobby];
    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '―';
    parts.push(`<span style="color:${prefColor};">${prefIcon}${hobbyName}</span>`);
  }

  const affinityColor = affinityGain > 0 ? '#7EC850' : affinityGain < 0 ? '#F07070' : '#999';
  const affinitySign = affinityGain >= 0 ? '+' : '';
  parts.push(`<span style="color:${affinityColor};">好感度${affinitySign}${affinityGain}</span>`);

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
    '誰か他の人のこと、教えてくれない？',
    'クラスメイトとかの話、聞かせてよ',
    '周りの人について何か知ってる？',
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
    const prefLabel = reveal.hobby.pref === 'like' ? '好き' : reveal.hobby.pref === 'dislike' ? '嫌い' : '普通';
    const gossipLines = [
      `${reveal.targetName}は${hobbyName}が${prefLabel}みたいだよ`,
      `${reveal.targetName}って${hobbyName}${prefLabel}らしいよ`,
      `${hobbyName}のこと？${reveal.targetName}は${prefLabel}って言ってたかな`,
    ];
    steps.push({
      speaker: 'student',
      name: student.name,
      portrait: student.portrait,
      text: `「${pick(gossipLines)}」`,
    });
    const prefColor = reveal.hobby.pref === 'like' ? '#7EC850' : reveal.hobby.pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = reveal.hobby.pref === 'like' ? '♥' : reveal.hobby.pref === 'dislike' ? '✗' : '―';
    revealParts.push(`<span style="color:${prefColor};">${prefIcon}${hobbyName}</span>`);
  }
  if (reveal.likedAttr) {
    const attrName = ATTRIBUTE_LABELS[reveal.likedAttr] ?? reveal.likedAttr;
    const gossipLines = [
      `あと、${reveal.targetName}は${attrName}な感じの人が好みらしいよ`,
      `${reveal.targetName}って${attrName}系が好きなんだって`,
    ];
    steps.push({
      speaker: 'student',
      name: student.name,
      portrait: student.portrait,
      text: `「${pick(gossipLines)}」`,
    });
    revealParts.push(`<span style="color:#27AE60;">好み: ${attrName}</span>`);
  }
  if (reveal.dislikedAttr) {
    const attrName = ATTRIBUTE_LABELS[reveal.dislikedAttr] ?? reveal.dislikedAttr;
    const gossipLines = [
      `${reveal.targetName}は${attrName}な感じはちょっと苦手みたい`,
      `${attrName}系は${reveal.targetName}にはウケ悪いかもね`,
    ];
    steps.push({
      speaker: 'student',
      name: student.name,
      portrait: student.portrait,
      text: `「${pick(gossipLines)}」`,
    });
    revealParts.push(`<span style="color:#C0392B;">苦手: ${attrName}</span>`);
  }

  // 4. お礼
  steps.push({
    speaker: 'player',
    name: playerName,
    portrait: playerPortrait,
    text: `「ありがとう、参考になるよ」`,
  });

  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: `「${pick(studentLines.farewell[level])}」`,
  });

  // 結果
  const affinityColor = affinityGain > 0 ? '#7EC850' : affinityGain < 0 ? '#F07070' : '#999';
  const affinitySign = affinityGain >= 0 ? '+' : '';
  const effectParts = [
    `${reveal.targetName}の情報: ${revealParts.join(' ')}`,
    `<span style="color:${affinityColor};">好感度${affinitySign}${affinityGain}</span>`,
  ];

  return {
    steps,
    result: {
      text: `${student.name}から${reveal.targetName}の噂を聞いた`,
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
  parts.push(`${student.name}から${reveal.targetName}の噂を聞いた。`);

  const infoParts: string[] = [];
  if (reveal.hobby) {
    const hobbyName = HOBBY_LABELS[reveal.hobby.topic] ?? reveal.hobby.topic;
    const prefColor = reveal.hobby.pref === 'like' ? '#7EC850' : reveal.hobby.pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = reveal.hobby.pref === 'like' ? '♥' : reveal.hobby.pref === 'dislike' ? '✗' : '―';
    infoParts.push(`<span style="color:${prefColor};">${prefIcon}${hobbyName}</span>`);
  }
  if (reveal.likedAttr) {
    const attrName = ATTRIBUTE_LABELS[reveal.likedAttr] ?? reveal.likedAttr;
    infoParts.push(`<span style="color:#27AE60;">好み:${attrName}</span>`);
  }
  if (reveal.dislikedAttr) {
    const attrName = ATTRIBUTE_LABELS[reveal.dislikedAttr] ?? reveal.dislikedAttr;
    infoParts.push(`<span style="color:#C0392B;">苦手:${attrName}</span>`);
  }
  if (infoParts.length > 0) parts.push(infoParts.join(' '));

  const affinityColor = affinityGain > 0 ? '#7EC850' : affinityGain < 0 ? '#F07070' : '#999';
  const affinitySign = affinityGain >= 0 ? '+' : '';
  parts.push(`<span style="color:${affinityColor};">好感度${affinitySign}${affinityGain}</span>`);

  return parts.join(' ');
}
