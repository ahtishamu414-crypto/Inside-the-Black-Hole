/**
 * Beyond the Black Hole (BH-5000) - Mission Control Audio Engine
 *
 * Procedural sci-fi game simulator soundtrack & sound effects engine
 * built on the native Web Audio API. Zero external audio assets required.
 *
 * Features:
 * - Dynamic Ambient Space Soundtrack:
 *   - AMBIENT: Deep cosmic drone & floating pads (Sagittarius A* event horizon atmosphere)
 *   - RUNNING: Rhythmic telemetry pulse synchronized with simulation clock & time dilation
 *   - ALERT: Tension drone & tactical anomaly sirens when events require a decision
 *   - VICTORY: Triumphant major chord progression & celestial harmonics for score debrief
 *   - FAILURE: Low descending resonant tone on mission loss
 * - Procedural Sci-Fi SFX:
 *   - Launch spool & rocket thruster rumble
 *   - Telemetry step tick
 *   - Anomaly warning klaxon
 *   - Tactical decision chime
 *   - Mechanical terminal click
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;

  // Music state
  private isMuted: boolean = false;
  private currentMode: 'ambient' | 'running' | 'alert' | 'victory' | 'failure' = 'ambient';
  private isPlayingMusic: boolean = false;

  // Music generators & nodes
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  private padOscs: OscillatorNode[] = [];
  private padGains: GainNode[] = [];
  private padFilter: BiquadFilterNode | null = null;
  private padMasterGain: GainNode | null = null;

  private telemetryTimer: number | null = null;
  private chordTimer: number | null = null;
  private lfoOsc: OscillatorNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('bh5000_sound_muted');
      // Default to muted until user gesture or toggle to respect browser autoplay policies cleanly
      this.isMuted = storedMute === null ? false : storedMute === '1';
    }
  }

  /**
   * Initializes or resumes the AudioContext on first user interaction.
   */
  public init(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Master Compressor (Limiter)
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);
      this.compressor.connect(this.ctx.destination);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      this.masterGain.connect(this.compressor);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.55, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Algorithmic Space Reverb
      this.setupReverb();

      // Start atmospheric space music
      this.startMusic();
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Creates an algorithmic impulse response for a vast, cosmic reverberant space.
   */
  private setupReverb() {
    if (!this.ctx) return;
    try {
      const rate = this.ctx.sampleRate;
      const length = rate * 2.8; // 2.8s space decay
      const decay = 2.0;
      const buffer = this.ctx.createBuffer(2, length, rate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const factor = Math.exp(-i / (rate * (decay / 4)));
        left[i] = (Math.random() * 2 - 1) * factor;
        right[i] = (Math.random() * 2 - 1) * factor;
      }

      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = buffer;

      const reverbGain = this.ctx.createGain();
      reverbGain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      this.reverbNode.connect(reverbGain);
      if (this.masterGain) {
        reverbGain.connect(this.masterGain);
      }
    } catch {
      // Graceful fallback if convolver unavailable
      this.reverbNode = null;
    }
  }

  /**
   * Toggles mute state and saves preference to localStorage.
   */
  public toggleMute(): boolean {
    this.init();
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('bh5000_sound_muted', this.isMuted ? '1' : '0');
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.85, now + 0.15);
    }

    if (!this.isMuted && !this.isPlayingMusic) {
      this.startMusic();
    }

    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, vol));
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : clamped * 0.85, now);
  }

  /**
   * Starts the procedural space ambient background music.
   */
  private startMusic() {
    if (!this.ctx || !this.musicGain || this.isPlayingMusic) return;
    this.isPlayingMusic = true;

    const now = this.ctx.currentTime;

    // 1. Cosmic Sub-Bass Drone (C2 65.41 Hz + Detuned C2 65.75 Hz)
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(140, now);
    this.droneFilter.Q.setValueAtTime(2.5, now);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.4, now);
    this.droneGain.connect(this.droneFilter);
    this.droneFilter.connect(this.musicGain);

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(65.41, now); // C2

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(65.75, now); // slight chorus detune

    this.droneOsc1.connect(this.droneGain);
    this.droneOsc2.connect(this.droneGain);

    this.droneOsc1.start(now);
    this.droneOsc2.start(now);

    // Filter breathing LFO for cosmic organic movement
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, now); // 12.5s cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(60, now);
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneFilter.frequency);
    lfo.start(now);
    this.lfoOsc = lfo;

    // 2. Atmospheric Space Pad Chords
    this.setupPadProgression();

    // 3. Telemetry Arpeggiator (when RUNNING)
    this.setupTelemetryPulse();
  }

  /**
   * Slowly evolving interstellar chord progression (Cm9, Ebmaj7, Abmaj7, Gsus4).
   */
  private setupPadProgression() {
    if (!this.ctx || !this.musicGain) return;

    this.padFilter = this.ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.padFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.padMasterGain = this.ctx.createGain();
    this.padMasterGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    this.padMasterGain.connect(this.padFilter);
    this.padFilter.connect(this.musicGain);

    if (this.reverbNode) {
      this.padFilter.connect(this.reverbNode);
    }

    // Chord definitions: frequencies in Hz
    const chords = {
      ambient: [
        [130.81, 155.56, 196.0, 246.94], // C3, Eb3, G3, B3 (Cm(maj7))
        [116.54, 155.56, 174.61, 220.0], // Bb2, Eb3, F3, A3
        [103.83, 130.81, 155.56, 207.65], // Ab2, C3, Eb3, Ab3 (Abmaj)
        [98.0, 146.83, 196.0, 261.63] // G2, D3, G3, C4 (Gsus4)
      ],
      alert: [
        [123.47, 164.81, 174.61, 246.94], // B2, E3, F3, B3 (tritone dissonance)
        [110.0, 155.56, 164.81, 220.0] // A2, Eb3, E3, A3
      ],
      victory: [
        [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj9 (Celestial triumph)
        [146.83, 185.0, 220.0, 293.66], // Dmaj
        [174.61, 220.0, 261.63, 329.63] // Fmaj7
      ]
    };

    let chordIndex = 0;
    const playNextChord = () => {
      if (!this.ctx || !this.padMasterGain) return;

      const currentChords =
        this.currentMode === 'alert'
          ? chords.alert
          : this.currentMode === 'victory'
          ? chords.victory
          : chords.ambient;

      const freqs = currentChords[chordIndex % currentChords.length];
      chordIndex++;

      const now = this.ctx.currentTime;
      const duration = this.currentMode === 'alert' ? 4.0 : 8.0;

      // Clean up previous pad oscillators
      this.padOscs.forEach(o => {
        try {
          o.stop(now + 1.5);
        } catch {}
      });
      this.padOscs = [];
      this.padGains = [];

      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.padMasterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        // Soft swell envelope
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.08 / freqs.length, now + 2.0);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(this.padMasterGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);

        this.padOscs.push(osc);
        this.padGains.push(gain);
      });

      this.chordTimer = window.setTimeout(playNextChord, (duration - 1.5) * 1000);
    };

    playNextChord();
  }

  /**
   * Sets up a subtle rhythmic telemetry beep when simulation is running.
   */
  private setupTelemetryPulse() {
    const pulse = () => {
      if (this.currentMode === 'running' && !this.isMuted && this.ctx && this.musicGain) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High-tech subtle data blip
        osc.type = 'sine';
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        const f = notes[Math.floor(Math.random() * notes.length)];
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + 0.09);
      }
      this.telemetryTimer = window.setTimeout(pulse, 700);
    };
    pulse();
  }

  /**
   * Updates dynamic music mode based on simulator state.
   */
  public setMode(mode: 'ambient' | 'running' | 'alert' | 'victory' | 'failure') {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    this.init();

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.droneFilter) {
      if (mode === 'running') {
        this.droneFilter.frequency.linearRampToValueAtTime(260, now + 1.0);
      } else if (mode === 'alert') {
        this.droneFilter.frequency.linearRampToValueAtTime(380, now + 0.5);
      } else if (mode === 'victory') {
        this.droneFilter.frequency.linearRampToValueAtTime(320, now + 1.0);
      } else {
        this.droneFilter.frequency.linearRampToValueAtTime(140, now + 2.0);
      }
    }
  }

  /* ====================================================================
   * PROCEDURAL SOUND EFFECTS (SFX)
   * ==================================================================== */

  /**
   * Rocket Launch Spool & Thruster Ignition SFX.
   */
  public playLaunch() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Spooling Turbine (Sweep 80Hz -> 540Hz)
    const spool = this.ctx.createOscillator();
    const spoolGain = this.ctx.createGain();
    spool.type = 'sawtooth';
    spool.frequency.setValueAtTime(75, now);
    spool.frequency.exponentialRampToValueAtTime(540, now + 1.6);

    const spoolFilter = this.ctx.createBiquadFilter();
    spoolFilter.type = 'lowpass';
    spoolFilter.frequency.setValueAtTime(200, now);
    spoolFilter.frequency.exponentialRampToValueAtTime(800, now + 1.6);

    spoolGain.gain.setValueAtTime(0.01, now);
    spoolGain.gain.linearRampToValueAtTime(0.18, now + 0.8);
    spoolGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    spool.connect(spoolFilter);
    spoolFilter.connect(spoolGain);
    spoolGain.connect(this.sfxGain);

    spool.start(now);
    spool.stop(now + 2.1);

    // 2. Sub-Bass Thruster Ignition Rumble
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    rumble.type = 'triangle';
    rumble.frequency.setValueAtTime(45, now);
    rumble.frequency.linearRampToValueAtTime(30, now + 2.2);

    rumbleGain.gain.setValueAtTime(0.01, now);
    rumbleGain.gain.linearRampToValueAtTime(0.35, now + 0.4);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.sfxGain);

    rumble.start(now);
    rumble.stop(now + 2.5);

    // 3. Laser Anchor Lock Chime
    this.playTone(880, 'sine', 0.12, now + 1.2, 0.08);
    this.playTone(1320, 'sine', 0.15, now + 1.35, 0.14);
  }

  /**
   * Tactical Simulation Step Tick SFX.
   */
  public playStep() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(940, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.035);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Radiation Spike / Anomaly Alarm Siren SFX.
   */
  public playAlarm() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Two-tone urgent warning beep (880Hz -> 660Hz) repeated twice
    for (let i = 0; i < 2; i++) {
      const t1 = now + i * 0.28;
      const t2 = t1 + 0.12;
      this.playTone(880, 'sawtooth', 0.15, t1, 0.1, 800);
      this.playTone(660, 'sawtooth', 0.15, t2, 0.1, 800);
    }
  }

  /**
   * Tactical Decision Made / Confirmed Chime SFX.
   */
  public playDecision() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    this.playTone(587.33, 'triangle', 0.18, now, 0.15); // D5
    this.playTone(880.0, 'sine', 0.16, now + 0.09, 0.22); // A5
    this.playTone(1174.66, 'sine', 0.14, now + 0.18, 0.35); // D6
  }

  /**
   * UI Click / Toggle SFX.
   */
  public playClick() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.025);
  }

  /**
   * Mission Accomplished Celestial Fanfare.
   */
  public playSuccess() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const arpeggio = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((note, i) => {
      this.playTone(note, 'sine', 0.12, now + i * 0.12, 0.6, 2000);
    });
  }

  /**
   * Mission Failure Low Tone.
   */
  public playFailure() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.5);
  }

  private playTone(
    freq: number,
    type: OscillatorType,
    volume: number,
    startTime: number,
    duration: number,
    filterFreq: number = 1600
  ) {
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }
}

export const soundManager = new SoundManager();
