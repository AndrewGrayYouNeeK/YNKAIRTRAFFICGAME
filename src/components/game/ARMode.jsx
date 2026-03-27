import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, Crosshair, Zap } from "lucide-react";

export default function ARMode({ session, onUpdate }) {
  const canvasRef = useRef(null);
  const [ghosts, setGhosts] = useState([]);
  const [ammo, setAmmo] = useState(session.ammo);
  const [killed, setKilled] = useState(0);

  useEffect(() => {
    // Spawn ghosts for AR
    const spawnGhosts = () => {
      const newGhosts = Array.from({ length: 3 + session.current_wave }, (_, i) => ({
        id: `ar-ghost-${Date.now()}-${i}`,
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.6) + 100,
        type: ["Poltergeist", "Shadow Figure", "Intelligent Spirit", "Orb"][Math.floor(Math.random() * 4)],
        health: 30 + session.current_wave * 10,
      }));
      setGhosts(newGhosts);
    };
    spawnGhosts();
  }, [session.current_wave]);

  const shootGhost = (ghostId) => {
    if (ammo > 0) {
      setAmmo(ammo - 1);
      setGhosts((prev) => prev.filter((g) => g.id !== ghostId));
      setKilled(killed + 1);
      onUpdate({
        ammo: ammo - 1,
        ghosts_killed: session.ghosts_killed + 1,
        score: session.score + 100,
      });
    }
  };

  const exitAR = () => {
    onUpdate({
      game_mode: "strategy",
      ammo,
    });
  };

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-900/20 via-background to-background relative overflow-hidden">
      {/* AR Canvas */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-primary/5 opacity-30" />
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Crosshair className="w-12 h-12 text-primary/50 stroke-[0.5]" />
      </div>

      {/* Ghost Targets */}
      <AnimatePresence>
        {ghosts.map((ghost) => (
          <motion.button
            key={ghost.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            onClick={() => shootGhost(ghost.id)}
            style={{
              left: `${ghost.x}px`,
              top: `${ghost.y}px`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none group"
          >
            <div className="relative">
              {/* Ghost figure */}
              <div className="w-20 h-24 rounded-t-full border-2 border-red-500/60 bg-red-500/10 flex items-center justify-center relative group-hover:border-red-400 group-hover:bg-red-500/20 transition-all">
                <div className="w-3 h-3 rounded-full bg-red-400 absolute top-6" />
                <div className="w-3 h-3 rounded-full bg-red-400 absolute top-6 right-4" />
              </div>

              {/* Type label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-red-400 whitespace-nowrap">
                {ghost.type}
              </div>

              {/* Health bar */}
              <div className="w-20 h-1 bg-black/50 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 pointer-events-auto space-y-2">
          <div className="flex items-center justify-between">
            <div className="bg-black/50 border border-primary/50 rounded px-3 py-1.5 backdrop-blur-sm">
              <div className="text-[10px] font-mono text-muted-foreground">WAVE {session.current_wave}</div>
            </div>
            <Button
              onClick={exitAR}
              size="sm"
              variant="outline"
              className="font-mono text-xs gap-2"
            >
              <ChevronLeft className="w-3 h-3" /> EXIT AR
            </Button>
          </div>
        </div>

        {/* Right HUD */}
        <div className="absolute top-4 right-4 space-y-3 pointer-events-auto">
          {/* Ammo */}
          <div className="bg-black/50 border border-yellow-500/50 rounded px-4 py-3 backdrop-blur-sm text-center">
            <div className="text-[10px] font-mono text-yellow-400 mb-1">AMMO</div>
            <div className="text-2xl font-mono font-bold text-yellow-400">{ammo}</div>
          </div>

          {/* Killed count */}
          <div className="bg-black/50 border border-green-500/50 rounded px-4 py-3 backdrop-blur-sm text-center">
            <div className="text-[10px] font-mono text-green-400 mb-1">KILLED</div>
            <div className="text-2xl font-mono font-bold text-green-400">{killed}</div>
          </div>
        </div>

        {/* Bottom Instructions */}
        <div className="absolute bottom-4 left-4 right-4 bg-black/50 border border-primary/30 rounded px-4 py-2 backdrop-blur-sm">
          <div className="text-[10px] font-mono text-muted-foreground text-center">
            CLICK ON GHOSTS TO ELIMINATE • {ghosts.length} entities detected
          </div>
        </div>
      </div>

      {/* Game Over */}
      {ammo === 0 && ghosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto"
        >
          <div className="text-center space-y-4">
            <div className="text-3xl font-mono font-bold text-red-400">OUT OF AMMO!</div>
            <p className="text-sm text-muted-foreground">{killed} ghosts eliminated</p>
            <Button onClick={exitAR} className="font-mono">
              Return to Strategy
            </Button>
          </div>
        </motion.div>
      )}

      {ghosts.length === 0 && killed > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto"
        >
          <div className="text-center space-y-4">
            <div className="text-3xl font-mono font-bold text-green-400">WAVE CLEARED!</div>
            <p className="text-sm text-muted-foreground">{killed} ghosts eliminated</p>
            <Button
              onClick={() => {
                onUpdate({
                  game_mode: "strategy",
                  status: "between_waves",
                  ammo,
                });
              }}
              className="font-mono"
            >
              Regroup & Prepare
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}