/**
 * 説得バトルシミュレーション
 *
 * battleLogic.ts を直接importして、ゲーム本体と同じロジックでシミュレーションを行う。
 *
 * 使い方:
 *   npx tsx tools/simulate.ts
 */

import type {
  Student, PlayerAttitude, Topic, Stance, FactionId,
  HobbyTopic, HobbyPreference, EnemyMood, PreferenceAttr, Attribute,
} from '../src/types';
import {
  initBattle, resolvePlayerTurn, resolveEnemyTurn,
  checkBattleEnd, getAttitudeCost, shouldPass, MOOD_ORDER,
} from '../src/battleLogic';
import { ALL_FACTION_IDS } from '../src/data';

// ── ヘルパー ──

const MOOD_LABELS: Record<EnemyMood, string> = {
  furious: '激怒', upset: '不機嫌', normal: '平常', favorable: '好意的', devoted: '心酔',
};

const ALL_HOBBIES: HobbyTopic[] = [
  'love', 'game', 'sns', 'sports_hobby', 'study', 'video', 'music', 'reading', 'fashion', 'fortune',
];

function makeHobbies(
  likes: HobbyTopic[], dislikes: HobbyTopic[]
): Record<HobbyTopic, HobbyPreference> {
  const result = {} as Record<HobbyTopic, HobbyPreference>;
  for (const h of ALL_HOBBIES) {
    if (likes.includes(h)) result[h] = 'like';
    else if (dislikes.includes(h)) result[h] = 'dislike';
    else result[h] = 'neutral';
  }
  return result;
}

/** テスト用の最小限 Student オブジェクトを生成 */
function makeStudent(params: {
  name: string;
  support: { conservative: number; progressive: number; sports: number };
  hobbies: Record<HobbyTopic, HobbyPreference>;
  revealedHobbies: Set<HobbyTopic>;
  attributes: Attribute[];
  stats: { speech: number; athletic: number; intel: number };
  affinity: number;
}): Student {
  return {
    id: params.name,
    name: params.name,
    nickname: params.name,
    gender: 'male',
    className: '1-A',
    clubId: null,
    description: '',
    hairStyle: 'straight',
    personality: 'passionate',
    hobbies: params.hobbies,
    revealedHobbies: params.revealedHobbies,
    support: params.support,
    attributes: params.attributes,
    revealedLikes: [],
    revealedDislikes: [],
    likedAttributes: [],
    dislikedAttributes: [],
    stats: { ...params.stats, maxHp: 100 },
    affinity: params.affinity,
    talkCount: 0,
    portrait: null,
    playable: false,
  };
}

// ── 戦略定義 ──

interface SimState {
  round: number;
  bar: number;
  mood: EnemyMood;
  stamina: number;
  topicUseCounts: Record<string, number>;
}

type Strategy = (
  state: SimState,
  student: Student,
  playerFaction: FactionId,
) => { attitude: PlayerAttitude; topic: Topic; stance: Stance };

/** 未使用 or 使用回数が少ない好き趣味を返す */
function findBestHobby(student: Student, useCounts: Record<string, number>): HobbyTopic | null {
  const candidates: { topic: HobbyTopic; uses: number }[] = [];
  for (const [hobby, pref] of Object.entries(student.hobbies)) {
    if (pref === 'like' && student.revealedHobbies.has(hobby as HobbyTopic)) {
      candidates.push({ topic: hobby as HobbyTopic, uses: useCounts[hobby] ?? 0 });
    }
  }
  // 使用回数が少ない順（2回以上は効果なし）
  candidates.sort((a, b) => a.uses - b.uses);
  return candidates.length > 0 && candidates[0].uses < 2 ? candidates[0].topic : null;
}

/** 未判明の趣味をランダムに1つ返す */
function findUnknownHobby(student: Student): HobbyTopic | null {
  for (const h of ALL_HOBBIES) {
    if (!student.revealedHobbies.has(h)) return h;
  }
  return null;
}

/** 戦略A: 自候補を肯定（運動依存） — 複数趣味を使い分け */
const strategyPositive: Strategy = (state, student, playerFaction) => {
  const moodIdx = MOOD_ORDER.indexOf(state.mood);

  // 機嫌が好意的以上: 情熱的に候補者話題
  if (moodIdx >= 3 && state.stamina >= 8) {
    return { attitude: 'strong', topic: playerFaction, stance: 'positive' };
  }

  // 機嫌が平常以上: 普通に候補者話題（柔らかくなら機嫌ペナ0）
  if (moodIdx >= 2) {
    // まだ使える好き趣味があるなら機嫌を上げてから攻める
    const hobby = findBestHobby(student, state.topicUseCounts);
    if (hobby) {
      return { attitude: 'normal', topic: hobby, stance: 'positive' };
    }
    // 未知趣味を探索
    const unknown = findUnknownHobby(student);
    if (unknown) {
      return { attitude: 'normal', topic: unknown, stance: 'positive' };
    }
    // 趣味が尽きた: 柔らかく候補者（機嫌ペナ0）
    return { attitude: 'friendly', topic: playerFaction, stance: 'positive' };
  }

  // 機嫌が低い: 趣味で回復
  const hobby = findBestHobby(student, state.topicUseCounts);
  if (hobby) {
    return { attitude: 'friendly', topic: hobby, stance: 'positive' };
  }
  const unknown = findUnknownHobby(student);
  if (unknown) {
    return { attitude: 'friendly', topic: unknown, stance: 'positive' };
  }
  return { attitude: 'friendly', topic: playerFaction, stance: 'positive' };
};

/** 戦略B: 相手の最強候補を否定（知性依存） — 複数趣味を使い分け */
const strategyNegative: Strategy = (state, student, _playerFaction) => {
  const moodIdx = MOOD_ORDER.indexOf(state.mood);
  const enemyTop = ALL_FACTION_IDS
    .reduce((a, b) => student.support[a] >= student.support[b] ? a : b);

  if (moodIdx >= 3 && state.stamina >= 8) {
    return { attitude: 'strong', topic: enemyTop, stance: 'negative' };
  }

  if (moodIdx >= 2) {
    const hobby = findBestHobby(student, state.topicUseCounts);
    if (hobby) {
      return { attitude: 'normal', topic: hobby, stance: 'positive' };
    }
    const unknown = findUnknownHobby(student);
    if (unknown) {
      return { attitude: 'normal', topic: unknown, stance: 'positive' };
    }
    return { attitude: 'friendly', topic: enemyTop, stance: 'negative' };
  }

  const hobby = findBestHobby(student, state.topicUseCounts);
  if (hobby) {
    return { attitude: 'friendly', topic: hobby, stance: 'positive' };
  }
  const unknown = findUnknownHobby(student);
  if (unknown) {
    return { attitude: 'friendly', topic: unknown, stance: 'positive' };
  }
  return { attitude: 'friendly', topic: enemyTop, stance: 'negative' };
};

// ── シミュレーション実行 ──

function simulate(
  label: string,
  student: Student,
  playerFaction: FactionId,
  playerLikedAttrs: PreferenceAttr[],
  playerStats: { speech: number; athletic: number; intel: number },
  playerGender: 'male' | 'female',
  strategy: Strategy,
): { result: string; bar: number; rounds: number } {
  let battle = initBattle(student);
  let stamina = 100;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`【${label}】 vs ${student.name}`);
  console.log(`  プレイヤー: 弁${playerStats.speech}/運${playerStats.athletic}/知${playerStats.intel}`);
  console.log(`  好感度:${student.affinity}(バー初期:${battle.barPosition}) 弁論:${student.stats.speech}`);
  console.log(`  相手支持: 保${student.support.conservative}/革${student.support.progressive}/体${student.support.sports}`);

  while (battle.phase !== 'finished') {
    if (battle.phase !== 'select_attitude') break;

    // パス判定
    if (shouldPass(stamina)) {
      // パス時は相手の反撃のみ
      const { newBattle: afterEnemy, enemyEffect } = resolveEnemyTurn(battle);
      battle = checkBattleEnd(afterEnemy);
      console.log(
        `  R${String(battle.round - 1).padStart(2)}: [パス] ⚡${stamina}` +
        ` → 反撃:${enemyEffect} バー:${battle.barPosition}`
      );
      if (battle.phase === 'finished') break;
      continue;
    }

    const action = strategy(
      { round: battle.round, bar: battle.barPosition, mood: battle.enemyMood, stamina, topicUseCounts: battle.topicUseCounts },
      student,
      playerFaction,
    );

    const prevMood = battle.enemyMood;
    stamina -= getAttitudeCost(action.attitude);

    // プレイヤーターン
    const { newBattle: afterPlayer, playerEffect } = resolvePlayerTurn(
      battle,
      action.attitude,
      action.topic,
      action.stance,
      playerFaction,
      playerLikedAttrs,
      playerStats,
      playerGender,
    );

    // 相手ターン
    const { newBattle: afterEnemy, enemyEffect } = resolveEnemyTurn(afterPlayer);
    battle = checkBattleEnd(afterEnemy);

    const isFactionTopic = (ALL_FACTION_IDS as readonly string[]).includes(action.topic);
    const topicLabel = isFactionTopic ? `思想[${action.topic}]` : `雑談[${action.topic}]`;
    const stanceLabel = action.stance === 'positive' ? '肯定' : '否定';

    console.log(
      `  R${String(battle.round - 1).padStart(2)}: ${action.attitude.padEnd(8)}/${topicLabel.padEnd(14)}/${stanceLabel}` +
      ` → +${String(playerEffect).padStart(3)} 反撃:${String(enemyEffect).padStart(3)}` +
      ` バー:${String(battle.barPosition).padStart(4)} ${MOOD_LABELS[prevMood]}→${MOOD_LABELS[afterPlayer.enemyMood]} ⚡${stamina}`
    );

    if (battle.phase === 'finished') break;
  }

  const resultLabel = battle.result === 'win' ? '説得成功！'
    : battle.result === 'lose' ? '説得失敗'
    : 'タイムアウト';
  console.log(`  >>> ${resultLabel} (バー${battle.barPosition})`);

  return { result: battle.result ?? 'timeout', bar: battle.barPosition, rounds: battle.round };
}

// ── テストデータ ──

const tanaka = makeStudent({
  name: '田中大輝',
  support: { conservative: 25, progressive: 25, sports: 50 },
  hobbies: makeHobbies(['game', 'sports_hobby'], ['love', 'reading']),
  revealedHobbies: new Set<HobbyTopic>(['game', 'sports_hobby']),
  attributes: ['energetic_social', 'energetic', 'sporty'],
  stats: { speech: 30, athletic: 80, intel: 25 },
  affinity: 15,
});

const watanabe = makeStudent({
  name: '渡辺あおい',
  support: { conservative: 30, progressive: 45, sports: 25 },
  hobbies: makeHobbies(['sns', 'reading'], ['sports_hobby', 'fashion']),
  revealedHobbies: new Set<HobbyTopic>(['sns', 'reading']),
  attributes: ['introverted', 'cool', 'fashionable'],
  stats: { speech: 70, athletic: 20, intel: 75 },
  affinity: 15,
});

// プレイヤーステータス
const yamamoto_stats = { speech: 60, athletic: 20, intel: 85 };
const yamamoto_liked: PreferenceAttr[] = ['serious', 'glasses', 'cool'];

const tanaka_stats = { speech: 30, athletic: 80, intel: 25 };
const tanaka_liked: PreferenceAttr[] = ['energetic', 'sporty', 'energetic_social'];

// ── 倍率分析ヘルパー ──

function analyzeMultipliers(
  label: string,
  stats: { speech: number; athletic: number; intel: number },
  likedAttrs: PreferenceAttr[],
  target: Student,
  playerGender: 'male' | 'female',
) {
  const isOpp = playerGender !== target.gender;
  // 属性一致（段階ボーナス方式）
  const traits = [...target.attributes, target.hairStyle];
  const APPEARANCE = new Set(['straight','ponytail','twintail','braid','wavy','bun','bob',
    'flat','busty','glasses','blonde','young','adult']);
  let matchCount = 0;
  let hasAppearanceMatch = false;
  const matches: string[] = [];
  for (const a of likedAttrs) {
    if ((traits as string[]).includes(a)) {
      matchCount++;
      if (APPEARANCE.has(a)) hasAppearanceMatch = true;
      matches.push(a);
    }
  }
  const baseBonus = matchCount === 0 ? 0 : matchCount === 1 ? 0.10 : matchCount === 2 ? 0.20 : 0.25;
  const genderBonus = (isOpp && hasAppearanceMatch) ? 0.05 : 0;

  const speechMul = 1 + stats.speech * 0.008;
  const athMul = 1 + stats.athletic * 0.005;
  const intMul = 1 + stats.intel * 0.005;
  const attrMul = 1 + baseBonus + genderBonus;
  const affMul = 1 + target.affinity / 200;

  console.log(`\n  【${label}】倍率内訳:`);
  console.log(`    弁舌×${speechMul.toFixed(3)} (speech=${stats.speech})`);
  console.log(`    運動×${athMul.toFixed(3)} (athletic=${stats.athletic}) ← 肯定時`);
  console.log(`    知性×${intMul.toFixed(3)} (intel=${stats.intel}) ← 否定時`);
  console.log(`    属性×${attrMul.toFixed(3)} [${matches.join(', ') || 'なし'}]`);
  console.log(`    好感×${affMul.toFixed(3)} (affinity=${target.affinity})`);

  // 肯定時の総合倍率（態度strong=1.2, 機嫌好意的=1.15）
  const totalPos = 1.2 * 1.15 * speechMul * athMul * attrMul * affMul;
  const totalNeg = 1.2 * 1.15 * speechMul * intMul * attrMul * affMul;
  console.log(`    総合(肯定/strong/好意的): ×${totalPos.toFixed(3)}`);
  console.log(`    総合(否定/strong/好意的): ×${totalNeg.toFixed(3)}`);
}

// ── 実行 ──

console.log('━'.repeat(60));
console.log('  1. 山本蓮(弁60/運20/知85) → 田中大輝  好感度15');
console.log('━'.repeat(60));
analyzeMultipliers('山本→田中', yamamoto_stats, yamamoto_liked, tanaka, 'male');

console.log('\n■ 戦略A: 自候補(保守)を肯定 → 運動20が効く');
simulate('肯定戦略', tanaka, 'conservative', yamamoto_liked, yamamoto_stats, 'male', strategyPositive);

console.log('\n■ 戦略B: 相手の最強候補(体育)を否定 → 知性85が効く');
simulate('否定戦略', tanaka, 'conservative', yamamoto_liked, yamamoto_stats, 'male', strategyNegative);

console.log('\n\n' + '━'.repeat(60));
console.log('  2. 山本蓮(弁60/運20/知85) → 渡辺あおい  好感度15');
console.log('━'.repeat(60));
analyzeMultipliers('山本→渡辺', yamamoto_stats, yamamoto_liked, watanabe, 'male');

console.log('\n■ 戦略A: 自候補(保守)を肯定');
simulate('肯定戦略', watanabe, 'conservative', yamamoto_liked, yamamoto_stats, 'male', strategyPositive);

console.log('\n■ 戦略B: 相手の最強候補(革新)を否定');
simulate('否定戦略', watanabe, 'conservative', yamamoto_liked, yamamoto_stats, 'male', strategyNegative);

console.log('\n\n' + '━'.repeat(60));
console.log('  3. 田中大輝(弁30/運80/知25) → 渡辺あおい  好感度15');
console.log('━'.repeat(60));
analyzeMultipliers('田中→渡辺', tanaka_stats, tanaka_liked, watanabe, 'male');

console.log('\n■ 戦略A: 自候補(体育)を肯定 → 運動80が効く');
simulate('肯定戦略', watanabe, 'sports', tanaka_liked, tanaka_stats, 'male', strategyPositive);

console.log('\n■ 戦略B: 相手の最強候補(革新)を否定 → 知性25しかない');
simulate('否定戦略', watanabe, 'sports', tanaka_liked, tanaka_stats, 'male', strategyNegative);

// ── 4. 性格による難易度差 ──
console.log('\n\n' + '━'.repeat(60));
console.log('  4. 【性格による難易度差】同条件・性格のみ変更');
console.log('━'.repeat(60));

const avgStats = { speech: 50, athletic: 50, intel: 50 };
const avgLiked: PreferenceAttr[] = ['cool'];

// 柔軟な相手
const flexibleStudent = makeStudent({
  name: '柔軟タイプ',
  support: { conservative: 33, progressive: 34, sports: 33 },
  hobbies: makeHobbies(['game', 'music'], ['study']),
  revealedHobbies: new Set<HobbyTopic>(['game', 'music']),
  attributes: ['cool'],
  stats: { speech: 50, athletic: 40, intel: 40 },
  affinity: 0,
});
(flexibleStudent as any).personality = 'flexible';

// 頑固な相手
const stubbornStudent = makeStudent({
  name: '頑固タイプ',
  support: { conservative: 33, progressive: 34, sports: 33 },
  hobbies: makeHobbies(['game', 'music'], ['study']),
  revealedHobbies: new Set<HobbyTopic>(['game', 'music']),
  attributes: ['cool'],
  stats: { speech: 50, athletic: 40, intel: 40 },
  affinity: 0,
});
(stubbornStudent as any).personality = 'stubborn';

// 狡猾な相手
const cunningStudent = makeStudent({
  name: '狡猾タイプ',
  support: { conservative: 33, progressive: 34, sports: 33 },
  hobbies: makeHobbies(['game', 'music'], ['study']),
  revealedHobbies: new Set<HobbyTopic>(['game', 'music']),
  attributes: ['cool'],
  stats: { speech: 50, athletic: 40, intel: 40 },
  affinity: 0,
});
(cunningStudent as any).personality = 'cunning';

console.log('\n■ vs 柔軟タイプ（反撃×0.7, 機嫌上がりやすい）');
simulate('肯定', flexibleStudent, 'conservative', avgLiked, avgStats, 'male', strategyPositive);

console.log('\n■ vs 頑固タイプ（反撃×1.3, 機嫌変化しにくい）');
simulate('肯定', stubbornStudent, 'conservative', avgLiked, avgStats, 'male', strategyPositive);

console.log('\n■ vs 狡猾タイプ（反撃×1.15, 機嫌変化50%無効）');
simulate('肯定', cunningStudent, 'conservative', avgLiked, avgStats, 'male', strategyPositive);

// ── 5. 属性一致の影響比較 ──
console.log('\n\n' + '━'.repeat(60));
console.log('  5. 【属性一致の影響比較】同じ能力値、属性一致0 vs 3');
console.log('━'.repeat(60));

const noMatch: PreferenceAttr[] = ['blonde', 'bun', 'delinquent']; // 渡辺と一致しない
const fullMatch: PreferenceAttr[] = ['cool', 'fashionable', 'introverted']; // 渡辺と3一致

analyzeMultipliers('一致0', avgStats, noMatch, watanabe, 'male');
console.log('\n■ 属性一致0 / 否定戦略');
simulate('一致0', watanabe, 'conservative', noMatch, avgStats, 'male', strategyNegative);

analyzeMultipliers('一致3', avgStats, fullMatch, watanabe, 'male');
console.log('\n■ 属性一致3 / 否定戦略');
simulate('一致3', watanabe, 'conservative', fullMatch, avgStats, 'male', strategyNegative);

// ── 6. ステータス差の影響比較 ──
console.log('\n\n' + '━'.repeat(60));
console.log('  6. 【ステータス差の影響比較】属性一致0、弁30/知30 vs 弁80/知80');
console.log('━'.repeat(60));

const lowStats = { speech: 30, athletic: 30, intel: 30 };
const highStats = { speech: 80, athletic: 80, intel: 80 };

analyzeMultipliers('低能力', lowStats, noMatch, watanabe, 'male');
console.log('\n■ 低能力(弁30/知30) / 否定戦略');
simulate('低能力', watanabe, 'conservative', noMatch, lowStats, 'male', strategyNegative);

analyzeMultipliers('高能力', highStats, noMatch, watanabe, 'male');
console.log('\n■ 高能力(弁80/知80) / 否定戦略');
simulate('高能力', watanabe, 'conservative', noMatch, highStats, 'male', strategyNegative);

// ── 7. 好感度の影響 ──
console.log('\n\n' + '━'.repeat(60));
console.log('  7. 【好感度の影響】好感度0 vs 50 vs 80');
console.log('━'.repeat(60));

for (const aff of [0, 50, 80]) {
  const s = makeStudent({
    name: `好感度${aff}`,
    support: { conservative: 33, progressive: 34, sports: 33 },
    hobbies: makeHobbies(['game', 'music'], ['study']),
    revealedHobbies: new Set<HobbyTopic>(['game', 'music']),
    attributes: ['cool'],
    stats: { speech: 50, athletic: 40, intel: 40 },
    affinity: aff,
  });
  console.log(`\n■ 好感度${aff}`);
  simulate(`好感度${aff}`, s, 'conservative', avgLiked, avgStats, 'male', strategyPositive);
}
