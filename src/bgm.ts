import titleBgm from '../assets/bgm/title.ogg';
import schoolDaytimeBgm from '../assets/bgm/school_daytime.ogg';
import settokuBgm from '../assets/bgm/settoku.ogg';

const STORAGE_KEY = 'seitokai_bgm_enabled';

class BgmManager {
  private audio: HTMLAudioElement | null = null;
  private currentSrc: string | null = null;
  private pendingSrc: string | null = null;
  private pendingVolume = 0.3;
  private _enabled: boolean;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    this._enabled = stored === null ? true : stored === '1';
  }

  get enabled(): boolean {
    return this._enabled;
  }

  setEnabled(on: boolean): void {
    this._enabled = on;
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    if (on) {
      // ミュート解除：保留中の曲があれば再生
      if (this.pendingSrc) {
        this.playInternal(this.pendingSrc, this.pendingVolume);
      }
    } else {
      this.stopInternal();
    }
  }

  toggle(): boolean {
    this.setEnabled(!this._enabled);
    return this._enabled;
  }

  play(src: string, volume = 0.3): void {
    this.pendingSrc = src;
    this.pendingVolume = volume;
    if (!this._enabled) return;
    if (this.currentSrc === src && this.audio && !this.audio.paused) return;
    this.playInternal(src, volume);
  }

  stop(): void {
    this.pendingSrc = null;
    this.stopInternal();
  }

  setVolume(volume: number): void {
    this.pendingVolume = Math.max(0, Math.min(1, volume));
    if (this.audio) this.audio.volume = this.pendingVolume;
  }

  private playInternal(src: string, volume: number): void {
    this.stopInternal();
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = volume;
    this.currentSrc = src;
    this.audio.play().catch(() => {
      const resume = () => {
        if (this._enabled) this.audio?.play().catch(() => {});
        document.removeEventListener('pointerup', resume);
        document.removeEventListener('keydown', resume);
      };
      document.addEventListener('pointerup', resume, { once: true });
      document.addEventListener('keydown', resume, { once: true });
    });
  }

  private stopInternal(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
      this.currentSrc = null;
    }
  }
}

export const bgm = new BgmManager();

export const BGM_TRACKS = {
  title: titleBgm,
  schoolDaytime: schoolDaytimeBgm,
  settoku: settokuBgm,
} as const;
