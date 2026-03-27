import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Eye, Hammer, Lock, Zap, Users, Flame } from "lucide-react";
import RadarDisplay from "../radar/RadarDisplay";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useGameSync } from "../../hooks/useGameSync";

export default function StrategyMode({ session, onUpdate }) {
  useGameSync(session.id);
  const [scanAngle, setScanAngle] = useState(0);
  const [ghosts, setGhosts] = useState([]);
  const [selectingMortarTarget, setSelectingMortarTarget] = useState(false);

  // Fetch other players in session
  const { data: participants = [] } = useQuery({
    queryKey: ["game-participants", session.id],
    queryFn: () => base44.entities.GameSessionParticipant.filter({ session_id: session.id }),
    refetchInterval: 2000,
  });

  useEffect(() => {
    const interval = setInterval(() => setScanAngle((prev) => (prev + 1.5) % 360), 50);
    return () => clearInterval(interval);
  }, []);

  // Simulate ghost spawns
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const newGhost = {
        id: `ghost-${Date.now()}`,
        distance: 500 + Math.random() * 300,
        bearing: Math.random() * 360,
        type: ["Poltergeist", "Shadow Figure", "Intelligent Spirit"][Math.floor(Math.random() * 3)],
        health: 100,
      };
      setGhosts((prev) => [...prev.slice(-10), newGhost]);
    }, 3000);
    return () => clearInterval(spawnInterval);
  }, []);

  const boardWindow = () => {
    if (session.wood >= 5) {
      onUpdate({
        wood: session.wood - 5,
        windows_boarded: session.windows_boarded + 1,
      });
    }
  };

  const boardDoor = () => {
    if (session.nails >= 8) {
      onUpdate({
        nails: session.nails - 8,
        doors_boarded: session.doors_boarded + 1,
      });
    }
  };

  const switchToAR = () => {
    onUpdate({ game_mode: "ar" });
  };

  const handleMortarStrike = (e) => {
    if (!selectingMortarTarget) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const blastRadius = 100;
    
    const killedGhosts = ghosts.filter(ghost => {
      const ghostDistance = Math.hypot(ghost.x - x, ghost.y - y);
      return ghostDistance < blastRadius;
    }).length;
    
    onUpdate({
      mortars: session.mortars - 1,
      ghosts_killed: session.ghosts_killed + killedGhosts,
      score: session.score + killedGhosts * 120,
    });
    
    setGhosts(prev => prev.filter(ghost => {
      const ghostDistance = Math.hypot(ghost.x - x, ghost.y - y);
      return ghostDistance >= blastRadius;
    }));
    
    setSelectingMortarTarget(false);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-sm font-bold text-foreground">STRATEGY MODE</h2>
            <p className="text-[10px] text-muted-foreground">Wave {session.current_wave}/{session.total_waves}</p>
          </div>
          <div className="flex items-center gap-3">
            {participants.length > 0 && (
              <div className="flex items-center gap-1.5 bg-primary/20 px-3 py-1.5 rounded-lg">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono text-primary">{participants.length} players</span>
              </div>
            )}
            <Button
              onClick={switchToAR}
              size="sm"
              className="font-mono text-xs gap-2 bg-primary/20 hover:bg-primary/30"
            >
              <Eye className="w-3.5 h-3.5" /> ENTER AR
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        {/* Radar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">RADAR SCAN</h3>
            {selectingMortarTarget && <span className="text-[10px] font-mono text-orange-400 animate-pulse">TARGETING MODE</span>}
          </div>
          <div className="flex-1 cursor-crosshair" onClick={handleMortarStrike}>
            <RadarDisplay drones={ghosts} scanAngle={scanAngle} />
          </div>
        </div>

        {/* Resources & Actions */}
        <div className="space-y-4">
          {/* Health */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-muted-foreground mb-2">STRUCTURAL INTEGRITY</div>
            <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all"
                style={{ width: `${(session.health / session.max_health) * 100}%` }}
              />
            </div>
            <div className="text-xs font-mono mt-2">{session.health}/{session.max_health}</div>
          </div>

          {/* Resources */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[10px] font-mono text-muted-foreground">WOOD</span>
                </div>
                <span className="text-xs font-mono font-bold">{session.wood}</span>
              </div>
              <Button
                onClick={boardWindow}
                disabled={session.wood < 5}
                size="sm"
                className="w-full font-mono text-[10px]"
              >
                Board Window (-5)
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px] font-mono text-muted-foreground">NAILS</span>
                </div>
                <span className="text-xs font-mono font-bold">{session.nails}</span>
              </div>
              <Button
                onClick={boardDoor}
                disabled={session.nails < 8}
                size="sm"
                className="w-full font-mono text-[10px]"
              >
                Board Door (-8)
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-[10px] font-mono text-muted-foreground">AMMO</span>
                </div>
                <span className="text-xs font-mono font-bold">{session.ammo}</span>
              </div>
              <p className="text-[9px] text-muted-foreground italic">Used in AR mode</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[10px] font-mono text-muted-foreground">MORTARS</span>
                </div>
                <span className="text-xs font-mono font-bold">{session.mortars}</span>
              </div>
              <Button
                onClick={() => setSelectingMortarTarget(!selectingMortarTarget)}
                disabled={session.mortars < 1}
                size="sm"
                variant={selectingMortarTarget ? "default" : "outline"}
                className="w-full font-mono text-[10px] bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/50"
              >
                {selectingMortarTarget ? "TARGETING..." : "FIRE MORTAR"}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">WINDOWS BOARDED:</span>
              <span>{session.windows_boarded}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">DOORS BOARDED:</span>
              <span>{session.doors_boarded}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">GHOSTS KILLED:</span>
              <span className="text-green-400">{session.ghosts_killed}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono pt-2 border-t border-border">
              <span className="text-muted-foreground">SCORE:</span>
              <span className="font-bold text-primary">{session.score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-card/50 text-center text-[10px] font-mono text-muted-foreground">
        Strategy Phase: Board up your location. Use AR mode to identify and eliminate ghosts.
      </div>
    </div>
  );
}