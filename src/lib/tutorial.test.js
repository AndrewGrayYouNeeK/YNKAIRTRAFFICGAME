import assert from "node:assert/strict";
import test from "node:test";
import { getAirport } from "./airports.js";
import {
  assessLanding,
  guideApproach,
  keepOnLessonTrack,
  placeOnExtendedCenterline,
  updateAircraftPhysics,
} from "./atcPhysics.js";
import {
  TUTORIAL_STEPS,
  advanceTutorial,
  createTutorialAircraft,
  exampleFor,
  shouldOfferTutorial,
} from "./tutorial.js";
import parseATCCommand from "./voiceCommandParser.js";

const aircraft = [{ callsign: "UAL123" }, { callsign: "UAL1230" }, { callsign: "DAL456" }];
const selected = { callsign: "UAL123", runway: "24L" };

test("the guided mission is offered only before a choice is stored", () => {
  assert.equal(shouldOfferTutorial(null), true);
  assert.equal(shouldOfferTutorial(""), true);
  assert.equal(shouldOfferTutorial(undefined), true);
  assert.equal(shouldOfferTutorial("skipped"), false);
  assert.equal(shouldOfferTutorial("started"), false);
  assert.equal(shouldOfferTutorial("done"), false);
});

test("tutorial steps advance only on the matching action", () => {
  let index = 0;
  let pending = false;
  const script = [
    { type: "select" },
    { type: "scope-click" },
    { type: "select" },
    { type: "command", command: { type: "set_altitude" } },
    { type: "command", command: { type: "set_heading", value: 260 } },
    { type: "command", command: { type: "set_speed", value: 140 } },
    { type: "command", command: { type: "set_altitude", value: 5000 } },
    { type: "command", command: { type: "cleared_to_land" } },
    { type: "command", command: { type: "set_speed", value: 140 } },
    { type: "command", command: { type: "cleared_to_land" } },
    { type: "command", command: { type: "set_heading", value: 180 } },
    { type: "voice-skip" },
    { type: "landed" },
  ];
  const seen = [];
  script.forEach((event) => {
    const next = advanceTutorial(index, event, pending);
    if (next.index !== index) seen.push(TUTORIAL_STEPS[index].id);
    index = next.index;
    pending = next.landedPending;
  });
  assert.deepEqual(seen, ["scope", "select", "heading", "altitude", "speed", "land", "voice", "touchdown"]);
  assert.equal(index, TUTORIAL_STEPS.length);
});

test("a landing during the voice step finishes when voice is skipped", () => {
  const voiceIndex = TUTORIAL_STEPS.findIndex((step) => step.id === "voice");
  const duringVoice = advanceTutorial(voiceIndex, { type: "landed" }, false);
  assert.equal(duringVoice.index, voiceIndex);
  assert.equal(duringVoice.landedPending, true);
  assert.equal(duringVoice.finished, false);

  const skipped = advanceTutorial(duringVoice.index, { type: "voice-skip" }, duringVoice.landedPending);
  assert.equal(skipped.finished, true);
  assert.ok(skipped.index >= TUTORIAL_STEPS.length);
});

test("the lesson arrival stays slow and on a short final", () => {
  const airport = getAirport("KLAX");
  const plane = createTutorialAircraft(airport, "24L");
  assert.equal(plane.callsign, "UAL123");
  assert.equal(plane.speed, 160);
  assert.ok(plane.speed <= 170);
  assert.equal(plane.timeScale, 4);
  assert.equal(plane.clearedToLand, false);
  const range = Math.hypot(plane.x, plane.y);
  assert.ok(range < 18, `expected inside 18nm, got ${range}`);
  assert.ok(range > 7);

  const headingBefore = plane.desiredHeading;
  plane.x = 0;
  plane.y = 0;
  keepOnLessonTrack(plane, "24L", airport.elevation);
  const recovered = Math.hypot(plane.x, plane.y);
  assert.ok(recovered > 10);
  assert.equal(plane.speed, 160);
  assert.equal(plane.desiredHeading, headingBefore);
});

test("a tutorial final from 8nm lands without a missed approach", () => {
  const airport = getAirport("KLAX");
  const parked = placeOnExtendedCenterline("24L", 8, airport.elevation);
  const plane = {
    ...createTutorialAircraft(airport, "24L"),
    x: parked.x,
    y: parked.y,
    heading: parked.heading,
    actualHeading: parked.heading,
    desiredHeading: parked.heading,
    clearedToLand: true,
    tutorialFinal: true,
    timeScale: 24,
    status: "final",
  };
  let landed = false;
  for (let step = 0; step < 800 && !landed; step += 1) {
    guideApproach(plane, "24L", airport.elevation);
    updateAircraftPhysics(plane, { direction: 240, speed: 6 }, [], 0.05);
    const result = assessLanding(plane, "24L", airport.elevation);
    assert.equal(result.missed, false);
    landed = result.landed;
  }
  assert.equal(landed, true);
});

test("the parser accepts common phrase variations and explains misses", () => {
  const heading = parseATCCommand("UAL123 hdg 270", aircraft, selected);
  assert.equal(heading.command.type, "set_heading");
  assert.equal(heading.command.value, 270);
  assert.equal(heading.understood, "heading 270");
  assert.equal(heading.heard, "UAL123 hdg 270");

  const spokenHeading = parseATCCommand("heading to two seven zero", aircraft, selected);
  assert.equal(spokenHeading.command.type, "set_heading");
  assert.equal(spokenHeading.command.value, 270);

  const numericHeading = parseATCCommand("heading to 270", aircraft, selected);
  assert.equal(numericHeading.command.value, 270);

  const speed = parseATCCommand("speed 180", aircraft, selected);
  assert.equal(speed.command.type, "set_speed");
  assert.equal(speed.command.value, 180);

  const slow = parseATCCommand("UAL123 slow to 140 knots", aircraft);
  assert.equal(slow.command.value, 140);

  const landing = parseATCCommand("cleared for landing runway 24 left", aircraft, selected);
  assert.equal(landing.command.type, "cleared_to_land");
  assert.equal(landing.command.runway, "24L");
  assert.match(landing.understood, /runway 24L/);

  const compact = parseATCCommand("UAL123 cleared to land runway 24L", aircraft);
  assert.equal(compact.command.runway, "24L");

  const descend = parseATCCommand("descend to 5000", aircraft, selected);
  assert.equal(descend.command.type, "set_altitude");
  assert.equal(descend.command.value, 5000);

  const miss = parseATCCommand("go left a bit", aircraft, selected, {
    example: exampleFor({ id: "heading" }, { callsign: "UAL123", runway: "24L" }),
  });
  assert.equal(miss.command, null);
  assert.equal(miss.understood, null);
  assert.match(miss.suggestion, /UAL123 heading/);
  assert.match(miss.readback, /Say again/);
  assert.match(miss.readback, /Try:/);
});
