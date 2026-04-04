import type { ConversationStep, ConversationResult } from '../logic/conversationGenerator';
import { renderInitialIcon } from '../data';

export class ConversationOverlay {
  private container: HTMLDivElement;
  private steps: ConversationStep[];
  private result: ConversationResult;
  private currentIndex: number = 0;
  private showingResult: boolean = false;
  private onFinish: () => void;

  constructor(steps: ConversationStep[], result: ConversationResult, onFinish: () => void) {
    this.steps = steps;
    this.result = result;
    this.onFinish = onFinish;
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

  private renderPortrait(step: ConversationStep, size: number): string {
    if (step.portrait) {
      return `<img src="${step.portrait}" alt="${step.name}" style="
        width:${size}px; height:${size}px; border-radius:4px;
        object-fit:cover; object-position:top;
        border:3px solid #4a6898;
        box-shadow: 0 3px 12px rgba(0,0,0,0.5);
      "/>`;
    }
    return renderInitialIcon(step.name, 'flexible', size, '#4a6898');
  }

  private renderMessageWindow(step: ConversationStep): string {
    const isPlayer = step.speaker === 'player';
    const portrait = this.renderPortrait(step, 72);

    const effectHtml = step.effectHtml
      ? `<div style="margin-top:6px; font-size:0.88em;">${step.effectHtml}</div>`
      : '';

    // 参考画像風: ポートレートと名前+セリフが横並びのウィンドウ
    return `
      <div style="
        background: rgba(10, 15, 35, 0.94);
        border: 3px solid #4a6898;
        border-radius: 6px;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0.06),
          0 4px 16px rgba(0,0,0,0.5);
        padding: 14px 16px;
        display: flex;
        gap: 14px;
        align-items: flex-start;
        flex-direction: ${isPlayer ? 'row-reverse' : 'row'};
        animation: game-conversation-enter 0.15s ease-out;
      ">
        <!-- ポートレート -->
        <div style="flex-shrink:0;">
          ${portrait}
        </div>

        <!-- 名前 + セリフ -->
        <div style="flex:1; min-width:0;">
          <div style="
            font-size: 0.8em; font-weight: 900; margin-bottom: 6px;
            color: ${isPlayer ? '#80b8f0' : '#c8d8f0'};
            letter-spacing: 0.05em;
            text-align: ${isPlayer ? 'right' : 'left'};
          ">${step.name}</div>
          <div style="
            font-size: 1.08em; line-height: 1.8; color: #e8eaf0;
          ">${step.text}</div>
          ${effectHtml}
        </div>
      </div>
    `;
  }

  private render(): void {
    if (this.showingResult) {
      this.renderResult();
      return;
    }

    const step = this.steps[this.currentIndex];

    // 現在のステップと1つ前のステップ（あれば）を表示
    // → 対話のやり取り感を出す
    const prevStep = this.currentIndex > 0 ? this.steps[this.currentIndex - 1] : null;

    // 前のメッセージは薄く表示
    const prevWindowHtml = prevStep ? `
      <div style="opacity: 0.45; pointer-events: none;">
        ${this.renderMessageWindow(prevStep)}
      </div>
    ` : '';

    // 現在のメッセージ
    const currentWindowHtml = this.renderMessageWindow(step);

    this.container.innerHTML = `
      <!-- 背景 -->
      <div style="
        position: absolute; inset: 0;
        background: linear-gradient(180deg, rgba(8,12,25,0.88) 0%, rgba(12,20,40,0.95) 100%);
      "></div>

      <!-- レイアウト: 上下にメッセージウィンドウを配置 -->
      <div style="
        position: relative; height: 100%;
        display: flex; flex-direction: column;
        justify-content: flex-end;
        padding: 16px 12px;
        gap: 10px;
      ">
        ${prevWindowHtml}
        ${currentWindowHtml}

        <!-- 進行ヒント -->
        <div class="game-pulse" style="
          text-align: center; padding: 4px;
          color: #4a6898; font-size: 0.72em;
        ">▼</div>
      </div>
    `;
  }

  private renderResult(): void {
    this.container.innerHTML = `
      <!-- 背景 -->
      <div style="
        position: absolute; inset: 0;
        background: rgba(8, 12, 25, 0.92);
      "></div>

      <!-- 結果ポップアップ -->
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
