/**
 * WebAudio Sound Engine for Rocket Launch Sequence
 *
 * Requirements:
 * - Off by default.
 * - Zero external sound files (pure Web Audio API synthesis).
 * - Soft tick per countdown second.
 * - Low rumble (filtered noise ramped with throttle).
 * - Liftoff whoosh.
 * - Persisted in localStorage key 'bh5000_sound'.
 */

class LaunchAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rumbleSource: AudioBufferSourceNode | null = null;
  private rumbleFilter: BiquadFilterNode | null = null;
  private rumbleGain: GainNode | null = null;
  private isRumbleActive = false;

  public isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('bh5000_sound') === '1';
    } catch {
      return false;
    }
  }

  public setEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('bh5000_sound', enabled ? '1' : '0');
    } catch {}
    if (!enabled) {
      this.stopAll();
    } else {
      this.init();
    }
  }

  public init(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Soft tick per countdown second (5 to 1)
   */
  public playCountdownTick(isFinal: boolean = false): void {
    if (!this.isEnabled()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = isFinal ? 1046.5 : 740; // High C or F#5
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

    gain.gain.setValueAtTime(isFinal ? 0.18 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isFinal ? 0.12 : 0.06));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Starts low engine rumble using procedurally generated brown noise buffer
   */
  public startRumble(): void {
    if (!this.isEnabled() || this.isRumbleActive) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    // Create 2-second looped noise buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02; // Brown noise filter
      data[i] = lastOut * 3.5;
    }

    this.rumbleSource = this.ctx.createBufferSource();
    this.rumbleSource.buffer = buffer;
    this.rumbleSource.loop = true;

    this.rumbleFilter = this.ctx.createBiquadFilter();
    this.rumbleFilter.type = 'lowpass';
    this.rumbleFilter.frequency.setValueAtTime(70, this.ctx.currentTime);

    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    this.rumbleSource.connect(this.rumbleFilter);
    this.rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.masterGain);

    this.rumbleSource.start();
    this.isRumbleActive = true;
  }

  /**
   * Modulates rumble throttle (0 to 1)
   */
  public setThrottle(throttle: number): void {
    if (!this.isRumbleActive || !this.ctx || !this.rumbleGain || !this.rumbleFilter) return;
    const now = this.ctx.currentTime;
    const clamped = Math.max(0, Math.min(1, throttle));

    // Ramp filter frequency from 60Hz to 220Hz
    this.rumbleFilter.frequency.linearRampToValueAtTime(60 + clamped * 160, now + 0.1);
    // Ramp gain from 0.02 to 0.45
    this.rumbleGain.gain.linearRampToValueAtTime(0.02 + clamped * 0.43, now + 0.1);
  }

  /**
   * High-speed air rushing whoosh at liftoff and breakout
   */
  public playWhoosh(): void {
    if (!this.isEnabled()) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 1.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.3);
  }

  public stopAll(): void {
    if (this.rumbleSource) {
      try {
        this.rumbleSource.stop();
        this.rumbleSource.disconnect();
      } catch {}
      this.rumbleSource = null;
    }
    this.isRumbleActive = false;
  }
}

export const launchAudio = new LaunchAudio();
