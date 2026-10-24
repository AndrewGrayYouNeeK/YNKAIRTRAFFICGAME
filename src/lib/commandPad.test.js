import assert from "node:assert/strict";
import test from "node:test";
import {
  altitudeCommand,
  headingCommand,
  nextAltitude,
  nextHeading,
  nextSpeed,
  speedCommand,
} from "./commandPad.js";

test("heading buttons wrap through north", () => {
  assert.equal(nextHeading(350, 30), 20);
  assert.equal(nextHeading(10, -30), 340);
  assert.equal(nextHeading(240, 10), 250);
  assert.equal(nextHeading(240, -10), 230);
});

test("altitude and speed stay inside the command limits", () => {
  assert.equal(nextAltitude(500, -1000), 0);
  assert.equal(nextAltitude(44500, 1000), 45000);
  assert.equal(nextAltitude(4000, -1000), 3000);
  assert.equal(nextSpeed(90, -20), 80);
  assert.equal(nextSpeed(270, 20, 280), 280);
  assert.equal(nextSpeed(200, 20, 210), 210);
});

test("pad commands use the airplane's current targets", () => {
  const plane = {
    desiredHeading: 90,
    desiredAltitude: 6000,
    desiredSpeed: 180,
    maxSpeed: 220,
  };
  assert.deepEqual(headingCommand(plane, -30), { type: "set_heading", value: 60 });
  assert.deepEqual(altitudeCommand(plane, 1000), { type: "set_altitude", value: 7000 });
  assert.deepEqual(speedCommand(plane, 20), { type: "set_speed", value: 200 });
  assert.deepEqual(speedCommand(plane, 80), { type: "set_speed", value: 220 });
});
