// 派閥ID
export type FactionId = 'conservative' | 'progressive' | 'sports';

// 派閥の表示情報（色・方針など）
export interface FactionInfo {
  id: FactionId;
  color: string;
  accentColor: string;
  description: string;
  platform: string;
}

// 場所
export type LocationId =
  | 'class1a' | 'class1b' | 'class1c' | 'class1d'
  | 'class2a' | 'class2b' | 'class2c' | 'class2d'
  | 'class3a' | 'class3b' | 'class3c' | 'class3d'
  | 'track_field' | 'soccer_field' | 'baseball_field' | 'tennis_court'
  | 'music_room' | 'art_room' | 'broadcast_room'
  | 'courtyard' | 'library' | 'cafeteria' | 'nurses_office'
  | 'rooftop'
  | 'corridor_1f' | 'corridor_2f' | 'corridor_3f' | 'corridor_ground';

// フロア
export type Floor = '1f' | '2f' | '3f' | 'ground';

export interface Location {
  id: LocationId;
  name: string;
}

// 時間帯
export type TimeSlot = 'morning' | 'lunch' | 'afternoon' | 'afterschool';

// 態度選択
export type PlayerAttitude = 'friendly' | 'normal' | 'strong';

// 話題タイプ
export type TopicType = 'faction' | 'hobby';

// 派閥話題
export type FactionTopic = 'conservative' | 'progressive' | 'sports';

// 趣味話題
export type HobbyTopic = 'love' | 'game' | 'sns' | 'sports_hobby' | 'study' | 'video' | 'music' | 'reading' | 'fashion' | 'fortune';

export type Topic = FactionTopic | HobbyTopic;

// 立場
export type Stance = 'positive' | 'negative';

// 相手の態度（5段階）
export type EnemyMood = 'furious' | 'upset' | 'normal' | 'favorable' | 'devoted';

// 性格
export type Personality = 'passionate' | 'cautious' | 'stubborn' | 'flexible' | 'cunning';

// 趣味の好き嫌い
export type HobbyPreference = 'like' | 'dislike' | 'neutral';

// 外見属性
export type AppearanceAttr = 'glasses' | 'blonde' | 'young' | 'adult' | 'flat' | 'busty';

// 雰囲気属性
export type VibeAttr = 'energetic_social' | 'introverted' | 'serious' | 'delinquent' | 'fashionable' | 'airhead' | 'cool' | 'energetic' | 'sporty';

export type Attribute = AppearanceAttr | VibeAttr;

// 髪型（1つ選択）
export type HairStyle = 'straight' | 'ponytail' | 'twintail' | 'braid' | 'wavy' | 'bun' | 'bob';

// 好み・苦手に使える属性（外見+雰囲気+髪型）
export type PreferenceAttr = Attribute | HairStyle;

// 性別
export type Gender = 'male' | 'female';

// 生徒データ（すべてのキャラクター）
export interface Student {
  id: string;
  name: string;
  nickname: string;           // あだ名
  gender: Gender;
  className: string;
  clubId: string | null;
  description: string;
  hairStyle: HairStyle;         // 髪型（1つ選択）
  personality: Personality;
  hobbies: Record<HobbyTopic, HobbyPreference>;
  revealedHobbies: Set<HobbyTopic>;
  revealedLikes: PreferenceAttr[];    // 判明済みの好み属性
  revealedDislikes: PreferenceAttr[]; // 判明済みの苦手属性
  support: { conservative: number; progressive: number; sports: number };
  attributes: Attribute[];
  likedAttributes: PreferenceAttr[];
  dislikedAttributes: PreferenceAttr[];
  stats: { speech: number; athletic: number; intel: number; maxHp: number };
  affinity: number;
  talkCount: number;
  portrait: string | null;
  playable: boolean;            // プレイヤーとして選択可能か
}

// バトルログ
export interface BattleLog {
  speaker: 'player' | 'enemy';
  text: string;
  effect: number;
}

// 説得バトル状態
export interface BattleState {
  student: Student;
  round: number;
  maxRounds: number;
  barPosition: number; // -100〜100
  enemyMood: EnemyMood;
  logs: BattleLog[];
  phase: 'select_attitude' | 'select_topic' | 'select_stance' | 'resolving' | 'finished';
  selectedAttitude: PlayerAttitude | null;
  selectedTopic: Topic | null;
  result: 'win' | 'lose' | 'timeout' | null;
  isDefending: boolean; // 活動家から説得されている場合true（勝敗反転）
  topicUseCounts: Record<string, number>; // 話題ごとの使用回数（繰り返しペナルティ用）
  isInLove: boolean; // 相手が恋愛感情を持っている（異性+相性30+好感度30）
}

// プレイヤーキャラクター
export interface PlayerCharacter {
  id: string;
  name: string;
  gender: Gender;
  className: string;
  personality: Personality;
  hobbies: Record<HobbyTopic, HobbyPreference>;
  attributes: Attribute[];
  likedAttributes: PreferenceAttr[];
  dislikedAttributes: PreferenceAttr[];
  stats: { speech: number; athletic: number; intel: number; maxHp: number };
  portrait: string | null;
}

// アクションタイプ
export type ActionType = 'move' | 'talk' | 'persuade' | 'rest' | 'nurse_rest';

// 組織タイプ
export type OrganizationType = 'dictatorship' | 'council' | 'delegation' | 'majority';

// 組織データ
export interface Organization {
  id: string;
  name: string;
  description: string;
  type: OrganizationType;
  leaderId: string;
  subLeaderIds: string[];
  memberIds: string[];
}

// ゲーム全体状態
export interface GameState {
  screen: 'title' | 'prologue' | 'faction_select' | 'daily' | 'battle' | 'battle_result' | 'ending' | 'gameover';
  faction: FactionId | null;
  students: Student[];
  day: number; // 1〜30
  currentTime: number; // 放課後の経過分（0=15:00, 240=19:00）
  stamina: number; // 0〜100
  currentLocation: LocationId;
  timeSlot: TimeSlot;
  battle: BattleState | null;
  lastBattleResult: { student: Student; win: boolean; shiftAmount: number } | null;
  playerCharacter: PlayerCharacter | null;
  playerAttributes: PreferenceAttr[];
  playerSupport: { conservative: number; progressive: number; sports: number };
  organizations: Organization[];
  actionLogs: string[];
  activists: string[];  // 活動家の生徒IDリスト
  // 探索イベント
  lostItem: { itemName: string; hint: string; ownerId: string } | null;
  errand: { fromId: string; toId: string; itemName: string } | null;
  tutorial: {
    seenPrologue: boolean;
    seenMove: boolean;
    seenTalk: boolean;
  };
}
