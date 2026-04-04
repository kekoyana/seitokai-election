import type { Student, CandidateId } from '../types';
import { ATTRIBUTE_LABELS, HOBBY_LABELS, CANDIDATES, CANDIDATE_INFO, FACTION_LABELS, getCatchphrase, renderInitialIcon } from '../data';

const PERSONALITY_LABELS: Record<string, string> = {
  passionate: '熱血',
  cautious: '慎重',
  stubborn: '頑固',
  flexible: '柔軟',
  cunning: '狡猾',
};

export interface CharacterSelectCallbacks {
  onSelect: (student: Student) => void;
}

export class CharacterSelectScreen {
  private container: HTMLDivElement;
  private students: Student[];
  private callbacks: CharacterSelectCallbacks;
  private activeTab: CandidateId | null = null;

  constructor(students: Student[], callbacks: CharacterSelectCallbacks) {
    this.students = students;
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  private getSupportFaction(s: Student): CandidateId {
    return (['conservative', 'progressive', 'sports'] as CandidateId[])
      .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
  }

  private render(): void {
    this.container.style.cssText = `
      position:fixed; inset:0;
      background:linear-gradient(160deg, var(--game-bg-dark) 0%, var(--game-bg-mid) 100%);
      display:flex; flex-direction:column;
      font-family:var(--game-font);
      overflow:hidden; box-sizing:border-box;
    `;

    const activeInfo = this.activeTab ? CANDIDATE_INFO.find(c => c.id === this.activeTab)! : null;
    const activeCandidate = this.activeTab ? CANDIDATES.find(c => c.id === this.activeTab) : null;

    // タブ
    const tabsHtml = CANDIDATE_INFO.map(info => {
      const active = info.id === this.activeTab;
      const count = this.students.filter(s => this.getSupportFaction(s) === info.id).length;
      return `<button class="faction-tab" data-faction="${info.id}" style="
        flex:1;
        background:${active ? info.color : 'rgba(20,30,60,0.6)'};
        color:${active ? '#fff' : '#8090b0'};
        border:2px solid ${active ? info.color : 'transparent'};
        border-bottom:${active ? 'none' : '2px solid var(--game-panel-border)'};
        padding:10px 8px 8px;
        cursor:pointer;
        font-family:var(--game-font);
        font-size:0.85em;
        font-weight:bold;
        transition:all 0.15s;
        border-radius:4px 4px 0 0;
        text-shadow:${active ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'};
      ">${FACTION_LABELS[info.id]}派 <span style="font-size:0.8em; opacity:0.7;">(${count})</span></button>`;
    }).join('');

    // 派閥説明 or 未選択メッセージ
    let descHtml: string;
    if (activeInfo) {
      descHtml = `
        <div class="game-panel-light" style="
          border-left:4px solid ${activeInfo.color};
          margin:0 16px 12px;
          display:flex; align-items:center; gap:12px;
        ">
          ${activeCandidate?.portrait
            ? `<img src="${activeCandidate.portrait}" alt="${activeCandidate.name}" style="
                width:64px; height:64px; border-radius:4px;
                object-fit:cover; object-position:top;
                border:2px solid ${activeInfo.color};
                flex-shrink:0;
                box-shadow:0 2px 8px rgba(0,0,0,0.4);
              "/>`
            : ''
          }
          <div style="flex:1;">
            <div style="font-weight:bold; color:${activeInfo.color}; font-size:0.9em; margin-bottom:4px;">
              ${activeInfo.platform}
            </div>
            <div style="font-size:0.8em; color:var(--game-text-dim); line-height:1.6;">
              ${activeInfo.description}
            </div>
            ${activeCandidate ? `
              <div style="font-size:0.78em; color:var(--game-text-dim); margin-top:6px;">
                候補者: <span style="font-weight:bold; color:${activeInfo.color};">${activeCandidate.name}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      descHtml = `
        <div class="game-panel-light" style="
          margin:0 16px 12px;
          text-align:center;
        ">
          <div style="font-size:0.95em; color:var(--game-gold); margin-bottom:4px;">
            支持する思想を選んでください
          </div>
          <div style="font-size:0.8em; color:var(--game-text-dim); line-height:1.6;">
            上のタブから派閥を選ぶと、所属する生徒の一覧が表示されます
          </div>
        </div>
      `;
    }

    // カード
    const factionStudents = this.activeTab
      ? this.students.filter(s => this.getSupportFaction(s) === this.activeTab)
      : [];
    const cardsHtml = factionStudents.map(s => this.renderCard(s)).join('');

    this.container.innerHTML = `
      <div style="
        text-align:center; padding:20px 16px 0;
        flex-shrink:0;
      ">
        <h1 class="game-title" style="font-size:1.3em; margin:0 0 4px;">キャラクター選択</h1>
        <p style="font-size:0.85em; color:var(--game-text-dim); margin:0 0 16px;">あなたの分身となる生徒を選んでください</p>
      </div>
      <div style="
        display:flex; gap:0;
        padding:0 16px;
        flex-shrink:0;
        border-bottom:2px solid var(--game-panel-border);
      ">${tabsHtml}</div>
      <div style="flex:1; overflow-y:auto; padding:12px 16px;">
        ${descHtml}
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${cardsHtml}
        </div>
      </div>
    `;

    // タブイベント
    this.container.querySelectorAll<HTMLButtonElement>('.faction-tab').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const faction = btn.dataset['faction'] as CandidateId;
        if (faction && faction !== this.activeTab) {
          this.activeTab = faction;
          this.render();
        }
      });
    });

    // カード選択イベント
    this.container.querySelectorAll<HTMLButtonElement>('[data-student-id]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const id = btn.dataset['studentId'];
        const s = this.students.find(st => st.id === id);
        if (s) this.callbacks.onSelect(s);
      });
    });
  }

  private renderCard(s: Student): string {
    const attrsHtml = s.attributes.map(a =>
      `<span style="
        background:rgba(74,144,217,0.2); color:#8ab0e8;
        border:1px solid rgba(74,144,217,0.3);
        border-radius:3px; padding:1px 7px; font-size:0.75em;
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const hobbiesLiked = Object.entries(s.hobbies)
      .filter(([, pref]) => pref === 'like')
      .map(([h]) => HOBBY_LABELS[h] ?? h)
      .join('、');

    const statsBar = (label: string, value: number, color: string) => `
      <div style="display:flex; align-items:center; gap:6px; font-size:0.75em;">
        <span style="width:28px; color:var(--game-text-dim);">${label}</span>
        <div style="flex:1; height:8px; background:rgba(0,0,0,0.4); border:1px solid rgba(74,96,144,0.4); border-radius:2px; overflow:hidden;">
          <div style="width:${value}%; height:100%; background:${color}; box-shadow:inset 0 -1px 0 rgba(0,0,0,0.2);"></div>
        </div>
        <span style="width:20px; text-align:right; color:var(--game-text);">${value}</span>
      </div>
    `;

    const supportCandidateId = this.activeTab;
    const supportCandidate = CANDIDATES.find(c => c.id === supportCandidateId);

    return `
      <button data-student-id="${s.id}" class="game-chara-card" style="
        cursor:pointer; text-align:left;
        font-family:var(--game-font);
      " onpointerenter="this.style.borderColor='${supportCandidate?.color ?? '#4A90D9'}';this.style.boxShadow='0 0 12px ${supportCandidate?.color ?? '#4A90D9'}40'"
         onpointerleave="this.style.borderColor='var(--game-panel-border)';this.style.boxShadow='0 2px 6px rgba(0,0,0,0.3)'">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
          ${s.portrait
            ? `<img src="${s.portrait}" alt="${s.name}" style="
                width:56px; height:56px; border-radius:4px;
                object-fit:cover; object-position:top;
                border:2px solid ${supportCandidate?.color ?? '#4a6090'}; flex-shrink:0;
                box-shadow:0 2px 6px rgba(0,0,0,0.4);
              "/>`
            : renderInitialIcon(s.name, s.personality, 56, supportCandidate?.color ?? '#4a6090')
          }
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:1em; font-weight:bold; color:var(--game-text);">${s.name}</span>
            </div>
            <div style="font-size:0.8em; color:var(--game-text-dim);">
              ${s.className}　${s.gender === 'male' ? '♂' : '♀'}　${PERSONALITY_LABELS[s.personality] ?? s.personality}
            </div>
            <div style="font-size:0.78em; color:var(--game-gold-dark);">「${getCatchphrase(s.personality, s.attributes)}」</div>
          </div>
        </div>

        <div style="font-size:0.78em; color:var(--game-text-dim); line-height:1.5; margin-bottom:8px;
          background:rgba(0,0,0,0.3); border-radius:4px; padding:8px 10px; border:1px solid rgba(74,96,144,0.3);">
          ${s.description}
        </div>

        <div style="margin-bottom:8px;">
          ${attrsHtml}
        </div>

        <div style="display:flex; flex-direction:column; gap:3px; margin-bottom:8px;">
          ${statsBar('弁舌', s.stats.speech, '#4A90D9')}
          ${statsBar('運動', s.stats.athletic, '#E74C3C')}
          ${statsBar('知性', s.stats.intel, '#27AE60')}
        </div>

        <div style="font-size:0.78em; color:var(--game-text-dim);">
          好き: ${hobbiesLiked || 'なし'}
        </div>
      </button>
    `;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
