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

export const playSound = (type) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  switch (type) {
    case "shoot":
      oscillator.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      break;
    case "kill":
      oscillator.frequency.value = 600;
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
    case "powerup":
      oscillator.frequency.value = 1000;
      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
    default:
      break;
  }
};

export const getDifficultyScaling = (wave) => {
  return {
    ghostCount: 3 + wave * 2,
    healthMultiplier: 1 + (wave - 1) * 0.15,
    spawnRate: Math.max(2000, 4000 - wave * 300),
  };
};