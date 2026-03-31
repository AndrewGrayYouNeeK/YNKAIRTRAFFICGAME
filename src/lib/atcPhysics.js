// Physics engine: wind vectors, wake turbulence, collision detection
export const WAKE_CATEGORIES = {
  heavy: { minDist: 8, turbulence: 200 }, // B747, A380
  medium: { minDist: 5, turbulence: 100 }, // B738, A320
  light: { minDist: 3, turbulence: 50 },   // Cessna
};

const WIND_SPEED_MAX = 30; // knots

export function updateAircraftPhysics(plane, wind, allPlanes, deltaTime = 0.016) {
  const dt = deltaTime / 1000; // seconds
  const windRad = (wind.direction * Math.PI) / 180;
  const windX = Math.cos(windRad) * wind.speed;
  const windY = Math.sin(windRad) * wind.speed;

  // Desired heading
  const desiredRad = (plane.desiredHeading * Math.PI) / 180;
  let speedX = Math.cos(desiredRad) * plane.speed;
  let speedY = Math.sin(desiredRad) * plane.speed;

  // Apply wind
  speedX += windX * 0.04;
  speedY += windY * 0.04;

  // Update position (nm, where 1nm ≈ 6000ft map units)
  plane.x += speedX * dt * 0.01; // slow down for visibility
  plane.y += speedY * dt * 0.01;

  // Actual heading affected by wind
  plane.actualHeading = (Math.atan2(speedY, speedX) * 180) / Math.PI;

  // Apply altitude change
  if (plane.desiredAltitude !== plane.altitude) {
    const altDiff = plane.desiredAltitude - plane.altitude;
    const maxClimbRate = 2000; // ft/min
    const altChange = (maxClimbRate / 60) * dt; // ft per frame
    plane.altitude += Math.sign(altDiff) * Math.min(Math.abs(altDiff), altChange);
  }

  // Apply speed change (gradual)
  if (plane.desiredSpeed !== plane.speed) {
    const speedDiff = plane.desiredSpeed - plane.speed;
    const maxAccel = 50; // knots per second
    const speedChange = maxAccel * dt;
    plane.speed += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), speedChange);
  }

  // Wake turbulence disturbance from other planes
  allPlanes.forEach((other) => {
    if (other.id === plane.id || other.status === "landed") return;
    const dx = other.x - plane.x;
    const dy = other.y - plane.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const wakeRule = WAKE_CATEGORIES[other.wakeCategory];
    if (dist < 1 && dist > 0.05) {
      // Light turbulence disturbance
      const angle = Math.atan2(dy, dx);
      plane.x -= Math.cos(angle) * 0.002;
      plane.y -= Math.sin(angle) * 0.002;
      plane.turbulenceWarning = true;
    } else {
      plane.turbulenceWarning = false;
    }
  });

  // Collision detection
  plane.collisionWarning = false;
  plane.separationViolation = false;
  allPlanes.forEach((other) => {
    if (other.id === plane.id || other.status === "landed") return;
    const dx = other.x - plane.x;
    const dy = other.y - plane.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const altDiff = Math.abs(plane.altitude - other.altitude);

    // Collision: < 500ft altitude + < 1nm horizontal
    if (altDiff < 500 && dist < 1) {
      plane.collisionWarning = true;
      other.collisionWarning = true;
    }

    // Separation violation: < 1000ft altitude + < 5nm horizontal
    if (altDiff < 1000 && dist < 5) {
      plane.separationViolation = true;
    }
  });

  return plane;
}

export function calculateTrajectory(plane, wind, steps = 10) {
  // Predict 30 seconds ahead
  const trail = [{ x: plane.x, y: plane.y }];
  let x = plane.x, y = plane.y;
  const windRad = (wind.direction * Math.PI) / 180;
  const windX = Math.cos(windRad) * wind.speed;
  const windY = Math.sin(windRad) * wind.speed;
  const headingRad = (plane.actualHeading * Math.PI) / 180;

  for (let i = 0; i < steps; i++) {
    let vx = Math.cos(headingRad) * plane.speed + windX * 0.04;
    let vy = Math.sin(headingRad) * plane.speed + windY * 0.04;
    x += vx * 0.01 * 0.3; // 3 seconds per step
    y += vy * 0.01 * 0.3;
    trail.push({ x, y });
  }
  return trail;
}

export function getMinSeparation(plane1, plane2) {
  const altDiff = Math.abs(plane1.altitude - plane2.altitude);
  const dx = plane1.x - plane2.x;
  const dy = plane1.y - plane2.y;
  const horDist = Math.sqrt(dx * dx + dy * dy);
  return { horDist, altDiff };
}