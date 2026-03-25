// Simulated drone data generator for realistic demo
const DRONE_TYPES = [
  { model: "DJI Mavic 3", brand: "DJI", maxSpeed: 47, category: "Consumer" },
  { model: "DJI Mini 4 Pro", brand: "DJI", maxSpeed: 35, category: "Consumer" },
  { model: "Autel EVO II", brand: "Autel", maxSpeed: 45, category: "Commercial" },
  { model: "Skydio X10", brand: "Skydio", maxSpeed: 42, category: "Enterprise" },
  { model: "DJI Matrice 350", brand: "DJI", maxSpeed: 55, category: "Commercial" },
  { model: "Unknown UAV", brand: "Unknown", maxSpeed: 60, category: "Unidentified" },
  { model: "Parrot Anafi AI", brand: "Parrot", maxSpeed: 34, category: "Consumer" },
  { model: "DJI Inspire 3", brand: "DJI", maxSpeed: 58, category: "Professional" },
  { model: "FPV Racing Drone", brand: "Custom", maxSpeed: 90, category: "Unidentified" },
  { model: "DJI Phantom 4", brand: "DJI", maxSpeed: 45, category: "Consumer" },
];

const THREAT_LEVELS = ["none", "low", "medium", "high", "critical"];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateDroneId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "UAV-";
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function getThreatLevel(distance, category) {
  if (category === "Unidentified" && distance < 500) return "critical";
  if (distance < 200) return "high";
  if (distance < 500) return "medium";
  if (distance < 1000) return "low";
  return "none";
}

export function generateDrone(index) {
  const droneType = DRONE_TYPES[Math.floor(Math.random() * DRONE_TYPES.length)];
  const angle = randomBetween(0, 360);
  const distance = randomBetween(50, 2000);
  const radians = (angle * Math.PI) / 180;
  
  // Position on radar (normalized -1 to 1)
  const maxRange = 2000;
  const normalizedDist = distance / maxRange;
  const x = Math.cos(radians) * normalizedDist;
  const y = Math.sin(radians) * normalizedDist;

  return {
    id: generateDroneId(),
    ...droneType,
    distance: Math.round(distance),
    altitude: Math.round(randomBetween(10, 400)),
    speed: Math.round(randomBetween(0, droneType.maxSpeed)),
    heading: Math.round(randomBetween(0, 360)),
    signal: Math.round(randomBetween(-90, -20)),
    frequency: (randomBetween(2.4, 5.8)).toFixed(1) + " GHz",
    bearing: Math.round(angle),
    x,
    y,
    threatLevel: getThreatLevel(distance, droneType.category),
    firstDetected: Date.now() - Math.round(randomBetween(5000, 300000)),
    lastSeen: Date.now(),
    lat: 40.7128 + randomBetween(-0.02, 0.02),
    lng: -74.006 + randomBetween(-0.02, 0.02),
  };
}

export function updateDrone(drone) {
  const speedDelta = randomBetween(-3, 3);
  const angleDelta = randomBetween(-5, 5);
  const distDelta = randomBetween(-30, 30);
  const altDelta = randomBetween(-10, 10);
  
  const newDistance = Math.max(30, Math.min(2000, drone.distance + distDelta));
  const newBearing = (drone.bearing + angleDelta + 360) % 360;
  const radians = (newBearing * Math.PI) / 180;
  const maxRange = 2000;
  const normalizedDist = newDistance / maxRange;

  return {
    ...drone,
    distance: Math.round(newDistance),
    altitude: Math.max(5, Math.round(drone.altitude + altDelta)),
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
  };
}

export function useDroneSimulation() {
  return { generateDrone, updateDrone, THREAT_LEVELS };
}