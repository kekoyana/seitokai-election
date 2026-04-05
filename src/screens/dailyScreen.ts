import type { GameState, Student, LocationId, ActionType, Floor } from '../types';
import {
  LOCATIONS, FACTION_INFO, FACTION_LABELS, getStudentLocation,
  HOBBY_LABELS, getCatchphrase, renderInitialIcon,
  isCorridorLocation, getFloorFromLocation, FLOOR_LABELS, ALL_FACTION_IDS,
  renderSupportBar, MAX_TIME, TIME_COST,
  CLUB_LABELS, dayToDate, formatTime, getAffinityInfo,
} from '../data';
import { ORGANIZATIONS } from '../data/organizations';
import { getOrganizationVote } from '../logic/organizationLogic';
import { bgm } from '../bgm';
import dailyBg from '../../assets/backgrounds/daily.jpg';
import type { ConversationStep, ConversationResult } from '../logic/conversationGenerator';
import { ConversationOverlay } from './conversationOverlay';
import { showConfirmDialog } from '../ui/gameDialog';
import { renderCorridorView } from './daily/mapRenderer';
import { renderInfoPanel, renderOrgInfoSection, renderInfoHeader } from './daily/infoPanel';
import type { InfoPanelState } from './daily/infoPanel';
import { on, onDataAttr } from '../ui/dom';
import type { Screen } from './Screen';

/** 時間帯に応じたオーバーレイCSS（夕焼け→夜） */
function getTimeOverlayStyle(currentTime: number): string {
  // 0-90分 (15:00-16:30): 通常 → なし
  // 90-150分 (16:30-17:30): 夕焼け（オレンジ）
  // 150-240分 (17:30-19:00): 夕暮れ→夜（暗く）
  if (currentTime <= 90) return 'background:transparent;';
  if (currentTime <= 150) {
    const t = (currentTime - 90) / 60; // 0→1
    const opacity = t * 0.3;
    return `background:rgba(255,140,50,${opacity.toFixed(3)});`;
  }
  // 150-240: オレンジから暗い青紫へ
  const t = (currentTime - 150) / 90; // 0→1
  const r = Math.round(255 * (1 - t) + 30 * t);
  const g = Math.round(140 * (1 - t) + 20 * t);
  const b = Math.round(50 * (1 - t) + 80 * t);
  const opacity = 0.3 + t * 0.25;
  return `background:rgba(${r},${g},${b},${opacity.toFixed(3)});`;
}

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
  onGossip: (student: Student) => void;
  onPersuade: (student: Student) => void;
  onNurseRest: () => void;
  onTrain: (stat: 'speech' | 'athletic' | 'intel') => void;
  onDeliverLostItem: () => void;
  onDeliverErrand: () => void;
  onNextDay: () => void;
  onPersuadeTutorial: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export class DailyScreen implements Screen {
  private container: HTMLDivElement;
  private state: GameState;
  private callbacks: DailyCallbacks;
  private showStudentInfo: Student | null = null;
  private showPlayerInfo: boolean = false;
  private showLog: boolean = false;
  private showSystemMenu: boolean = false;
  // 情報パネル: タブ + ドリルダウン（組織詳細 or 生徒一覧→生徒詳細）
  private infoPanel: InfoPanelState | null = null;
  private conversationOverlay: ConversationOverlay | null = null;

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
      getStudentLocation(s.id, this.state.timeSlot, this.state.day, this.state.currentTime) === this.state.currentLocation
    );
  }

  private getFactionColor(): string {
    const f = FACTION_INFO.find(f => f.id === this.state.faction);
    return f ? f.color : '#1B3A6B';
  }

  private render(): void {
    const factionInfo = FACTION_INFO.find(f => f.id === this.state.faction);
    const candidateColor = this.getFactionColor();
    const studentsHere = this.getStudentsAtLocation();
    const currentLocation = LOCATIONS.find(l => l.id === this.state.currentLocation);
    const isTimeUp = this.state.currentTime >= MAX_TIME;
    const isOutOfStamina = this.state.stamina <= 0 || isTimeUp;

    this.container.style.cssText = `
      position: fixed; inset: 0;
      background: linear-gradient(160deg, rgba(210,180,140,0.5) 0%, rgba(245,220,180,0.5) 100%),
        url('${dailyBg}') center/cover no-repeat;
      display: flex; flex-direction: column;
      font-family: var(--game-font);
      overflow: hidden;
    `;

    const pc = this.state.playerCharacter;

    // フローティングHUD（左上: プレイヤー、右上: ステータス）
    const hudHtml = `
      <div style="
        position:absolute; top:0; left:0; right:0;
        display:flex; justify-content:space-between; align-items:flex-start;
        padding:10px 12px; pointer-events:none; z-index:10;
      ">
        <div id="player-icon" class="game-hud-badge" style="
          pointer-events:auto; cursor:pointer;
          display:flex; align-items:center; gap:6px;
          background:${candidateColor}CC;
          border-color:${candidateColor};
          padding:3px 10px 3px 3px;
        ">
          ${pc ? (pc.portrait
            ? `<img src="${pc.portrait}" alt="${pc.name}" style="
                width:28px; height:28px; border-radius:3px;
                object-fit:cover; object-position:top;
                border:1px solid rgba(255,255,255,0.5);
              "/>`
            : renderInitialIcon(pc.name, pc.personality, 28, 'rgba(255,255,255,0.5)')
          ) : ''}
          <span style="font-weight:bold; color:#fff; font-size:0.85em;">${pc?.name ?? ''}</span>
          <span style="opacity:0.8; font-size:0.75em; color:#fff;">${FACTION_LABELS[this.state.faction ?? 'conservative'] ?? ''}派</span>
        </div>
        <div class="game-hud-badge" style="
          pointer-events:auto;
          display:flex; gap:6px; align-items:center;
        ">
          <span style="font-size:0.85em;">${isCorridorLocation(this.state.currentLocation) ? `${FLOOR_LABELS[getFloorFromLocation(this.state.currentLocation)]} 廊下` : currentLocation?.name ?? ''}</span>
          <span style="opacity:0.3;">|</span>
          <div style="display:flex; flex-direction:column; align-items:center; line-height:1.1; font-size:0.75em; min-width:35px;">
            <strong>${dayToDate(this.state.day)}</strong>
            <strong style="color:var(--game-accent);">${formatTime(this.state.currentTime)}</strong>
          </div>
          <span style="opacity:0.3;">|</span>
          <span>⚡<strong>${this.state.stamina}</strong></span>
          <span style="opacity:0.3;">|</span>
          <span id="system-menu-btn" style="cursor:pointer; font-size:0.8em; line-height:1; padding:2px 6px; border:1px solid rgba(0,0,0,0.15); border-radius:4px;">⚙</span>
        </div>
      </div>
    `;

    // システムメニューダイアログ
    let systemMenuHtml = '';
    if (this.showSystemMenu) {
      const volPct = Math.round(bgm.volume * 100);
      systemMenuHtml = `
        <div class="game-dialog-overlay" id="system-menu-overlay" style="
          position:absolute; inset:0; z-index:200;
          background:rgba(0,0,20,0.4);
          display:flex; align-items:center; justify-content:center;
          animation: fadeIn 0.2s ease;
        ">
          <div class="game-panel" style="width:300px; padding:24px; text-align:center;">
            <div style="font-weight:bold; margin-bottom:16px; color:var(--game-heading); font-size:1.1em;">システム</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <button id="sys-save-btn" class="game-btn game-btn-primary" style="padding:10px 16px; width:100%; font-family:var(--game-font);">セーブ</button>
              <button id="sys-load-btn" class="game-btn game-btn-warning" style="padding:10px 16px; width:100%; font-family:var(--game-font);">ロード</button>
              <div style="margin-top:4px;">
                <div style="font-size:0.85em; color:var(--game-text); margin-bottom:8px;">音量調整</div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span id="sys-bgm-icon" style="font-size:1.2em;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
                  <input id="sys-bgm-slider" type="range" min="0" max="100" value="${volPct}" style="
                    flex:1; height:6px; cursor:pointer;
                    accent-color:var(--game-accent);
                  "/>
                  <span id="sys-bgm-label" style="font-size:0.9em; width:35px; text-align:right;">${volPct}%</span>
                </div>
              </div>
              <button id="sys-tutorial-btn" class="game-btn game-btn-success" style="padding:10px 16px; width:100%; font-family:var(--game-font);">チュートリアル（説得の遊び方）</button>
              <button id="sys-close-btn" class="game-btn game-btn-disabled" style="padding:10px 16px; width:100%; font-family:var(--game-font); opacity:1; cursor:pointer;">閉じる</button>
            </div>
          </div>
        </div>
      `;
    }

    // フッターは廃止（場所情報はHUD・廊下ヘッダで十分）

    // メインコンテンツ
    let mainHtml = '';
    const inCorridor = isCorridorLocation(this.state.currentLocation);

    if (this.showPlayerInfo && pc) {
      const playerStudent = this.state.students.find(s => s.id === pc.id);
      if (playerStudent) {
        mainHtml = this.renderStudentDetailCard(playerStudent, 'close', true);
      }
    } else if (this.showStudentInfo) {
      mainHtml = this.renderStudentInfo(this.showStudentInfo);
    } else if (this.infoPanel) {
      mainHtml = renderInfoPanel({
        state: this.state,
        infoPanel: this.infoPanel,
        getFactionColor: () => this.getFactionColor(),
        renderStudentDetailCard: (s, backAction, isPlayer) => this.renderStudentDetailCard(s, backAction, isPlayer),
      });
    } else if (inCorridor) {
      mainHtml = renderCorridorView(
        { state: this.state },
        (isOutOfStamina) => this.renderEndDayPanel(isOutOfStamina),
      );
    } else {
      mainHtml = this.renderMainPanel(studentsHere, isOutOfStamina);
    }

    // ログボックス（画面下部固定）
    const logs = this.state.actionLogs;
    const hasMany = logs.length > 2;
    const visibleLogs = this.showLog
      ? [...logs].reverse()
      : logs.length > 0 ? logs.slice(-2).reverse() : [];
    const toggleIcon = this.showLog ? '▲' : (hasMany ? '▼' : '');
    const logBoxHtml = `
      <div id="log-box" class="game-panel" style="
        flex-shrink:0;
        padding:8px 12px;
        font-size:0.78em; line-height:1.6;
        cursor:pointer;
        border-radius:0;
        border-left:none; border-right:none; border-bottom:none;
        ${this.showLog ? 'max-height:40vh; overflow-y:auto;' : ''}
      ">
        ${toggleIcon ? `<div style="text-align:center; font-size:0.7em; color:var(--game-text-dim); margin-bottom:2px;">${toggleIcon}</div>` : ''}
        ${visibleLogs.length === 0
          ? '<span style="color:var(--game-text-dim);">...</span>'
          : visibleLogs.map((log, i) => `
            <div style="
              white-space:pre-line;
              ${this.showLog && i < visibleLogs.length - 1 ? 'padding-bottom:4px; margin-bottom:4px; border-bottom:1px solid rgba(0,0,0,0.08);' : ''}
              ${!this.showLog && i > 0 ? 'opacity:0.6;' : ''}
            ">${log}</div>
          `).join('')
        }
      </div>
    `;

    // 時間帯オーバーレイ（夕焼け→夜）
    const timeOverlayHtml = `
      <div style="
        position:absolute; inset:0;
        ${getTimeOverlayStyle(this.state.currentTime)}
        pointer-events:none; z-index:1;
        transition: background 0.5s ease;
      "></div>
    `;

    // 時間切れモーダル
    const timeUpModalHtml = isTimeUp ? `
      <div id="timeup-modal" style="
        position:absolute; inset:0; z-index:100;
        background:rgba(0,0,0,0.6);
        display:flex; align-items:center; justify-content:center;
        animation: fadeIn 0.4s ease;
      ">
        <div style="
          background:linear-gradient(180deg, #2a2040 0%, #1a1030 100%);
          border:2px solid #8070a0;
          border-radius:16px;
          padding:32px 40px;
          text-align:center;
          box-shadow:0 8px 32px rgba(0,0,0,0.5);
          max-width:320px;
        ">
          <div style="font-size:1.5em; margin-bottom:12px;">🌙</div>
          <p style="color:#e0d8f0; font-size:0.95em; line-height:1.6; margin-bottom:20px;">
            もう遅い時間だ…<br>今日はここまでにしよう
          </p>
          <button id="timeup-next-day-btn" style="
            padding:12px 36px;
            background:linear-gradient(135deg,#6a5acd,#483d8b);
            color:#fff; border:2px solid #8878c8;
            border-radius:50px;
            font-size:1em; font-weight:bold;
            cursor:pointer; font-family:inherit;
            box-shadow:0 4px 12px rgba(72,61,139,0.4);
            transition: transform 0.1s;
          " onpointerdown="this.style.transform='scale(0.95)'"
             onpointerup="this.style.transform='scale(1)'"
          >翌日へ →</button>
        </div>
      </div>
    ` : '';

    // PC用サイドバー（情報・翌日ボタン）
    const sidebarHtml = this.renderSidebar();

    this.container.innerHTML = `
      <style>
        .daily-sidebar { display:none; }
        .daily-mobile-actions { display:block; }
        @media (min-width: 768px) {
          .daily-sidebar {
            display:flex; flex-direction:column; gap:8px;
            width:200px; flex-shrink:0;
            padding:52px 12px 52px 0;
            z-index:2; position:relative;
            overflow-y:auto;
          }
          .daily-mobile-actions { display:none; }
          .daily-main-area {
            flex:1; min-width:0;
          }
        }
      </style>
      ${timeOverlayHtml}
      ${hudHtml}
      <div style="flex:1; display:flex; overflow:hidden; position:relative; z-index:2;">
        <div class="daily-main-area" style="flex:1; overflow-y:auto; padding:48px 16px 16px;">
          ${mainHtml}
        </div>
        ${sidebarHtml ? `<div class="daily-sidebar">${sidebarHtml}</div>` : ''}
      </div>
      ${this.renderQuestIndicator()}
      ${logBoxHtml}
      ${timeUpModalHtml}
      ${systemMenuHtml}
    `;

    this.attachEvents();
  }


  private renderEndDayPanel(isOutOfStamina: boolean): string {
    if (!isOutOfStamina || this.state.currentTime >= MAX_TIME) return '';
    return `
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
    `;
  }

  private renderRoomOrgInfo(): string {
    const org = ORGANIZATIONS.find(o => o.id === this.state.currentLocation);
    if (!org) return '';

    return `
      <div class="game-panel" style="margin-bottom:12px; padding:10px 12px;">
        <div style="font-size:0.95em; font-weight:bold; color:var(--game-text); margin-bottom:6px;">${org.name}</div>
        ${renderOrgInfoSection({ state: this.state }, org)}
      </div>
    `;
  }

  /** 落とし物・おつかい所持中インジケーター */
  private renderQuestIndicator(): string {
    const items: string[] = [];
    const li = this.state.lostItem;
    if (li) {
      const owner = this.state.students.find(s => s.id === li.ownerId);
      if (owner) {
        items.push(`<span id="lostitem-indicator" style="color:#D4A017; cursor:pointer; text-decoration:underline; text-underline-offset:3px;" data-target-id="${li.ownerId}">📦 ${owner.name}の${li.itemName}を所持中</span>`);
      } else {
        items.push(`<span style="color:#D4A017;">📦 ${li.itemName}を所持中（${li.hint}）</span>`);
      }
    }
    const er = this.state.errand;
    if (er) {
      const from = this.state.students.find(s => s.id === er.fromId);
      const to = this.state.students.find(s => s.id === er.toId);
      items.push(`<span id="errand-indicator" style="color:#4A90D9; cursor:pointer; text-decoration:underline; text-underline-offset:3px;" data-target-id="${er.toId}">📨 ${from?.name ?? '?'}の${er.itemName}を${to?.name ?? '?'}に届ける</span>`);
    }
    if (items.length === 0) return '';
    return `
      <div style="
        padding:4px 12px;
        font-size:0.72em;
        background:var(--game-panel-bg);
        border-top:1px solid var(--game-panel-border);
        display:flex; gap:12px; flex-wrap:wrap;
      ">${items.join('')}</div>
    `;
  }

  private renderTrainingPanel(isOutOfStamina: boolean): string {
    const loc = this.state.currentLocation;
    const trainCost = 10;
    const timeCost = TIME_COST.TRAINING;
    const canTrain = !isOutOfStamina && this.state.stamina >= trainCost
      && this.state.currentTime + timeCost <= MAX_TIME;
    const pc = this.state.playerCharacter;

    type TrainInfo = { stat: 'speech' | 'athletic' | 'intel'; label: string; statLabel: string; desc: string; icon: string; current: number; color: string };
    let info: TrainInfo | null = null;

    if (loc === 'broadcast_room' && pc) {
      info = { stat: 'speech', label: '発声練習', statLabel: '弁舌', desc: 'マイクの前で発声練習をする', icon: '🎙️', current: pc.stats.speech, color: '#E07820' };
    } else if ((loc === 'track_field' || loc === 'soccer_field' || loc === 'baseball_field' || loc === 'tennis_court') && pc) {
      info = { stat: 'athletic', label: '運動', statLabel: '運動', desc: 'グラウンドで体を動かす', icon: '🏃', current: pc.stats.athletic, color: '#27AE60' };
    } else if (loc === 'library' && pc) {
      info = { stat: 'intel', label: '読書', statLabel: '知力', desc: '本を読んで知識を深める', icon: '📚', current: pc.stats.intel, color: '#2E5FAC' };
    }

    if (!info) return '';

    const noTime = !isOutOfStamina && this.state.stamina >= trainCost
      && this.state.currentTime + timeCost > MAX_TIME;
    const pct = Math.min(100, info.current);

    return `
      <div class="game-panel" style="margin-bottom:12px; padding:12px 16px;">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          <span style="font-size:1.5em;">${info.icon}</span>
          <div style="flex:1;">
            <div style="font-size:0.9em; font-weight:bold; color:var(--game-text);">${info.desc}</div>
          </div>
          <button data-train="${info.stat}" class="game-btn ${canTrain ? 'game-btn-primary' : 'game-btn-disabled'}" style="
            padding:8px 16px;
            font-size:0.85em; font-family:var(--game-font);
          ">${info.label}（⚡${trainCost} / ${timeCost}分）</button>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.78em; color:var(--game-text-dim); min-width:32px;">${info.statLabel}</span>
          <div style="flex:1; height:14px; background:var(--game-panel-inner); border-radius:7px; overflow:hidden; border:1px solid ${info.color}30;">
            <div style="
              width:${pct}%; height:100%;
              background:linear-gradient(90deg, ${info.color}90, ${info.color});
              border-radius:7px;
              transition: width 0.3s ease;
            "></div>
          </div>
          <span style="font-size:0.82em; font-weight:bold; color:${info.color}; min-width:28px; text-align:right;">${info.current}</span>
        </div>
        ${noTime ? '<div style="font-size:0.72em; color:#C0392B; margin-top:6px; text-align:right;">時間が足りない</div>' : ''}
      </div>
    `;
  }

  /** PC用サイドバー: 廊下へ・情報・翌日ボタン */
  private renderSidebar(): string {
    const inCorridor = isCorridorLocation(this.state.currentLocation);
    const isOverlay = this.showPlayerInfo || this.showStudentInfo || this.infoPanel;

    const exitBtnHtml = !inCorridor && !isOverlay ? `
      <button id="sidebar-exit-room-btn" class="game-btn game-btn-primary" style="
        padding:10px 12px; width:100%;
        background:#4A90D9;
        color:#fff; border:none; border-radius:10px;
        font-size:0.85em; cursor:pointer;
        text-align:left; font-family:inherit;
      ">
        <div style="font-weight:bold;">← ${getFloorFromLocation(this.state.currentLocation) === 'ground' ? 'グラウンドへ' : '廊下へ'}</div>
        <div style="font-size:0.75em; opacity:0.85;">フロア移動</div>
      </button>
    ` : '';

    const infoBtnHtml = !isOverlay ? `
      <button id="sidebar-info-btn" class="game-btn" style="
        padding:10px 12px; width:100%;
        background:linear-gradient(180deg,#8E6BAD,#6E4B8D);
        border-color:#a080c0;
        font-size:0.85em;
        text-align:left; font-family:var(--game-font);
      ">
        <div style="font-weight:bold;">情報</div>
        <div style="font-size:0.75em; opacity:0.85;">クラス・部活</div>
      </button>
    ` : '';

    const nextDayBtnHtml = !isOverlay ? `
      <button id="sidebar-next-day-btn" class="game-btn game-btn-warning" style="
        padding:10px 12px; width:100%;
        font-size:0.85em;
        text-align:left; font-family:var(--game-font);
      ">
        <div style="font-weight:bold;">翌日へ</div>
        <div style="font-size:0.75em; opacity:0.85;">${dayToDate(this.state.day)}</div>
      </button>
    ` : '';

    return `${exitBtnHtml}${infoBtnHtml}${nextDayBtnHtml}`;
  }

  private renderMainPanel(studentsHere: Student[], isOutOfStamina: boolean): string {
    const studentsHtml = studentsHere.length === 0
      ? `<div style="text-align:center; color:#aaa; padding:20px; font-size:0.9em;">ここには誰もいない</div>`
      : studentsHere.map(s => this.renderStudentCard(s)).join('');

    const endDayHtml = this.renderEndDayPanel(isOutOfStamina);

    const orgInfoHtml = this.renderRoomOrgInfo();

    // 保健室の休憩パネル
    const isInNursesOffice = this.state.currentLocation === 'nurses_office';
    const canNurseRest = !isOutOfStamina && this.state.currentTime + TIME_COST.NURSE_REST <= MAX_TIME;
    const nurseRestHtml = isInNursesOffice ? `
      <div class="game-panel" style="margin-bottom:12px; text-align:center; padding:16px;">
        <div style="font-size:0.9em; color:var(--game-text); margin-bottom:8px;">
          ベッドで横になって休憩できる
        </div>
        <button id="nurse-rest-btn" class="game-btn ${canNurseRest ? 'game-btn-primary' : 'game-btn-disabled'}" style="
          padding:10px 24px;
          font-size:0.9em; font-family:var(--game-font);
        ">休憩する（体力+40 / ${TIME_COST.NURSE_REST}分）</button>
        ${!canNurseRest && !isOutOfStamina ? '<div style="font-size:0.72em; color:#C0392B; margin-top:6px;">時間が足りない</div>' : ''}
      </div>
    ` : '';

    // トレーニングパネル
    const trainingHtml = this.renderTrainingPanel(isOutOfStamina);

    return `
      ${orgInfoHtml}
      ${nurseRestHtml}
      ${trainingHtml}

      <div class="game-panel" style="margin-bottom:12px;">
        <h3 style="font-size:0.9em; color:var(--game-heading); margin-bottom:10px; font-weight:bold;">この場所にいる生徒</h3>
        ${studentsHtml}
      </div>

      <div class="daily-mobile-actions">
        <div class="game-panel" style="margin-bottom:12px;">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px;">
            <button id="exit-room-btn" class="game-btn game-btn-primary" style="
              padding:10px 12px;
              background:#4A90D9;
              color:#fff; border:none; border-radius:10px;
              font-size:0.85em; cursor:pointer;
              text-align:left; font-family:inherit;
            ">
              <div style="font-weight:bold;">← ${getFloorFromLocation(this.state.currentLocation) === 'ground' ? 'グラウンドへ' : '廊下へ'}</div>
              <div style="font-size:0.75em; opacity:0.85;">フロア移動</div>
            </button>
            <button id="info-btn" class="game-btn" style="
              padding:10px 12px;
              background:linear-gradient(180deg,#8E6BAD,#6E4B8D);
              border-color:#a080c0;
              font-size:0.85em;
              text-align:left; font-family:var(--game-font);
            ">
              <div style="font-weight:bold;">情報</div>
              <div style="font-size:0.75em; opacity:0.85;">クラス・部活</div>
            </button>
            <button id="next-day-btn-always" class="game-btn game-btn-warning" style="
              padding:10px 12px;
              font-size:0.85em;
              text-align:left; font-family:var(--game-font);
            ">
              <div style="font-weight:bold;">翌日へ</div>
              <div style="font-size:0.75em; opacity:0.85;">${dayToDate(this.state.day)}</div>
            </button>
          </div>
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

    const aff = getAffinityInfo(s.affinity);
    const affinityColor = aff.color;
    const affinityLabel = aff.label;

    return `
      <div class="game-chara-card" style="
        display:flex; align-items:center; gap:10px;
      ">
        ${s.portrait
          ? `<img src="${s.portrait}" alt="${s.name}" style="
              width:96px; height:96px; border-radius:4px;
              object-fit:cover; object-position:top;
              border:2px solid var(--game-panel-border);
              flex-shrink:0;
              box-shadow:0 2px 6px rgba(0,0,0,0.4);
            "/>`
          : renderInitialIcon(s.name, s.personality, 96, '#b0c0d8')
        }
        <div style="flex:1; min-width:0;">
          <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
            <span style="font-size:0.9em; font-weight:bold; color:var(--game-text);">${s.name}</span>
            <span style="font-size:0.72em; color:var(--game-text-dim);">（${s.nickname}）</span>
          </div>
          <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; margin-top:1px; font-size:0.75em; color:var(--game-text-dim);">
            ${renderStudentAffiliation(s.id, s.className, s.clubId)}
          </div>
          <div style="font-size:0.72em; color:${affinityColor};">好感度: ${affinityLabel}</div>
          ${(() => {
            const maxKey = ALL_FACTION_IDS
              .reduce((a, b) => s.support[a] >= s.support[b] ? a : b);
            const sc = FACTION_INFO.find(f => f.id === maxKey);
            const isAlly = maxKey === this.state.faction;
            return `<span style="
              font-size:0.7em; background:${sc?.color ?? '#888'}; color:#fff;
              border-radius:3px; padding:1px 6px;
              border:1px solid ${sc?.color ?? '#888'}60;
            ">${FACTION_LABELS[maxKey] ?? ''}派</span>`;
          })()}
        </div>
        <div style="display:flex; flex-direction:column; gap:4px; flex-shrink:0;">
          <button data-action-talk="${s.id}" class="game-btn ${canTalk ? 'game-btn-primary' : 'game-btn-disabled'}" style="
            padding:5px 10px;
            font-size:0.78em; font-family:var(--game-font);
          ">趣味(⚡${talkCost})</button>
          <button data-action-gossip="${s.id}" class="game-btn ${canTalk ? '' : 'game-btn-disabled'}" style="
            padding:5px 10px;
            background:linear-gradient(180deg,#9B6B9E,#7B4B7E);
            border-color:#B080B0;
            font-size:0.78em; font-family:var(--game-font);
          ">噂話(⚡${talkCost})</button>
          <button data-action-persuade="${s.id}" class="game-btn ${canPersuade ? 'game-btn-warning' : 'game-btn-disabled'}" style="
            padding:5px 10px;
            font-size:0.78em; font-family:var(--game-font);
          ">説得</button>
          <button data-action-info="${s.id}" class="game-btn" style="
            padding:5px 10px;
            background:linear-gradient(180deg,#6a7890,#4a5870);
            border-color:#8090a8;
            font-size:0.78em; font-family:var(--game-font);
          ">情報</button>
          ${this.state.lostItem?.ownerId === s.id ? `
            <button data-deliver-lost="${s.id}" class="game-btn" style="
              padding:5px 10px;
              background:linear-gradient(180deg,#D4A017,#B8860B);
              border-color:#E8C840;
              font-size:0.78em; font-family:var(--game-font);
              animation: game-pulse 1.5s ease-in-out infinite;
            ">届ける</button>
          ` : ''}
          ${this.state.errand?.toId === s.id ? `
            <button data-deliver-errand="${s.id}" class="game-btn" style="
              padding:5px 10px;
              background:linear-gradient(180deg,#D4A017,#B8860B);
              border-color:#E8C840;
              font-size:0.78em; font-family:var(--game-font);
              animation: game-pulse 1.5s ease-in-out infinite;
            ">届ける</button>
          ` : ''}
        </div>
      </div>
    `;
  }



  private renderStudentInfo(s: Student): string {
    return this.renderStudentDetailCard(s, 'close');
  }

  /** 生徒詳細カード（情報パネル・部屋内情報ボタン共通、プレイヤー自身にも対応） */
  private renderStudentDetailCard(s: Student, backAction: string, isPlayer = false): string {
    const borderColor = isPlayer
      ? this.getFactionColor()
      : (FACTION_INFO.find(f => f.id === Object.entries(s.support).sort((a, b) => b[1] - a[1])[0][0])?.color ?? '#d0e0f0');

    const hobbiesHtml = Object.entries(s.hobbies).map(([hobby, pref]) => {
      const isRevealed = isPlayer || s.revealedHobbies.has(hobby as import('../types').HobbyTopic);
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

    const statsBar = (label: string, value: number, color: string) => `
      <div style="display:flex; align-items:center; gap:6px; font-size:0.8em;">
        <span style="width:28px; color:#888;">${label}</span>
        <div style="flex:1; height:8px; background:#e0e8f0; border-radius:4px; overflow:hidden;">
          <div style="width:${value}%; height:100%; background:${color}; border-radius:4px;"></div>
        </div>
        <span style="width:24px; text-align:right; color:#555; font-weight:bold;">${value}</span>
      </div>
    `;

    // ヘッダー部（ポートレート + 名前 + 所属情報を横並び）
    const closeBtnId = isPlayer ? 'close-player-btn' : 'close-info-btn';
    const portraitSize = 180;
    const portraitImgHtml = s.portrait
      ? `<img src="${s.portrait}" alt="${s.name}" style="
            width:${portraitSize}px; height:${portraitSize}px; border-radius:8px;
            object-fit:cover; object-position:top;
            border:2px solid ${borderColor};
            box-shadow:0 2px 8px rgba(0,0,0,0.15);
            flex-shrink:0;
          "/>`
      : renderInitialIcon(s.name, s.personality, portraitSize, borderColor);

    const infoLineHtml = `
      <div style="flex:1; min-width:0;">
        <div style="font-size:1.05em; font-weight:bold; color:#333;">${s.name} <span style="font-size:0.72em; color:#888; font-weight:normal;">（${s.nickname}）</span></div>
        <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap; margin-top:2px; font-size:0.78em; color:#888;">
          ${renderStudentAffiliation(s.id, s.className, s.clubId)}
        </div>
        ${isPlayer
          ? `<div style="font-size:0.75em; color:${borderColor}; font-weight:bold; margin-top:2px;">${FACTION_LABELS[this.state.faction ?? 'conservative'] ?? ''}派</div>`
          : ''
        }
        <div style="font-size:0.75em; color:#888; margin-top:2px;">「${getCatchphrase(s.personality, s.attributes)}」</div>
      </div>`;

    const profileDescHtml = `
      <div style="font-size:0.75em; color:#666; line-height:1.5; background:#f8f9fb; border-radius:8px; padding:6px 10px; margin-bottom:8px;">${s.description}</div>`;

    const headerHtml = backAction === 'close'
      ? `<div style="margin-bottom:10px;">
          <div style="display:flex; justify-content:flex-end; margin-bottom:4px;">
            <button id="${closeBtnId}" style="
              background:#ddd; border:none; border-radius:50%;
              width:28px; height:28px; cursor:pointer; font-size:1em;
            ">×</button>
          </div>
          <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:8px;">
            ${portraitImgHtml}
            ${infoLineHtml}
          </div>
          ${profileDescHtml}
        </div>`
      : `${renderInfoHeader(s.name, backAction)}
        <div style="display:flex; align-items:flex-start; gap:12px; margin-bottom:8px;">
          ${portraitImgHtml}
          ${infoLineHtml}
        </div>
        ${profileDescHtml}`;

    // プレイヤー用: スタミナ + 思想（playerSupport）
    // 生徒用: 好感度 + 会話回数 + 思想（student.support）
    const supportData = isPlayer ? this.state.playerSupport : s.support;
    const statusGridHtml = isPlayer
      ? `<div style="margin-bottom:8px;">
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:6px; font-size:0.78em;">
            <div style="color:#888;">スタミナ</div>
            <div style="font-weight:bold;">${this.state.stamina} / 100</div>
          </div>
        </div>`
      : `<div style="margin-bottom:8px;">
          <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:6px; font-size:0.78em;">
            <div style="color:#888;">好感度</div>
            <div style="font-weight:bold; color:${getAffinityInfo(s.affinity).color};">${getAffinityInfo(s.affinity).label}</div>
          </div>
        </div>`;

    return `
      <div class="game-panel" style="
        padding:14px;
      ">
        ${headerHtml}

        ${statusGridHtml}

        <div style="background:rgba(240,245,255,0.8); border-radius:8px; padding:6px; margin-bottom:12px; font-size:0.78em;">
          <div style="color:#888; margin-bottom:3px;">思想</div>
          ${renderSupportBar(supportData, 12)}
        </div>

        <div style="display:flex; flex-direction:column; gap:4px; margin-bottom:12px;">
          ${statsBar('弁舌', s.stats.speech, '#4A90D9')}
          ${statsBar('運動', s.stats.athletic, '#E74C3C')}
          ${statsBar('知性', s.stats.intel, '#27AE60')}
        </div>

        <div>
          <div style="font-size:0.8em; color:#888; margin-bottom:6px;">趣味</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">${hobbiesHtml}</div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    // システムメニューボタン
    on(this.container, '#system-menu-btn', 'pointerup', () => {
      this.showSystemMenu = true;
      this.render();
    });

    // システムメニューダイアログ
    if (this.showSystemMenu) {
      this.container.querySelector('#sys-save-btn')?.addEventListener('pointerup', () => {
        this.callbacks.onSave();
        this.showSystemMenu = false;
        this.render();
      });
      this.container.querySelector('#sys-load-btn')?.addEventListener('pointerup', () => {
        this.showSystemMenu = false;
        this.callbacks.onLoad();
      });
      const sysSlider = this.container.querySelector<HTMLInputElement>('#sys-bgm-slider');
      const sysLabel = this.container.querySelector<HTMLElement>('#sys-bgm-label');
      sysSlider?.addEventListener('input', () => {
        const v = parseInt(sysSlider.value, 10) / 100;
        bgm.setVolume(v);
        if (sysLabel) sysLabel.textContent = `${Math.round(v * 100)}%`;
        const icon = this.container.querySelector<HTMLElement>('#sys-bgm-icon');
        if (icon) icon.textContent = v > 0 ? '🔊' : '🔇';
      });
      this.container.querySelector('#sys-tutorial-btn')?.addEventListener('pointerup', () => {
        this.showSystemMenu = false;
        this.callbacks.onPersuadeTutorial();
      });
      this.container.querySelector('#sys-close-btn')?.addEventListener('pointerup', () => {
        this.showSystemMenu = false;
        this.render();
      });
    }

    // メッセージボックスタップで展開/折りたたみ
    this.container.querySelector('#log-box')?.addEventListener('pointerup', () => {
      this.showLog = !this.showLog;
      this.render();
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
    onDataAttr(this.container, 'data-info-tab', (tab) => {
      this.infoPanel = { tab: tab as 'class' | 'club' };
      this.render();
    });

    // 情報パネル: サブタブ切替
    onDataAttr(this.container, 'data-info-subtab', (subTab) => {
      if (!this.infoPanel) return;
      this.infoPanel = { tab: this.infoPanel.tab, subTab };
      this.render();
    });

    // 情報パネル: 組織選択
    onDataAttr(this.container, 'data-info-org', (orgId) => {
      if (!this.infoPanel) return;
      this.infoPanel = { ...this.infoPanel, orgId };
      this.render();
    });

    // 情報パネル: 生徒選択
    onDataAttr(this.container, 'data-info-student', (studentId) => {
      if (!this.infoPanel) return;
      this.infoPanel = { ...this.infoPanel, studentId };
      this.render();
    });

    // 情報パネル: アクション（戻る・閉じる）
    onDataAttr(this.container, 'data-info-action', (action) => {
      if (action === 'close') {
        this.infoPanel = null;
      } else if (action === 'back-to-list' && this.infoPanel) {
        this.infoPanel = { tab: this.infoPanel.tab, subTab: this.infoPanel.subTab };
      } else if (action === 'back-to-org' && this.infoPanel) {
        this.infoPanel = { tab: this.infoPanel.tab, subTab: this.infoPanel.subTab, orgId: this.infoPanel.orgId };
      }
      this.render();
    });

    // 廊下に出る
    const exitRoomBtn = this.container.querySelector<HTMLButtonElement>('#exit-room-btn');
    exitRoomBtn?.addEventListener('pointerup', () => {
      this.callbacks.onExitRoom();
    });

    // PC用サイドバー: 廊下に出る
    this.container.querySelector<HTMLButtonElement>('#sidebar-exit-room-btn')?.addEventListener('pointerup', () => {
      this.callbacks.onExitRoom();
    });

    // PC用サイドバー: 情報ボタン
    this.container.querySelector<HTMLButtonElement>('#sidebar-info-btn')?.addEventListener('pointerup', () => {
      this.infoPanel = { tab: 'class' };
      this.showStudentInfo = null;
      this.showPlayerInfo = false;
      this.render();
    });

    // PC用サイドバー: 翌日ボタン
    this.container.querySelector<HTMLButtonElement>('#sidebar-next-day-btn')?.addEventListener('pointerup', () => {
      this.showNextDayConfirm();
    });

    // 部屋に入る
    onDataAttr(this.container, 'data-enter-room', (locId) => {
      this.callbacks.onEnterRoom(locId as LocationId);
    });

    // フロア移動
    onDataAttr(this.container, 'data-change-floor', (floor) => {
      this.callbacks.onChangeFloor(floor as Floor);
    });


    // 保健室休憩ボタン
    const nurseRestBtn = this.container.querySelector<HTMLButtonElement>('#nurse-rest-btn');
    nurseRestBtn?.addEventListener('pointerup', () => {
      this.callbacks.onNurseRest();
    });

    // トレーニングボタン
    onDataAttr(this.container, 'data-train', (stat) => {
      this.callbacks.onTrain(stat as 'speech' | 'athletic' | 'intel');
    });

    // 落とし物を届けるボタン
    onDataAttr(this.container, 'data-deliver-lost', () => {
      this.callbacks.onDeliverLostItem();
    });

    // おつかいを届けるボタン
    onDataAttr(this.container, 'data-deliver-errand', () => {
      this.callbacks.onDeliverErrand();
    });

    // クエストインジケータークリック → 対象生徒の詳細表示
    const errandInd = this.container.querySelector<HTMLElement>('#errand-indicator');
    errandInd?.addEventListener('pointerup', () => {
      const targetId = errandInd.dataset['targetId'];
      const student = this.state.students.find(s => s.id === targetId);
      if (student) {
        this.showStudentInfo = student;
        this.showPlayerInfo = false;
        this.render();
      }
    });
    const lostitemInd = this.container.querySelector<HTMLElement>('#lostitem-indicator');
    lostitemInd?.addEventListener('pointerup', () => {
      const targetId = lostitemInd.dataset['targetId'];
      const student = this.state.students.find(s => s.id === targetId);
      if (student) {
        this.showStudentInfo = student;
        this.showPlayerInfo = false;
        this.render();
      }
    });

    // 趣味の会話ボタン
    onDataAttr(this.container, 'data-action-talk', (studentId) => {
      const student = this.state.students.find(s => s.id === studentId);
      if (student && this.state.stamina >= 5) {
        this.callbacks.onTalk(student);
      }
    });

    // 噂話ボタン
    onDataAttr(this.container, 'data-action-gossip', (studentId) => {
      const student = this.state.students.find(s => s.id === studentId);
      if (student && this.state.stamina >= 5) {
        this.callbacks.onGossip(student);
      }
    });

    // 説得ボタン
    onDataAttr(this.container, 'data-action-persuade', (studentId) => {
      const student = this.state.students.find(s => s.id === studentId);
      if (student && student.talkCount > 0) {
        this.callbacks.onPersuade(student);
      }
    });

    // 情報ボタン
    onDataAttr(this.container, 'data-action-info', (studentId) => {
      const student = this.state.students.find(s => s.id === studentId) ?? null;
      this.showStudentInfo = student;
      this.render();
    });

    // 情報パネルを閉じる
    const closeInfoBtn = this.container.querySelector<HTMLButtonElement>('#close-info-btn');
    closeInfoBtn?.addEventListener('pointerup', () => {
      this.showStudentInfo = null;
      this.render();
    });

    // 翌日ボタン（時間切れモーダル）
    const timeUpBtn = this.container.querySelector<HTMLButtonElement>('#timeup-next-day-btn');
    timeUpBtn?.addEventListener('pointerup', () => {
      this.callbacks.onNextDay();
    });

    // 翌日ボタン（体力切れ時）
    const nextDayBtn = this.container.querySelector<HTMLButtonElement>('#next-day-btn');
    nextDayBtn?.addEventListener('pointerup', () => {
      this.showNextDayConfirm();
    });

    // 翌日ボタン（常時表示）
    const nextDayBtnAlways = this.container.querySelector<HTMLButtonElement>('#next-day-btn-always');
    nextDayBtnAlways?.addEventListener('pointerup', () => {
      this.showNextDayConfirm();
    });
  }

  private showNextDayConfirm(): void {
    // 既に表示中なら何もしない
    if (this.container.querySelector('.game-dialog-overlay')) return;

    showConfirmDialog(this.container, {
      title: '翌日へ',
      message: '翌日に進みますか？',
      okLabel: '翌日へ →',
      cancelLabel: 'やめる',
      okStyle: 'warning',
    }).then(ok => {
      if (ok) this.callbacks.onNextDay();
    });
  }

  showConversation(steps: ConversationStep[], result: ConversationResult, onFinish: () => void): void {
    this.hideConversation();
    this.container.style.pointerEvents = 'none';
    this.conversationOverlay = new ConversationOverlay(steps, result, () => {
      this.hideConversation();
      onFinish();
    });
    this.conversationOverlay.mount(this.container.parentElement ?? document.body);
  }

  hideConversation(): void {
    if (this.conversationOverlay) {
      this.conversationOverlay.unmount();
      this.conversationOverlay = null;
      this.container.style.pointerEvents = '';
    }
  }

  showTrainingResult(icon: string, statLabel: string, oldValue: number, newValue: number, color: string): void {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:200;
      display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.4);
      animation: fadeIn 0.2s ease;
    `;
    const gain = newValue - oldValue;
    overlay.innerHTML = `
      <div style="
        background:var(--game-panel-bg);
        border:2px solid ${color};
        border-radius:16px;
        padding:24px 32px;
        text-align:center;
        box-shadow:0 8px 32px rgba(0,0,0,0.3);
        min-width:200px;
        animation: game-slide-up 0.3s ease;
      ">
        <div style="font-size:2em; margin-bottom:8px;">${icon}</div>
        <div style="font-size:1.1em; font-weight:bold; color:var(--game-text); margin-bottom:12px;">
          ${statLabel} <span style="color:${color};">+${gain}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px; justify-content:center; margin-bottom:8px;">
          <span style="font-size:0.9em; color:var(--game-text-dim);">${oldValue}</span>
          <span style="font-size:1.2em; color:${color};">→</span>
          <span style="font-size:1.1em; font-weight:bold; color:${color};">${newValue}</span>
        </div>
        <div style="
          width:100%; height:16px;
          background:var(--game-panel-inner);
          border-radius:8px; overflow:hidden;
          border:1px solid ${color}30;
        ">
          <div style="
            width:${Math.min(100, newValue)}%; height:100%;
            background:linear-gradient(90deg, ${color}90, ${color});
            border-radius:8px;
          "></div>
        </div>
      </div>
    `;
    overlay.addEventListener('pointerup', () => overlay.remove());
    (this.container.parentElement ?? document.body).appendChild(overlay);
    setTimeout(() => overlay.remove(), 2000);
  }

  showLostItemFound(itemName: string, hint: string, callback?: (picked: boolean) => void): void {
    showConfirmDialog(this.container, {
      title: '落とし物発見',
      message: `足元に${itemName}が落ちている…\n${hint}`,
      okLabel: '拾う',
      cancelLabel: '無視する',
    }).then((picked) => {
      if (callback) callback(picked);
    });
  }

  showErrandRequest(from: Student, to: Student, itemName: string, callback: (accepted: boolean) => void): void {
    showConfirmDialog(this.container, {
      title: 'おつかい依頼',
      message: `${from.name}から${to.name}へ${itemName}を届けてほしいと頼まれた。`,
      okLabel: '引き受ける',
      cancelLabel: '断る',
    }).then(callback);
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.hideConversation();
    this.container.remove();
  }
}
