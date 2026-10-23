import React, { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import parseATCCommand from "@/lib/voiceCommandParser";

const RecognitionClass =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function VoiceInput({
  onCommand,
  onTranscript,
  aircraft = [],
  selectedPlane = null,
  activeRunway = "",
}) {
  const recognitionRef = useRef(null);
  const isTransmittingRef = useRef(false);
  const latestInterimRef = useRef("");
  const latestFinalRef = useRef("");
  const aircraftRef = useRef(aircraft);
  const selectedRef = useRef(selectedPlane);
  const runwayRef = useRef(activeRunway);
  const onCommandRef = useRef(onCommand);
  const onTranscriptRef = useRef(onTranscript);
  aircraftRef.current = aircraft;
  selectedRef.current = selectedPlane;
  runwayRef.current = activeRunway;
  onCommandRef.current = onCommand;
  onTranscriptRef.current = onTranscript;
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [interim, setInterim] = useState("");
  const [lastLog, setLastLog] = useState(null);

  const playSquelchClick = (open = true) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const buffer = ctx.createBuffer(1, 800, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i += 1) {
      channelData[i] = (Math.random() * 2 - 1) * (1 - i / channelData.length);
    }
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = open ? 1800 : 1200;
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    src.buffer = buffer;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + 0.05);
  };

  const processTranscript = () => {
    const transcript = (latestFinalRef.current || latestInterimRef.current || "").trim();
    if (!transcript) return;
    const selected = selectedRef.current;
    const parsed = parseATCCommand(transcript, aircraftRef.current, selected, {
      runway: selected?.runway || runwayRef.current,
      callsign: selected?.callsign,
    });
    onTranscriptRef.current?.(transcript);
    onCommandRef.current?.(parsed.command, parsed);
    setLastLog({ transcript, ...parsed });
    setInterim("");
    latestInterimRef.current = "";
    latestFinalRef.current = "";
  };

  const startTransmission = () => {
    if (!RecognitionClass || isTransmittingRef.current) return;
    playSquelchClick(true);
    isTransmittingRef.current = true;
    setIsTransmitting(true);
    const recognition = new RecognitionClass();
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
      setInterim(interimTranscript);
    };
    recognition.onerror = () => {
      isTransmittingRef.current = false;
      setIsTransmitting(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopTransmission = () => {
    if (!isTransmittingRef.current) return;
    playSquelchClick(false);
    isTransmittingRef.current = false;
    recognitionRef.current?.stop();
    setIsTransmitting(false);
    processTranscript();
  };

  useEffect(() => {
    const typing = (event) => {
      const tag = event.target?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable;
    };
    const onKeyDown = (e) => {
      if (e.code !== "Space" || e.repeat || typing(e)) return;
      e.preventDefault();
      startTransmission();
    };
    const onKeyUp = (e) => {
      if (e.code !== "Space" || typing(e)) return;
      e.preventDefault();
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

  if (!RecognitionClass) {
    return (
      <div className="bg-black/80 border border-amber-500/40 rounded-xl p-4" data-coach="voice" data-testid="voice-panel">
        <p className="font-mono text-xs text-amber-300">Voice needs a microphone. Use the sliders or type a clearance. With a mic, hold PTT and you will see what was heard and how it was understood.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#061018] border border-green-500/40 rounded-xl p-4 space-y-3" data-coach="voice" data-testid="voice-panel">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs text-green-300">RADIO INPUT</h3>
        <div className={`font-mono text-[10px] ${isTransmitting ? "text-green-300" : "text-green-700"}`}>
          {isTransmitting ? "TRANSMITTING" : "STANDBY"}
        </div>
      </div>

      <button
        type="button"
        className={`w-full h-20 rounded-full border-2 font-mono font-bold text-lg flex items-center justify-center gap-2 transition ${
          isTransmitting
            ? "bg-green-500/30 border-green-300 text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.55)]"
            : "bg-green-900/20 border-green-700 text-green-300"
        }`}
        onMouseDown={startTransmission}
        onMouseUp={stopTransmission}
        onMouseLeave={stopTransmission}
        onTouchStart={(e) => {
          e.preventDefault();
          startTransmission();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopTransmission();
        }}
      >
        <Mic className="w-6 h-6" />
        PTT
      </button>

      {isTransmitting && (
        <div className="flex gap-1 h-5 items-end">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-green-400/80 w-1 rounded-sm animate-pulse"
              style={{ height: `${35 + ((i * 17) % 60)}%`, animationDelay: `${i * 0.06}s` }}
            />
          ))}
        </div>
      )}

      <div className="rounded-md border border-green-900 bg-black/70 p-2 min-h-14">
        <p className="font-mono text-[11px] text-green-300">
          {interim ? `${interim}...` : "Hold PTT (or Space) to transmit"}
        </p>
      </div>

      {lastLog && (
        <div className="rounded-md border border-green-700/60 bg-black/80 p-2 space-y-1">
          <p className="font-mono text-[11px] text-green-300">Heard: {lastLog.transcript}</p>
          <p className="font-mono text-[11px] text-green-200">
            Understood: {lastLog.understood || "not recognized"}
          </p>
          {lastLog.suggestion && (
            <p className="font-mono text-[11px] text-amber-300">Try: {lastLog.suggestion}</p>
          )}
          <p className={`font-mono text-[10px] ${lastLog.confidence < 0.6 ? "text-amber-300" : "text-green-300"}`}>
            {lastLog.confidence < 0.6 ? "SAY AGAIN" : "RECOGNIZED"} ({lastLog.confidence.toFixed(2)})
          </p>
        </div>
      )}
    </div>
  );
}