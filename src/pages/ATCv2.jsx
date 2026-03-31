import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AtcRadarV2 from "../components/atc/AtcRadarV2";
import ControlPanel from "../components/atc/ControlPanel";
import AltitudeLadder from "../components/atc/AltitudeLadder";
import ATCSetup from "../components/atc/ATCSetup";
import { updateAircraftPhysics, calculateTrajectory } from "../lib/atcPhysics";
import { generateEmergency, applyEmergencyEffects } from "../lib/emergencySystem";
import { sounds, speakText, vibrate } from "../lib/audioManager";
import { calculateScore } from "../lib/scoringEngine";
import { getAirport } from "../lib/airports";

const GAME_STATE = {
  SETUP: "setup",
  BRIEFING: "briefing",
  ACTIVE: "active",
  PAUSED: "paused",
  GAMEOVER: "gameover",
};

const ATC_STYLES = `
.atc-v2-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: monospace;
  color: #00d4ff;
}

.atc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 2px solid rgba(0, 212, 255, 0.2);
  background: rgba(10, 25, 41, 0.9);
  flex-wrap: wrap;
  gap: 20px;
}

.header-left,
.header-right {
  display: flex;
  gap: 16px;
  align-items: center;
}

.airport-name {
  font-size: 24px;
  font-weight: bold;
  color: #00ff88;
  margin: 0;
}

.wind-indicator {
  display: flex;
  flex-direction: column;
  font-size: 11px;
}

.wind-indicator .value {
  color: #ffaa00;
  font-weight: bold;
}

.header-center {
  display: flex;
  gap: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 4px;
}

.stat .label {
  font-size: 9px;
  color: rgba(0, 212, 255, 0.6);
}

.stat .value {
  font-size: 18px;
  font-weight: bold;
  color: #00ff88;
}

.btn-pause {
  padding: 8px 16px;
  background: rgba(255, 170, 0, 0.1);
  border: 1px solid #ffaa00;
  border-radius: 4px;
  color: #ffaa00;
  font-family: monospace;
  font-weight: bold;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pause:hover {
  background: rgba(255, 170, 0, 0.2);
  box-shadow: 0 0 12px rgba(255, 170, 0, 0.4);
}

.atc-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  padding: 16px;
  flex: 1;
  overflow: hidden;
}

.radar-section {
  display: grid;
  grid-template-columns: 1fr 60px;
  gap: 12px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.emergency-alert {
  background: rgba(255, 0, 0, 0.15);
  border: 2px solid #ff0000;
  border-radius: 6px;
  padding: 12px;
  animation: pulse 1s infinite;
}

.alert-title {
  font-weight: bold;
  color: #ff6666;
  font-size: 12px;
  margin-bottom: 6px;
}

.emergency-alert p {
  font-size: 11px;
  color: #ffcccc;
  margin: 0;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 0, 0, 0.5); }
  50% { box-shadow: 0 0 12px rgba(255, 0, 0, 0.5); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
  border: 2px solid #00d4ff;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
  text-align: center;
}

.modal h2 {
  color: #00ff88;
  margin-top: 0;
  font-size: 20px;
}

.briefing-content {
  text-align: left;
  font-size: 12px;
  margin: 16px 0;
  line-height: 1.6;
  flex: 1;
  overflow-y: auto;
}

.briefing-content p {
  margin: 6px 0;
}

.wind-info {
  color: #ffaa00;
  font-weight: bold;
  margin-top: 12px;
}

.btn-start {
  margin-top: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  border: none;
  border-radius: 6px;
  color: #0a1929;
  font-family: monospace;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-start:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.6);
}

@media (max-width: 1024px) {
  .atc-grid {
    grid-template-columns: 1fr;
  }

  .header-center {
    gap: 12px;
  }

  .stat .value {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .atc-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .radar-section {
    grid-template-columns: 1fr;
  }

  .atc-grid {
    grid-template-columns: 1fr;
  }

  .airport-name {
    font-size: 18px;
  }

  .stat .value {
    font-size: 12px;
  }
}
`;

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = ATC_STYLES;
  document.head.appendChild(styleEl);
}

export default function ATCv2() {
  const [gameState, setGameState] = useState(GAME_STATE.SETUP);
  const [session, setSession] = useState(null);
  const [airport, setAirport] = useState(null);
  const [aircraft, setAircraft] = useState([]);
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [wind, setWind] = useState({ direction: 270, speed: 15 });
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [emergency, setEmergency] = useState(null);

  const queryClient = useQueryClient();
  const gameLoopRef = useRef();
  const timeRef = useRef(0);
  const aircraftCountRef = useRef(0);

  // Core game loop
  useEffect(() => {
    if (gameState !== GAME_STATE.ACTIVE || !session) return;

    const gameLoop = () => {
      setAircraft((prevAircraft) => {
        let updated = prevAircraft.map((plane) =>
          updateAircraftPhysics(plane, wind, prevAircraft)
        );

        // Check for landings
        updated = updated.map((plane) => {
          if (
            plane.status === "final" &&
            plane.x < 1 &&
            plane.x > -1 &&
            plane.y < 1 &&
            plane.y > -1 &&
            plane.altitude < 500
          ) {
            sounds.landed();
            speakText(`${plane.callsign} landed.`);
            setScore((s) => s + 100);
            return { ...plane, status: "landed" };
          }
          return plane;
        });

        // Add new aircraft periodically
        timeRef.current += 1;
        if (timeRef.current % 120 === 0 && updated.length < session.max_aircraft) {
          const newPlane = generateRandomPlane(aircraftCountRef.current++);
          updated.push(newPlane);
          sounds.planeContact();
          speakText(`${newPlane.callsign} contact approach.`);
        }

        // Check for emergencies
        if (Math.random() < 0.001 && !emergency) {
          const em = generateEmergency(updated.length);
          if (em) {
            const plane = updated[Math.floor(Math.random() * updated.length)];
            if (plane) {
              setEmergency(em);
              sounds.emergencyAlert();
              speakText(em.message, 0.8);
              vibrate([200, 100, 200]);
              updated = updated.map((p) =>
                p.id === plane.id ? { ...p, emergency: em } : p
              );
            }
          }
        }

        // Calculate trajectories
        updated = updated.map((plane) => ({
          ...plane,
          trajectory: calculateTrajectory(plane, wind),
        }));

        return updated;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, session, wind, emergency]);

  // Timer
  useEffect(() => {
    if (gameState !== GAME_STATE.ACTIVE) return;
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleSessionCreated = ({ airport: ap, ...sess }) => {
    setSession(sess);
    setAirport(ap);
    setGameState(GAME_STATE.BRIEFING);
  };

  const startGame = () => {
    setAircraft([generateRandomPlane(0)]);
    aircraftCountRef.current = 1;
    timeRef.current = 0;
    setTime(0);
    setScore(0);
    setGameState(GAME_STATE.ACTIVE);
  };

  const handleCommand = (cmd) => {
    if (!selectedPlane) return;

    switch (cmd.type) {
      case "set_speed":
        setAircraft((prev) =>
          prev.map((p) =>
            p.id === selectedPlane.id ? { ...p, desiredSpeed: cmd.value } : p
          )
        );
        sounds.headingLock();
        speakText(`${selectedPlane.callsign}, descend to ${cmd.value} knots.`);
        break;

      case "set_altitude":
        setAircraft((prev) =>
          prev.map((p) =>
            p.id === selectedPlane.id ? { ...p, desiredAltitude: cmd.value } : p
          )
        );
        sounds.headingLock();
        speakText(`${selectedPlane.callsign}, climb to flight level ${Math.round(cmd.value / 100)}.`);
        break;

      case "go_around":
        setAircraft((prev) =>
          prev.map((p) =>
            p.id === selectedPlane.id
              ? { ...p, status: "approach", desiredAltitude: 2000 }
              : p
          )
        );
        sounds.warningBeep();
        speakText(`${selectedPlane.callsign}, go around, climb to 2000 feet.`);
        break;
    }
  };

  if (gameState === GAME_STATE.SETUP) {
    return <ATCSetup onSessionCreated={handleSessionCreated} />;
  }

  return (
    <div className="atc-v2-container">
      {/* Header */}
      <motion.div className="atc-header" initial={{ y: -20 }} animate={{ y: 0 }}>
        <div className="header-left">
          <h1 className="airport-name">{airport?.id}</h1>
          <div className="wind-indicator">
            <span>WND</span>
            <span className="value">
              {Math.round(wind.direction)}° / {wind.speed}kt
            </span>
          </div>
        </div>

        <div className="header-center">
          <div className="stat">
            <span className="label">SCORE</span>
            <span className="value">{score}</span>
          </div>
          <div className="stat">
            <span className="label">TIME</span>
            <span className="value">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}</span>
          </div>
          <div className="stat">
            <span className="label">AIRCRAFT</span>
            <span className="value">{aircraft.length}/{session?.max_aircraft}</span>
          </div>
        </div>

        <div className="header-right">
          <button className="btn-pause">PAUSE</button>
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="atc-grid">
        {/* Radar + Altitude ladder */}
        <div className="radar-section">
          <AtcRadarV2
            aircraft={aircraft}
            wind={wind}
            selectedPlane={selectedPlane}
            onSelectPlane={setSelectedPlane}
            weatherEffects={{ lowVis: false }}
          />
          <AltitudeLadder selectedPlane={selectedPlane} />
        </div>

        {/* Control panel + Emergency alerts */}
        <div className="control-section">
          {emergency && (
            <motion.div
              className="emergency-alert"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="alert-title">🚨 EMERGENCY</div>
              <p>{emergency.message}</p>
            </motion.div>
          )}
          <ControlPanel selectedPlane={selectedPlane} onCommand={handleCommand} />
        </div>
      </div>

      {/* Briefing modal */}
      {gameState === GAME_STATE.BRIEFING && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => startGame()}
        >
          <motion.div
            className="modal"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>AIRFIELD BRIEFING</h2>
            <div className="briefing-content">
              <p><strong>{airport?.name}</strong></p>
              <p>Runway: {airport?.runways?.join(", ")}</p>
              <p>Elevation: {airport?.elevation}ft</p>
              <p>Difficulty: {airport?.difficulty?.toUpperCase()}</p>
              <p className="wind-info">
                Current wind: {Math.round(wind.direction)}° / {wind.speed}kt
              </p>
            </div>
            <button className="btn-start" onClick={() => startGame()}>
              START SIMULATION
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function generateRandomPlane(index) {
  const callsigns = [
    "UAL123", "DAL456", "AAL789", "SWA101", "BAW202", "DLH303", "UAE404",
  ];
  const types = ["B738", "A320", "B77W", "A388", "CRJ9", "E175"];

  return {
    id: `plane-${index}`,
    callsign: callsigns[Math.floor(Math.random() * callsigns.length)] + index,
    aircraft_type: types[Math.floor(Math.random() * types.length)],
    wakeCategory: Math.random() > 0.7 ? "heavy" : Math.random() > 0.5 ? "medium" : "light",
    x: (Math.random() - 0.5) * 30,
    y: (Math.random() - 0.5) * 30 + 20,
    altitude: Math.round((Math.random() * 20000 + 5000) / 100) * 100,
    speed: Math.round(Math.random() * 200 + 200),
    desiredSpeed: Math.round(Math.random() * 200 + 200),
    desiredAltitude: Math.round((Math.random() * 15000 + 2000) / 100) * 100,
    heading: Math.round(Math.random() * 360),
    desiredHeading: Math.round(Math.random() * 360),
    actualHeading: Math.round(Math.random() * 360),
    status: "inbound",
    collisionWarning: false,
    separationViolation: false,
    trajectory: [],
  };
}