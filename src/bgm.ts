import titleBgm from '../assets/bgm/title.ogg';
import schoolDaytimeBgm from '../assets/bgm/school_daytime.ogg';
import settokuBgm from '../assets/bgm/settoku.ogg';

const STORAGE_KEY_VOLUME = 'seitokai_bgm_volume';

class BgmManager {
  private audio: HTMLAudioElement | null = null;
  private currentSrc: string | null = null;
  private pendingSrc: string | null = null;
  private _volume: number;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY_VOLUME);
    this._volume = stored !== null ? parseFloat(stored) : 0.3;
    if (isNaN(this._volume)) this._volume = 0.3;
  }

  get volume(): number {
    return this._volume;
  }

  get enabled(): boolean {
    return this._volume > 0;
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    localStorage.setItem(STORAGE_KEY_VOLUME, this._volume.toFixed(2));
    if (this.audio) this.audio.volume = this._volume;
    if (this._volume > 0 && this.pendingSrc && (!this.audio || this.audio.paused)) {
      this.playInternal(this.pendingSrc, this._volume);
    }
    if (this._volume === 0) {
      this.stopInternal();
    }
  }

  play(src: string): void {
    this.pendingSrc = src;
    if (this._volume === 0) return;
    if (this.currentSrc === src && this.audio && !this.audio.paused) return;
    this.playInternal(src, this._volume);
  }

  stop(): void {
    this.pendingSrc = null;
    this.stopInternal();
  }

  private playInternal(src: string, volume: number): void {
    this.stopInternal();
    this.audio = new Audio(src);
    this.audio.loop = true;
    this.audio.volume = volume;
    this.currentSrc = src;
    this.audio.play().catch(() => {
      const resume = () => {
        if (this._volume > 0) this.audio?.play().catch(() => {});
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
