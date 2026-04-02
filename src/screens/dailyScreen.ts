import type { GameState, Student, LocationId, ActionType, CandidateId } from '../types';
import { LOCATIONS, CANDIDATES, FACTION_LABELS, getStudentLocation, getCandidateLocation, HOBBY_LABELS, ATTRIBUTE_LABELS, TIME_LABELS, getCatchphrase, renderInitialIcon } from '../data';
import { ORGANIZATIONS, ORGANIZATION_TYPE_LABELS } from '../data/organizations';
import { getOrganizationVote } from '../logic/organizationLogic';

export interface DailyCallbacks {
  onMove: (locationId: LocationId) => void;
  onTalk: (student: Student) => void;
  onPersuade: (student: Student) => void;
  onNextDay: () => void;
}

export class DailyScreen {
  private container: HTMLDivElement;
  private state: GameState;
  private callbacks: DailyCallbacks;
  private showMovePanel: boolean = false;
  private showStudentInfo: Student | null = null;
  private showPlayerInfo: boolean = false;
  private showOrgPanel: boolean = false;

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
    return this.state.students.filter(s =>
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

    // ヘッダー
    const pc = this.state.playerCharacter;
    const headerHtml = `
      <div style="
        background: linear-gradient(90deg, ${candidateColor}, ${candidateColor}CC);
        color: #fff; padding: 10px 16px;
        display: flex; justify-content: space-between; align-items: center;
        flex-shrink: 0;
      ">
        <div style="display:flex; align-items:center; gap:8px;">
          ${pc ? `<div id="player-icon" style="cursor:pointer;">${pc.portrait
            ? `<img src="${pc.portrait}" alt="${pc.name}" style="
                width:32px; height:32px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:2px solid rgba(255,255,255,0.6);
              "/>`
            : renderInitialIcon(pc.name, pc.personality, 32, 'rgba(255,255,255,0.6)')
          }</div>` : ''}
          <div>
            ${pc ? `<div style="font-size:0.75em; opacity:0.85;">${pc.name}</div>` : ''}
            <div>
              <span style="font-size:0.8em; opacity:0.85;">支持:</span>
              <span style="font-size:0.9em; font-weight:bold; margin-left:4px;">${FACTION_LABELS[this.state.candidate ?? ''] ?? ''}派</span>
            </div>
          </div>
        </div>
        <div style="display:flex; gap:12px; font-size:0.85em; align-items:center;">
          <span><span style="opacity:0.75;">Day</span> <strong>${this.state.day}/30</strong></span>
          <span>⚡<strong>${this.state.stamina}</strong></span>
        </div>
      </div>
    `;

    // 支持者数（プレイヤーの候補と同じ候補を最も支持している生徒の数）
    const playerCandidateId = this.state.candidate;
    const supporterCount = this.state.students.filter(s => {
      const maxKey = (['conservative', 'progressive', 'sports'] as const)
        .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
      return maxKey === playerCandidateId;
    }).length;
    const supportInfo = `
      <div style="
        background:rgba(255,255,255,0.7);
        border-bottom:1px solid #e0e8f5;
        padding:6px 16px;
        display:flex; gap:16px; font-size:0.78em; color:#555;
        flex-shrink:0;
      ">
        <span>支持者: <strong style="color:${candidateColor}">${supporterCount}</strong>名</span>
        <span>場所: <strong>${currentLocation?.name ?? ''}</strong></span>
      </div>
    `;

    // メインコンテンツ
    let mainHtml = '';

    if (this.showPlayerInfo && pc) {
      mainHtml = this.renderPlayerInfo(pc);
    } else if (this.showStudentInfo) {
      mainHtml = this.renderStudentInfo(this.showStudentInfo);
    } else if (this.showOrgPanel) {
      mainHtml = this.renderOrgPanel();
    } else if (this.showMovePanel) {
      mainHtml = this.renderMovePanel();
    } else {
      mainHtml = this.renderMainPanel(studentsHere, isOutOfStamina);
    }

    this.container.innerHTML = headerHtml + supportInfo + `
      <div style="flex:1; overflow-y:auto; padding:12px 16px;">
        ${mainHtml}
      </div>
    `;

    this.attachEvents();
  }

  private renderCandidateCard(c: typeof CANDIDATES[number]): string {
    const isPlayer = c.id === this.state.candidate;
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
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:0.9em; font-weight:bold; color:#333;">${c.name}</span>
            <span style="
              font-size:0.65em; padding:1px 6px; border-radius:6px;
              background:${c.color}20; color:${c.color};
              border:1px solid ${c.color}40;
            ">候補者</span>
            ${isPlayer ? `<span style="
              font-size:0.65em; padding:1px 6px; border-radius:6px;
              background:#27AE6020; color:#27AE60;
            ">支持中</span>` : ''}
          </div>
          <div style="font-size:0.75em; color:#888;">${c.className}　${c.platform}</div>
        </div>
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
          ${this.renderActionButton('move', '移動', '別の場所へ', '0', '#4A90D9', false)}
          <button id="org-btn" style="
            padding:10px 12px;
            background:#8E6BAD;
            color:#fff; border:none; border-radius:10px;
            font-size:0.85em; cursor:pointer;
            text-align:left; font-family:inherit;
          ">
            <div style="font-weight:bold;">組織</div>
            <div style="font-size:0.75em; opacity:0.85;">支持状況</div>
          </button>
          <button id="next-day-btn-always" style="
            padding:10px 12px;
            background:linear-gradient(135deg,#F0A030,#D08010);
            color:#fff; border:none; border-radius:10px;
            font-size:0.85em; cursor:pointer;
            text-align:left; font-family:inherit;
          ">
            <div style="font-weight:bold;">翌日へ</div>
            <div style="font-size:0.75em; opacity:0.85;">Day ${this.state.day}/30</div>
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
          <div style="font-size:0.9em; font-weight:bold; color:#333;">${s.name}</div>
          <div style="font-size:0.75em; color:#888;">${s.className}</div>
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

  private renderOrgPanel(): string {
    const candidateColor = this.getCandidateColor();

    const renderOrgGroup = (label: string, orgs: typeof ORGANIZATIONS) => {
      if (orgs.length === 0) return '';
      const rows = orgs.map(org => {
        const vote = getOrganizationVote(org, this.state.students);
        const voteCandidate = CANDIDATES.find(c => c.id === vote);
        const isAlly = vote === this.state.candidate;
        const leader = this.state.students.find(s => s.id === org.leaderId);
        const typeLabel = ORGANIZATION_TYPE_LABELS[org.type] ?? org.type;

        // 代表の思想数値
        const sup = leader?.support;
        const supText = sup ? `保${sup.conservative}/革${sup.progressive}/体${sup.sports}` : '';

        return `
          <div style="
            display:flex; align-items:center; gap:8px;
            padding:8px; border-radius:8px;
            background:${isAlly ? 'rgba(39,174,96,0.06)' : 'rgba(255,255,255,0.5)'};
            border:1px solid ${isAlly ? 'rgba(39,174,96,0.2)' : '#e8f0f8'};
            margin-bottom:4px;
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
                <span style="
                  font-size:0.65em; background:#f0f0f5; color:#888;
                  border-radius:4px; padding:1px 5px;
                ">${typeLabel}</span>
              </div>
              <div style="font-size:0.72em; color:#888;">
                代表: ${leader?.name ?? '不明'}
                <span style="margin-left:6px; color:#aaa;">${supText}</span>
              </div>
            </div>
            <div style="
              font-size:0.75em; padding:2px 8px; border-radius:8px;
              background:${(voteCandidate?.color ?? '#888')}15;
              color:${voteCandidate?.color ?? '#888'};
              border:1px solid ${(voteCandidate?.color ?? '#888')}33;
              font-weight:${isAlly ? 'bold' : 'normal'};
              flex-shrink:0;
            ">${FACTION_LABELS[vote] ?? ''}派${isAlly ? ' ✓' : ''}</div>
          </div>
        `;
      }).join('');

      return `
        <div style="margin-bottom:12px;">
          <div style="font-size:0.78em; color:#888; margin-bottom:4px; font-weight:bold;">${label}</div>
          ${rows}
        </div>
      `;
    };

    // 集計
    const allyCount = ORGANIZATIONS.filter(org =>
      getOrganizationVote(org, this.state.students) === this.state.candidate
    ).length;

    const year1 = ORGANIZATIONS.filter(o => o.id.startsWith('class1'));
    const year2 = ORGANIZATIONS.filter(o => o.id.startsWith('class2'));
    const year3 = ORGANIZATIONS.filter(o => o.id.startsWith('class3'));
    const clubs = ORGANIZATIONS.filter(o => o.id.startsWith('club_'));

    return `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:14px; padding:14px;
        border:1px solid #e0eaf5;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:0.95em; color:#333;">組織の支持状況</h3>
          <button id="close-org-btn" style="
            background:#ddd; border:none; border-radius:50%;
            width:28px; height:28px; cursor:pointer; font-size:1em;
          ">×</button>
        </div>

        <div style="
          background:${candidateColor}10; border:1px solid ${candidateColor}30;
          border-radius:8px; padding:8px 12px; margin-bottom:12px;
          font-size:0.82em; color:#555; text-align:center;
        ">
          味方の組織: <strong style="color:${candidateColor}; font-size:1.1em;">${allyCount}</strong> / ${ORGANIZATIONS.length}組
        </div>

        ${renderOrgGroup('1年', year1)}
        ${renderOrgGroup('2年', year2)}
        ${renderOrgGroup('3年', year3)}
        ${renderOrgGroup('部活', clubs)}
      </div>
    `;
  }

  private renderMovePanel(): string {
    const groups: { label: string; ids: string[] }[] = [
      { label: '1年教室', ids: ['class1a', 'class1b', 'class1c', 'class1d'] },
      { label: '2年教室', ids: ['class2a', 'class2b', 'class2c', 'class2d'] },
      { label: '3年教室', ids: ['class3a', 'class3b', 'class3c', 'class3d'] },
      { label: '部活', ids: ['track_field', 'soccer_field', 'baseball_field', 'tennis_court', 'music_room', 'art_room'] },
      { label: '共用', ids: ['courtyard', 'library', 'cafeteria'] },
    ];

    const groupHtml = groups.map(g => {
      const locs = LOCATIONS.filter(l => (g.ids as string[]).includes(l.id));
      const btns = locs.map(loc => {
        const isCurrent = loc.id === this.state.currentLocation;
        return `
          <button data-move-to="${loc.id}" style="
            padding:8px 10px;
            background:${isCurrent ? '#e0eaf5' : '#fff'};
            border:2px solid ${isCurrent ? '#4A90D9' : '#ddd'};
            border-radius:8px;
            font-size:0.78em; cursor:pointer; text-align:left;
            font-family:inherit; color:#333;
          ">
            ${loc.name}${isCurrent ? ' ★' : ''}
          </button>
        `;
      }).join('');
      return `
        <div style="margin-bottom:10px;">
          <div style="font-size:0.75em; color:#888; margin-bottom:4px;">${g.label}</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">${btns}</div>
        </div>
      `;
    }).join('');

    return `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:14px; padding:14px;
        border:1px solid #e0eaf5;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="font-size:0.95em; color:#333;">どこへ移動する？</h3>
          <button id="close-move-btn" style="
            background:#ddd; border:none; border-radius:50%;
            width:28px; height:28px; cursor:pointer; font-size:1em;
          ">×</button>
        </div>
        ${groupHtml}
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
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${pc.portrait
              ? `<img src="${pc.portrait}" alt="${pc.name}" style="
                  width:60px; height:60px; border-radius:50%;
                  object-fit:cover; object-position:top;
                  border:3px solid ${candidateColor};
                "/>`
              : renderInitialIcon(pc.name, pc.personality, 60, candidateColor)
            }
            <div>
              <div style="font-size:1.1em; font-weight:bold; color:#333;">${pc.name}</div>
              <div style="font-size:0.8em; color:#888;">${pc.className}　${PERS_LABELS[pc.personality] ?? pc.personality}</div>
              <div style="font-size:0.78em; color:${candidateColor}; font-weight:bold;">${FACTION_LABELS[this.state.candidate ?? ''] ?? ''}派</div>
            </div>
          </div>
          <button id="close-player-btn" style="
            background:#ddd; border:none; border-radius:50%;
            width:28px; height:28px; cursor:pointer; font-size:1em;
          ">×</button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:12px;">
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:8px; font-size:0.8em;">
            <div style="color:#888; margin-bottom:4px;">思想</div>
            <div>保守 <strong>${ps.conservative}</strong> / 革新 <strong>${ps.progressive}</strong> / 体育 <strong>${ps.sports}</strong></div>
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
    const hobbies = Object.entries(s.hobbies) as [string, string][];
    const revealedHobbies = s.revealedHobbies;

    const hobbiesHtml = hobbies.map(([hobby, pref]) => {
      const isRevealed = revealedHobbies.has(hobby as never);
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

    const attrsHtml = s.attributes.map(a =>
      `<span style="
        background:#e8f0fa; color:#3a5080;
        border-radius:12px; padding:2px 8px; font-size:0.75em;
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const supportCandidate = CANDIDATES.find(c =>
      c.id === Object.entries(s.support).sort((a, b) => b[1] - a[1])[0][0]
    );

    return `
      <div style="
        background:rgba(255,255,255,0.9);
        border-radius:14px; padding:14px;
        border:1px solid #e0eaf5;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <div style="display:flex; align-items:center; gap:12px;">
            ${s.portrait
              ? `<img src="${s.portrait}" alt="${s.name}" style="
                  width:60px; height:60px; border-radius:50%;
                  object-fit:cover; object-position:top;
                  border:3px solid #d0e0f0;
                "/>`
              : renderInitialIcon(s.name, s.personality, 60, '#d0e0f0')
            }
            <div>
              <div style="font-size:1.1em; font-weight:bold; color:#333;">${s.name}</div>
              <div style="font-size:0.8em; color:#888;">${s.className}</div>
              <div style="font-size:0.78em; color:#888;">「${getCatchphrase(s.personality, s.attributes)}」</div>
            </div>
          </div>
          <button id="close-info-btn" style="
            background:#ddd; border:none; border-radius:50%;
            width:28px; height:28px; cursor:pointer; font-size:1em;
          ">×</button>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:12px;">
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:8px; font-size:0.8em;">
            <div style="color:#888; margin-bottom:4px;">好感度</div>
            <div style="font-weight:bold; color:${s.affinity >= 0 ? '#27AE60' : '#C0392B'};">${s.affinity > 0 ? '+' : ''}${s.affinity}</div>
          </div>
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:8px; font-size:0.8em;">
            <div style="color:#888; margin-bottom:4px;">会話回数</div>
            <div style="font-weight:bold; color:#333;">${s.talkCount}回</div>
          </div>
        </div>

        ${s.talkCount > 0 ? `
          <div style="margin-bottom:12px;">
            <div style="font-size:0.8em; color:#888; margin-bottom:6px;">支持傾向 <span style="opacity:0.6;">(会話で判明)</span></div>
            <div style="font-size:0.82em; color:#555;">
              支持候補: <strong style="color:${supportCandidate?.color ?? '#333'};">${supportCandidate?.name ?? '不明'}</strong>
            </div>
          </div>
        ` : `
          <div style="margin-bottom:12px; font-size:0.82em; color:#aaa; text-align:center;">
            会話するとプロフィールが判明します
          </div>
        `}

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
    // プレイヤーアイコン
    const playerIcon = this.container.querySelector<HTMLElement>('#player-icon');
    playerIcon?.addEventListener('pointerup', () => {
      this.showPlayerInfo = true;
      this.showStudentInfo = null;
      this.showMovePanel = false;
      this.render();
    });

    // プレイヤー情報を閉じる
    const closePlayerBtn = this.container.querySelector<HTMLButtonElement>('#close-player-btn');
    closePlayerBtn?.addEventListener('pointerup', () => {
      this.showPlayerInfo = false;
      this.render();
    });

    // 組織ボタン
    const orgBtn = this.container.querySelector<HTMLButtonElement>('#org-btn');
    orgBtn?.addEventListener('pointerup', () => {
      this.showOrgPanel = true;
      this.showStudentInfo = null;
      this.showMovePanel = false;
      this.showPlayerInfo = false;
      this.render();
    });

    // 組織パネルを閉じる
    const closeOrgBtn = this.container.querySelector<HTMLButtonElement>('#close-org-btn');
    closeOrgBtn?.addEventListener('pointerup', () => {
      this.showOrgPanel = false;
      this.render();
    });

    // 移動ボタン
    const moveBtn = this.container.querySelector<HTMLButtonElement>('[data-action="move"]');
    moveBtn?.addEventListener('pointerup', () => {
      this.showMovePanel = true;
      this.showStudentInfo = null;
      this.showPlayerInfo = false;
      this.showOrgPanel = false;
      this.render();
    });

    // 移動先選択
    this.container.querySelectorAll<HTMLButtonElement>('[data-move-to]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const locId = btn.dataset['moveTo'] as LocationId;
        this.showMovePanel = false;
        this.callbacks.onMove(locId);
      });
    });

    // 移動パネルを閉じる
    const closeMoveBtn = this.container.querySelector<HTMLButtonElement>('#close-move-btn');
    closeMoveBtn?.addEventListener('pointerup', () => {
      this.showMovePanel = false;
      this.render();
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
        this.showMovePanel = false;
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
