import { FACTION_INFO } from './factions';
import { PERSONALITY_ICON_COLORS } from './labels';
import { t } from '../i18n';

// 思想の100%横積み上げバーグラフ
export function renderSupportBar(
  support: { conservative: number; progressive: number; sports: number },
  height = 14,
  showLabel = true,
): string {
  const total = support.conservative + support.progressive + support.sports;
  if (total === 0) return '';
  const cPct = Math.round(support.conservative / total * 100);
  const pPct = Math.round(support.progressive / total * 100);
  const sPct = 100 - cPct - pPct;
  const cColor = FACTION_INFO[0].color;
  const pColor = FACTION_INFO[1].color;
  const sColor = FACTION_INFO[2].color;
  const fontSize = Math.max(9, Math.round(height * 0.65));
  const seg = (pct: number, color: string, label: string, radius: string) =>
    pct > 0 ? `<div style="
      width:${pct}%; height:${height}px;
      background:${color};
      display:flex; align-items:center; justify-content:center;
      font-size:${fontSize}px; color:#fff; font-weight:bold;
      white-space:nowrap; overflow:hidden;
      ${radius}
    ">${showLabel && pct >= 12 ? `${label}${pct}` : ''}</div>` : '';

  return `<div style="display:flex; width:100%; border-radius:4px; overflow:hidden; box-shadow:inset 0 1px 2px rgba(0,0,0,0.1);">
    ${seg(cPct, cColor, t('render.factionShortConservative'), 'border-radius:4px 0 0 4px;')}
    ${seg(pPct, pColor, t('render.factionShortProgressive'), '')}
    ${seg(sPct, sColor, t('render.factionShortSports'), 'border-radius:0 4px 4px 0;')}
  </div>`;
}

// イニシャルアイコンHTMLを生成するユーティリティ
export function renderInitialIcon(
  name: string,
  personality: string,
  size: number,
  borderColor?: string
): string {
  const initial = name.charAt(0);
  const bg = PERSONALITY_ICON_COLORS[personality] ?? '#888';
  const border = borderColor ? `border:2px solid ${borderColor};` : 'border:2px solid rgba(255,255,255,0.4);';
  return `
    <div style="
      width:${size}px; height:${size}px; border-radius:50%;
      background:${bg}; color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-size:${Math.round(size * 0.4)}px; font-weight:bold;
      flex-shrink:0; ${border}
    ">${initial}</div>
  `;
}
