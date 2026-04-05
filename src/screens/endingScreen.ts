import type { GameState, FactionId } from '../types';
import { FACTION_INFO, FACTION_LABELS, renderSupportBar } from '../data';
import { ORGANIZATIONS } from '../data/organizations';
import { getOrganizationVote } from '../logic/organizationLogic';

const WINNER_MESSAGES: Record<FactionId, string> = {
  conservative: '伝統を守り抜く。それが、この学園の誇りだ。',
  progressive: '新しい風が吹く。学園は、もっと自由になれる。',
  sports: '仲間と汗を流した日々が、俺たちの勝利だ！',
};

export interface EndingCallbacks {
  onRestart: () => void;
}

export class EndingScreen {
  private container: HTMLDivElement;
  private state: GameState;
  private callbacks: EndingCallbacks;

  constructor(state: GameState, callbacks: EndingCallbacks) {
    this.state = state;
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  private calcResults(): { factionId: string; name: string; votes: number; color: string }[] {
    const voteCounts: Record<string, number> = { conservative: 0, progressive: 0, sports: 0 };

    // 組織ベースの投票
    for (const org of ORGANIZATIONS) {
      const vote = getOrganizationVote(org, this.state.students);
      voteCounts[vote] = (voteCounts[vote] ?? 0) + 1;
    }

    return FACTION_INFO.map(f => ({
      factionId: f.id,
      name: f.platform,
      votes: voteCounts[f.id] ?? 0,
      color: f.color,
    })).sort((a, b) => b.votes - a.votes);
  }

  private render(): void {
    const isGameOver = this.state.screen === 'gameover';

    this.container.style.cssText = `
      position: fixed; inset: 0;
      background: linear-gradient(160deg, var(--game-bg-light) 0%, var(--game-bg-warm) 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: flex-start;
      font-family: var(--game-font);
      overflow-y: auto; padding: 24px 16px; box-sizing: border-box;
    `;

    if (isGameOver) {
      this.renderGameOver();
    } else {
      this.renderElectionResult();
    }

    const restartBtn = this.container.querySelector<HTMLButtonElement>('#restart-btn');
    restartBtn?.addEventListener('pointerup', () => {
      this.callbacks.onRestart();
    });
  }

  private renderGameOver(): void {
    const lastResult = this.state.lastBattleResult;
    const playerSupport = this.state.playerSupport;
    const newTop = (['conservative', 'progressive', 'sports'] as FactionId[])
      .reduce((a, b) => playerSupport[a] >= playerSupport[b] ? a : b);
    const newFaction = FACTION_INFO.find(f => f.id === newTop);
    const originalFaction = FACTION_INFO.find(f => f.id === this.state.faction);

    this.container.innerHTML = `
      <div style="max-width:480px; width:100%;">
        <div class="game-panel" style="
          border-color:#c05050;
          padding:24px;
          text-align:center; margin-bottom:20px;
        ">
          <div style="font-size:2.5em; margin-bottom:8px;">💀</div>
          <div style="font-size:1.5em; font-weight:bold; color:var(--game-text); margin-bottom:8px;">
            GAME OVER
          </div>
          <div style="color:var(--game-text-dim); font-size:0.9em; margin-bottom:16px;">
            信念が揺らぎ、あなたの支持が変わってしまった
          </div>
          <div style="
            background:rgba(0,0,0,0.05);
            border-radius:10px; padding:12px;
            font-size:0.85em; color:var(--game-text);
          ">
            ${lastResult ? `<div style="margin-bottom:8px;">${lastResult.student.name}との説得に失敗</div>` : ''}
            <div style="margin-bottom:4px;">
              <span style="color:${originalFaction?.color ?? 'var(--game-text)'};">${FACTION_LABELS[this.state.faction ?? 'conservative'] ?? ''}</span>派
              → <span style="color:${newFaction?.color ?? 'var(--game-text)'};">${FACTION_LABELS[newTop] ?? ''}</span>派に変化
            </div>
            <div style="margin-top:8px; opacity:0.9;">
              ${renderSupportBar(playerSupport, 14)}
            </div>
          </div>
        </div>

        <div style="text-align:center;">
          <button id="restart-btn" class="game-btn game-btn-primary" style="
            padding:14px 40px;
            font-size:1.05em; font-family:var(--game-font);
          ">もう一度プレイ</button>
        </div>
      </div>
    `;
  }

  private renderElectionResult(): void {
    const results = this.calcResults();
    const winner = results[0];
    const winnerFaction = FACTION_INFO.find(f => f.id === winner.factionId);
    const isVictory = winner.factionId === this.state.faction;

    // 組織ベースでプレイヤー候補を支持する組織数
    const supporterCount = ORGANIZATIONS.filter(org => {
      const vote = getOrganizationVote(org, this.state.students);
      return vote === this.state.faction;
    }).length;

    this.container.innerHTML = `
      <div style="max-width:480px; width:100%;">
        <div class="game-panel" style="
          border-color:${isVictory ? 'var(--game-heading)' : '#666'};
          padding:24px;
          text-align:center; margin-bottom:20px;
        ">
          <div style="font-size:2.5em; margin-bottom:8px;">
            ${isVictory ? '🎉' : '😔'}
          </div>
          <div style="font-size:1.5em; font-weight:bold; color:var(--game-text); margin-bottom:8px;">
            ${isVictory ? '投票に勝利！' : '投票に敗北...'}
          </div>
          <div style="color:var(--game-text-dim); font-size:0.9em; margin-bottom:16px;">
            ${this.state.day >= 30
              ? '30日間の活動が終わりました'
              : `${this.state.day}日目ですべての組織の支持が統一されました！`}
          </div>
          <div style="
            background:${winnerFaction ? `${winnerFaction.color}15` : 'rgba(0,0,0,0.05)'};
            border:1px solid ${winnerFaction ? `${winnerFaction.color}30` : 'rgba(0,0,0,0.1)'};
            border-radius:10px; padding:14px;
            font-size:0.9em; color:var(--game-text);
            margin-bottom:12px;
          ">
            <div style="font-style:italic; color:${winnerFaction?.color ?? 'var(--game-text)'}; margin-bottom:8px;">
              「${WINNER_MESSAGES[winner.factionId as FactionId] ?? ''}」
            </div>
            <div style="font-size:0.85em; text-align:right; color:var(--game-text-dim);">── ${winner.name}</div>
          </div>
          <div style="
            background:rgba(0,0,0,0.05);
            border-radius:10px; padding:12px;
            font-size:0.85em; color:var(--game-text);
          ">
            <div>勝利派閥: <strong>${winner.name}</strong> (${winner.votes}組)</div>
            <div>あなたの支持: <strong>${FACTION_LABELS[this.state.faction ?? 'conservative'] ?? ''}派</strong></div>
            <div>支持組織: <strong>${supporterCount}</strong>組 / ${ORGANIZATIONS.length}組</div>
          </div>
        </div>

        <div class="game-panel" style="
          margin-bottom:20px;
        ">
          <h3 style="font-size:0.95em; color:var(--game-heading); margin-bottom:14px; text-align:center; font-weight:bold;">
            投票結果
          </h3>
          ${results.map((r, i) => `
            <div style="
              display:flex; align-items:center; gap:10px;
              margin-bottom:10px;
            ">
              <div style="
                width:24px; height:24px; border-radius:50%;
                background:${r.color};
                display:flex; align-items:center; justify-content:center;
                color:#fff; font-size:0.75em; font-weight:bold;
                flex-shrink:0;
              ">${i + 1}</div>
              <div style="flex:1; font-size:0.88em; color:var(--game-text);">
                ${r.name}
                ${r.factionId === this.state.faction ? '<span style="color:#4A90D9; font-size:0.8em;"> (支持)</span>' : ''}
              </div>
              <div style="
                background:rgba(255,255,255,0.1);
                border:1px solid ${r.color}50;
                border-radius:3px; padding:3px 12px;
                font-size:0.82em; color:${r.color}; font-weight:bold;
              ">${r.votes}組</div>
            </div>
            <div class="game-bar" style="
              height:8px; margin-bottom:8px;
            ">
              <div class="game-bar-fill" style="
                width:${(r.votes / Math.max(ORGANIZATIONS.length, 1)) * 100}%;
                background:${r.color};
              "></div>
            </div>
          `).join('')}
        </div>

        <div class="game-panel" style="
          margin-bottom:24px;
        ">
          <h3 style="font-size:0.9em; color:var(--game-heading); margin-bottom:10px; font-weight:bold;">組織別投票結果</h3>
          ${ORGANIZATIONS.map(org => {
            const vote = getOrganizationVote(org, this.state.students);
            const sc = FACTION_INFO.find(f => f.id === vote);
            const isAlly = vote === this.state.faction;
            const leader = this.state.students.find(s => s.id === org.leaderId);
            return `
              <div style="
                display:flex; align-items:center; gap:8px;
                padding:6px; border-radius:4px;
                background:${isAlly ? `${sc?.color ?? '#888'}18` : 'rgba(255,255,255,0.03)'};
                border:1px solid ${isAlly ? `${sc?.color ?? '#888'}40` : 'transparent'};
                margin-bottom:4px;
              ">
                <div style="flex:1; font-size:0.85em; color:var(--game-text); font-weight:bold;">${org.name}</div>
                <div style="font-size:0.75em; color:var(--game-text-dim);">代表: ${leader?.name ?? org.leaderId}</div>
                <div style="font-size:0.8em; color:${sc?.color ?? '#888'}; font-weight:bold;">
                  ${FACTION_LABELS[vote] ?? ''}派
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="text-align:center;">
          <button id="restart-btn" class="game-btn game-btn-primary" style="
            padding:14px 40px;
            font-size:1.05em; font-family:var(--game-font);
          ">もう一度プレイ</button>
        </div>
      </div>
    `;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
