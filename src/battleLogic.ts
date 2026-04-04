import type {
  BattleState, Student, PlayerAttitude, Topic, Stance,
  EnemyMood, HobbyTopic, CandidateId, BattleLog, PreferenceAttr, Gender
} from './types';
import { getCatchphrase } from './data';

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

// 相手の態度倍率（プレイヤー効果）
const MOOD_EFFECT_MULTIPLIER: Record<EnemyMood, number> = {
  furious: 0.3,
  upset: 0.6,
  normal: 1.0,
  favorable: 1.3,
  devoted: 1.8,
};

// 相手の反撃倍率
const MOOD_COUNTER_MULTIPLIER: Record<EnemyMood, number> = {
  furious: 1.5,
  upset: 1.2,
  normal: 1.0,
  favorable: 0.7,
  devoted: 0.3,
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

export function initBattle(student: Student): BattleState {
  const barBonus = affinityBarBonus(student.affinity);
  return {
    student,
    round: 1,
    maxRounds: 10,
    barPosition: clamp(barBonus, -100, 100),
    enemyMood: 'normal',
    logs: [],
    phase: 'select_attitude',
    selectedAttitude: null,
    selectedTopic: null,
    result: null,
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

// 好き属性ボーナス（プレイヤーのlikedAttributesと相手のattributes+hairStyleの一致数）
// 異性の場合、外見系属性の一致ボーナスが2倍になる
function likedAttributeMultiplier(
  playerLikedAttributes: PreferenceAttr[],
  studentTraits: PreferenceAttr[],
  isOppositeGender: boolean
): number {
  let bonus = 0;
  for (const a of playerLikedAttributes) {
    if (studentTraits.includes(a)) {
      const isAppearance = APPEARANCE_PREFS.has(a);
      bonus += (isAppearance && isOppositeGender) ? 0.30 : 0.15;
    }
  }
  return 1.0 + bonus;
}

// 候補者話題の効果を計算（バーに大きく影響）
// 肯定: 自候補を推す → 相手のその候補への支持が低いほど効果が必要（基礎値で押す）
//   支持50の候補を肯定 → 15 + 6.8 = 21.8（相手が元々好きなので刺さる）
//   支持25の候補を肯定 → 15 - 3.2 = 11.8（相手が興味薄いので効果小）
// 否定: 相手の候補を攻撃 → 相手の支持が高い候補ほど否定が刺さる
//   支持50の候補を否定 → 15 + 6.8 = 21.8（核心を突く）
//   支持25の候補を否定 → 15 - 3.2 = 11.8（どうでもいい候補なので効果小）
function calcCandidateEffect(
  topic: CandidateId,
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
  attitude: PlayerAttitude
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
// speech: 思想話題の全般倍率（0→×1.0, 50→×1.25, 100→×1.5）
// athletic: 肯定時の追加倍率（0→×1.0, 50→×1.15, 100→×1.3）
// intel: 否定時の追加倍率（0→×1.0, 50→×1.15, 100→×1.3）
function calcStatMultiplier(stats: PlayerStats, stance: Stance, isCandidateTopic: boolean): number {
  let multiplier = 1.0;
  if (isCandidateTopic) {
    // 弁舌: 思想話題全般
    multiplier *= 1.0 + stats.speech * 0.005;
    // 運動/知性: 立場に応じた追加ボーナス
    if (stance === 'positive') {
      multiplier *= 1.0 + stats.athletic * 0.003;
    } else {
      multiplier *= 1.0 + stats.intel * 0.003;
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
  candidateId: CandidateId,
  playerLikedAttributes: PreferenceAttr[],
  playerStats: PlayerStats,
  playerGender: Gender
): { newBattle: BattleState; playerEffect: number; log: BattleLog } {
  const student = battle.student;
  const moodDelta = { delta: 0 };

  // 基礎効果計算
  let baseEffect: number;
  const isCandidateTopic = ['conservative', 'progressive', 'sports'].includes(topic);

  if (isCandidateTopic) {
    const topicCandidate = topic as CandidateId;
    baseEffect = calcCandidateEffect(topicCandidate, stance, student);
    // 思想の話は機嫌が下がる（攻撃的な話題なので）
    moodDelta.delta -= 1;
    // 選んだ候補と話題候補が一致する場合はボーナス
    if (topicCandidate === candidateId) {
      baseEffect *= 1.1;
    }
  } else {
    baseEffect = calcHobbyEffect(topic as HobbyTopic, stance, student, moodDelta, attitude);
  }

  // 態度倍率
  baseEffect *= ATTITUDE_MULTIPLIER[attitude];

  // 相手の態度倍率（プレイヤー効果に）
  baseEffect *= MOOD_EFFECT_MULTIPLIER[battle.enemyMood];

  // ステータスボーナス（弁舌/運動/知性）
  baseEffect *= calcStatMultiplier(playerStats, stance, isCandidateTopic);

  // 好き属性ボーナス（属性+髪型を統合して判定、異性なら外見系2倍）
  const isOppositeGender = playerGender !== student.gender;
  baseEffect *= likedAttributeMultiplier(playerLikedAttributes, [...student.attributes, student.hairStyle], isOppositeGender);

  // 好かれ度補正
  baseEffect *= affinityMultiplier(student.affinity);

  const playerEffect = Math.round(baseEffect);

  // 態度変化
  const newMood = shiftMood(battle.enemyMood, moodDelta.delta);

  const newBar = clamp(battle.barPosition + playerEffect, -100, 100);

  const logText = buildPlayerLogText(attitude, topic, stance, playerEffect);

  const newBattle: BattleState = {
    ...battle,
    barPosition: newBar,
    enemyMood: newMood,
    logs: [...battle.logs, { speaker: 'player', text: logText, effect: playerEffect }],
    phase: 'resolving',
    selectedAttitude: attitude,
    selectedTopic: topic,
  };

  return { newBattle, playerEffect, log: { speaker: 'player', text: logText, effect: playerEffect } };
}

// 相手ターン解決
export function resolveEnemyTurn(battle: BattleState): { newBattle: BattleState; enemyEffect: number } {
  const student = battle.student;

  // 相手の反撃
  let baseCounter = 8 + student.stats.speech * 0.1;
  baseCounter *= MOOD_COUNTER_MULTIPLIER[battle.enemyMood];

  const enemyEffect = -Math.round(baseCounter);
  const newBar = clamp(battle.barPosition + enemyEffect, -100, 100);

  const catchphrase = getCatchphrase(student.personality, student.attributes);
  const logText = `「${catchphrase}」（反論 ${Math.abs(enemyEffect)}）`;

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
  if (battle.barPosition >= 70) {
    return { ...battle, phase: 'finished', result: 'win' };
  }
  if (battle.barPosition <= -70) {
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
// barPosition: -69〜+69 → シフト量 0〜10%
function calcTimeoutShiftPercent(barPosition: number): number {
  const absBar = Math.abs(barPosition);
  // 0→0%, 69→10% の線形補間
  const t = clamp(absBar / 69, 0, 1);
  return t * 10;
}

// 説得成功: 相手の思想をプレイヤーの支持方向にシフト
export function applyWinShift(
  student: Student,
  playerCandidate: CandidateId,
  barPosition: number
): { conservative: number; progressive: number; sports: number } {
  const shiftPercent = calcShiftPercent(barPosition);
  const support = { ...student.support };
  const total = support.conservative + support.progressive + support.sports;
  const shiftAmount = total * shiftPercent / 100;

  // プレイヤーの支持する候補の軸を増やし、他の2軸から均等に引く
  const others = (['conservative', 'progressive', 'sports'] as CandidateId[]).filter(k => k !== playerCandidate);
  support[playerCandidate] += shiftAmount;
  for (const key of others) {
    support[key] -= shiftAmount / 2;
  }

  // 負にならないようクランプし、合計を100に正規化
  for (const key of ['conservative', 'progressive', 'sports'] as CandidateId[]) {
    support[key] = Math.max(0, support[key]);
  }
  const newTotal = support.conservative + support.progressive + support.sports;
  if (newTotal > 0) {
    for (const key of ['conservative', 'progressive', 'sports'] as CandidateId[]) {
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
  const maxKey = (['conservative', 'progressive', 'sports'] as CandidateId[])
    .reduce((a, b) => studentSupport[a] >= studentSupport[b] ? a : b);

  const support = { ...playerSupport };
  const total = support.conservative + support.progressive + support.sports;
  const shiftAmount = total * shiftPercent / 100;

  const others = (['conservative', 'progressive', 'sports'] as CandidateId[]).filter(k => k !== maxKey);
  support[maxKey] += shiftAmount;
  for (const key of others) {
    support[key] -= shiftAmount / 2;
  }

  for (const key of ['conservative', 'progressive', 'sports'] as CandidateId[]) {
    support[key] = Math.max(0, support[key]);
  }
  const newTotal = support.conservative + support.progressive + support.sports;
  if (newTotal > 0) {
    for (const key of ['conservative', 'progressive', 'sports'] as CandidateId[]) {
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
  playerCandidate: CandidateId,
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

    const others = (['conservative', 'progressive', 'sports'] as CandidateId[]).filter(k => k !== playerCandidate);
    support[playerCandidate] += shiftAmount;
    for (const key of others) {
      support[key] -= shiftAmount / 2;
    }
    for (const key of ['conservative', 'progressive', 'sports'] as CandidateId[]) {
      support[key] = Math.max(0, support[key]);
    }
    const newTotal = support.conservative + support.progressive + support.sports;
    if (newTotal > 0) {
      for (const key of ['conservative', 'progressive', 'sports'] as CandidateId[]) {
        support[key] = Math.round(support[key] / newTotal * 100);
      }
    }
    return { studentSupport: support, playerNewSupport: { ...playerSupport }, shiftPercent };
  } else if (barPosition < 0) {
    // 相手有利: プレイヤーの思想をシフト
    const maxKey = (['conservative', 'progressive', 'sports'] as CandidateId[])
      .reduce((a, b) => student.support[a] >= student.support[b] ? a : b);

    const support = { ...playerSupport };
    const total = support.conservative + support.progressive + support.sports;
    const shiftAmount = total * shiftPercent / 100;

    const others = (['conservative', 'progressive', 'sports'] as CandidateId[]).filter(k => k !== maxKey);
    support[maxKey] += shiftAmount;
    for (const key of others) {
      support[key] -= shiftAmount / 2;
    }
    for (const key of ['conservative', 'progressive', 'sports'] as CandidateId[]) {
      support[key] = Math.max(0, support[key]);
    }
    const newTotal = support.conservative + support.progressive + support.sports;
    if (newTotal > 0) {
      for (const key of ['conservative', 'progressive', 'sports'] as CandidateId[]) {
        support[key] = Math.round(support[key] / newTotal * 100);
      }
    }
    return { studentSupport: { ...student.support }, playerNewSupport: support, shiftPercent };
  } else {
    // 引き分け: 変化なし
    return { studentSupport: { ...student.support }, playerNewSupport: { ...playerSupport }, shiftPercent: 0 };
  }
}

// プレイヤーの支持候補を判定（最大軸）
export function getPlayerCandidate(
  support: { conservative: number; progressive: number; sports: number }
): CandidateId {
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
