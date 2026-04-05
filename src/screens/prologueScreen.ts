import titleBg from '../../assets/backgrounds/title.jpg';
import { FACTION_INFO } from '../data';

interface PrologueCallbacks {
  onFinish: () => void;
}

interface ProloguePage {
  html: string;
}

export class PrologueScreen {
  private container: HTMLDivElement;
  private callbacks: PrologueCallbacks;
  private currentPage = 0;
  private pages: ProloguePage[];

  constructor(callbacks: PrologueCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');

    const [con, pro, spo] = FACTION_INFO;

    this.pages = [
      {
        html: `
          <div style="text-align:center; margin-bottom:16px; font-size:0.85em; color:var(--game-text-dim); letter-spacing:0.2em;">
            9月――
          </div>
          <div style="font-size:1.3em; font-weight:900; text-align:center; margin-bottom:20px; color:var(--game-text); letter-spacing:0.1em;">
            私立翔陽学園
          </div>
          <p style="color:var(--game-text); line-height:2; font-size:0.95em;">
            毎年恒例の学園祭。<br>
            だが今年、近隣の学園が外部公開の学園祭を始めたことで、<br>
            この学園でも「学園祭のあり方」が議論になった。
          </p>
          <p style="color:var(--game-text); line-height:2; font-size:0.95em; margin-top:16px;">
            そして――学園祭の企画を巡り、<br>
            <strong style="color:var(--game-heading-accent);">投票</strong>が行われることになった。
          </p>
        `,
      },
      {
        html: `
          <p style="color:var(--game-text); line-height:2; font-size:0.95em;">
            伝統を守るか、外に開くか、それとも――。
          </p>
          <p style="color:var(--game-text); line-height:2; font-size:0.95em; margin-top:12px;">
            生徒たちの間に<strong style="color:var(--game-heading-accent);">3つの派閥</strong>が生まれ、<br>
            学園は静かに揺れ始めた。
          </p>
          <p style="color:var(--game-text-dim); line-height:2; font-size:0.85em; margin-top:20px;">
            投票日まで、あと30日。
          </p>
        `,
      },
      {
        html: `
          <div style="font-weight:900; text-align:center; margin-bottom:16px; color:var(--game-text); font-size:1.1em;">
            3つの派閥
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${[con, pro, spo].map(f => `
              <div class="game-panel-light" style="padding:12px 16px; border-left:4px solid ${f.color};">
                <div style="font-weight:bold; color:${f.color}; margin-bottom:4px; font-size:0.95em;">
                  ${f.platform}
                </div>
                <div style="color:var(--game-text); font-size:0.82em; line-height:1.6;">
                  ${f.description}
                </div>
              </div>
            `).join('')}
          </div>
        `,
      },
      {
        html: `
          <p style="color:var(--game-text); line-height:2; font-size:0.95em;">
            あなたは学園の<strong>1人の生徒</strong>。
          </p>
          <p style="color:var(--game-text); line-height:2; font-size:0.95em; margin-top:12px;">
            支持する派閥を選び、<br>
            学園中の生徒たちと語り合い、時にぶつかり合い――<br>
            <strong style="color:var(--game-heading-accent);">30日間で仲間を増やして、投票を勝ち取ろう。</strong>
          </p>
        `,
      },
    ];

    this.render();
  }

  private render(): void {
    const isLastPage = this.currentPage >= this.pages.length - 1;
    const page = this.pages[this.currentPage];

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
      ">スキップ ▶</button>

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
            ">キャラクター選択へ</button>
          ` : `
            <div id="prologue-next" style="
              color:var(--game-text-dim); font-size:0.85em;
              cursor:pointer; padding:8px;
              animation: game-pulse 1.5s infinite;
            ">▼ タップで次へ</div>
          `}
        </div>

        <div style="
          display:flex; justify-content:center; gap:6px;
          margin-top:16px;
        ">
          ${this.pages.map((_, i) => `
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
