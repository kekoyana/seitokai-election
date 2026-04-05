import type { GameState, PlayerAttitude, Topic, Stance, FactionId, HobbyTopic } from '../types';
import { FACTION_INFO, HOBBY_LABELS, MOOD_LABELS, renderInitialIcon, renderSupportBar } from '../data';
import { bgm } from '../bgm';
import battleBg from '../../assets/backgrounds/battle.jpg';
import type { Screen } from './Screen';

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
            <div style="font-weight:bold; margin-bottom:15px; color:#fff;">BGM音量</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
              <span id="bgm-dialog-icon" style="font-size:1.2em;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
              <input id="bgm-volume-dialog" type="range" min="0" max="100" value="${volPct}" style="
                flex:1; height:6px; cursor:pointer;
                accent-color:#fff;
              "/>
              <span id="bgm-volume-label" style="font-size:0.9em; width:35px; text-align:right;">${volPct}%</span>
            </div>
            <button id="close-volume-dialog" class="game-btn game-btn-primary" style="padding:8px 24px;">閉じる</button>
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
          <span>⚡<strong>${this.state.stamina}</strong></span>
          <span style="opacity:0.4;">|</span>
          <span id="bgm-icon" style="cursor:pointer; font-size:1.1em; line-height:1; padding:2px;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
        </div>
      </div>

      <!-- キャラクター表示 -->
      <div style="
        display:flex; justify-content:center; align-items:center;
        padding:40px 12px 12px; gap:16px; flex-shrink:0;
      ">
        ${student.portrait
          ? `<img src="${student.portrait}" alt="${student.name}" style="
              width:96px; height:96px;
              border-radius:4px; object-fit:cover; object-position:top;
              border:2px solid var(--game-panel-border);
              box-shadow:0 4px 16px rgba(0,0,0,0.5);
            "/>`
          : renderInitialIcon(student.name, student.personality, 96, 'rgba(255,255,255,0.3)')
        }
        <div style="color:#fff; min-width:120px;">
          <div style="font-size:1.05em; font-weight:bold;">${student.name} <span style="font-size:0.75em; font-weight:normal; opacity:0.7;">（${student.nickname}）</span>${battle.isInLove ? '<span style="color:#FF6B9D; font-size:0.75em; margin-left:4px;">恋愛感情</span>' : ''}</div>
          <div style="font-size:0.82em; opacity:0.7; margin-bottom:6px;">${student.className}</div>
          <div style="
            display:inline-flex; align-items:center; gap:6px;
            background:rgba(255,255,255,0.15);
            border-radius:20px; padding:5px 12px;
            font-size:0.82em;
          ">
            <span>${moodEmoji[battle.enemyMood] ?? ''} ${moodLabel}</span>
          </div>
          <div style="display:flex; align-items:center; gap:4px; margin-top:4px;">
            ${moodIndicatorHtml}
          </div>
          <div style="margin-top:6px; width:120px;">
            ${renderSupportBar(student.support, 10)}
          </div>
        </div>
      </div>

      <!-- バーグラフ -->
      <div style="padding:8px 16px; flex-shrink:0;">
        <div style="
          display:flex; justify-content:space-between;
          font-size:0.72em; color:rgba(255,255,255,0.6); margin-bottom:4px;
        ">
          <span>${battle.isDefending ? '成功' : '失敗'}</span>
          <span style="font-size:1.1em; font-weight:bold; color:${battle.barPosition >= 0 ? '#7EC8F0' : '#F07070'};">
            ${battle.barPosition > 0 ? '+' : ''}${battle.barPosition}
          </span>
          <span>${battle.isDefending ? '失敗' : '成功'}</span>
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
          <!-- ゾーン表示（バー端=勝敗なのでラインは不要） -->
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
    let title = battle.isDefending ? '防衛失敗...' : '説得失敗...';
    let color = '#F07070';
    let message = battle.isDefending
      ? `${battle.student.name}の主張に押されてしまった`
      : `${battle.student.name}は納得しませんでした`;
    let btnColor = '#555';

    if (isWin) {
      emoji = '✨';
      title = battle.isDefending ? '防衛成功！' : '説得成功！';
      color = '#7EC8F0';
      message = battle.isDefending
        ? `${battle.student.name}の説得を跳ね返した！`
        : `${battle.student.name}はあなたの派閥を支持します！`;
      btnColor = '#2E5FAC';
    } else if (isTimeout) {
      emoji = '⏰';
      // 防御時はバーの意味が反転（バー>0は劣勢、バー<0は優勢）
      const effectiveBar = battle.isDefending ? -battle.barPosition : battle.barPosition;
      if (effectiveBar > 0) {
        title = '時間切れ（やや優勢）';
        color = '#B0D8F0';
        message = battle.isDefending
          ? `${battle.student.name}の説得をなんとかかわした`
          : `${battle.student.name}の心は少し動いたようです`;
        btnColor = '#4A6A9A';
      } else if (effectiveBar < 0) {
        title = '時間切れ（やや劣勢）';
        color = '#F0B0A0';
        message = battle.isDefending
          ? `${battle.student.name}の主張に少し押されてしまった`
          : `相手の主張に少し押されてしまいました`;
        btnColor = '#8A5A50';
      } else {
        title = '時間切れ（引き分け）';
        color = '#C0C0C0';
        message = `議論は平行線で終わりました`;
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
        ">日常へ戻る</button>
      </div>
    `;
  }

  private getAttitudeLabel(attitude: PlayerAttitude): { text: string; color: string } {
    const map: Record<PlayerAttitude, { text: string; color: string }> = {
      friendly: { text: '柔らかく', color: '#27AE60' },
      normal: { text: '普通に', color: '#4A90D9' },
      strong: { text: '情熱的に', color: '#E07820' },
    };
    return map[attitude];
  }

  private getTopicLabel(topic: Topic): string {
    const factionLabels: Record<string, string> = {
      conservative: '保守派の政策', progressive: '革新派の政策', sports: '体育派の政策',
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
          【1】態度を選択
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${this.renderAttitudeBtn('friendly', '柔らかく', '⚡3 / 効果×0.7', '#27AE60')}
          ${this.renderAttitudeBtn('normal', '普通に', '⚡5 / 効果×1.0', '#4A90D9')}
          ${this.renderAttitudeBtn('strong', '情熱的に', '⚡8 / 効果×1.2', '#E07820')}
        </div>
      `;
    }

    if (battle.phase === 'select_topic') {
      const faction = this.state.faction!;
      const factionTopicsHtml = (
        [
          { id: 'conservative', label: '保守派の政策' },
          { id: 'progressive', label: '革新派の政策' },
          { id: 'sports', label: '体育派の政策' },
        ] as { id: FactionId; label: string }[]
      ).map(t =>
        `<button data-topic="${t.id}" class="game-btn" style="
          padding:8px 12px; text-align:left; width:100%;
          background:${t.id === faction ? `linear-gradient(180deg,${candidateColor},${candidateColor}aa)` : 'linear-gradient(180deg,rgba(40,50,80,0.8),rgba(20,30,50,0.8))'};
          border-color:${t.id === faction ? candidateColor : 'var(--game-panel-border)'};
          font-size:0.82em; font-family:var(--game-font);
        ">
          ${t.id === faction ? '★ ' : ''}${t.label}
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
          【2】話題を選択
        </div>
        <div style="margin-bottom:8px;">
          <div style="font-size:0.75em; color:rgba(255,255,255,0.5); margin-bottom:4px;">派閥の話題 <span style="color:#7EC8F0;">（バーが大きく動く）</span></div>
          <div style="display:flex; flex-direction:column; gap:4px;">${factionTopicsHtml}</div>
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:0.75em; color:rgba(255,255,255,0.5); margin-bottom:4px;">雑談（趣味）<span style="color:#F0D070;">（相手の機嫌が変化）</span></div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;">${hobbyTopicsHtml}</div>
        </div>
        <button id="cancel-btn" class="game-btn" style="
          width:100%; padding:10px;
          background:linear-gradient(180deg,rgba(60,70,100,0.6),rgba(30,40,60,0.6));
          border-color:var(--game-panel-border);
          color:var(--game-text-dim); font-size:0.85em; font-family:var(--game-font);
        ">← 態度選択に戻る</button>
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
          【3】立場を選択
        </div>
        <div style="display:flex; gap:10px; margin-bottom:12px;">
          <button data-stance="positive" class="game-btn game-btn-success" style="
            flex:1; padding:16px;
            font-size:1em; font-family:var(--game-font);
          ">肯定</button>
          <button data-stance="negative" class="game-btn game-btn-danger" style="
            flex:1; padding:16px;
            font-size:1em; font-family:var(--game-font);
          ">否定</button>
        </div>
        <button id="cancel-btn" class="game-btn" style="
          width:100%; padding:10px;
          background:linear-gradient(180deg,rgba(60,70,100,0.6),rgba(30,40,60,0.6));
          border-color:var(--game-panel-border);
          color:var(--game-text-dim); font-size:0.85em; font-family:var(--game-font);
        ">← 話題選択に戻る</button>
      `;
    }

    if (battle.phase === 'resolving') {
      const attLabel = battle.selectedAttitude ? this.getAttitudeLabel(battle.selectedAttitude) : null;
      const topLabel = battle.selectedTopic ? this.getTopicLabel(battle.selectedTopic) : null;
      const stanceLabel = lastLog?.text.includes('肯定') ? '肯定' : '否定';
      const stanceColor = stanceLabel === '肯定' ? '#7EC850' : '#F07070';

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
            相手の反応を待っています...
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
