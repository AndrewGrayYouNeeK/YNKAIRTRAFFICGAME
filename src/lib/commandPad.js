import { normalizeHeading } from "./atcPhysics.js";

export const ALTITUDE_STEP = 1000;
export const SPEED_STEP = 20;
export const MIN_ALTITUDE = 0;
export const MAX_ALTITUDE = 45000;
export const MIN_SPEED = 80;
export const DEFAULT_MAX_SPEED = 280;

export function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function nextHeading(current, delta) {
  return Math.round(normalizeHeading((Number(current) || 0) + delta));
}

export function nextAltitude(current, delta) {
  const base = Number(current);
  const start = Number.isFinite(base) ? base : 3000;
  return clampNumber(Math.round(start + delta), MIN_ALTITUDE, MAX_ALTITUDE);
}

export function nextSpeed(current, delta, maxSpeed = DEFAULT_MAX_SPEED) {
  const cap = Number.isFinite(maxSpeed) ? maxSpeed : DEFAULT_MAX_SPEED;
  const ceiling = Math.max(MIN_SPEED, cap);
  const base = Number(current);
  const start = Number.isFinite(base) ? base : 180;
  return clampNumber(Math.round(start + delta), MIN_SPEED, ceiling);
}

export function headingCommand(plane, delta) {
  const current = plane?.desiredHeading ?? plane?.actualHeading ?? plane?.heading ?? 0;
  return { type: "set_heading", value: nextHeading(current, delta) };
}

export function altitudeCommand(plane, delta) {
  const current = plane?.desiredAltitude ?? plane?.altitude ?? 3000;
  return { type: "set_altitude", value: nextAltitude(current, delta) };
}

export function speedCommand(plane, delta) {
  const current = plane?.desiredSpeed ?? plane?.speed ?? 180;
  return { type: "set_speed", value: nextSpeed(current, delta, plane?.maxSpeed ?? DEFAULT_MAX_SPEED) };
}
