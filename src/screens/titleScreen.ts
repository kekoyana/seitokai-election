import titleBg from '../../assets/backgrounds/title.jpg';
import { bgm } from '../bgm';
import { se } from '../se';
import { hasSaveData } from '../saveLoad';
import type { Screen } from './Screen';

export interface TitleCallbacks {
  onStart: () => void;
  onContinue: () => void;
  onPersuadeTutorial: () => void;
}

export class TitleScreen implements Screen {
  private container: HTMLDivElement;
  private callbacks: TitleCallbacks;
  private showVolumeDialog: boolean = false;
  private showNewGameConfirm: boolean = false;
  private showHowToPlay: boolean = false;

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
      <span id="bgm-icon" style="
        position:absolute; top:12px; right:12px; z-index:10;
        cursor:pointer; padding:6px; font-size:1.2em; opacity:0.7;
      ">${bgm.volume > 0 ? '🔊' : '🔇'}</span>

      <div style="text-align:center; max-width:480px; width:100%;">
        <div class="game-panel" style="
          padding: 32px 24px;
          margin-bottom: 24px;
          text-align: center;
        ">
          <div class="game-title" style="font-size:2.2em; font-weight:900; letter-spacing:0.08em; margin-bottom:8px; font-style:italic;">
            Academy Tempest
          </div>
          <div style="font-size:0.95em; color:var(--game-heading-accent); letter-spacing:0.15em;">
            〜学園の風〜
          </div>
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 24px;">
          ${hasSaveData() ? `
          <button id="continue-btn" class="game-btn-etrian">
            つづきから
          </button>
          ` : ''}
          <button id="start-btn" class="game-btn-etrian">
            ${hasSaveData() ? 'はじめから' : 'ゲームスタート'}
          </button>
          <button id="howto-btn" class="game-btn-etrian-sub">
            このゲームの遊び方
          </button>
          <button id="persuade-tutorial-btn" class="game-btn-etrian-sub">
            説得バトルの遊び方
          </button>
        </div>
      </div>
    `;

    // このゲームの遊び方ダイアログ
    if (this.showHowToPlay) {
      const howtoHtml = `
        <div class="game-dialog-overlay" style="
          position:absolute; inset:0; z-index:200;
          background:rgba(0,0,20,0.4);
          display:flex; align-items:center; justify-content:center;
          animation: fadeIn 0.2s ease;
        ">
          <div class="game-panel" style="width:340px; max-width:90vw; padding:24px; text-align:left;">
            <div style="font-weight:bold; color:var(--game-heading); margin-bottom:12px; font-size:1.1em; text-align:center;">このゲームの遊び方</div>
            <p style="color:var(--game-text-dim); font-size:0.85em; line-height:1.7; margin-bottom:12px;">
              あなたは学園の1生徒。<br>
              支持する派閥の勝利を目指し、<br>
              30日間で仲間を増やしていこう。
            </p>
            <div style="font-size:0.85em; line-height:1.8; color:var(--game-text);">
              <div>・生徒を1人選んで活動を開始</div>
              <div>・体力の続く限り移動・会話・説得を繰り返す</div>
              <div>・説得バトルでターン制の綱引きに勝てば支持を獲得</div>
              <div>・30日後、組織の多数票を獲得した派閥が勝利！</div>
            </div>
            <div style="text-align:center; margin-top:16px;">
              <button id="close-howto" class="game-btn game-btn-primary" style="padding:10px 32px;">閉じる</button>
            </div>
          </div>
        </div>
      `;
      this.container.insertAdjacentHTML('beforeend', howtoHtml);

      this.container.querySelector('#close-howto')?.addEventListener('pointerup', () => {
        this.showHowToPlay = false;
        this.render();
      });
    }

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
      const bgmPct = Math.round(bgm.volume * 100);
      const sePct = Math.round(se.volume * 100);
      const volumeDialogHtml = `
        <div class="game-dialog-overlay" style="
          position:absolute; inset:0; z-index:200;
          background:rgba(0,0,20,0.4);
          display:flex; align-items:center; justify-content:center;
          animation: fadeIn 0.2s ease;
        ">
          <div class="game-panel" style="width:260px; padding:20px; text-align:center;">
            <div style="font-weight:bold; margin-bottom:15px; color:var(--game-text);">音量設定</div>
            <div style="font-size:0.85em; color:var(--game-text-dim); margin-bottom:6px; text-align:left;">BGM</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
              <span id="bgm-dialog-icon" style="font-size:1.2em;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
              <input id="bgm-volume-dialog" type="range" min="0" max="100" value="${bgmPct}" style="
                flex:1; height:6px; cursor:pointer;
                accent-color:var(--game-accent);
              "/>
              <span id="bgm-volume-label" style="font-size:0.9em; width:35px; text-align:right;">${bgmPct}%</span>
            </div>
            <div style="font-size:0.85em; color:var(--game-text-dim); margin-bottom:6px; text-align:left;">効果音</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
              <span id="se-dialog-icon" style="font-size:1.2em;">${se.volume > 0 ? '🔔' : '🔕'}</span>
              <input id="se-volume-dialog" type="range" min="0" max="100" value="${sePct}" style="
                flex:1; height:6px; cursor:pointer;
                accent-color:var(--game-accent);
              "/>
              <span id="se-volume-label" style="font-size:0.9em; width:35px; text-align:right;">${sePct}%</span>
            </div>
            <button id="close-volume-dialog" class="game-btn game-btn-primary" style="padding:8px 24px;">閉じる</button>
          </div>
        </div>
      `;
      this.container.insertAdjacentHTML('beforeend', volumeDialogHtml);
    }

    const continueBtn = this.container.querySelector<HTMLButtonElement>('#continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('pointerup', () => {
        this.callbacks.onContinue();
      });
    }

    const startBtn = this.container.querySelector<HTMLButtonElement>('#start-btn')!;
    startBtn.addEventListener('pointerup', () => {
      if (hasSaveData()) {
        this.showNewGameConfirm = true;
        this.render();
      } else {
        this.callbacks.onStart();
      }
    });

    // このゲームの遊び方ボタン
    this.container.querySelector('#howto-btn')?.addEventListener('pointerup', () => {
      this.showHowToPlay = true;
      this.render();
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
      const seSlider = this.container.querySelector<HTMLInputElement>('#se-volume-dialog');
      const seLabel = this.container.querySelector<HTMLElement>('#se-volume-label');
      seSlider?.addEventListener('input', () => {
        const v = parseInt(seSlider.value, 10) / 100;
        se.setVolume(v);
        if (seLabel) seLabel.textContent = `${Math.round(v * 100)}%`;
        const seIcon = this.container.querySelector<HTMLElement>('#se-dialog-icon');
        if (seIcon) seIcon.textContent = v > 0 ? '🔔' : '🔕';
      });
      seSlider?.addEventListener('change', () => {
        se.click(); // 音量変更後にテスト再生
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
