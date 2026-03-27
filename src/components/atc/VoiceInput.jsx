import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";

export default function VoiceInput({ onTranscript }) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not available");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "en-US";

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => {
      setIsListening(false);
      setInterim("");
    };

    recognitionRef.current.onresult = (event) => {
      let interim_transcript = "";
      let final_transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final_transcript += transcript + " ";
        } else {
          interim_transcript += transcript;
        }
      }

      setInterim(interim_transcript);

      if (final_transcript) {
        onTranscript(final_transcript.trim());
        setInterim("");
      }
    };

    recognitionRef.current.start();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {isListening ? (
          <Mic className="w-4 h-4 text-green-400 animate-pulse" />
        ) : (
          <MicOff className="w-4 h-4 text-muted-foreground" />
        )}
        <h3 className="font-mono text-xs font-semibold text-foreground/80">VOICE CONTROL</h3>
      </div>
      <div className="bg-black/30 rounded p-2 min-h-12">
        {interim ? (
          <p className="text-xs font-mono text-yellow-400">{interim}...</p>
        ) : (
          <p className="text-xs font-mono text-muted-foreground">
            {isListening ? "Listening..." : "Waiting for input..."}
          </p>
        )}
      </div>
    </div>
  );
}