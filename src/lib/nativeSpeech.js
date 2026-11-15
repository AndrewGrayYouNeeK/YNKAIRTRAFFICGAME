import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capgo/capacitor-speech-recognition";

const LANGUAGE = "en-US";

const CONTEXTUAL_STRINGS = [
  "cleared to land",
  "go around",
  "heading",
  "descend",
  "climb",
  "maintain",
  "runway",
  "speed",
  "United",
  "Delta",
  "American",
  "Southwest",
];

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export async function nativeSpeechSupported() {
  if (!isNativeApp()) return false;
  try {
    const result = await SpeechRecognition.available();
    return Boolean(result?.available);
  } catch {
    return false;
  }
}

function transcriptFromPartial(event) {
  const match = event?.matches?.find((item) => item && item.trim());
  return (match || event?.accumulatedText || event?.accumulated || "").trim();
}

async function onDeviceRecognitionAvailable() {
  try {
    const result = await SpeechRecognition.isOnDeviceRecognitionAvailable({
      language: LANGUAGE,
      preferLegacyRecognizer: true,
    });
    return Boolean(result?.available);
  } catch {
    return false;
  }
}

export async function startNativeListening({ onPartial, onError }) {
  const permissions = await SpeechRecognition.requestPermissions();
  if (permissions?.speechRecognition !== "granted") {
    onError?.("not-allowed");
    return null;
  }

  const onDevice = await onDeviceRecognitionAvailable();
  let latest = "";
  const partialHandle = await SpeechRecognition.addListener("partialResults", (event) => {
    const text = transcriptFromPartial(event);
    if (!text) return;
    latest = text;
    onPartial?.(text);
  });
  const errorHandle = await SpeechRecognition.addListener("error", (event) => {
    onError?.(event?.code || "start-failed");
  });

  const removeListeners = async () => {
    await partialHandle.remove().catch(() => {});
    await errorHandle.remove().catch(() => {});
  };

  try {
    await SpeechRecognition.start({
      language: LANGUAGE,
      maxResults: 3,
      partialResults: true,
      popup: false,
      addPunctuation: false,
      contextualStrings: CONTEXTUAL_STRINGS,
      preferLegacyRecognizer: true,
      useOnDeviceRecognition: onDevice,
    });
  } catch (error) {
    await removeListeners();
    const message = String(error?.message || error || "");
    if (/denied|permission/i.test(message)) onError?.("not-allowed");
    else if (/on-device/i.test(message)) onError?.("ON_DEVICE_RECOGNITION_UNAVAILABLE");
    else onError?.("start-failed");
    return null;
  }

  return {
    async stop() {
      try {
        const last = await SpeechRecognition.getLastPartialResult();
        const cached = (last?.text || last?.matches?.[0] || "").trim();
        if (cached) latest = cached;
      } catch {
        // The session can end before a partial result is cached.
      }
      try {
        await SpeechRecognition.stop();
      } catch {
        try {
          await SpeechRecognition.forceStop();
        } catch {
          // Already stopped.
        }
      }
      await removeListeners();
      return latest.trim();
    },
  };
}
