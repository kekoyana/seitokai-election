import titleBg from '../../assets/backgrounds/title.jpg';
import { bgm } from '../bgm';
import { hasSaveData } from '../saveLoad';

export interface TitleCallbacks {
  onStart: () => void;
  onContinue: () => void;
  onPersuadeTutorial: () => void;
}

export class TitleScreen {
  private container: HTMLDivElement;
  private callbacks: TitleCallbacks;
  private showVolumeDialog: boolean = false;
  private showNewGameConfirm: boolean = false;

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
            学園祭投票
          </div>
          <div style="font-size:1.1em; color:var(--game-heading-accent); letter-spacing:0.2em; margin-bottom:4px;">
            〜30日間の説得戦〜
          </div>
          <div class="game-divider"></div>
          <p style="color:var(--game-text-dim); font-size:0.85em; line-height:1.7;">
            あなたは学園の1生徒。<br>
            支持する派閥の勝利を目指し、<br>
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
          <div style="color:var(--game-text);">・生徒を1人選んで活動を開始</div>
          <div style="color:var(--game-text);">・体力の続く限り移動・会話・説得を繰り返す</div>
          <div style="color:var(--game-text);">・説得バトルでターン制の綱引きに勝てば支持を獲得</div>
          <div style="color:var(--game-text);">・30日後、組織の多数票を獲得した派閥が勝利！</div>
        </div>

        ${hasSaveData() ? `
        <button id="continue-btn" class="game-btn game-btn-primary" style="
          padding: 16px 48px;
          font-size: 1.2em;
          letter-spacing: 0.15em;
          transition: transform 0.05s;
          margin-bottom: 12px;
        ">
          つづきから
        </button>
        ` : ''}
        <button id="start-btn" class="game-btn game-btn-primary" style="
          padding: ${hasSaveData() ? '12px 48px' : '16px 48px'};
          font-size: ${hasSaveData() ? '1.0em' : '1.2em'};
          letter-spacing: 0.15em;
          transition: transform 0.05s;
        ">
          ${hasSaveData() ? 'はじめから' : 'ゲームスタート'}
        </button>

        <div style="margin-top:16px;">
          <button id="persuade-tutorial-btn" style="
            background:none; border:none; color:var(--game-text-dim);
            font-size:0.82em; cursor:pointer; padding:6px 12px;
            font-family:var(--game-font);
            text-decoration:underline; text-underline-offset:3px;
          ">説得バトルの遊び方</button>
        </div>

        <div style="
          display:flex; align-items:center; justify-content:center; gap:8px;
          margin-top:12px; color:var(--game-text); font-size:0.9em;
        ">
          <span id="bgm-icon" style="cursor:pointer; padding:4px;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
        </div>
      </div>
    `;

    // はじめから確認ダイアログ
    if (this.showNewGameConfirm) {
      const confirmHtml = `
        <div class="game-dialog-overlay" style="
          position:absolute; inset:0; z-index:200;
          background:rgba(0,0,20,0.4);
          display:flex; align-items:center; justify-content:center;
          animation: fadeIn 0.2s ease;
        ">
          <div class="game-panel" style="width:280px; padding:24px; text-align:center;">
            <div style="font-weight:bold; margin-bottom:12px; color:var(--game-text);">確認</div>
            <p style="color:var(--game-text); font-size:0.9em; margin-bottom:20px; line-height:1.6;">
              セーブデータを削除して<br>最初から始めますか？
            </p>
            <div style="display:flex; gap:12px; justify-content:center;">
              <button id="confirm-newgame-cancel" class="game-btn game-btn-primary" style="padding:10px 24px;">やめる</button>
              <button id="confirm-newgame-ok" class="game-btn game-btn-danger" style="padding:10px 24px;">はじめから</button>
            </div>
          </div>
        </div>
      `;
      this.container.insertAdjacentHTML('beforeend', confirmHtml);

      this.container.querySelector('#confirm-newgame-cancel')?.addEventListener('pointerup', () => {
        this.showNewGameConfirm = false;
        this.render();
      });
      this.container.querySelector('#confirm-newgame-ok')?.addEventListener('pointerup', () => {
        this.showNewGameConfirm = false;
        this.callbacks.onStart();
      });
    }

    // 音量ダイアログ
    if (this.showVolumeDialog) {
      const volPct = Math.round(bgm.volume * 100);
      const volumeDialogHtml = `
        <div class="game-dialog-overlay" style="
          position:absolute; inset:0; z-index:200;
          background:rgba(0,0,20,0.4);
          display:flex; align-items:center; justify-content:center;
          animation: fadeIn 0.2s ease;
        ">
          <div class="game-panel" style="width:240px; padding:20px; text-align:center;">
            <div style="font-weight:bold; margin-bottom:15px; color:var(--game-text);">BGM音量</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
              <span id="bgm-dialog-icon" style="font-size:1.2em;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
              <input id="bgm-volume-dialog" type="range" min="0" max="100" value="${volPct}" style="
                flex:1; height:6px; cursor:pointer;
                accent-color:var(--game-accent);
              "/>
              <span id="bgm-volume-label" style="font-size:0.9em; width:35px; text-align:right;">${volPct}%</span>
            </div>
            <button id="close-volume-dialog" class="game-btn game-btn-primary" style="padding:8px 24px;">閉じる</button>
          </div>
        </div>
      `;
      this.container.insertAdjacentHTML('beforeend', volumeDialogHtml);
    }

    const continueBtn = this.container.querySelector<HTMLButtonElement>('#continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('pointerdown', () => {
        continueBtn.style.transform = 'scale(0.97)';
      });
      continueBtn.addEventListener('pointerup', () => {
        continueBtn.style.transform = 'scale(1)';
        this.callbacks.onContinue();
      });
      continueBtn.addEventListener('pointerleave', () => {
        continueBtn.style.transform = 'scale(1)';
      });
    }

    const btn = this.container.querySelector<HTMLButtonElement>('#start-btn')!;
    btn.addEventListener('pointerdown', () => {
      btn.style.transform = 'scale(0.97)';
    });
    btn.addEventListener('pointerup', () => {
      btn.style.transform = 'scale(1)';
      if (hasSaveData()) {
        this.showNewGameConfirm = true;
        this.render();
      } else {
        this.callbacks.onStart();
      }
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = 'scale(1)';
    });

    // 説得チュートリアルボタン
    this.container.querySelector('#persuade-tutorial-btn')?.addEventListener('pointerup', () => {
      this.callbacks.onPersuadeTutorial();
    });

    // BGM音量アイコン -> ダイアログ表示
    const bgmIcon = this.container.querySelector<HTMLElement>('#bgm-icon');
    bgmIcon?.addEventListener('pointerup', () => {
      this.showVolumeDialog = true;
      this.render();
    });

    // BGM音量ダイアログ
    if (this.showVolumeDialog) {
      const bgmSlider = this.container.querySelector<HTMLInputElement>('#bgm-volume-dialog');
      const volLabel = this.container.querySelector<HTMLElement>('#bgm-volume-label');
      bgmSlider?.addEventListener('input', () => {
        const v = parseInt(bgmSlider.value, 10) / 100;
        bgm.setVolume(v);
        if (volLabel) volLabel.textContent = `${Math.round(v * 100)}%`;
        const dialogIcon = this.container.querySelector<HTMLElement>('#bgm-dialog-icon');
        if (dialogIcon) dialogIcon.textContent = v > 0 ? '🔊' : '🔇';
      });
      this.container.querySelector('#close-volume-dialog')?.addEventListener('pointerup', () => {
        this.showVolumeDialog = false;
        this.render();
      });
    }
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
