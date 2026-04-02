export interface TitleCallbacks {
  onStart: () => void;
}

export class TitleScreen {
  private container: HTMLDivElement;
  private callbacks: TitleCallbacks;

  constructor(callbacks: TitleCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  private render(): void {
    this.container.style.cssText = `
      position: fixed; inset: 0;
      background: linear-gradient(160deg, #E8F4FD 0%, #FFF9E6 50%, #F0FAF0 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
      overflow-y: auto; padding: 20px; box-sizing: border-box;
    `;

    this.container.innerHTML = `
      <div style="text-align:center; max-width:480px; width:100%;">
        <div style="
          background: linear-gradient(135deg, #1B3A6B, #2E5FAC);
          border-radius: 16px;
          padding: 32px 24px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        ">
          <div style="font-size:2.8em; font-weight:bold; color:#fff; letter-spacing:0.1em; margin-bottom:8px; text-shadow:0 2px 8px rgba(0,0,0,0.3);">
            生徒会選挙
          </div>
          <div style="font-size:1.1em; color:#B8D4FF; letter-spacing:0.2em; margin-bottom:4px;">
            〜30日間の説得戦〜
          </div>
          <div style="
            height: 2px;
            background: linear-gradient(90deg, transparent, #B8D4FF, transparent);
            margin: 12px 0;
          "></div>
          <p style="color:#D0E8FF; font-size:0.85em; line-height:1.7;">
            あなたは学園の1生徒。<br>
            支持する候補者の当選を目指し、<br>
            30日間で仲間を増やしていこう。
          </p>
        </div>

        <div style="
          background: rgba(255,255,255,0.8);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          border: 1px solid #E0EAF5;
          text-align: left;
          font-size: 0.82em;
          color: #444;
          line-height: 1.8;
        ">
          <div style="font-weight:bold; color:#1B3A6B; margin-bottom:8px;">遊び方</div>
          <div>・生徒を1人選んで選挙活動を開始</div>
          <div>・体力の続く限り移動・会話・説得を繰り返す</div>
          <div>・説得バトルでターン制の綱引きに勝てば支持を獲得</div>
          <div>・30日後、組織の多数票を獲得した候補者が当選！</div>
        </div>

        <button id="start-btn" style="
          padding: 16px 48px;
          background: linear-gradient(135deg, #2E5FAC, #1B3A6B);
          color: #fff;
          border: none;
          border-radius: 50px;
          font-size: 1.2em;
          font-weight: bold;
          cursor: pointer;
          letter-spacing: 0.1em;
          box-shadow: 0 4px 16px rgba(30,60,120,0.35);
          transition: transform 0.1s;
          font-family: inherit;
        ">
          ゲームスタート
        </button>
      </div>
    `;

    const btn = this.container.querySelector<HTMLButtonElement>('#start-btn')!;
    btn.addEventListener('pointerdown', () => {
      btn.style.transform = 'scale(0.97)';
    });
    btn.addEventListener('pointerup', () => {
      btn.style.transform = 'scale(1)';
      this.callbacks.onStart();
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = 'scale(1)';
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
