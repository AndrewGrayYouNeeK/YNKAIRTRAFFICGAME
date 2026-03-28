// Aircraft simulation — real plane types with ATC radio chatter
const AIRCRAFT_TYPES = [
  { model: "Boeing 737-800",   icao: "B738", brand: "Boeing",   maxSpeed: 450, category: "Commercial", wake: "Medium" },
  { model: "Airbus A320",      icao: "A320", brand: "Airbus",   maxSpeed: 447, category: "Commercial", wake: "Medium" },
  { model: "Boeing 777-300ER", icao: "B77W", brand: "Boeing",   maxSpeed: 490, category: "Commercial", wake: "Heavy"  },
  { model: "Airbus A380-800",  icao: "A388", brand: "Airbus",   maxSpeed: 488, category: "Commercial", wake: "Super"  },
  { model: "Cessna 172",       icao: "C172", brand: "Cessna",   maxSpeed: 122, category: "General",    wake: "Light"  },
  { model: "Beechcraft King Air B200", icao: "BE20", brand: "Beechcraft", maxSpeed: 310, category: "General", wake: "Light" },
  { model: "Bombardier CRJ-900", icao: "CRJ9", brand: "Bombardier", maxSpeed: 460, category: "Regional", wake: "Medium" },
  { model: "Embraer E175",     icao: "E175", brand: "Embraer",  maxSpeed: 450, category: "Regional",   wake: "Medium" },
  { model: "Boeing 787-9",     icao: "B789", brand: "Boeing",   maxSpeed: 488, category: "Commercial", wake: "Heavy"  },
  { model: "Gulfstream G650",  icao: "GLF6", brand: "Gulfstream", maxSpeed: 488, category: "Private",  wake: "Medium" },
  { model: "Airbus A350-900",  icao: "A359", brand: "Airbus",   maxSpeed: 488, category: "Commercial", wake: "Heavy"  },
  { model: "Piper PA-28",      icao: "PA28", brand: "Piper",    maxSpeed: 128, category: "General",    wake: "Light"  },
];

const AIRLINES = [
  { prefix: "AAL", name: "American" },
  { prefix: "UAL", name: "United" },
  { prefix: "DAL", name: "Delta" },
  { prefix: "SWA", name: "Southwest" },
  { prefix: "BAW", name: "Speedbird" },
  { prefix: "DLH", name: "Lufthansa" },
  { prefix: "UAE", name: "Emirates" },
  { prefix: "N",   name: "N-reg" },    // GA / private
];

// Real ATC/pilot radio phrases
const ATC_PHRASES = [
  (cs, alt, hdg) => `${cs}, climb and maintain flight level ${Math.round(alt/100)}, heading ${hdg}.`,
  (cs, alt)      => `${cs}, descend and maintain ${alt.toLocaleString()}, expect ILS approach.`,
  (cs)           => `${cs}, contact approach on 119.1, good day.`,
  (cs, rwy)      => `${cs}, cleared to land runway ${rwy}, wind 270 at 12.`,
  (cs)           => `${cs}, traffic alert, traffic 12 o'clock, 5 miles, opposite direction.`,
  (cs, spd)      => `${cs}, reduce speed to ${spd} knots, maintain 5,000.`,
  (cs)           => `${cs}, report established on the localizer.`,
  (cs)           => `${cs}, squawk 4521, ident.`,
  (cs, alt)      => `${cs}, altimeter 29.92, maintain ${alt.toLocaleString()}.`,
  (cs)           => `${cs}, hold short of runway 28L, traffic on final.`,
];

const PILOT_READBACKS = [
  (cs, alt, hdg) => `Climbing flight level ${Math.round(alt/100)}, heading ${hdg}, ${cs}.`,
  (cs, alt)      => `Descending to ${alt.toLocaleString()}, ${cs}.`,
  (cs)           => `Wilco, ${cs}.`,
  (cs, rwy)      => `Cleared to land runway ${rwy}, ${cs}.`,
  (cs)           => `Looking for traffic, ${cs}.`,
  (cs, spd)      => `Speed back to ${spd} knots, ${cs}.`,
  (cs)           => `Report localizer, ${cs}.`,
  (cs)           => `Squawking 4521, ident, ${cs}.`,
  (cs, alt)      => `29.92, maintaining ${alt.toLocaleString()}, ${cs}.`,
  (cs)           => `Holding short 28L, ${cs}.`,
];

const RUNWAYS = ["09L", "09R", "27L", "27R", "28L", "28R", "04", "22", "13R", "31L"];

const THREAT_LEVELS = ["none", "low", "medium", "high", "critical"];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function generateCallsign(acType) {
  if (acType.category === "General" || acType.category === "Private") {
    // N-number style
    return "N" + randomInt(100, 999) + String.fromCharCode(65 + randomInt(0,25)) + String.fromCharCode(65 + randomInt(0,25));
  }
  const airline = AIRLINES[randomInt(0, AIRLINES.length - 2)]; // exclude N-reg
  return airline.prefix + randomInt(100, 9999);
}

function generateSquawk() {
  // Realistic squawk codes (avoid 7500/7600/7700 for normal ops)
  const codes = [1200, 2000, 3456, 4521, 5034, 6102, 1234, 2341, 4136, 3302];
  return codes[randomInt(0, codes.length - 1)];
}

function getThreatLevel(distance, category) {
  if (category === "General" && distance < 500) return "high";
  if (distance < 200) return "critical";
  if (distance < 500) return "high";
  if (distance < 1000) return "medium";
  if (distance < 2000) return "low";
  return "none";
}

export function generateDrone(index) {
  const acType = AIRCRAFT_TYPES[Math.floor(Math.random() * AIRCRAFT_TYPES.length)];
  const callsign = generateCallsign(acType);
  const angle = randomBetween(0, 360);
  const distance = randomBetween(50, 2000);
  const radians = (angle * Math.PI) / 180;
  const maxRange = 2000;
  const normalizedDist = distance / maxRange;

  // Altitude in feet — realistic ranges by category
  const minAlt = acType.category === "General" ? 500 : 3000;
  const maxAlt = acType.category === "General" ? 8000 : 39000;
  const altitude = Math.round(randomBetween(minAlt, maxAlt) / 100) * 100;

  const runway = RUNWAYS[randomInt(0, RUNWAYS.length - 1)];
  const phraseIdx = randomInt(0, ATC_PHRASES.length - 1);
  const atcMsg  = ATC_PHRASES[phraseIdx](callsign, altitude, Math.round(angle), Math.round(acType.maxSpeed * 0.8));
  const pilotMsg = PILOT_READBACKS[phraseIdx](callsign, altitude, Math.round(angle), Math.round(acType.maxSpeed * 0.8));

  return {
    id: callsign,
    callsign,
    ...acType,
    distance: Math.round(distance),
    altitude,                                           // feet
    speed: Math.round(randomBetween(acType.maxSpeed * 0.5, acType.maxSpeed)), // knots
    heading: Math.round(randomBetween(0, 360)),
    signal: Math.round(randomBetween(-90, -20)),        // transponder signal dBm
    frequency: (randomBetween(118.0, 136.0)).toFixed(1) + " MHz",  // VHF aviation band
    bearing: Math.round(angle),
    squawk: generateSquawk(),
    runway,
    atcRadio: atcMsg,
    pilotRadio: pilotMsg,
    x: Math.cos(radians) * normalizedDist,
    y: Math.sin(radians) * normalizedDist,
    threatLevel: getThreatLevel(distance, acType.category),
    firstDetected: Date.now() - Math.round(randomBetween(5000, 300000)),
    lastSeen: Date.now(),
    lat: 40.7128 + randomBetween(-0.02, 0.02),
    lng: -74.006 + randomBetween(-0.02, 0.02),
  };
}

export function updateDrone(drone) {
  const speedDelta = randomBetween(-8, 8);
  const angleDelta = randomBetween(-4, 4);
  const distDelta  = randomBetween(-30, 30);
  const altDelta   = Math.round(randomBetween(-200, 200) / 100) * 100;

  const newDistance = Math.max(30, Math.min(2000, drone.distance + distDelta));
  const newBearing  = (drone.bearing + angleDelta + 360) % 360;
  const radians     = (newBearing * Math.PI) / 180;
  const maxRange    = 2000;
  const normalizedDist = newDistance / maxRange;

  const minAlt = drone.category === "General" ? 500 : 3000;
  const maxAlt = drone.category === "General" ? 8000 : 39000;
  const newAlt = Math.max(minAlt, Math.min(maxAlt, drone.altitude + altDelta));

  // Occasionally update radio chatter
  let atcRadio = drone.atcRadio;
  let pilotRadio = drone.pilotRadio;
  if (Math.random() < 0.08) {
    const phraseIdx = randomInt(0, ATC_PHRASES.length - 1);
    atcRadio  = ATC_PHRASES[phraseIdx](drone.callsign, newAlt, Math.round(newBearing), Math.round(drone.maxSpeed * 0.8));
    pilotRadio = PILOT_READBACKS[phraseIdx](drone.callsign, newAlt, Math.round(newBearing), Math.round(drone.maxSpeed * 0.8));
  }

  return {
    ...drone,
    distance: Math.round(newDistance),
    altitude: Math.round(newAlt),
    speed: Math.max(0, Math.min(drone.maxSpeed, Math.round(drone.speed + speedDelta))),
    heading: (drone.heading + Math.round(angleDelta * 2) + 360) % 360,
    signal: Math.max(-95, Math.min(-15, drone.signal + Math.round(randomBetween(-3, 3)))),
    bearing: Math.round(newBearing),
    x: Math.cos(radians) * normalizedDist,
    y: Math.sin(radians) * normalizedDist,
    threatLevel: getThreatLevel(newDistance, drone.category),
    lastSeen: Date.now(),
    lat: drone.lat + randomBetween(-0.001, 0.001),
    lng: drone.lng + randomBetween(-0.001, 0.001),
    atcRadio,
    pilotRadio,
  };
}

export function useDroneSimulation() {
  return { generateDrone, updateDrone, THREAT_LEVELS };
}