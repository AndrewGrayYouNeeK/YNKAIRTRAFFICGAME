// Emergency scenarios and dynamic events
export const EMERGENCY_TYPES = {
  ENGINE_FAILURE: "engine_failure",
  MEDICAL: "medical",
  FUEL_LOW: "fuel_low",
  HYDRAULIC: "hydraulic",
};

export function generateEmergency(planeCount = 1) {
  const emergencies = Object.values(EMERGENCY_TYPES);
  const type = emergencies[Math.floor(Math.random() * emergencies.length)];

  const messages = {
    [EMERGENCY_TYPES.ENGINE_FAILURE]: "One engine inop, requesting descent to 5000ft",
    [EMERGENCY_TYPES.MEDICAL]: "Medical emergency on board, need immediate landing",
    [EMERGENCY_TYPES.FUEL_LOW]: "Fuel situation critical, need priority landing",
    [EMERGENCY_TYPES.HYDRAULIC]: "Hydraulic failure, manual flying required, inop gear",
  };

  return {
    type,
    message: messages[type],
    timestamp: Date.now(),
    severity: type === EMERGENCY_TYPES.MEDICAL || planeCount > 6 ? "critical" : "high",
  };
}

export function applyEmergencyEffects(plane, emergency) {
  if (!plane || !emergency) return plane;

  switch (emergency.type) {
    case EMERGENCY_TYPES.ENGINE_FAILURE:
      plane.maxSpeed = Math.max((plane.speed || 200) - 80, 150);
      plane.desiredSpeed = Math.min(plane.desiredSpeed ?? plane.speed, plane.maxSpeed);
      plane.speedLimited = true;
      plane.desiredAltitude = Math.min(plane.desiredAltitude ?? plane.altitude, 5000);
      break;
    case EMERGENCY_TYPES.MEDICAL:
      plane.mustLandASAP = true;
      plane.priority = 10;
      break;
    case EMERGENCY_TYPES.FUEL_LOW:
      plane.fuelWarning = true;
      plane.priority = 8;
      plane.desiredAltitude = Math.min(plane.desiredAltitude ?? plane.altitude, 4000);
      break;
    case EMERGENCY_TYPES.HYDRAULIC:
      plane.turnRate = 0.5;
      plane.altitude = Math.max((plane.altitude || 0) - 500, 1500);
      break;
    default: {
      const unknownType = emergency.type;
      void unknownType;
      break;
    }
  }
  return plane;
}