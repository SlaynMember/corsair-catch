/**
 * Procedural audio using Web Audio API oscillators — no audio files needed.
 */

type SFXName =
  | 'cast'
  | 'splash'
  | 'bite'
  | 'reel_click'
  | 'catch'
  | 'battle_hit'
  | 'critical'
  | 'level_up'
  | 'line_snap'
  | 'menu_select';

type BGMTrack = 'sailing' | 'fishing' | 'battle';

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private currentBGM: OscillatorNode[] = [];
  private currentBGMTrack: BGMTrack | null = null;

  private loadVolume(key: string, fallback: number): number {
    try {
      const v = localStorage.getItem(`cc-vol-${key}`);
      return v !== null ? parseFloat(v) : fallback;
    } catch { return fallback; }
  }

  private saveVolume(key: string, v: number): void {
    try { localStorage.setItem(`cc-vol-${key}`, String(v)); } catch { /* noop */ }
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.loadVolume('master', 0.3);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.loadVolume('sfx', 0.5);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this.loadVolume('bgm', 0.15);
      this.bgmGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  getMasterVolume(): number {
    return this.masterGain?.gain.value ?? 0.3;
  }

  getSfxVolume(): number {
    return this.sfxGain?.gain.value ?? 0.5;
  }

  getBgmVolume(): number {
    return this.bgmGain?.gain.value ?? 0.15;
  }

  playSFX(name: SFXName): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    switch (name) {
      case 'cast':
        this.playSweep(ctx, now, 400, 120, 0.3, 'sine');
        break;
      case 'splash':
        this.playNoiseBurst(ctx, now, 0.12, 0.6);
        break;
      case 'bite':
        this.playTone(ctx, now, 440, 0.12, 'square', 0.4);
        this.playTone(ctx, now + 0.13, 880, 0.12, 'square', 0.4);
        break;
      case 'reel_click':
        this.playTone(ctx, now, 1200, 0.04, 'square', 0.2);
        break;
      case 'catch':
        this.playArpeggio(ctx, now, [262, 330, 392, 523], 0.12, 'sine', 0.5);
        break;
      case 'battle_hit':
        this.playNoiseBurst(ctx, now, 0.08, 0.7);
        this.playTone(ctx, now, 80, 0.15, 'sawtooth', 0.5);
        break;
      case 'critical':
        this.playNoiseBurst(ctx, now, 0.1, 0.8);
        this.playTone(ctx, now, 60, 0.2, 'sawtooth', 0.6);
        this.playTone(ctx, now + 0.05, 120, 0.15, 'square', 0.3);
        break;
      case 'level_up':
        this.playArpeggio(ctx, now, [262, 330, 392, 523, 659, 784], 0.1, 'sine', 0.5);
        break;
      case 'line_snap':
        this.playSweep(ctx, now, 800, 50, 0.15, 'sawtooth');
        this.playNoiseBurst(ctx, now, 0.1, 0.5);
        break;
      case 'menu_select':
        this.playTone(ctx, now, 660, 0.08, 'square', 0.25);
        break;
    }
  }

  playBGM(track: BGMTrack): void {
    if (this.currentBGMTrack === track) return;
    this.stopBGM();
    this.currentBGMTrack = track;

    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    switch (track) {
      case 'sailing':
        this.startDrone(ctx, now, [130.8, 196, 261.6], 'sine');
        break;
      case 'fishing':
        this.startDrone(ctx, now, [220, 277.2, 330], 'sine');
        break;
      case 'battle':
        this.startDrone(ctx, now, [110, 165, 220], 'sawtooth');
        break;
    }
  }

  stopBGM(): void {
    for (const osc of this.currentBGM) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.currentBGM = [];
    this.currentBGMTrack = null;
  }

  setMasterVolume(v: number): void {
    this.ensureContext();
    const clamped = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = clamped;
    this.saveVolume('master', clamped);
  }

  setSFXVolume(v: number): void {
    this.ensureContext();
    const clamped = Math.max(0, Math.min(1, v));
    if (this.sfxGain) this.sfxGain.gain.value = clamped;
    this.saveVolume('sfx', clamped);
  }

  setBGMVolume(v: number): void {
    this.ensureContext();
    const clamped = Math.max(0, Math.min(1, v));
    if (this.bgmGain) this.bgmGain.gain.value = clamped;
    this.saveVolume('bgm', clamped);
  }

  /** Suspend the audio context (pauses all sound) */
  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  /** Resume the audio context */
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // --- Primitives ---

  private playTone(
    ctx: AudioContext, startTime: number, freq: number,
    duration: number, type: OscillatorType, volume: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private playSweep(
    ctx: AudioContext, startTime: number,
    startFreq: number, endFreq: number, duration: number, type: OscillatorType
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    gain.gain.setValueAtTime(0.4, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private playNoiseBurst(ctx: AudioContext, startTime: number, duration: number, volume: number): void {
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    source.connect(gain);
    gain.connect(this.sfxGain!);
    source.start(startTime);
    source.stop(startTime + duration + 0.01);
  }

  private playArpeggio(
    ctx: AudioContext, startTime: number, notes: number[],
    noteLength: number, type: OscillatorType, volume: number
  ): void {
    for (let i = 0; i < notes.length; i++) {
      this.playTone(ctx, startTime + i * noteLength, notes[i], noteLength * 1.5, type, volume);
    }
  }

  private startDrone(ctx: AudioContext, startTime: number, freqs: number[], type: OscillatorType): void {
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      // Gentle LFO for movement
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.3 + Math.random() * 0.4;
      lfoGain.gain.value = freq * 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(startTime);

      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start(startTime);
      this.currentBGM.push(osc);
    }
  }
}

export const audio = new AudioManager();

// Suspend audio when window loses focus, resume on focus
window.addEventListener('blur', () => audio.suspend());
window.addEventListener('focus', () => audio.resume());
