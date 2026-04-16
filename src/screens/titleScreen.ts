import titleBg from '../../assets/backgrounds/title.jpg';
import logoImg from '../../assets/logo.png';
import { bgm } from '../bgm';
import { se } from '../se';
import { hasSaveData } from '../saveLoad';
import { t, getLang, setLang } from '../i18n';
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

    const otherLang = getLang() === 'ja' ? 'EN' : 'JA';

    this.container.innerHTML = `
      <button id="lang-toggle" style="
        position:absolute; top:12px; left:12px; z-index:10;
        cursor:pointer; padding:4px 10px; font-size:0.85em;
        background:rgba(0,0,0,0.5); color:#fff; border:1px solid rgba(255,255,255,0.4);
        border-radius:4px; font-weight:bold; letter-spacing:0.05em;
      ">${otherLang}</button>

      <span id="bgm-icon" style="
        position:absolute; top:12px; right:12px; z-index:10;
        cursor:pointer; padding:6px; font-size:1.2em; opacity:0.7;
      ">${bgm.volume > 0 ? '🔊' : '🔇'}</span>

      <div style="text-align:center; max-width:480px; width:100%;">
        <div style="margin-bottom: 24px; text-align: center;">
          <img src="${logoImg}" alt="Academy Tempest" style="width:100%; max-width:480px; height:auto; display:block; margin:0 auto;" />
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 24px;">
          ${hasSaveData() ? `
          <button id="continue-btn" class="game-btn-etrian">
            ${t('title.continue')}
          </button>
          ` : ''}
          <button id="start-btn" class="game-btn-etrian">
            ${hasSaveData() ? t('title.newGame') : t('title.gameStart')}
          </button>
          <button id="howto-btn" class="game-btn-etrian-sub">
            ${t('title.howToPlay')}
          </button>
          <button id="persuade-tutorial-btn" class="game-btn-etrian-sub">
            ${t('title.persuadeTutorial')}
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
            <div style="font-weight:bold; color:var(--game-heading); margin-bottom:12px; font-size:1.1em; text-align:center;">${t('title.howToPlayTitle')}</div>
            <p style="color:var(--game-text-dim); font-size:0.85em; line-height:1.7; margin-bottom:12px;">
              ${t('title.howToPlayDesc')}
            </p>
            <div style="font-size:0.85em; line-height:1.8; color:var(--game-text);">
              <div>${t('title.howToPlayStep1')}</div>
              <div>${t('title.howToPlayStep2')}</div>
              <div>${t('title.howToPlayStep3')}</div>
              <div>${t('title.howToPlayStep4')}</div>
            </div>
            <div style="text-align:center; margin-top:16px;">
              <button id="close-howto" class="game-btn game-btn-primary" style="padding:10px 32px;">${t('title.close')}</button>
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
            <div style="font-weight:bold; margin-bottom:12px; color:var(--game-text);">${t('title.confirm')}</div>
            <p style="color:var(--game-text); font-size:0.9em; margin-bottom:20px; line-height:1.6;">
              ${t('title.deleteConfirm')}
            </p>
            <div style="display:flex; gap:12px; justify-content:center;">
              <button id="confirm-newgame-cancel" class="game-btn game-btn-primary" style="padding:10px 24px;">${t('title.cancel')}</button>
              <button id="confirm-newgame-ok" class="game-btn game-btn-danger" style="padding:10px 24px;">${t('title.newGame')}</button>
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
            <div style="font-weight:bold; margin-bottom:15px; color:var(--game-text);">${t('title.volumeSettings')}</div>
            <div style="font-size:0.85em; color:var(--game-text-dim); margin-bottom:6px; text-align:left;">${t('title.bgm')}</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:14px;">
              <span id="bgm-dialog-icon" style="font-size:1.2em;">${bgm.volume > 0 ? '🔊' : '🔇'}</span>
              <input id="bgm-volume-dialog" type="range" min="0" max="100" value="${bgmPct}" style="
                flex:1; height:6px; cursor:pointer;
                accent-color:var(--game-accent);
              "/>
              <span id="bgm-volume-label" style="font-size:0.9em; width:35px; text-align:right;">${bgmPct}%</span>
            </div>
            <div style="font-size:0.85em; color:var(--game-text-dim); margin-bottom:6px; text-align:left;">${t('title.sfx')}</div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:20px;">
              <span id="se-dialog-icon" style="font-size:1.2em;">${se.volume > 0 ? '🔔' : '🔕'}</span>
              <input id="se-volume-dialog" type="range" min="0" max="100" value="${sePct}" style="
                flex:1; height:6px; cursor:pointer;
                accent-color:var(--game-accent);
              "/>
              <span id="se-volume-label" style="font-size:0.9em; width:35px; text-align:right;">${sePct}%</span>
            </div>
            <button id="close-volume-dialog" class="game-btn game-btn-primary" style="padding:8px 24px;">${t('title.close')}</button>
          </div>
        </div>
      `;
      this.container.insertAdjacentHTML('beforeend', volumeDialogHtml);
    }

    // 言語切り替えボタン
    this.container.querySelector('#lang-toggle')?.addEventListener('click', () => {
      setLang(getLang() === 'ja' ? 'en' : 'ja');
      this.render();
    });

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
