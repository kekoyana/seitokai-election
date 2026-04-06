import type { Organization } from '../types';
import { label } from '../i18n';
import type { DataCategory } from '../i18n/ja-data';

function proxyLabels(category: DataCategory): Record<string, string> {
  return new Proxy({} as Record<string, string>, {
    get: (_target, key: string) => label(category, key),
  });
}

// 組織の構造データ（テキスト以外）
interface OrgBase {
  id: string;
  type: Organization['type'];
  leaderId: string;
  subLeaderIds: string[];
  memberIds: string[];
}

const ORG_BASE: OrgBase[] = [
  // ===== クラス =====
  { id: 'class1a', type: 'majority', leaderId: 's10151', subLeaderIds: ['s10152'], memberIds: ['s10153'] },
  { id: 'class1b', type: 'dictatorship', leaderId: 's10201', subLeaderIds: ['s10202'], memberIds: ['s10251'] },
  { id: 'class1c', type: 'council', leaderId: 's10351', subLeaderIds: ['s10301'], memberIds: ['s10352'] },
  { id: 'class1d', type: 'majority', leaderId: 's10401', subLeaderIds: ['s10402'], memberIds: ['s10451'] },
  { id: 'class2a', type: 'council', leaderId: 's20151', subLeaderIds: ['s20152'], memberIds: ['s20101'] },
  { id: 'class2b', type: 'dictatorship', leaderId: 's20201', subLeaderIds: ['s20251'], memberIds: ['s20202'] },
  { id: 'class2c', type: 'delegation', leaderId: 's20351', subLeaderIds: ['s20352'], memberIds: ['s20353'] },
  { id: 'class2d', type: 'majority', leaderId: 's20451', subLeaderIds: ['s20401'], memberIds: ['s20452'] },
  { id: 'class3a', type: 'council', leaderId: 's30102', subLeaderIds: ['s30103'], memberIds: ['s30151', 's30101'] },
  { id: 'class3b', type: 'dictatorship', leaderId: 's30201', subLeaderIds: ['s30202'], memberIds: ['s30251'] },
  { id: 'class3c', type: 'dictatorship', leaderId: 's30301', subLeaderIds: ['s30352'], memberIds: ['s30302', 's30351'] },
  { id: 'class3d', type: 'dictatorship', leaderId: 's30401', subLeaderIds: ['s30402'], memberIds: ['s30451', 's30403'] },
  // ===== 部活 =====
  { id: 'club_track', type: 'dictatorship', leaderId: 's30402', subLeaderIds: ['s20401'], memberIds: ['s30302'] },
  { id: 'club_soccer', type: 'dictatorship', leaderId: 's20202', subLeaderIds: ['s10201'], memberIds: ['s10202'] },
  { id: 'club_baseball', type: 'dictatorship', leaderId: 's30404', subLeaderIds: ['s30451'], memberIds: ['s10401', 's10402'] },
  { id: 'club_tennis', type: 'majority', leaderId: 's30251', subLeaderIds: ['s20451'], memberIds: ['s20152'] },
  { id: 'club_brass', type: 'council', leaderId: 's30102', subLeaderIds: ['s10152'], memberIds: ['s30103'] },
  { id: 'club_art', type: 'dictatorship', leaderId: 's30351', subLeaderIds: ['s20352'], memberIds: ['s10352', 's30201'] },
  { id: 'club_student_council', type: 'dictatorship', leaderId: 's30101', subLeaderIds: ['s20201'], memberIds: ['s30151'] },
];

export const ORGANIZATIONS: Organization[] = ORG_BASE.map(b => ({
  ...b,
  get name() { return label('orgName', b.id); },
  get description() { return label('orgDescription', b.id); },
  get leaderTitle() { return label('orgLeaderTitle', b.id) !== b.id ? label('orgLeaderTitle', b.id) : undefined; },
  get subLeaderTitle() { return label('orgSubLeaderTitle', b.id) !== b.id ? label('orgSubLeaderTitle', b.id) : undefined; },
}));

/** 体育会系の部活ID */
export const SPORTS_CLUB_IDS = new Set(['club_track', 'club_soccer', 'club_baseball', 'club_tennis']);
/** 文化系の部活ID */
export const CULTURE_CLUB_IDS = new Set(['club_brass', 'club_art', 'club_student_council']);

export const ORGANIZATION_TYPE_LABELS: Record<string, string> = proxyLabels('orgType');
