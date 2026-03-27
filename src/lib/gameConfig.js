export const GHOST_TYPES = {
  poltergeist: {
    name: "Poltergeist",
    color: "red",
    health: 30,
    speed: "normal",
    emoji: "👻",
  },
  shadow: {
    name: "Shadow Figure",
    color: "purple",
    health: 50,
    speed: "fast",
    emoji: "🌑",
  },
  intelligent: {
    name: "Intelligent Spirit",
    color: "blue",
    health: 40,
    speed: "normal",
    emoji: "🧠",
  },
  orb: {
    name: "Orb",
    color: "yellow",
    health: 20,
    speed: "very_fast",
    emoji: "⚡",
  },
};

export const POWER_UPS = {
  shield: {
    name: "SHIELD",
    duration: 10000,
    icon: "🛡️",
  },
  double_damage: {
    name: "2X DAMAGE",
    duration: 8000,
    icon: "⚔️",
  },
  slow_motion: {
    name: "SLOW TIME",
    duration: 6000,
    icon: "⏱️",
  },
};

let audioContext = null;
let backgroundOscillator = null;
let backgroundGain = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

export const playSound = (type, volume = 0.1) => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(volume, ctx.currentTime);

  switch (type) {
    case "shoot":
      oscillator.frequency.value = 800;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
      break;
    case "kill":
      oscillator.frequency.value = 600;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
      break;
    case "powerup":
      oscillator.frequency.value = 1000;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
      break;
    case "wave_start":
      oscillator.frequency.value = 400;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
      break;
    case "casper":
      oscillator.frequency.value = 300;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
      break;
    case "success":
      oscillator.frequency.value = 900;
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
      break;
    default:
      break;
  }
};

export const playBackgroundMusic = (type = "strategy", volume = 0.05) => {
  const ctx = getAudioContext();
  
  if (backgroundOscillator) {
    backgroundOscillator.stop();
    backgroundGain.disconnect();
  }

  backgroundOscillator = ctx.createOscillator();
  backgroundGain = ctx.createGain();
  
  backgroundOscillator.connect(backgroundGain);
  backgroundGain.connect(ctx.destination);
  backgroundGain.gain.setValueAtTime(volume, ctx.currentTime);

  // Different frequencies for different game phases
  const frequencies = {
    strategy: [130, 164, 196], // C3, E3, G3 (C minor chord)
    ar: [165, 220, 248], // E3, A3, B3 (E minor chord)
    casper: [110, 147, 175], // A2, D3, F3 (A minor chord)
  };

  const freqs = frequencies[type] || frequencies.strategy;
  let freqIndex = 0;

  const changeFreq = () => {
    backgroundOscillator.frequency.setValueAtTime(freqs[freqIndex], ctx.currentTime);
    freqIndex = (freqIndex + 1) % freqs.length;
    setTimeout(changeFreq, 1000);
  };

  backgroundOscillator.frequency.setValueAtTime(freqs[0], ctx.currentTime);
  backgroundOscillator.start();
  changeFreq();
};

export const stopBackgroundMusic = () => {
  if (backgroundOscillator) {
    backgroundOscillator.stop();
    backgroundGain.disconnect();
    backgroundOscillator = null;
    backgroundGain = null;
  }
};

export const setMusicVolume = (volume) => {
  if (backgroundGain) {
    backgroundGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), getAudioContext().currentTime);
  }
};

export const getDifficultyScaling = (wave) => {
  return {
    ghostCount: 3 + wave * 2,
    healthMultiplier: 1 + (wave - 1) * 0.15,
    spawnRate: Math.max(2000, 4000 - wave * 300),
  };
};