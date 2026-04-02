// 説得バトルシミュレーション（ステータス反映版）

type PlayerAttitude = 'friendly' | 'normal' | 'strong';
type EnemyMood = 'furious' | 'upset' | 'normal' | 'favorable' | 'devoted';
type CandidateId = 'conservative' | 'progressive' | 'sports';
type HobbyTopic = 'love' | 'game' | 'sns' | 'sports' | 'study' | 'video' | 'music' | 'reading' | 'fashion';
type HobbyPreference = 'like' | 'dislike' | 'neutral';
type Attribute = 'glasses' | 'blonde' | 'young' | 'adult' | 'flat' | 'busty' | 'energetic_social' | 'introverted' | 'serious' | 'delinquent' | 'fashionable' | 'airhead' | 'cool' | 'energetic' | 'sporty';
type Topic = CandidateId | HobbyTopic;
type Stance = 'positive' | 'negative';

const ATTITUDE_MULTIPLIER: Record<PlayerAttitude, number> = { friendly: 0.7, normal: 1.0, strong: 1.2 };
const ATTITUDE_COST: Record<PlayerAttitude, number> = { friendly: 3, normal: 5, strong: 8 };
const MOOD_EFFECT_MULTIPLIER: Record<EnemyMood, number> = { furious: 0.3, upset: 0.6, normal: 1.0, favorable: 1.3, devoted: 1.8 };
const MOOD_COUNTER_MULTIPLIER: Record<EnemyMood, number> = { furious: 1.5, upset: 1.2, normal: 1.0, favorable: 0.7, devoted: 0.3 };
const MOOD_ORDER: EnemyMood[] = ['furious', 'upset', 'normal', 'favorable', 'devoted'];
const MOOD_LABELS: Record<EnemyMood, string> = { furious: '激怒', upset: '不機嫌', normal: '平常', favorable: '好意的', devoted: '心酔' };

function clamp(val: number, min: number, max: number) { return Math.max(min, Math.min(max, val)); }
function getMoodIndex(mood: EnemyMood) { return MOOD_ORDER.indexOf(mood); }
function shiftMood(mood: EnemyMood, delta: number): EnemyMood {
  return MOOD_ORDER[clamp(getMoodIndex(mood) + delta, 0, 4)];
}
function shouldPass(stamina: number): boolean {
  if (stamina < 3) return true;
  if (stamina >= 20) return false;
  return Math.random() < ((20 - stamina) / 17) * 0.7;
}

interface PlayerStats { speech: number; athletic: number; intel: number; }

interface SimStudent {
  name: string;
  support: Record<CandidateId, number>;
  hobbies: Record<HobbyTopic, HobbyPreference>;
  revealedHobbies: Set<HobbyTopic>;
  attributes: Attribute[];
  speech: number;
  affinity: number;
}

interface SimState {
  round: number; bar: number; mood: EnemyMood; stamina: number;
}

function calcStatMultiplier(stats: PlayerStats, stance: Stance, isCandidateTopic: boolean): number {
  let m = 1.0;
  if (isCandidateTopic) {
    m *= 1.0 + stats.speech * 0.005;
    if (stance === 'positive') m *= 1.0 + stats.athletic * 0.003;
    else m *= 1.0 + stats.intel * 0.003;
  }
  return m;
}

function simulate(
  label: string,
  student: SimStudent,
  playerCandidate: CandidateId,
  playerLikedAttrs: Attribute[],
  playerStats: PlayerStats,
  strategy: (state: SimState, student: SimStudent, playerCandidate: CandidateId, stats: PlayerStats) => { attitude: PlayerAttitude; topic: Topic; stance: Stance }
): { result: string; bar: number; rounds: number } {
  const maxRounds = 10;
  const barBonus = Math.round(student.affinity / 10);
  let bar = clamp(barBonus, -100, 100);
  let mood: EnemyMood = 'normal';
  let stamina = 100;
  const attrMatch = playerLikedAttrs.filter(a => student.attributes.includes(a)).length;

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`【${label}】 vs ${student.name}`);
  console.log(`  プレイヤー: 弁${playerStats.speech}/運${playerStats.athletic}/知${playerStats.intel}`);
  console.log(`  好感度:${student.affinity}(バー初期:${barBonus}) 属性一致:${attrMatch}(×${(1+attrMatch*0.15).toFixed(2)}) 弁論:${student.speech}`);
  console.log(`  相手支持: 保${student.support.conservative}/革${student.support.progressive}/体${student.support.sports}`);

  for (let round = 1; round <= maxRounds; round++) {
    if (shouldPass(stamina)) {
      let counter = 8 + student.speech * 0.1;
      counter *= MOOD_COUNTER_MULTIPLIER[mood];
      const enemyEff = -Math.round(counter);
      bar = clamp(bar + enemyEff, -100, 100);
      console.log(`  R${round.toString().padStart(2)}: [パス] ⚡${stamina} → 反撃:${enemyEff} バー:${bar}`);
      if (bar <= -70) { console.log(`  >>> 説得失敗 (バー${bar})`); return { result: 'lose', bar, rounds: round }; }
      continue;
    }

    const action = strategy({ round, bar, mood, stamina }, student, playerCandidate, playerStats);
    const { attitude, topic, stance } = action;
    stamina -= ATTITUDE_COST[attitude];

    const isCandidateTopic = ['conservative', 'progressive', 'sports'].includes(topic);
    let moodDelta = 0;
    let baseEffect: number;

    if (isCandidateTopic) {
      const topicSupport = student.support[topic as CandidateId];
      const diff = topicSupport - 33;
      baseEffect = 15 + diff * 0.4;
      moodDelta = -1;
      if (topic === playerCandidate) baseEffect *= 1.1;
    } else {
      const pref = student.revealedHobbies.has(topic as HobbyTopic)
        ? student.hobbies[topic as HobbyTopic] : 'neutral';
      if (pref === 'like') {
        if (stance === 'positive') { moodDelta = 2; baseEffect = 3; }
        else { moodDelta = -2; baseEffect = -3; }
      } else if (pref === 'dislike') {
        if (stance === 'positive') { moodDelta = -1; baseEffect = -1; }
        else { moodDelta = 1; baseEffect = 1; }
      } else {
        baseEffect = stance === 'positive' ? -1 : 1;
      }
    }

    baseEffect *= ATTITUDE_MULTIPLIER[attitude];
    baseEffect *= MOOD_EFFECT_MULTIPLIER[mood];
    baseEffect *= calcStatMultiplier(playerStats, stance, isCandidateTopic);
    baseEffect *= (1.0 + attrMatch * 0.15);
    baseEffect *= (1.0 + student.affinity / 200);
    const playerEff = Math.round(baseEffect);

    const newMood = shiftMood(mood, moodDelta);
    let counter = 8 + student.speech * 0.1;
    counter *= MOOD_COUNTER_MULTIPLIER[newMood];
    const enemyEff = -Math.round(counter);
    bar = clamp(bar + playerEff + enemyEff, -100, 100);

    const topicLabel = isCandidateTopic ? `思想[${topic}]` : `雑談[${topic}]`;
    const stanceLabel = stance === 'positive' ? '肯定' : '否定';
    const statLabel = isCandidateTopic
      ? `(弁×${(1+playerStats.speech*0.005).toFixed(2)} ${stance==='positive' ? `運×${(1+playerStats.athletic*0.003).toFixed(2)}` : `知×${(1+playerStats.intel*0.003).toFixed(2)}`})`
      : '';
    console.log(
      `  R${round.toString().padStart(2)}: ${attitude.padEnd(8)}/${topicLabel.padEnd(14)}/${stanceLabel}` +
      ` → +${String(playerEff).padStart(3)} 反撃:${String(enemyEff).padStart(3)}` +
      ` バー:${String(bar).padStart(4)} ${MOOD_LABELS[mood]}→${MOOD_LABELS[newMood]} ⚡${stamina} ${statLabel}`
    );
    mood = newMood;

    if (bar >= 70) { console.log(`  >>> 説得成功！(バー${bar})`); return { result: 'win', bar, rounds: round }; }
    if (bar <= -70) { console.log(`  >>> 説得失敗 (バー${bar})`); return { result: 'lose', bar, rounds: round }; }
  }

  console.log(`  >>> タイムアウト (バー${bar})`);
  return { result: 'timeout', bar, rounds: 10 };
}

// --- 戦略A: 自候補を肯定（運動依存） ---
function strategyPositive(
  state: SimState, student: SimStudent, playerCandidate: CandidateId, _stats: PlayerStats
): { attitude: PlayerAttitude; topic: Topic; stance: Stance } {
  const moodIdx = getMoodIndex(state.mood);
  let attitude: PlayerAttitude = 'normal';
  if (state.stamina >= 40 && moodIdx >= 3) attitude = 'strong';
  else if (state.stamina < 15) attitude = 'friendly';

  if (moodIdx >= 3) return { attitude, topic: playerCandidate, stance: 'positive' };

  for (const [hobby, pref] of Object.entries(student.hobbies)) {
    if (pref === 'like' && student.revealedHobbies.has(hobby as HobbyTopic)) {
      return { attitude: 'friendly', topic: hobby as HobbyTopic, stance: 'positive' };
    }
  }
  return { attitude, topic: playerCandidate, stance: 'positive' };
}

// --- 戦略B: 相手の最強候補を否定（知性依存） ---
function strategyNegative(
  state: SimState, student: SimStudent, _playerCandidate: CandidateId, _stats: PlayerStats
): { attitude: PlayerAttitude; topic: Topic; stance: Stance } {
  const moodIdx = getMoodIndex(state.mood);
  let attitude: PlayerAttitude = 'normal';
  if (state.stamina >= 40 && moodIdx >= 3) attitude = 'strong';
  else if (state.stamina < 15) attitude = 'friendly';

  // 相手の最大支持候補を特定
  const enemyTop = (['conservative', 'progressive', 'sports'] as CandidateId[])
    .reduce((a, b) => student.support[a] >= student.support[b] ? a : b);

  if (moodIdx >= 3) return { attitude, topic: enemyTop, stance: 'negative' };

  for (const [hobby, pref] of Object.entries(student.hobbies)) {
    if (pref === 'like' && student.revealedHobbies.has(hobby as HobbyTopic)) {
      return { attitude: 'friendly', topic: hobby as HobbyTopic, stance: 'positive' };
    }
  }
  return { attitude, topic: enemyTop, stance: 'negative' };
}

// ========== テスト ==========
const allHobbies: HobbyTopic[] = ['love', 'game', 'sns', 'sports', 'study', 'video', 'music', 'reading', 'fashion'];
function makeHobbies(likes: HobbyTopic[], dislikes: HobbyTopic[]): Record<HobbyTopic, HobbyPreference> {
  const result = {} as Record<HobbyTopic, HobbyPreference>;
  for (const h of allHobbies) {
    if (likes.includes(h)) result[h] = 'like';
    else if (dislikes.includes(h)) result[h] = 'dislike';
    else result[h] = 'neutral';
  }
  return result;
}

// 山本蓮: speech60, athletic20, intel85
const yamamoto = { speech: 60, athletic: 20, intel: 85 };
const yamamoto_liked: Attribute[] = ['serious', 'glasses', 'cool'];

// 田中大輝: speech30, athletic80
const tanaka: SimStudent = {
  name: '田中大輝',
  support: { conservative: 25, progressive: 25, sports: 50 },
  hobbies: makeHobbies(['game', 'sports'], ['love', 'reading']),
  revealedHobbies: new Set<HobbyTopic>(['game', 'sports']),
  attributes: ['energetic_social', 'energetic', 'sporty'],
  speech: 30, affinity: 15,
};

// 田中大輝をプレイヤーにした場合: speech30, athletic80, intel25
const tanaka_stats = { speech: 30, athletic: 80, intel: 25 };
const tanaka_liked: Attribute[] = ['energetic', 'sporty', 'energetic_social'];

// 渡辺あおい
const watanabe: SimStudent = {
  name: '渡辺あおい',
  support: { conservative: 30, progressive: 45, sports: 25 },
  hobbies: makeHobbies(['sns', 'reading'], ['sports', 'fashion']),
  revealedHobbies: new Set<HobbyTopic>(['sns', 'reading']),
  attributes: ['introverted', 'cool', 'fashionable'],
  speech: 70, affinity: 15,
};

console.log('━'.repeat(60));
console.log('  山本蓮(弁60/運20/知85) → 田中大輝  好感度15');
console.log('━'.repeat(60));

console.log('\n■ 戦略A: 自候補(保守)を肯定 → 運動20が効く');
simulate('肯定戦略', tanaka, 'conservative', yamamoto_liked, yamamoto, strategyPositive);

console.log('\n■ 戦略B: 相手の最強候補(体育)を否定 → 知性85が効く');
simulate('否定戦略', tanaka, 'conservative', yamamoto_liked, yamamoto, strategyNegative);

console.log('\n\n' + '━'.repeat(60));
console.log('  山本蓮(弁60/運20/知85) → 渡辺あおい  好感度15');
console.log('━'.repeat(60));

console.log('\n■ 戦略A: 自候補(保守)を肯定');
simulate('肯定戦略', watanabe, 'conservative', yamamoto_liked, yamamoto, strategyPositive);

console.log('\n■ 戦略B: 相手の最強候補(革新)を否定');
simulate('否定戦略', watanabe, 'conservative', yamamoto_liked, yamamoto, strategyNegative);

console.log('\n\n' + '━'.repeat(60));
console.log('  【比較】田中大輝(弁30/運80/知25) → 渡辺あおい  好感度15');
console.log('━'.repeat(60));

console.log('\n■ 戦略A: 自候補(体育)を肯定 → 運動80が効く');
simulate('肯定戦略', watanabe, 'sports', tanaka_liked, tanaka_stats, strategyPositive);

console.log('\n■ 戦略B: 相手の最強候補(革新)を否定 → 知性25しかない');
simulate('否定戦略', watanabe, 'sports', tanaka_liked, tanaka_stats, strategyNegative);
