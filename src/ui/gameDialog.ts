/**
 * ゲーム内ダイアログ（確認・インフォメーション）
 */
import { t } from '../i18n';

export interface ConfirmDialogOptions {
  title?: string;
  message: string;
  okLabel?: string;
  cancelLabel?: string;
  okStyle?: 'primary' | 'danger' | 'warning' | 'success';
}

export interface InfoDialogOptions {
  title?: string;
  message: string;
  okLabel?: string;
  okStyle?: 'primary' | 'danger' | 'warning' | 'success';
}

function renderDialogBox(
  title: string,
  message: string,
  buttonsHtml: string,
): string {
  return `
    <div style="
      max-width:320px; width:calc(100% - 32px);
      animation: game-slide-up 0.2s ease;
    ">
      <!-- タイトルバー -->
      <div style="
        background:linear-gradient(180deg, #4898e0 0%, #2868b0 100%);
        border:3px solid var(--game-panel-border);
        border-bottom:none;
        border-radius:8px 8px 0 0;
        padding:8px 16px;
        color:#fff;
        font-weight:900;
        font-size:0.9em;
        text-shadow:0 1px 1px rgba(0,0,0,0.3);
        box-shadow:inset 0 1px 0 rgba(255,255,255,0.3);
      ">${title}</div>
      <!-- 本体 -->
      <div style="
        background:var(--game-panel-bg);
        border:3px solid var(--game-panel-border);
        border-top:none;
        border-radius:0 0 8px 8px;
        padding:20px 20px 16px;
        box-shadow:
          inset 0 0 0 1px rgba(255,255,255,0.8),
          0 4px 16px rgba(0,0,0,0.2);
      ">
        <p style="
          color:var(--game-text);
          font-size:0.92em;
          line-height:1.7;
          margin:0 0 20px;
          text-align:center;
        ">${message}</p>
        <div style="display:flex; gap:10px; justify-content:center;">
          ${buttonsHtml}
        </div>
      </div>
    </div>
  `;
}

function btnClass(style: string): string {
  return `game-btn game-btn-${style}`;
}

/**
 * 確認ダイアログを表示（Promise で結果を返す）
 */
export function showConfirmDialog(
  parent: HTMLElement,
  options: ConfirmDialogOptions,
): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'game-dialog-overlay';
    overlay.style.cssText = `
      position:absolute; inset:0; z-index:200;
      background:rgba(0,0,20,0.4);
      display:flex; align-items:center; justify-content:center;
      animation: fadeIn 0.2s ease;
      font-family:var(--game-font);
    `;

    const title = options.title ?? t('dialog.confirm');
    const okStyle = options.okStyle ?? 'primary';

    overlay.innerHTML = renderDialogBox(
      title,
      options.message,
      `
        <button data-dialog="cancel" class="${btnClass('disabled')}" style="
          padding:9px 24px; font-size:0.88em; font-family:var(--game-font);
          cursor:pointer; opacity:1;
        ">${options.cancelLabel ?? t('dialog.cancel')}</button>
        <button data-dialog="ok" class="${btnClass(okStyle)}" style="
          padding:9px 24px; font-size:0.88em; font-family:var(--game-font);
        ">${options.okLabel ?? 'OK'}</button>
      `,
    );

    parent.appendChild(overlay);

    const close = (result: boolean) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector('[data-dialog="cancel"]')?.addEventListener('pointerup', () => close(false));
    overlay.querySelector('[data-dialog="ok"]')?.addEventListener('pointerup', () => close(true));
  });
}

/**
 * インフォメーションダイアログを表示（Promise で閉じるまで待つ）
 */
export function showInfoDialog(
  parent: HTMLElement,
  options: InfoDialogOptions,
): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'game-dialog-overlay';
    overlay.style.cssText = `
      position:absolute; inset:0; z-index:200;
      background:rgba(0,0,20,0.4);
      display:flex; align-items:center; justify-content:center;
      animation: fadeIn 0.2s ease;
      font-family:var(--game-font);
    `;

    const title = options.title ?? t('dialog.notice');
    const okStyle = options.okStyle ?? 'primary';

    overlay.innerHTML = renderDialogBox(
      title,
      options.message,
      `
        <button data-dialog="ok" class="${btnClass(okStyle)}" style="
          padding:9px 32px; font-size:0.88em; font-family:var(--game-font);
        ">${options.okLabel ?? 'OK'}</button>
      `,
    );

    parent.appendChild(overlay);

    overlay.querySelector('[data-dialog="ok"]')?.addEventListener('pointerup', () => {
      overlay.remove();
      resolve();
    });
  });
}
