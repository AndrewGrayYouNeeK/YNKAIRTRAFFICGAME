import { App } from "@capacitor/app";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { resumeAudio, suspendAudio } from "./audioManager";

function lockNativeViewport() {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) return;
  viewport.setAttribute(
    "content",
    "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  );
}

function blockPinchZoom() {
  const block = (event) => event.preventDefault();
  document.addEventListener("gesturestart", block, { passive: false });
  document.addEventListener("gesturechange", block, { passive: false });
}

async function configureNativeChrome() {
  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Dark });
  } catch {
    // Status bar styling is cosmetic. The game still runs if the plugin is unavailable.
  }
  try {
    await SplashScreen.hide();
  } catch {
    // The splash can already be hidden when launchAutoHide is on.
  }
  await App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) resumeAudio();
    else suspendAudio();
  });
}

export function initNativeShell() {
  const native = Capacitor.isNativePlatform();
  if (native) {
    const root = document.documentElement;
    root.classList.add("native-app", `native-${Capacitor.getPlatform()}`);
    lockNativeViewport();
    blockPinchZoom();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") suspendAudio();
    else resumeAudio();
  });

  if (native) void configureNativeChrome();
  return native;
}
