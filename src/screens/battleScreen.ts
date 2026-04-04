import type { GameState, PlayerAttitude, Topic, Stance, CandidateId, HobbyTopic } from '../types';
import { CANDIDATES, HOBBY_LABELS, MOOD_LABELS, renderInitialIcon } from '../data';
import { bgm } from '../bgm';
import battleBg from '../../assets/backgrounds/battle.jpg';

export interface BattleCallbacks {
  onAttitudeSelect: (attitude: PlayerAttitude) => void;
  onTopicSelect: (topic: Topic) => void;
  onStanceSelect: (stance: Stance) => void;
  onCancel: (phase: 'select_topic' | 'select_stance') => void;
}

export class BattleScreen {
  private container: HTMLDivElement;
  private state: GameState;
  private callbacks: BattleCallbacks;
  private showLog: boolean = false;

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

  private getCandidateColor(): string {
    const c = CANDIDATES.find(c => c.id === this.state.candidate);
    return c ? c.color : '#1B3A6B';
  }

  private render(): void {
    const battle = this.state.battle;
    if (!battle) return;

    const candidateColor = this.getCandidateColor();
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
          <span id="bgm-icon" style="cursor:pointer; font-size:1em; line-height:1;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
          <input id="bgm-volume" type="range" min="0" max="100" value="${Math.round(bgm.volume * 100)}" style="
            width:60px; height:4px; cursor:pointer;
            accent-color:#fff; vertical-align:middle;
          "/>
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
          <div style="font-size:1.05em; font-weight:bold;">${student.name} <span style="font-size:0.75em; font-weight:normal; opacity:0.7;">（${student.nickname}）</span></div>
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
        </div>
      </div>

      <!-- バーグラフ -->
      <div style="padding:8px 16px; flex-shrink:0;">
        <div style="
          display:flex; justify-content:space-between;
          font-size:0.72em; color:rgba(255,255,255,0.6); margin-bottom:4px;
        ">
          <span>${battle.isDefending ? '成功 (-70)' : '失敗 (-70)'}</span>
          <span style="font-size:1.1em; font-weight:bold; color:${battle.barPosition >= 0 ? '#7EC8F0' : '#F07070'};">
            ${battle.barPosition > 0 ? '+' : ''}${battle.barPosition}
          </span>
          <span>${battle.isDefending ? '失敗 (+70)' : '成功 (+70)'}</span>
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
          <!-- ゾーン表示 -->
          <div style="position:absolute; left:${((-70 + 100) / 2)}%; top:0; width:2px; height:100%; background:rgba(255,0,0,0.4);"></div>
          <div style="position:absolute; left:${((70 + 100) / 2)}%; top:0; width:2px; height:100%; background:rgba(0,200,0,0.4);"></div>
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
        : `${battle.student.name}はあなたの候補者を支持します！`;
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

  private renderCommands(lastLog: { speaker: string; text: string; effect: number } | undefined): string {
    const battle = this.state.battle!;
    const candidateColor = this.getCandidateColor();

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
      const candidate = this.state.candidate!;
      const candidateTopicsHtml = (
        [
          { id: 'conservative', label: '保守派の政策' },
          { id: 'progressive', label: '革新派の政策' },
          { id: 'sports', label: '体育派の政策' },
        ] as { id: CandidateId; label: string }[]
      ).map(t =>
        `<button data-topic="${t.id}" class="game-btn" style="
          padding:8px 12px; text-align:left; width:100%;
          background:${t.id === candidate ? `linear-gradient(180deg,${candidateColor},${candidateColor}aa)` : 'linear-gradient(180deg,rgba(40,50,80,0.8),rgba(20,30,50,0.8))'};
          border-color:${t.id === candidate ? candidateColor : 'var(--game-panel-border)'};
          font-size:0.82em; font-family:var(--game-font);
        ">
          ${t.id === candidate ? '★ ' : ''}${t.label}
        </button>`
      ).join('');

      const revealedHobbies = Array.from(battle.student.revealedHobbies);
      const hobbyTopicsHtml = (Object.entries(HOBBY_LABELS) as [HobbyTopic, string][])
        .map(([id, label]) => {
          const isRevealed = revealedHobbies.includes(id);
          const pref = isRevealed ? battle.student.hobbies[id] : null;
          const prefColor = pref === 'like' ? '#7EC850' : pref === 'dislike' ? '#F07070' : pref === 'neutral' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)';
          const prefIcon = pref === 'like' ? ' ♥' : pref === 'dislike' ? ' ✗' : pref === 'neutral' ? ' ―' : '';
          return `
            <button data-topic="${id}" class="game-btn" style="
              padding:8px 12px; text-align:left;
              background:linear-gradient(180deg,rgba(40,50,80,0.6),rgba(20,30,50,0.6));
              border-color:rgba(74,96,144,0.5);
              color:${prefColor}; font-size:0.82em; font-family:var(--game-font);
            ">
              ${label}${prefIcon}${!isRevealed ? ' ?' : ''}
            </button>
          `;
        }).join('');

      return `
        <div style="color:#f0d060; font-size:0.85em; margin-bottom:8px; text-align:center; font-weight:bold;">
          【2】話題を選択
        </div>
        <div style="margin-bottom:8px;">
          <div style="font-size:0.75em; color:rgba(255,255,255,0.5); margin-bottom:4px;">候補者の話題 <span style="color:#7EC8F0;">（バーが大きく動く）</span></div>
          <div style="display:flex; flex-direction:column; gap:4px;">${candidateTopicsHtml}</div>
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
      return `
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
      return `
        <div style="text-align:center; color:rgba(255,255,255,0.7); font-size:0.9em; padding:20px;">
          ${lastLog ? lastLog.text : '...'}
          <div style="margin-top:12px; font-size:0.8em; opacity:0.6;">相手の反応を待っています...</div>
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

    // BGM音量スライダー
    const bgmSlider = this.container.querySelector<HTMLInputElement>('#bgm-volume');
    const bgmIcon = this.container.querySelector<HTMLElement>('#bgm-icon');
    bgmSlider?.addEventListener('input', () => {
      const v = parseInt(bgmSlider.value, 10) / 100;
      bgm.setVolume(v);
      if (bgmIcon) bgmIcon.textContent = v > 0 ? '🔊' : '🔇';
    });
    bgmIcon?.addEventListener('pointerup', () => {
      const newVol = bgm.volume > 0 ? 0 : 0.3;
      bgm.setVolume(newVol);
      if (bgmSlider) bgmSlider.value = String(Math.round(newVol * 100));
      if (bgmIcon) bgmIcon.textContent = newVol > 0 ? '🔊' : '🔇';
    });

    // 態度選択
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
