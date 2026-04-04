import type { ConversationStep, ConversationResult } from '../logic/conversationGenerator';
import { renderInitialIcon } from '../data';

export class ConversationOverlay {
  private container: HTMLDivElement;
  private steps: ConversationStep[];
  private result: ConversationResult;
  private currentIndex: number = 0;
  private showingResult: boolean = false;
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
    if (this.showingResult) {
      this.onFinish();
      return;
    }
    if (this.currentIndex < this.steps.length - 1) {
      this.currentIndex++;
      this.render();
    } else {
      this.showingResult = true;
      this.render();
    }
  }

  private renderPortrait(portrait: string | null, name: string, size: number): string {
    if (portrait) {
      return `<img src="${portrait}" alt="${name}" style="
        width:${size}px; height:${size}px; border-radius:4px;
        object-fit:cover; object-position:top;
        border:3px solid #4a6898;
        box-shadow: 0 3px 12px rgba(0,0,0,0.5);
      "/>`;
    }
    return renderInitialIcon(name, 'flexible', size, '#4a6898');
  }

  /** メッセージウィンドウ（portraitRight=true でポートレートを右に配置） */
  private renderWindow(
    info: { name: string; portrait: string | null },
    text: string,
    effectHtml: string,
    active: boolean,
    portraitRight: boolean = false,
  ): string {
    const portrait = this.renderPortrait(info.portrait, info.name, 144);
    const opacity = active ? '1' : '0.35';
    const borderColor = active ? '#5a88c0' : '#3a5878';
    const flexDir = portraitRight ? 'row-reverse' : 'row';
    const textAlign = portraitRight ? 'right' : 'left';

    return `
      <div style="
        background: rgba(10, 15, 35, 0.94);
        border: 3px solid ${borderColor};
        border-radius: 6px;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0.06),
          0 4px 16px rgba(0,0,0,0.5);
        padding: 14px 16px;
        display: flex; gap: 14px; align-items: flex-start;
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
            font-size:0.8em; font-weight:900; margin-bottom:6px;
            color:#c8d8f0; letter-spacing:0.05em;
            text-align:${textAlign};
          ">${info.name}</div>
          <div style="
            font-size:1.08em; line-height:1.8; color:#e8eaf0;
            min-height:1.8em;
          ">${text}</div>
          ${effectHtml ? `<div style="margin-top:6px; font-size:0.88em;">${effectHtml}</div>` : ''}
        </div>
      </div>
    `;
  }

  private render(): void {
    if (this.showingResult) {
      this.renderResultScreen();
      return;
    }

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
        background: linear-gradient(180deg, rgba(8,12,25,0.88) 0%, rgba(12,20,40,0.95) 100%);
      "></div>

      <!-- 上: プレイヤー / 下: 相手 -->
      <div style="
        position: relative; height: 100%;
        display: flex; flex-direction: column;
        justify-content: flex-start;
        padding: 16px 12px;
        gap: 12px;
      ">
        ${playerWindow}
        ${studentWindow}

        <!-- 進行ヒント -->
        <div class="game-pulse" style="
          text-align: center; padding: 4px;
          color: #4a6898; font-size: 0.72em;
        ">▼</div>
      </div>
    `;
  }

  private renderResultScreen(): void {
    this.container.innerHTML = `
      <div style="
        position: absolute; inset: 0;
        background: rgba(8, 12, 25, 0.92);
      "></div>

      <div style="
        position: relative; height: 100%;
        display: flex; align-items: center; justify-content: center;
        animation: game-conversation-enter 0.2s ease-out;
      ">
        <div style="
          background: rgba(10, 15, 35, 0.95);
          border: 3px solid #4a6898;
          border-radius: 8px;
          padding: 28px 36px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          max-width: 340px; width: 90%;
        ">
          <div style="
            font-size: 1.1em; color: #c8d8f0; line-height: 1.8;
            margin-bottom: 14px;
          ">${this.result.text}</div>
          <div style="font-size: 1.15em; font-weight: 700;">
            ${this.result.effectHtml}
          </div>
          <div class="game-pulse" style="
            margin-top: 20px; color: #4a6898; font-size: 0.78em;
          ">タップで閉じる</div>
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
