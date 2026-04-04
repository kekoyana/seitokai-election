import type { Student, HobbyTopic, Personality } from '../types';
import { HOBBY_LABELS } from '../data';
import {
  TALK_LINES, NARRATION_RESULTS, getAffinityLevel,
  PLAYER_GREETINGS, PLAYER_HOBBY_PROMPTS, PLAYER_FAREWELLS,
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
  revealedHobby: HobbyTopic | null,
  affinityGain: number,
): ConversationData {
  const steps: ConversationStep[] = [];
  const personality: Personality = student.personality;
  const lines = TALK_LINES[personality];
  const level = getAffinityLevel(student.affinity);

  // 1. プレイヤーが話しかける
  steps.push({
    speaker: 'player',
    name: playerName,
    portrait: playerPortrait,
    text: `「${pick(PLAYER_GREETINGS)}」`,
  });

  // 2. 相手の挨拶
  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: `「${pick(lines.greeting[level])}」`,
  });

  // 3. 趣味の話題（解禁された場合）
  if (revealedHobby) {
    const pref = student.hobbies[revealedHobby];
    const hobbyName = HOBBY_LABELS[revealedHobby] ?? revealedHobby;
    const reactionLine = pick(lines.hobbyReaction[pref]);

    const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : '#999';
    const prefIcon = pref === 'like' ? '♥' : pref === 'dislike' ? '✗' : '―';

    // プレイヤーが趣味を振る
    steps.push({
      speaker: 'player',
      name: playerName,
      portrait: playerPortrait,
      text: `「${pick(PLAYER_HOBBY_PROMPTS)}」`,
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
    text: `「${pick(PLAYER_FAREWELLS)}」`,
  });

  steps.push({
    speaker: 'student',
    name: student.name,
    portrait: student.portrait,
    text: `「${pick(lines.farewell[level])}」`,
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
    effectHtml: resultEffectParts.join('　'),
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
