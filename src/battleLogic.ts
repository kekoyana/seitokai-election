import type {
  BattleState, Student, PlayerAttitude, Topic, Stance,
  EnemyMood, HobbyTopic, FactionId, BattleLog, PreferenceAttr, Gender, Personality
} from './types';
import { getCatchphrase } from './catchphrase';
import { ALL_FACTION_IDS } from './data';

// 態度倍率（思想話題のバー効果に適用）
const ATTITUDE_MULTIPLIER: Record<PlayerAttitude, number> = {
  friendly: 0.7,
  normal: 1.0,
  strong: 1.2,
};

// 態度スタミナ消費
const ATTITUDE_COST: Record<PlayerAttitude, number> = {
  friendly: 3,
  normal: 5,
  strong: 8,
};

// 相手の態度倍率（プレイヤー効果）— 圧縮版: 機嫌以外の要素も効くようにする
const MOOD_EFFECT_MULTIPLIER: Record<EnemyMood, number> = {
  furious: 0.5,
  upset: 0.7,
  normal: 1.0,
  favorable: 1.15,
  devoted: 1.3,
};

// 相手の反撃倍率 — 圧縮版: 心酔でも敵の反撃が残る
const MOOD_COUNTER_MULTIPLIER: Record<EnemyMood, number> = {
  furious: 1.3,
  upset: 1.15,
  normal: 1.0,
  favorable: 0.85,
  devoted: 0.7,
};

// 性格ごとの反撃倍率
const PERSONALITY_COUNTER_MULTIPLIER: Record<Personality, number> = {
  passionate: 1.0,
  cautious: 1.1,
  stubborn: 1.3,
  flexible: 0.7,
  cunning: 1.15,
};

// 性格による機嫌変化の補正
function applyPersonalityMoodShift(personality: Personality, delta: number): number {
  switch (personality) {
    case 'stubborn':
      // 頑固: 全ての機嫌変化が1段階少ない（プラスもマイナスも）
      if (delta > 0) return Math.max(0, delta - 1);
      if (delta < 0) return Math.min(0, delta + 1);
      return 0;
    case 'flexible':
      // 柔軟: プラスの機嫌変化が1段階多い
      if (delta > 0) return delta + 1;
      return delta;
    case 'cunning':
      // 狡猾: 50%の確率で機嫌変化を無効化
      return Math.random() < 0.5 ? 0 : delta;
    case 'cautious':
      // 慎重: プラスの機嫌変化が1段階少ない（警戒心が強い）
      if (delta > 0) return Math.max(0, delta - 1);
      return delta;
    default: // passionate
      return delta;
  }
}

// 派閥話題の態度別機嫌ペナルティ
const ATTITUDE_MOOD_PENALTY: Record<PlayerAttitude, number> = {
  friendly: 0,   // 柔らかく → 角が立たない
  normal: 1,     // 普通 → 従来通り
  strong: 2,     // 情熱的 → 攻撃的で機嫌が大きく下がる
};

const MOOD_ORDER: EnemyMood[] = ['furious', 'upset', 'normal', 'favorable', 'devoted'];

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function getMoodIndex(mood: EnemyMood): number {
  return MOOD_ORDER.indexOf(mood);
}

function shiftMood(mood: EnemyMood, delta: number): EnemyMood {
  const idx = clamp(getMoodIndex(mood) + delta, 0, 4);
  return MOOD_ORDER[idx];
}

// 好感度からバー初期位置を計算（-100〜100 → -10〜+10）
function affinityBarBonus(affinity: number): number {
  return Math.round(affinity / 10);
}

// 相性スコア計算（playerAttrsにはhairStyleを含めること）
export function calcCompatibilityScore(playerAttrs: PreferenceAttr[], student: Student): number {
  const liked = playerAttrs.filter(a => student.likedAttributes.includes(a)).length;
  const disliked = playerAttrs.filter(a => student.dislikedAttributes.includes(a)).length;
  return liked * 10 - disliked * 8;
}

/** 恋愛感情判定: 異性 + 相性30以上 + 好感度35以上（「信頼」以上） */
export function checkIsInLove(student: Student, playerGender?: Gender, playerAttrs?: PreferenceAttr[]): boolean {
  if (!playerGender || !playerAttrs || playerGender === student.gender) return false;
  const compat = calcCompatibilityScore(playerAttrs, student);
  return compat >= 30 && student.affinity >= 35;
}

export function initBattle(
  student: Student,
  isDefending: boolean = false,
  playerGender?: Gender,
  playerAttrs?: PreferenceAttr[],
): BattleState {
  const barBonus = isDefending ? 0 : affinityBarBonus(student.affinity);
  const isInLove = checkIsInLove(student, playerGender, playerAttrs);
  return {
    student,
    round: 1,
    maxRounds: 10,
    barPosition: clamp(barBonus, -100, 100),
    enemyMood: isInLove ? 'favorable' as EnemyMood : 'normal',
    logs: [],
    phase: 'select_attitude',
    selectedAttitude: null,
    selectedTopic: null,
    result: null,
    isDefending,
    topicUseCounts: {},
    isInLove,
  };
}

// 好かれ度から倍率を計算（-100〜100 → 0.5〜1.5）
function affinityMultiplier(affinity: number): number {
  return 1.0 + affinity / 200;
}

// 外見系属性（髪型・体型・外見）: 異性相手のとき効果が大きい
const APPEARANCE_PREFS: Set<string> = new Set([
  // 髪型
  'straight', 'ponytail', 'twintail', 'braid', 'wavy', 'bun', 'bob',
  // 体型・外見
  'flat', 'busty', 'glasses', 'blonde', 'young', 'adult',
]);

// 好き属性ボーナス（段階ボーナス方式）
// 一致数に応じた逓減ボーナス: 0→×1.00, 1→×1.10, 2→×1.20, 3+→×1.25
// 異性の外見系属性が1つ以上一致すれば追加+0.05（最大×1.30）
function likedAttributeMultiplier(
  playerLikedAttributes: PreferenceAttr[],
  studentTraits: PreferenceAttr[],
  isOppositeGender: boolean
): number {
  let matchCount = 0;
  let hasAppearanceMatch = false;
  for (const a of playerLikedAttributes) {
    if (studentTraits.includes(a)) {
      matchCount++;
      if (APPEARANCE_PREFS.has(a)) hasAppearanceMatch = true;
    }
  }
  // 段階ボーナス（逓減）
  const baseBonus = matchCount === 0 ? 0
    : matchCount === 1 ? 0.10
    : matchCount === 2 ? 0.20
    : 0.25;
  // 異性外見ボーナス
  const genderBonus = (isOppositeGender && hasAppearanceMatch) ? 0.05 : 0;
  return 1.0 + baseBonus + genderBonus;
}

// 派閥話題の効果を計算（バーに大きく影響）
// 肯定: 自派閥を推す → 相手のその派閥への支持が低いほど効果が必要（基礎値で押す）
// 否定: 相手の派閥を攻撃 → 相手の支持が高い派閥ほど否定が刺さる
function calcFactionEffect(
  topic: FactionId,
  stance: Stance,
  student: Student
): number {
  const topicSupport = student.support[topic];
  const diff = topicSupport - 33;
  // 肯定も否定も、相手の支持度が高い候補ほど効果が大きい
  // どちらもバーをプラス（成功方向）に動かす
  return 15 + diff * 0.4;
}

// 態度ごとの機嫌変化倍率（体力を多く使うほど機嫌への影響が大きい）
const ATTITUDE_MOOD_MULTIPLIER: Record<PlayerAttitude, number> = {
  friendly: 0.5,
  normal: 1.0,
  strong: 1.5,
};

// 趣味話題の効果を計算（主に機嫌変化、バーへの影響は小さい）
// 未判明の趣味でもバトル中に話題にすると判明し、効果はフルで発揮される。
// attitude により機嫌変化量がスケールする（柔らかく×0.5, 普通×1.0, 情熱的に×1.5）
function calcHobbyEffect(
  topic: HobbyTopic,
  stance: Stance,
  student: Student,
  moodDelta: { delta: number },
  attitude: PlayerAttitude,
  decayFactor: number = 1.0
): number {
  // バトル中に話題にした時点で趣味が判明する
  student.revealedHobbies.add(topic);

  const pref = student.hobbies[topic];
  const moodMul = ATTITUDE_MOOD_MULTIPLIER[attitude];

  let baseMood = 0;
  let barEffect = 0;

  if (pref === 'like') {
    if (stance === 'positive') {
      baseMood = 2;
      barEffect = 3;
    } else {
      baseMood = -2;
      barEffect = -3;
    }
  } else if (pref === 'dislike') {
    if (stance === 'positive') {
      baseMood = -1;
      barEffect = -1;
    } else {
      baseMood = 1;
      barEffect = 1;
    }
  } else {
    // 普通（好きでも嫌いでもない）— 情熱的に語れば機嫌が少し動く
    baseMood = stance === 'positive' ? 1 : -1;
    barEffect = stance === 'positive' ? -1 : 1;
  }

  // 繰り返しペナルティ適用（同じ話題は効果が減衰）
  baseMood = Math.round(baseMood * decayFactor);
  barEffect = Math.round(barEffect * decayFactor);

  // 態度倍率を機嫌変化に適用（小数を四捨五入して整数段階に）
  moodDelta.delta += Math.round(baseMood * moodMul);
  return barEffect;
}

// プレイヤーステータス
interface PlayerStats {
  speech: number;   // 弁舌: 思想話題全般にボーナス
  athletic: number; // 運動: 肯定時にボーナス
  intel: number;    // 知性: 否定時にボーナス
}

// ステータスボーナス計算
// speech: 思想話題の全般倍率（0→×1.0, 50→×1.40, 100→×1.80）
// athletic: 肯定時の追加倍率（0→×1.0, 50→×1.25, 100→×1.50）
// intel: 否定時の追加倍率（0→×1.0, 50→×1.25, 100→×1.50）
function calcStatMultiplier(stats: PlayerStats, stance: Stance, isFactionTopic: boolean): number {
  let multiplier = 1.0;
  if (isFactionTopic) {
    // 弁舌: 思想話題全般
    multiplier *= 1.0 + stats.speech * 0.008;
    // 運動/知性: 立場に応じた追加ボーナス
    if (stance === 'positive') {
      multiplier *= 1.0 + stats.athletic * 0.005;
    } else {
      multiplier *= 1.0 + stats.intel * 0.005;
    }
  }
  return multiplier;
}

// プレイヤーターン解決
export function resolvePlayerTurn(
  battle: BattleState,
  attitude: PlayerAttitude,
  topic: Topic,
  stance: Stance,
  factionId: FactionId,
  playerLikedAttributes: PreferenceAttr[],
  playerStats: PlayerStats,
  playerGender: Gender
): { newBattle: BattleState; playerEffect: number; log: BattleLog } {
  const student = battle.student;
  const moodDelta = { delta: 0 };

  // 話題の使用回数を記録（繰り返しペナルティ用）
  const topicKey = topic as string;
  const prevCount = battle.topicUseCounts[topicKey] ?? 0;
  const newTopicUseCounts = { ...battle.topicUseCounts, [topicKey]: prevCount + 1 };

  // 基礎効果計算
  let baseEffect: number;
  const isFactionTopic = (ALL_FACTION_IDS as readonly string[]).includes(topic);

  if (isFactionTopic) {
    const topicFaction = topic as FactionId;
    baseEffect = calcFactionEffect(topicFaction, stance, student);
    // 態度に応じた機嫌ペナルティ（柔らかく=0, 普通=-1, 情熱的=-2）
    moodDelta.delta -= ATTITUDE_MOOD_PENALTY[attitude];
    // 選んだ派閥と話題派閥が一致する場合はボーナス
    if (topicFaction === factionId) {
      baseEffect *= 1.1;
    }
  } else {
    // 趣味話題: 繰り返しペナルティ適用
    // 1回目=フル, 2回目=半減, 3回目以降=無効
    const hobbyDecay = prevCount === 0 ? 1.0 : prevCount === 1 ? 0.5 : 0;
    baseEffect = calcHobbyEffect(topic as HobbyTopic, stance, student, moodDelta, attitude, hobbyDecay);
  }

  // 態度倍率
  baseEffect *= ATTITUDE_MULTIPLIER[attitude];

  // 相手の態度倍率（プレイヤー効果に）
  baseEffect *= MOOD_EFFECT_MULTIPLIER[battle.enemyMood];

  // ステータスボーナス（弁舌/運動/知性）
  baseEffect *= calcStatMultiplier(playerStats, stance, isFactionTopic);

  // 好き属性ボーナス（属性+髪型を統合して判定、異性なら外見系2倍）
  const isOppositeGender = playerGender !== student.gender;
  baseEffect *= likedAttributeMultiplier(playerLikedAttributes, [...student.attributes, student.hairStyle], isOppositeGender);

  // 好かれ度補正
  baseEffect *= affinityMultiplier(student.affinity);

  const playerEffect = Math.round(baseEffect);
  // 防御時はプレイヤー効果を反転（バーを-方向=防衛成功方向に動かす）
  const effectivePlayerEffect = battle.isDefending ? -playerEffect : playerEffect;

  // 性格による機嫌変化補正
  const adjustedMoodDelta = applyPersonalityMoodShift(student.personality, moodDelta.delta);
  const newMood = shiftMood(battle.enemyMood, adjustedMoodDelta);

  const newBar = clamp(battle.barPosition + effectivePlayerEffect, -100, 100);

  const logText = buildPlayerLogText(attitude, topic, stance, effectivePlayerEffect);

  const newBattle: BattleState = {
    ...battle,
    barPosition: newBar,
    enemyMood: newMood,
    logs: [...battle.logs, { speaker: 'player', text: logText, effect: playerEffect }],
    phase: 'resolving',
    selectedAttitude: attitude,
    selectedTopic: topic,
    topicUseCounts: newTopicUseCounts,
  };

  return { newBattle, playerEffect, log: { speaker: 'player', text: logText, effect: playerEffect } };
}

// 恋愛感情時の空回りセリフ
const LOVE_FLUSTERED_LINES = [
  'え、えっと…あの…',
  'そ、そんなこと言われたら…',
  '…っ！べ、別にあなたのためじゃ…',
  'あ、あの、話が頭に入ってこなくて…',
  'な、なんでこんなにドキドキ…',
  'ち、近いです…！集中できない…',
];

// 相手ターン解決
export function resolveEnemyTurn(battle: BattleState): { newBattle: BattleState; enemyEffect: number } {
  const student = battle.student;

  // 恋愛感情: 50%の確率で空回り（反撃0）
  if (battle.isInLove && Math.random() < 0.5) {
    const flusteredLine = LOVE_FLUSTERED_LINES[Math.floor(Math.random() * LOVE_FLUSTERED_LINES.length)];
    const logText = `「${flusteredLine}」`;
    const newBattle: BattleState = {
      ...battle,
      logs: [...battle.logs, { speaker: 'enemy', text: logText, effect: 0 }],
      round: battle.round + 1,
      phase: 'select_attitude',
      selectedAttitude: null,
      selectedTopic: null,
    };
    return { newBattle, enemyEffect: 0 };
  }

  // 相手の反撃（ベース強化 + 性格倍率）
  let baseCounter = 10 + student.stats.speech * 0.15;
  baseCounter *= MOOD_COUNTER_MULTIPLIER[battle.enemyMood];
  baseCounter *= PERSONALITY_COUNTER_MULTIPLIER[student.personality];

  // 恋愛感情: 反撃が弱まる（×0.6）
  if (battle.isInLove) {
    baseCounter *= 0.6;
  }

  const rawEnemyEffect = -Math.round(baseCounter);
  // 防御時は相手の反撃を反転（バーを+方向=相手の説得方向に動かす）
  const enemyEffect = battle.isDefending ? -rawEnemyEffect : rawEnemyEffect;
  const newBar = clamp(battle.barPosition + enemyEffect, -100, 100);

  const catchphrase = getCatchphrase(student.personality, student.attributes);
  const logLabel = battle.isDefending ? '説得' : '反論';
  const logText = `「${catchphrase}」（${logLabel} ${Math.abs(enemyEffect)}）`;

  const newBattle: BattleState = {
    ...battle,
    barPosition: newBar,
    logs: [...battle.logs, { speaker: 'enemy', text: logText, effect: enemyEffect }],
    round: battle.round + 1,
    phase: 'select_attitude',
    selectedAttitude: null,
    selectedTopic: null,
  };

  return { newBattle, enemyEffect };
}

// バトル終了チェック
export function checkBattleEnd(battle: BattleState): BattleState {
  // 防御時は勝敗の判定を反転（バー+100で負け、-100で勝ち）
  const winThreshold = battle.isDefending ? -100 : 100;
  const loseThreshold = battle.isDefending ? 100 : -100;
  if (battle.isDefending ? battle.barPosition <= winThreshold : battle.barPosition >= winThreshold) {
    return { ...battle, phase: 'finished', result: 'win' };
  }
  if (battle.isDefending ? battle.barPosition >= loseThreshold : battle.barPosition <= loseThreshold) {
    return { ...battle, phase: 'finished', result: 'lose' };
  }
  if (battle.round > battle.maxRounds) {
    // タイムアウト: バー位置に応じた結果
    return { ...battle, phase: 'finished', result: 'timeout' };
  }
  return battle;
}

function buildPlayerLogText(
  attitude: PlayerAttitude,
  topic: Topic,
  stance: Stance,
  effect: number
): string {
  const attitudeLabel: Record<PlayerAttitude, string> = {
    friendly: '柔らかく',
    normal: '普通に',
    strong: '情熱的に',
  };
  const topicLabels: Record<string, string> = {
    conservative: '保守派の政策',
    progressive: '革新派の政策',
    sports: '体育派の政策',
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
  const stanceLabel = stance === 'positive' ? '肯定' : '否定';
  const sign = effect >= 0 ? '+' : '';
  const topicLabel = topicLabels[topic] || topic;
  return `${attitudeLabel[attitude]}「${topicLabel}」を${stanceLabel}（${sign}${effect}）`;
}

// スタミナ消費計算
export function getAttitudeCost(attitude: PlayerAttitude): number {
  return ATTITUDE_COST[attitude];
}

// バー位置からシフト量を計算（5〜20%）
// 勝利時: +70→5%, +100→20%  失敗時: -70→5%, -100→20%
function calcShiftPercent(barPosition: number): number {
  const absBar = Math.abs(barPosition);
  // 70→5, 100→20 の線形補間
  const t = clamp((absBar - 70) / 30, 0, 1);
  return 5 + t * 15;
}

// タイムアウト時のシフト量を計算（バー位置に比例、中央付近は小さい）
// barPosition: -99〜+99 → シフト量 0〜10%
function calcTimeoutShiftPercent(barPosition: number): number {
  const absBar = Math.abs(barPosition);
  // 0→0%, 99→10% の線形補間
  const t = clamp(absBar / 99, 0, 1);
  return t * 10;
}

// 説得成功: 相手の思想をプレイヤーの支持方向にシフト
export function applyWinShift(
  student: Student,
  playerFaction: FactionId,
  barPosition: number
): { conservative: number; progressive: number; sports: number } {
  const shiftPercent = calcShiftPercent(barPosition);
  const support = { ...student.support };
  const total = support.conservative + support.progressive + support.sports;
  const shiftAmount = total * shiftPercent / 100;

  // プレイヤーの支持する派閥の軸を増やし、他の2軸から均等に引く
  const others = ALL_FACTION_IDS.filter(k => k !== playerFaction);
  support[playerFaction] += shiftAmount;
  for (const key of others) {
    support[key] -= shiftAmount / 2;
  }

  // 負にならないようクランプし、合計を100に正規化
  for (const key of ALL_FACTION_IDS) {
    support[key] = Math.max(0, support[key]);
  }
  const newTotal = support.conservative + support.progressive + support.sports;
  if (newTotal > 0) {
    for (const key of ALL_FACTION_IDS) {
      support[key] = Math.round(support[key] / newTotal * 100);
    }
  }

  return support;
}

// 説得失敗: プレイヤーの思想を相手の方向にシフト
export function applyLoseShift(
  playerSupport: { conservative: number; progressive: number; sports: number },
  studentSupport: { conservative: number; progressive: number; sports: number },
  barPosition: number
): { newSupport: { conservative: number; progressive: number; sports: number }; shiftPercent: number } {
  const shiftPercent = calcShiftPercent(barPosition);

  // 相手の最大軸の方向にプレイヤーの思想をシフト
  const maxKey = ALL_FACTION_IDS
    .reduce((a, b) => studentSupport[a] >= studentSupport[b] ? a : b);

  const support = { ...playerSupport };
  const total = support.conservative + support.progressive + support.sports;
  const shiftAmount = total * shiftPercent / 100;

  const others = ALL_FACTION_IDS.filter(k => k !== maxKey);
  support[maxKey] += shiftAmount;
  for (const key of others) {
    support[key] -= shiftAmount / 2;
  }

  for (const key of ALL_FACTION_IDS) {
    support[key] = Math.max(0, support[key]);
  }
  const newTotal = support.conservative + support.progressive + support.sports;
  if (newTotal > 0) {
    for (const key of ALL_FACTION_IDS) {
      support[key] = Math.round(support[key] / newTotal * 100);
    }
  }

  return { newSupport: support, shiftPercent };
}

// タイムアウト時のシフト処理
// barPosition > 0: 相手の思想をプレイヤー方向にシフト（弱い勝利）
// barPosition < 0: プレイヤーの思想を相手方向にシフト（弱い敗北）
// barPosition ≈ 0: ほぼ変化なし
export function applyTimeoutShift(
  student: Student,
  playerFaction: FactionId,
  playerSupport: { conservative: number; progressive: number; sports: number },
  barPosition: number
): {
  studentSupport: { conservative: number; progressive: number; sports: number };
  playerNewSupport: { conservative: number; progressive: number; sports: number };
  shiftPercent: number;
} {
  const shiftPercent = calcTimeoutShiftPercent(barPosition);

  if (barPosition > 0) {
    // プレイヤー有利: 相手の思想をシフト
    const support = { ...student.support };
    const total = support.conservative + support.progressive + support.sports;
    const shiftAmount = total * shiftPercent / 100;

    const others = ALL_FACTION_IDS.filter(k => k !== playerFaction);
    support[playerFaction] += shiftAmount;
    for (const key of others) {
      support[key] -= shiftAmount / 2;
    }
    for (const key of ALL_FACTION_IDS) {
      support[key] = Math.max(0, support[key]);
    }
    const newTotal = support.conservative + support.progressive + support.sports;
    if (newTotal > 0) {
      for (const key of ALL_FACTION_IDS) {
        support[key] = Math.round(support[key] / newTotal * 100);
      }
    }
    return { studentSupport: support, playerNewSupport: { ...playerSupport }, shiftPercent };
  } else if (barPosition < 0) {
    // 相手有利: プレイヤーの思想をシフト
    const maxKey = ALL_FACTION_IDS
      .reduce((a, b) => student.support[a] >= student.support[b] ? a : b);

    const support = { ...playerSupport };
    const total = support.conservative + support.progressive + support.sports;
    const shiftAmount = total * shiftPercent / 100;

    const others = ALL_FACTION_IDS.filter(k => k !== maxKey);
    support[maxKey] += shiftAmount;
    for (const key of others) {
      support[key] -= shiftAmount / 2;
    }
    for (const key of ALL_FACTION_IDS) {
      support[key] = Math.max(0, support[key]);
    }
    const newTotal = support.conservative + support.progressive + support.sports;
    if (newTotal > 0) {
      for (const key of ALL_FACTION_IDS) {
        support[key] = Math.round(support[key] / newTotal * 100);
      }
    }
    return { studentSupport: { ...student.support }, playerNewSupport: support, shiftPercent };
  } else {
    // 引き分け: 変化なし
    return { studentSupport: { ...student.support }, playerNewSupport: { ...playerSupport }, shiftPercent: 0 };
  }
}

// プレイヤーの支持派閥を判定（最大軸）
export function getPlayerFaction(
  support: { conservative: number; progressive: number; sports: number }
): FactionId {
  if (support.conservative >= support.progressive && support.conservative >= support.sports) return 'conservative';
  if (support.progressive >= support.sports) return 'progressive';
  return 'sports';
}

// 体力に応じたパス判定
// stamina < 5: 100%パス（柔らかくすら選べない）
// stamina 5〜30: 体力が低いほどパスしやすい
// stamina 30+: パスなし
export function shouldPass(stamina: number): boolean {
  if (stamina < 3) return true;
  if (stamina >= 20) return false;
  // 3→70%, 10→40%, 17→12%, 20→0%
  const passChance = ((20 - stamina) / 17) * 0.7;
  return Math.random() < passChance;
}

export { MOOD_ORDER };
