import { placeOnExtendedCenterline, runwayHeading } from "./atcPhysics.js";

export const TUTORIAL_STORAGE_KEY = "atc_tutorial_status";

export const CHEAT_SHEET = [
  { intent: "Heading", phrase: "CALLSIGN heading 250" },
  { intent: "Heading", phrase: "CALLSIGN turn left heading 250" },
  { intent: "Altitude", phrase: "CALLSIGN descend to 5000" },
  { intent: "Altitude", phrase: "CALLSIGN climb to 8000" },
  { intent: "Altitude", phrase: "CALLSIGN maintain 6000" },
  { intent: "Speed", phrase: "CALLSIGN speed 160" },
  { intent: "Speed", phrase: "CALLSIGN reduce speed to 140" },
  { intent: "Land", phrase: "CALLSIGN cleared to land runway 24L" },
  { intent: "Land", phrase: "CALLSIGN cleared to land" },
];

export const VOICE_TIPS = [
  "Voice is optional. The sliders and the typed box already fly the airplane.",
  "Tap TAP MIC beside the typed box, speak, then tap STOP. Holding Space does the same when you are not typing.",
  "Say the callsign first, then one instruction. Example: “United one two three, heading two five zero.”",
  "The line under the box shows Listening, then Heard and Understood. If the browser has no mic support, that line says so.",
];

export const TUTORIAL_STEPS = [
  {
    id: "scope",
    action: "click-scope",
    highlight: "scope",
    title: "This is the scope",
    body: "The circle is the sky around the airport. Rings are 10 nautical miles apart. The bright strips are this airport’s runways, and the green line is the active approach. One slow arrival is on the screen. Its label shows the callsign, altitude, speed, and a trend arrow: up, down, or level.",
  },
  {
    id: "select",
    action: "select-aircraft",
    highlight: "scope",
    title: "Select the arrival",
    body: "Click the airplane itself, not the empty scope. The right-hand panel fills in with that callsign. Every slider and typed clearance applies to the selected target.",
  },
  {
    id: "heading",
    action: "change-heading",
    highlight: "heading",
    also: "command",
    title: "Turn with the heading slider",
    body: "Drag the Heading slider and release it. Releasing sends the instruction, so the radio is not spammed while you drag. You can type the same thing instead.",
  },
  {
    id: "altitude",
    action: "change-altitude",
    highlight: "altitude",
    also: "command",
    title: "Set an altitude",
    body: "Use the Altitude slider, release it, or type a descend or climb clearance. The trend arrow on the scope follows the new altitude.",
  },
  {
    id: "speed",
    action: "change-speed",
    highlight: "speed",
    also: "command",
    title: "Set a speed",
    body: "Use the Speed slider or type a speed clearance. Slower is easier on final. This arrival stays gentle either way.",
  },
  {
    id: "land",
    action: "clear-to-land",
    highlight: "land",
    also: "command",
    title: "Clear them to land",
    body: "Press CLEARED TO LAND, or type it. They will capture this airport’s runway and fly the glideslope. Nothing in this lesson can fail you.",
  },
  {
    id: "voice",
    action: "voice-optional",
    highlight: "voice",
    title: "Voice is optional",
    body: "Tap TAP MIC next to the typed clearance and say one instruction. The line under the box shows what it heard. If this browser cannot use the mic, that line explains why, and you can continue without voice.",
  },
  {
    id: "touchdown",
    action: "landed",
    highlight: "scope",
    title: "Watch the landing",
    body: "Leave them on the approach. Altitude should fall along the glideslope, and the score ticks up when the wheels are on the runway.",
  },
];

export function shouldOfferTutorial(status) {
  return status == null || status === "";
}

export function readTutorialStatus(storage) {
  if (!storage) return "done";
  try {
    return storage.getItem(TUTORIAL_STORAGE_KEY);
  } catch {
    return "done";
  }
}

export function markTutorialStatus(storage, status) {
  if (!storage) return;
  storage.setItem(TUTORIAL_STORAGE_KEY, status);
}

export function exampleFor(step, context = {}) {
  const callsign = context.callsign || "UAL123";
  const runway = context.runway || "24L";
  const heading = (runwayHeading(runway) + 20) % 360;
  switch (step?.id) {
    case "heading":
      return `${callsign} heading ${String(heading).padStart(3, "0")}`;
    case "altitude":
      return `${callsign} descend to 5000`;
    case "speed":
      return `${callsign} speed 140`;
    case "land":
      return `${callsign} cleared to land runway ${runway}`;
    case "voice":
      return `${callsign} heading ${String(heading).padStart(3, "0")}`;
    default:
      return null;
  }
}

export function stepMatches(step, event) {
  if (!step || !event) return false;
  switch (step.action) {
    case "click-scope":
      return event.type === "scope-click";
    case "select-aircraft":
      return event.type === "select";
    case "change-heading":
      return event.type === "command" && event.command?.type === "set_heading";
    case "change-altitude":
      return event.type === "command" && event.command?.type === "set_altitude";
    case "change-speed":
      return event.type === "command" && event.command?.type === "set_speed";
    case "clear-to-land":
      return event.type === "command" && event.command?.type === "cleared_to_land";
    case "voice-optional":
      return event.type === "voice-skip" || event.type === "voice-command";
    case "landed":
      return event.type === "landed";
    default: {
      const unknown = step.action;
      void unknown;
      return false;
    }
  }
}

export function advanceTutorial(index, event, landedPending = false) {
  const pending = landedPending || event?.type === "landed";
  if (index < 0 || index >= TUTORIAL_STEPS.length) {
    return { index, landedPending: pending, finished: index >= TUTORIAL_STEPS.length };
  }
  if (!stepMatches(TUTORIAL_STEPS[index], event)) {
    return { index, landedPending: pending, finished: false };
  }
  let next = index + 1;
  if (TUTORIAL_STEPS[next]?.action === "landed" && pending) next += 1;
  return {
    index: next,
    landedPending: pending,
    finished: next >= TUTORIAL_STEPS.length,
  };
}

export function createTutorialAircraft(airport, runway) {
  const designator = runway || airport?.runways?.[0] || "24L";
  const elevation = airport?.elevation || 0;
  const parked = placeOnExtendedCenterline(designator, 12, elevation);
  const altitude = Math.max(4000, Math.round((parked.altitude + 1000) / 500) * 500);
  return {
    id: "plane-tutorial",
    callsign: "UAL123",
    aircraft_type: "B738",
    wakeCategory: "medium",
    x: parked.x,
    y: parked.y,
    altitude,
    speed: 160,
    desiredSpeed: 160,
    desiredAltitude: altitude,
    heading: parked.heading,
    desiredHeading: parked.heading,
    actualHeading: parked.heading,
    status: "inbound",
    runway: designator,
    clearedToLand: false,
    collisionWarning: false,
    separationViolation: false,
    verticalSpeed: 0,
    trajectory: [],
    timeScale: 4,
    tutorialLesson: true,
  };
}
