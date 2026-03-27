import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Shield, Play } from "lucide-react";

export default function MultiplayerLobby({ onStartGame, onJoinGame }) {
  const { data: activeSessions = [] } = useQuery({
    queryKey: ["active-game-sessions"],
    queryFn: () => base44.entities.GameSession.filter({ status: "active" }, "-created_date", 20),
    refetchInterval: 2000,
  });

  return (
    <div className="w-full h-screen bg-gradient-to-br from-background via-card to-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Paranormal Defense</h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono">Join or start a multiplayer survival game</p>
        </div>

        {/* Active Games */}
        {activeSessions.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">ACTIVE GAMES ({activeSessions.length})</h2>
            <div className="space-y-2">
              <AnimatePresence>
                {activeSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-secondary/30 border border-border/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="font-mono text-sm font-semibold">Wave {session.current_wave}/{session.total_waves}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {session.player_lat?.toFixed(3)}, {session.player_lng?.toFixed(3)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs font-mono ml-4">
                        <div className="text-center">
                          <div className="text-muted-foreground">Health</div>
                          <div className="font-bold">{session.health}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-muted-foreground">Score</div>
                          <div className="font-bold text-primary">{session.score}</div>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => onJoinGame(session)}
                      size="sm"
                      className="font-mono text-xs"
                    >
                      JOIN
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* New Game */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 space-y-4">
          <h2 className="font-mono text-xs font-semibold tracking-wider text-primary">START NEW GAME</h2>
          <p className="text-sm text-muted-foreground">Create a new multiplayer game at your location. Other players can join and defend together.</p>
          <Button
            onClick={onStartGame}
            size="lg"
            className="w-full font-mono text-base gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
          >
            <Play className="w-5 h-5" />
            START NEW GAME
          </Button>
        </div>

        <p className="text-center text-[10px] font-mono text-muted-foreground">
          Players defend their own locations but face shared ghost waves
        </p>
      </motion.div>
    </div>
  );
}