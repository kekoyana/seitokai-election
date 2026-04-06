/**
 * GA4 カスタムイベント送信
 * gtag() が未定義の環境（ローカル開発等）では何もしない
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function send(eventName: string, params?: Record<string, string | number | boolean>): void {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
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
export function trackCharacterSelect(characterName: string, faction: string): void {
  send('character_select', { character_name: characterName, faction });
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
export function trackBattleStart(opponentName: string, isDefending: boolean): void {
  send('battle_start', { opponent_name: opponentName, is_defending: isDefending });
}

/** 説得バトル終了 */
export function trackBattleEnd(result: string, opponentName: string, isDefending: boolean): void {
  send('battle_end', { result, opponent_name: opponentName, is_defending: isDefending });
}

/** 日が変わった */
export function trackDayAdvance(day: number, faction: string): void {
  send('day_advance', { day, faction });
}

/** ゲームクリア（エンディング到達） */
export function trackGameClear(faction: string, day: number, result: 'vote_win' | 'unified'): void {
  send('game_clear', { faction, day, result });
}

/** ゲームオーバー */
export function trackGameOver(faction: string, day: number): void {
  send('game_over', { faction, day });
}

/** セーブ */
export function trackSave(day: number): void {
  send('save', { day });
}

/** ロード */
export function trackLoad(day: number): void {
  send('load', { day });
}
