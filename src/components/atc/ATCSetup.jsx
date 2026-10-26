import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { Plane, Globe } from "lucide-react";
import AirportSelector from "./AirportSelector";
import { useQuery } from "@tanstack/react-query";

export default function ATCSetup({
  onSessionCreated,
  showTutorialOffer = false,
  onStartTutorial,
  onDismissTutorial,
}) {
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get total successful landings across all past sessions
  const { data: pastSessions = [] } = useQuery({
    queryKey: ["atc-past-sessions"],
    queryFn: () => api.entities.ATCSession.list("-created_date", 200),
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
      successful_landings: 0,
      failed_landings: 0,
      emergencies_handled: 0,
      collisions: 0,
      separationViolations: 0,
      score: 0,
    });
    onSessionCreated({ ...session, airport: selectedAirport });
    setLoading(false);
  };

  return (
    <div className="atc-setup w-full h-full flex flex-col items-center justify-start p-6 overflow-y-auto">
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
          <Button type="button" variant="outline" data-testid="replay-tutorial" onClick={onStartTutorial}>
            Replay the guided mission
          </Button>
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
              data-testid="start-control"
              className="w-full font-mono text-sm gap-2 shadow-lg"
            >
              <Plane className="w-4 h-4" />
              {loading ? "Initializing..." : `Start Control — ${selectedAirport.id} ${selectedAirport.name}`}
            </Button>
          </div>
        )}
      </div>
      {showTutorialOffer && (
        <div className="modal-overlay" data-testid="tutorial-offer" style={{ zIndex: 1300 }}>
          <div className="modal">
            <h2>First time on the scope?</h2>
            <div className="briefing-content">
              <p>A short guided mission puts one slow arrival on the screen and walks you through the scope, the thumb buttons, typed clearances, and an optional radio call. You cannot fail it.</p>
            </div>
            <button type="button" className="btn-start" data-testid="tutorial-start" onClick={onStartTutorial}>
              START THE GUIDED MISSION
            </button>
            <button type="button" className="btn-shift" data-testid="tutorial-skip" onClick={onDismissTutorial} style={{ marginTop: 10 }}>
              SKIP FOR NOW
            </button>
          </div>
        </div>
      )}
    </div>
  );
}