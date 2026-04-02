import type { Student, CandidateId } from '../types';
import { ATTRIBUTE_LABELS, HOBBY_LABELS, CANDIDATES, FACTION_LABELS, getCatchphrase, renderInitialIcon } from '../data';

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

  constructor(students: Student[], callbacks: CharacterSelectCallbacks) {
    this.students = students;
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  private render(): void {
    this.container.style.cssText = `
      position:fixed; inset:0;
      background:linear-gradient(160deg, #E8F4FD 0%, #FFF9E6 100%);
      display:flex; flex-direction:column;
      align-items:center; justify-content:flex-start;
      font-family:'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;
      overflow-y:auto; padding:24px 16px; box-sizing:border-box;
    `;

    const cardsHtml = this.students.map(s => this.renderCard(s)).join('');

    this.container.innerHTML = `
      <div style="max-width:560px; width:100%;">
        <h1 style="
          font-size:1.3em; color:#333; text-align:center;
          margin-bottom:4px;
        ">キャラクター選択</h1>
        <p style="
          font-size:0.85em; color:#888; text-align:center;
          margin-bottom:20px;
        ">あなたの分身となる生徒を選んでください</p>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${cardsHtml}
        </div>
      </div>
    `;

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

    // 支持候補
    const supportCandidateId = (['conservative', 'progressive', 'sports'] as CandidateId[])
      .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
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
              <span style="
                font-size:0.7em; padding:1px 8px; border-radius:8px;
                background:${supportCandidate?.color ?? '#888'}22;
                color:${supportCandidate?.color ?? '#888'};
                border:1px solid ${supportCandidate?.color ?? '#888'}44;
              ">${FACTION_LABELS[supportCandidateId] ?? ''}派</span>
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
