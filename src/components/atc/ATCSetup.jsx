import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { Plane, Globe } from "lucide-react";
import AirportSelector from "./AirportSelector";
import { useQuery } from "@tanstack/react-query";

export default function ATCSetup({ onSessionCreated }) {
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get total successful landings across all past sessions
  const { data: pastSessions = [] } = useQuery({
    queryKey: ["atc-past-sessions"],
    queryFn: () => api.entities.ATCSession.filter({ status: "completed" }),
  });

  const totalLandings = pastSessions.reduce((sum, s) => sum + (s.successful_landings || 0), 0);

  const startGame = async () => {
    if (!selectedAirport) return;
    setLoading(true);
    const session = await api.entities.ATCSession.create({
      status: "active",
      difficulty: selectedAirport.difficulty,
      level: selectedAirport.level,
      max_aircraft: selectedAirport.maxAircraft,
      airport_id: selectedAirport.id,
    });
    onSessionCreated({ ...session, airport: selectedAirport });
    setLoading(false);
  };

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="w-full max-w-4xl space-y-6 py-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Air Traffic Control</h1>
          <p className="text-sm text-muted-foreground font-mono">
            Choose your airport · Guide planes through live weather · Unlock new challenges
          </p>
        </div>

        {/* Airport selector */}
        <AirportSelector totalLandings={totalLandings} onSelect={setSelectedAirport} />

        {/* Start button */}
        {selectedAirport && (
          <div className="sticky bottom-4">
            <Button
              onClick={startGame}
              disabled={loading}
              size="lg"
              className="w-full font-mono text-sm gap-2 shadow-lg"
            >
              <Plane className="w-4 h-4" />
              {loading ? "Initializing..." : `Start Control — ${selectedAirport.id} ${selectedAirport.name}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}