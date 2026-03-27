import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ATCRadar from "../components/atc/ATCRadar";
import VoiceInput from "../components/atc/VoiceInput";
import AircraftPanel from "../components/atc/AircraftPanel";
import RadioLog from "../components/atc/RadioLog";
import ATCSetup from "../components/atc/ATCSetup";

export default function ATC() {
  const [session, setSession] = useState(null);
  const [listening, setListening] = useState(false);
  const [radioLog, setRadioLog] = useState([]);
  const queryClient = useQueryClient();

  // Fetch active session
  const { data: sessions } = useQuery({
    queryKey: ["atc-sessions"],
    queryFn: () => base44.entities.ATCSession.filter({ status: "active" }),
  });

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setSession(sessions[0]);
    }
  }, [sessions]);

  // Fetch aircraft for session
  const { data: aircraft = [] } = useQuery({
    queryKey: ["aircraft", session?.id],
    queryFn: () => (session ? base44.entities.Aircraft.filter({ session_id: session.id }) : []),
    enabled: !!session,
    refetchInterval: 500,
  });

  const updateSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.ATCSession.update(session.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["atc-sessions"] }),
  });

  const addRadioLogEntry = (pilot, message, type = "pilot") => {
    setRadioLog((prev) => [
      ...prev.slice(-20),
      {
        id: Date.now(),
        pilot,
        message,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleVoiceCommand = (transcript) => {
    addRadioLogEntry("Pilot", transcript, "pilot");
    
    // Simple command parsing
    if (transcript.toLowerCase().includes("cleared to land")) {
      addRadioLogEntry("ATC", "Roger, begin descent to 2000 feet", "atc");
    } else if (transcript.toLowerCase().includes("mayday")) {
      addRadioLogEntry("ATC", "Mayday received. Descend to 5000 feet immediately.", "atc");
    }
  };

  if (!session) {
    return <ATCSetup onSessionCreated={setSession} />;
  }

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-sm font-bold text-foreground">AIR TRAFFIC CONTROL</h2>
            <p className="text-[10px] text-muted-foreground">Level {session.level} • {session.difficulty.toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-card border border-border rounded px-3 py-1.5">
              <div className="text-[10px] font-mono text-muted-foreground">AIRCRAFT IN RANGE</div>
              <div className="text-lg font-mono font-bold text-primary">{aircraft.length}/{session.max_aircraft}</div>
            </div>
            <Button
              onClick={() => setListening(!listening)}
              size="sm"
              variant={listening ? "default" : "outline"}
              className="gap-2"
            >
              {listening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {listening ? "LISTENING" : "MUTED"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Radar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 flex flex-col">
          <div className="mb-3">
            <h3 className="font-mono text-xs font-semibold text-foreground/80">RADAR DISPLAY</h3>
          </div>
          <div className="flex-1">
            <ATCRadar aircraft={aircraft} />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">SCORE:</span>
              <span className="text-primary font-bold">{session.score}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">LANDINGS:</span>
              <span className="text-green-400">{session.successful_landings}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">FAILURES:</span>
              <span className="text-red-400">{session.failed_landings}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">EMERGENCIES:</span>
              <span className="text-yellow-400">{session.emergencies_handled}</span>
            </div>
          </div>

          {/* Aircraft List */}
          <div className="bg-card border border-border rounded-xl p-4 flex-1 overflow-y-auto">
            <h3 className="font-mono text-xs font-semibold text-foreground/80 mb-3">ACTIVE FLIGHTS</h3>
            <div className="space-y-2">
              {aircraft.map((plane) => (
                <AircraftPanel key={plane.id} aircraft={plane} session={session} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Radio Log & Voice Input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border-t border-border bg-card/50">
        <RadioLog entries={radioLog} />
        {listening && <VoiceInput onTranscript={handleVoiceCommand} />}
      </div>
    </div>
  );
}