/**
 * SE（効果音）モジュール — Web Audio API による合成音
 */

const STORAGE_KEY_SE_VOLUME = 'seitokai_se_volume';

class SeManager {
  private ctx: AudioContext | null = null;
  private _volume: number;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY_SE_VOLUME);
    this._volume = stored !== null ? parseFloat(stored) : 0.5;
    if (isNaN(this._volume)) this._volume = 0.5;
  }

  get volume(): number {
    return this._volume;
  }

  get enabled(): boolean {
    return this._volume > 0;
  }

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    localStorage.setItem(STORAGE_KEY_SE_VOLUME, this._volume.toFixed(2));
  }

  private getCtx(): AudioContext | null {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 1.0,
    ramp?: { freq: number; time: number },
  ): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (ramp) {
      osc.frequency.linearRampToValueAtTime(ramp.freq, ctx.currentTime + ramp.time);
    }

    const vol = this._volume * volume * 0.3; // マスター音量を抑えめに
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume: number = 1.0): void {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);

    const gain = ctx.createGain();
    const vol = this._volume * volume * 0.15;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
  }

  // ── 効果音 ──

  /** ボタンクリック */
  click(): void {
    this.playTone(800, 0.08, 'square', 0.4);
  }

  /** キャンセル / 戻る */
  cancel(): void {
    this.playTone(400, 0.12, 'square', 0.3, { freq: 250, time: 0.1 });
  }

  /** 説得バトル — プレイヤーの攻撃（バー+方向） */
  barPositive(effect: number): void {
    const intensity = Math.min(1, Math.abs(effect) / 50);
    this.playTone(600 + intensity * 400, 0.15, 'sawtooth', 0.3 + intensity * 0.4);
  }

  /** 説得バトル — 相手の反撃（バー-方向） */
  barNegative(effect: number): void {
    const intensity = Math.min(1, Math.abs(effect) / 30);
    this.playTone(300 - intensity * 100, 0.2, 'sawtooth', 0.3 + intensity * 0.3);
  }

  /** 機嫌上昇 */
  moodUp(): void {
    this.playTone(523, 0.1, 'sine', 0.5);
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.5), 80);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.5), 160);
  }

  /** 機嫌下降 */
  moodDown(): void {
    this.playTone(400, 0.1, 'sine', 0.4);
    setTimeout(() => this.playTone(320, 0.15, 'sine', 0.4), 100);
  }

  /** 説得成功（ファンファーレ風） */
  victory(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'square', 0.5), i * 120);
    });
    setTimeout(() => this.playTone(1047, 0.5, 'sine', 0.6), 480);
  }

  /** 説得失敗 */
  defeat(): void {
    this.playTone(400, 0.3, 'sawtooth', 0.4, { freq: 150, time: 0.3 });
    setTimeout(() => this.playTone(150, 0.5, 'sine', 0.3), 300);
  }

  /** タイムアウト */
  timeout(): void {
    this.playTone(440, 0.2, 'triangle', 0.4);
    setTimeout(() => this.playTone(380, 0.3, 'triangle', 0.3), 200);
  }

  /** 日送り（学校チャイム風 — ドミソド） */
  nextDay(): void {
    const chime = [523, 659, 784, 1047];
    chime.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.4, 'sine', 0.5), i * 300);
    });
  }

  /** 会話開始 */
  talkStart(): void {
    this.playTone(660, 0.08, 'sine', 0.3);
    setTimeout(() => this.playTone(880, 0.1, 'sine', 0.3), 60);
  }

  /** 情報判明（趣味・属性が明らかに） */
  reveal(): void {
    this.playTone(880, 0.1, 'triangle', 0.5);
    setTimeout(() => this.playTone(1100, 0.15, 'triangle', 0.5), 80);
  }

  /** おつかい受注 */
  questAccept(): void {
    this.playTone(523, 0.1, 'square', 0.3);
    setTimeout(() => this.playTone(784, 0.15, 'square', 0.4), 100);
    setTimeout(() => this.playTone(1047, 0.2, 'square', 0.4), 200);
  }

  /** おつかい完了 */
  questComplete(): void {
    const notes = [784, 988, 1175, 1568];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.5), i * 80);
    });
  }

  /** パス（体力不足でスキップ） */
  pass(): void {
    this.playNoise(0.15, 0.5);
  }

  /** 休憩（体力回復） */
  rest(): void {
    this.playTone(440, 0.2, 'sine', 0.3);
    setTimeout(() => this.playTone(554, 0.2, 'sine', 0.3), 150);
    setTimeout(() => this.playTone(659, 0.3, 'sine', 0.4), 300);
  }
}

export const se = new SeManager();
