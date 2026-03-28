import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ATCRadar from "../components/atc/ATCRadar";
import VoiceInput from "../components/atc/VoiceInput";
import AircraftPanel from "../components/atc/AircraftPanel";
import RadioLog from "../components/atc/RadioLog";
import ATCSetup from "../components/atc/ATCSetup";
import ATCSupervisor from "../components/atc/ATCSupervisor";
import WeatherMachine from "../components/atc/WeatherMachine";
import AirportMap from "../components/atc/AirportMap";
import { getAirport, AIRPORTS } from "../lib/airports";

export default function ATC() {
  const [session, setSession] = useState(null);
  const [airport, setAirport] = useState(null);
  const [listening, setListening] = useState(false);
  const [radioLog, setRadioLog] = useState([]);
  const [weatherIntensity, setWeatherIntensity] = useState(0);
  const [weatherEffects, setWeatherEffects] = useState(null);
  const queryClient = useQueryClient();

  // Fetch active session
  const { data: sessions } = useQuery({
    queryKey: ["atc-sessions"],
    queryFn: () => base44.entities.ATCSession.filter({ status: "active" }),
  });

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      const s = sessions[0];
      setSession(s);
      const ap = getAirport(s.airport_id) || AIRPORTS[0];
      setAirport(ap);
    }
  }, [sessions]);

  // Fetch aircraft for session
  const { data: aircraft = [] } = useQuery({
    queryKey: ["aircraft", session?.id],
    queryFn: () => (session ? base44.entities.Aircraft.filter({ session_id: session.id }) : []),
    enabled: !!session,
    refetchInterval: 500,
  });

  const addRadioLogEntry = (pilot, message, type = "pilot") => {
    setRadioLog((prev) => [
      ...prev.slice(-20),
      { id: Date.now(), pilot, message, type, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const handleVoiceCommand = (transcript) => {
    addRadioLogEntry("Pilot", transcript, "pilot");
    if (transcript.toLowerCase().includes("cleared to land")) {
      addRadioLogEntry("ATC", "Roger, begin descent to 2000 feet", "atc");
    } else if (transcript.toLowerCase().includes("mayday")) {
      addRadioLogEntry("ATC", "Mayday received. Descend to 5000 feet immediately.", "atc");
    }
  };

  const handleEndSession = async () => {
    if (!session) return;
    await base44.entities.ATCSession.update(session.id, { status: "completed" });
    setSession(null);
    setAirport(null);
    queryClient.invalidateQueries({ queryKey: ["atc-sessions"] });
    queryClient.invalidateQueries({ queryKey: ["atc-past-sessions"] });
  };

  const handleSessionCreated = ({ airport: ap, ...sess }) => {
    setSession(sess);
    setAirport(ap);
  };

  if (!session || !airport) {
    return <ATCSetup onSessionCreated={handleSessionCreated} />;
  }

  const skin = airport.skin;
  const isExtreme = airport.difficulty === "extreme";

  return (
    <div className={`w-full min-h-screen bg-background flex flex-col`}>
      {/* Airport skin header */}
      <div className={`bg-gradient-to-r ${skin.bg} border-b border-border p-4`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {isExtreme && <span className="text-red-400 text-xs font-mono font-bold animate-pulse">⚠ EXTREME</span>}
              <h2 className="font-mono text-sm font-bold text-foreground">
                {airport.id} — {airport.name}
              </h2>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Level {airport.level} · {airport.difficulty.toUpperCase()} · {airport.city} · {airport.elevation.toLocaleString()}ft elevation
            </p>
            {airport.specialNote && (
              <p className="text-[10px] text-red-400 font-mono mt-0.5">{airport.specialNote}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-black/30 border border-border/50 rounded px-3 py-1.5">
              <div className="text-[10px] font-mono text-muted-foreground">AIRCRAFT</div>
              <div className="text-lg font-mono font-bold text-primary">{aircraft.length}/{session.max_aircraft}</div>
            </div>
            {weatherEffects && (
              <div className={`bg-black/30 border rounded px-3 py-1.5 ${weatherEffects.lowVis ? "border-red-500/50" : "border-border/50"}`}>
                <div className="text-[10px] font-mono text-muted-foreground">VIS</div>
                <div className={`text-lg font-mono font-bold ${weatherEffects.lowVis ? "text-red-400" : "text-green-400"}`}>
                  {weatherEffects.visibility?.toFixed(1)}nm
                </div>
              </div>
            )}
            <Button
              onClick={() => setListening(!listening)}
              size="sm"
              variant={listening ? "default" : "outline"}
              className="gap-2"
            >
              {listening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {listening ? "LISTENING" : "MUTED"}
            </Button>
            <Button onClick={handleEndSession} size="sm" variant="ghost" className="gap-1 text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 p-4 overflow-auto">
        {/* Radar — col-span 2 */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-4 flex flex-col min-h-[400px]">
          <h3 className="font-mono text-xs font-semibold text-foreground/80 mb-3">RADAR DISPLAY</h3>
          <div className="flex-1">
            <ATCRadar aircraft={aircraft} airport={airport} weatherEffects={weatherEffects} />
          </div>
        </div>

        {/* Satellite map */}
        <div className="xl:col-span-2 bg-card border border-border rounded-xl p-4 flex flex-col min-h-[400px]">
          <h3 className="font-mono text-xs font-semibold text-foreground/80 mb-3">SATELLITE VIEW</h3>
          <div className="flex-1 rounded-lg overflow-hidden">
            <AirportMap airport={airport} aircraft={aircraft} weatherEffects={weatherEffects} />
          </div>
        </div>

        {/* Stats + active flights */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <p className="font-mono text-xs text-muted-foreground mb-1">SESSION STATS</p>
            {[
              ["SCORE",       session.score,               "text-primary"],
              ["LANDINGS",    session.successful_landings,  "text-green-400"],
              ["FAILURES",    session.failed_landings,      "text-red-400"],
              ["EMERGENCIES", session.emergencies_handled,  "text-yellow-400"],
            ].map(([label, val, color]) => (
              <div key={label} className="flex justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">{label}:</span>
                <span className={color}>{val}</span>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 overflow-y-auto max-h-64">
            <h3 className="font-mono text-xs font-semibold text-foreground/80 mb-3">ACTIVE FLIGHTS</h3>
            <div className="space-y-2">
              {aircraft.map((plane) => (
                <AircraftPanel key={plane.id} aircraft={plane} session={session} />
              ))}
              {aircraft.length === 0 && (
                <p className="text-[10px] text-muted-foreground font-mono">No aircraft on scope</p>
              )}
            </div>
          </div>
        </div>

        {/* Weather machine */}
        <div className="xl:col-span-1">
          <WeatherMachine
            airport={airport}
            weatherIntensity={weatherIntensity}
            onIntensityChange={setWeatherIntensity}
            onWeatherUpdate={setWeatherEffects}
          />
        </div>

        {/* Radio log + voice + supervisor */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RadioLog entries={radioLog} />
          {listening ? (
            <VoiceInput onTranscript={handleVoiceCommand} />
          ) : (
            <ATCSupervisor session={session} />
          )}
        </div>

        {/* Supervisor if voice is on */}
        {listening && (
          <div className="xl:col-span-2">
            <ATCSupervisor session={session} />
          </div>
        )}
      </div>
    </div>
  );
}