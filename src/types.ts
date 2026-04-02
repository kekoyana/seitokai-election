// 候補者ID
export type CandidateId = 'conservative' | 'progressive' | 'sports';

// 候補者の表示情報（色・公約など）
export interface CandidateInfo {
  id: CandidateId;
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
  | 'music_room' | 'art_room'
  | 'courtyard' | 'library' | 'cafeteria';

export interface Location {
  id: LocationId;
  name: string;
}

// 時間帯
export type TimeSlot = 'morning' | 'lunch' | 'afternoon' | 'afterschool';

// 態度選択
export type PlayerAttitude = 'friendly' | 'normal' | 'strong';

// 話題タイプ
export type TopicType = 'candidate' | 'hobby';

// 候補者話題
export type CandidateTopic = 'conservative' | 'progressive' | 'sports';

// 趣味話題
export type HobbyTopic = 'love' | 'game' | 'sns' | 'sports' | 'study' | 'video' | 'music' | 'reading' | 'fashion';

export type Topic = CandidateTopic | HobbyTopic;

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

// 生徒データ（候補者も含むすべてのキャラクター）
export interface Student {
  id: string;
  name: string;
  className: string;
  clubId: string | null;
  description: string;
  hairStyle: HairStyle;         // 髪型（1つ選択）
  personality: Personality;
  hobbies: Record<HobbyTopic, HobbyPreference>;
  revealedHobbies: Set<HobbyTopic>;
  support: { conservative: number; progressive: number; sports: number };
  attributes: Attribute[];
  likedAttributes: Attribute[];
  dislikedAttributes: Attribute[];
  stats: { speech: number; athletic: number; intel: number; maxHp: number };
  affinity: number;
  talkCount: number;
  portrait: string | null;
  candidateId: CandidateId | null;
  playable: boolean;            // プレイヤーとして選択可能か
}

// 候補者生徒（Student に CandidateInfo のプロパティを付加した型）
export type CandidateStudent = Omit<Student, 'id' | 'candidateId'> & {
  id: CandidateId;
  candidateId: CandidateId;
  color: string;
  accentColor: string;
  description: string;
  platform: string;
};

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
}

// プレイヤーキャラクター
export interface PlayerCharacter {
  id: string;
  name: string;
  className: string;
  personality: Personality;
  hobbies: Record<HobbyTopic, HobbyPreference>;
  attributes: Attribute[];
  likedAttributes: Attribute[];
  dislikedAttributes: Attribute[];
  stats: { speech: number; athletic: number; intel: number; maxHp: number };
  portrait: string | null;
}

// アクションタイプ
export type ActionType = 'move' | 'talk' | 'persuade' | 'rest';

// 組織タイプ
export type OrganizationType = 'dictatorship' | 'council' | 'delegation' | 'majority';

// 組織データ
export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  leaderId: string;
  subLeaderIds: string[];
  memberIds: string[];
}

// ゲーム全体状態
export interface GameState {
  screen: 'title' | 'candidate_select' | 'daily' | 'battle' | 'battle_result' | 'ending' | 'gameover';
  candidate: CandidateId | null;
  students: Student[];
  day: number; // 1〜30
  stamina: number; // 0〜100
  currentLocation: LocationId;
  timeSlot: TimeSlot;
  battle: BattleState | null;
  lastBattleResult: { student: Student; win: boolean; shiftAmount: number } | null;
  playerCharacter: PlayerCharacter | null;
  playerAttributes: Attribute[];
  playerSupport: { conservative: number; progressive: number; sports: number };
  organizations: Organization[];
}
