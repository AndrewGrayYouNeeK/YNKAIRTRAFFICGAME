import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const audioContext = typeof window !== "undefined" && window.AudioContext ? new window.AudioContext() : null;

function runWithAudio(play) {
  if (!audioContext) return;
  const start = () => {
    try {
      play(audioContext);
    } catch {
      // A tone that fails to schedule should not interrupt the sim.
    }
  };
  if (audioContext.state === "suspended") {
    audioContext.resume().then(start).catch(() => {});
    return;
  }
  start();
}

function playTone(freq, duration = 200, volume = 0.12, type = "sine") {
  runWithAudio((context) => {
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  });
}

function playChord(frequencies, duration = 200) {
  runWithAudio((context) => {
    const now = context.currentTime;
    const gain = context.createGain();
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);
    frequencies.forEach((freq) => {
      const osc = context.createOscillator();
      osc.connect(gain);
      osc.frequency.value = freq;
      osc.start(now);
      osc.stop(now + duration / 1000);
    });
  });
}

export const sounds = {
  radarSweep: () => playTone(440, 100, 0.1),
  planeContact: () => playTone(800, 150, 0.3),
  headingLock: () => playTone(600, 80, 0.06),
  warningBeep: () => playTone(880, 120, 0.08),
  collision: () => playChord([200, 300, 400], 400),
  landed: () => playChord([400, 500, 600], 280),
  separated: () => playTone(740, 90, 0.07),
  emergencyAlert: () => {
    playTone(880, 120, 0.1);
    setTimeout(() => playTone(880, 120, 0.1), 180);
  },
};

export function speakText(text, rate = 1) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.2;
  utterance.volume = 0.35;
  window.speechSynthesis.speak(utterance);
}

export function suspendAudio() {
  if (audioContext && audioContext.state === "running") {
    audioContext.suspend().catch(() => {});
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function resumeAudio() {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
}

/**
 * @param {number | number[]} pattern
 */
function patternIsStrong(pattern) {
  const pulses = Array.isArray(pattern) ? pattern : [pattern];
  return pulses.some((pulse) => Number(pulse) >= 150);
}

/**
 * Light tap for a command. A long or multi-pulse pattern is a heavy alert.
 * @param {number | number[]} [pattern]
 */
export function vibrate(pattern = 100) {
  if (Capacitor.isNativePlatform()) {
    const style = patternIsStrong(pattern) ? ImpactStyle.Heavy : ImpactStyle.Light;
    Haptics.impact({ style }).catch(() => {});
    return;
  }
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
