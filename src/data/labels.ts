import { label } from '../i18n';
import type { DataCategory } from '../i18n/ja-data';
import { jaData } from '../i18n/ja-data';

function proxyLabels(category: DataCategory): Record<string, string> {
  const keys = Object.keys(jaData[category] ?? {});
  return new Proxy({} as Record<string, string>, {
    get: (_target, key: string) => {
      if (key === Symbol.toPrimitive as unknown) return undefined;
      return label(category, key);
    },
    ownKeys: () => keys,
    getOwnPropertyDescriptor: (_target, key) => {
      if (keys.includes(key as string)) {
        return { configurable: true, enumerable: true, writable: true, value: label(category, key as string) };
      }
      return undefined;
    },
    has: (_target, key) => keys.includes(key as string),
  });
}

export const HAIRSTYLE_LABELS: Record<string, string> = proxyLabels('hairstyle');
export const HOBBY_LABELS: Record<string, string> = proxyLabels('hobby');
export const ATTRIBUTE_LABELS: Record<string, string> = proxyLabels('attribute');
export const MOOD_LABELS: Record<string, string> = proxyLabels('mood');
export const TIME_LABELS: Record<string, string> = proxyLabels('time');
export const PERSONALITY_LABELS: Record<string, string> = proxyLabels('personality');
export const CLUB_LABELS: Record<string, string> = proxyLabels('club');

/** Day番号(1〜30)を「9/1」形式の日付文字列に変換（9月1日スタート） */
export function dayToDate(day: number): string {
  const d = new Date(2025, 8, day); // month=8 → 9月
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** currentTime（0〜240）を「15:00」形式の時刻文字列に変換 */
export function formatTime(currentTime: number): string {
  const totalMinutes = 15 * 60 + currentTime; // 15:00基準
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

// 好感度7段階
export type AffinityLevel = 'devoted' | 'trust' | 'friendly' | 'neutral' | 'wary' | 'dislike' | 'hostile';

export interface AffinityInfo {
  level: AffinityLevel;
  label: string;
  color: string;
}

const AFFINITY_LEVELS: { min: number; level: AffinityLevel; color: string }[] = [
  { min:  60, level: 'devoted',  color: '#1B8A3A' },
  { min:  35, level: 'trust',    color: '#27AE60' },
  { min:  15, level: 'friendly', color: '#7EC850' },
  { min: -14, level: 'neutral',  color: '#888888' },
  { min: -34, level: 'wary',     color: '#C8A030' },
  { min: -59, level: 'dislike',  color: '#D07020' },
  { min: -Infinity, level: 'hostile', color: '#C0392B' },
];

export function getAffinityInfo(affinity: number): AffinityInfo {
  for (const entry of AFFINITY_LEVELS) {
    if (affinity >= entry.min) {
      return { level: entry.level, label: label('affinity', entry.level), color: entry.color };
    }
  }
  const last = AFFINITY_LEVELS[AFFINITY_LEVELS.length - 1];
  return { level: last.level, label: label('affinity', last.level), color: last.color };
}

export const AFFINITY_LABELS: Record<string, string> = proxyLabels('affinity');

// 性格ごとのイニシャルアイコン背景色
export const PERSONALITY_ICON_COLORS: Record<string, string> = {
  passionate: '#E74C3C',
  cautious: '#3498DB',
  stubborn: '#7F8C8D',
  flexible: '#2ECC71',
  cunning: '#9B59B6',
};
