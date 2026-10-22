import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AtcRadarV2 from "../components/atc/AtcRadarV2";
import ControlPanel from "../components/atc/ControlPanel";
import AltitudeLadder from "../components/atc/AltitudeLadder";
import ATCSetup from "../components/atc/ATCSetup";
import VoiceInput from "../components/atc/VoiceInput";
import parseATCCommand from "../lib/voiceCommandParser";
import { api } from "../api/client";
import {
  assessLanding,
  calculateTrajectory,
  clampDelta,
  createInboundAircraft,
  findConflicts,
  guideApproach,
  selectActiveRunway,
  updateAircraftPhysics,
} from "../lib/atcPhysics";
import { applyEmergencyEffects, generateEmergency } from "../lib/emergencySystem";
import { sounds, speakText, vibrate } from "../lib/audioManager";
import { addScoreToLeaderboard, calculateScore } from "../lib/scoringEngine";
import { computeWeatherEffects, fetchAirportWeather } from "../lib/weatherEngine";

const GAME_STATE = {
  SETUP: "setup",
  BRIEFING: "briefing",
  ACTIVE: "active",
  PAUSED: "paused",
  GAMEOVER: "gameover",
};

const EMPTY_STATS = {
  successful_landings: 0,
  failed_landings: 0,
  emergencies_handled: 0,
  collisions: 0,
};

const ATC_STYLES = `
.atc-v2-container { width: 100%; height: 100vh; background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%); display: flex; flex-direction: column; overflow: hidden; font-family: monospace; color: #00d4ff; }
.atc-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 2px solid rgba(0, 212, 255, 0.2); background: rgba(10, 25, 41, 0.92); flex-wrap: wrap; gap: 12px; }
.header-left,.header-right { display: flex; gap: 12px; align-items: center; }
.airport-name { font-size: 22px; font-weight: bold; color: #00ff88; margin: 0; }
.wind-indicator { display: flex; flex-direction: column; font-size: 11px; }
.wind-indicator .value { color: #ffaa00; font-weight: bold; }
.header-center { display: flex; gap: 12px; flex-wrap: wrap; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 10px; background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 4px; min-width: 72px; }
.stat .label { font-size: 9px; color: rgba(0, 212, 255, 0.6); }
.stat .value { font-size: 16px; font-weight: bold; color: #00ff88; }
.btn-pause,.btn-shift { padding: 8px 12px; background: rgba(255, 170, 0, 0.1); border: 1px solid #ffaa00; border-radius: 4px; color: #ffaa00; font-family: monospace; font-weight: bold; font-size: 11px; cursor: pointer; }
.btn-shift { border-color: #00d4ff; color: #00d4ff; background: rgba(0, 212, 255, 0.08); }
.atc-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 12px; padding: 12px; flex: 1; min-height: 0; overflow: hidden; }
.radar-section { display: grid; grid-template-columns: minmax(0, 1fr) 64px; gap: 10px; min-height: 0; height: 100%; }
.control-section { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; min-height: 0; }
.emergency-alert { background: rgba(255, 0, 0, 0.15); border: 2px solid #ff0000; border-radius: 6px; padding: 12px; animation: pulse 1s infinite; }
.alert-title { font-weight: bold; color: #ff6666; font-size: 12px; margin-bottom: 6px; }
.emergency-alert p { font-size: 11px; color: #ffcccc; margin: 0; }
.command-box { background: #061018; border: 1px solid rgba(0, 255, 136, 0.35); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
.command-box label { font-size: 10px; color: #00ff88; letter-spacing: 0.04em; }
.command-row { display: flex; gap: 6px; }
.command-row input { flex: 1; background: #030b11; border: 1px solid rgba(0, 212, 255, 0.35); color: #d8fff0; border-radius: 4px; padding: 8px; font-family: monospace; font-size: 12px; }
.command-row button { background: rgba(0, 255, 136, 0.12); color: #00ff88; border: 1px solid #00ff88; border-radius: 4px; font-family: monospace; font-weight: bold; padding: 0 10px; cursor: pointer; }
.metar-line { font-size: 10px; color: #9ad7ff; line-height: 1.4; }
.radio-log-panel { background: #030b11; border: 1px solid rgba(0,255,136,0.35); border-radius: 8px; padding: 10px; min-height: 120px; }
.radio-log-title { color: #00ff88; font-size: 11px; margin-bottom: 8px; letter-spacing: 0.04em; }
.radio-log-entry { font-size: 10px; color: #89ffb5; margin-bottom: 4px; line-height: 1.4; }
.radio-log-entry .time { color: rgba(137,255,181,0.6); margin-right: 6px; }
.gameover-stat { margin: 8px 0; color: #ff9999; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 rgba(255, 0, 0, 0.5); } 50% { box-shadow: 0 0 12px rgba(255, 0, 0, 0.5); } }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%); border: 2px solid #00d4ff; border-radius: 8px; padding: 24px; max-width: 500px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 0 30px rgba(0, 212, 255, 0.3); text-align: center; }
.briefing-content { text-align: left; font-size: 12px; margin: 16px 0; line-height: 1.6; flex: 1; overflow-y: auto; }
.btn-start { margin-top: 16px; padding: 12px 24px; background: linear-gradient(135deg, #00d4ff, #00ff88); border: none; border-radius: 6px; color: #0a1929; font-family: monospace; font-weight: bold; font-size: 14px; cursor: pointer; }
@media (max-width: 1024px) { .atc-grid { grid-template-columns: 1fr; overflow: auto; } .radar-section { grid-template-columns: 1fr; min-height: 420px; } }
`;

if (typeof document !== "undefined" && !document.getElementById("atc-v2-styles")) {
  const styleEl = document.createElement("style");
  styleEl.id = "atc-v2-styles";
  styleEl.textContent = ATC_STYLES;
  document.head.appendChild(styleEl);
}

function weatherIntensity(airport) {
  const multiplier = airport?.weatherMultiplier ?? 1;
  return Math.min(1, Math.max(0, (multiplier - 0.5) / 3.5));
}

function effectsToWind(effects) {
  return {
    direction: effects?.windDir ?? 250,
    speed: effects?.windSpeed ?? 12,
  };
}

function fallbackEffects(airport) {
  return computeWeatherEffects(
    {
      windSpeed: 12,
      windDir: 250,
      visibility: 10,
      turbulenceIndex: 0.15,
      temp: 60,
      humidity: 50,
      weatherCode: 1,
    },
    airport || { id: "ZZZZ", weatherMultiplier: 1 },
    weatherIntensity(airport)
  );
}

function statsSnapshot(stats, separationViolations) {
  return {
    successful_landings: stats.successful_landings || 0,
    failed_landings: stats.failed_landings || 0,
    emergencies_handled: stats.emergencies_handled || 0,
    collisions: stats.collisions || 0,
    separationViolations: separationViolations || 0,
  };
}

export default function ATCv2() {
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState(GAME_STATE.SETUP);
  const [session, setSession] = useState(null);
  const [airport, setAirport] = useState(null);
  const [aircraft, setAircraft] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [wind, setWind] = useState({ direction: 250, speed: 12 });
  const [weatherEffects, setWeatherEffects] = useState(null);
  const [score, setScore] = useState(0);
  const [landings, setLandings] = useState(0);
  const [time, setTime] = useState(0);
  const [emergency, setEmergency] = useState(null);
  const [radioLog, setRadioLog] = useState([]);
  const [separationCount, setSeparationCount] = useState(0);
  const [activeRunway, setActiveRunway] = useState("");
  const [endReason, setEndReason] = useState("");
  const [commandText, setCommandText] = useState("");

  const gameStateRef = useRef(gameState);
  const aircraftRef = useRef([]);
  const windRef = useRef(wind);
  const airportRef = useRef(null);
  const sessionRef = useRef(null);
  const statsRef = useRef({ ...EMPTY_STATS });
  const separationRef = useRef(0);
  const activePairsRef = useRef(new Set());
  const emergencyRef = useRef(null);
  const selectedIdRef = useRef(null);
  const endedRef = useRef(false);
  const activeRunwayRef = useRef("");
  const aircraftCountRef = useRef(0);
  const logIdRef = useRef(0);
  const queryClientRef = useRef(queryClient);

  gameStateRef.current = gameState;
  windRef.current = wind;
  airportRef.current = airport;
  sessionRef.current = session;
  emergencyRef.current = emergency;
  selectedIdRef.current = selectedId;
  queryClientRef.current = queryClient;

  const addRadioLog = useCallback((source, message) => {
    logIdRef.current += 1;
    const entry = { id: logIdRef.current, timestamp: new Date().toLocaleTimeString(), source, message };
    setRadioLog((prev) => [...prev.slice(-7), entry]);
  }, []);

  const logRef = useRef(addRadioLog);
  logRef.current = addRadioLog;

  const publishSession = useCallback((patch) => {
    const current = sessionRef.current;
    if (!current?.id) return;
    const next = { ...current, ...patch };
    sessionRef.current = next;
    setSession(next);
    api.entities.ATCSession.update(current.id, patch).catch(() => {});
  }, []);

  const scoreSession = useCallback((status) => {
    const stats = statsSnapshot(statsRef.current, separationRef.current);
    const nextScore = calculateScore(stats);
    setScore(nextScore);
    setLandings(stats.successful_landings);
    setSeparationCount(stats.separationViolations);
    addScoreToLeaderboard("ATC Operator", nextScore, stats);
    publishSession({ ...stats, score: nextScore, ...(status ? { status } : {}) });
    if (status === "completed") {
      queryClientRef.current.invalidateQueries({ queryKey: ["atc-past-sessions"] });
    }
    return nextScore;
  }, [publishSession]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let spawnTimer = 0;
    let emergencyTimer = 0;
    const landedIds = new Set();

    const frame = (now) => {
      const rawDt = Math.max(0, (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(frame);
      if (gameStateRef.current !== GAME_STATE.ACTIVE || endedRef.current) return;

      const dt = clampDelta(rawDt || 0.016);
      const field = airportRef.current;
      const windNow = windRef.current;
      const runway = selectActiveRunway(field, windNow);
      if (runway && runway !== activeRunwayRef.current) {
        activeRunwayRef.current = runway;
        setActiveRunway(runway);
      }

      let planes = aircraftRef.current.map((plane) => ({ ...plane }));
      const landedNow = [];
      const missedNow = [];

      planes.forEach((plane) => {
        const assigned = plane.runway || runway;
        if (plane.clearedToLand) guideApproach(plane, assigned, field?.elevation || 0);
        updateAircraftPhysics(plane, windNow, planes, dt);
        plane.trajectory = calculateTrajectory(plane, windNow);
        if (!plane.clearedToLand) return;
        const result = assessLanding(plane, assigned, field?.elevation || 0);
        if (result.landed && !landedIds.has(plane.id)) {
          landedIds.add(plane.id);
          plane.status = "landed";
          landedNow.push(plane);
        } else if (result.missed) {
          plane.clearedToLand = false;
          plane.status = "approach";
          plane.desiredAltitude = (field?.elevation || 0) + 2000;
          missedNow.push(plane);
        }
      });

      planes = planes.filter((plane) => plane.status !== "landed");
      const { separations, collisions } = findConflicts(planes);
      const violating = new Set();
      separations.forEach((pair) => {
        violating.add(pair.a.id);
        violating.add(pair.b.id);
      });
      const colliding = new Set();
      collisions.forEach((pair) => {
        colliding.add(pair.a.id);
        colliding.add(pair.b.id);
      });
      planes.forEach((plane) => {
        plane.separationViolation = violating.has(plane.id);
        plane.collisionWarning = colliding.has(plane.id);
      });

      const nextPairs = new Set(separations.map((pair) => [pair.a.id, pair.b.id].sort().join("|")));
      const fresh = [];
      nextPairs.forEach((key) => {
        if (!activePairsRef.current.has(key)) fresh.push(key);
      });
      activePairsRef.current = nextPairs;
      if (fresh.length > 0) {
        separationRef.current += fresh.length;
        setSeparationCount(separationRef.current);
        fresh.forEach((key) => logRef.current("SYS", `Separation loss ${key.replace("|", "/")}`));
        sounds.separated();
      }

      spawnTimer += rawDt;
      const maxAircraft = sessionRef.current?.max_aircraft || field?.maxAircraft || 4;
      if (spawnTimer > 26 && planes.length < maxAircraft) {
        spawnTimer = 0;
        const nextIndex = aircraftCountRef.current;
        aircraftCountRef.current += 1;
        const arrival = createInboundAircraft(nextIndex, field, runway, 26 + (nextIndex % 3) * 4);
        planes.push(arrival);
        sounds.planeContact();
        logRef.current("ATC", `${arrival.callsign} contact approach.`);
      }

      emergencyTimer += rawDt;
      if (emergencyTimer > 45 && !emergencyRef.current && planes.length > 0) {
        emergencyTimer = 0;
        const nextEmergency = generateEmergency(planes.length);
        const target = planes.find((plane) => !plane.emergency);
        if (nextEmergency && target) {
          applyEmergencyEffects(target, nextEmergency);
          target.emergency = nextEmergency;
          emergencyRef.current = nextEmergency;
          setEmergency(nextEmergency);
          statsRef.current.emergencies_handled += 1;
          sounds.emergencyAlert();
          vibrate([200, 100, 200]);
          logRef.current("ATC", `${target.callsign} ${nextEmergency.message}`);
        }
      }

      aircraftRef.current = planes;
      setAircraft(planes);

      landedNow.forEach((plane) => {
        statsRef.current.successful_landings += 1;
        sounds.landed();
        logRef.current("ATC", `${plane.callsign} landed.`);
        scoreSession();
      });
      missedNow.forEach((plane) => {
        statsRef.current.failed_landings += 1;
        sounds.warningBeep();
        logRef.current("ATC", `${plane.callsign} missed approach.`);
        const stats = statsSnapshot(statsRef.current, separationRef.current);
        setScore(calculateScore(stats));
        publishSession({ ...stats, score: calculateScore(stats) });
      });

      if (collisions.length > 0) {
        statsRef.current.collisions += collisions.length;
        sounds.collision();
        endedRef.current = true;
        setEndReason("Midair collision");
        gameStateRef.current = GAME_STATE.GAMEOVER;
        setGameState(GAME_STATE.GAMEOVER);
        scoreSession("completed");
        return;
      }
      if (separationRef.current >= 3) {
        endedRef.current = true;
        setEndReason("Three separation losses");
        gameStateRef.current = GAME_STATE.GAMEOVER;
        setGameState(GAME_STATE.GAMEOVER);
        scoreSession("completed");
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [publishSession, scoreSession]);

  useEffect(() => {
    if (gameState !== GAME_STATE.ACTIVE) return undefined;
    const timer = setInterval(() => setTime((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (!airport) return undefined;
    const initial = fallbackEffects(airport);
    const initialWind = effectsToWind(initial);
    windRef.current = initialWind;
    setWind(initialWind);
    setWeatherEffects(initial);
    const runway = selectActiveRunway(airport, initialWind);
    activeRunwayRef.current = runway;
    setActiveRunway(runway);
    let cancelled = false;
    fetchAirportWeather(airport.lat, airport.lng)
      .then((wx) => {
        if (cancelled) return;
        const effects = computeWeatherEffects(wx, airport, weatherIntensity(airport));
        const liveWind = effectsToWind(effects);
        windRef.current = liveWind;
        setWind(liveWind);
        setWeatherEffects(effects);
        const liveRunway = selectActiveRunway(airport, liveWind);
        activeRunwayRef.current = liveRunway;
        setActiveRunway(liveRunway);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [airport]);

  const handleSessionCreated = ({ airport: nextAirport, ...nextSession }) => {
    sessionRef.current = { ...nextSession, airport: nextAirport };
    airportRef.current = nextAirport;
    statsRef.current = { ...EMPTY_STATS };
    separationRef.current = 0;
    endedRef.current = false;
    setSession(sessionRef.current);
    setAirport(nextAirport);
    setScore(0);
    setLandings(0);
    setSeparationCount(0);
    setEmergency(null);
    setGameState(GAME_STATE.BRIEFING);
    gameStateRef.current = GAME_STATE.BRIEFING;
  };

  const startGame = () => {
    const field = airportRef.current;
    const runway = selectActiveRunway(field, windRef.current) || field?.runways?.[0];
    activeRunwayRef.current = runway;
    setActiveRunway(runway);
    const first = createInboundAircraft(0, field, runway, 24);
    aircraftCountRef.current = 1;
    aircraftRef.current = [first];
    activePairsRef.current = new Set();
    separationRef.current = 0;
    emergencyRef.current = null;
    endedRef.current = false;
    statsRef.current = { ...EMPTY_STATS };
    setAircraft([first]);
    setSelectedId(first.id);
    setTime(0);
    setScore(0);
    setLandings(0);
    setSeparationCount(0);
    setEmergency(null);
    setEndReason("");
    setRadioLog([]);
    gameStateRef.current = GAME_STATE.ACTIVE;
    setGameState(GAME_STATE.ACTIVE);
    addRadioLog("ATC", `${first.callsign} is inbound runway ${runway}.`);
  };

  const finishAndLeave = () => {
    if (gameStateRef.current === GAME_STATE.ACTIVE || gameStateRef.current === GAME_STATE.PAUSED) {
      scoreSession("completed");
    }
    endedRef.current = true;
    gameStateRef.current = GAME_STATE.SETUP;
    setGameState(GAME_STATE.SETUP);
  };

  const applyToAircraft = (targetId, recipe) => {
    const next = aircraftRef.current.map((plane) => (plane.id === targetId ? recipe(plane) : plane));
    aircraftRef.current = next;
    setAircraft(next);
  };

  const handleCommand = (cmd) => {
    if (!cmd?.type) return;
    const planes = aircraftRef.current;
    const byCallsign = cmd.callsign
      ? planes.find((plane) => plane.callsign.toUpperCase() === String(cmd.callsign).toUpperCase())
      : null;
    const target = byCallsign || planes.find((plane) => plane.id === selectedIdRef.current);
    if (!target) {
      addRadioLog("ATC", "No aircraft on that callsign.");
      return;
    }

    const runway = cmd.runway || target.runway || activeRunwayRef.current;
    switch (cmd.type) {
      case "set_speed":
        applyToAircraft(target.id, (plane) => ({ ...plane, desiredSpeed: cmd.value }));
        sounds.headingLock();
        addRadioLog("ATC", `${target.callsign}, speed ${cmd.value}.`);
        break;
      case "set_altitude":
        applyToAircraft(target.id, (plane) => ({ ...plane, desiredAltitude: cmd.value }));
        sounds.headingLock();
        addRadioLog("ATC", `${target.callsign}, maintain ${cmd.value}.`);
        break;
      case "set_heading":
        applyToAircraft(target.id, (plane) => ({
          ...plane,
          desiredHeading: cmd.value,
          clearedToLand: false,
          status: plane.status === "final" ? "inbound" : plane.status,
        }));
        sounds.headingLock();
        addRadioLog("ATC", `${target.callsign}, heading ${cmd.value}.`);
        break;
      case "go_around":
        applyToAircraft(target.id, (plane) => ({
          ...plane,
          status: "approach",
          clearedToLand: false,
          desiredAltitude: (airportRef.current?.elevation || 0) + 2000,
        }));
        sounds.warningBeep();
        addRadioLog("ATC", `${target.callsign}, go around.`);
        break;
      case "cleared_to_land":
        applyToAircraft(target.id, (plane) => ({
          ...plane,
          status: "final",
          clearedToLand: true,
          runway,
        }));
        speakText(`${target.callsign}, cleared to land runway ${runway}.`);
        addRadioLog("ATC", `${target.callsign}, cleared to land runway ${runway}.`);
        break;
      case "squawk":
        applyToAircraft(target.id, (plane) => ({ ...plane, squawk: cmd.code }));
        addRadioLog("ATC", `${target.callsign}, squawk ${cmd.code}.`);
        break;
      case "frequency_change":
        applyToAircraft(target.id, (plane) => ({ ...plane, assignedFrequency: cmd.freq }));
        addRadioLog("ATC", `${target.callsign}, contact ${cmd.freq}.`);
        break;
      default: {
        const unknown = cmd.type;
        void unknown;
        addRadioLog("ATC", "Say again.");
        break;
      }
    }
  };

  const handleVoiceCommand = (cmd, parsedResult) => {
    if (!cmd) return;
    addRadioLog("VOICE", `${cmd.callsign || "UNK"} ${cmd.type}`);
    handleCommand(cmd);
    if (parsedResult?.readback) addRadioLog("READBACK", parsedResult.readback);
  };

  const submitTypedCommand = (event) => {
    event.preventDefault();
    const text = commandText.trim();
    if (!text) return;
    const selected = aircraftRef.current.find((plane) => plane.id === selectedIdRef.current) || null;
    const parsed = parseATCCommand(text, aircraftRef.current, selected);
    addRadioLog("PILOT", text);
    if (parsed.command) {
      handleCommand(parsed.command);
      addRadioLog("READBACK", parsed.readback);
    } else {
      addRadioLog("ATC", parsed.readback || "Say again.");
    }
    setCommandText("");
  };

  const togglePause = () => {
    setGameState((prev) => {
      const next = prev === GAME_STATE.ACTIVE ? GAME_STATE.PAUSED : GAME_STATE.ACTIVE;
      gameStateRef.current = next;
      return next;
    });
  };

  const restartGame = async () => {
    const field = airportRef.current;
    if (!field) return;
    const created = await api.entities.ATCSession.create({
      status: "active",
      difficulty: field.difficulty,
      level: field.level,
      max_aircraft: field.maxAircraft,
      airport_id: field.id,
      successful_landings: 0,
      failed_landings: 0,
      emergencies_handled: 0,
      collisions: 0,
      separationViolations: 0,
      score: 0,
    });
    sessionRef.current = { ...created, airport: field };
    setSession(sessionRef.current);
    startGame();
  };

  const selected = aircraft.find((plane) => plane.id === selectedId) || null;
  const telemetry = aircraft.map((plane) => ({
    id: plane.id,
    callsign: plane.callsign,
    x: Number(plane.x.toFixed(3)),
    y: Number(plane.y.toFixed(3)),
    altitude: Math.round(plane.altitude),
    speed: Math.round(plane.speed),
    heading: Math.round(plane.actualHeading || plane.heading || 0),
    status: plane.status,
    runway: plane.runway,
    clearedToLand: Boolean(plane.clearedToLand),
  }));

  if (gameState === GAME_STATE.SETUP) {
    return <ATCSetup onSessionCreated={handleSessionCreated} />;
  }

  return (
    <div className="atc-v2-container">
      <div
        data-testid="atc-telemetry"
        data-score={score}
        data-landings={landings}
        data-state={gameState}
        data-active-runway={activeRunway}
        data-aircraft={JSON.stringify(telemetry)}
        hidden
      />
      <motion.div className="atc-header" initial={{ y: -20 }} animate={{ y: 0 }}>
        <div className="header-left">
          <h1 className="airport-name">{airport?.id}</h1>
          <div className="wind-indicator">
            <span>WND / RWY</span>
            <span className="value">{Math.round(wind.direction)}° / {Math.round(wind.speed)}kt · {activeRunway}</span>
          </div>
        </div>
        <div className="header-center">
          <div className="stat"><span className="label">SCORE</span><span className="value" data-testid="score-value">{score}</span></div>
          <div className="stat"><span className="label">LANDINGS</span><span className="value" data-testid="landing-count">{landings}</span></div>
          <div className="stat"><span className="label">TIME</span><span className="value">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}</span></div>
          <div className="stat"><span className="label">AIRCRAFT</span><span className="value">{aircraft.length}/{session?.max_aircraft}</span></div>
          <div className="stat"><span className="label">SEP LOSS</span><span className="value">{separationCount}/3</span></div>
        </div>
        <div className="header-right">
          <button type="button" className="btn-shift" onClick={finishAndLeave}>AIRPORTS</button>
          <button type="button" className="btn-pause" onClick={togglePause}>
            {gameState === GAME_STATE.PAUSED ? "RESUME" : "PAUSE"}
          </button>
        </div>
      </motion.div>

      <div className="atc-grid">
        <div className="radar-section">
          <AtcRadarV2
            aircraft={aircraft}
            wind={wind}
            selectedPlane={selected}
            onSelectPlane={setSelectedId}
            weatherEffects={weatherEffects}
            airport={airport}
            activeRunway={activeRunway}
          />
          <AltitudeLadder selectedPlane={selected} />
        </div>

        <div className="control-section">
          {emergency && (
            <motion.div className="emergency-alert" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="alert-title">EMERGENCY</div>
              <p>{emergency.message}</p>
            </motion.div>
          )}

          <form className="command-box" data-testid="command-form" onSubmit={submitTypedCommand}>
            <label htmlFor="atc-command">TYPED CLEARANCE</label>
            {weatherEffects?.metar && <div className="metar-line">{weatherEffects.metar}</div>}
            <div className="command-row">
              <input
                id="atc-command"
                data-testid="command-input"
                value={commandText}
                onChange={(event) => setCommandText(event.target.value)}
                placeholder="UAL1230 cleared to land runway 24L"
                autoComplete="off"
              />
              <button type="submit">SEND</button>
            </div>
          </form>

          <VoiceInput
            onCommand={handleVoiceCommand}
            aircraft={aircraft}
            selectedPlane={selected}
          />

          <ControlPanel selectedPlane={selected} onCommand={handleCommand} activeRunway={activeRunway} />

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
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <h2>AIRFIELD BRIEFING</h2>
            <div className="briefing-content">
              <p><strong>{airport?.name}</strong></p>
              <p>Runways: {airport?.runways?.join(", ")}</p>
              <p>Active: {activeRunway || "—"}</p>
              <p>Elevation: {airport?.elevation}ft</p>
              <p>Difficulty: {airport?.difficulty?.toUpperCase()}</p>
              <p>Wind: {Math.round(wind.direction)}° / {Math.round(wind.speed)}kt</p>
              <p>Keep 3nm and 1000ft. Vector arrivals onto the active runway, then clear them to land.</p>
            </div>
            <button type="button" className="btn-start" data-testid="start-sim" onClick={startGame}>START SIMULATION</button>
          </motion.div>
        </motion.div>
      )}

      {gameState === GAME_STATE.GAMEOVER && (
        <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
            <h2>GAME OVER</h2>
            <p className="gameover-stat">{endReason}</p>
            <p className="gameover-stat">Final Score: {score}</p>
            <p className="gameover-stat">Landings: {landings}</p>
            <p className="gameover-stat">Separation Violations: {separationCount}</p>
            <button type="button" className="btn-start" onClick={restartGame}>RESTART</button>
            <button type="button" className="btn-start" onClick={finishAndLeave}>AIRPORTS</button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
