// ATC kinematics in nautical miles, knots, and real elapsed seconds.
// Headings are aviation: 0° north, 90° east. +x east, +y north.

export const PHYSICS_TIME_SCALE = 20;
export const MAX_STEP_SECONDS = 0.1;
export const TURN_RATE_DEG_PER_SEC = 3;
export const SEPARATION_NM = 3;
export const SEPARATION_FT = 1000;
export const COLLISION_NM = 0.35;
export const COLLISION_FT = 500;
export const SPAWN_MIN_RANGE_NM = 20;
export const RUNWAY_HALF_LENGTH_NM = 0.9;
export const PARALLEL_OFFSET_NM = 0.55;
export const GLIDESLOPE_FT_PER_NM = 318;

const CALLSIGNS = ["UAL123", "DAL456", "AAL789", "SWA101", "BAW202", "DLH303", "UAE404"];
const AIRCRAFT_TYPES = ["B738", "A320", "B77W", "A388", "CRJ9", "E175"];

export function mapPointerToCanvas(clientX, clientY, rect, size) {
  const width = rect?.width || 0;
  const height = rect?.height || 0;
  const scaleX = width > 0 ? size / width : 1;
  const scaleY = height > 0 ? size / height : 1;
  return {
    x: (clientX - (rect?.left || 0)) * scaleX,
    y: (clientY - (rect?.top || 0)) * scaleY,
  };
}

export function clampDelta(deltaTime) {
  if (!Number.isFinite(deltaTime) || deltaTime <= 0) return 0;
  return Math.min(deltaTime, MAX_STEP_SECONDS);
}

export function normalizeHeading(deg) {
  const wrapped = Number(deg) % 360;
  if (!Number.isFinite(wrapped)) return 0;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

export function headingDelta(from, to) {
  let diff = normalizeHeading(to) - normalizeHeading(from);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

export function turnToward(current, desired, maxDelta) {
  const delta = headingDelta(current, desired);
  if (Math.abs(delta) <= maxDelta) return normalizeHeading(desired);
  return normalizeHeading(current + Math.sign(delta) * maxDelta);
}

export function runwayHeading(designator) {
  const match = String(designator || "").toUpperCase().match(/(\d{1,2})/);
  if (!match) return 0;
  const num = Number.parseInt(match[1], 10);
  if (!Number.isFinite(num)) return 0;
  return (num % 36) * 10;
}

export function reciprocalDesignator(designator) {
  const id = String(designator || "").toUpperCase();
  const num = Number.parseInt(id, 10);
  if (!Number.isFinite(num)) return id;
  const side = id.replace(/[0-9]/g, "");
  const recipNum = ((num + 18 - 1) % 36) + 1;
  const swapped = side === "L" ? "R" : side === "R" ? "L" : side === "C" ? "C" : "";
  return `${String(recipNum).padStart(2, "0")}${swapped}`;
}

export function lateralOffsetNm(designator) {
  const side = String(designator || "").toUpperCase().replace(/[^LRC]/g, "");
  if (side === "L") return -PARALLEL_OFFSET_NM;
  if (side === "R") return PARALLEL_OFFSET_NM;
  return 0;
}

export function physicalRunways(designators = []) {
  const remaining = new Set(designators.map((item) => String(item).toUpperCase()));
  const runways = [];
  designators.forEach((designator) => {
    const id = String(designator).toUpperCase();
    if (!remaining.has(id)) return;
    remaining.delete(id);
    const reciprocal = reciprocalDesignator(id);
    const showReciprocal = remaining.has(reciprocal);
    if (showReciprocal) remaining.delete(reciprocal);
    runways.push({
      id,
      heading: runwayHeading(id),
      reciprocal,
      showReciprocal,
      lateral: lateralOffsetNm(id),
    });
  });
  return runways;
}

function runwayBasis(designator) {
  const heading = runwayHeading(designator);
  const radians = (heading * Math.PI) / 180;
  const alongX = Math.sin(radians);
  const alongY = Math.cos(radians);
  const rightX = Math.cos(radians);
  const rightY = -Math.sin(radians);
  const lateral = lateralOffsetNm(designator);
  const threshold = {
    x: -alongX * RUNWAY_HALF_LENGTH_NM + rightX * lateral,
    y: -alongY * RUNWAY_HALF_LENGTH_NM + rightY * lateral,
  };
  return { heading, alongX, alongY, rightX, rightY, lateral, threshold };
}

export function approachState(plane, designator, elevation = 0) {
  const basis = runwayBasis(designator);
  const relX = (plane?.x || 0) - basis.threshold.x;
  const relY = (plane?.y || 0) - basis.threshold.y;
  const along = -(relX * basis.alongX + relY * basis.alongY);
  const cross = relX * basis.rightX + relY * basis.rightY;
  const glideslopeAlt = elevation + Math.max(0, along) * GLIDESLOPE_FT_PER_NM;
  return { ...basis, along, cross, glideslopeAlt, elevation };
}

export function assessLanding(plane, designator, elevation = 0) {
  const geo = approachState(plane, designator, elevation);
  const headingError = Math.abs(headingDelta(plane?.actualHeading ?? plane?.heading ?? geo.heading, geo.heading));
  const inCone = geo.along > 0.15
    && geo.along <= 30
    && Math.abs(geo.cross) < Math.min(2.2, 0.1 * geo.along + 0.35);
  const captured = Boolean(plane?.clearedToLand) && inCone && (headingError < 30 || Math.abs(geo.cross) < 0.45);
  const landed = Boolean(plane?.clearedToLand)
    && geo.along <= 0.45
    && geo.along >= -0.35
    && Math.abs(geo.cross) < 0.4
    && (plane?.altitude || 0) <= elevation + 300
    && headingError < 35;
  const missed = Boolean(plane?.clearedToLand) && geo.along < -0.4 && !landed;
  return { ...geo, headingError, inCone, captured, landed, missed };
}

export function guideApproach(plane, designator, elevation = 0) {
  if (!plane?.clearedToLand || plane.status === "landed") return plane;
  const geo = approachState(plane, designator, elevation);
  const intercepting = geo.along > -0.2 && geo.along < 32 && Math.abs(geo.cross) < 2.8;
  if (!intercepting) return plane;

  let desired = geo.heading;
  if (Math.abs(geo.cross) > 0.12) {
    const correction = Math.max(-30, Math.min(30, -geo.cross * 14));
    desired = normalizeHeading(geo.heading + correction);
  }
  plane.desiredHeading = Math.round(desired) % 360;
  plane.desiredAltitude = Math.round(Math.max(elevation, geo.glideslopeAlt));
  plane.desiredSpeed = geo.along > 8 ? 180 : 145;
  plane.status = "final";
  plane.localizerCaptured = Math.abs(geo.cross) < 0.45;
  return plane;
}

export function selectActiveRunway(airport, wind) {
  const runways = airport?.runways?.length ? airport.runways : ["36"];
  const windFrom = wind?.direction ?? 0;
  let best = runways[0];
  let bestHeadwind = -Infinity;
  runways.forEach((designator) => {
    const diff = headingDelta(runwayHeading(designator), windFrom);
    const headwind = Math.cos((diff * Math.PI) / 180) * (wind?.speed || 0);
    if (headwind > bestHeadwind + 0.01) {
      bestHeadwind = headwind;
      best = designator;
    }
  });
  return best;
}

export function inboundSpawn(designator, distanceNm, elevation = 0) {
  const distance = Math.max(SPAWN_MIN_RANGE_NM + 0.1, distanceNm);
  const basis = runwayBasis(designator);
  return {
    x: basis.threshold.x - basis.alongX * distance,
    y: basis.threshold.y - basis.alongY * distance,
    heading: basis.heading,
    altitude: elevation + distance * GLIDESLOPE_FT_PER_NM + 800,
  };
}

export function createInboundAircraft(index, airport, runway, distanceNm = 24) {
  const elevation = airport?.elevation || 0;
  const designator = runway || airport?.runways?.[0] || "36";
  const spawned = inboundSpawn(designator, distanceNm, elevation);
  const speed = 230;
  const altitude = Math.round(spawned.altitude / 100) * 100;
  const wakeRoll = index % 3;
  return {
    id: `plane-${index}`,
    callsign: `${CALLSIGNS[index % CALLSIGNS.length]}${index}`,
    aircraft_type: AIRCRAFT_TYPES[index % AIRCRAFT_TYPES.length],
    wakeCategory: wakeRoll === 0 ? "medium" : wakeRoll === 1 ? "heavy" : "light",
    x: spawned.x,
    y: spawned.y,
    altitude,
    speed,
    desiredSpeed: speed,
    desiredAltitude: altitude,
    heading: spawned.heading,
    desiredHeading: spawned.heading,
    actualHeading: spawned.heading,
    status: "inbound",
    runway: designator,
    clearedToLand: false,
    collisionWarning: false,
    separationViolation: false,
    verticalSpeed: 0,
    trajectory: [],
  };
}

export function windVector(wind) {
  const from = ((wind?.direction || 0) * Math.PI) / 180;
  const speedNmPerSec = (wind?.speed || 0) / 3600;
  return {
    x: Math.sin(from + Math.PI) * speedNmPerSec,
    y: Math.cos(from + Math.PI) * speedNmPerSec,
  };
}

export function updateAircraftPhysics(plane, wind, _allPlanes = [], deltaTime = 0.016) {
  const simDt = clampDelta(deltaTime) * PHYSICS_TIME_SCALE;
  if (!plane || simDt === 0) return plane;

  const currentHeading = plane.actualHeading ?? plane.heading ?? 0;
  const desiredHeading = plane.desiredHeading ?? currentHeading;
  const turnRate = plane.turnRate > 0 ? plane.turnRate : TURN_RATE_DEG_PER_SEC;
  plane.actualHeading = turnToward(currentHeading, desiredHeading, turnRate * simDt);
  plane.heading = plane.actualHeading;

  if (plane.speedLimited && plane.maxSpeed) {
    plane.desiredSpeed = Math.min(plane.desiredSpeed ?? plane.speed, plane.maxSpeed);
  }

  const previousAltitude = plane.altitude || 0;
  if (plane.desiredAltitude !== undefined && plane.desiredAltitude !== plane.altitude) {
    const altDiff = plane.desiredAltitude - plane.altitude;
    const altStep = (2000 / 60) * simDt;
    plane.altitude += Math.sign(altDiff) * Math.min(Math.abs(altDiff), altStep);
  }
  plane.verticalSpeed = simDt > 0 ? ((plane.altitude - previousAltitude) / simDt) * 60 : 0;

  if (plane.desiredSpeed !== undefined && plane.desiredSpeed !== plane.speed) {
    const speedDiff = plane.desiredSpeed - plane.speed;
    const speedStep = 8 * simDt;
    plane.speed += Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), speedStep);
  }
  if (plane.maxSpeed) plane.speed = Math.min(plane.speed, plane.maxSpeed);

  const headingRad = (plane.actualHeading * Math.PI) / 180;
  const airspeed = (plane.speed || 0) / 3600;
  const drift = windVector(wind);
  plane.x += (Math.sin(headingRad) * airspeed + drift.x) * simDt;
  plane.y += (Math.cos(headingRad) * airspeed + drift.y) * simDt;
  return plane;
}

export function calculateTrajectory(plane, wind, steps = 8) {
  const trail = [{ x: plane.x, y: plane.y }];
  let x = plane.x;
  let y = plane.y;
  const heading = ((plane.actualHeading ?? plane.heading ?? 0) * Math.PI) / 180;
  const airspeed = (plane.speed || 0) / 3600;
  const drift = windVector(wind);
  for (let i = 0; i < steps; i += 1) {
    x += (Math.sin(heading) * airspeed + drift.x) * 3;
    y += (Math.cos(heading) * airspeed + drift.y) * 3;
    trail.push({ x, y });
  }
  return trail;
}

export function getMinSeparation(plane1, plane2) {
  const altDiff = Math.abs((plane1?.altitude || 0) - (plane2?.altitude || 0));
  const dx = (plane1?.x || 0) - (plane2?.x || 0);
  const dy = (plane1?.y || 0) - (plane2?.y || 0);
  return { horDist: Math.hypot(dx, dy), altDiff };
}

function isActive(plane) {
  return plane && plane.status !== "landed";
}

export function findConflicts(planes = []) {
  const separations = [];
  const collisions = [];
  for (let i = 0; i < planes.length; i += 1) {
    for (let j = i + 1; j < planes.length; j += 1) {
      const a = planes[i];
      const b = planes[j];
      if (!isActive(a) || !isActive(b)) continue;
      const { horDist, altDiff } = getMinSeparation(a, b);
      if (horDist < COLLISION_NM && altDiff < COLLISION_FT) {
        collisions.push({ a, b, horDist, altDiff });
      } else if (horDist < SEPARATION_NM && altDiff < SEPARATION_FT) {
        separations.push({ a, b, horDist, altDiff });
      }
    }
  }
  return { separations, collisions };
}
