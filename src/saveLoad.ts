import type { GameState, HobbyTopic, PreferenceAttr } from './types';
import { ORGANIZATIONS } from './data/organizations';

const SAVE_KEY = 'gakuensai-vote-save';

/** Set を配列に変換した Student の JSON 表現 */
interface StudentJSON {
  revealedHobbies: HobbyTopic[];
  revealedLikes: PreferenceAttr[];
  revealedDislikes: PreferenceAttr[];
  [key: string]: unknown;
}

/** GameState の JSON 表現（battle は保存しない） */
interface GameStateJSON {
  screen: GameState['screen'];
  faction: GameState['faction'];
  students: StudentJSON[];
  day: number;
  currentTime: number;
  stamina: number;
  currentLocation: GameState['currentLocation'];
  timeSlot: GameState['timeSlot'];
  playerCharacter: GameState['playerCharacter'];
  playerAttributes: GameState['playerAttributes'];
  playerSupport: GameState['playerSupport'];
  actionLogs: string[];
  activists: string[];
  lostItem: GameState['lostItem'];
  errand: GameState['errand'];
  tutorial: GameState['tutorial'];
  version: number;
}

const SAVE_VERSION = 3;

/** GameState を localStorage に保存 */
export function saveGame(state: GameState): void {
  const json: GameStateJSON = {
    screen: state.screen,
    faction: state.faction,
    students: state.students.map(s => ({
      ...s,
      revealedHobbies: [...s.revealedHobbies],
      revealedLikes: [...s.revealedLikes],
      revealedDislikes: [...s.revealedDislikes],
    })),
    day: state.day,
    currentTime: state.currentTime,
    stamina: state.stamina,
    currentLocation: state.currentLocation,
    timeSlot: state.timeSlot,
    playerCharacter: state.playerCharacter,
    playerAttributes: [...state.playerAttributes],
    playerSupport: { ...state.playerSupport },
    actionLogs: [...state.actionLogs],
    activists: [...state.activists],
    lostItem: state.lostItem,
    errand: state.errand,
    tutorial: { ...state.tutorial },
    version: SAVE_VERSION,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(json));
}

/** localStorage から GameState を復元。セーブデータがなければ null */
export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    const json: GameStateJSON = JSON.parse(raw);
    if (json.version !== SAVE_VERSION) return null;

    const state: GameState = {
      screen: json.screen,
      faction: json.faction,
      students: json.students.map(s => ({
        ...s,
        revealedHobbies: new Set<HobbyTopic>(s.revealedHobbies),
        revealedLikes: [...s.revealedLikes],
        revealedDislikes: [...s.revealedDislikes],
      })) as GameState['students'],
      day: json.day,
      currentTime: json.currentTime,
      stamina: json.stamina,
      currentLocation: json.currentLocation,
      timeSlot: json.timeSlot,
      battle: null,
      lastBattleResult: null,
      playerCharacter: json.playerCharacter,
      playerAttributes: json.playerAttributes,
      playerSupport: json.playerSupport,
      organizations: ORGANIZATIONS,
      actionLogs: json.actionLogs,
      activists: json.activists,
      pendingActivistBattle: null,
      lostItem: json.lostItem,
      errand: json.errand,
      tutorial: json.tutorial,
    };
    return state;
  } catch {
    return null;
  }
}

/** セーブデータが存在するか */
export function hasSaveData(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

/** セーブデータを削除 */
export function deleteSaveData(): void {
  localStorage.removeItem(SAVE_KEY);
}
