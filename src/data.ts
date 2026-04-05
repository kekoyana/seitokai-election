// バレルファイル: 各モジュールからの再エクスポート
export { FACTION_INFO, ALL_FACTION_IDS, FACTION_LABELS } from './data/factions';
export {
  LOCATIONS, LOCATION_FLOOR_MAP, FLOOR_ROOMS, FLOOR_ADJACENCY, FLOOR_LABELS,
  MOVE_COST, getFloorFromLocation, isCorridorLocation, getCorridorForFloor,
  getFloorMoveCost, CLASS_LOCATION_MAP,
} from './data/locations';
export { TIME_COST, MAX_TIME } from './data/constants';
export {
  HAIRSTYLE_LABELS, HOBBY_LABELS, ATTRIBUTE_LABELS, MOOD_LABELS, TIME_LABELS,
  PERSONALITY_LABELS, CLUB_LABELS, dayToDate, formatTime,
  PERSONALITY_ICON_COLORS,
} from './data/labels';
export { renderSupportBar, renderInitialIcon } from './data/render';
export {
  STUDENTS, getTutorialOpponent, getStudentLocation, getCatchphrase,
} from './data/students';
