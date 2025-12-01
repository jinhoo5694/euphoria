// Sound effect manager using Web Audio API
// Creates sci-fi bleeps and bloops programmatically

type SoundType =
  | 'click'
  | 'hover'
  | 'success'
  | 'error'
  | 'notification'
  | 'typing'
  | 'powerUp'
  | 'powerDown'
  | 'scan'
  | 'alert';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  attack?: number;
  decay?: number;
  frequencyEnd?: number;
  harmonics?: number[];
}

const soundConfigs: Record<SoundType, SoundConfig> = {
  click: {
    frequency: 800,
    duration: 0.08,
    type: 'square',
    volume: 0.15,
    attack: 0.01,
    decay: 0.07,
  },
  hover: {
    frequency: 1200,
    duration: 0.05,
    type: 'sine',
    volume: 0.08,
    attack: 0.01,
    decay: 0.04,
  },
  success: {
    frequency: 523.25, // C5
    duration: 0.3,
    type: 'sine',
    volume: 0.2,
    attack: 0.02,
    decay: 0.28,
    frequencyEnd: 783.99, // G5
  },
  error: {
    frequency: 200,
    duration: 0.3,
    type: 'sawtooth',
    volume: 0.15,
    attack: 0.01,
    decay: 0.29,
    frequencyEnd: 100,
  },
  notification: {
    frequency: 880,
    duration: 0.15,
    type: 'sine',
    volume: 0.12,
    attack: 0.02,
    decay: 0.13,
    harmonics: [1, 1.5, 2],
  },
  typing: {
    frequency: 1500,
    duration: 0.03,
    type: 'square',
    volume: 0.05,
    attack: 0.005,
    decay: 0.025,
  },
  powerUp: {
    frequency: 200,
    duration: 0.5,
    type: 'sawtooth',
    volume: 0.15,
    attack: 0.1,
    decay: 0.4,
    frequencyEnd: 800,
  },
  powerDown: {
    frequency: 800,
    duration: 0.4,
    type: 'sawtooth',
    volume: 0.15,
    attack: 0.05,
    decay: 0.35,
    frequencyEnd: 100,
  },
  scan: {
    frequency: 400,
    duration: 0.8,
    type: 'sine',
    volume: 0.1,
    attack: 0.1,
    decay: 0.7,
    frequencyEnd: 1200,
  },
  alert: {
    frequency: 600,
    duration: 0.2,
    type: 'square',
    volume: 0.18,
    attack: 0.01,
    decay: 0.19,
    harmonics: [1, 1.25],
  },
};

class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.5;
  private initialized: boolean = false;

  constructor() {
    // Check localStorage for sound preference
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('euphoria_sound_enabled');
      const savedVolume = localStorage.getItem('euphoria_sound_volume');
      if (savedEnabled !== null) {
        this.enabled = savedEnabled === 'true';
      }
      if (savedVolume !== null) {
        this.volume = parseFloat(savedVolume);
      }
    }
  }

  private async init(): Promise<boolean> {
    if (this.initialized && this.audioContext) return true;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      return false;
    }
  }

  async play(soundType: SoundType): Promise<void> {
    if (!this.enabled) return;

    // Initialize on first user interaction
    if (!this.initialized) {
      const success = await this.init();
      if (!success) return;
    }

    if (!this.audioContext || !this.masterGain) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const config = soundConfigs[soundType];
    const now = this.audioContext.currentTime;

    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, now);

    // Frequency sweep
    if (config.frequencyEnd) {
      oscillator.frequency.exponentialRampToValueAtTime(
        config.frequencyEnd,
        now + config.duration
      );
    }

    // Attack/Decay envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(
      config.volume,
      now + (config.attack || 0.01)
    );
    gainNode.gain.linearRampToValueAtTime(
      0,
      now + config.duration
    );

    // Connect and play
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + config.duration);

    // Add harmonics if specified
    if (config.harmonics) {
      for (const harmonic of config.harmonics) {
        const harmOsc = this.audioContext.createOscillator();
        const harmGain = this.audioContext.createGain();

        harmOsc.type = config.type;
        harmOsc.frequency.setValueAtTime(config.frequency * harmonic, now);

        if (config.frequencyEnd) {
          harmOsc.frequency.exponentialRampToValueAtTime(
            config.frequencyEnd * harmonic,
            now + config.duration
          );
        }

        harmGain.gain.setValueAtTime(0, now);
        harmGain.gain.linearRampToValueAtTime(
          config.volume * 0.3,
          now + (config.attack || 0.01)
        );
        harmGain.gain.linearRampToValueAtTime(0, now + config.duration);

        harmOsc.connect(harmGain);
        harmGain.connect(this.masterGain);

        harmOsc.start(now);
        harmOsc.stop(now + config.duration);
      }
    }
  }

  // Play a sequence of sounds
  async playSequence(sounds: SoundType[], interval: number = 100): Promise<void> {
    for (let i = 0; i < sounds.length; i++) {
      await this.play(sounds[i]);
      if (i < sounds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  // Play typing sound for each character
  async playTyping(text: string, speed: number = 30): Promise<void> {
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== ' ') {
        await this.play('typing');
      }
      await new Promise(resolve => setTimeout(resolve, speed));
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('euphoria_sound_enabled', String(enabled));
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('euphoria_sound_volume', String(this.volume));
    }
  }

  getEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Convenience functions
export const playSound = (type: SoundType) => soundManager.play(type);
export const playSequence = (sounds: SoundType[], interval?: number) =>
  soundManager.playSequence(sounds, interval);
export const setSoundEnabled = (enabled: boolean) => soundManager.setEnabled(enabled);
export const setSoundVolume = (volume: number) => soundManager.setVolume(volume);
export const isSoundEnabled = () => soundManager.getEnabled();
export const getSoundVolume = () => soundManager.getVolume();

export type { SoundType };
