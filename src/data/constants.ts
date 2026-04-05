// 行動ごとの時間コスト（分）
export const TIME_COST = {
  ENTER_ROOM: 5,
  CHANGE_FLOOR: 10,
  GO_OUTSIDE: 15,
  GO_INSIDE: 10,
  TALK: 15,
  PERSUADE: 30,
  NURSE_REST: 60,
  TRAINING: 30,
} as const;

// 一日の最大時間（15:00から19:00 = 240分）
export const MAX_TIME = 240;
