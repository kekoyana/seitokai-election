import type { GameState, Student, LocationId, ActionType, CandidateId, Floor } from '../types';
import {
  LOCATIONS, CANDIDATES, FACTION_LABELS, getStudentLocation, getCandidateLocation,
  HOBBY_LABELS, ATTRIBUTE_LABELS, TIME_LABELS, getCatchphrase, renderInitialIcon,
  isCorridorLocation, getFloorFromLocation, FLOOR_ROOMS, FLOOR_ADJACENCY,
  FLOOR_LABELS, MOVE_COST, getFloorMoveCost, renderSupportBar,
} from '../data';
import { ORGANIZATIONS, ORGANIZATION_TYPE_LABELS } from '../data/organizations';
import { getOrganizationVote } from '../logic/organizationLogic';
import { bgm } from '../bgm';

/** Day番号(1〜30)を「9/1」形式の日付文字列に変換（9月1日スタート） */
function dayToDate(day: number): string {
  const d = new Date(2025, 8, day); // month=8 → 9月
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const CLUB_LABELS: Record<string, string> = {
  soccer: 'サッカー部', track: '陸上部', tennis: 'テニス部',
  art: '美術部', baseball: '野球部', brass: '吹奏楽部',
};

/** 生徒のクラス・部活での肩書きを取得 */
/** 生徒の所属・役職情報を構造化して返す */
function getStudentRoleInfo(studentId: string, clubId: string | null): {
  hasClassRole: boolean;
  hasClubRole: boolean;
  clubName: string;
  badgesHtml: string;
} {
  const badges: { label: string; isLeader: boolean }[] = [];
  let hasClassRole = false;
  let hasClubRole = false;
  // クラス役職
  for (const org of ORGANIZATIONS) {
    if (!org.id.startsWith('class')) continue;
    if (org.leaderId === studentId) {
      badges.push({ label: `${org.name.replace('組', '')} 代表`, isLeader: true });
      hasClassRole = true;
    } else if (org.subLeaderIds.includes(studentId)) {
      badges.push({ label: `${org.name.replace('組', '')} 副代表`, isLeader: false });
      hasClassRole = true;
    }
  }
  // 部活役職
  const clubName = clubId ? (CLUB_LABELS[clubId] ?? clubId) : '';
  if (clubId) {
    const orgId = `club_${clubId}`;
    const org = ORGANIZATIONS.find(o => o.id === orgId);
    if (org) {
      if (org.leaderId === studentId) {
        badges.push({ label: `${clubName} 代表`, isLeader: true });
        hasClubRole = true;
      } else if (org.subLeaderIds.includes(studentId)) {
        badges.push({ label: `${clubName} 副代表`, isLeader: false });
        hasClubRole = true;
      }
    }
  }
  const badgesHtml = badges.map(b => {
    const color = b.isLeader ? '#C0392B' : '#E07820';
    return `<span style="
      font-size:0.62em; padding:1px 5px; border-radius:4px;
      background:${color}18; color:${color};
      border:1px solid ${color}30;
      white-space:nowrap;
    ">${b.label}</span>`;
  }).join(' ');
  return { hasClassRole, hasClubRole, clubName, badgesHtml };
}

/** 生徒のクラス名・所属・役職をまとめた1行HTMLを返す */
function renderStudentAffiliation(studentId: string, className: string, clubId: string | null): string {
  const info = getStudentRoleInfo(studentId, clubId);
  const parts: string[] = [];
  // クラス名: 役職バッジがなければプレーンテキストで表示
  if (!info.hasClassRole) parts.push(className);
  // 部活名: 役職バッジがなければプレーンテキストで表示
  if (!info.hasClubRole && info.clubName) parts.push(info.clubName);
  // バッジ
  if (info.badgesHtml) parts.push(info.badgesHtml);
  return parts.join(' ');
}

export interface DailyCallbacks {
  onEnterRoom: (locationId: LocationId) => void;
  onExitRoom: () => void;
  onChangeFloor: (targetFloor: Floor) => void;
  onTalk: (student: Student) => void;
  onPersuade: (student: Student) => void;
  onNextDay: () => void;
}

export class DailyScreen {
  private container: HTMLDivElement;
  private state: GameState;
  private callbacks: DailyCallbacks;
  private showStudentInfo: Student | null = null;
  private showPlayerInfo: boolean = false;
  // 情報パネル: タブ + ドリルダウン（組織詳細 or 生徒一覧→生徒詳細）
  private infoPanel: {
    tab: 'class' | 'club';
    orgId?: string;       // 選択中の組織ID
    studentId?: string;   // 選択中の生徒ID（組織内の生徒詳細）
  } | null = null;

  constructor(state: GameState, callbacks: DailyCallbacks) {
    this.state = state;
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  update(state: GameState): void {
    this.state = state;
    this.render();
  }

  private getStudentsAtLocation(): Student[] {
    const playerId = this.state.playerCharacter?.id;
    return this.state.students.filter(s =>
      s.id !== playerId &&
      s.candidateId === null &&
      getStudentLocation(s.id, this.state.timeSlot, this.state.day) === this.state.currentLocation
    );
  }

  private getCandidatesAtLocation(): typeof CANDIDATES {
    return CANDIDATES.filter(c =>
      getCandidateLocation(c.id, this.state.timeSlot, this.state.day) === this.state.currentLocation
    );
  }

  private getCandidateColor(): string {
    const c = CANDIDATES.find(c => c.id === this.state.candidate);
    return c ? c.color : '#1B3A6B';
  }

  private render(): void {
    const candidate = CANDIDATES.find(c => c.id === this.state.candidate);
    const candidateColor = this.getCandidateColor();
    const studentsHere = this.getStudentsAtLocation();
    const currentLocation = LOCATIONS.find(l => l.id === this.state.currentLocation);
    const isOutOfStamina = this.state.stamina <= 0;

    this.container.style.cssText = `
      position: fixed; inset: 0;
      background: linear-gradient(160deg, #E8F4FD 0%, #FFF9E6 100%);
      display: flex; flex-direction: column;
      font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
      overflow: hidden;
    `;

    const pc = this.state.playerCharacter;

    // 支持者数
    const playerCandidateId = this.state.candidate;
    const supporterCount = this.state.students.filter(s => {
      const maxKey = (['conservative', 'progressive', 'sports'] as const)
        .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
      return maxKey === playerCandidateId;
    }).length;

    // フローティングHUD（左上: プレイヤー、右上: ステータス）
    const hudHtml = `
      <div style="
        position:absolute; top:0; left:0; right:0;
        display:flex; justify-content:space-between; align-items:flex-start;
        padding:10px 12px; pointer-events:none; z-index:10;
      ">
        <div id="player-icon" style="
          pointer-events:auto; cursor:pointer;
          display:flex; align-items:center; gap:8px;
          background:${candidateColor}DD; color:#fff;
          border-radius:20px; padding:4px 12px 4px 4px;
          box-shadow:0 2px 8px rgba(0,0,0,0.2);
          font-size:0.78em;
        ">
          ${pc ? (pc.portrait
            ? `<img src="${pc.portrait}" alt="${pc.name}" style="
                width:28px; height:28px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:2px solid rgba(255,255,255,0.5);
              "/>`
            : renderInitialIcon(pc.name, pc.personality, 28, 'rgba(255,255,255,0.5)')
          ) : ''}
          <span style="font-weight:bold;">${pc?.name ?? ''}</span>
          <span style="opacity:0.8; font-size:0.9em;">${FACTION_LABELS[this.state.candidate ?? ''] ?? ''}派</span>
        </div>
        <div style="
          pointer-events:auto;
          display:flex; gap:6px; align-items:center;
          background:rgba(0,0,0,0.55); color:#fff;
          border-radius:16px; padding:5px 10px;
          box-shadow:0 2px 8px rgba(0,0,0,0.2);
          font-size:0.78em; backdrop-filter:blur(4px);
        ">
          <span><strong>${dayToDate(this.state.day)}</strong></span>
          <span style="opacity:0.4;">|</span>
          <span>⚡<strong>${this.state.stamina}</strong></span>
          <span style="opacity:0.4;">|</span>
          <button id="bgm-toggle" style="
            background:none; border:none; padding:0;
            color:#fff; font-size:1em; cursor:pointer;
            line-height:1;
          ">${bgm.enabled ? '🔊' : '🔇'}</button>
        </div>
      </div>
    `;

    // 下部ステータスバー
    const bottomBar = `
      <div style="
        background:rgba(255,255,255,0.8); backdrop-filter:blur(4px);
        border-top:1px solid #e0e8f5;
        padding:6px 16px;
        display:flex; gap:16px; font-size:0.75em; color:#555;
        flex-shrink:0;
      ">
        <span>支持者: <strong style="color:${candidateColor}">${supporterCount}</strong>名</span>
        <span>場所: <strong>${FLOOR_LABELS[getFloorFromLocation(this.state.currentLocation)]} ${isCorridorLocation(this.state.currentLocation) ? '廊下' : currentLocation?.name ?? ''}</strong></span>
      </div>
    `;

    // メインコンテンツ
    let mainHtml = '';
    const inCorridor = isCorridorLocation(this.state.currentLocation);

    if (this.showPlayerInfo && pc) {
      mainHtml = this.renderPlayerInfo(pc);
    } else if (this.showStudentInfo) {
      mainHtml = this.renderStudentInfo(this.showStudentInfo);
    } else if (this.infoPanel) {
      mainHtml = this.renderInfoPanel();
    } else if (inCorridor) {
      mainHtml = this.renderCorridorView();
    } else {
      mainHtml = this.renderMainPanel(studentsHere, isOutOfStamina);
    }

    this.container.innerHTML = `
      ${hudHtml}
      <div style="flex:1; overflow-y:auto; padding:48px 16px 12px;">
        ${mainHtml}
      </div>
      ${bottomBar}
    `;

    this.attachEvents();
  }

  private renderCandidateCard(c: typeof CANDIDATES[number]): string {
    const isPlayerCandidate = c.id === this.state.candidate;
    // state.studentsから候補者の生徒データを取得（会話・好感度の状態を持つ）
    const studentData = this.state.students.find(s => s.candidateId === c.id);
    const talkCost = 5;
    const canTalk = this.state.stamina >= talkCost;
    const affinityColor = studentData && studentData.affinity >= 20 ? '#27AE60'
      : studentData && studentData.affinity <= -20 ? '#C0392B' : '#888';
    const affinityLabel = studentData && studentData.affinity >= 20 ? '好意的'
      : studentData && studentData.affinity <= -20 ? '不快' : '普通';

    return `
      <div style="
        display:flex; align-items:center; gap:10px;
        padding:8px; border-radius:10px;
        background:${c.color}08;
        margin-bottom:6px;
        border:1px solid ${c.color}30;
      ">
        ${c.portrait
          ? `<img src="${c.portrait}" alt="${c.name}" style="
              width:48px; height:48px; border-radius:50%;
              object-fit:cover; object-position:top;
              border:2px solid ${c.color};
              flex-shrink:0;
            "/>`
          : renderInitialIcon(c.name, c.personality, 48, c.color)
        }
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:0.9em; font-weight:bold; color:#333;">${c.name}</span>
            <span style="
              font-size:0.65em; padding:1px 6px; border-radius:6px;
              background:${c.color}20; color:${c.color};
              border:1px solid ${c.color}40;
            ">${FACTION_LABELS[c.id] ?? ''}派候補</span>
            ${isPlayerCandidate ? `<span style="
              font-size:0.65em; padding:1px 6px; border-radius:6px;
              background:#27AE6020; color:#27AE60;
            ">支持中</span>` : ''}
          </div>
          <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; font-size:0.75em; color:#888;">
            ${studentData ? renderStudentAffiliation(studentData.id, c.className, studentData.clubId) : c.className}
          </div>
          <div style="font-size:0.72em; color:#888;">${c.platform}</div>
          ${studentData ? `<div style="font-size:0.72em; color:${affinityColor};">好感度: ${affinityLabel}</div>` : ''}
        </div>
        ${studentData ? `
          <div style="display:flex; flex-direction:column; gap:4px; flex-shrink:0;">
            <button data-action-talk="${studentData.id}" style="
              padding:5px 10px;
              background:${canTalk ? '#4A90D9' : '#ccc'};
              color:#fff; border:none; border-radius:8px;
              font-size:0.78em; cursor:${canTalk ? 'pointer' : 'not-allowed'};
              font-family:inherit;
            ">会話(⚡${talkCost})</button>
            <button data-action-info="${studentData.id}" style="
              padding:5px 10px;
              background:#8E9BAD;
              color:#fff; border:none; border-radius:8px;
              font-size:0.78em; cursor:pointer;
              font-family:inherit;
            ">情報</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderMainPanel(studentsHere: Student[], isOutOfStamina: boolean): string {
    const candidatesHere = this.getCandidatesAtLocation();
    const candidatesHtml = candidatesHere.map(c => this.renderCandidateCard(c)).join('');

    const studentsHtml = (studentsHere.length === 0 && candidatesHere.length === 0)
      ? `<div style="text-align:center; color:#aaa; padding:20px; font-size:0.9em;">ここには誰もいない</div>`
      : studentsHere.map(s => this.renderStudentCard(s)).join('');

    const endDayHtml = isOutOfStamina ? `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:12px; padding:16px;
        margin-top:12px; text-align:center;
        border:2px solid #F0A030;
      ">
        <p style="color:#888; font-size:0.85em; margin-bottom:12px;">体力が尽きました</p>
        <button id="next-day-btn" style="
          padding:12px 32px;
          background:linear-gradient(135deg,#F0A030,#D08010);
          color:#fff; border:none; border-radius:50px;
          font-size:1em; font-weight:bold; cursor:pointer; font-family:inherit;
        ">翌日へ →</button>
      </div>
    ` : '';

    return `
      <div style="
        background:rgba(255,255,255,0.85);
        border-radius:14px; padding:12px 14px; margin-bottom:12px;
        border:1px solid #e0eaf5;
      ">
        <h3 style="font-size:0.9em; color:#555; margin-bottom:10px;">この場所にいる生徒</h3>
        ${candidatesHtml}
        ${studentsHtml}
      </div>

      <div style="
        background:rgba(255,255,255,0.85);
        border-radius:14px; padding:12px 14px; margin-bottom:12px;
        border:1px solid #e0eaf5;
      ">
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
          <button id="exit-room-btn" style="
            padding:10px 12px;
            background:#4A90D9;
            color:#fff; border:none; border-radius:10px;
            font-size:0.85em; cursor:pointer;
            text-align:left; font-family:inherit;
          ">
            <div style="font-weight:bold;">← 廊下へ</div>
            <div style="font-size:0.75em; opacity:0.85;">フロア移動</div>
          </button>
          <button id="info-btn" style="
            padding:10px 12px;
            background:#8E6BAD;
            color:#fff; border:none; border-radius:10px;
            font-size:0.85em; cursor:pointer;
            text-align:left; font-family:inherit;
          ">
            <div style="font-weight:bold;">情報</div>
            <div style="font-size:0.75em; opacity:0.85;">クラス・部活</div>
          </button>
          <button id="next-day-btn-always" style="
            padding:10px 12px;
            background:linear-gradient(135deg,#F0A030,#D08010);
            color:#fff; border:none; border-radius:10px;
            font-size:0.85em; cursor:pointer;
            text-align:left; font-family:inherit;
          ">
            <div style="font-weight:bold;">翌日へ</div>
            <div style="font-size:0.75em; opacity:0.85;">${dayToDate(this.state.day)}</div>
          </button>
        </div>
      </div>

      ${endDayHtml}
    `;
  }

  private renderActionButton(
    type: ActionType, label: string, desc: string,
    cost: string, color: string, disabled: boolean
  ): string {
    const canUse = !disabled;
    return `
      <button data-action="${type}" style="
        padding:10px 12px;
        background:${canUse ? color : '#ccc'};
        color:#fff; border:none; border-radius:10px;
        font-size:0.85em; cursor:${canUse ? 'pointer' : 'not-allowed'};
        text-align:left; font-family:inherit;
        opacity:${canUse ? '1' : '0.5'};
      ">
        <div style="font-weight:bold;">${label}</div>
        <div style="font-size:0.75em; opacity:0.85;">${desc}</div>
        <div style="font-size:0.7em; opacity:0.7;">⚡${cost}</div>
      </button>
    `;
  }

  private renderStudentCard(s: Student): string {
    const talkCost = 5;
    const canTalk = this.state.stamina >= talkCost;
    const canPersuade = s.talkCount > 0;

    const affinityColor = s.affinity >= 20 ? '#27AE60' : s.affinity <= -20 ? '#C0392B' : '#888';
    const affinityLabel = s.affinity >= 20 ? '好意的' : s.affinity <= -20 ? '不快' : '普通';

    return `
      <div style="
        display:flex; align-items:center; gap:10px;
        padding:8px; border-radius:10px;
        background:rgba(255,255,255,0.6);
        margin-bottom:6px;
        border:1px solid #e8f0f8;
      ">
        ${s.portrait
          ? `<img src="${s.portrait}" alt="${s.name}" style="
              width:48px; height:48px; border-radius:50%;
              object-fit:cover; object-position:top;
              border:2px solid #d0e0f0;
              flex-shrink:0;
            "/>`
          : renderInitialIcon(s.name, s.personality, 48, '#d0e0f0')
        }
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
            <span style="font-size:0.9em; font-weight:bold; color:#333;">${s.name}</span>
          </div>
          <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; margin-top:1px; font-size:0.75em; color:#888;">
            ${renderStudentAffiliation(s.id, s.className, s.clubId)}
          </div>
          <div style="font-size:0.72em; color:${affinityColor};">好感度: ${affinityLabel}</div>
          ${(() => {
            const maxKey = (['conservative', 'progressive', 'sports'] as const)
              .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
            const sc = CANDIDATES.find(c => c.id === maxKey);
            const isAlly = maxKey === this.state.candidate;
            return `<span style="
              font-size:0.7em; background:${isAlly ? '#27AE60' : sc?.color ?? '#888'}; color:#fff;
              border-radius:8px; padding:1px 6px;
            ">${FACTION_LABELS[maxKey] ?? ''}派</span>`;
          })()}
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; flex-shrink:0;">
          <button data-action-talk="${s.id}" style="
            padding:5px 10px;
            background:${canTalk ? '#4A90D9' : '#ccc'};
            color:#fff; border:none; border-radius:8px;
            font-size:0.78em; cursor:${canTalk ? 'pointer' : 'not-allowed'};
            font-family:inherit;
          ">会話(⚡${talkCost})</button>
          <button data-action-persuade="${s.id}" style="
            padding:5px 10px;
            background:${canPersuade ? '#E07820' : '#ccc'};
            color:#fff; border:none; border-radius:8px;
            font-size:0.78em; cursor:${canPersuade ? 'pointer' : 'not-allowed'};
            font-family:inherit;
          ">説得</button>
          <button data-action-info="${s.id}" style="
            padding:5px 10px;
            background:#8E9BAD;
            color:#fff; border:none; border-radius:8px;
            font-size:0.78em; cursor:pointer;
            font-family:inherit;
          ">情報</button>
        </div>
      </div>
    `;
  }

  private renderInfoPanel(): string {
    if (!this.infoPanel) return '';
    const { tab, orgId, studentId } = this.infoPanel;

    // 生徒詳細（組織内からのドリルダウン）
    if (orgId && studentId) {
      const student = this.state.students.find(s => s.id === studentId);
      if (student) return this.renderInfoStudentDetail(student, orgId);
    }

    // 組織詳細 or 生徒一覧
    if (orgId) {
      const org = ORGANIZATIONS.find(o => o.id === orgId);
      if (org) return this.renderInfoOrgDetail(org);
    }

    // 組織一覧（タブ）
    return this.renderInfoOrgList(tab);
  }

  private renderInfoHeader(title: string, backAction?: string): string {
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          ${backAction ? `<button data-info-action="${backAction}" style="
            background:none; border:none; color:#4A90D9;
            font-size:1em; cursor:pointer; padding:0 4px; font-family:inherit;
          ">←</button>` : ''}
          <h3 style="font-size:0.95em; color:#333; margin:0;">${title}</h3>
        </div>
        <button data-info-action="close" style="
          background:#ddd; border:none; border-radius:50%;
          width:28px; height:28px; cursor:pointer; font-size:1em;
        ">×</button>
      </div>
    `;
  }

  private renderInfoTabs(activeTab: 'class' | 'club'): string {
    const tabStyle = (active: boolean) => `
      padding:8px 16px; border:none; border-radius:8px 8px 0 0;
      font-size:0.85em; font-weight:bold; cursor:pointer;
      font-family:inherit;
      background:${active ? '#fff' : '#e0e4e8'};
      color:${active ? '#333' : '#888'};
      border-bottom:${active ? '2px solid #4A90D9' : '2px solid transparent'};
    `;
    return `
      <div style="display:flex; gap:2px; margin-bottom:12px;">
        <button data-info-tab="class" style="${tabStyle(activeTab === 'class')}">クラス</button>
        <button data-info-tab="club" style="${tabStyle(activeTab === 'club')}">部活</button>
      </div>
    `;
  }

  private renderInfoOrgList(tab: 'class' | 'club'): string {
    const candidateColor = this.getCandidateColor();
    const orgs = tab === 'class'
      ? ORGANIZATIONS.filter(o => o.id.startsWith('class'))
      : ORGANIZATIONS.filter(o => o.id.startsWith('club_'));

    const allyCount = orgs.filter(org =>
      getOrganizationVote(org, this.state.students) === this.state.candidate
    ).length;

    const orgRows = orgs.map(org => {
      const vote = getOrganizationVote(org, this.state.students);
      const voteCandidate = CANDIDATES.find(c => c.id === vote);
      const isAlly = vote === this.state.candidate;
      const leader = this.state.students.find(s => s.id === org.leaderId);
      const typeLabel = ORGANIZATION_TYPE_LABELS[org.type] ?? org.type;

      return `
        <button data-info-org="${org.id}" style="
          display:flex; align-items:center; gap:8px; width:100%;
          padding:8px; border-radius:8px;
          background:${isAlly ? 'rgba(39,174,96,0.06)' : 'rgba(255,255,255,0.5)'};
          border:1px solid ${isAlly ? 'rgba(39,174,96,0.2)' : '#e8f0f8'};
          margin-bottom:4px; cursor:pointer;
          text-align:left; font-family:inherit;
        ">
          ${leader ? (leader.portrait
            ? `<img src="${leader.portrait}" alt="${leader.name}" style="
                width:36px; height:36px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:2px solid ${voteCandidate?.color ?? '#ddd'};
                flex-shrink:0;
              "/>`
            : renderInitialIcon(leader.name, leader.personality, 36, voteCandidate?.color ?? '#ddd')
          ) : ''}
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:0.88em; font-weight:bold; color:#333;">${org.name}</span>
              <span style="font-size:0.65em; background:#f0f0f5; color:#888; border-radius:4px; padding:1px 5px;">${typeLabel}</span>
            </div>
            <div style="font-size:0.72em; color:#888;">代表: ${leader?.name ?? '不明'}</div>
            <div style="font-size:0.68em; color:#999; margin-top:2px; line-height:1.4;">${org.description}</div>
          </div>
          <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
            <span style="
              font-size:0.75em; padding:2px 8px; border-radius:8px;
              background:${(voteCandidate?.color ?? '#888')}15;
              color:${voteCandidate?.color ?? '#888'};
              border:1px solid ${(voteCandidate?.color ?? '#888')}33;
              font-weight:${isAlly ? 'bold' : 'normal'};
            ">${FACTION_LABELS[vote] ?? ''}派${isAlly ? ' ✓' : ''}</span>
            <span style="color:#bbb; font-size:0.8em;">›</span>
          </div>
        </button>
      `;
    }).join('');

    return `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:14px; padding:14px;
        border:1px solid #e0eaf5;
      ">
        ${this.renderInfoHeader('情報')}
        ${this.renderInfoTabs(tab)}

        <div style="
          background:${candidateColor}10; border:1px solid ${candidateColor}30;
          border-radius:8px; padding:6px 12px; margin-bottom:12px;
          font-size:0.8em; color:#555; text-align:center;
        ">
          味方: <strong style="color:${candidateColor};">${allyCount}</strong> / ${orgs.length}${tab === 'class' ? '組' : '部'}
        </div>

        ${orgRows}
      </div>
    `;
  }

  private renderInfoOrgDetail(org: typeof ORGANIZATIONS[number]): string {
    const vote = getOrganizationVote(org, this.state.students);
    const voteCandidate = CANDIDATES.find(c => c.id === vote);
    const isAlly = vote === this.state.candidate;
    const typeLabel = ORGANIZATION_TYPE_LABELS[org.type] ?? org.type;
    const candidateColor = this.getCandidateColor();

    // 組織の全メンバーID
    const allMemberIds = [org.leaderId, ...org.subLeaderIds, ...org.memberIds];
    const members = allMemberIds.map(id => {
      const s = this.state.students.find(st => st.id === id);
      return s ? { student: s, role: id === org.leaderId ? '代表' : org.subLeaderIds.includes(id) ? '副代表' : 'メンバー' } : null;
    }).filter((m): m is { student: Student; role: string } => m !== null);

    // 組織タイプの説明
    const typeDesc: Record<string, string> = {
      dictatorship: '代表の意向が強く反映される',
      council: '代表と副代表が合議で決める',
      delegation: '副代表に権限が委ねられている',
      majority: 'メンバー全員の多数決で決まる',
    };

    const memberRows = members.map(({ student: s, role }) => {
      const sup = s.support;
      const maxKey = (['conservative', 'progressive', 'sports'] as const)
        .reduce((a, b) => sup[a] >= sup[b] ? a : b);
      const sc = CANDIDATES.find(c => c.id === maxKey);
      const roleColor = role === '代表' ? '#E74C3C' : role === '副代表' ? '#E07820' : '#888';

      return `
        <button data-info-student="${s.id}" style="
          display:flex; align-items:center; gap:8px; width:100%;
          padding:6px 8px; border-radius:8px;
          background:rgba(255,255,255,0.5);
          border:1px solid #e8f0f8;
          margin-bottom:3px; cursor:pointer;
          text-align:left; font-family:inherit;
        ">
          ${s.portrait
            ? `<img src="${s.portrait}" alt="${s.name}" style="
                width:32px; height:32px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:2px solid ${sc?.color ?? '#ddd'}; flex-shrink:0;
              "/>`
            : renderInitialIcon(s.name, s.personality, 32, sc?.color ?? '#ddd')
          }
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:4px;">
              <span style="font-size:0.85em; font-weight:bold; color:#333;">${s.name}</span>
              <span style="font-size:0.6em; color:${roleColor}; font-weight:bold;">${role}</span>
            </div>
            <div style="font-size:0.68em; color:#888;">${s.className}</div>
          </div>
          <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
            <span style="
              font-size:0.7em; padding:1px 6px; border-radius:6px;
              background:${(sc?.color ?? '#888')}15; color:${sc?.color ?? '#888'};
              border:1px solid ${(sc?.color ?? '#888')}30;
            ">${FACTION_LABELS[maxKey] ?? ''}</span>
            <span style="color:#bbb; font-size:0.8em;">›</span>
          </div>
        </button>
      `;
    }).join('');

    const backTab = org.id.startsWith('club_') ? 'club' : 'class';

    return `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:14px; padding:14px;
        border:1px solid #e0eaf5;
      ">
        ${this.renderInfoHeader(org.name, 'back-to-list')}

        <!-- 組織情報 -->
        <div style="
          background:rgba(240,245,255,0.8); border-radius:8px;
          padding:10px; margin-bottom:12px;
        ">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="font-size:0.75em; background:#f0f0f5; color:#888; border-radius:4px; padding:2px 6px;">${typeLabel}</span>
            <span style="
              font-size:0.78em; padding:2px 8px; border-radius:8px;
              background:${(voteCandidate?.color ?? '#888')}15;
              color:${voteCandidate?.color ?? '#888'};
              border:1px solid ${(voteCandidate?.color ?? '#888')}33;
              font-weight:bold;
            ">${FACTION_LABELS[vote] ?? ''}派${isAlly ? ' ✓' : ''}</span>
          </div>
          <div style="font-size:0.72em; color:#888;">${typeDesc[org.type] ?? ''}</div>
          <div style="font-size:0.72em; color:#666; margin-top:4px; line-height:1.5;">${org.description}</div>
        </div>

        <!-- メンバー一覧 -->
        <div style="font-size:0.78em; color:#888; margin-bottom:6px; font-weight:bold;">
          メンバー（${members.length}名）
        </div>
        ${memberRows}
      </div>
    `;
  }

  private renderInfoStudentDetail(s: Student, fromOrgId: string): string {
    return this.renderStudentDetailCard(s, 'back-to-org');
  }

  private countStudentsAtLocation(locId: LocationId): number {
    const playerId = this.state.playerCharacter?.id;
    // 一般生徒（候補者除く）
    const studentCount = this.state.students.filter(s =>
      s.id !== playerId &&
      s.candidateId === null &&
      getStudentLocation(s.id, this.state.timeSlot, this.state.day) === locId
    ).length;
    // 候補者は専用の位置関数で判定
    const candidateCount = CANDIDATES.filter(c =>
      getCandidateLocation(c.id, this.state.timeSlot, this.state.day) === locId
    ).length;
    return studentCount + candidateCount;
  }

  // 建物風の部屋ボタン
  private renderRoomBtn(roomId: LocationId, canEnter: boolean, style: { bg: string; border: string; w?: string; h?: string }): string {
    const loc = LOCATIONS.find(l => l.id === roomId);
    const count = this.countStudentsAtLocation(roomId);
    const hasStudents = count > 0;
    const shortName = (loc?.name ?? roomId).replace('教室 ', '');
    return `
      <button data-enter-room="${roomId}" style="
        ${style.w ? `width:${style.w};` : ''}
        ${style.h ? `height:${style.h};` : ''}
        padding:4px 2px;
        background:${hasStudents ? style.bg : '#f0f2f4'};
        border:2px solid ${hasStudents ? style.border : '#b8c0c8'};
        cursor:${canEnter ? 'pointer' : 'not-allowed'};
        text-align:center; font-family:inherit;
        opacity:${canEnter ? '1' : '0.6'};
        position:relative; box-sizing:border-box;
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        box-shadow:${hasStudents ? `inset 0 0 12px ${style.border}40, 0 1px 3px rgba(0,0,0,0.1)` : '0 1px 2px rgba(0,0,0,0.05)'};
      ">
        <div style="font-weight:bold; font-size:0.72em; color:#333; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;">${shortName}</div>
        ${hasStudents
          ? `<div style="
              position:absolute; top:-7px; right:-7px;
              background:#E74C3C; color:#fff;
              border-radius:50%; width:18px; height:18px;
              font-size:0.6em; font-weight:bold;
              display:flex; align-items:center; justify-content:center;
              border:2px solid #fff; box-shadow:0 1px 3px rgba(0,0,0,0.3);
            ">${count}</div>`
          : ''
        }
      </button>
    `;
  }

  // 階段ボタン（マップ内に配置）
  private renderStairsBtn(targetFloor: Floor, currentFloor: Floor, direction: 'up' | 'down'): string {
    const cost = getFloorMoveCost(currentFloor, targetFloor);
    const canAfford = this.state.stamina >= cost;
    const pattern = direction === 'up'
      ? 'repeating-linear-gradient(0deg, #707878 0px, #707878 3px, #889090 3px, #889090 6px)'
      : 'repeating-linear-gradient(180deg, #707878 0px, #707878 3px, #889090 3px, #889090 6px)';
    return `
      <button data-change-floor="${targetFloor}" style="
        padding:4px 8px;
        background:${canAfford ? pattern : '#bbb'};
        color:#fff; border:2px solid #606868; border-radius:3px;
        font-size:0.65em; font-weight:bold;
        cursor:${canAfford ? 'pointer' : 'not-allowed'};
        font-family:inherit; text-align:center;
        text-shadow:0 1px 2px rgba(0,0,0,0.5);
        box-shadow:inset 0 0 4px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.2);
      ">
        ${direction === 'up' ? '▲' : '▼'}${FLOOR_LABELS[targetFloor]}<br>⚡${cost}
      </button>
    `;
  }

  // 校舎への入口ボタン（グラウンドから）
  private renderBuildingEntrance(currentFloor: Floor): string {
    const cost = getFloorMoveCost(currentFloor, '1f');
    const canAfford = this.state.stamina >= cost;
    return `
      <button data-change-floor="1f" style="
        padding:6px 0; width:100%;
        background:${canAfford ? 'linear-gradient(180deg, #8090a0 0%, #6a7a8a 100%)' : '#bbb'};
        color:#fff; border:3px solid #506070; border-radius:4px;
        font-size:0.72em; font-weight:bold;
        cursor:${canAfford ? 'pointer' : 'not-allowed'};
        font-family:inherit; text-align:center;
        text-shadow:0 1px 2px rgba(0,0,0,0.4);
        box-shadow:0 2px 6px rgba(0,0,0,0.2);
      ">
        <div>🏫 校舎</div>
        <div style="font-size:0.85em; opacity:0.9;">⚡${cost}</div>
      </button>
    `;
  }

  // グラウンドへの出口ボタン（1Fから）
  private renderGroundExit(currentFloor: Floor): string {
    const cost = getFloorMoveCost(currentFloor, 'ground');
    const canAfford = this.state.stamina >= cost;
    return `
      <button data-change-floor="ground" style="
        padding:4px 8px;
        background:${canAfford ? 'linear-gradient(180deg, #6a9050 0%, #4a7030 100%)' : '#bbb'};
        color:#fff; border:2px solid #3a5828; border-radius:4px;
        font-size:0.65em; font-weight:bold;
        cursor:${canAfford ? 'pointer' : 'not-allowed'};
        font-family:inherit; text-align:center;
        text-shadow:0 1px 2px rgba(0,0,0,0.4);
      ">
        🌳外へ ⚡${cost}
      </button>
    `;
  }

  private renderCorridorView(): string {
    const currentFloor = getFloorFromLocation(this.state.currentLocation);
    const isOutOfStamina = this.state.stamina <= 0;
    const canEnter = this.state.stamina >= MOVE_COST.ENTER_ROOM;

    const endDayHtml = isOutOfStamina ? `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:12px; padding:16px;
        margin-top:12px; text-align:center;
        border:2px solid #F0A030;
      ">
        <p style="color:#888; font-size:0.85em; margin-bottom:12px;">体力が尽きました</p>
        <button id="next-day-btn" style="
          padding:12px 32px;
          background:linear-gradient(135deg,#F0A030,#D08010);
          color:#fff; border:none; border-radius:50px;
          font-size:1em; font-weight:bold; cursor:pointer; font-family:inherit;
        ">翌日へ →</button>
      </div>
    ` : '';

    return `
      <div style="
        background:rgba(255,255,255,0.85);
        border-radius:14px; padding:10px; margin-bottom:12px;
        border:1px solid #e0eaf5;
      ">
        ${this.renderFloorPlan(currentFloor, canEnter)}
      </div>

      <div style="
        background:rgba(255,255,255,0.85);
        border-radius:14px; padding:12px 14px; margin-bottom:12px;
        border:1px solid #e0eaf5;
      ">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
          <button id="info-btn" style="
            padding:10px 12px;
            background:#8E6BAD;
            color:#fff; border:none; border-radius:10px;
            font-size:0.85em; cursor:pointer;
            text-align:left; font-family:inherit;
          ">
            <div style="font-weight:bold;">情報</div>
            <div style="font-size:0.75em; opacity:0.85;">クラス・部活</div>
          </button>
          <button id="next-day-btn-always" style="
            padding:10px 12px;
            background:linear-gradient(135deg,#F0A030,#D08010);
            color:#fff; border:none; border-radius:10px;
            font-size:0.85em; cursor:pointer;
            text-align:left; font-family:inherit;
          ">
            <div style="font-weight:bold;">翌日へ</div>
            <div style="font-size:0.75em; opacity:0.85;">${dayToDate(this.state.day)}</div>
          </button>
        </div>
      </div>

      ${endDayHtml}
    `;
  }

  private renderFloorPlan(floor: Floor, canEnter: boolean): string {
    switch (floor) {
      case '3f': return this.renderFloor3Plan(canEnter);
      case '2f': return this.renderFloor2Plan(canEnter);
      case '1f': return this.renderFloor1Plan(canEnter);
      case 'ground': return this.renderGroundPlan(canEnter);
      default: return '';
    }
  }

  // 校舎フロア共通：廊下の帯
  private renderCorridor(): string {
    return `<div style="
      height:18px;
      background:linear-gradient(180deg, #c8cdd2 0%, #d8dce0 30%, #e0e4e8 70%, #c8cdd2 100%);
      border-top:2px solid #9aa0a8; border-bottom:2px solid #9aa0a8;
      margin:0; position:relative;
    ">
      <div style="
        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        font-size:0.55em; color:#8890a0; letter-spacing:4px; white-space:nowrap;
      ">廊　下</div>
    </div>`;
  }

  // 校舎の壁（外枠）
  private renderBuildingWrap(floorLabel: string, content: string): string {
    return `
      <div style="font-size:0.78em; font-weight:bold; color:#4a6080; margin-bottom:4px;">
        ${floorLabel}
      </div>
      <div style="
        background:linear-gradient(135deg, #eaeff4 0%, #f4f6f8 100%);
        border:3px solid #8090a0;
        border-radius:4px;
        overflow:hidden;
        box-shadow:0 2px 8px rgba(0,0,0,0.1);
      ">
        ${content}
      </div>
      <div style="font-size:0.58em; color:#aaa; text-align:center; margin-top:4px;">
        部屋をタップして入室 ⚡${MOVE_COST.ENTER_ROOM}
      </div>
    `;
  }

  private roomStyle = { bg: '#dce8f4', border: '#6a8cb8' };
  private specialRoomStyle = { bg: '#e8ddf4', border: '#8a6cb8' };
  private facilityStyle = { bg: '#d8ecda', border: '#6aaa70' };

  private renderFloor3Plan(canEnter: boolean): string {
    const r = this.roomStyle;
    const content = `
      <!-- 教室 + 階段下 -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:0; border-bottom:1px solid #a0a8b0;">
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class3a', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class3b', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class3c', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class3d', canEnter, r)}</div>
        <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
          ${this.renderStairsBtn('2f', '3f', 'down')}
        </div>
      </div>
      ${this.renderCorridor()}
    `;
    return this.renderBuildingWrap('🏫 3階', content);
  }

  private renderFloor2Plan(canEnter: boolean): string {
    const r = this.roomStyle;
    const s = this.specialRoomStyle;
    const content = `
      <!-- 教室 + 階段上 -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:0; border-bottom:1px solid #a0a8b0;">
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class2a', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class2b', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class2c', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class2d', canEnter, r)}</div>
        <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
          ${this.renderStairsBtn('3f', '2f', 'up')}
        </div>
      </div>
      ${this.renderCorridor()}
      <!-- 特別教室 + 階段下 -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:0; border-top:1px solid #a0a8b0;">
        <div style="padding:3px; border-right:1px solid #a0a8b0;">${this.renderRoomBtn('music_room', canEnter, s)}</div>
        <div style="padding:3px; border-right:1px solid #a0a8b0;">${this.renderRoomBtn('art_room', canEnter, s)}</div>
        <div style="padding:3px; background:#eaeff4; border-right:1px solid #a0a8b0;"></div>
        <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
          ${this.renderStairsBtn('1f', '2f', 'down')}
        </div>
      </div>
    `;
    return this.renderBuildingWrap('🏫 2階', content);
  }

  private renderFloor1Plan(canEnter: boolean): string {
    const r = this.roomStyle;
    const f = this.facilityStyle;
    const content = `
      <!-- 教室 + 階段上 -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr auto; gap:0; border-bottom:1px solid #a0a8b0;">
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class1a', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class1b', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class1c', canEnter, r)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('class1d', canEnter, r)}</div>
        <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
          ${this.renderStairsBtn('2f', '1f', 'up')}
        </div>
      </div>
      ${this.renderCorridor()}
      <!-- 共用施設 + 外への出口 -->
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr auto; gap:0; border-top:1px solid #a0a8b0;">
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('cafeteria', canEnter, f)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('library', canEnter, f)}</div>
        <div style="border-right:1px solid #a0a8b0; padding:3px;">${this.renderRoomBtn('courtyard', canEnter, f)}</div>
        <div style="padding:3px; display:flex; align-items:stretch; width:48px;">
          ${this.renderGroundExit('1f')}
        </div>
      </div>
    `;
    return this.renderBuildingWrap('🏫 1階', content);
  }

  private renderGroundPlan(canEnter: boolean): string {
    const fieldStyle = { bg: '#c8e0a8', border: '#6a9848' };
    const courtStyle = { bg: '#e8d8b0', border: '#b0944a' };
    const tree = `<div style="
      width:14px; height:14px; border-radius:50%;
      background:radial-gradient(circle at 40% 40%, #6abf50, #3a8030);
      box-shadow:1px 1px 2px rgba(0,0,0,0.2);
      flex-shrink:0;
    "></div>`;
    const treeRow = (n: number) => `<div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">${Array(n).fill(tree).join('')}</div>`;

    return `
      <div style="font-size:0.78em; font-weight:bold; color:#3a6830; margin-bottom:4px;">
        🌳 グラウンド
      </div>
      <div style="
        background:linear-gradient(180deg, #d0e8b8 0%, #b8d8a0 50%, #a8c890 100%);
        border:3px solid #6a9050;
        border-radius:8px;
        padding:8px;
        box-shadow:0 2px 8px rgba(0,0,0,0.1);
        position:relative;
      ">
        <!-- 校舎（上部に配置） -->
        <div style="margin-bottom:8px;">
          ${this.renderBuildingEntrance('ground')}
        </div>

        ${treeRow(8)}

        <div style="display:flex; gap:6px; margin:8px 0;">
          <div style="display:flex; flex-direction:column; gap:4px; justify-content:center;">
            ${tree}${tree}${tree}
          </div>

          <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
            <!-- 陸上トラック -->
            <div style="
              background:#98c878;
              border:3px solid #e8d0a0;
              border-radius:40px;
              padding:8px;
            ">
              <div style="
                border:2px dashed rgba(255,255,255,0.5);
                border-radius:30px;
                padding:6px;
                display:grid; grid-template-columns:1fr 1fr; gap:6px;
              ">
                ${this.renderRoomBtn('track_field', canEnter, fieldStyle)}
                ${this.renderRoomBtn('soccer_field', canEnter, fieldStyle)}
              </div>
            </div>

            <!-- 野球・テニス -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
              <div style="
                background:#98c070;
                border:2px solid #78a050;
                border-radius:6px; padding:4px;
              ">
                ${this.renderRoomBtn('baseball_field', canEnter, fieldStyle)}
              </div>
              <div style="
                background:#d0c8a0;
                border:2px solid #b0a070;
                border-radius:4px; padding:4px;
              ">
                ${this.renderRoomBtn('tennis_court', canEnter, courtStyle)}
              </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:4px; justify-content:center;">
            ${tree}${tree}${tree}
          </div>
        </div>

        ${treeRow(8)}
      </div>
      <div style="font-size:0.58em; color:#aaa; text-align:center; margin-top:4px;">
        施設をタップして入場 ⚡${MOVE_COST.ENTER_ROOM}
      </div>
    `;
  }

  private renderPlayerInfo(pc: import('../types').PlayerCharacter): string {
    const PERS_LABELS: Record<string, string> = {
      passionate: '熱血', cautious: '慎重', stubborn: '頑固', flexible: '柔軟', cunning: '狡猾',
    };
    const ps = this.state.playerSupport;
    const candidateColor = this.getCandidateColor();
    const candidate = CANDIDATES.find(c => c.id === this.state.candidate);

    const attrsHtml = pc.attributes.map(a =>
      `<span style="
        background:#e8f0fa; color:#3a5080;
        border-radius:12px; padding:2px 8px; font-size:0.75em;
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const hobbies = Object.entries(pc.hobbies) as [string, string][];
    const hobbiesHtml = hobbies.map(([hobby, pref]) => {
      const prefColor = pref === 'like' ? '#27AE60' : pref === 'dislike' ? '#C0392B' : '#888';
      const prefLabel = pref === 'like' ? '好き' : pref === 'dislike' ? '嫌い' : '普通';
      return `
        <div style="
          display:flex; justify-content:space-between;
          padding:4px 8px; border-radius:6px;
          background:rgba(255,255,255,0.5);
          font-size:0.8em; color:#333;
        ">
          <span>${HOBBY_LABELS[hobby] ?? hobby}</span>
          <span style="color:${prefColor};">${prefLabel}</span>
        </div>
      `;
    }).join('');

    const likedHtml = pc.likedAttributes.map(a =>
      `<span style="
        background:rgba(39,174,96,0.1); color:#27AE60;
        border-radius:10px; padding:2px 7px; font-size:0.75em;
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const dislikedHtml = pc.dislikedAttributes.map(a =>
      `<span style="
        background:rgba(192,57,43,0.1); color:#C0392B;
        border-radius:10px; padding:2px 7px; font-size:0.75em;
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const statsBar = (label: string, value: number, color: string) => `
      <div style="display:flex; align-items:center; gap:6px; font-size:0.8em;">
        <span style="width:28px; color:#888;">${label}</span>
        <div style="flex:1; height:8px; background:#e0e8f0; border-radius:4px; overflow:hidden;">
          <div style="width:${value}%; height:100%; background:${color}; border-radius:4px;"></div>
        </div>
        <span style="width:24px; text-align:right; color:#555; font-weight:bold;">${value}</span>
      </div>
    `;

    return `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:14px; padding:14px;
        border:1px solid #e0eaf5;
      ">
        <div style="display:flex; justify-content:flex-end; margin-bottom:8px;">
          <button id="close-player-btn" style="
            background:#ddd; border:none; border-radius:50%;
            width:28px; height:28px; cursor:pointer; font-size:1em;
          ">×</button>
        </div>
        ${pc.portrait
          ? `<div style="text-align:center; margin-bottom:10px;">
              <img src="${pc.portrait}" alt="${pc.name}" style="
                width:180px; height:180px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:3px solid ${candidateColor};
                box-shadow:0 4px 12px rgba(0,0,0,0.1);
              "/>
            </div>`
          : `<div style="text-align:center; margin-bottom:10px;">${renderInitialIcon(pc.name, pc.personality, 180, candidateColor)}</div>`
        }
        <div style="text-align:center; margin-bottom:14px;">
          <div style="font-size:1.1em; font-weight:bold; color:#333;">${pc.name}</div>
          <div style="font-size:0.8em; color:#888;">${pc.className}　${PERS_LABELS[pc.personality] ?? pc.personality}</div>
          <div style="font-size:0.78em; color:${candidateColor}; font-weight:bold;">${FACTION_LABELS[this.state.candidate ?? ''] ?? ''}派</div>
        </div>

        <div style="margin-bottom:12px;">
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:8px; font-size:0.8em; margin-bottom:6px;">
            <div style="color:#888; margin-bottom:4px;">思想</div>
            ${renderSupportBar(ps)}
          </div>
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:8px; font-size:0.8em;">
            <div style="color:#888; margin-bottom:4px;">スタミナ</div>
            <div style="font-weight:bold;">${this.state.stamina} / 100</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:12px;">
          ${statsBar('弁舌', pc.stats.speech, '#4A90D9')}
          ${statsBar('運動', pc.stats.athletic, '#E74C3C')}
          ${statsBar('知性', pc.stats.intel, '#27AE60')}
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:0.8em; color:#888; margin-bottom:6px;">属性</div>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">${attrsHtml}</div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
          <div>
            <div style="font-size:0.8em; color:#27AE60; margin-bottom:4px;">好み属性</div>
            <div style="display:flex; flex-wrap:wrap; gap:3px;">${likedHtml}</div>
          </div>
          <div>
            <div style="font-size:0.8em; color:#C0392B; margin-bottom:4px;">苦手属性</div>
            <div style="display:flex; flex-wrap:wrap; gap:3px;">${dislikedHtml}</div>
          </div>
        </div>

        <div>
          <div style="font-size:0.8em; color:#888; margin-bottom:6px;">趣味</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">${hobbiesHtml}</div>
        </div>
      </div>
    `;
  }

  private renderStudentInfo(s: Student): string {
    return this.renderStudentDetailCard(s, 'close');
  }

  /** 生徒詳細カード（情報パネル・部屋内情報ボタン共通） */
  private renderStudentDetailCard(s: Student, backAction: string): string {
    const PERS_LABELS: Record<string, string> = {
      passionate: '熱血', cautious: '慎重', stubborn: '頑固', flexible: '柔軟', cunning: '狡猾',
    };
    const supportCandidate = CANDIDATES.find(c =>
      c.id === Object.entries(s.support).sort((a, b) => b[1] - a[1])[0][0]
    );
    const attrsHtml = s.attributes.map(a =>
      `<span style="background:#e8f0fa; color:#3a5080; border-radius:12px; padding:2px 8px; font-size:0.75em;">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const hobbiesHtml = Object.entries(s.hobbies).map(([hobby, pref]) => {
      const isRevealed = s.revealedHobbies.has(hobby as import('../types').HobbyTopic);
      const prefColor = pref === 'like' ? '#27AE60' : pref === 'dislike' ? '#C0392B' : '#888';
      const prefLabel = pref === 'like' ? '好き' : pref === 'dislike' ? '嫌い' : '普通';
      return `
        <div style="
          display:flex; justify-content:space-between;
          padding:4px 8px; border-radius:6px;
          background:rgba(255,255,255,0.5);
          font-size:0.8em; color:#333;
        ">
          <span>${HOBBY_LABELS[hobby] ?? hobby}</span>
          ${isRevealed
            ? `<span style="color:${prefColor};">${prefLabel}</span>`
            : `<span style="color:#bbb;">???</span>`
          }
        </div>
      `;
    }).join('');

    // backAction: 'close' → 閉じるボタン(×), 'back-to-org' → 情報パネル内の戻る(←)
    const headerHtml = backAction === 'close'
      ? `<div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:flex-end; margin-bottom:8px;">
            <button id="close-info-btn" style="
              background:#ddd; border:none; border-radius:50%;
              width:28px; height:28px; cursor:pointer; font-size:1em;
            ">×</button>
          </div>
          ${s.portrait
            ? `<div style="text-align:center; margin-bottom:10px;">
                <img src="${s.portrait}" alt="${s.name}" style="
                  width:180px; height:180px; border-radius:50%;
                  object-fit:cover; object-position:top;
                  border:3px solid ${supportCandidate?.color ?? '#d0e0f0'};
                  box-shadow:0 4px 12px rgba(0,0,0,0.1);
                "/>
              </div>`
            : `<div style="text-align:center; margin-bottom:10px;">${renderInitialIcon(s.name, s.personality, 180, supportCandidate?.color ?? '#d0e0f0')}</div>`
          }
          <div style="text-align:center;">
            <div style="font-size:1.1em; font-weight:bold; color:#333;">${s.name}</div>
            <div style="display:flex; justify-content:center; align-items:center; gap:4px; flex-wrap:wrap; margin-top:2px; font-size:0.8em; color:#888;">
              ${renderStudentAffiliation(s.id, s.className, s.clubId)}
              <span style="font-size:0.94em; color:#999;">${PERS_LABELS[s.personality] ?? s.personality}</span>
            </div>
            <div style="font-size:0.78em; color:#888; margin-top:2px;">「${getCatchphrase(s.personality, s.attributes)}」</div>
          </div>
        </div>`
      : `${this.renderInfoHeader(s.name, backAction)}
        ${s.portrait
          ? `<div style="text-align:center; margin-bottom:10px;">
              <img src="${s.portrait}" alt="${s.name}" style="
                width:180px; height:180px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:3px solid ${supportCandidate?.color ?? '#d0e0f0'};
                box-shadow:0 4px 12px rgba(0,0,0,0.1);
              "/>
            </div>`
          : `<div style="text-align:center; margin-bottom:10px;">${renderInitialIcon(s.name, s.personality, 180, supportCandidate?.color ?? '#d0e0f0')}</div>`
        }
        <div style="text-align:center; margin-bottom:14px;">
          <div style="display:flex; justify-content:center; align-items:center; gap:4px; flex-wrap:wrap; font-size:0.8em; color:#888;">
            ${renderStudentAffiliation(s.id, s.className, s.clubId)}
            <span style="font-size:0.94em; color:#999;">${PERS_LABELS[s.personality] ?? s.personality}</span>
          </div>
          <div style="font-size:0.78em; color:#888; margin-top:2px;">「${getCatchphrase(s.personality, s.attributes)}」</div>
        </div>`;

    return `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:14px; padding:14px;
        border:1px solid #e0eaf5;
      ">
        ${headerHtml}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:6px; font-size:0.78em;">
            <div style="color:#888;">好感度</div>
            <div style="font-weight:bold; color:${s.affinity >= 0 ? '#27AE60' : '#C0392B'};">${s.affinity > 0 ? '+' : ''}${s.affinity}</div>
          </div>
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:6px; font-size:0.78em;">
            <div style="color:#888;">会話</div>
            <div style="font-weight:bold;">${s.talkCount}回</div>
          </div>
        </div>

        <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:6px; margin-bottom:12px; font-size:0.78em;">
          <div style="color:#888; margin-bottom:3px;">思想</div>
          ${renderSupportBar(s.support, 12)}
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:0.8em; color:#888; margin-bottom:6px;">属性</div>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">${attrsHtml}</div>
        </div>

        <div>
          <div style="font-size:0.8em; color:#888; margin-bottom:6px;">趣味</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">${hobbiesHtml}</div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    // BGMトグル
    const bgmBtn = this.container.querySelector<HTMLButtonElement>('#bgm-toggle');
    bgmBtn?.addEventListener('pointerup', () => {
      bgm.toggle();
      bgmBtn.textContent = bgm.enabled ? '🔊' : '🔇';
    });

    // プレイヤーアイコン
    const playerIcon = this.container.querySelector<HTMLElement>('#player-icon');
    playerIcon?.addEventListener('pointerup', () => {
      this.showPlayerInfo = true;
      this.showStudentInfo = null;
      this.render();
    });

    // プレイヤー情報を閉じる
    const closePlayerBtn = this.container.querySelector<HTMLButtonElement>('#close-player-btn');
    closePlayerBtn?.addEventListener('pointerup', () => {
      this.showPlayerInfo = false;
      this.render();
    });

    // 情報ボタン
    this.container.querySelectorAll<HTMLButtonElement>('#info-btn').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        this.infoPanel = { tab: 'class' };
        this.showStudentInfo = null;
        this.showPlayerInfo = false;
        this.render();
      });
    });

    // 情報パネル: タブ切替
    this.container.querySelectorAll<HTMLButtonElement>('[data-info-tab]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const tab = btn.dataset['infoTab'] as 'class' | 'club';
        this.infoPanel = { tab };
        this.render();
      });
    });

    // 情報パネル: 組織選択
    this.container.querySelectorAll<HTMLButtonElement>('[data-info-org]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        if (!this.infoPanel) return;
        this.infoPanel = { ...this.infoPanel, orgId: btn.dataset['infoOrg'] };
        this.render();
      });
    });

    // 情報パネル: 生徒選択
    this.container.querySelectorAll<HTMLButtonElement>('[data-info-student]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        if (!this.infoPanel) return;
        this.infoPanel = { ...this.infoPanel, studentId: btn.dataset['infoStudent'] };
        this.render();
      });
    });

    // 情報パネル: アクション（戻る・閉じる）
    this.container.querySelectorAll<HTMLButtonElement>('[data-info-action]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const action = btn.dataset['infoAction'];
        if (action === 'close') {
          this.infoPanel = null;
        } else if (action === 'back-to-list' && this.infoPanel) {
          this.infoPanel = { tab: this.infoPanel.tab };
        } else if (action === 'back-to-org' && this.infoPanel) {
          this.infoPanel = { tab: this.infoPanel.tab, orgId: this.infoPanel.orgId };
        }
        this.render();
      });
    });

    // 廊下に出る
    const exitRoomBtn = this.container.querySelector<HTMLButtonElement>('#exit-room-btn');
    exitRoomBtn?.addEventListener('pointerup', () => {
      this.callbacks.onExitRoom();
    });

    // 部屋に入る
    this.container.querySelectorAll<HTMLButtonElement>('[data-enter-room]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const locId = btn.dataset['enterRoom'] as LocationId;
        this.callbacks.onEnterRoom(locId);
      });
    });

    // フロア移動
    this.container.querySelectorAll<HTMLButtonElement>('[data-change-floor]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const floor = btn.dataset['changeFloor'] as Floor;
        this.callbacks.onChangeFloor(floor);
      });
    });


    // 会話ボタン
    this.container.querySelectorAll<HTMLButtonElement>('[data-action-talk]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const studentId = btn.dataset['actionTalk'];
        const student = this.state.students.find(s => s.id === studentId);
        if (student && this.state.stamina >= 5) {
          this.callbacks.onTalk(student);
        }
      });
    });

    // 説得ボタン
    this.container.querySelectorAll<HTMLButtonElement>('[data-action-persuade]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const studentId = btn.dataset['actionPersuade'];
        const student = this.state.students.find(s => s.id === studentId);
        if (student && student.talkCount > 0) {
          this.callbacks.onPersuade(student);
        }
      });
    });

    // 情報ボタン
    this.container.querySelectorAll<HTMLButtonElement>('[data-action-info]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const studentId = btn.dataset['actionInfo'];
        const student = this.state.students.find(s => s.id === studentId) ?? null;
        this.showStudentInfo = student;
        this.render();
      });
    });

    // 情報パネルを閉じる
    const closeInfoBtn = this.container.querySelector<HTMLButtonElement>('#close-info-btn');
    closeInfoBtn?.addEventListener('pointerup', () => {
      this.showStudentInfo = null;
      this.render();
    });

    // 翌日ボタン（体力切れ時）
    const nextDayBtn = this.container.querySelector<HTMLButtonElement>('#next-day-btn');
    nextDayBtn?.addEventListener('pointerup', () => {
      this.callbacks.onNextDay();
    });

    // 翌日ボタン（常時表示）
    const nextDayBtnAlways = this.container.querySelector<HTMLButtonElement>('#next-day-btn-always');
    nextDayBtnAlways?.addEventListener('pointerup', () => {
      this.callbacks.onNextDay();
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
