import type { FactionId } from '../types';
import { FACTION_INFO } from '../data';
import { t } from '../i18n';
import dailyBg from '../../assets/backgrounds/daily.jpg';
import type { Screen } from './Screen';

export interface FactionSelectCallbacks {
  onSelect: (faction: FactionId) => void;
}

export class FactionSelectScreen implements Screen {
  private container: HTMLDivElement;
  private callbacks: FactionSelectCallbacks;

  constructor(callbacks: FactionSelectCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.render();
  }

  private render(): void {
    this.container.style.cssText = `
      position:fixed; inset:0;
      background:linear-gradient(160deg, rgba(15,25,50,0.85) 0%, rgba(30,50,80,0.85) 100%),
        url('${dailyBg}') center/cover no-repeat;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      font-family:var(--game-font);
      overflow:hidden; box-sizing:border-box;
      color:#e0e8f0; gap:24px; padding:24px;
    `;

    const cardsHtml = FACTION_INFO.map(info => `
      <button data-faction="${info.id}" style="
        width:100%; max-width:400px;
        background:linear-gradient(135deg, ${info.color}cc 0%, ${info.color} 100%);
        border:2px solid ${info.accentColor};
        border-radius:8px; padding:16px 20px;
        cursor:pointer; font-family:var(--game-font);
        color:#fff; text-align:left;
        box-shadow:0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
        transition:all 0.2s;
      ">
        <div style="font-size:1.1em; font-weight:900; margin-bottom:6px;
          text-shadow:0 2px 4px rgba(0,0,0,0.4); letter-spacing:0.05em;">
          ${info.platform}
        </div>
        <div style="font-size:0.82em; opacity:0.85; line-height:1.6;">
          ${info.description}
        </div>
      </button>
    `).join('');

    this.container.innerHTML = `
      <div style="text-align:center;">
        <h1 style="
          font-size:1.3em; margin:0 0 4px; font-weight:900;
          color:#e0e8f0; text-shadow:0 2px 4px rgba(0,0,0,0.5);
          letter-spacing:0.1em;
        ">${t('factionSelect.title')}</h1>
        <p style="font-size:0.82em; color:rgba(255,255,255,0.4); margin:0;">
          ${t('factionSelect.subtitle')}
        </p>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px; width:100%; align-items:center;">
        ${cardsHtml}
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.container.querySelectorAll<HTMLButtonElement>('[data-faction]').forEach(btn => {
      btn.addEventListener('pointerenter', () => {
        btn.style.transform = 'translateX(6px)';
        btn.style.filter = 'brightness(1.15)';
        btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
      });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
        btn.style.filter = '';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)';
      });
      btn.addEventListener('pointerup', () => {
        const faction = btn.dataset['faction'] as FactionId;
        if (faction) this.callbacks.onSelect(faction);
      });
    });
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  unmount(): void {
    this.container.remove();
  }
}
