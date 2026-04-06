import type { Student, FactionId, FactionInfo } from '../types';
import {
  FACTION_INFO, FACTION_LABELS, getCatchphrase, renderInitialIcon,
  CLUB_LABELS,
} from '../data';
import { ORGANIZATIONS } from '../data/organizations';
import { showConfirmDialog } from '../ui/gameDialog';
import { t } from '../i18n';
import dailyBg from '../../assets/backgrounds/daily.jpg';
import type { Screen } from './Screen';

/** 生徒の所属情報を役職付きで返す（クラスと部活） */
function getAffiliationLabels(studentId: string, className: string, clubId: string | null): string[] {
  const labels: string[] = [];

  // クラス
  let classRole = '';
  for (const org of ORGANIZATIONS) {
    if (org.name.startsWith(className)) {
      if (org.leaderId === studentId) classRole = ` ${t('charSelect.representative')}`;
      else if (org.subLeaderIds.includes(studentId)) classRole = ` ${t('charSelect.viceRepresentative')}`;
      break;
    }
  }
  labels.push(`${className}${classRole}`);

  // 部活
  if (clubId) {
    const clubName = CLUB_LABELS[clubId] ?? clubId;
    let clubRole = '';
    for (const org of ORGANIZATIONS) {
      if (org.id === `club_${clubId}` || org.id === clubId) {
        if (org.leaderId === studentId) clubRole = ` ${t('charSelect.representative')}`;
        else if (org.subLeaderIds.includes(studentId)) clubRole = ` ${t('charSelect.viceRepresentative')}`;
        break;
      }
    }
    labels.push(`${clubName}${clubRole}`);
  }

  return labels;
}

export interface CharacterSelectCallbacks {
  onSelect: (student: Student) => void;
  onBack: () => void;
  /** 派閥切り替え。startAt: 遷移先で最初/最後のキャラを選択 */
  onChangeFaction: (delta: -1 | 1, startAt: 'first' | 'last') => void;
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

  constructor(students: Student[], faction: FactionId, callbacks: CharacterSelectCallbacks, startAt: 'first' | 'last' = 'first') {
    this.students = students;
    this.faction = faction;
    this.factionInfo = FACTION_INFO.find(c => c.id === faction)!;
    this.callbacks = callbacks;
    this.selectedStudent = startAt === 'last' ? students[students.length - 1] : students[0];
    this.container = document.createElement('div');
    this.render();
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
    const selIdx = this.students.indexOf(sel);
    const isFirst = selIdx <= 0;
    const isLast = selIdx >= this.students.length - 1;
    const factionIds = FACTION_INFO.map(f => f.id);
    const fIdx = factionIds.indexOf(this.faction);
    const prevFaction = FACTION_INFO[(fIdx - 1 + factionIds.length) % factionIds.length];
    const nextFaction = FACTION_INFO[(fIdx + 1) % factionIds.length];

    const fSuffix = t('charSelect.factionSuffix');

    // --- Faction header bar ---
    const headerHtml = `
      <div style="
        display:flex; align-items:center; padding:8px 16px 0; flex-shrink:0; gap:8px;
      ">
        <button class="back-btn game-btn" style="
          background:linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
          border-left-color:rgba(255,255,255,0.3);
          padding:6px 12px; font-size:0.8em; color:rgba(255,255,255,0.7);
        ">${t('charSelect.back')}</button>
        <div style="flex:1; text-align:center;">
          <h1 style="
            font-size:1.1em; margin:0; font-weight:900;
            color:#e0e8f0; text-shadow:0 2px 4px rgba(0,0,0,0.5);
            letter-spacing:0.1em;
          ">${t('charSelect.title')}</h1>
        </div>
        <div style="width:60px;"></div>
      </div>
      <div style="
        padding:4px 16px; font-size:0.75em; text-align:center;
        background:${info.color}20; border-top:1px solid ${info.color}40;
        border-bottom:1px solid ${info.color}40; color:rgba(255,255,255,0.7);
        margin-top:4px;
      ">
        <strong style="color:${info.accentColor};">${info.platform}</strong>
        <span style="margin-left:8px; opacity:0.7;">${info.description}</span>
      </div>
    `;

    // --- Arrow buttons ---
    const arrowBtnStyle = `
      background:none; border:none; cursor:pointer;
      padding:4px 6px; flex-shrink:0; transition:color 0.15s;
      display:flex; flex-direction:column; align-items:center; gap:2px;
    `;

    const prevColor = isFirst ? prevFaction.color : 'rgba(255,255,255,0.5)';
    const prevLabel = isFirst
      ? `<span style="font-size:0.55em; color:${prevFaction.accentColor}; white-space:nowrap;">${FACTION_LABELS[prevFaction.id]}${fSuffix}</span>`
      : '';

    const nextColor = isLast ? nextFaction.color : 'rgba(255,255,255,0.5)';
    const nextLabel = isLast
      ? `<span style="font-size:0.55em; color:${nextFaction.accentColor}; white-space:nowrap;">${FACTION_LABELS[nextFaction.id]}${fSuffix}</span>`
      : '';

    // --- Character showcase ---
    const showcaseHtml = `
      <div class="showcase-area" style="flex:1; display:flex; align-items:center;
        padding:8px 0; min-height:0; overflow:hidden; touch-action:pan-y;">

        <!-- Left arrow -->
        <button class="arrow-prev" style="${arrowBtnStyle}">
          <span style="font-size:1.3em; color:${prevColor};">◀</span>
          ${prevLabel}
        </button>

        <!-- Center content -->
        <div style="flex:1; display:flex; flex-direction:column; align-items:center;
          gap:4px; min-height:0; overflow-y:auto; padding:4px 8px;">

          <!-- Portrait -->
          <div style="position:relative; flex-shrink:0;">
            ${sel.portrait
              ? `<img src="${sel.portrait}" alt="${sel.name}" style="
                  width:150px; height:150px; border-radius:8px;
                  object-fit:cover; object-position:top;
                  border:3px solid ${info.color};
                  box-shadow:0 0 20px ${info.color}60, 0 4px 12px rgba(0,0,0,0.4);
                "/>`
              : renderInitialIcon(sel.name, sel.personality, 150, info.color)
            }
            <!-- Faction badge -->
            <div style="
              position:absolute; bottom:-6px; left:50%; transform:translateX(-50%);
              background:${info.color}; color:#fff;
              font-size:0.65em; font-weight:bold; padding:1px 10px;
              border-radius:4px; white-space:nowrap;
              box-shadow:0 2px 4px rgba(0,0,0,0.3);
            ">${FACTION_LABELS[info.id]}${fSuffix}</div>
          </div>

          <!-- Name & info -->
          <div style="text-align:center; margin-top:4px;">
            <div style="font-size:1.2em; font-weight:900; letter-spacing:0.05em;
              text-shadow:0 2px 4px rgba(0,0,0,0.5);">
              ${sel.name}
              <span style="font-size:0.6em; font-weight:400; opacity:0.6; margin-left:4px;">（${sel.nickname}）</span>
            </div>
            <div style="font-size:0.75em; opacity:0.7;">
              ${sel.gender === 'male' ? '♂' : '♀'}　${getAffiliationLabels(sel.id, sel.className, sel.clubId).join('　')}
            </div>
            <div style="font-size:0.75em; color:#f0d060; font-style:italic;">
              「${getCatchphrase(sel.personality, sel.attributes)}」
            </div>
          </div>

          <!-- Description -->
          <div style="
            font-size:0.72em; line-height:1.5; color:rgba(255,255,255,0.75);
            background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1);
            border-radius:4px; padding:6px 10px;
            max-width:380px; text-align:center;
          ">${sel.description}</div>

          <!-- Stats (inline) -->
          <div style="
            display:flex; gap:12px; align-items:center; justify-content:center;
          ">
            ${this.renderStatInline(t('charSelect.statSpeech'), sel.stats.speech, '#5baef5')}
            ${this.renderStatInline(t('charSelect.statAthletic'), sel.stats.athletic, '#E74C3C')}
            ${this.renderStatInline(t('charSelect.statIntel'), sel.stats.intel, '#2ECC71')}
          </div>

          <!-- Select button -->
          <button class="select-character-btn game-btn" style="
            margin-top:4px; padding:8px 36px;
            background:linear-gradient(135deg, ${info.color} 0%, ${info.accentColor} 100%);
            border-left-color:${info.color};
            font-size:0.95em;
            box-shadow:0 0 15px ${info.color}40, 2px 2px 4px rgba(0,0,0,0.3);
            flex-shrink:0;
          ">${t('charSelect.selectBtn')}</button>
        </div>

        <!-- Right arrow -->
        <button class="arrow-next" style="${arrowBtnStyle}">
          <span style="font-size:1.3em; color:${nextColor};">▶</span>
          ${nextLabel}
        </button>
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
        border-radius:4px; transition:all 0.2s;
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
        padding:6px 16px 8px; overflow-x:auto;
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

  private renderStatInline(statLabel: string, value: number, color: string): string {
    return `
      <div style="display:flex; align-items:center; gap:4px;">
        <span style="font-size:0.65em; color:rgba(255,255,255,0.5);">${statLabel}</span>
        <div style="
          width:48px; height:5px; background:rgba(255,255,255,0.1);
          border-radius:3px; overflow:hidden;
        ">
          <div style="
            width:${value}%; height:100%;
            background:linear-gradient(90deg, ${color}, ${color}cc);
            border-radius:2px;
          "></div>
        </div>
        <span style="font-size:0.75em; font-weight:bold; color:${color};
          text-shadow:0 0 6px ${color}40;">${value}</span>
      </div>
    `;
  }

  /** 前後のキャラに移動。端なら派閥を切り替え */
  private navigate(delta: -1 | 1): void {
    const idx = this.students.indexOf(this.selectedStudent);
    const next = idx + delta;
    if (next >= 0 && next < this.students.length) {
      this.selectedStudent = this.students[next];
      this.render();
    } else {
      this.callbacks.onChangeFaction(delta, delta === 1 ? 'first' : 'last');
    }
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
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          this.navigate(dx < 0 ? 1 : -1);
        }
      });
    }

    // Arrow buttons
    const prevBtn = this.container.querySelector<HTMLButtonElement>('.arrow-prev');
    const nextBtn = this.container.querySelector<HTMLButtonElement>('.arrow-next');
    prevBtn?.addEventListener('pointerup', () => this.navigate(-1));
    nextBtn?.addEventListener('pointerup', () => this.navigate(1));

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

    // Select button → confirm dialog
    const selectBtn = this.container.querySelector<HTMLButtonElement>('.select-character-btn');
    if (selectBtn) {
      const student = this.selectedStudent;
      selectBtn.addEventListener('pointerup', () => {
        showConfirmDialog(this.container, {
          title: t('charSelect.confirmTitle'),
          message: t('charSelect.confirmMsg', { name: student.name }),
          okLabel: t('charSelect.confirmOk'),
          cancelLabel: t('charSelect.confirmCancel'),
          okStyle: 'primary',
        }).then((confirmed) => {
          if (confirmed) this.callbacks.onSelect(student);
        });
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
