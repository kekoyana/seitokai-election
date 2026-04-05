import type { Student, FactionId } from '../types';
import { FACTION_INFO, FACTION_LABELS, getCatchphrase, renderInitialIcon, ALL_FACTION_IDS } from '../data';
import dailyBg from '../../assets/backgrounds/daily.jpg';
import type { Screen } from './Screen';

export interface CharacterSelectCallbacks {
  onSelect: (student: Student) => void;
}

export class CharacterSelectScreen implements Screen {
  private container: HTMLDivElement;
  private students: Student[];
  private callbacks: CharacterSelectCallbacks;
  private activeTab: FactionId | null = null;

  constructor(students: Student[], callbacks: CharacterSelectCallbacks) {
    this.students = students;
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  private getSupportFaction(s: Student): FactionId {
    return ALL_FACTION_IDS
      .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
  }

  private render(): void {
    this.container.style.cssText = `
      position:fixed; inset:0;
      background:linear-gradient(160deg, rgba(210,180,140,0.5) 0%, rgba(245,220,180,0.5) 100%),
        url('${dailyBg}') center/cover no-repeat;
      display:flex; flex-direction:column;
      font-family:var(--game-font);
      overflow:hidden; box-sizing:border-box;
    `;

    const activeInfo = this.activeTab ? FACTION_INFO.find(c => c.id === this.activeTab)! : null;

    // タブ
    const tabsHtml = FACTION_INFO.map(info => {
      const active = info.id === this.activeTab;
      const count = this.students.filter(s => this.getSupportFaction(s) === info.id).length;
      return `<button class="faction-tab" data-faction="${info.id}" style="
        flex:1;
        background:${active ? info.color : '#e8eef5'};
        color:${active ? '#fff' : '#6070a0'};
        border:2px solid ${active ? info.color : 'transparent'};
        border-bottom:${active ? 'none' : '2px solid var(--game-panel-border)'};
        padding:10px 8px 8px;
        cursor:pointer;
        font-family:var(--game-font);
        font-size:0.85em;
        font-weight:bold;
        transition:all 0.15s;
        border-radius:6px 6px 0 0;
        text-shadow:${active ? '0 1px 1px rgba(0,0,0,0.3)' : 'none'};
      ">${FACTION_LABELS[info.id]}派 <span style="font-size:0.8em; opacity:0.7;">(${count})</span></button>`;
    }).join('');

    // 派閥説明 or 未選択メッセージ
    let descHtml: string;
    if (activeInfo) {
      descHtml = `
        <div class="game-panel-light" style="
          border-left:4px solid ${activeInfo.color};
          margin:0 16px 12px;
        ">
          <div style="font-weight:bold; color:${activeInfo.color}; font-size:0.9em; margin-bottom:4px;">
            ${activeInfo.platform}
          </div>
          <div style="font-size:0.8em; color:var(--game-text-dim); line-height:1.6;">
            ${activeInfo.description}
          </div>
        </div>
      `;
    } else {
      descHtml = `
        <div class="game-panel-light" style="
          margin:0 16px 12px;
          text-align:center;
        ">
          <div style="font-size:0.95em; color:var(--game-heading-accent); margin-bottom:4px;">
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
        const faction = btn.dataset['faction'] as FactionId;
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
    const statsBar = (label: string, value: number, color: string) => `
      <div style="display:flex; align-items:center; gap:6px; font-size:0.75em;">
        <span style="width:28px; color:var(--game-text-dim); font-weight:700;">${label}</span>
        <div style="flex:1; height:8px; background:#d8e0e8; border:1px solid #b0b8c8; border-radius:3px; overflow:hidden;">
          <div style="width:${value}%; height:100%; background:${color}; box-shadow:inset 0 -1px 0 rgba(0,0,0,0.15); border-radius:2px;"></div>
        </div>
        <span style="width:20px; text-align:right; color:var(--game-text); font-weight:700;">${value}</span>
      </div>
    `;

    const supportFactionId = this.activeTab;
    const supportFaction = supportFactionId ? FACTION_INFO.find(f => f.id === supportFactionId) : null;

    return `
      <button data-student-id="${s.id}" class="game-chara-card" style="
        cursor:pointer; text-align:left;
        font-family:var(--game-font);
      " onpointerenter="this.style.borderColor='${supportFaction?.color ?? '#4A90D9'}';this.style.boxShadow='0 0 12px ${supportFaction?.color ?? '#4A90D9'}40'"
         onpointerleave="this.style.borderColor='#b0c0d8';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.08)'">
        <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:10px;">
          ${s.portrait
            ? `<img src="${s.portrait}" alt="${s.name}" style="
                width:112px; height:112px; border-radius:4px;
                object-fit:cover; object-position:top;
                border:2px solid ${supportFaction?.color ?? '#b0c0d8'}; flex-shrink:0;
                box-shadow:0 2px 4px rgba(0,0,0,0.12);
              "/>`
            : renderInitialIcon(s.name, s.personality, 112, supportFaction?.color ?? '#4a6090')
          }
          <div style="flex:1; min-width:0;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="font-size:1em; font-weight:bold; color:var(--game-text);">${s.name}</span>
              <span style="font-size:0.75em; color:var(--game-text-dim);">（${s.nickname}）</span>
            </div>
            <div style="font-size:0.8em; color:var(--game-text-dim);">
              ${s.className}　${s.gender === 'male' ? '♂' : '♀'}
            </div>
            <div style="font-size:0.78em; color:var(--game-heading-accent); margin-bottom:6px;">「${getCatchphrase(s.personality, s.attributes)}」</div>
            <div style="font-size:0.78em; color:var(--game-text-dim); line-height:1.5;
              background:var(--game-panel-inner); border-radius:6px; padding:6px 8px; border:1px solid #c8d8e8;">
              ${s.description}
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:3px;">
          ${statsBar('弁舌', s.stats.speech, '#4A90D9')}
          ${statsBar('運動', s.stats.athletic, '#E74C3C')}
          ${statsBar('知性', s.stats.intel, '#27AE60')}
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
