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
  private activeTab: CandidateId = 'conservative';

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
      background:linear-gradient(160deg, #E8F4FD 0%, #FFF9E6 100%);
      display:flex; flex-direction:column;
      font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;
      overflow:hidden; box-sizing:border-box;
    `;

    const activeInfo = CANDIDATE_INFO.find(c => c.id === this.activeTab)!;
    const activeCandidate = CANDIDATES.find(c => c.id === this.activeTab);

    // タブ
    const tabsHtml = CANDIDATE_INFO.map(info => {
      const active = info.id === this.activeTab;
      const count = this.students.filter(s => this.getSupportFaction(s) === info.id).length;
      return `<button class="faction-tab" data-faction="${info.id}" style="
        flex:1;
        background:${active ? info.color : 'transparent'};
        color:${active ? '#fff' : info.color};
        border:none;
        border-bottom:3px solid ${active ? info.color : 'transparent'};
        padding:10px 8px 8px;
        cursor:pointer;
        font-family:inherit;
        font-size:0.85em;
        font-weight:${active ? 'bold' : 'normal'};
        transition:all 0.15s;
        border-radius:${active ? '8px 8px 0 0' : '0'};
      ">${FACTION_LABELS[info.id]}派 <span style="font-size:0.8em; opacity:0.7;">(${count})</span></button>`;
    }).join('');

    // 派閥説明
    const descHtml = `
      <div style="
        background:${activeInfo.color}10;
        border-left:4px solid ${activeInfo.color};
        border-radius:0 8px 8px 0;
        padding:10px 14px;
        margin:0 16px 12px;
      ">
        <div style="font-weight:bold; color:${activeInfo.color}; font-size:0.9em; margin-bottom:4px;">
          ${activeInfo.platform}
        </div>
        <div style="font-size:0.8em; color:#666; line-height:1.6;">
          ${activeInfo.description}
        </div>
        ${activeCandidate ? `
          <div style="font-size:0.78em; color:#888; margin-top:6px;">
            候補者: <span style="font-weight:bold; color:${activeInfo.color};">${activeCandidate.name}</span>
          </div>
        ` : ''}
      </div>
    `;

    // カード
    const factionStudents = this.students.filter(s => this.getSupportFaction(s) === this.activeTab);
    const cardsHtml = factionStudents.map(s => this.renderCard(s)).join('');

    this.container.innerHTML = `
      <div style="
        text-align:center; padding:20px 16px 0;
        flex-shrink:0;
      ">
        <h1 style="font-size:1.3em; color:#333; margin:0 0 4px;">キャラクター選択</h1>
        <p style="font-size:0.85em; color:#888; margin:0 0 16px;">あなたの分身となる生徒を選んでください</p>
      </div>
      <div style="
        display:flex; gap:0;
        padding:0 16px;
        flex-shrink:0;
        border-bottom:1px solid #e0e8f0;
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
        background:#e8f0fa; color:#3a5080;
        border-radius:10px; padding:1px 7px; font-size:0.75em;
      ">${ATTRIBUTE_LABELS[a] ?? a}</span>`
    ).join(' ');

    const hobbiesLiked = Object.entries(s.hobbies)
      .filter(([, pref]) => pref === 'like')
      .map(([h]) => HOBBY_LABELS[h] ?? h)
      .join('、');

    const statsBar = (label: string, value: number, color: string) => `
      <div style="display:flex; align-items:center; gap:6px; font-size:0.75em;">
        <span style="width:24px; color:#888;">${label}</span>
        <div style="flex:1; height:6px; background:#e0e8f0; border-radius:3px; overflow:hidden;">
          <div style="width:${value}%; height:100%; background:${color}; border-radius:3px;"></div>
        </div>
        <span style="width:20px; text-align:right; color:#555;">${value}</span>
      </div>
    `;

    const supportCandidateId = this.activeTab;
    const supportCandidate = CANDIDATES.find(c => c.id === supportCandidateId);

    return `
      <button data-student-id="${s.id}" style="
        background:rgba(255,255,255,0.9);
        border:2px solid #e0eaf5;
        border-radius:14px; padding:14px;
        cursor:pointer; text-align:left;
        font-family:inherit;
        transition:border-color 0.15s, box-shadow 0.15s;
      " onpointerenter="this.style.borderColor='${supportCandidate?.color ?? '#4A90D9'}';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'"
         onpointerleave="this.style.borderColor='#e0eaf5';this.style.boxShadow='none'">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
          ${s.portrait
            ? `<img src="${s.portrait}" alt="${s.name}" style="
                width:56px; height:56px; border-radius:50%;
                object-fit:cover; object-position:top;
                border:3px solid ${supportCandidate?.color ?? '#d0e0f0'}; flex-shrink:0;
              "/>`
            : renderInitialIcon(s.name, s.personality, 56, supportCandidate?.color ?? '#d0e0f0')
          }
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:1em; font-weight:bold; color:#333;">${s.name}</span>
            </div>
            <div style="font-size:0.8em; color:#888;">
              ${s.className}　${PERSONALITY_LABELS[s.personality] ?? s.personality}
            </div>
            <div style="font-size:0.78em; color:#999;">「${getCatchphrase(s.personality, s.attributes)}」</div>
          </div>
        </div>

        <div style="margin-bottom:8px;">
          ${attrsHtml}
        </div>

        <div style="display:flex; flex-direction:column; gap:3px; margin-bottom:8px;">
          ${statsBar('弁', s.stats.speech, '#4A90D9')}
          ${statsBar('運', s.stats.athletic, '#E74C3C')}
          ${statsBar('知', s.stats.intel, '#27AE60')}
        </div>

        <div style="font-size:0.78em; color:#888;">
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
