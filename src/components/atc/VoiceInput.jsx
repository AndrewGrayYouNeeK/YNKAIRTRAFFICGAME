import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import parseATCCommand from "@/lib/voiceCommandParser";
import { getSpeechRecognition, speechErrorMessage, unsupportedSpeechMessage } from "@/lib/speechInput";

const SpeechContext = createContext(null);

function useSpeech() {
  const speech = useContext(SpeechContext);
  if (!speech) throw new Error("Mic controls must sit inside SpeechProvider");
  return speech;
}

export function SpeechProvider({
  children,
  onCommand,
  aircraft = [],
  selectedPlane = null,
  activeRunway = "",
  example = "",
}) {
  const recognitionRef = useRef(null);
  const isTransmittingRef = useRef(false);
  const latestInterimRef = useRef("");
  const latestFinalRef = useRef("");
  const ignoreResultRef = useRef(false);
  const aircraftRef = useRef(aircraft);
  const selectedRef = useRef(selectedPlane);
  const runwayRef = useRef(activeRunway);
  const exampleRef = useRef(example);
  const onCommandRef = useRef(onCommand);
  aircraftRef.current = aircraft;
  selectedRef.current = selectedPlane;
  runwayRef.current = activeRunway;
  exampleRef.current = example;
  onCommandRef.current = onCommand;

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [interim, setInterim] = useState("");
  const [lastLog, setLastLog] = useState(null);
  const [notice, setNotice] = useState("");
  const supported = Boolean(getSpeechRecognition());

  const processTranscript = () => {
    const transcript = (latestFinalRef.current || latestInterimRef.current || "").trim();
    latestInterimRef.current = "";
    latestFinalRef.current = "";
    setInterim("");
    if (!transcript) {
      setNotice((current) => current || speechErrorMessage("no-speech"));
      return;
    }
    const selected = selectedRef.current;
    const parsed = parseATCCommand(transcript, aircraftRef.current, selected, {
      runway: selected?.runway || runwayRef.current,
      callsign: selected?.callsign,
      example: exampleRef.current,
    });
    setNotice("");
    setLastLog({ transcript, ...parsed });
    onCommandRef.current?.(parsed.command, parsed);
  };

  const stopTransmission = () => {
    if (!isTransmittingRef.current) return;
    recognitionRef.current?.stop();
  };

  const startTransmission = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition || isTransmittingRef.current) return;
    setNotice("");
    setLastLog(null);
    latestInterimRef.current = "";
    latestFinalRef.current = "";
    ignoreResultRef.current = false;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += `${text} `;
        else interimTranscript += text;
      }
      if (finalTranscript.trim()) latestFinalRef.current = finalTranscript.trim();
      latestInterimRef.current = interimTranscript;
      setInterim(interimTranscript || latestFinalRef.current);
    };
    recognition.onerror = (event) => {
      const message = speechErrorMessage(event.error);
      if (message) setNotice(message);
      if (event.error === "not-allowed" || event.error === "service-not-allowed" || event.error === "audio-capture") {
        ignoreResultRef.current = true;
      }
    };
    recognition.onend = () => {
      isTransmittingRef.current = false;
      setIsTransmitting(false);
      recognitionRef.current = null;
      if (!ignoreResultRef.current) processTranscript();
      ignoreResultRef.current = false;
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      isTransmittingRef.current = true;
      setIsTransmitting(true);
    } catch {
      isTransmittingRef.current = false;
      setIsTransmitting(false);
      recognitionRef.current = null;
      setNotice(speechErrorMessage("start-failed"));
    }
  };

  const toggleTransmission = () => {
    if (isTransmittingRef.current) stopTransmission();
    else startTransmission();
  };

  useEffect(() => {
    const typing = (event) => {
      const tag = event.target?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || event.target?.isContentEditable;
    };
    const onKeyDown = (event) => {
      if (event.code !== "Space" || event.repeat || typing(event)) return;
      event.preventDefault();
      startTransmission();
    };
    const onKeyUp = (event) => {
      if (event.code !== "Space" || typing(event)) return;
      event.preventDefault();
      stopTransmission();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <SpeechContext.Provider value={{
      supported,
      isTransmitting,
      interim,
      lastLog,
      notice,
      toggleTransmission,
    }}
    >
      {children}
    </SpeechContext.Provider>
  );
}

export function MicButton() {
  const { supported, isTransmitting, toggleTransmission } = useSpeech();
  return (
    <button
      type="button"
      className={`mic-btn${isTransmitting ? " listening" : ""}${supported ? "" : " unsupported"}`}
      data-testid="mic-button"
      data-coach="voice"
      data-listening={isTransmitting ? "true" : "false"}
      aria-pressed={isTransmitting}
      aria-label={supported ? "Tap to speak a clearance" : "Speech recognition is unavailable"}
      onClick={toggleTransmission}
      disabled={!supported}
    >
      <Mic className="mic-icon" aria-hidden="true" />
      {isTransmitting ? "STOP" : "TAP MIC"}
    </button>
  );
}

export function SpeechStatus() {
  const { supported, isTransmitting, interim, lastLog, notice } = useSpeech();
  return (
    <div className="voice-panel" data-testid="voice-panel" data-coach="voice-status">
      {!supported && <p className="voice-note">{unsupportedSpeechMessage()}</p>}
      {supported && isTransmitting && (
        <p className="voice-live">Listening: {interim ? `${interim}` : "speak a clearance"}</p>
      )}
      {notice && <p className="voice-note">{notice}</p>}
      {lastLog && (
        <>
          <p>Heard: {lastLog.transcript}</p>
          <p>Understood: {lastLog.understood || "not recognized"}</p>
          {lastLog.suggestion && <p className="miss">Try: {lastLog.suggestion}</p>}
        </>
      )}
      {supported && !isTransmitting && !notice && !lastLog && (
        <p>Mic ready</p>
      )}
    </div>
  );
}
