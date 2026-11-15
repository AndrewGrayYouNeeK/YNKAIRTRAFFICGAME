import { chromium } from "playwright";

const BASE = process.env.PLAY_URL || "http://127.0.0.1:5173";
const PHONES = [
  { name: "iphone-se", width: 667, height: 375, safe: { top: "0px", right: "0px", bottom: "21px", left: "0px" } },
  { name: "iphone-14", width: 844, height: 390, safe: { top: "0px", right: "0px", bottom: "21px", left: "47px" } },
  { name: "iphone-14-plus", width: 926, height: 428, safe: { top: "0px", right: "0px", bottom: "21px", left: "47px" } },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function applySafeArea(page, safe) {
  const shell = page.locator(".atc-v2-container, .atc-setup").first();
  await shell.evaluate((el, insets) => {
    el.style.setProperty("--safe-top", insets.top);
    el.style.setProperty("--safe-right", insets.right);
    el.style.setProperty("--safe-bottom", insets.bottom);
    el.style.setProperty("--safe-left", insets.left);
  }, safe);
}

async function boxInside(page, locator, label) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  assert(box, `${label} has no box`);
  assert(box.x >= -1, `${label} is left of the viewport (${box.x})`);
  assert(box.y >= -1, `${label} is above the viewport (${box.y})`);
  assert(box.x + box.width <= viewport.width + 1, `${label} overflows the right edge`);
  assert(box.y + box.height <= viewport.height + 1, `${label} overflows the bottom edge (${Math.round(box.y + box.height)} > ${viewport.height})`);
  return box;
}

async function readTelemetry(page) {
  const node = page.locator("[data-testid='atc-telemetry']");
  return {
    state: await node.getAttribute("data-state"),
    step: await node.getAttribute("data-tutorial-step"),
    score: Number(await node.getAttribute("data-score")),
    separations: Number(await node.getAttribute("data-separations")),
    aircraft: JSON.parse(await node.getAttribute("data-aircraft") || "[]"),
  };
}

async function clickAircraft(page) {
  const { aircraft } = await readTelemetry(page);
  assert(aircraft.length > 0, "no aircraft to select");
  const plane = aircraft[0];
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  const size = box.width;
  const center = size / 2;
  const pxPerNm = (size / 2 - 28) / 40;
  const x = box.x + center + plane.x * pxPerNm;
  const y = box.y + center - plane.y * pxPerNm;
  await page.mouse.click(x, y);
}

async function playTutorial(page, phone) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await applySafeArea(page, phone.safe);
  await page.getByTestId("tutorial-start").click();
  await page.getByTestId("game-shell").waitFor();
  await applySafeArea(page, phone.safe);

  const mic = await boxInside(page, page.getByTestId("mic-button"), "mic");
  assert(mic.height >= 44, `mic is ${mic.height}px, expected at least 44`);
  for (const id of ["turn-left-10", "descend", "slower", "clear-to-land", "command-input"]) {
    const control = await boxInside(page, page.getByTestId(id), id);
    if (id !== "command-input") assert(control.height >= 44, `${id} is ${control.height}px`);
  }
  const voice = await page.getByTestId("voice-panel").boundingBox();
  assert(voice && voice.height > 0, "voice status is hidden");
  await boxInside(page, page.getByTestId("voice-panel"), "voice status");

  const card = await page.locator(".tutorial-card").boundingBox();
  const land = await page.getByTestId("clear-to-land").boundingBox();
  const overlaps = card && land
    && card.x < land.x + land.width
    && card.x + card.width > land.x
    && card.y < land.y + land.height
    && card.y + card.height > land.y;
  assert(!overlaps, "tutorial card covers the landing button");

  const scope = await page.locator("canvas").boundingBox();
  await page.mouse.click(scope.x + scope.width * 0.72, scope.y + scope.height * 0.28);
  await page.waitForFunction(() => document.querySelector("[data-testid='atc-telemetry']")?.getAttribute("data-tutorial-step") === "select");
  await clickAircraft(page);
  await page.waitForFunction(() => document.querySelector("[data-testid='atc-telemetry']")?.getAttribute("data-tutorial-step") === "heading");

  const before = (await readTelemetry(page)).aircraft[0].heading;
  await page.getByTestId("turn-left-10").click();
  await page.getByTestId("turn-left-10").click();
  await page.waitForFunction((start) => {
    const raw = document.querySelector("[data-testid='atc-telemetry']")?.getAttribute("data-aircraft");
    const heading = JSON.parse(raw || "[]")[0]?.heading;
    if (typeof heading !== "number") return false;
    const delta = (start - heading + 360) % 360;
    return delta >= 18 && delta <= 24;
  }, before, { timeout: 8000 });

  await page.getByTestId("descend").click();
  await page.getByTestId("slower").click();
  await page.getByTestId("clear-to-land").click();
  await page.waitForFunction(() => document.querySelector("[data-testid='atc-telemetry']")?.getAttribute("data-tutorial-step") === "voice");
  const unsupported = await page.getByTestId("voice-panel").innerText();
  assert(/speech|mic|type/i.test(unsupported), `voice fallback text missing: ${unsupported}`);
  assert(await page.getByTestId("descend").isEnabled(), "thumb buttons disabled when speech is unavailable");
  await page.getByTestId("tutorial-skip-voice").click();
  await page.getByTestId("tutorial-complete").waitFor({ timeout: 20000 });
  const done = await readTelemetry(page);
  assert(done.score > 0, "landing did not score");
  assert(done.step === "complete", `tutorial ended on ${done.step}`);
}

async function speechFlows(browser) {
  const denied = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  await denied.addInitScript(() => {
    class DeniedSpeech {
      start() {
        setTimeout(() => {
          this.onerror?.({ error: "not-allowed" });
          this.onend?.();
        }, 30);
      }
      stop() { this.onend?.(); }
    }
    window.SpeechRecognition = DeniedSpeech;
    window.webkitSpeechRecognition = DeniedSpeech;
  });
  const deniedPage = await denied.newPage();
  const deniedErrors = [];
  deniedPage.on("pageerror", (error) => deniedErrors.push(String(error)));
  await deniedPage.goto(BASE, { waitUntil: "networkidle" });
  await deniedPage.evaluate(() => localStorage.setItem("atc_tutorial_status", "skipped"));
  await deniedPage.reload({ waitUntil: "networkidle" });
  await deniedPage.getByTestId("airport-KLAX").click();
  await deniedPage.getByTestId("start-control").click();
  await deniedPage.getByTestId("start-sim").click();
  await deniedPage.locator("canvas").click({ position: { x: 120, y: 80 } });
  await clickAircraft(deniedPage);
  await deniedPage.getByTestId("mic-button").click();
  await deniedPage.getByText(/permission was denied/i).waitFor();
  assert(await deniedPage.getByTestId("descend").isEnabled(), "buttons died after mic denial");
  await deniedPage.getByTestId("descend").click();
  await deniedPage.getByTestId("command-input").fill("UAL heading 090");
  await deniedPage.getByTestId("command-form").locator("button[type='submit']").click();
  assert(deniedErrors.length === 0, `page errors during denied mic: ${deniedErrors.join(" | ")}`);
  await denied.close();

  const granted = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  await granted.addInitScript(() => {
    class GrantedSpeech {
      start() {}
      stop() {
        this.onresult?.({
          resultIndex: 0,
          results: [{ 0: { transcript: "heading 180" }, isFinal: true, length: 1 }],
        });
        this.onend?.();
      }
    }
    window.SpeechRecognition = GrantedSpeech;
    window.webkitSpeechRecognition = GrantedSpeech;
  });
  const grantedPage = await granted.newPage();
  await grantedPage.goto(BASE, { waitUntil: "networkidle" });
  await grantedPage.evaluate(() => localStorage.setItem("atc_tutorial_status", "skipped"));
  await grantedPage.reload({ waitUntil: "networkidle" });
  await grantedPage.getByTestId("airport-KLAX").click();
  await grantedPage.getByTestId("start-control").click();
  await grantedPage.getByTestId("start-sim").click();
  await clickAircraft(grantedPage);
  await grantedPage.getByTestId("mic-button").click();
  await grantedPage.getByText(/Listening/i).waitFor();
  await grantedPage.getByTestId("mic-button").click();
  await grantedPage.getByTestId("voice-panel").getByText(/Heard:/i).waitFor();
  await granted.close();
}

async function pauseAndCollision(browser) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("atc_tutorial_status", "skipped"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("airport-KLAX").click();
  await page.getByTestId("start-control").click();
  await page.getByTestId("start-sim").click();
  await page.evaluate(() => {
    Object.defineProperty(Document.prototype, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.getByTestId("paused-overlay").waitFor();
  const paused = await readTelemetry(page);
  assert(paused.state === "paused", `expected paused, got ${paused.state}`);
  const heading = paused.aircraft[0]?.heading;
  await page.waitForTimeout(400);
  const still = await readTelemetry(page);
  assert(still.aircraft[0]?.heading === heading, "aircraft moved while paused");
  await page.getByTestId("resume-sim").click();
  assert((await readTelemetry(page)).state === "active", "resume did not continue the shift");

  await page.evaluate(() => {
    window.__atcPreview.setScene({
      freeze: false,
      tutorial: false,
      selectedId: "a",
      aircraft: [
        { id: "a", callsign: "UAL1", x: 0, y: 8, altitude: 4000, speed: 0, heading: 90 },
        { id: "b", callsign: "DAL2", x: 0.1, y: 8, altitude: 4200, speed: 0, heading: 90 },
      ],
    });
  });
  await page.getByText("GAME OVER").waitFor({ timeout: 5000 });
  assert(/collision/i.test(await page.locator(".gameover-stat").first().innerText()), "game over was not a collision");
  assert(errors.length === 0, `page errors: ${errors.join(" | ")}`);
  await context.close();
}

async function frameRate(browser) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("atc_tutorial_status", "skipped"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("airport-KLAX").click();
  await page.getByTestId("start-control").click();
  await page.getByTestId("start-sim").click();
  const frames = await page.evaluate(() => new Promise((resolve) => {
    let count = 0;
    const start = performance.now();
    const tick = (now) => {
      count += 1;
      if (now - start >= 1000) resolve(count);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
  assert(frames >= 30, `animation frames in one second: ${frames}`);
  await context.close();
  return frames;
}

const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const phone of PHONES) {
    const context = await browser.newContext({
      viewport: { width: phone.width, height: phone.height },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    try {
      await playTutorial(page, phone);
      if (errors.length) throw new Error(errors.join(" | "));
      console.log(`layout and tutorial ok: ${phone.name}`);
    } catch (error) {
      failures.push(`${phone.name}: ${error.message}`);
      console.error(`FAIL ${phone.name}: ${error.message}`);
    }
    await context.close();
  }
  try {
    await speechFlows(browser);
    console.log("speech denied and granted ok");
  } catch (error) {
    failures.push(`speech: ${error.message}`);
    console.error(`FAIL speech: ${error.message}`);
  }
  try {
    await pauseAndCollision(browser);
    console.log("pause and collision ok");
  } catch (error) {
    failures.push(`pause: ${error.message}`);
    console.error(`FAIL pause: ${error.message}`);
  }
  try {
    const frames = await frameRate(browser);
    console.log(`frames in 1s: ${frames}`);
  } catch (error) {
    failures.push(`fps: ${error.message}`);
    console.error(`FAIL fps: ${error.message}`);
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("phone playthrough passed");
