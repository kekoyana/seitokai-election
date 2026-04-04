import type { GameState, PlayerAttitude, Topic, Stance, CandidateId, HobbyTopic } from '../types';
import { CANDIDATES, HOBBY_LABELS, MOOD_LABELS, renderInitialIcon } from '../data';
import { bgm } from '../bgm';

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

    this.container.style.cssText = `
      position: fixed; inset: 0;
      background: linear-gradient(160deg, #1a2a3a 0%, #2c3e50 100%);
      display: flex; flex-direction: column;
      font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
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
        <div style="
          pointer-events:auto;
          background:rgba(0,0,0,0.55); color:#fff;
          border-radius:16px; padding:5px 10px;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          font-size:0.78em; backdrop-filter:blur(4px);
        ">
          R<strong>${battle.round}</strong>/${battle.maxRounds}
        </div>
        <div style="
          pointer-events:auto;
          display:flex; gap:6px; align-items:center;
          background:rgba(0,0,0,0.55); color:#fff;
          border-radius:16px; padding:5px 10px;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          font-size:0.78em; backdrop-filter:blur(4px);
        ">
          <span>⚡<strong>${this.state.stamina}</strong></span>
          <span style="opacity:0.4;">|</span>
          <button id="bgm-toggle" style="
            background:none; border:none; padding:0;
            color:#fff; font-size:1em; cursor:pointer;
            line-height:1;
          ">${bgm.enabled ? '🔊' : '🔇'}</button>
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
              border-radius:50%; object-fit:cover; object-position:top;
              border:3px solid rgba(255,255,255,0.3);
              box-shadow:0 4px 16px rgba(0,0,0,0.5);
            "/>`
          : renderInitialIcon(student.name, student.personality, 96, 'rgba(255,255,255,0.3)')
        }
        <div style="color:#fff; min-width:120px;">
          <div style="font-size:1.05em; font-weight:bold;">${student.name}</div>
          <div style="font-size:0.82em; opacity:0.7; margin-bottom:6px;">${student.className}</div>
          <div style="
            display:inline-block;
            background:rgba(255,255,255,0.15);
            border-radius:20px; padding:3px 12px;
            font-size:0.82em;
          ">${moodEmoji[battle.enemyMood] ?? ''} ${moodLabel}</div>
        </div>
      </div>

      <!-- バーグラフ -->
      <div style="padding:8px 16px; flex-shrink:0;">
        <div style="
          display:flex; justify-content:space-between;
          font-size:0.72em; color:rgba(255,255,255,0.6); margin-bottom:4px;
        ">
          <span>失敗 (-70)</span>
          <span style="font-size:1.1em; font-weight:bold; color:${battle.barPosition >= 0 ? '#7EC8F0' : '#F07070'};">
            ${battle.barPosition > 0 ? '+' : ''}${battle.barPosition}
          </span>
          <span>成功 (+70)</span>
        </div>
        <div style="
          height:16px; background:rgba(255,255,255,0.15);
          border-radius:8px; overflow:hidden; position:relative;
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

      <!-- ログ -->
      <div style="
        flex:0 0 80px; overflow-y:auto;
        padding:4px 16px; border-top:1px solid rgba(255,255,255,0.1);
        border-bottom:1px solid rgba(255,255,255,0.1);
      ">
        ${battle.logs.slice(-4).map(log => `
          <div style="
            font-size:0.78em; padding:2px 0;
            color:${log.speaker === 'player' ? '#A8D8F0' : '#F0A8A8'};
          ">
            ${log.speaker === 'player' ? '▶' : '◀'} ${log.text}
          </div>
        `).join('')}
      </div>

      <!-- コマンド -->
      <div style="flex:1; overflow-y:auto; padding:10px 14px;">
        ${isFinished
          ? this.renderFinished()
          : this.renderCommands(lastLog)
        }
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
    let title = '説得失敗...';
    let color = '#F07070';
    let message = `${battle.student.name}は納得しませんでした`;
    let btnColor = '#555';

    if (isWin) {
      emoji = '✨';
      title = '説得成功！';
      color = '#7EC8F0';
      message = `${battle.student.name}はあなたの候補者を支持します！`;
      btnColor = '#2E5FAC';
    } else if (isTimeout) {
      emoji = '⏰';
      if (battle.barPosition > 0) {
        title = '時間切れ（やや優勢）';
        color = '#B0D8F0';
        message = `${battle.student.name}の心は少し動いたようです`;
        btnColor = '#4A6A9A';
      } else if (battle.barPosition < 0) {
        title = '時間切れ（やや劣勢）';
        color = '#F0B0A0';
        message = `相手の主張に少し押されてしまいました`;
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
        <button id="finish-btn" style="
          padding:12px 32px;
          background:${btnColor};
          color:#fff; border:none; border-radius:50px;
          font-size:1em; font-weight:bold; cursor:pointer; font-family:inherit;
        ">日常へ戻る</button>
      </div>
    `;
  }

  private renderCommands(lastLog: { speaker: string; text: string; effect: number } | undefined): string {
    const battle = this.state.battle!;
    const candidateColor = this.getCandidateColor();

    if (battle.phase === 'select_attitude') {
      return `
        <div style="color:rgba(255,255,255,0.8); font-size:0.85em; margin-bottom:8px; text-align:center;">
          【1】態度を選択
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${this.renderAttitudeBtn('friendly', 'フレンドリー', '⚡3 / 効果×0.7', '#27AE60')}
          ${this.renderAttitudeBtn('normal', 'ふつう', '⚡5 / 効果×1.0', '#4A90D9')}
          ${this.renderAttitudeBtn('strong', '強気', '⚡8 / 効果×1.2', '#E07820')}
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
        `<button data-topic="${t.id}" style="
          padding:8px 12px; text-align:left;
          background:${t.id === candidate ? candidateColor : 'rgba(255,255,255,0.1)'};
          border:1px solid rgba(255,255,255,0.2); border-radius:8px;
          color:#fff; font-size:0.82em; cursor:pointer; font-family:inherit;
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
            <button data-topic="${id}" style="
              padding:8px 12px; text-align:left;
              background:rgba(255,255,255,0.08);
              border:1px solid rgba(255,255,255,0.15); border-radius:8px;
              color:${prefColor}; font-size:0.82em; cursor:pointer; font-family:inherit;
            ">
              ${label}${prefIcon}${!isRevealed ? ' ?' : ''}
            </button>
          `;
        }).join('');

      return `
        <div style="color:rgba(255,255,255,0.8); font-size:0.85em; margin-bottom:8px; text-align:center;">
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
        <button id="cancel-btn" style="
          width:100%; padding:10px;
          background:rgba(255,255,255,0.1);
          border:1px solid rgba(255,255,255,0.3); border-radius:8px;
          color:rgba(255,255,255,0.7); font-size:0.85em; cursor:pointer; font-family:inherit;
        ">← 態度選択に戻る</button>
      `;
    }

    if (battle.phase === 'select_stance') {
      return `
        <div style="color:rgba(255,255,255,0.8); font-size:0.85em; margin-bottom:8px; text-align:center;">
          【3】立場を選択
        </div>
        <div style="display:flex; gap:10px; margin-bottom:12px;">
          <button data-stance="positive" style="
            flex:1; padding:16px;
            background:linear-gradient(135deg,#2E7D32,#1B5E20);
            color:#fff; border:none; border-radius:12px;
            font-size:1em; font-weight:bold; cursor:pointer; font-family:inherit;
          ">👍 肯定</button>
          <button data-stance="negative" style="
            flex:1; padding:16px;
            background:linear-gradient(135deg,#C62828,#7B0000);
            color:#fff; border:none; border-radius:12px;
            font-size:1em; font-weight:bold; cursor:pointer; font-family:inherit;
          ">👎 否定</button>
        </div>
        <button id="cancel-btn" style="
          width:100%; padding:10px;
          background:rgba(255,255,255,0.1);
          border:1px solid rgba(255,255,255,0.3); border-radius:8px;
          color:rgba(255,255,255,0.7); font-size:0.85em; cursor:pointer; font-family:inherit;
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
      <button data-attitude="${id}" style="
        padding:12px 16px; text-align:left;
        background:${disabled ? 'rgba(100,100,100,0.3)' : `${color}33`};
        border:2px solid ${disabled ? '#666' : color};
        border-radius:10px; color:${disabled ? '#888' : '#fff'};
        font-size:0.9em; cursor:${disabled ? 'not-allowed' : 'pointer'}; font-family:inherit;
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

    // BGMトグル
    const bgmBtn = this.container.querySelector<HTMLButtonElement>('#bgm-toggle');
    bgmBtn?.addEventListener('pointerup', () => {
      bgm.toggle();
      bgmBtn.textContent = bgm.enabled ? '🔊' : '🔇';
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
