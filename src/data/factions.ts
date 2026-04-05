import type { FactionInfo, FactionId } from '../types';

// 派閥の表示情報（色・方針）
export const FACTION_INFO: FactionInfo[] = [
  {
    id: 'conservative',
    color: '#1B3A6B',
    accentColor: '#2E5FAC',
    description: '伝統と規律を重んじる。校則の厳格化・制服の維持を主張。',
    platform: '保守派 ─ 伝統と秩序',
  },
  {
    id: 'progressive',
    color: '#C45A00',
    accentColor: '#E07820',
    description: '変革と自由を掲げる。制服廃止・SNS活用など新しい学園を提案。',
    platform: '革新派 ─ 変革と自由',
  },
  {
    id: 'sports',
    color: '#A00000',
    accentColor: '#D02020',
    description: '体育系の結束を重視。部活の予算拡充・体育館改修を公約。',
    platform: '体育派 ─ 結束と活力',
  },
];

export const ALL_FACTION_IDS: FactionId[] = ['conservative', 'progressive', 'sports'];

export const FACTION_LABELS: Record<FactionId, string> = {
  conservative: '保守',
  progressive: '革新',
  sports: '体育',
};
