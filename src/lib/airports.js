// Real-world airports used as ATC level skins
// Each level unlocks a harder airport
export const AIRPORTS = [
  {
    id: "KLAX",
    name: "Los Angeles International",
    city: "Los Angeles, CA",
    level: 1,
    difficulty: "easy",
    lat: 33.9425,
    lng: -118.408,
    elevation: 125,    // ft MSL
    runways: ["24L", "24R", "06L", "06R"],
    maxAircraft: 4,
    description: "Flat terrain, calm Pacific weather, long parallel runways.",
    skin: {
      bg: "from-blue-950 via-slate-900 to-slate-950",
      radarTint: "#00ccff",
      accent: "sky",
    },
    weatherMultiplier: 0.6,
    locked: false,
  },
  {
    id: "EGLL",
    name: "London Heathrow",
    city: "London, UK",
    level: 2,
    difficulty: "medium",
    lat: 51.4775,
    lng: -0.461,
    elevation: 83,
    runways: ["09L", "09R", "27L", "27R"],
    maxAircraft: 7,
    description: "Busiest in Europe. Heavy fog, complex traffic flow.",
    skin: {
      bg: "from-gray-950 via-slate-900 to-zinc-950",
      radarTint: "#88ffaa",
      accent: "emerald",
    },
    weatherMultiplier: 1.2,
    locked: true,
  },
  {
    id: "VHHH",
    name: "Hong Kong Intl (Chek Lap Kok)",
    city: "Hong Kong",
    level: 3,
    difficulty: "hard",
    lat: 22.3089,
    lng: 113.9145,
    elevation: 28,
    runways: ["07L", "07R", "25L", "25R"],
    maxAircraft: 10,
    description: "Dense airspace, typhoon season, complex terrain approaches.",
    skin: {
      bg: "from-purple-950 via-slate-900 to-zinc-950",
      radarTint: "#cc88ff",
      accent: "purple",
    },
    weatherMultiplier: 1.8,
    locked: true,
  },
  {
    id: "NZQN",
    name: "Queenstown Airport",
    city: "Queenstown, New Zealand",
    level: 4,
    difficulty: "expert",
    lat: -45.0211,
    lng: 168.7392,
    elevation: 1171,
    runways: ["05", "23"],
    maxAircraft: 8,
    description: "Surrounded by mountains. Wind shear, sudden weather changes, visual approaches only.",
    skin: {
      bg: "from-orange-950 via-slate-900 to-zinc-950",
      radarTint: "#ffaa44",
      accent: "orange",
    },
    weatherMultiplier: 2.5,
    locked: true,
  },
  {
    id: "VNLK",
    name: "Tenzing-Hillary Airport (Lukla)",
    city: "Lukla, Nepal",
    level: 5,
    difficulty: "extreme",
    lat: 27.6869,
    lng: 86.7296,
    elevation: 9334,  // ft — world's most dangerous airport
    runways: ["06"],  // single 527m sloped runway — requires special endorsement IRL
    maxAircraft: 3,
    description: "World's most dangerous airport. 527m runway at 9,334ft. Cliffs on one end, mountain wall on the other. IRL requires special Lukla endorsement. VFR only — NO instrument approach exists.",
    skin: {
      bg: "from-red-950 via-slate-900 to-zinc-950",
      radarTint: "#ff4444",
      accent: "red",
    },
    weatherMultiplier: 4.0,
    locked: true,
    special: true,
    specialNote: "⚠ Requires Special Endorsement — No instrument approach. Single sloped runway. Mountains on all sides.",
  },
];

export function getAirport(id) {
  return AIRPORTS.find((a) => a.id === id);
}

export function getUnlockedAirports(successfulLandings) {
  // Unlock each airport after N cumulative landings
  const thresholds = [0, 5, 15, 30, 50];
  return AIRPORTS.map((a, i) => ({
    ...a,
    locked: successfulLandings < thresholds[i],
  }));
}