import confetti from "canvas-confetti";
import { soundService } from "../services/soundService";

export function fireCelebrationConfetti() {
  soundService.playConfetti();
  
  const count = 180;
  const defaults = {
    origin: { y: 0.65 }
  };

  function fire(particleRatio, opts) {
    try {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    } catch (e) {
      console.warn("Confetti error:", e);
    }
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}
