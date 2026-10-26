import assert from "node:assert/strict";
import test from "node:test";
import { getAirport } from "./airports.js";
import {
  COLLISION_NM,
  PHYSICS_TIME_SCALE,
  SEPARATION_FT,
  SEPARATION_NM,
  SPAWN_MIN_RANGE_NM,
  assessLanding,
  clampDelta,
  createInboundAircraft,
  mapPointerToCanvas,
  findConflicts,
  guideApproach,
  updateAircraftPhysics,
} from "./atcPhysics.js";
import { applyEmergencyEffects, EMERGENCY_TYPES } from "./emergencySystem.js";
import parseATCCommand from "./voiceCommandParser.js";
import { computeWeatherEffects } from "./weatherEngine.js";

function flyingEast(speed = 360) {
  return {
    id: "east",
    x: 0,
    y: 0,
    altitude: 10000,
    desiredAltitude: 10000,
    speed,
    desiredSpeed: speed,
    heading: 90,
    desiredHeading: 90,
    actualHeading: 90,
    status: "inbound",
  };
}

test("physics moves a seconds-scale step by nautical miles, not milliseconds", () => {
  const step = 0.1;
  const plane = flyingEast(360);
  const updated = updateAircraftPhysics(plane, { direction: 0, speed: 0 }, [], step);
  const simSeconds = clampDelta(step) * PHYSICS_TIME_SCALE;
  const expectedNm = (360 / 3600) * simSeconds;
  assert.ok(expectedNm > 0.05, "a tenth of a second should cover a visible fraction of a mile");
  assert.ok(Math.abs(updated.x - expectedNm) < 1e-6);
  assert.ok(Math.abs(updated.y) < 1e-6);

  const frame = updateAircraftPhysics(flyingEast(360), { direction: 0, speed: 0 }, [], 0.016);
  const frameNm = (360 / 3600) * 0.016 * PHYSICS_TIME_SCALE;
  assert.ok(Math.abs(frame.x - frameNm) < 1e-6);
  assert.ok(frame.x > 0.01, "a 16ms frame must not be divided by 1000");
});

test("large frame gaps are clamped and turns use a finite rate", () => {
  const jumped = updateAircraftPhysics(flyingEast(360), { direction: 0, speed: 0 }, [], 5);
  const clamped = updateAircraftPhysics(flyingEast(360), { direction: 0, speed: 0 }, [], clampDelta(5));
  assert.equal(jumped.x, clamped.x);

  const turning = {
    ...flyingEast(200),
    heading: 0,
    actualHeading: 0,
    desiredHeading: 90,
  };
  const steered = updateAircraftPhysics(turning, { direction: 0, speed: 0 }, [], 0.1);
  const simSeconds = 0.1 * PHYSICS_TIME_SCALE;
  assert.ok(Math.abs(steered.actualHeading - 3 * simSeconds) < 1e-6);
  assert.ok(steered.actualHeading < 90);
});

test("arrivals spawn outside 20nm on an inbound runway track", () => {
  const airport = getAirport("EGLL");
  const plane = createInboundAircraft(1, airport, "27L", 22);
  const range = Math.hypot(plane.x, plane.y);
  assert.ok(range > SPAWN_MIN_RANGE_NM);
  const before = range;
  const moved = updateAircraftPhysics({ ...plane }, { direction: 0, speed: 0 }, [], 0.1);
  assert.ok(Math.hypot(moved.x, moved.y) < before);
});

test("separation is 3nm and 1000ft and each pair is counted once", () => {
  const make = (id, x, altitude) => ({ id, x, y: 0, altitude, status: "inbound" });
  const close = findConflicts([
    make("a", 0, 5000),
    make("b", SEPARATION_NM - 0.2, 5000 + SEPARATION_FT - 50),
    make("c", 12, 5000),
  ]);
  assert.equal(close.separations.length, 1);
  assert.equal(close.collisions.length, 0);
  assert.equal(close.separations[0].a.id, "a");
  assert.equal(close.separations[0].b.id, "b");

  const wide = findConflicts([
    make("a", 0, 5000),
    make("b", 4.5, 5000),
  ]);
  assert.equal(wide.separations.length, 0);

  const stacked = findConflicts([
    make("a", 0, 5000),
    make("b", 1, 7000),
  ]);
  assert.equal(stacked.separations.length, 0);

  const hit = findConflicts([
    make("a", 0, 4000),
    make("b", COLLISION_NM / 2, 4200),
  ]);
  assert.equal(hit.collisions.length, 1);
  assert.equal(hit.separations.length, 0);
});

test("landing capture follows the assigned runway and completes on short final", () => {
  const airport = getAirport("KLAX");
  const runway = "24L";
  const far = createInboundAircraft(0, airport, runway, 12);
  far.clearedToLand = true;
  const guided = guideApproach({ ...far }, runway, airport.elevation);
  const capture = assessLanding(guided, runway, airport.elevation);
  assert.equal(capture.captured, true);
  assert.equal(capture.landed, false);
  assert.ok(Math.abs(capture.cross) < 0.05);
  assert.ok(Math.abs(guided.desiredAltitude - capture.glideslopeAlt) < 1);

  const uncleared = assessLanding({ ...far, clearedToLand: false }, runway, airport.elevation);
  assert.equal(uncleared.captured, false);

  let arrival = createInboundAircraft(0, airport, runway, 22);
  arrival.clearedToLand = true;
  let landed = false;
  for (let step = 0; step < 500 && !landed; step += 1) {
    guideApproach(arrival, runway, airport.elevation);
    updateAircraftPhysics(arrival, { direction: 240, speed: 8 }, [], 0.1);
    const result = assessLanding(arrival, runway, airport.elevation);
    if (result.missed) break;
    landed = result.landed;
  }
  assert.equal(landed, true);

  const otherField = createInboundAircraft(2, getAirport("VNLK"), "06", 21);
  assert.equal(otherField.runway, "06");
  assert.ok(Math.hypot(otherField.x, otherField.y) > 20);
});

test("typed and spoken clearances parse to aircraft commands", () => {
  const aircraft = [{ callsign: "UAL1230" }, { callsign: "DAL456" }];
  const heading = parseATCCommand("UAL1230 turn heading 270", aircraft);
  assert.equal(heading.command.type, "set_heading");
  assert.equal(heading.command.value, 270);
  assert.equal(heading.command.callsign, "UAL1230");

  const landing = parseATCCommand("UAL1230 cleared to land runway 24L", aircraft);
  assert.equal(landing.command.type, "cleared_to_land");
  assert.equal(landing.command.runway, "24L");

  const spoken = parseATCCommand("delta four five six descend to five thousand", aircraft);
  assert.equal(spoken.command.callsign, "DAL456");
  assert.equal(spoken.command.type, "set_altitude");
  assert.equal(spoken.command.value, 5000);

  const speed = parseATCCommand("UAL1230 reduce speed to 180", aircraft);
  assert.equal(speed.command.type, "set_speed");
  assert.equal(speed.command.value, 180);
});

test("emergency effects honor the generated type strings", () => {
  const plane = flyingEast(250);
  plane.desiredAltitude = 12000;
  applyEmergencyEffects(plane, { type: EMERGENCY_TYPES.ENGINE_FAILURE });
  assert.equal(plane.speedLimited, true);
  assert.ok(plane.maxSpeed < 250);
  assert.equal(plane.desiredAltitude, 5000);
});

test("canvas hit testing undoes CSS scaling", () => {
  const point = mapPointerToCanvas(150, 80, { left: 50, top: 20, width: 200, height: 100 }, 400);
  assert.equal(point.x, 200);
  assert.equal(point.y, 240);
});

test("airport weather multiplier increases the wind the scope flies", () => {
  const calm = {
    windSpeed: 10,
    windDir: 220,
    visibility: 20,
    turbulenceIndex: 0,
    temp: 70,
    humidity: 40,
    weatherCode: 0,
  };
  const lax = computeWeatherEffects(calm, { id: "KLAX", weatherMultiplier: 0.6 }, 1);
  const lukla = computeWeatherEffects(calm, { id: "VNLK", weatherMultiplier: 4 }, 1);
  assert.ok(lukla.windSpeed > lax.windSpeed);
  assert.equal(lukla.windDir, 220);
});
