export function getSpeechRecognition(root) {
  const host = root || (typeof window === "undefined" ? undefined : window);
  if (!host) return null;
  return host.SpeechRecognition || host.webkitSpeechRecognition || null;
}

export function unsupportedSpeechMessage() {
  return "This browser has no speech recognition. iOS Firefox and some iOS Safari versions do not provide webkitSpeechRecognition. Type a clearance or use the command buttons.";
}

export function speechErrorMessage(code) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone permission was denied. Allow the mic for this site, then tap TAP MIC again. You can also type the clearance.";
    case "audio-capture":
      return "No microphone was found. Type the clearance or use the command buttons.";
    case "network":
      return "Speech recognition needs a network connection. Type the clearance instead.";
    case "no-speech":
      return "No speech was heard. Tap TAP MIC and speak the clearance.";
    case "aborted":
      return "";
    case "language-not-supported":
      return "This browser cannot recognize English speech. Type the clearance instead.";
    case "start-failed":
      return "Speech recognition did not start. Type the clearance, or try TAP MIC again.";
    default:
      return "Speech recognition failed. Type the clearance, or tap TAP MIC again.";
  }
}
