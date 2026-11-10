import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const OUT = path.resolve("docs/app-store/screenshots");
const PORT = 4173;

const DEVICES = [
  { name: "iphone-6.7", width: 932, height: 430, scale: 3, pixels: [2796, 1290] },
  { name: "iphone-6.5", width: 896, height: 414, scale: 3, pixels: [2688, 1242] },
];

function startPreview() {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(child);
      }
    }, 1500);
    child.stderr.on("data", (chunk) => {
      const text = String(chunk);
      if (/Local:|localhost|4173/.test(text) && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve(child);
      }
    });
    child.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error(`preview exited ${code}`));
      }
    });
  });
}

async function shoot(page, file) {
  await page.screenshot({ path: path.join(OUT, file), type: "png" });
}

function deviceContext(browser, device) {
  return browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    hasTouch: true,
    isMobile: true,
  });
}

async function hideChrome(page) {
  await page.addStyleTag({
    content: "button.fixed.top-4.left-4 { display: none !important; }",
  });
}

async function captureDevice(browser, device) {
  const airportContext = await deviceContext(browser, device);
  await airportContext.addInitScript(() => {
    localStorage.setItem("atc_tutorial_status", "skipped");
  });
  const airportPage = await airportContext.newPage();
  await airportPage.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "domcontentloaded" });
  await hideChrome(airportPage);
  await airportPage.waitForSelector("[data-testid='airport-KLAX']");
  await shoot(airportPage, `${device.name}-airport.png`);
  await airportContext.close();

  const scopeContext = await deviceContext(browser, device);
  const page = await scopeContext.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "domcontentloaded" });
  await hideChrome(page);
  await page.getByTestId("tutorial-start").click();
  await page.waitForSelector("[data-testid='atc-scope']");
  await page.waitForTimeout(700);
  const canvas = page.locator("canvas.atc-radar-canvas");
  const box = await canvas.boundingBox();
  if (box) {
    const points = [
      [0.5, 0.5],
      [0.62, 0.38],
      [0.38, 0.62],
      [0.7, 0.3],
      [0.3, 0.7],
      [0.55, 0.42],
      [0.48, 0.35],
      [0.52, 0.6],
    ];
    for (const [x, y] of points) {
      await page.mouse.click(box.x + box.width * x, box.y + box.height * y);
      const callsign = await page.getByTestId("pad-callsign").innerText();
      if (callsign && callsign !== "NO TARGET") break;
    }
  }
  await page.waitForTimeout(400);
  await shoot(page, `${device.name}-scope.png`);
  await scopeContext.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const preview = await startPreview();
  const browser = await chromium.launch();
  try {
    for (const device of DEVICES) {
      await captureDevice(browser, device);
      console.log(`captured ${device.name} ${device.pixels.join("x")}`);
    }
  } finally {
    await browser.close();
    preview.kill("SIGTERM");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
