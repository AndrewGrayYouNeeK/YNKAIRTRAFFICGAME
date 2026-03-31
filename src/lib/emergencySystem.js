// Emergency scenarios and dynamic events
export const EMERGENCY_TYPES = {
  ENGINE_FAILURE: "engine_failure",
  MEDICAL: "medical",
  FUEL_LOW: "fuel_low",
  HYDRAULIC: "hydraulic",
};

export function generateEmergency(planeCount) {
  // Random emergency every 30-60 planes handled
  if (Math.random() > 0.02) return null;

  const emergencies = Object.values(EMERGENCY_TYPES);
  const type = emergencies[Math.floor(Math.random() * emergencies.length)];

  const messages = {
    engine_failure: "One engine inop, requesting descent to 5000ft",
    medical: "Medical emergency on board, need immediate landing",
    fuel_low: "Fuel situation critical, need priority landing",
    hydraulic: "Hydraulic failure, manual flying required, inop gear",
  };

  return {
    type,
    message: messages[type],
    timestamp: Date.now(),
    severity: type === "medical" ? "critical" : "high",
  };
}

export function applyEmergencyEffects(plane, emergency) {
  if (!emergency) return plane;

  switch (emergency.type) {
    case "ENGINE_FAILURE":
      plane.maxSpeed = Math.max(plane.speed - 100, 150);
      plane.speedLimited = true;
      break;
    case "MEDICAL":
      plane.mustLandASAP = true;
      plane.priority = 10;
      break;
    case "FUEL_LOW":
      plane.fuelWarning = true;
      plane.priority = 8;
      break;
    case "HYDRAULIC":
      plane.turnRate = 0.5; // slower turns
      plane.altitude = Math.max(plane.altitude - 500, 1500); // can't maintain altitude
      break;
  }
  return plane;
}