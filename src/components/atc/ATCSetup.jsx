import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Plane } from "lucide-react";

export default function ATCSetup({ onSessionCreated }) {
  const [difficulty, setDifficulty] = useState("easy");
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    const maxAircraft = difficulty === "easy" ? 3 : difficulty === "medium" ? 6 : 10;
    const session = await base44.entities.ATCSession.create({
      status: "active",
      difficulty,
      level: 1,
      max_aircraft: maxAircraft,
    });
    onSessionCreated(session);
    setLoading(false);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
          <Plane className="w-8 h-8 text-primary" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Air Traffic Control</h1>
          <p className="text-sm text-muted-foreground font-mono">Guide aircraft to safe landings using voice commands</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Select difficulty level:</p>
          <div className="grid grid-cols-3 gap-2">
            {["easy", "medium", "hard"].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`py-2 rounded-lg font-mono text-xs transition-all ${
                  difficulty === level
                    ? "bg-primary text-primary-foreground border border-primary"
                    : "bg-secondary border border-border hover:bg-secondary/80"
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {difficulty === "easy"
              ? "3 aircraft max • No emergencies"
              : difficulty === "medium"
              ? "6 aircraft max • Random emergencies"
              : "10 aircraft max • Complex scenarios"}
          </p>
        </div>

        <Button
          onClick={startGame}
          disabled={loading}
          size="lg"
          className="w-full font-mono text-sm gap-2"
        >
          <Plane className="w-4 h-4" />
          {loading ? "Starting..." : "START CONTROL"}
        </Button>

        <p className="text-[10px] text-muted-foreground">
          Use voice commands to control aircraft • Guide them to landing safely
        </p>
      </div>
    </div>
  );
}