import type { FactionInfo, FactionId } from '../types';
import { label } from '../i18n';
import type { DataCategory } from '../i18n/ja-data';

function proxyLabels(category: DataCategory): Record<string, string> {
  return new Proxy({} as Record<string, string>, {
    get: (_target, key: string) => label(category, key),
  });
}

// 派閥の構造データ（色のみ）
const FACTION_BASE: { id: FactionId; color: string; accentColor: string }[] = [
  { id: 'conservative', color: '#1B3A6B', accentColor: '#2E5FAC' },
  { id: 'progressive', color: '#C45A00', accentColor: '#E07820' },
  { id: 'sports', color: '#A00000', accentColor: '#D02020' },
];

// 派閥の表示情報（色・方針）- 翻訳対応
export const FACTION_INFO: FactionInfo[] = FACTION_BASE.map(f => ({
  ...f,
  get description() { return label('factionDescription', f.id); },
  get platform() { return label('factionPlatform', f.id); },
}));

export const ALL_FACTION_IDS: FactionId[] = ['conservative', 'progressive', 'sports'];

export const FACTION_LABELS: Record<FactionId, string> = proxyLabels('faction') as Record<FactionId, string>;
