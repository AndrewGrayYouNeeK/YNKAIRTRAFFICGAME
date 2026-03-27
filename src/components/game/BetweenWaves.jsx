import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Hammer, Lock, Zap, Shield, TrendingUp, Play } from "lucide-react";

export default function BetweenWaves({ session, onUpdate }) {
  const [wood, setWood] = useState(session.wood);
  const [nails, setNails] = useState(session.nails);
  const [ammo, setAmmo] = useState(session.ammo);
  const [health, setHealth] = useState(session.health);

  const addResource = (type, amount) => {
    if (type === "wood") setWood(wood + amount);
    if (type === "nails") setNails(nails + amount);
    if (type === "ammo") setAmmo(ammo + amount);
    if (type === "health") setHealth(Math.min(health + amount, session.max_health));
  };

  const startNextWave = () => {
    const nextWave = Math.min(session.current_wave + 1, session.total_waves);
    const isGameWon = nextWave > session.total_waves;

    onUpdate({
      current_wave: nextWave,
      status: isGameWon ? "won" : "active",
      wood,
      nails,
      ammo,
      health,
      game_mode: "strategy",
    });
  };

  const waveRewards = session.ghosts_killed * 50;

  return (
    <div className="w-full h-screen bg-gradient-to-br from-primary/5 via-background to-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-mono font-bold text-green-400">WAVE {session.current_wave} SURVIVED</h1>
          <p className="text-sm text-muted-foreground">Take as much time as you need to rebuild and strategize</p>
        </div>

        {/* Wave Stats */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">WAVE SUMMARY</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-mono font-bold text-green-400">{session.ghosts_killed}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">ELIMINATED</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-mono font-bold text-blue-400">{session.health}/{session.max_health}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">HEALTH REMAINING</div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-mono font-bold text-yellow-400">+{waveRewards}</div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">POINTS EARNED</div>
            </div>
          </div>
        </div>

        {/* Resource Management */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-mono text-xs font-semibold tracking-wider text-foreground/80 mb-4">REBUILD & RESTOCK</h2>

          <div className="space-y-4">
            {/* Wood */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hammer className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-mono">Wood Planks</span>
                </div>
                <span className="text-lg font-mono font-bold">{wood}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("wood", 5)}
                >
                  +5
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("wood", 10)}
                >
                  +10
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("wood", 20)}
                >
                  +20
                </Button>
              </div>
            </div>

            {/* Nails */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-mono">Nails</span>
                </div>
                <span className="text-lg font-mono font-bold">{nails}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("nails", 8)}
                >
                  +8
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("nails", 16)}
                >
                  +16
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("nails", 32)}
                >
                  +32
                </Button>
              </div>
            </div>

            {/* Ammo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-mono">Ammo</span>
                </div>
                <span className="text-lg font-mono font-bold">{ammo}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("ammo", 25)}
                >
                  +25
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("ammo", 50)}
                >
                  +50
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("ammo", 100)}
                >
                  +100
                </Button>
              </div>
            </div>

            {/* Health */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-mono">Structural Integrity</span>
                </div>
                <span className="text-lg font-mono font-bold">{health}/{session.max_health}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("health", 10)}
                >
                  +10
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("health", 25)}
                >
                  +25
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 font-mono text-xs"
                  onClick={() => addResource("health", 50)}
                >
                  +50
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Next Wave Info */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-mono text-sm font-semibold text-primary">
                Wave {Math.min(session.current_wave + 1, session.total_waves)} Incoming
              </p>
              <p className="text-xs text-muted-foreground">
                {session.current_wave === session.total_waves
                  ? "This is the final wave. Survive to win!"
                  : `Difficulty increases each wave. ${session.total_waves - session.current_wave} wave${session.total_waves - session.current_wave !== 1 ? "s" : ""} remaining.`}
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={startNextWave}
          size="lg"
          className="w-full font-mono text-base gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
        >
          <Play className="w-5 h-5" />
          {session.current_wave === session.total_waves ? "FINAL WAVE" : `WAVE ${Math.min(session.current_wave + 1, session.total_waves)}`}
        </Button>

        <p className="text-center text-[10px] font-mono text-muted-foreground">
          Take your time. No countdown. No rush. Just prepare.
        </p>
      </motion.div>
    </div>
  );
}