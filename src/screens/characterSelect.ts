import type { Student, FactionId, FactionInfo } from '../types';
import {
  FACTION_INFO, FACTION_LABELS, getCatchphrase, renderInitialIcon,
  CLUB_LABELS,
} from '../data';
import dailyBg from '../../assets/backgrounds/daily.jpg';
import type { Screen } from './Screen';

export interface CharacterSelectCallbacks {
  onSelect: (student: Student) => void;
  onBack: () => void;
}

export class CharacterSelectScreen implements Screen {
  private container: HTMLDivElement;
  private students: Student[];
  private faction: FactionId;
  private factionInfo: FactionInfo;
  private callbacks: CharacterSelectCallbacks;
  private selectedStudent: Student;
  private swipeStartX = 0;
  private swipeStartY = 0;

  constructor(students: Student[], faction: FactionId, callbacks: CharacterSelectCallbacks) {
    this.students = students;
    this.faction = faction;
    this.factionInfo = FACTION_INFO.find(c => c.id === faction)!;
    this.callbacks = callbacks;
    this.selectedStudent = students[0];
    this.container = document.createElement('div');
    this.render();
  }

  private switchStudent(delta: number): void {
    const idx = this.students.indexOf(this.selectedStudent);
    const next = idx + delta;
    if (next >= 0 && next < this.students.length) {
      this.selectedStudent = this.students[next];
      this.render();
    }
  }

  private render(): void {
    this.container.style.cssText = `
      position:fixed; inset:0;
      background:linear-gradient(160deg, rgba(15,25,50,0.85) 0%, rgba(30,50,80,0.85) 100%),
        url('${dailyBg}') center/cover no-repeat;
      display:flex; flex-direction:column;
      font-family:var(--game-font);
      overflow:hidden; box-sizing:border-box;
      color:#e0e8f0;
    `;

    const info = this.factionInfo;
    const sel = this.selectedStudent;
    const clubLabel = sel.clubId ? (CLUB_LABELS[sel.clubId] ?? sel.clubId) : null;

    // --- Faction header bar ---
    const headerHtml = `
      <div style="
        display:flex; align-items:center; padding:12px 16px 0; flex-shrink:0; gap:8px;
      ">
        <button class="back-btn" style="
          background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
          border-radius:4px; padding:6px 12px; cursor:pointer;
          font-family:var(--game-font); font-size:0.8em; color:rgba(255,255,255,0.6);
          transition:all 0.15s;
        ">◀ 戻る</button>
        <div style="flex:1; text-align:center;">
          <h1 style="
            font-size:1.1em; margin:0; font-weight:900;
            color:#e0e8f0; text-shadow:0 2px 4px rgba(0,0,0,0.5);
            letter-spacing:0.1em;
          ">キャラクター選択</h1>
        </div>
        <div style="width:60px;"></div>
      </div>
      <div style="
        padding:6px 16px; font-size:0.78em; text-align:center;
        background:${info.color}20; border-top:1px solid ${info.color}40;
        border-bottom:1px solid ${info.color}40; color:rgba(255,255,255,0.7);
        margin-top:8px;
      ">
        <strong style="color:${info.accentColor};">${info.platform}</strong>
        <span style="margin-left:8px; opacity:0.7;">${info.description}</span>
      </div>
    `;

    // --- Character showcase ---
    const showcaseHtml = `
      <div class="showcase-area" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;
        padding:12px 16px; gap:8px; min-height:0; overflow-y:auto; touch-action:pan-y;">

        <!-- Portrait -->
        <div style="position:relative; flex-shrink:0;">
          ${sel.portrait
            ? `<img src="${sel.portrait}" alt="${sel.name}" style="
                width:180px; height:180px; border-radius:8px;
                object-fit:cover; object-position:top;
                border:3px solid ${info.color};
                box-shadow:0 0 20px ${info.color}60, 0 4px 12px rgba(0,0,0,0.4);
              "/>`
            : renderInitialIcon(sel.name, sel.personality, 180, info.color)
          }
          <!-- Faction badge -->
          <div style="
            position:absolute; bottom:-8px; left:50%; transform:translateX(-50%);
            background:${info.color}; color:#fff;
            font-size:0.7em; font-weight:bold; padding:2px 12px;
            border-radius:4px; white-space:nowrap;
            box-shadow:0 2px 4px rgba(0,0,0,0.3);
          ">${FACTION_LABELS[info.id]}派</div>
        </div>

        <!-- Dot indicator -->
        <div style="display:flex; gap:6px; align-items:center; margin-top:4px;">
          ${this.students.map((s, i) => `
            <div style="
              width:${s.id === sel.id ? '10px' : '6px'}; height:${s.id === sel.id ? '10px' : '6px'};
              border-radius:4px;
              background:${s.id === sel.id ? info.accentColor : 'rgba(255,255,255,0.25)'};
              transition:all 0.2s;
            "></div>
          `).join('')}
        </div>

        <!-- Name & info -->
        <div style="text-align:center; margin-top:8px;">
          <div style="font-size:1.3em; font-weight:900; letter-spacing:0.05em;
            text-shadow:0 2px 4px rgba(0,0,0,0.5);">
            ${sel.name}
            <span style="font-size:0.6em; font-weight:400; opacity:0.6; margin-left:4px;">（${sel.nickname}）</span>
          </div>
          <div style="font-size:0.8em; opacity:0.7; margin-top:2px;">
            ${sel.className}　${sel.gender === 'male' ? '♂' : '♀'}${clubLabel ? `　${clubLabel}` : ''}
          </div>
        </div>

        <!-- Catchphrase -->
        <div style="
          font-size:0.85em; color:#f0d060; font-style:italic;
          text-align:center; margin:2px 0;
          text-shadow:0 1px 2px rgba(0,0,0,0.4);
        ">「${getCatchphrase(sel.personality, sel.attributes)}」</div>

        <!-- Description -->
        <div style="
          font-size:0.78em; line-height:1.6; color:rgba(255,255,255,0.75);
          background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1);
          border-radius:6px; padding:8px 12px;
          max-width:400px; text-align:center;
        ">${sel.description}</div>

        <!-- Stats -->
        <div style="
          display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;
          width:100%; max-width:360px; margin-top:4px;
        ">
          ${this.renderStatBlock('弁舌', sel.stats.speech, '#5baef5')}
          ${this.renderStatBlock('運動', sel.stats.athletic, '#E74C3C')}
          ${this.renderStatBlock('知性', sel.stats.intel, '#2ECC71')}
        </div>

        <!-- Select button -->
        <button class="select-character-btn" style="
          margin-top:8px; padding:10px 40px;
          background:linear-gradient(135deg, ${info.color} 0%, ${info.accentColor} 100%);
          color:#fff; border:2px solid rgba(255,255,255,0.3);
          border-radius:4px; font-family:var(--game-font);
          font-size:1em; font-weight:bold; cursor:pointer;
          box-shadow:0 0 15px ${info.color}40, 0 3px 8px rgba(0,0,0,0.3);
          transition:all 0.2s; text-shadow:0 1px 2px rgba(0,0,0,0.4);
          flex-shrink:0;
        ">この生徒を選ぶ</button>
      </div>
    `;

    // --- Character thumbnail strip ---
    const thumbs = this.students.map(s => {
      const isSelected = sel.id === s.id;
      return `<button data-thumb-id="${s.id}" style="
        flex-shrink:0; width:64px; display:flex; flex-direction:column; align-items:center; gap:4px;
        padding:6px 4px; cursor:pointer;
        background:${isSelected ? 'rgba(255,255,255,0.15)' : 'transparent'};
        border:2px solid ${isSelected ? info.color : 'transparent'};
        border-radius:8px; transition:all 0.2s;
        font-family:var(--game-font);
      ">
        ${s.portrait
          ? `<img src="${s.portrait}" alt="${s.name}" style="
              width:48px; height:48px; border-radius:4px;
              object-fit:cover; object-position:top;
              border:2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.2)'};
              box-shadow:${isSelected ? `0 0 8px ${info.color}80` : 'none'};
              transition:all 0.2s;
            "/>`
          : `<div style="
              width:48px; height:48px; border-radius:4px;
              background:rgba(255,255,255,0.1);
              border:2px solid ${isSelected ? '#fff' : 'rgba(255,255,255,0.2)'};
              display:flex; align-items:center; justify-content:center;
              font-size:1.2em; font-weight:bold; color:rgba(255,255,255,0.5);
            ">${s.name[0]}</div>`
        }
        <span style="
          font-size:0.65em; color:${isSelected ? '#fff' : 'rgba(255,255,255,0.5)'};
          font-weight:${isSelected ? 'bold' : 'normal'};
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          max-width:60px; text-align:center;
        ">${s.name}</span>
      </button>`;
    }).join('');

    const thumbnailHtml = `
      <div style="
        display:flex; justify-content:center; gap:4px;
        padding:8px 16px 12px; overflow-x:auto;
        background:rgba(0,0,0,0.3);
        border-top:1px solid rgba(255,255,255,0.08);
      ">${thumbs}</div>
    `;

    // --- Assemble ---
    this.container.innerHTML = `
      ${headerHtml}
      ${showcaseHtml}
      ${thumbnailHtml}
    `;

    this.bindEvents();
  }

  private renderStatBlock(label: string, value: number, color: string): string {
    return `
      <div style="text-align:center;">
        <div style="font-size:0.68em; color:rgba(255,255,255,0.5); margin-bottom:3px;">${label}</div>
        <div style="
          height:6px; background:rgba(255,255,255,0.1);
          border-radius:3px; overflow:hidden;
          border:1px solid rgba(255,255,255,0.08);
        ">
          <div style="
            width:${value}%; height:100%;
            background:linear-gradient(90deg, ${color}, ${color}cc);
            border-radius:2px;
            box-shadow:0 0 6px ${color}60;
          "></div>
        </div>
        <div style="font-size:0.85em; font-weight:bold; color:${color}; margin-top:2px;
          text-shadow:0 0 6px ${color}40;">${value}</div>
      </div>
    `;
  }

  private bindEvents(): void {
    // Swipe on showcase area
    const showcase = this.container.querySelector<HTMLElement>('.showcase-area');
    if (showcase) {
      showcase.addEventListener('pointerdown', (e) => {
        this.swipeStartX = e.clientX;
        this.swipeStartY = e.clientY;
      });
      showcase.addEventListener('pointerup', (e) => {
        const dx = e.clientX - this.swipeStartX;
        const dy = e.clientY - this.swipeStartY;
        // Horizontal swipe: must exceed 50px and be more horizontal than vertical
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          this.switchStudent(dx < 0 ? 1 : -1);
        }
      });
    }

    // Back button
    const backBtn = this.container.querySelector<HTMLButtonElement>('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('pointerup', () => this.callbacks.onBack());
    }

    // Thumbnail events
    this.container.querySelectorAll<HTMLButtonElement>('[data-thumb-id]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        const id = btn.dataset['thumbId'];
        const s = this.students.find(st => st.id === id);
        if (s && s.id !== this.selectedStudent.id) {
          this.selectedStudent = s;
          this.render();
        }
      });
    });

    // Select button
    const selectBtn = this.container.querySelector<HTMLButtonElement>('.select-character-btn');
    if (selectBtn) {
      const student = this.selectedStudent;
      selectBtn.addEventListener('pointerenter', () => {
        selectBtn.style.transform = 'translateY(-2px)';
        selectBtn.style.filter = 'brightness(1.2)';
      });
      selectBtn.addEventListener('pointerleave', () => {
        selectBtn.style.transform = '';
        selectBtn.style.filter = '';
      });
      selectBtn.addEventListener('pointerup', () => {
        this.callbacks.onSelect(student);
      });
    }
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
