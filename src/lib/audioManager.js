// Audio cues for game events
const audioContext = typeof window !== "undefined" ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(freq, duration = 200, volume = 0.3, type = "sine") {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

  osc.start(now);
  osc.stop(now + duration / 1000);
}

function playChord(frequencies, duration = 200) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

  frequencies.forEach((freq) => {
    const osc = audioContext.createOscillator();
    osc.connect(gain);
    osc.frequency.value = freq;
    osc.start(now);
    osc.stop(now + duration / 1000);
  });
}

export const sounds = {
  radarSweep: () => playTone(440, 100, 0.1),
  planeContact: () => playTone(800, 150, 0.3),
  headingLock: () => playTone(600, 100, 0.2),
  warningBeep: () => playTone(1200, 200, 0.4),
  collision: () => playChord([200, 300, 400], 500),
  landed: () => playChord([400, 500, 600], 300),
  separated: () => playTone(1000, 100, 0.3),
  emergencyAlert: () => {
    playTone(1000, 150, 0.5);
    setTimeout(() => playTone(1000, 150, 0.5), 200);
  },
};

export function speakText(text, rate = 1) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.2;
  utterance.volume = 0.6;
  window.speechSynthesis.speak(utterance);
}

export function vibrate(pattern = 100) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}