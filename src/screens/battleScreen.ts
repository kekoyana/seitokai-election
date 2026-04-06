import type { GameState, PlayerAttitude, Topic, Stance, FactionId, HobbyTopic } from '../types';
import { FACTION_INFO, FACTION_LABELS, HOBBY_LABELS, MOOD_LABELS, renderInitialIcon, renderSupportBar } from '../data';
import { ALL_FACTION_IDS } from '../data/factions';
import { bgm } from '../bgm';
import battleBg from '../../assets/backgrounds/battle.jpg';
import type { Screen } from './Screen';
import { t } from '../i18n';

export interface BattleCallbacks {
  onAttitudeSelect: (attitude: PlayerAttitude) => void;
  onTopicSelect: (topic: Topic) => void;
  onStanceSelect: (stance: Stance) => void;
  onCancel: (phase: 'select_topic' | 'select_stance') => void;
}

export class BattleScreen implements Screen {
  private container: HTMLDivElement;
  private state: GameState;
  private callbacks: BattleCallbacks;
  private showLog: boolean = false;
  private showVolumeDialog: boolean = false;
  private lastEnemyBubbleIdx: number = -1;
  private lastPlayerBubbleIdx: number = -1;

  constructor(state: GameState, callbacks: BattleCallbacks) {
    this.state = state;
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  update(state: GameState): void {
    this.state = state;
    this.render();
  }

  private getFactionColor(): string {
    const f = FACTION_INFO.find(f => f.id === this.state.faction);
    return f ? f.color : '#1B3A6B';
  }

  private render(): void {
    const battle = this.state.battle;
    if (!battle) return;

    const candidateColor = this.getFactionColor();
    const student = battle.student;
    const pc = this.state.playerCharacter;
    const barPct = (battle.barPosition + 100) / 2; // 0〜100%

    const barColor = battle.barPosition >= 0 ? candidateColor : '#C0392B';

    const moodLabel = MOOD_LABELS[battle.enemyMood] ?? battle.enemyMood;
    const moodEmoji: Record<string, string> = {
      furious: '😡', upset: '😒', normal: '😐', favorable: '🙂', devoted: '😊'
    };
    const moodLevels = ['furious', 'upset', 'normal', 'favorable', 'devoted'] as const;
    const moodColors: Record<string, string> = {
      furious: '#E74C3C', upset: '#E67E22', normal: '#95A5A6', favorable: '#3498DB', devoted: '#2ECC71'
    };
    const currentMoodIdx = moodLevels.indexOf(battle.enemyMood as typeof moodLevels[number]);
    const moodIndicatorHtml = moodLevels.map((m, i) => {
      const isCurrent = i === currentMoodIdx;
      const color = moodColors[m];
      return `<span style="
        display:inline-block; width:${isCurrent ? '10px' : '8px'}; height:${isCurrent ? '10px' : '8px'};
        border-radius:50%;
        background:${isCurrent ? color : 'rgba(255,255,255,0.2)'};
        ${isCurrent ? `box-shadow:0 0 6px ${color};` : ''}
        transition:all 0.3s;
      "></span>`;
    }).join('');

    this.container.style.cssText = `
      position: fixed; inset: 0;
      background: linear-gradient(160deg, rgba(26,40,64,0.85) 0%, rgba(40,56,80,0.85) 100%),
        url('${battleBg}') center/cover no-repeat;
      display: flex; flex-direction: column;
      font-family: var(--game-font);
      overflow: hidden;
    `;

    const isFinished = battle.phase === 'finished';
    const lastLog = battle.logs[battle.logs.length - 1];

    // 最新の相手ログ・プレイヤーログを探す
    const lastEnemyLog = [...battle.logs].reverse().find(l => l.speaker === 'enemy');
    const lastPlayerLog = [...battle.logs].reverse().find(l => l.speaker === 'player');
    const lastEnemyIdx = lastEnemyLog ? battle.logs.lastIndexOf(lastEnemyLog) : -1;
    const lastPlayerIdx = lastPlayerLog ? battle.logs.lastIndexOf(lastPlayerLog) : -1;

    const enemyBubbleIsNew = lastEnemyIdx >= 0 && lastEnemyIdx !== this.lastEnemyBubbleIdx;
    const playerBubbleIsNew = lastPlayerIdx >= 0 && lastPlayerIdx !== this.lastPlayerBubbleIdx;
    if (lastEnemyIdx >= 0) this.lastEnemyBubbleIdx = lastEnemyIdx;
    if (lastPlayerIdx >= 0) this.lastPlayerBubbleIdx = lastPlayerIdx;

    // 音量ダイアログ
    let volumeDialogHtml = '';
    if (this.showVolumeDialog) {
      const volPct = Math.round(bgm.volume * 100);
      volumeDialogHtml = `
        <div class="game-dialog-overlay" style="
          position:absolute; inset:0; z-index:200;
          background:rgba(0,0,20,0.4);
          display:flex; align-items:center; justify-content:center;
          animation: fadeIn 0.2s ease;
        ">
          <div class="game-panel-dark" style="width:240px; padding:20px; text-align:center;">
            <div style="font-weight:bold; margin-bottom:15px; color:#fff;">${t('battle.bgmVolume')}</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
              <span id="bgm-dialog-icon" style="font-size:1.2em;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
              <input id="bgm-volume-dialog" type="range" min="0" max="100" value="${volPct}" style="
                flex:1; height:6px; cursor:pointer;
                accent-color:#fff;
              "/>
              <span id="bgm-volume-label" style="font-size:0.9em; width:35px; text-align:right;">${volPct}%</span>
            </div>
            <button id="close-volume-dialog" class="game-btn game-btn-primary" style="padding:8px 24px;">${t('battle.close')}</button>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <!-- フローティングHUD -->
      <div style="
        position:absolute; top:0; left:0; right:0;
        display:flex; justify-content:space-between; align-items:flex-start;
        padding:10px 12px; pointer-events:none; z-index:10;
      ">
        <div class="game-hud-badge-dark" style="pointer-events:auto;">
          R<strong>${battle.round}</strong>/${battle.maxRounds}
        </div>
        <div class="game-hud-badge-dark" style="
          pointer-events:auto;
          display:flex; gap:6px; align-items:center;
        ">
          ${(() => {
            const pf = FACTION_INFO.find(f => f.id === this.state.faction);
            return pf ? `<span style="
              font-size:0.72em; background:${pf.color}; color:#fff;
              border-radius:3px; padding:1px 6px; font-weight:bold;
            ">${FACTION_LABELS[pf.id]}${t('battle.factionSuffix')}</span>` : '';
          })()}
          <span>⚡<strong>${this.state.stamina}</strong></span>
          <span style="opacity:0.4;">|</span>
          <span id="bgm-icon" style="cursor:pointer; font-size:1.1em; line-height:1; padding:2px;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
        </div>
      </div>

      <!-- キャラクター表示 + 吹き出し -->
      <div style="
        display:flex; align-items:flex-start;
        padding:40px 12px 8px; gap:10px; flex-shrink:0;
      ">
        <!-- ポートレート -->
        <div style="flex-shrink:0;">
          ${student.portrait
            ? `<img src="${student.portrait}" alt="${student.name}" style="
                width:80px; height:80px;
                border-radius:4px; object-fit:cover; object-position:top;
                border:2px solid var(--game-panel-border);
                box-shadow:0 4px 16px rgba(0,0,0,0.5);
              "/>`
            : renderInitialIcon(student.name, student.personality, 80, 'rgba(255,255,255,0.3)')
          }
        </div>
        <!-- 右側: 情報 + 吹き出し -->
        <div style="flex:1; min-width:0; color:#fff;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:0.95em; font-weight:bold;">${student.name}</span>
            <span style="font-size:0.72em; opacity:0.6;">${student.className}</span>
            ${(() => {
              const topFaction = ALL_FACTION_IDS.reduce((a, b) => student.support[a] >= student.support[b] ? a : b);
              const fi = FACTION_INFO.find(f => f.id === topFaction);
              return fi ? `<span style="
                font-size:0.65em; background:${fi.color}; color:#fff;
                border-radius:3px; padding:1px 6px; font-weight:bold;
              ">${FACTION_LABELS[topFaction]}${t('battle.factionSuffix')}</span>` : '';
            })()}
          </div>
          <div style="display:flex; align-items:center; gap:6px; margin-top:3px; flex-wrap:wrap;">
            <div id="mood-area" style="
              display:inline-flex; align-items:center; gap:6px;
              background:rgba(255,255,255,0.1);
              border-radius:8px; padding:3px 8px;
            ">
              <span style="font-size:0.72em;">${moodEmoji[battle.enemyMood] ?? ''} ${moodLabel}</span>
              <span style="display:inline-flex; align-items:center; gap:3px;">${moodIndicatorHtml}</span>
            </div>
            <div style="width:80px;">
              ${renderSupportBar(student.support, 8)}
            </div>
          </div>
          <!-- 相手の吹き出し -->
          ${lastEnemyLog ? `
          <div style="
            margin-top:6px; padding:6px 10px;
            background:var(--game-panel-inner);
            border:2px solid var(--game-panel-border);
            border-radius:0 8px 8px 8px;
            position:relative;
            font-size:0.82em; color:var(--game-text); line-height:1.5;
            ${enemyBubbleIsNew ? 'animation: game-slide-up 0.15s ease-out;' : ''}
          ">
            <div style="
              position:absolute; top:-8px; left:-2px;
              width:0; height:0;
              border-bottom:8px solid var(--game-panel-border);
              border-right:8px solid transparent;
            "></div>
            <div style="
              position:absolute; top:-5px; left:0px;
              width:0; height:0;
              border-bottom:6px solid var(--game-panel-inner);
              border-right:6px solid transparent;
            "></div>
            ${lastEnemyLog.text.replace(/（[^）]*）$/, '')}
          </div>
          ` : ''}
        </div>
      </div>
      <!-- プレイヤーの吹き出し + ポートレート -->
      ${lastPlayerLog ? `
      <div style="
        display:flex; align-items:flex-start; gap:10px;
        margin:0 12px 4px; justify-content:flex-end;
      ">
        <div style="
          flex:1; min-width:0; padding:6px 10px;
          background:rgba(168,216,240,0.15);
          border:2px solid rgba(168,216,240,0.4);
          border-radius:8px 8px 0 8px;
          position:relative;
          font-size:0.82em; color:#A8D8F0; line-height:1.5;
          text-align:right;
          ${playerBubbleIsNew ? 'animation: game-slide-up 0.15s ease-out;' : ''}
        ">
          <div style="
            position:absolute; bottom:-8px; right:-2px;
            width:0; height:0;
            border-top:8px solid rgba(168,216,240,0.4);
            border-left:8px solid transparent;
          "></div>
          <div style="
            position:absolute; bottom:-5px; right:0px;
            width:0; height:0;
            border-top:6px solid rgba(168,216,240,0.15);
            border-left:6px solid transparent;
          "></div>
          ${lastPlayerLog.text.replace(/（[^）]*）$/, '')}
        </div>
        <div style="flex-shrink:0;">
          ${pc?.portrait
            ? `<img src="${pc.portrait}" alt="${pc.name}" style="
                width:48px; height:48px;
                border-radius:4px; object-fit:cover; object-position:top;
                border:2px solid ${candidateColor};
                box-shadow:0 2px 8px rgba(0,0,0,0.4);
              "/>`
            : renderInitialIcon(pc?.name ?? '', pc?.personality ?? 'flexible', 48, candidateColor)
          }
        </div>
      </div>
      ` : ''}

      <!-- バーグラフ -->
      <div style="padding:8px 16px; flex-shrink:0;">
        <div style="
          display:flex; justify-content:space-between;
          font-size:0.72em; color:rgba(255,255,255,0.6); margin-bottom:4px;
        ">
          <span>${battle.isDefending ? t('battle.barLabelSuccess') : t('battle.barLabelFailure')}</span>
          <span style="font-size:1.1em; font-weight:bold; color:${battle.barPosition >= 0 ? '#7EC8F0' : '#F07070'};">
            ${battle.barPosition > 0 ? '+' : ''}${battle.barPosition}
          </span>
          <span>${battle.isDefending ? t('battle.barLabelFailure') : t('battle.barLabelSuccess')}</span>
        </div>
        <div class="game-bar" style="
          height:16px; position:relative;
        ">
          <!-- 中心線 -->
          <div style="
            position:absolute; left:50%; top:0; width:2px; height:100%;
            background:rgba(255,255,255,0.3); z-index:1;
          "></div>
          <!-- バー -->
          <div style="
            position:absolute; top:0; height:100%;
            background:${barColor};
            border-radius:8px;
            transition:all 0.3s ease;
            ${battle.barPosition >= 0
              ? `left:50%; width:${barPct - 50}%;`
              : `right:${50}%; width:${50 - barPct}%;`
            }
          "></div>
        </div>
      </div>

      <!-- コマンド -->
      <div style="flex:1; overflow-y:auto; padding:10px 14px;">
        ${isFinished
          ? this.renderFinished()
          : this.renderCommands(lastLog)
        }
      </div>

      <!-- HUD風メッセージボックス（画面下部） -->
      <div id="battle-log-box" style="
        ${this.showLog ? 'max-height:40vh; overflow-y:auto;' : 'max-height:3.6em; overflow:hidden;'}
        padding:6px 16px; cursor:pointer; flex-shrink:0;
        background:var(--game-panel-bg);
        border-top:2px solid var(--game-panel-border);
      ">
        ${(this.showLog ? battle.logs : battle.logs.slice(-2)).map(log => `
          <div style="
            font-size:0.78em; padding:2px 0;
            color:${log.speaker === 'player' ? '#A8D8F0' : '#F0A8A8'};
          ">
            ${log.speaker === 'player' ? '▶' : '◀'} ${log.text}
          </div>
        `).join('')}
        ${battle.logs.length === 0 ? '<div style="font-size:0.78em; color:#888;">...</div>' : ''}
      </div>
      ${volumeDialogHtml}
    `;

    this.attachEvents();

  }

  private renderFinished(): string {
    const battle = this.state.battle!;
    const result = battle.result;
    const isWin = result === 'win';
    const isTimeout = result === 'timeout';

    let emoji = '💧';
    let title = battle.isDefending ? t('battle.resultDefendLose') : t('battle.resultLose');
    let color = '#F07070';
    let message = battle.isDefending
      ? t('battle.msgDefendLose', { name: battle.student.name })
      : t('battle.msgLose', { name: battle.student.name });
    let btnColor = '#555';

    if (isWin) {
      emoji = '✨';
      title = battle.isDefending ? t('battle.resultDefendWin') : t('battle.resultWin');
      color = '#7EC8F0';
      message = battle.isDefending
        ? t('battle.msgDefendWin', { name: battle.student.name })
        : t('battle.msgWin', { name: battle.student.name });
      btnColor = '#2E5FAC';
    } else if (isTimeout) {
      emoji = '⏰';
      // 防御時はバーの意味が反転（バー>0は劣勢、バー<0は優勢）
      const effectiveBar = battle.isDefending ? -battle.barPosition : battle.barPosition;
      if (effectiveBar > 0) {
        title = t('battle.resultTimeoutAdvantage');
        color = '#B0D8F0';
        message = battle.isDefending
          ? t('battle.msgTimeoutAdvantageDefend', { name: battle.student.name })
          : t('battle.msgTimeoutAdvantageAttack', { name: battle.student.name });
        btnColor = '#4A6A9A';
      } else if (effectiveBar < 0) {
        title = t('battle.resultTimeoutDisadvantage');
        color = '#F0B0A0';
        message = battle.isDefending
          ? t('battle.msgTimeoutDisadvantageDefend', { name: battle.student.name })
          : t('battle.msgTimeoutDisadvantageAttack');
        btnColor = '#8A5A50';
      } else {
        title = t('battle.resultTimeoutDraw');
        color = '#C0C0C0';
        message = t('battle.msgTimeoutDraw');
        btnColor = '#666';
      }
    }

    return `
      <div style="text-align:center; padding:16px;">
        <div style="
          font-size:2em; margin-bottom:8px;
        ">${emoji}</div>
        <div style="
          font-size:1.3em; font-weight:bold;
          color:${color};
          margin-bottom:8px;
        ">
          ${title}
        </div>
        <p style="color:rgba(255,255,255,0.7); font-size:0.85em; margin-bottom:16px;">
          ${message}
        </p>
        <button id="finish-btn" class="game-btn" style="
          padding:12px 32px;
          background:linear-gradient(180deg,${btnColor},${btnColor}aa);
          border-color:${btnColor};
          font-size:1em; font-family:var(--game-font);
        ">${t('battle.returnToDaily')}</button>
      </div>
    `;
  }

  private getAttitudeLabel(attitude: PlayerAttitude): { text: string; color: string } {
    const map: Record<PlayerAttitude, { text: string; color: string }> = {
      friendly: { text: t('battle.attitudeFriendly'), color: '#27AE60' },
      normal: { text: t('battle.attitudeNormal'), color: '#4A90D9' },
      strong: { text: t('battle.attitudeStrong'), color: '#E07820' },
    };
    return map[attitude];
  }

  private getTopicLabel(topic: Topic): string {
    const factionLabels: Record<string, string> = {
      conservative: t('battle.topicConservative'), progressive: t('battle.topicProgressive'), sports: t('battle.topicSports'),
    };
    return factionLabels[topic] ?? HOBBY_LABELS[topic] ?? topic;
  }

  private renderBreadcrumb(parts: { text: string; color?: string }[]): string {
    const items = parts.map(p =>
      `<span style="color:${p.color ?? 'rgba(255,255,255,0.8)'}; font-weight:bold;">${p.text}</span>`
    );
    return `
      <div style="
        display:flex; align-items:center; justify-content:center; gap:6px;
        font-size:0.8em; margin-bottom:10px; padding:6px 10px;
        background:rgba(255,255,255,0.08); border-radius:8px;
      ">
        ${items.join('<span style="color:rgba(255,255,255,0.3);"> → </span>')}
        <span style="color:rgba(255,255,255,0.3);"> → </span>
        <span style="color:rgba(255,255,255,0.35);">？</span>
      </div>
    `;
  }

  private renderCommands(lastLog: { speaker: string; text: string; effect: number } | undefined): string {
    const battle = this.state.battle!;
    const candidateColor = this.getFactionColor();

    if (battle.phase === 'select_attitude') {
      return `
        <div style="color:#f0d060; font-size:0.85em; margin-bottom:8px; text-align:center; font-weight:bold;">
          ${t('battle.phaseAttitude')}
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${this.renderAttitudeBtn('friendly', t('battle.attitudeFriendly'), t('battle.attitudeFriendlySub'), '#27AE60')}
          ${this.renderAttitudeBtn('normal', t('battle.attitudeNormal'), t('battle.attitudeNormalSub'), '#4A90D9')}
          ${this.renderAttitudeBtn('strong', t('battle.attitudeStrong'), t('battle.attitudeStrongSub'), '#E07820')}
        </div>
      `;
    }

    if (battle.phase === 'select_topic') {
      const faction = this.state.faction!;
      const factionTopicsHtml = (
        [
          { id: 'conservative', label: t('battle.topicConservative') },
          { id: 'progressive', label: t('battle.topicProgressive') },
          { id: 'sports', label: t('battle.topicSports') },
        ] as { id: FactionId; label: string }[]
      ).map(ft =>
        `<button data-topic="${ft.id}" class="game-btn" style="
          padding:8px 12px; text-align:left; width:100%;
          background:${ft.id === faction ? `linear-gradient(180deg,${candidateColor},${candidateColor}aa)` : 'linear-gradient(180deg,rgba(40,50,80,0.8),rgba(20,30,50,0.8))'};
          border-color:${ft.id === faction ? candidateColor : 'var(--game-panel-border)'};
          font-size:0.82em; font-family:var(--game-font);
        ">
          ${ft.id === faction ? '★ ' : ''}${ft.label}
        </button>`
      ).join('');

      const revealedHobbies = Array.from(battle.student.revealedHobbies);
      const hobbyTopicsHtml = (Object.entries(HOBBY_LABELS) as [HobbyTopic, string][])
        .map(([id, label]) => {
          const isRevealed = revealedHobbies.includes(id);
          const pref = isRevealed ? battle.student.hobbies[id] : null;
          const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : pref === 'neutral' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)';
          const prefIcon = pref === 'like' ? ' ♥' : pref === 'dislike' ? ' ✗' : pref === 'neutral' ? ' ―' : '';
          const useCount = battle.topicUseCounts[id] ?? 0;
          const useMark = useCount >= 2 ? ' ×' : useCount === 1 ? ' △' : '';
          const dimStyle = useCount >= 2 ? 'opacity:0.4;' : '';
          return `
            <button data-topic="${id}" class="game-btn" style="
              padding:8px 12px; text-align:left;
              background:linear-gradient(180deg,rgba(40,50,80,0.6),rgba(20,30,50,0.6));
              border-color:rgba(74,96,144,0.5);
              color:${prefColor}; font-size:0.82em; font-family:var(--game-font);
              ${dimStyle}
            ">
              ${label}${prefIcon}${!isRevealed ? ' ?' : ''}${useMark}
            </button>
          `;
        }).join('');

      const attLabel = battle.selectedAttitude ? this.getAttitudeLabel(battle.selectedAttitude) : null;
      return `
        ${attLabel ? this.renderBreadcrumb([{ text: attLabel.text, color: attLabel.color }]) : ''}
        <div style="color:#f0d060; font-size:0.85em; margin-bottom:8px; text-align:center; font-weight:bold;">
          ${t('battle.phaseTopic')}
        </div>
        <div style="margin-bottom:8px;">
          <div style="font-size:0.75em; color:rgba(255,255,255,0.5); margin-bottom:4px;">${t('battle.factionTopicHeader')} <span style="color:#7EC8F0;">${t('battle.factionTopicHint')}</span></div>
          <div style="display:flex; flex-direction:column; gap:4px;">${factionTopicsHtml}</div>
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:0.75em; color:rgba(255,255,255,0.5); margin-bottom:4px;">${t('battle.hobbyTopicHeader')}<span style="color:#F0D070;">${t('battle.hobbyTopicHint')}</span></div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">${hobbyTopicsHtml}</div>
        </div>
        <button id="cancel-btn" class="game-btn" style="
          width:100%; padding:10px;
          background:linear-gradient(180deg,rgba(60,70,100,0.6),rgba(30,40,60,0.6));
          border-color:var(--game-panel-border);
          color:var(--game-text-dim); font-size:0.85em; font-family:var(--game-font);
        ">${t('battle.cancelToAttitude')}</button>
      `;
    }

    if (battle.phase === 'select_stance') {
      const attLabel = battle.selectedAttitude ? this.getAttitudeLabel(battle.selectedAttitude) : null;
      const topLabel = battle.selectedTopic ? this.getTopicLabel(battle.selectedTopic) : null;
      const breadcrumbParts: { text: string; color?: string }[] = [];
      if (attLabel) breadcrumbParts.push({ text: attLabel.text, color: attLabel.color });
      if (topLabel) breadcrumbParts.push({ text: topLabel });
      return `
        ${breadcrumbParts.length > 0 ? this.renderBreadcrumb(breadcrumbParts) : ''}
        <div style="color:#f0d060; font-size:0.85em; margin-bottom:8px; text-align:center; font-weight:bold;">
          ${t('battle.phaseStance')}
        </div>
        <div style="display:flex; gap:10px; margin-bottom:12px;">
          <button data-stance="positive" class="game-btn game-btn-success" style="
            flex:1; padding:16px;
            font-size:1em; font-family:var(--game-font);
          ">${t('battle.stancePositive')}</button>
          <button data-stance="negative" class="game-btn game-btn-danger" style="
            flex:1; padding:16px;
            font-size:1em; font-family:var(--game-font);
          ">${t('battle.stanceNegative')}</button>
        </div>
        <button id="cancel-btn" class="game-btn" style="
          width:100%; padding:10px;
          background:linear-gradient(180deg,rgba(60,70,100,0.6),rgba(30,40,60,0.6));
          border-color:var(--game-panel-border);
          color:var(--game-text-dim); font-size:0.85em; font-family:var(--game-font);
        ">${t('battle.cancelToTopic')}</button>
      `;
    }

    if (battle.phase === 'resolving') {
      const attLabel = battle.selectedAttitude ? this.getAttitudeLabel(battle.selectedAttitude) : null;
      const topLabel = battle.selectedTopic ? this.getTopicLabel(battle.selectedTopic) : null;
      const isPositive = battle.selectedStance === 'positive';
      const stanceLabel = isPositive ? t('battle.stancePositive') : t('battle.stanceNegative');
      const stanceColor = isPositive ? '#7EC850' : '#F07070';

      return `
        <div style="text-align:center; padding:16px;">
          <div style="
            display:inline-flex; align-items:center; gap:6px;
            font-size:0.85em; padding:8px 16px;
            background:rgba(255,255,255,0.08); border-radius:8px;
            margin-bottom:12px;
          ">
            ${attLabel ? `<span style="color:${attLabel.color}; font-weight:bold;">${attLabel.text}</span>` : ''}
            <span style="color:rgba(255,255,255,0.3);">→</span>
            ${topLabel ? `<span style="color:rgba(255,255,255,0.8); font-weight:bold;">${topLabel}</span>` : ''}
            <span style="color:rgba(255,255,255,0.3);">→</span>
            <span style="color:${stanceColor}; font-weight:bold;">${stanceLabel}</span>
          </div>
          <div style="color:rgba(255,255,255,0.7); font-size:0.9em;">
            ${lastLog ? lastLog.text : '...'}
          </div>
          <div style="margin-top:12px; font-size:0.8em; color:rgba(255,255,255,0.4);">
            ${t('battle.waitingReaction')}
          </div>
        </div>
      `;
    }

    return '';
  }

  private renderAttitudeBtn(id: PlayerAttitude, label: string, sub: string, color: string): string {
    const cost = { friendly: 3, normal: 5, strong: 8 }[id];
    const disabled = this.state.stamina < cost;
    return `
      <button data-attitude="${id}" class="game-btn ${disabled ? 'game-btn-disabled' : ''}" style="
        padding:12px 16px; text-align:left; width:100%;
        background:${disabled ? 'linear-gradient(180deg,#555,#333)' : `linear-gradient(180deg,${color}cc,${color}88)`};
        border-color:${disabled ? '#666' : color};
        font-size:0.9em; font-family:var(--game-font);
        display:flex; justify-content:space-between; align-items:center;
        opacity:${disabled ? '0.5' : '1'};
      " ${disabled ? 'disabled' : ''}>
        <span style="font-weight:bold;">${label}</span>
        <span style="font-size:0.8em; opacity:0.8;">${sub}</span>
      </button>
    `;
  }

  private attachEvents(): void {
    const battle = this.state.battle!;

    // メッセージボックスタップで展開/折りたたみ
    this.container.querySelector('#battle-log-box')?.addEventListener('pointerup', () => {
      this.showLog = !this.showLog;
      this.render();
    });

    // BGM音量アイコン -> ダイアログ表示
    const bgmIcon = this.container.querySelector<HTMLElement>('#bgm-icon');
    bgmIcon?.addEventListener('pointerup', () => {
      this.showVolumeDialog = true;
      this.render();
    });

    // BGM音量ダイアログ
    if (this.showVolumeDialog) {
      const bgmSlider = this.container.querySelector<HTMLInputElement>('#bgm-volume-dialog');
      const volLabel = this.container.querySelector<HTMLElement>('#bgm-volume-label');
      bgmSlider?.addEventListener('input', () => {
        const v = parseInt(bgmSlider.value, 10) / 100;
        bgm.setVolume(v);
        if (volLabel) volLabel.textContent = `${Math.round(v * 100)}%`;
        const dialogIcon = this.container.querySelector<HTMLElement>('#bgm-dialog-icon');
        if (dialogIcon) dialogIcon.textContent = v > 0 ? '🔊' : '🔇';
      });
      this.container.querySelector('#close-volume-dialog')?.addEventListener('pointerup', () => {
        this.showVolumeDialog = false;
        this.render();
      });
    }

    // 各種アクションボタン
    this.container.querySelectorAll<HTMLButtonElement>('[data-attitude]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        if (battle.phase === 'select_attitude' && !btn.disabled) {
          this.callbacks.onAttitudeSelect(btn.dataset['attitude'] as PlayerAttitude);
        }
      });
    });

    // 話題選択
    this.container.querySelectorAll<HTMLButtonElement>('[data-topic]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        if (battle.phase === 'select_topic') {
          this.callbacks.onTopicSelect(btn.dataset['topic'] as Topic);
        }
      });
    });

    // 立場選択
    this.container.querySelectorAll<HTMLButtonElement>('[data-stance]').forEach(btn => {
      btn.addEventListener('pointerup', () => {
        if (battle.phase === 'select_stance') {
          this.callbacks.onStanceSelect(btn.dataset['stance'] as Stance);
        }
      });
    });

    // キャンセルボタン
    const cancelBtn = this.container.querySelector<HTMLButtonElement>('#cancel-btn');
    cancelBtn?.addEventListener('pointerup', () => {
      if (battle.phase === 'select_topic' || battle.phase === 'select_stance') {
        this.callbacks.onCancel(battle.phase);
      }
    });

    // バトル終了
    const finishBtn = this.container.querySelector<HTMLButtonElement>('#finish-btn');
    finishBtn?.addEventListener('pointerup', () => {
      finishBtn.dispatchEvent(new CustomEvent('battle-finish', { bubbles: true }));
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
