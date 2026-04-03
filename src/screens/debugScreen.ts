import type { GameState, Student, Attribute, CandidateId } from '../types';
import { CANDIDATES, CANDIDATE_INFO, FACTION_LABELS, HAIRSTYLE_LABELS, HOBBY_LABELS, ATTRIBUTE_LABELS, getCatchphrase, getCandidateInfo, renderInitialIcon, renderSupportBar } from '../data';
import { ORGANIZATIONS, ORGANIZATION_TYPE_LABELS } from '../data/organizations';
import { getOrganizationVote } from '../logic/organizationLogic';

function dayToDate(day: number): string {
  const d = new Date(2025, 8, day);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const CLUB_LABELS: Record<string, string> = {
  soccer: 'サッカー部',
  track: '陸上部',
  tennis: 'テニス部',
  art: '美術部',
  baseball: '野球部',
  brass: '吹奏楽部',
};

const PERSONALITY_LABELS: Record<string, string> = {
  passionate: '熱血',
  cautious: '慎重',
  stubborn: '頑固',
  flexible: '柔軟',
  cunning: '狡猾',
};

export interface DebugCallbacks {
  onClose: () => void;
}

export class DebugScreen {
  private container: HTMLDivElement;
  private state: GameState;
  private callbacks: DebugCallbacks;

  constructor(state: GameState, callbacks: DebugCallbacks) {
    this.state = state;
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  private calcCompatibility(student: Student): { score: number; liked: Attribute[]; disliked: Attribute[] } {
    const playerAttrs = this.state.playerAttributes;
    const liked = playerAttrs.filter(a => student.likedAttributes.includes(a));
    const disliked = playerAttrs.filter(a => student.dislikedAttributes.includes(a));
    const score = liked.length * 10 - disliked.length * 8;
    return { score, liked, disliked };
  }

  private getSupportCandidate(s: Student): { id: CandidateId; name: string; color: string } {
    const top = (['conservative', 'progressive', 'sports'] as CandidateId[])
      .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
    const c = CANDIDATES.find(c => c.id === top);
    return { id: top, name: c?.name ?? '', color: c?.color ?? '#888' };
  }

  private render(): void {
    const playerCandidate = CANDIDATES.find(c => c.id === this.state.candidate);
    const playerAttrs = this.state.playerAttributes;

    this.container.style.cssText = `
      position:fixed; inset:0;
      background:linear-gradient(160deg, #2a2a3a 0%, #1a1a2a 100%);
      display:flex; flex-direction:column;
      font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;
      color:#e0e0e0; overflow:hidden;
    `;

    const headerHtml = `
      <div style="
        background:rgba(255,100,100,0.15);
        border-bottom:2px solid #c44;
        padding:10px 16px;
        display:flex; justify-content:space-between; align-items:center;
        flex-shrink:0;
      ">
        <div>
          <span style="color:#f88; font-weight:bold; font-size:0.9em;">DEBUG</span>
          <span style="color:#aaa; font-size:0.8em; margin-left:8px;">生徒一覧</span>
        </div>
        <div style="display:flex; gap:12px; align-items:center; font-size:0.8em;">
          <span>${dayToDate(this.state.day)}</span>
          <div style="width:120px;">${renderSupportBar(this.state.playerSupport, 12, true)}</div>
          <button id="debug-close" style="
            background:#c44; color:#fff; border:none; border-radius:6px;
            padding:4px 12px; cursor:pointer; font-family:inherit; font-size:0.85em;
          ">閉じる</button>
        </div>
      </div>
    `;

    const pc = this.state.playerCharacter;
    const playerCardHtml = pc ? this.renderPlayerCard(pc) : '';

    // 全生徒（プレイヤーは別カードで表示するので除外）
    const playerId = this.state.playerCharacter?.id;
    const allStudents = this.state.students.filter(s => s.id !== playerId);
    const studentsHtml = allStudents.map(s => this.renderStudentRow(s)).join('');
    const orgHtml = this.renderOrganizations();

    this.container.innerHTML = headerHtml + `
      <div style="flex:1; overflow-y:auto; padding:12px 16px;">
        ${playerCardHtml}
        <div style="
          font-size:0.8em; color:#888; margin:12px 0 8px;
          border-bottom:1px solid rgba(255,255,255,0.1);
          padding-bottom:6px;
        ">生徒一覧（${allStudents.length}名）</div>
        ${studentsHtml}
        <div style="
          font-size:0.8em; color:#f88; margin:16px 0 8px;
          border-bottom:1px solid rgba(255,100,100,0.2);
          padding-bottom:6px;
        ">組織一覧（${ORGANIZATIONS.length}組）</div>
        ${orgHtml}
      </div>
    `;

    this.container.querySelector('#debug-close')?.addEventListener('pointerup', () => {
      this.callbacks.onClose();
    });
  }

  private renderPlayerCard(pc: import('../types').PlayerCharacter): string {
    const playerCandidate = CANDIDATES.find(c => c.id === this.state.candidate);
    const ps = this.state.playerSupport;

    const attrsHtml = pc.attributes.map(a =>
      `<span style="
        background:rgba(74,144,217,0.3); color:#8cf;
        border-radius:6px; padding:1px 5px; font-size:0.7em;
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const hobbiesHtml = Object.entries(pc.hobbies)
      .filter(([, pref]) => pref !== 'neutral')
      .map(([hobby, pref]) => {
        const color = pref === 'like' ? '#4f8' : '#f66';
        const icon = pref === 'like' ? '♥' : '✗';
        return `<span style="color:${color}; font-size:0.75em;">${icon}${HOBBY_LABELS[hobby] ?? hobby}</span>`;
      }).join(' ');

    const likedHtml = pc.likedAttributes.map(a =>
      `<span style="color:#4f8; font-size:0.7em;">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const dislikedHtml = pc.dislikedAttributes.map(a =>
      `<span style="color:#f66; font-size:0.7em;">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    return `
      <div style="
        background:rgba(74,144,217,0.08);
        border:2px solid rgba(74,144,217,0.3);
        border-radius:10px; padding:10px 12px;
        margin-bottom:4px;
      ">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          ${pc.portrait
            ? `<img src="${pc.portrait}" alt="${pc.name}" style="
                width:48px; height:48px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:2px solid #4A90D9; flex-shrink:0;
              "/>`
            : `<div style="
                width:48px; height:48px; border-radius:50%;
                background:#4A90D9; color:#fff;
                display:flex; align-items:center; justify-content:center;
                font-size:0.8em; font-weight:bold; flex-shrink:0;
              ">YOU</div>`
          }
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:bold; font-size:0.95em; color:#8cf;">${pc.name}</span>
              <span style="font-size:0.75em; color:#888;">${pc.className}</span>
              <span style="
                font-size:0.7em; background:rgba(255,255,255,0.08);
                border-radius:6px; padding:1px 6px; color:#bbb;
              ">${PERSONALITY_LABELS[pc.personality] ?? pc.personality}</span>
            </div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div style="
              font-size:0.75em; padding:2px 8px; border-radius:8px;
              background:${playerCandidate?.color ?? '#888'}33;
              color:${playerCandidate?.color ?? '#888'};
              border:1px solid ${playerCandidate?.color ?? '#888'}66;
            ">${FACTION_LABELS[this.state.candidate ?? ''] ?? ''}派</div>
          </div>
        </div>

        <div style="margin-bottom:6px; font-size:0.75em;">
          <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:4px 6px; margin-bottom:4px;">
            <div style="color:#888; margin-bottom:2px;">思想</div>
            ${renderSupportBar(ps, 12)}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:4px 6px;">
              <div style="color:#888;">能力</div>
              <div>弁${pc.stats.speech} 運${pc.stats.athletic} 知${pc.stats.intel}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:4px 6px;">
              <div style="color:#888;">スタミナ</div>
              <div>${this.state.stamina}/100</div>
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.75em;">
          <div><span style="color:#888;">属性: </span>${attrsHtml}</div>
          <div><span style="color:#888;">趣味: </span>${hobbiesHtml}</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.75em; margin-top:4px;">
          <div><span style="color:#4f8;">好み: </span>${likedHtml}</div>
          <div><span style="color:#f66;">苦手: </span>${dislikedHtml}</div>
        </div>
      </div>
    `;
  }

  private renderStudentRow(s: Student): string {
    const compat = this.calcCompatibility(s);
    const sup = this.getSupportCandidate(s);
    const isAlly = sup.id === this.state.candidate;
    const isCandidate = s.candidateId !== null;
    const candidateColor = isCandidate ? (getCandidateInfo(s.candidateId!).color) : null;

    const compatColor = compat.score > 0 ? '#4f8' : compat.score < 0 ? '#f66' : '#888';
    const compatSign = compat.score > 0 ? '+' : '';

    const hobbiesHtml = Object.entries(s.hobbies)
      .filter(([, pref]) => pref !== 'neutral')
      .map(([hobby, pref]) => {
        const color = pref === 'like' ? '#4f8' : '#f66';
        const icon = pref === 'like' ? '♥' : '✗';
        return `<span style="color:${color}; font-size:0.75em;">${icon}${HOBBY_LABELS[hobby] ?? hobby}</span>`;
      }).join(' ');

    const attrsHtml = s.attributes.map(a => {
      const isLikedByStudent = false; // プレイヤー側の視点ではなく生徒の属性表示
      const isPlayerMatch = this.state.playerAttributes.includes(a);
      const bg = isPlayerMatch ? 'rgba(74,144,217,0.3)' : 'rgba(255,255,255,0.08)';
      return `<span style="
        background:${bg}; border-radius:6px; padding:1px 5px;
        font-size:0.7em; color:#ccc;
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`;
    }).join(' ');

    const likedHtml = s.likedAttributes.map(a => {
      const matched = this.state.playerAttributes.includes(a);
      return `<span style="
        color:${matched ? '#4f8' : '#888'}; font-size:0.7em;
        ${matched ? 'font-weight:bold;' : ''}
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`;
    }).join(' ');

    const dislikedHtml = s.dislikedAttributes.map(a => {
      const matched = this.state.playerAttributes.includes(a);
      return `<span style="
        color:${matched ? '#f66' : '#888'}; font-size:0.7em;
        ${matched ? 'font-weight:bold;' : ''}
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`;
    }).join(' ');

    const borderColor = isCandidate ? candidateColor! : (isAlly ? '#4f8' : 'rgba(255,255,255,0.15)');

    return `
      <div style="
        background:${isCandidate ? candidateColor + '10' : 'rgba(255,255,255,0.04)'};
        border:1px solid ${isCandidate ? candidateColor + '40' : 'rgba(255,255,255,0.08)'};
        border-radius:10px; padding:10px 12px;
        margin-bottom:8px;
      ">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          ${s.portrait
            ? `<img src="${s.portrait}" alt="${s.name}" style="
                width:48px; height:48px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:2px solid ${borderColor};
                flex-shrink:0;
              "/>`
            : renderInitialIcon(s.name, s.personality, 48, borderColor)
          }
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span style="font-weight:bold; font-size:0.95em;">${s.name}</span>
              <span style="font-size:0.75em; color:#888;">${s.className}</span>
              ${s.clubId ? `<span style="
                font-size:0.65em; background:rgba(255,255,255,0.08);
                border-radius:4px; padding:1px 5px; color:#aaa;
              ">${CLUB_LABELS[s.clubId] ?? s.clubId}</span>` : ''}
              <span style="
                font-size:0.7em; background:rgba(255,255,255,0.08);
                border-radius:6px; padding:1px 6px; color:#bbb;
              ">${PERSONALITY_LABELS[s.personality] ?? s.personality}</span>
              ${isCandidate ? `<span style="
                font-size:0.65em; background:${candidateColor}30; color:${candidateColor};
                border-radius:4px; padding:1px 5px;
                border:1px solid ${candidateColor}60;
              ">${FACTION_LABELS[s.candidateId!] ?? ''}派候補</span>` : ''}
              ${s.playable ? '' : `<span style="
                font-size:0.65em; background:rgba(255,255,255,0.08);
                border-radius:4px; padding:1px 5px; color:#888;
              ">選択不可</span>`}
            </div>
            <div style="font-size:0.72em; color:#777; margin-top:2px;">
              ${s.description}
            </div>
            <div style="font-size:0.72em; color:#999; margin-top:1px;">
              「${getCatchphrase(s.personality, s.attributes)}」
            </div>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div style="
              font-size:0.75em; padding:2px 8px; border-radius:8px;
              background:${sup.color}33; color:${sup.color};
              border:1px solid ${sup.color}66;
            ">${FACTION_LABELS[sup.id] ?? ''}派</div>
          </div>
        </div>

        <div style="margin-bottom:4px; font-size:0.75em;">
          <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:4px 6px; margin-bottom:4px;">
            ${renderSupportBar(s.support, 10)}
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:8px; font-size:0.75em;">
          <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:4px 6px;">
            <div style="color:#888;">能力</div>
            <div>弁${s.stats.speech} 運${s.stats.athletic} 知${s.stats.intel}</div>
          </div>
          <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:4px 6px;">
            <div style="color:#888;">好感度</div>
            <div style="color:${s.affinity >= 0 ? '#4f8' : '#f66'};">${s.affinity > 0 ? '+' : ''}${s.affinity}</div>
          </div>
          <div style="background:rgba(255,255,255,0.05); border-radius:6px; padding:4px 6px;">
            <div style="color:#888;">相性</div>
            <div style="color:${compatColor}; font-weight:bold;">${compatSign}${compat.score}</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.75em;">
          <div>
            <span style="color:#888;">髪型: </span><span style="
              background:rgba(255,255,255,0.08); border-radius:6px; padding:1px 5px;
              font-size:0.9em; color:#ccc;
            ">${HAIRSTYLE_LABELS[s.hairStyle] ?? s.hairStyle}</span>
            <span style="color:#888; margin-left:6px;">属性: </span>${attrsHtml}
          </div>
          <div>
            <span style="color:#888;">趣味: </span>${hobbiesHtml}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.75em; margin-top:4px;">
          <div>
            <span style="color:#4f8;">好み: </span>${likedHtml}
          </div>
          <div>
            <span style="color:#f66;">苦手: </span>${dislikedHtml}
          </div>
        </div>
      </div>
    `;
  }

  private renderOrganizations(): string {
    return ORGANIZATIONS.map(org => {
      const vote = getOrganizationVote(org, this.state.students);
      const voteCandidate = CANDIDATES.find(c => c.id === vote);
      const isPlayerVote = vote === this.state.candidate;
      const leader = this.state.students.find(s => s.id === org.leaderId);
      const typeLabel = ORGANIZATION_TYPE_LABELS[org.type] ?? org.type;

      return `
        <div style="
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:8px; padding:8px 12px;
          margin-bottom:6px;
          display:flex; align-items:center; gap:10px;
        ">
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
              <span style="font-weight:bold; font-size:0.9em;">${org.name}</span>
              <span style="
                font-size:0.7em; background:rgba(255,255,255,0.08);
                border-radius:4px; padding:1px 5px; color:#bbb;
              ">${typeLabel}</span>
            </div>
            <div style="font-size:0.75em; color:#888;">
              代表: ${leader?.name ?? org.leaderId}
            </div>
          </div>
          <div style="
            font-size:0.8em; padding:2px 8px; border-radius:8px;
            background:${(voteCandidate?.color ?? '#888')}33;
            color:${voteCandidate?.color ?? '#888'};
            border:1px solid ${(voteCandidate?.color ?? '#888')}66;
            flex-shrink:0;
            ${isPlayerVote ? 'font-weight:bold;' : ''}
          ">${FACTION_LABELS[vote] ?? vote}派${isPlayerVote ? ' ✓' : ''}</div>
        </div>
      `;
    }).join('');
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
