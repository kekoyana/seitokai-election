/**
 * GA4 Measurement Protocol によるイベント送信
 * itch.io の iframe 内でも動作する
 */

const MEASUREMENT_ID = 'G-NZB9PNXGRJ';
const API_SECRET = 'XB7iCCNhQ4CI6LCMmXRu5A';
const ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`;

/** セッション開始時刻（プレイ時間計測用） */
let sessionStartTime = 0;

function getClientId(): string {
  const key = 'ga_client_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `${Date.now()}.${Math.floor(Math.random() * 1e9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getSessionId(): string {
  const key = 'ga_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = String(Date.now());
    sessionStorage.setItem(key, id);
  }
  return id;
}

/** セッション開始からの経過秒数 */
function getPlayTimeSec(): number {
  if (sessionStartTime === 0) return 0;
  return Math.round((Date.now() - sessionStartTime) / 1000);
}

function send(eventName: string, params?: Record<string, string | number | boolean>): void {
  const body = {
    client_id: getClientId(),
    events: [{ name: eventName, params: { session_id: getSessionId(), ...params } }],
  };
  fetch(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(body),
  }).catch(() => { /* silently ignore */ });
}

/** セッション開始（ページ読み込み時） */
export function trackSessionStart(): void {
  sessionStartTime = Date.now();
  send('session_start');
}

/** タイトル画面で「はじめから」を押した */
export function trackGameStart(): void {
  send('game_start');
}

/** 派閥を選択した */
export function trackFactionSelect(faction: string): void {
  send('faction_select', { faction });
}

/** キャラクターを選択してゲーム開始 */
export function trackCharacterSelect(
  characterId: string, characterName: string, faction: string,
  gender: string, personality: string, className: string,
): void {
  send('character_select', {
    character_id: characterId,
    character_name: characterName,
    faction,
    gender,
    personality,
    class_name: className,
  });
}

/** 初日チュートリアル（移動ヒント）を通過 */
export function trackTutorialMove(): void {
  send('tutorial_move');
}

/** 初回部屋入室チュートリアル（会話ヒント）を通過 */
export function trackTutorialTalk(): void {
  send('tutorial_talk');
}

/** 説得チュートリアルを完了 */
export function trackTutorialPersuade(): void {
  send('tutorial_persuade');
}

/** 説得バトル開始 */
export function trackBattleStart(opponentName: string, opponentPersonality: string, isDefending: boolean): void {
  send('battle_start', { opponent_name: opponentName, opponent_personality: opponentPersonality, is_defending: isDefending });
}

/** 説得バトル終了 */
export function trackBattleEnd(
  result: string, opponentName: string, opponentPersonality: string,
  isDefending: boolean, rounds: number, barPosition: number,
): void {
  send('battle_end', {
    result, opponent_name: opponentName, opponent_personality: opponentPersonality,
    is_defending: isDefending, rounds, bar_position: barPosition,
  });
}

/** 日が変わった */
export function trackDayAdvance(day: number, faction: string, playTimeSec: number): void {
  send('day_advance', { day, faction, play_time_sec: playTimeSec });
}

/** 日数到達マイルストーン（リテンション計測用） */
export function trackMilestone(day: number, faction: string): void {
  // 5日、10日、15日、20日、25日、30日でファネル計測
  if (day % 5 === 0) {
    send('day_milestone', { day, faction, play_time_sec: getPlayTimeSec() });
  }
}

/** ゲームクリア（エンディング到達） */
export function trackGameClear(faction: string, day: number, result: 'vote_win' | 'unified'): void {
  send('game_clear', { faction, day, result, play_time_sec: getPlayTimeSec() });
}

/** ゲームオーバー */
export function trackGameOver(faction: string, day: number): void {
  send('game_over', { faction, day, play_time_sec: getPlayTimeSec() });
}

/** セーブ */
export function trackSave(day: number): void {
  send('save', { day });
}

/** ロード */
export function trackLoad(day: number): void {
  send('load', { day });
}
