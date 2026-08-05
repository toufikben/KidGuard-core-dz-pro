// Web Audio API Synthesizer for Emergency Panic SOS Siren Sound Effects
class EmergencyAudioSiren {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private intervalId: any = null;

  private init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  public startSiren() {
    try {
      this.init();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      if (this.isPlaying) return;

      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.oscillator.type = 'sawtooth';
      this.oscillator.frequency.setValueAtTime(600, this.audioCtx.currentTime);

      this.gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start();
      this.isPlaying = true;

      // Modulate frequency between 600Hz and 1200Hz for classic police siren effect
      let highPitch = false;
      this.intervalId = setInterval(() => {
        if (!this.oscillator || !this.audioCtx) return;
        const targetFreq = highPitch ? 600 : 1200;
        this.oscillator.frequency.exponentialRampToValueAtTime(targetFreq, this.audioCtx.currentTime + 0.35);
        highPitch = !highPitch;
      }, 400);
    } catch (e) {
      console.warn('Audio Siren playback prevented or unhandled:', e);
    }
  }

  public stopSiren() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.oscillator) {
      try {
        this.oscillator.stop();
        this.oscillator.disconnect();
      } catch (e) {
        // Ignore stop errors if already stopped
      }
      this.oscillator = null;
    }
    this.isPlaying = false;
  }

  public playCheckInChime() {
    try {
      this.init();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, this.audioCtx.currentTime + 0.15); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, this.audioCtx.currentTime + 0.3); // G5

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Chime playback error:', e);
    }
  }
}

export const audioSiren = new EmergencyAudioSiren();
