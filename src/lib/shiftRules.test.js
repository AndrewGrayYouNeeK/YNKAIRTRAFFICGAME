import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getAirport } from "./airports.js";
import {
  SEPARATION_NM,
  chooseInboundSpawn,
  clampDelta,
  getMinSeparation,
  mergeCommandedAircraft,
  updateSeparationWatch,
} from "./atcPhysics.js";
import { settleEmergency } from "./emergencySystem.js";
import { LEADERBOARD_KEY, recordShiftScore } from "./scoringEngine.js";
import { pauseForBackground } from "./sessionControl.js";
import { nativePermissionGranted } from "./speechInput.js";

const STATES = { active: "active", paused: "paused" };

function memoryStore() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

test("a background gap does not fast-forward the spawn clock", () => {
  assert.equal(clampDelta(30), 0.1);
  assert.ok(clampDelta(30) < 1);
  assert.equal(clampDelta(0.016), 0.016);
});

test("leaving the app pauses an active shift and leaves a manual pause alone", () => {
  assert.deepEqual(pauseForBackground("active", STATES), { state: "paused", automatic: true });
  assert.deepEqual(pauseForBackground("paused", STATES), { state: "paused", automatic: false });
  assert.deepEqual(pauseForBackground("gameover", STATES), { state: "gameover", automatic: false });
  assert.deepEqual(pauseForBackground("setup", STATES), { state: "setup", automatic: false });
});

test("separation losses stay open across the 3nm boundary until the pair is clear", () => {
  const a = { id: "a", x: 0, y: 0, altitude: 5000, status: "inbound" };
  const b = { id: "b", x: SEPARATION_NM - 0.05, y: 0, altitude: 5000, status: "inbound" };
  const opened = updateSeparationWatch(new Set(), [a, b]);
  assert.equal(opened.fresh.length, 1);
  assert.equal(opened.collisions.length, 0);

  b.x = SEPARATION_NM + 0.05;
  const flickering = updateSeparationWatch(opened.active, [a, b]);
  assert.equal(flickering.fresh.length, 0);
  assert.equal(flickering.active.size, 1);

  b.x = SEPARATION_NM + 0.7;
  const cleared = updateSeparationWatch(flickering.active, [a, b]);
  assert.equal(cleared.active.size, 0);

  b.x = 1;
  const again = updateSeparationWatch(cleared.active, [a, b]);
  assert.equal(again.fresh.length, 1);
});

test("a new arrival is not spawned inside an existing aircraft", () => {
  const airport = getAirport("KLAX");
  const firstChoice = chooseInboundSpawn([], airport, "24L", 1);
  const blocking = { ...firstChoice, id: "already-there" };
  const arrival = chooseInboundSpawn([blocking], airport, "24L", 1);
  assert.ok(arrival);
  assert.notEqual(arrival.id, blocking.id);
  const gap = getMinSeparation(blocking, arrival);
  assert.ok(gap.horDist >= SEPARATION_NM || gap.altDiff >= 1000);
  assert.ok(gap.horDist > 0.2);
});

test("a clearance issued during a frame is kept", () => {
  const simulated = [{
    id: "p1",
    x: 12,
    y: 4,
    desiredHeading: 240,
    desiredAltitude: 4000,
    desiredSpeed: 180,
    clearedToLand: false,
    status: "inbound",
    runway: "24L",
    tutorialFinal: false,
  }];
  const live = [{
    ...simulated[0],
    desiredHeading: 270,
    clearedToLand: false,
  }];
  const merged = mergeCommandedAircraft(simulated, live);
  assert.equal(merged[0].desiredHeading, 270);
  assert.equal(merged[0].x, 12);

  const teleported = mergeCommandedAircraft(simulated, [{
    ...simulated[0],
    x: 3,
    y: 1,
    heading: 240,
    actualHeading: 240,
    desiredHeading: 240,
    tutorialFinal: true,
    clearedToLand: true,
    timeScale: 24,
  }]);
  assert.equal(teleported[0].x, 3);
  assert.equal(teleported[0].tutorialFinal, true);
  assert.equal(teleported[0].timeScale, 24);
});

test("emergencies score only when that aircraft lands", () => {
  const emergency = { type: "medical", planeId: "p1", message: "Medical" };
  assert.equal(settleEmergency(emergency, { id: "p1" }, false).handled, false);
  assert.equal(settleEmergency(emergency, { id: "p2" }, true).handled, false);
  const settled = settleEmergency(emergency, { id: "p1" }, true);
  assert.equal(settled.handled, true);
  assert.equal(settled.emergency, null);
});

test("the leaderboard records a finished shift, not each landing", () => {
  const storage = memoryStore();
  const stats = {
    successful_landings: 1,
    failed_landings: 0,
    emergencies_handled: 0,
    collisions: 0,
    separationViolations: 0,
  };
  const running = recordShiftScore("ATC Operator", stats, undefined, storage);
  assert.equal(running, 150);
  assert.equal(storage.getItem(LEADERBOARD_KEY), null);

  recordShiftScore("ATC Operator", { ...stats, successful_landings: 2 }, "completed", storage);
  const board = JSON.parse(storage.getItem(LEADERBOARD_KEY));
  assert.equal(board.length, 1);
  assert.equal(board[0].landings, 2);
  assert.equal(board[0].score, 300);
});

test("native speech stays closed until both permissions are granted", () => {
  assert.equal(nativePermissionGranted({ speechRecognition: "granted" }), true);
  assert.equal(nativePermissionGranted({ speechRecognition: "denied" }), false);
  assert.equal(nativePermissionGranted({ speechRecognition: "prompt" }), false);
  assert.equal(nativePermissionGranted(null), false);
});

test("the iOS TestFlight workflow uses API-key signing and an unsigned PR compile", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const workflow = readFileSync(join(root, ".github/workflows/ios-testflight.yml"), "utf8");
  const fastfile = readFileSync(join(root, "fastlane/Fastfile"), "utf8");
  const info = readFileSync(join(root, "ios/App/App/Info.plist"), "utf8");

  assert.match(workflow, /runs-on:\s*macos-26/);
  assert.match(workflow, /npm run ios:sync/);
  assert.match(workflow, /ios\/App\/App\.xcodeproj/);
  assert.match(workflow, /CODE_SIGNING_ALLOWED=NO/);
  assert.match(workflow, /github\.event_name != 'pull_request'/);
  assert.match(workflow, /fastlane ios beta/);
  assert.match(workflow, /secrets\.APP_STORE_CONNECT_API_KEY_P8/);
  assert.match(workflow, /secrets\.APPLE_TEAM_ID/);
  assert.equal(workflow.includes("APP_STORE_CONNECT_API_KEY_BASE64"), false);
  assert.equal(workflow.includes("IOS_PROVISION_PROFILE_BASE64"), false);

  assert.match(fastfile, /BUNDLE_ID = "com\.youneek\.airtraffic"/);
  assert.match(fastfile, /latest_testflight_build_number/);
  assert.match(fastfile, /increment_build_number/);
  assert.match(fastfile, /YNKAirTraffic\.ipa/);

  assert.match(info, /<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\/>/);
  assert.match(info, /<key>NSMicrophoneUsageDescription<\/key>/);
  assert.match(info, /<key>NSSpeechRecognitionUsageDescription<\/key>/);
});
