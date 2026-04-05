import type { Location, LocationId, Floor } from '../types';

export const LOCATIONS: Location[] = [
  { id: 'class1a', name: '教室 1-A' },
  { id: 'class1b', name: '教室 1-B' },
  { id: 'class1c', name: '教室 1-C' },
  { id: 'class1d', name: '教室 1-D' },
  { id: 'class2a', name: '教室 2-A' },
  { id: 'class2b', name: '教室 2-B' },
  { id: 'class2c', name: '教室 2-C' },
  { id: 'class2d', name: '教室 2-D' },
  { id: 'class3a', name: '教室 3-A' },
  { id: 'class3b', name: '教室 3-B' },
  { id: 'class3c', name: '教室 3-C' },
  { id: 'class3d', name: '教室 3-D' },
  { id: 'track_field', name: '陸上競技場' },
  { id: 'soccer_field', name: 'サッカーグラウンド' },
  { id: 'baseball_field', name: '野球グラウンド' },
  { id: 'tennis_court', name: 'テニスコート' },
  { id: 'music_room', name: '吹奏楽室' },
  { id: 'art_room', name: '美術室' },
  { id: 'broadcast_room', name: '放送室' },
  { id: 'courtyard', name: '中庭' },
  { id: 'library', name: '図書室' },
  { id: 'cafeteria', name: '食堂' },
  { id: 'nurses_office', name: '保健室' },
  { id: 'corridor_1f', name: '1階廊下' },
  { id: 'corridor_2f', name: '2階廊下' },
  { id: 'corridor_3f', name: '3階廊下' },
  { id: 'corridor_ground', name: 'グラウンド' },
];

// フロア関連データ
export const LOCATION_FLOOR_MAP: Record<LocationId, Floor> = {
  corridor_1f: '1f',
  class1a: '1f', class1b: '1f', class1c: '1f', class1d: '1f',
  courtyard: '1f', cafeteria: '1f', library: '1f', nurses_office: '1f',
  corridor_2f: '2f',
  class2a: '2f', class2b: '2f', class2c: '2f', class2d: '2f',
  music_room: '2f', art_room: '2f', broadcast_room: '2f',
  corridor_3f: '3f',
  class3a: '3f', class3b: '3f', class3c: '3f', class3d: '3f',
  corridor_ground: 'ground',
  track_field: 'ground', soccer_field: 'ground',
  baseball_field: 'ground', tennis_court: 'ground',
};

export const FLOOR_ROOMS: Record<Floor, LocationId[]> = {
  '1f': ['class1a', 'class1b', 'class1c', 'class1d', 'courtyard', 'cafeteria', 'library', 'nurses_office'],
  '2f': ['class2a', 'class2b', 'class2c', 'class2d', 'music_room', 'art_room', 'broadcast_room'],
  '3f': ['class3a', 'class3b', 'class3c', 'class3d'],
  'ground': ['track_field', 'soccer_field', 'baseball_field', 'tennis_court'],
};

export const FLOOR_ADJACENCY: Record<Floor, Floor[]> = {
  '1f': ['2f', 'ground'],
  '2f': ['1f', '3f'],
  '3f': ['2f'],
  'ground': ['1f'],
};

export const FLOOR_LABELS: Record<Floor, string> = {
  '1f': '1階',
  '2f': '2階',
  '3f': '3階',
  'ground': 'グラウンド',
};

export const MOVE_COST = {
  ENTER_ROOM: 1,
  EXIT_ROOM: 0,
  CHANGE_FLOOR: 2,
  GO_OUTSIDE: 3,
  GO_INSIDE: 2,
} as const;

export function getFloorFromLocation(loc: LocationId): Floor {
  return LOCATION_FLOOR_MAP[loc];
}

export function isCorridorLocation(loc: LocationId): boolean {
  return loc.startsWith('corridor_');
}

export function getCorridorForFloor(floor: Floor): LocationId {
  return `corridor_${floor}` as LocationId;
}

export function getFloorMoveCost(from: Floor, to: Floor): number {
  if (from === '1f' && to === 'ground') return MOVE_COST.GO_OUTSIDE;
  if (from === 'ground' && to === '1f') return MOVE_COST.GO_INSIDE;
  return MOVE_COST.CHANGE_FLOOR;
}

// クラス名からLocationIdを返す
export const CLASS_LOCATION_MAP: Record<string, LocationId> = {
  '1-A': 'class1a',
  '1-B': 'class1b',
  '1-C': 'class1c',
  '1-D': 'class1d',
  '2-A': 'class2a',
  '2-B': 'class2b',
  '2-C': 'class2c',
  '2-D': 'class2d',
  '3-A': 'class3a',
  '3-B': 'class3b',
  '3-C': 'class3c',
  '3-D': 'class3d',
};
