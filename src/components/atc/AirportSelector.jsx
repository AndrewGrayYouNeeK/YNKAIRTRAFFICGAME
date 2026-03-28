import React from "react";
import { motion } from "framer-motion";
import { Lock, Star, AlertTriangle } from "lucide-react";
import { AIRPORTS } from "../../lib/airports";

const difficultyColors = {
  easy:    "text-green-400 border-green-500/30 bg-green-500/10",
  medium:  "text-blue-400 border-blue-500/30 bg-blue-500/10",
  hard:    "text-orange-400 border-orange-500/30 bg-orange-500/10",
  expert:  "text-purple-400 border-purple-500/30 bg-purple-500/10",
  extreme: "text-red-400 border-red-500/30 bg-red-500/10",
};

export default function AirportSelector({ totalLandings = 0, onSelect }) {
  const unlockThresholds = [0, 5, 15, 30, 50];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground font-mono">SELECT AIRPORT</h2>
        <p className="text-xs text-muted-foreground mt-1">Total successful landings: {totalLandings}</p>
      </div>

      {AIRPORTS.map((airport, i) => {
        const isLocked = totalLandings < unlockThresholds[i];
        const needed = unlockThresholds[i] - totalLandings;

        return (
          <motion.button
            key={airport.id}
            disabled={isLocked}
            onClick={() => !isLocked && onSelect(airport)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`w-full text-left rounded-xl border p-4 transition-all ${
              isLocked
                ? "bg-card/30 border-border/40 opacity-50 cursor-not-allowed"
                : "bg-card border-border hover:border-primary/40 hover:bg-card/80 cursor-pointer"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Level badge */}
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : airport.special ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <span className="font-mono text-xs font-bold text-primary">L{airport.level}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-bold text-muted-foreground">{airport.id}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${difficultyColors[airport.difficulty]}`}>
                      {airport.difficulty.toUpperCase()}
                    </span>
                    {airport.special && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">
                        SPECIAL ENDORSEMENT
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{airport.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{airport.city} · {airport.elevation.toLocaleString()}ft elevation</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1">{airport.description}</div>
                  {airport.specialNote && (
                    <div className="text-[10px] text-red-400 mt-1 font-mono">{airport.specialNote}</div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                {isLocked ? (
                  <div className="text-[9px] font-mono text-muted-foreground">
                    {needed} more landing{needed !== 1 ? "s" : ""}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: airport.level }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                )}
                <div className="text-[9px] font-mono text-muted-foreground mt-1">
                  {airport.runways.join(" / ")}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}