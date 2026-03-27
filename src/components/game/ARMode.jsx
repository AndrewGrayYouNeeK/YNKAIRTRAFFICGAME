import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Eye, ChevronLeft, Crosshair, Zap, Users, Zap as ZapIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useGameSync } from "../../hooks/useGameSync";
import CasperBonusRound from "./CasperBonusRound";
import PowerUp from "./PowerUp";
import { GHOST_TYPES, playSound, getDifficultyScaling, playBackgroundMusic, stopBackgroundMusic } from "../../lib/gameConfig";
import SoundControls from "./SoundControls";

export default function ARMode({ session, onUpdate }) {
  useGameSync(session.id);
  const canvasRef = useRef(null);
  const [ghosts, setGhosts] = useState([]);
  const [ammo, setAmmo] = useState(session.ammo);
  const [protonBeams, setProtonBeams] = useState(session.proton_beams);
  const [killed, setKilled] = useState(0);
  const [beamActive, setBeamActive] = useState(false);
  const [beamTarget, setBeamTarget] = useState(null);
  const [casperActive, setCasperActive] = useState(session.bonus_round_active || false);
  const [powerUps, setPowerUps] = useState([]);
  const [activePowerUp, setActivePowerUp] = useState(null);

  // Fetch other players in session
  const { data: participants = [] } = useQuery({
    queryKey: ["game-participants", session.id],
    queryFn: () => base44.entities.GameSessionParticipant.filter({ session_id: session.id }),
    refetchInterval: 2000,
  });

  useEffect(() => {
    playBackgroundMusic("ar", 0.3);
    return () => stopBackgroundMusic();
  }, []);

  useEffect(() => {
    // Spawn Casper bonus round randomly (20% chance after wave 1)
    if (session.current_wave > 1 && Math.random() < 0.2 && !casperActive) {
      playSound("casper", 0.2);
      setCasperActive(true);
      return;
    }

    // Spawn ghosts for AR with difficulty scaling
    const spawnGhosts = () => {
      playSound("wave_start", 0.15);
      const difficulty = getDifficultyScaling(session.current_wave);
      const ghostTypeKeys = Object.keys(GHOST_TYPES);
      
      const newGhosts = Array.from({ length: difficulty.ghostCount }, (_, i) => {
        const typeKey = ghostTypeKeys[Math.floor(Math.random() * ghostTypeKeys.length)];
        const ghostType = GHOST_TYPES[typeKey];
        return {
          id: `ar-ghost-${Date.now()}-${i}`,
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight * 0.6) + 100,
          type: ghostType.name,
          typeKey,
          health: ghostType.health * difficulty.healthMultiplier,
          maxHealth: ghostType.health * difficulty.healthMultiplier,
        };
      });
      setGhosts(newGhosts);
    };
    
    if (!casperActive) {
      spawnGhosts();
    }
  }, [session.current_wave, casperActive]);

  const shootGhost = (ghostId) => {
    if (ammo > 0) {
      playSound("shoot");
      setAmmo(ammo - 1);
      setGhosts((prev) => prev.filter((g) => g.id !== ghostId));
      setKilled(killed + 1);
      
      // Random power-up drop
      if (Math.random() < 0.15) {
        const types = ["shield", "double_damage", "slow_motion"];
        setPowerUps((prev) => [...prev, {
          id: `powerup-${Date.now()}`,
          type: types[Math.floor(Math.random() * types.length)],
          x: Math.random() * window.innerWidth,
          y: Math.random() * (window.innerHeight * 0.6) + 100,
        }]);
      }

      const scoreBonus = activePowerUp === "double_damage" ? 200 : 100;
      onUpdate({
        ammo: ammo - 1,
        ghosts_killed: session.ghosts_killed + 1,
        score: session.score + scoreBonus,
      });
    }
  };

  const handlePowerUpCollect = (type) => {
    if (!type) return;
    playSound("powerup");
    setActivePowerUp(type);
    
    let duration = 8000;
    if (type === "double_damage") duration = 8000;
    else if (type === "slow_motion") duration = 6000;
    else if (type === "shield") duration = 10000;

    setTimeout(() => setActivePowerUp(null), duration);
  };

  const activateProtonBeam = () => {
    if (protonBeams > 0) {
      playSound("kill");
      setBeamActive(true);
      setProtonBeams(protonBeams - 1);
      
      // Eliminate all ghosts in beam
      const killedCount = ghosts.length;
      setGhosts([]);
      setKilled(killed + killedCount);
      
      const scoreBonus = activePowerUp === "double_damage" ? killedCount * 400 : killedCount * 200;
      onUpdate({
        proton_beams: protonBeams - 1,
        ghosts_killed: session.ghosts_killed + killedCount,
        score: session.score + scoreBonus,
      });

      // Beam effect for 1.5 seconds
      setTimeout(() => setBeamActive(false), 1500);
    }
  };

  const exitAR = () => {
    onUpdate({
      game_mode: "strategy",
      ammo,
    });
  };

  if (casperActive) {
    return (
      <CasperBonusRound
        session={session}
        onUpdate={(data) => onUpdate(data)}
        onComplete={() => setCasperActive(false)}
      />
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-900/20 via-background to-background relative overflow-hidden">
      {/* AR Canvas */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-primary/5 opacity-30" />
        
        {/* Proton Beam Effect */}
        {beamActive && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-full bg-gradient-to-b from-cyan-400 via-blue-500 to-transparent opacity-60 blur-xl"
          />
        )}
      </div>

      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Crosshair className="w-12 h-12 text-primary/50 stroke-[0.5]" />
      </div>

      {/* Power-ups */}
      <AnimatePresence>
        {powerUps.map((pu) => (
          <PowerUp key={pu.id} x={pu.x} y={pu.y} type={pu.type} onCollect={handlePowerUpCollect} />
        ))}
      </AnimatePresence>

      {/* Ghost Targets */}
      <AnimatePresence>
        {ghosts.map((ghost) => {
          const ghostTypeColor = {
            red: "border-red-500/60 bg-red-500/10",
            purple: "border-purple-500/60 bg-purple-500/10",
            blue: "border-blue-500/60 bg-blue-500/10",
            yellow: "border-yellow-500/60 bg-yellow-500/10",
          };
          return (
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
                <div className={`w-20 h-24 rounded-t-full border-2 ${ghostTypeColor[GHOST_TYPES[ghost.typeKey].color] || "border-red-500/60 bg-red-500/10"} flex items-center justify-center relative group-hover:opacity-80 transition-all`}>
                  <div className="text-2xl">{GHOST_TYPES[ghost.typeKey].emoji}</div>
                </div>

                {/* Type label */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-400 whitespace-nowrap">
                  {ghost.type}
                </div>

                {/* Health bar */}
                <div className="w-20 h-1 bg-black/50 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${(ghost.health / ghost.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Sound Controls */}
      <SoundControls />

      {/* HUD */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 pointer-events-auto space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="bg-black/50 border border-primary/50 rounded px-3 py-1.5 backdrop-blur-sm">
              <div className="text-[10px] font-mono text-muted-foreground">WAVE {session.current_wave}</div>
            </div>
            {participants.length > 0 && (
              <div className="bg-black/50 border border-primary/50 rounded px-3 py-1.5 backdrop-blur-sm flex items-center gap-1.5">
                <Users className="w-3 h-3 text-primary" />
                <div className="text-[10px] font-mono text-primary">{participants.length} defending</div>
              </div>
            )}
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

          {/* Proton Pack */}
          <div>
            <button
              onClick={activateProtonBeam}
              disabled={protonBeams < 1 || beamActive}
              className="w-full bg-gradient-to-b from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-cyan-400 rounded px-4 py-3 transition-all"
            >
              <div className="text-[10px] font-mono text-white mb-1">PROTON PACK</div>
              <div className="text-xl font-mono font-bold text-cyan-300">{protonBeams}</div>
            </button>
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
            {activePowerUp && <span className="ml-2 text-yellow-400">⚡ {activePowerUp.toUpperCase()} ACTIVE</span>}
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