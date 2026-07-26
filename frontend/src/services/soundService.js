// Web Audio Sound Feedback System for Codempress
// Provides clean synth audio feedback for correct, incorrect, level up, pop, and confetti burst events
// Persists mute preference in localStorage ('codempress_sound_muted')

const STORAGE_KEY = "codempress_sound_muted";

class SoundService {
  constructor() {
    this.ctx = null;
    this.muted = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) === "true" : false;
  }

  getAudioContext() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  play(name = "pop") {
    if (this.muted) return;
    // Execute audio synthesis asynchronously off the main input click thread
    setTimeout(() => {
      if (name === "correct") return this.playCorrect();
      if (name === "incorrect") return this.playIncorrect();
      if (name === "levelup" || name === "levelUp") return this.playLevelUp();
      if (name === "confetti") return this.playConfetti();
      return this.playPop();
    }, 0);
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = !!muted;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(this.muted));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("codempress:sound-toggle", { detail: { muted: this.muted } }));
    }
    return this.muted;
  }

  toggleMute() {
    const newState = !this.muted;
    this.setMuted(newState);
    if (!newState) {
      this.playCorrect();
    }
    return newState;
  }

  playPop() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (err) {
      console.warn("Sound play error:", err);
    }
  }

  playCorrect() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (Major Arpeggio)
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch (err) {
      console.warn("Sound play error:", err);
    }
  }

  playIncorrect() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now); // A3
      osc.frequency.linearRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (err) {
      console.warn("Sound play error:", err);
    }
  }

  playLevelUp() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.2, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch (err) {
      console.warn("Sound play error:", err);
    }
  }

  playConfetti() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [880, 1174.66, 1396.91, 1760]; // A5, D6, F6, A6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.15);
      });
    } catch (err) {
      console.warn("Sound play error:", err);
    }
  }
}

export const soundService = new SoundService();
