import titleBg from '../../assets/backgrounds/title.jpg';
import { bgm } from '../bgm';

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
      background: url('${titleBg}') center/cover no-repeat;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: var(--game-font);
      overflow-y: auto; padding: 20px; box-sizing: border-box;
    `;

    this.container.innerHTML = `
      <div style="text-align:center; max-width:480px; width:100%;">
        <div class="game-panel" style="
          padding: 32px 24px;
          margin-bottom: 24px;
          text-align: center;
        ">
          <div class="game-title" style="font-size:2.8em; font-weight:900; letter-spacing:0.15em; margin-bottom:8px;">
            生徒会選挙
          </div>
          <div style="font-size:1.1em; color:var(--game-heading-accent); letter-spacing:0.2em; margin-bottom:4px;">
            〜30日間の説得戦〜
          </div>
          <div class="game-divider"></div>
          <p style="color:var(--game-text-dim); font-size:0.85em; line-height:1.7;">
            あなたは学園の1生徒。<br>
            支持する候補者の当選を目指し、<br>
            30日間で仲間を増やしていこう。
          </p>
        </div>

        <div class="game-panel-light" style="
          padding: 16px 20px;
          margin-bottom: 24px;
          text-align: left;
          font-size: 0.82em;
          line-height: 1.8;
        ">
          <div style="font-weight:bold; color:var(--game-heading); margin-bottom:8px; font-size:1.05em;">遊び方</div>
          <div style="color:var(--game-text);">・生徒を1人選んで選挙活動を開始</div>
          <div style="color:var(--game-text);">・体力の続く限り移動・会話・説得を繰り返す</div>
          <div style="color:var(--game-text);">・説得バトルでターン制の綱引きに勝てば支持を獲得</div>
          <div style="color:var(--game-text);">・30日後、組織の多数票を獲得した候補者が当選！</div>
        </div>

        <button id="start-btn" class="game-btn game-btn-primary" style="
          padding: 16px 48px;
          font-size: 1.2em;
          letter-spacing: 0.15em;
          transition: transform 0.05s;
        ">
          ゲームスタート
        </button>

        <div style="
          display:flex; align-items:center; justify-content:center; gap:8px;
          margin-top:16px; color:var(--game-text); font-size:0.9em;
        ">
          <span id="bgm-icon" style="cursor:pointer;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
          <input id="bgm-volume" type="range" min="0" max="100" value="${Math.round(bgm.volume * 100)}" style="
            width:100px; height:4px; cursor:pointer;
            accent-color:var(--game-accent); vertical-align:middle;
          "/>
        </div>
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
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
