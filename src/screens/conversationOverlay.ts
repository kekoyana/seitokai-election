import type { ConversationStep, ConversationResult } from '../logic/conversationGenerator';
import { renderInitialIcon } from '../data';
import { showInfoDialog } from '../ui/gameDialog';

export class ConversationOverlay {
  private container: HTMLDivElement;
  private steps: ConversationStep[];
  private result: ConversationResult;
  private currentIndex = 0;
  private showingResult = false;
  private onFinish: () => void;

  // 相手とプレイヤーの情報を最初のステップから取得
  private studentInfo: { name: string; portrait: string | null } | null = null;
  private playerInfo: { name: string; portrait: string | null } | null = null;

  constructor(steps: ConversationStep[], result: ConversationResult, onFinish: () => void) {
    this.steps = steps;
    this.result = result;
    this.onFinish = onFinish;

    // ステップから相手・プレイヤー情報を抽出
    for (const s of steps) {
      if (s.speaker === 'student' && !this.studentInfo) {
        this.studentInfo = { name: s.name, portrait: s.portrait };
      }
      if (s.speaker === 'player' && !this.playerInfo) {
        this.playerInfo = { name: s.name, portrait: s.portrait };
      }
    }

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed; inset: 0; z-index: 100;
      font-family: var(--game-font);
      cursor: pointer;
    `;

    this.container.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      this.advance();
    });

    this.render();
  }

  private advance(): void {
    if (this.showingResult) return;
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this.render();
    } else {
      // 会話終了 → 結果をインフォダイアログで表示
      this.showingResult = true;
      this.container.innerHTML = '';
      this.container.style.cursor = 'default';
      showInfoDialog(this.container, {
        title: '結果',
        message: `${this.result.text}<br>${this.result.effectHtml}`,
      }).then(() => {
        this.onFinish();
      });
    }
  }

  private renderPortrait(portrait: string | null, name: string, size: number): string {
    if (portrait) {
      return `<img src="${portrait}" alt="${name}" style="
        width:${size}px; height:${size}px; border-radius:4px;
        object-fit:cover; object-position:top;
        border:2px solid var(--game-panel-border);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      "/>`;
    }
    return renderInitialIcon(name, 'flexible', size, 'var(--game-panel-border)');
  }

  /** メッセージウィンドウ（portraitRight=true でポートレートを右に配置） */
  private renderWindow(
    info: { name: string; portrait: string | null },
    text: string,
    effectHtml: string,
    active: boolean,
    portraitRight: boolean = false,
  ): string {
    const portrait = this.renderPortrait(info.portrait, info.name, 120);
    const opacity = active ? '1' : '0.4';
    const flexDir = portraitRight ? 'row-reverse' : 'row';
    const textAlign = portraitRight ? 'right' : 'left';

    return `
      <div class="game-panel" style="
        padding: 12px 14px;
        display: flex; gap: 12px; align-items: flex-start;
        flex-direction: ${flexDir};
        opacity: ${opacity};
        transition: opacity 0.15s;
        ${active ? 'animation: game-conversation-enter 0.15s ease-out;' : ''}
      ">
        <div style="flex-shrink:0;">
          ${portrait}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="
            font-size:0.8em; font-weight:900; margin-bottom:4px;
            color:var(--game-heading); letter-spacing:0.05em;
            text-align:${textAlign};
          ">${info.name}</div>
          <div style="
            font-size:1em; line-height:1.8; color:var(--game-text);
            min-height:1.8em;
          ">${text}</div>
          ${effectHtml ? `<div style="margin-top:4px; font-size:0.88em;">${effectHtml}</div>` : ''}
        </div>
      </div>
    `;
  }

  private render(): void {
    const step = this.steps[this.currentIndex];
    const isStudentSpeaking = step.speaker === 'student';

    // 上段: プレイヤーウィンドウ（ポートレート右）
    const playerText = !isStudentSpeaking ? step.text : '';
    const playerEffect = !isStudentSpeaking ? (step.effectHtml ?? '') : '';
    const playerWindow = this.playerInfo
      ? this.renderWindow(this.playerInfo, playerText || '……', playerEffect, !isStudentSpeaking, true)
      : '';

    // 下段: 相手ウィンドウ
    const studentText = isStudentSpeaking ? step.text : '';
    const studentEffect = isStudentSpeaking ? (step.effectHtml ?? '') : '';
    const studentWindow = this.studentInfo
      ? this.renderWindow(this.studentInfo, studentText || '……', studentEffect, isStudentSpeaking, false)
      : '';

    this.container.innerHTML = `
      <!-- 背景 -->
      <div style="
        position: absolute; inset: 0;
        background: rgba(0, 0, 20, 0.4);
      "></div>

      <!-- 上: プレイヤー / 下: 相手 -->
      <div style="
        position: relative; height: 100%;
        display: flex; flex-direction: column;
        justify-content: flex-start;
        padding: 16px 12px;
        gap: 10px;
      ">
        ${playerWindow}
        ${studentWindow}

        <!-- 進行ヒント -->
        <div class="game-pulse" style="
          text-align: center; padding: 4px;
          color: var(--game-text-dim); font-size: 0.72em;
        ">▼</div>
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
