import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function CasperBonusRound({ session, onUpdate, onComplete }) {
  const [casper, setCasper] = useState({
    x: Math.random() * (window.innerWidth - 100),
    y: Math.random() * (window.innerHeight * 0.6) + 100,
    isScary: false,
    health: 100,
  });
  const [traps, setTraps] = useState(session.traps);
  const [ammo, setAmmo] = useState(session.ammo);
  const [hits, setHits] = useState(0);
  const [showPhase, setShowPhase] = useState("friendly");

  // Casper friendly phase
  useEffect(() => {
    const friendlyTimer = setTimeout(() => {
      setCasper((prev) => ({ ...prev, isScary: true }));
      setShowPhase("scary");
    }, 3000);
    return () => clearTimeout(friendlyTimer);
  }, []);

  // Move Casper around when scary
  useEffect(() => {
    if (!casper.isScary) return;

    const moveInterval = setInterval(() => {
      setCasper((prev) => ({
        ...prev,
        x: Math.random() * (window.innerWidth - 100),
        y: Math.random() * (window.innerHeight * 0.6) + 100,
      }));
    }, 800);

    return () => clearInterval(moveInterval);
  }, [casper.isScary]);

  const shootCasper = () => {
    if (ammo > 0 && casper.isScary) {
      setAmmo(ammo - 1);
      const newHealth = casper.health - 20;
      setCasper((prev) => ({ ...prev, health: newHealth }));
      setHits(hits + 1);
    }
  };

  const trapCasper = () => {
    if (traps > 0 && casper.health <= 20) {
      setTraps(traps - 1);
      onUpdate({
        traps: traps - 1,
        ammo,
        bonus_round_active: false,
        ghosts_killed: session.ghosts_killed + 1,
        score: session.score + 500,
      });
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black to-black pointer-events-none" />

      {/* Friendly Phase */}
      <AnimatePresence>
        {showPhase === "friendly" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute text-center space-y-4 z-10"
          >
            <div className="text-4xl">👻</div>
            <h2 className="text-2xl font-mono font-bold text-white">Hi! I'm Casper!</h2>
            <p className="text-sm text-gray-300 font-mono">Be nice to me...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scary Phase */}
      <AnimatePresence>
        {showPhase === "scary" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute space-y-2 z-10"
            style={{ left: `${casper.x}px`, top: `${casper.y}px` }}
          >
            {/* Scary Casper */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3, repeat: casper.isScary ? Infinity : 0 }}
              className="text-5xl drop-shadow-lg cursor-crosshair"
              onClick={shootCasper}
            >
              👻
            </motion.div>

            {/* Health Bar */}
            <div className="w-20 h-2 bg-red-900 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500"
                animate={{ width: `${casper.health}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 pointer-events-auto space-y-2 z-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-mono font-bold text-red-500">CASPER BONUS ROUND</h1>
          <p className="text-xs font-mono text-gray-300 mt-1">
            {showPhase === "friendly"
              ? "Be nice to Casper... (3 seconds)"
              : "HE'S ANGRY! Damage him then trap him!"}
          </p>
        </motion.div>
      </div>

      {/* Controls */}
      {showPhase === "scary" && (
        <div className="absolute bottom-6 left-4 right-4 pointer-events-auto space-y-3 z-20">
          <div className="grid grid-cols-2 gap-4">
            {/* Ammo Counter */}
            <div className="bg-black/70 border border-yellow-500/50 rounded px-4 py-3 text-center">
              <div className="text-[10px] font-mono text-yellow-400 mb-1">AMMO</div>
              <div className="text-xl font-mono font-bold text-yellow-400">{ammo}</div>
            </div>

            {/* Trap Counter */}
            <div className="bg-black/70 border border-blue-500/50 rounded px-4 py-3 text-center">
              <div className="text-[10px] font-mono text-blue-400 mb-1">TRAPS</div>
              <div className="text-xl font-mono font-bold text-blue-400">{traps}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={shootCasper}
              disabled={ammo === 0}
              className="font-mono text-sm w-full"
            >
              SHOOT ({hits}/5)
            </Button>
            <Button
              onClick={trapCasper}
              disabled={traps === 0 || casper.health > 20}
              className="font-mono text-sm w-full bg-blue-600 hover:bg-blue-700"
            >
              {casper.health <= 20 ? "TRAP!" : "WEAKENING..."}
            </Button>
          </div>

          <p className="text-xs font-mono text-gray-400 text-center">
            {casper.health <= 20
              ? "✓ Casper is weakened! Use trap to capture him!"
              : "Shoot Casper 5 times to weaken him..."}
          </p>
        </div>
      )}

      {/* Game Over - Failed */}
      {showPhase === "scary" && ammo === 0 && casper.health > 20 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 flex items-center justify-center z-30"
        >
          <div className="text-center space-y-4">
            <div className="text-3xl">👻</div>
            <h2 className="text-2xl font-mono font-bold text-red-500">RAN OUT OF AMMO!</h2>
            <p className="text-sm text-gray-300">Casper got away...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}