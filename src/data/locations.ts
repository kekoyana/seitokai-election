import type { Location, LocationId, Floor } from '../types';
import { label } from '../i18n';
import type { DataCategory } from '../i18n/ja-data';

function proxyLabels(category: DataCategory): Record<string, string> {
  return new Proxy({} as Record<string, string>, {
    get: (_target, key: string) => label(category, key),
  });
}

const LOCATION_IDS: LocationId[] = [
  'class1a', 'class1b', 'class1c', 'class1d',
  'class2a', 'class2b', 'class2c', 'class2d',
  'class3a', 'class3b', 'class3c', 'class3d',
  'track_field', 'soccer_field', 'baseball_field', 'tennis_court',
  'music_room', 'art_room', 'broadcast_room',
  'courtyard', 'library', 'cafeteria', 'nurses_office', 'rooftop', 'student_council',
  'corridor_1f', 'corridor_2f', 'corridor_3f', 'corridor_ground',
];

export const LOCATIONS: Location[] = LOCATION_IDS.map(id => ({
  id,
  get name() { return label('location', id); },
}));

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
  rooftop: '3f', student_council: '3f',
  corridor_ground: 'ground',
  track_field: 'ground', soccer_field: 'ground',
  baseball_field: 'ground', tennis_court: 'ground',
};

export const FLOOR_ROOMS: Record<Floor, LocationId[]> = {
  '1f': ['class1a', 'class1b', 'class1c', 'class1d', 'courtyard', 'cafeteria', 'library', 'nurses_office'],
  '2f': ['class2a', 'class2b', 'class2c', 'class2d', 'music_room', 'art_room', 'broadcast_room'],
  '3f': ['class3a', 'class3b', 'class3c', 'class3d', 'student_council'],
  'ground': ['track_field', 'soccer_field', 'baseball_field', 'tennis_court'],
};

export const FLOOR_ADJACENCY: Record<Floor, Floor[]> = {
  '1f': ['2f', 'ground'],
  '2f': ['1f', '3f'],
  '3f': ['2f'],
  'ground': ['1f'],
};

export const FLOOR_LABELS: Record<Floor, string> = proxyLabels('floor') as Record<Floor, string>;

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
