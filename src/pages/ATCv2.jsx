import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import AtcRadarV2 from "../components/atc/AtcRadarV2";
import ControlPanel from "../components/atc/ControlPanel";
import AltitudeLadder from "../components/atc/AltitudeLadder";
import ATCSetup from "../components/atc/ATCSetup";
import VoiceInput from "../components/atc/VoiceInput";
import { updateAircraftPhysics, calculateTrajectory, getMinSeparation } from "../lib/atcPhysics";
import { generateEmergency } from "../lib/emergencySystem";
import { sounds, speakText, vibrate } from "../lib/audioManager";

const GAME_STATE = {
  SETUP: "setup",
  BRIEFING: "briefing",
  ACTIVE: "active",
  PAUSED: "paused",
  GAMEOVER: "gameover",
};

const ATC_STYLES = `
.atc-v2-container { width: 100vw; height: 100vh; background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%); display: flex; flex-direction: column; overflow: hidden; font-family: monospace; color: #00d4ff; }
.atc-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 2px solid rgba(0, 212, 255, 0.2); background: rgba(10, 25, 41, 0.9); flex-wrap: wrap; gap: 20px; }
.header-left,.header-right { display: flex; gap: 16px; align-items: center; }
.airport-name { font-size: 24px; font-weight: bold; color: #00ff88; margin: 0; }
.wind-indicator { display: flex; flex-direction: column; font-size: 11px; }
.wind-indicator .value { color: #ffaa00; font-weight: bold; }
.header-center { display: flex; gap: 24px; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 12px; background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 4px; }
.stat .label { font-size: 9px; color: rgba(0, 212, 255, 0.6); }
.stat .value { font-size: 18px; font-weight: bold; color: #00ff88; }
.btn-pause { padding: 8px 16px; background: rgba(255, 170, 0, 0.1); border: 1px solid #ffaa00; border-radius: 4px; color: #ffaa00; font-family: monospace; font-weight: bold; font-size: 11px; cursor: pointer; transition: all 0.2s; }
.btn-pause:hover { background: rgba(255, 170, 0, 0.2); box-shadow: 0 0 12px rgba(255, 170, 0, 0.4); }
.atc-grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; padding: 16px; flex: 1; overflow: hidden; }
.radar-section { display: grid; grid-template-columns: 1fr 60px; gap: 12px; }
.control-section { display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.emergency-alert { background: rgba(255, 0, 0, 0.15); border: 2px solid #ff0000; border-radius: 6px; padding: 12px; animation: pulse 1s infinite; }
.alert-title { font-weight: bold; color: #ff6666; font-size: 12px; margin-bottom: 6px; }
.emergency-alert p { font-size: 11px; color: #ffcccc; margin: 0; }
.radio-log-panel { background: #030b11; border: 1px solid rgba(0,255,136,0.35); border-radius: 8px; padding: 10px; min-height: 160px; }
.radio-log-title { color: #00ff88; font-size: 11px; margin-bottom: 8px; letter-spacing: 0.04em; }
.radio-log-entry { font-size: 10px; color: #89ffb5; margin-bottom: 4px; line-height: 1.4; }
.radio-log-entry .time { color: rgba(137,255,181,0.6); margin-right: 6px; }
.gameover-stat { margin: 8px 0; color: #ff9999; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 rgba(255, 0, 0, 0.5); } 50% { box-shadow: 0 0 12px rgba(255, 0, 0, 0.5); } }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%); border: 2px solid #00d4ff; border-radius: 8px; padding: 24px; max-width: 500px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 0 30px rgba(0, 212, 255, 0.3); text-align: center; }
.briefing-content { text-align: left; font-size: 12px; margin: 16px 0; line-height: 1.6; flex: 1; overflow-y: auto; }
.btn-start { margin-top: 16px; padding: 12px 24px; background: linear-gradient(135deg, #00d4ff, #00ff88); border: none; border-radius: 6px; color: #0a1929; font-family: monospace; font-weight: bold; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.btn-start:hover { transform: scale(1.05); box-shadow: 0 0 20px rgba(0, 212, 255, 0.6); }
@media (max-width: 1024px) { .atc-grid { grid-template-columns: 1fr; } .radar-section { grid-template-columns: 1fr; } }
`;

if (typeof document !== "undefined" && !document.getElementById("atc-v2-styles")) {
  const styleEl = document.createElement("style");
  styleEl.id = "atc-v2-styles";
  styleEl.textContent = ATC_STYLES;
  document.head.appendChild(styleEl);
}

export default function ATCv2() {
  const [gameState, setGameState] = useState(GAME_STATE.SETUP);
  const [session, setSession] = useState(null);
  const [airport, setAirport] = useState(null);
  const [aircraft, setAircraft] = useState([]);
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [wind] = useState({ direction: 270, speed: 15 });
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [emergency, setEmergency] = useState(null);
  const [radioLog, setRadioLog] = useState([]);
  const [separationCount, setSeparationCount] = useState(0);

  const gameLoopRef = useRef(null);
  const timeRef = useRef(0);
  const aircraftCountRef = useRef(0);
  const activeViolationPairsRef = useRef(new Set());
  const logIdRef = useRef(0);

  const addRadioLog = useCallback((source, message) => {
    const timestamp = new Date().toLocaleTimeString();
    logIdRef.current += 1;
    setRadioLog((prev) => [...prev.slice(-7), { id: logIdRef.current, timestamp, source, message }]);
  }, []);

  const transmitATC = useCallback((message, rate = 1) => {
    speakText(message, rate);
    addRadioLog("ATC", message);
  }, [addRadioLog]);

  useEffect(() => {
    if (gameState !== GAME_STATE.ACTIVE || !session) return undefined;

    const loop = () => {
      setAircraft((prevAircraft) => {
        let updated = prevAircraft.map((plane) => updateAircraftPhysics({ ...plane }, wind, prevAircraft));

        updated = updated.map((plane) => {
          if (plane.status === "final" && Math.abs(plane.x) < 1 && Math.abs(plane.y) < 1 && plane.altitude < 500) {
            sounds.landed();
            transmitATC(`${plane.callsign} landed.`);
            setScore((s) => s + 100);
            return { ...plane, status: "landed" };
          }
          return plane;
        });

        timeRef.current += 1;
        if (timeRef.current % 120 === 0 && updated.length < session.max_aircraft) {
          const newPlane = generateRandomPlane(aircraftCountRef.current++);
          updated.push(newPlane);
          sounds.planeContact();
          transmitATC(`${newPlane.callsign} contact approach.`);
        }

        if (Math.random() < 0.001 && !emergency && updated.length > 0) {
          const em = generateEmergency(updated.length);
          const plane = updated[Math.floor(Math.random() * updated.length)];
          if (em && plane) {
            setEmergency(em);
            sounds.emergencyAlert();
            transmitATC(em.message, 0.8);
            vibrate([200, 100, 200]);
            updated = updated.map((p) => (p.id === plane.id ? { ...p, emergency: em } : p));
          }
        }

        updated = updated.map((plane) => ({ ...plane, trajectory: calculateTrajectory(plane, wind) }));

        const newViolations = new Set();
        for (let i = 0; i < updated.length; i += 1) {
          for (let j = i + 1; j < updated.length; j += 1) {
            const a = updated[i];
            const b = updated[j];
            if (a.status === "landed" || b.status === "landed") continue;
            const { horDist, altDiff } = getMinSeparation(a, b);
            if (horDist < 3 && altDiff < 1000) {
              const key = [a.id, b.id].sort().join("|");
              newViolations.add(key);
              if (!activeViolationPairsRef.current.has(key)) {
                setSeparationCount((count) => count + 1);
                addRadioLog("SYS", `Separation loss: ${a.callsign}/${b.callsign}`);
              }
            }
          }
        }
        activeViolationPairsRef.current = newViolations;
        return updated;
      });

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, session, wind, emergency, transmitATC, addRadioLog]);

  useEffect(() => {
    if (separationCount >= 3 && gameState !== GAME_STATE.GAMEOVER) {
      setGameState(GAME_STATE.GAMEOVER);
    }
  }, [separationCount, gameState]);

  useEffect(() => {
    if (gameState !== GAME_STATE.ACTIVE) return undefined;
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
    activeViolationPairsRef.current = new Set();
    setTime(0);
    setScore(0);
    setSeparationCount(0);
    setEmergency(null);
    setRadioLog([]);
    setGameState(GAME_STATE.ACTIVE);
  };

  const resolveTarget = (cmd) => {
    if (cmd.callsign) {
      const byCallsign = aircraft.find((p) => p.callsign === cmd.callsign);
      if (byCallsign) return byCallsign;
    }
    return selectedPlane;
  };

  const handleCommand = (cmd) => {
    const target = resolveTarget(cmd);
    if (!target) return;

    switch (cmd.type) {
      case "set_speed":
        setAircraft((prev) => prev.map((p) => (p.id === target.id ? { ...p, desiredSpeed: cmd.value } : p)));
        sounds.headingLock();
        transmitATC(`${target.callsign}, set speed ${cmd.value} knots.`);
        break;
      case "set_altitude":
        setAircraft((prev) => prev.map((p) => (p.id === target.id ? { ...p, desiredAltitude: cmd.value } : p)));
        sounds.headingLock();
        transmitATC(`${target.callsign}, maintain ${cmd.value} feet.`);
        break;
      case "set_heading":
        setAircraft((prev) => prev.map((p) => (p.id === target.id ? { ...p, desiredHeading: cmd.value } : p)));
        sounds.headingLock();
        transmitATC(`${target.callsign}, turn heading ${cmd.value}.`);
        break;
      case "go_around":
        setAircraft((prev) => prev.map((p) => (p.id === target.id ? { ...p, status: "approach", desiredAltitude: 2000 } : p)));
        sounds.warningBeep();
        transmitATC(`${target.callsign}, go around, climb 2000 feet.`);
        break;
      case "cleared_to_land":
        setAircraft((prev) =>
          prev.map((p) =>
            p.id === target.id
              ? { ...p, status: "final", desiredAltitude: 0, runway: cmd.runway || "28L", clearedToLand: true }
              : p
          )
        );
        transmitATC(`${target.callsign}, cleared to land runway ${cmd.runway || "28L"}.`);
        break;
      case "squawk":
        setAircraft((prev) => prev.map((p) => (p.id === target.id ? { ...p, squawk: cmd.code } : p)));
        transmitATC(`${target.callsign}, squawk ${cmd.code}.`);
        break;
      case "frequency_change":
        setAircraft((prev) => prev.map((p) => (p.id === target.id ? { ...p, assignedFrequency: cmd.freq } : p)));
        transmitATC(`${target.callsign}, contact approach ${cmd.freq}.`);
        break;
      default:
        break;
    }
  };

  const handleVoiceCommand = (cmd, parsedResult) => {
    if (!cmd) return;
    addRadioLog("VOICE", `${cmd.callsign || "UNK"} ${cmd.type}`);
    handleCommand(cmd);
    if (parsedResult?.readback) {
      addRadioLog("READBACK", parsedResult.readback);
    }
  };

  const togglePause = () => {
    setGameState((prev) => (prev === GAME_STATE.ACTIVE ? GAME_STATE.PAUSED : GAME_STATE.ACTIVE));
  };

  if (gameState === GAME_STATE.SETUP) {
    return <ATCSetup onSessionCreated={handleSessionCreated} />;
  }

  return (
    <div className="atc-v2-container">
      <motion.div className="atc-header" initial={{ y: -20 }} animate={{ y: 0 }}>
        <div className="header-left">
          <h1 className="airport-name">{airport?.id}</h1>
          <div className="wind-indicator">
            <span>WND</span>
            <span className="value">{Math.round(wind.direction)}° / {wind.speed}kt</span>
          </div>
        </div>
        <div className="header-center">
          <div className="stat"><span className="label">SCORE</span><span className="value">{score}</span></div>
          <div className="stat"><span className="label">TIME</span><span className="value">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}</span></div>
          <div className="stat"><span className="label">AIRCRAFT</span><span className="value">{aircraft.length}/{session?.max_aircraft}</span></div>
          <div className="stat"><span className="label">SEP LOSS</span><span className="value">{separationCount}</span></div>
        </div>
        <div className="header-right">
          <button className="btn-pause" onClick={togglePause}>
            {gameState === GAME_STATE.PAUSED ? "RESUME" : "PAUSE"}
          </button>
        </div>
      </motion.div>

      <div className="atc-grid">
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

        <div className="control-section">
          {emergency && (
            <motion.div className="emergency-alert" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="alert-title">🚨 EMERGENCY</div>
              <p>{emergency.message}</p>
            </motion.div>
          )}

          <VoiceInput
            onCommand={handleVoiceCommand}
            aircraft={aircraft}
            selectedPlane={selectedPlane}
          />

          <ControlPanel selectedPlane={selectedPlane} onCommand={handleCommand} />

          <div className="radio-log-panel">
            <div className="radio-log-title">RADIO LOG</div>
            {radioLog.length === 0 ? (
              <div className="radio-log-entry">No transmissions yet.</div>
            ) : (
              radioLog.slice(-8).reverse().map((entry) => (
                <div className="radio-log-entry" key={entry.id}>
                  <span className="time">{entry.timestamp}</span>
                  <strong>{entry.source}:</strong> {entry.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {gameState === GAME_STATE.BRIEFING && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={startGame}>
          <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <h2>AIRFIELD BRIEFING</h2>
            <div className="briefing-content">
              <p><strong>{airport?.name}</strong></p>
              <p>Runway: {airport?.runways?.join(", ")}</p>
              <p>Elevation: {airport?.elevation}ft</p>
              <p>Difficulty: {airport?.difficulty?.toUpperCase()}</p>
              <p className="wind-info">Current wind: {Math.round(wind.direction)}° / {wind.speed}kt</p>
            </div>
            <button className="btn-start" onClick={startGame}>START SIMULATION</button>
          </motion.div>
        </motion.div>
      )}

      {gameState === GAME_STATE.GAMEOVER && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <h2>GAME OVER</h2>
            <p className="gameover-stat">Final Score: {score}</p>
            <p className="gameover-stat">Separation Violations: {separationCount}</p>
            <button className="btn-start" onClick={startGame}>RESTART</button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function generateRandomPlane(index) {
  const callsigns = ["UAL123", "DAL456", "AAL789", "SWA101", "BAW202", "DLH303", "UAE404"];
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
