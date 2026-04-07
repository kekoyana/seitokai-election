import titleBg from '../../assets/backgrounds/title.jpg';
import { t } from '../i18n';
import type { Screen } from './Screen';

interface PrologueCallbacks {
  onFinish: () => void;
}

interface ProloguePage {
  html: string;
}

export class PrologueScreen implements Screen {
  private container: HTMLDivElement;
  private callbacks: PrologueCallbacks;
  private currentPage = 0;

  constructor(callbacks: PrologueCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  private getPages(): ProloguePage[] {
    return [
      {
        html: `
          <div style="text-align:center; margin-bottom:16px; font-size:0.85em; color:var(--game-text-dim); letter-spacing:0.2em;">
            ${t('prologue.page1date')}
          </div>
          <div style="font-size:1.3em; font-weight:900; text-align:center; margin-bottom:20px; color:var(--game-text); letter-spacing:0.1em;">
            ${t('prologue.page1school')}
          </div>
          <p style="color:var(--game-text); line-height:2; font-size:0.95em;">
            ${t('prologue.page1text1')}
          </p>
          <p style="color:var(--game-text); line-height:2; font-size:0.95em; margin-top:16px;">
            ${t('prologue.page1text2')}
          </p>
        `,
      },
      {
        html: `
          <p style="color:var(--game-text); line-height:2; font-size:0.95em;">
            ${t('prologue.page2text1')}
          </p>
          <p style="color:var(--game-text); line-height:2; font-size:0.95em; margin-top:12px;">
            ${t('prologue.page2text2')}
          </p>
          <p style="color:var(--game-text-dim); line-height:2; font-size:0.85em; margin-top:20px;">
            ${t('prologue.page2text3')}
          </p>
        `,
      },
      {
        html: `
          <p style="color:var(--game-text); line-height:2; font-size:0.95em;">
            ${t('prologue.page3text1')}
          </p>
          <p style="color:var(--game-text); line-height:2; font-size:0.95em; margin-top:12px;">
            ${t('prologue.page3text2')}
          </p>
        `,
      },
    ];
  }

  private render(): void {
    const pages = this.getPages();
    const isLastPage = this.currentPage >= pages.length - 1;
    const page = pages[this.currentPage];

    this.container.style.cssText = `
      position: fixed; inset: 0;
      background: url('${titleBg}') center/cover no-repeat;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: var(--game-font);
      overflow-y: auto; padding: 20px; box-sizing: border-box;
    `;

    this.container.innerHTML = `
      <button id="prologue-skip" style="
        position:absolute; top:12px; right:16px;
        background:rgba(0,0,0,0.3); color:rgba(255,255,255,0.7);
        border:1px solid rgba(255,255,255,0.3); border-radius:4px;
        padding:6px 14px; font-size:0.78em; cursor:pointer;
        font-family:var(--game-font); z-index:10;
      ">${t('prologue.skip')}</button>

      <div class="game-panel" style="
        max-width:460px; width:100%;
        padding:28px 24px;
        animation: fadeIn 0.4s ease;
      ">
        <div style="min-height:160px;">
          ${page.html}
        </div>

        <div style="margin-top:24px; text-align:center;">
          ${isLastPage ? `
            <button id="prologue-next" class="game-btn game-btn-primary" style="
              padding:14px 40px; font-size:1.05em; letter-spacing:0.1em;
            ">${t('prologue.selectFaction')}</button>
          ` : `
            <div id="prologue-next" style="
              color:var(--game-text-dim); font-size:0.85em;
              cursor:pointer; padding:8px;
              animation: game-pulse 1.5s infinite;
            ">${t('prologue.tapNext')}</div>
          `}
        </div>

        <div style="
          display:flex; justify-content:center; gap:6px;
          margin-top:16px;
        ">
          ${pages.map((_, i) => `
            <div style="
              width:8px; height:8px; border-radius:50%;
              background:${i === this.currentPage ? 'var(--game-accent)' : 'var(--game-text-dim)'};
              opacity:${i === this.currentPage ? '1' : '0.3'};
            "></div>
          `).join('')}
        </div>
      </div>
    `;

    // イベントリスナー
    this.container.querySelector('#prologue-skip')?.addEventListener('pointerup', (e) => {
      e.stopPropagation();
      this.callbacks.onFinish();
    });

    const nextEl = this.container.querySelector('#prologue-next');
    if (nextEl) {
      nextEl.addEventListener('pointerup', (e) => {
        e.stopPropagation();
        if (isLastPage) {
          this.callbacks.onFinish();
        } else {
          this.currentPage++;
          this.render();
        }
      });
    }

    // パネル外クリックでも次へ（最終ページ以外）
    if (!isLastPage) {
      this.container.addEventListener('pointerup', () => {
        this.currentPage++;
        this.render();
      }, { once: true });
    }
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
