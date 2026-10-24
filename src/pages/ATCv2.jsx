import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AtcRadarV2 from "../components/atc/AtcRadarV2";
import CommandPad from "../components/atc/CommandPad";
import AltitudeLadder from "../components/atc/AltitudeLadder";
import { altitudeCommand, headingCommand, speedCommand } from "../lib/commandPad";
import ATCSetup from "../components/atc/ATCSetup";
import HelpSheet from "../components/atc/HelpSheet";
import TutorialCoach from "../components/atc/TutorialCoach";
import { SpeechProvider } from "../components/atc/VoiceInput";
import parseATCCommand from "../lib/voiceCommandParser";
import { api } from "../api/client";
import { getAirport } from "../lib/airports";
import {
  assessLanding,
  calculateTrajectory,
  clampDelta,
  createInboundAircraft,
  findConflicts,
  guideApproach,
  keepOnLessonTrack,
  placeOnExtendedCenterline,
  selectActiveRunway,
  updateAircraftPhysics,
} from "../lib/atcPhysics";
import {
  TUTORIAL_STEPS,
  advanceTutorial,
  createTutorialAircraft,
  exampleFor,
  markTutorialStatus,
  readTutorialStatus,
  shouldOfferTutorial,
} from "../lib/tutorial";
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
.atc-v2-container { position: fixed; top: var(--app-top, 0px); left: 0; right: 0; height: var(--app-height, 100dvh); max-height: var(--app-height, 100dvh); box-sizing: border-box; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); background: radial-gradient(circle at 50% 0%, #10281c, #050a08 62%); display: flex; flex-direction: column; overflow: hidden; font-family: ui-monospace, monospace; color: #d7ffe8; }
.atc-header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; border-bottom: 1px solid rgba(120, 255, 170, 0.25); background: rgba(4, 12, 8, 0.94); flex: 0 0 auto; flex-wrap: nowrap; gap: 8px; overflow: hidden; max-height: 48px; }
.header-left,.header-right { display: flex; gap: 6px; align-items: center; flex: 0 0 auto; }
.airport-name { font-size: 16px; font-weight: bold; color: #b6ff8a; margin: 0; white-space: nowrap; letter-spacing: 0.06em; }
.wind-indicator { display: flex; flex-direction: column; font-size: 10px; white-space: nowrap; color: #9dccb0; }
.wind-indicator .value { color: #ffc14a; font-weight: bold; }
.header-center { display: flex; gap: 6px; flex-wrap: nowrap; }
.stat { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 2px 8px; background: rgba(120, 255, 170, 0.05); border: 1px solid rgba(120, 255, 170, 0.2); border-radius: 4px; min-width: 58px; }
.stat .label { font-size: 8px; color: rgba(190, 255, 214, 0.6); }
.stat .value { font-size: 14px; font-weight: bold; color: #b6ff8a; }
.btn-pause,.btn-shift,.btn-help { min-height: 36px; padding: 6px 8px; background: rgba(255, 193, 74, 0.1); border: 1px solid #ffc14a; border-radius: 6px; color: #ffc14a; font-family: ui-monospace, monospace; font-weight: bold; font-size: 11px; cursor: pointer; white-space: nowrap; }
.btn-shift { border-color: #8ef6c2; color: #d7ffe8; background: rgba(80, 180, 120, 0.12); }
.btn-help { border-color: #ffe14a; color: #ffe14a; background: rgba(255, 225, 74, 0.1); }
.atc-grid { display: grid; grid-template-columns: minmax(0, 1fr) min(360px, 32vw); grid-template-rows: minmax(0, 1fr); gap: 8px; padding: 8px; flex: 1 1 auto; min-height: 0; overflow: hidden; }
.radar-section { display: grid; grid-template-columns: minmax(0, 1fr) 52px; gap: 8px; min-height: 0; min-width: 0; height: 100%; overflow: hidden; }
.altitude-ladder { min-height: 0; overflow: hidden; }
.control-section { display: flex; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden; }
.command-pad { display: flex; flex-direction: column; gap: 4px; min-height: 0; overflow: hidden; padding: 6px; background: rgba(3, 14, 9, 0.96); border: 1px solid rgba(120, 255, 170, 0.28); border-radius: 12px; }
.command-pad.armed { border-color: #ffd15a; box-shadow: 0 0 0 1px rgba(255, 209, 90, 0.35); }
.pad-title { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; min-height: 20px; font-size: 11px; color: #b7d8c4; white-space: nowrap; overflow: hidden; }
.pad-title strong { color: #ffe7a3; font-size: 13px; letter-spacing: 0.04em; }
.pad-row { display: grid; grid-template-columns: repeat(4, minmax(44px, 1fr)); gap: 4px; }
.pad-row.two { grid-template-columns: 1fr 1fr; }
.pad-btn { min-height: 48px; height: 48px; padding: 0 6px; border-radius: 8px; border: 1px solid rgba(140, 255, 186, 0.45); background: #0c2418; color: #e7fff2; font-family: ui-monospace, monospace; font-weight: 700; font-size: 13px; letter-spacing: 0.02em; cursor: pointer; }
.pad-btn:disabled { opacity: 0.4; cursor: default; }
.pad-btn.land { background: #145233; border-color: #3dff9a; color: #e9fff3; }
.pad-btn.go { background: #2a2110; border-color: #ffc14a; color: #ffe1a8; }
.command-box { display: flex; flex-direction: column; flex: 0 0 auto; }
.command-row { display: flex; gap: 4px; align-items: stretch; }
.command-row input { flex: 1; min-width: 0; min-height: 48px; background: #04110b; border: 1px solid rgba(140, 255, 186, 0.4); color: #e7fff2; border-radius: 8px; padding: 0 8px; font-family: ui-monospace, monospace; font-size: 13px; }
.command-row button { min-height: 48px; min-width: 52px; background: rgba(80, 180, 120, 0.16); color: #d7ffe8; border: 1px solid #8ef6c2; border-radius: 8px; font-family: ui-monospace, monospace; font-weight: bold; padding: 0 8px; cursor: pointer; }
.mic-btn { display: inline-flex; align-items: center; justify-content: center; gap: 4px; min-width: 72px; min-height: 48px; padding: 0 8px; border-radius: 8px; border: 2px solid #8ef6c2; background: rgba(80, 180, 120, 0.2); color: #e7fff2; font-family: ui-monospace, monospace; font-weight: bold; font-size: 11px; cursor: pointer; }
.mic-btn.listening { background: #ff3355; border-color: #ffd0d8; color: white; }
.mic-btn.unsupported, .mic-btn:disabled { opacity: 1; border-color: #ffc14a; color: #ffe1a8; background: rgba(255, 193, 74, 0.15); cursor: not-allowed; }
.mic-icon { width: 14px; height: 14px; }
.pad-status { height: 32px; overflow: hidden; font-size: 11px; line-height: 16px; color: #d7ffe8; }
.pad-status p { margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.voice-panel { height: 16px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 11px; color: #d7ffe8; }
.voice-panel p { display: inline; margin: 0 8px 0 0; }
.voice-live { color: #b6ff8a; }
.voice-note, .voice-panel .miss { color: #ffd27a; }
.pad-keys { display: none; margin: 0; font-size: 9px; letter-spacing: 0.02em; color: rgba(190, 255, 214, 0.55); white-space: nowrap; overflow: hidden; }
.emergency-alert { display: flex; gap: 8px; align-items: center; margin: 4px 8px 0; padding: 4px 8px; max-height: 32px; overflow: hidden; background: rgba(255, 40, 40, 0.16); border: 1px solid #ff5a5a; border-radius: 6px; animation: pulse 1s infinite; flex: 0 0 auto; color: #ffd0d0; font-size: 12px; white-space: nowrap; }
.alert-title { font-weight: bold; color: #ff8d8d; font-size: 12px; }
.touchdown-banner { position: absolute; left: 50%; top: 64px; transform: translateX(-50%); z-index: 30; pointer-events: none; padding: 8px 16px; border-radius: 999px; background: rgba(255, 214, 102, 0.95); color: #1a1404; font-weight: 800; letter-spacing: 0.08em; font-size: 16px; }
.gameover-stat { margin: 8px 0; color: #ffb4b4; }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 rgba(255, 0, 0, 0.45); } 50% { box-shadow: 0 0 12px rgba(255, 70, 70, 0.55); } }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.78); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
.modal { background: radial-gradient(circle at 50% 0%, #163528, #07110d 70%); border: 1px solid rgba(140, 255, 186, 0.45); border-radius: 12px; padding: 24px; max-width: min(520px, 100%); max-height: min(80dvh, calc(var(--app-height, 100dvh) - 24px)); display: flex; flex-direction: column; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45); text-align: center; overflow: auto; color: #e7fff2; }
.briefing-content { text-align: left; font-size: 13px; margin: 16px 0; line-height: 1.55; flex: 1; overflow-y: auto; }
.btn-start { margin-top: 16px; min-height: 48px; padding: 12px 24px; background: linear-gradient(135deg, #d6ff78, #7dffa8); border: none; border-radius: 8px; color: #07140c; font-family: ui-monospace, monospace; font-weight: bold; font-size: 14px; cursor: pointer; }
.tutorial-layer { position: fixed; inset: 0; z-index: 40; pointer-events: none; }
.tutorial-ring { position: fixed; border: 2px solid #ffe14a; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55); pointer-events: none; }
.tutorial-ring-secondary { box-shadow: none; border-style: dashed; }
.tutorial-card { position: fixed; left: 16px; top: calc(env(safe-area-inset-top) + 56px); width: min(420px, calc(100vw - 400px)); max-height: 168px; overflow: hidden; pointer-events: auto; background: rgba(6, 16, 12, 0.96); border: 1px solid #ffe14a; border-radius: 12px; padding: 10px 12px; color: #e8fff4; text-align: left; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45); }
.tutorial-card.open { max-height: min(42dvh, 360px); overflow: auto; }
.tutorial-card h2 { margin: 0 0 4px; font-size: 15px; color: #ffe14a; }
.tutorial-card p { margin: 0 0 4px; font-size: 12px; line-height: 1.35; color: #d5fff0; }
.tutorial-kicker { font-size: 10px; letter-spacing: 0.08em; color: #9dffc0; margin-bottom: 2px; }
.tutorial-example { background: #04110b; border: 1px solid rgba(140, 255, 186, 0.35); border-radius: 6px; padding: 6px 8px; font-family: ui-monospace, monospace; }
.tutorial-sheet p { display: flex; gap: 8px; font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.25; margin: 0 0 2px; color: #c8ffe2; }
.tutorial-sheet span { color: #ffc14a; min-width: 64px; }
.tutorial-tips { margin: 0 0 8px; padding-left: 18px; font-size: 12px; line-height: 1.4; }
.tutorial-feedback { background: rgba(120, 255, 170, 0.08); border-left: 3px solid #8ef6c2; padding: 6px 8px; margin-bottom: 8px; }
.tutorial-feedback p { margin: 0; font-size: 12px; }
.tutorial-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.tutorial-actions .btn-start, .tutorial-actions .btn-shift, .tutorial-actions .btn-help { margin-top: 0; min-height: 36px; }
.help-overlay { z-index: 1200; }
.help-modal { text-align: left; width: min(520px, 92vw); }
.atc-setup { background: radial-gradient(circle at 50% -10%, #143628, #050a08 60%); color: #e7fff2; font-family: ui-monospace, monospace; }
.atc-setup h1, .atc-setup h2 { letter-spacing: 0.06em; }
.airport-card { width: 100%; text-align: left; border-radius: 12px; border: 1px solid rgba(140, 255, 186, 0.28); background: rgba(6, 18, 12, 0.92); padding: 14px; color: inherit; min-height: 88px; }
.airport-card.locked { opacity: 0.5; }
@media (min-width: 1100px) and (min-height: 760px) {
  .pad-keys { display: block; }
}
@media (max-width: 1100px), (max-height: 760px) {
  .atc-grid { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; }
  .radar-section { grid-template-columns: minmax(0, 1fr); }
  .altitude-ladder { display: none; }
  .stat-optional { display: none; }
  .tutorial-card { top: calc(env(safe-area-inset-top) + 48px); left: 8px; right: 8px; width: auto; max-height: 132px; }
  .tutorial-card.open { max-height: 34dvh; }
}
@media (max-height: 520px) and (min-width: 640px) {
  .atc-header { max-height: 36px; }
  .atc-grid { grid-template-columns: minmax(0, 1fr) min(268px, 46vw); grid-template-rows: minmax(0, 1fr); gap: 6px; padding: 6px; }
  .pad-btn, .command-row input, .command-row button, .mic-btn { min-height: 44px; height: 44px; }
  .pad-btn { font-size: 11px; padding: 0 3px; }
  .pad-btn.land { font-size: 10px; letter-spacing: 0; }
  .pad-status { height: 16px; }
  .voice-panel { display: none; }
  .command-pad { gap: 3px; padding: 4px; }
  .tutorial-card { top: calc(env(safe-area-inset-top) + 40px); left: 8px; right: auto; width: min(360px, 48vw); max-height: 84px; }
}
@media (max-width: 420px) {
  .airport-name { font-size: 14px; }
  .wind-indicator { display: none; }
  .mic-btn { min-width: 64px; padding: 0 6px; font-size: 10px; }
  .pad-title span { display: none; }
}
`;

if (typeof document !== "undefined") {
  let styleEl = document.getElementById("atc-v2-styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "atc-v2-styles";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = ATC_STYLES;
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
  const [commandFeedback, setCommandFeedback] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [touchdown, setTouchdown] = useState(null);
  const [tutorialIndex, setTutorialIndex] = useState(-1);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [tutorialOffer, setTutorialOffer] = useState(() => (
    shouldOfferTutorial(readTutorialStatus(typeof localStorage === "undefined" ? null : localStorage))
  ));

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
  const tutorialIndexRef = useRef(-1);
  const landedPendingRef = useRef(false);
  const scopeClickConsumedRef = useRef(false);
  const freezeRef = useRef(false);
  const commandRef = useRef(null);

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

  useEffect(() => {
    if (!touchdown) return undefined;
    const timer = setTimeout(() => setTouchdown(null), 2500);
    return () => clearTimeout(timer);
  }, [touchdown]);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    window.__atcPreview = {
      setScene(scene = {}) {
        const planes = (scene.aircraft || []).map((partial, index) => ({
          id: partial.id || `preview-${index}`,
          callsign: partial.callsign || `UAL${index + 1}`,
          x: partial.x || 0,
          y: partial.y || 0,
          altitude: partial.altitude ?? 4000,
          speed: partial.speed ?? 180,
          desiredSpeed: partial.desiredSpeed ?? partial.speed ?? 180,
          desiredAltitude: partial.desiredAltitude ?? partial.altitude ?? 4000,
          heading: partial.heading ?? 240,
          desiredHeading: partial.desiredHeading ?? partial.heading ?? 240,
          actualHeading: partial.actualHeading ?? partial.heading ?? 240,
          status: partial.status || "inbound",
          runway: partial.runway || activeRunwayRef.current || "24L",
          clearedToLand: Boolean(partial.clearedToLand),
          emergency: partial.emergency || null,
          verticalSpeed: partial.verticalSpeed || 0,
          trajectory: partial.trajectory || [],
          aircraft_type: partial.aircraft_type || "B738",
        }));
        aircraftRef.current = planes;
        setAircraft(planes);
        const sel = scene.selectedId === undefined ? (planes[0]?.id || null) : scene.selectedId;
        selectedIdRef.current = sel;
        setSelectedId(sel);
        emergencyRef.current = scene.emergency || null;
        setEmergency(scene.emergency || null);
        if (scene.runway) {
          activeRunwayRef.current = scene.runway;
          setActiveRunway(scene.runway);
        }
        if (scene.tutorial === false) {
          tutorialIndexRef.current = -1;
          setTutorialIndex(-1);
          setTutorialComplete(false);
        }
        freezeRef.current = scene.freeze !== false;
        if (scene.touchdown) setTouchdown({ callsign: scene.touchdown, at: performance.now() });
        if (scene.radio) logRef.current("ATC", scene.radio);
      },
    };
    return () => {
      delete window.__atcPreview;
    };
  }, []);

  const advanceTutorialEvent = (event) => {
    if (tutorialIndexRef.current < 0) return;
    const before = tutorialIndexRef.current;
    const result = advanceTutorial(before, event, landedPendingRef.current);
    landedPendingRef.current = result.landedPending;
    if (result.index === before) return;
    tutorialIndexRef.current = result.index;
    setTutorialIndex(result.index);
    if (before === 0 && result.index === 1) {
      setSelectedId(null);
      selectedIdRef.current = null;
    }
    if (result.finished) {
      setTutorialComplete(true);
      markTutorialStatus(typeof localStorage === "undefined" ? null : localStorage, "done");
      setTutorialOffer(false);
    }
  };
  const advanceRef = useRef(advanceTutorialEvent);
  advanceRef.current = advanceTutorialEvent;

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
      if (gameStateRef.current !== GAME_STATE.ACTIVE || endedRef.current || freezeRef.current) return;

      const dt = clampDelta(rawDt || 0.016);
      const field = airportRef.current;
      const windNow = windRef.current;
      const lesson = tutorialIndexRef.current >= 0;
      const simWind = lesson
        ? { direction: windNow.direction, speed: Math.min(windNow.speed || 0, 6) }
        : windNow;
      const runway = lesson
        ? (activeRunwayRef.current || field?.runways?.[0])
        : selectActiveRunway(field, windNow);
      if (!lesson && runway && runway !== activeRunwayRef.current) {
        activeRunwayRef.current = runway;
        setActiveRunway(runway);
      }

      let planes = aircraftRef.current.map((plane) => ({ ...plane }));
      const landedNow = [];
      const missedNow = [];

      planes.forEach((plane) => {
        const assigned = plane.runway || runway;
        if (lesson && !plane.clearedToLand) keepOnLessonTrack(plane, assigned, field?.elevation || 0);
        if (plane.clearedToLand) guideApproach(plane, assigned, field?.elevation || 0);
        updateAircraftPhysics(plane, simWind, planes, dt);
        plane.trajectory = calculateTrajectory(plane, simWind);
        if (!plane.clearedToLand) return;
        const result = assessLanding(plane, assigned, field?.elevation || 0);
        if (result.landed && !landedIds.has(plane.id)) {
          landedIds.add(plane.id);
          plane.status = "landed";
          landedNow.push(plane);
        } else if (result.missed && lesson) {
          const parked = placeOnExtendedCenterline(assigned, 6, field?.elevation || 0);
          plane.x = parked.x;
          plane.y = parked.y;
          plane.heading = parked.heading;
          plane.actualHeading = parked.heading;
          plane.desiredHeading = parked.heading;
          plane.clearedToLand = true;
          plane.tutorialFinal = true;
          plane.timeScale = 24;
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
      if (!lesson && spawnTimer > 26 && planes.length < maxAircraft) {
        spawnTimer = 0;
        const nextIndex = aircraftCountRef.current;
        aircraftCountRef.current += 1;
        const arrival = createInboundAircraft(nextIndex, field, runway, 26 + (nextIndex % 3) * 4);
        planes.push(arrival);
        sounds.planeContact();
        logRef.current("ATC", `${arrival.callsign} contact approach.`);
      }

      emergencyTimer += rawDt;
      if (!lesson && emergencyTimer > 45 && !emergencyRef.current && planes.length > 0) {
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
        setTouchdown({ callsign: plane.callsign, at: performance.now() });
        logRef.current("ATC", `${plane.callsign} landed.`);
        scoreSession();
        if (tutorialIndexRef.current >= 0) advanceRef.current({ type: "landed" });
      });
      missedNow.forEach((plane) => {
        statsRef.current.failed_landings += 1;
        sounds.warningBeep();
        logRef.current("ATC", `${plane.callsign} missed approach.`);
        const stats = statsSnapshot(statsRef.current, separationRef.current);
        setScore(calculateScore(stats));
        publishSession({ ...stats, score: calculateScore(stats) });
      });

      if (!lesson && collisions.length > 0) {
        statsRef.current.collisions += collisions.length;
        sounds.collision();
        endedRef.current = true;
        setEndReason("Midair collision");
        gameStateRef.current = GAME_STATE.GAMEOVER;
        setGameState(GAME_STATE.GAMEOVER);
        scoreSession("completed");
        return;
      }
      if (!lesson && separationRef.current >= 3) {
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
    if (tutorialIndexRef.current < 0) {
      const runway = selectActiveRunway(airport, initialWind);
      activeRunwayRef.current = runway;
      setActiveRunway(runway);
    }
    let cancelled = false;
    fetchAirportWeather(airport.lat, airport.lng)
      .then((wx) => {
        if (cancelled) return;
        const effects = computeWeatherEffects(wx, airport, weatherIntensity(airport));
        const liveWind = effectsToWind(effects);
        windRef.current = liveWind;
        setWind(liveWind);
        setWeatherEffects(effects);
        if (tutorialIndexRef.current < 0) {
          const liveRunway = selectActiveRunway(airport, liveWind);
          activeRunwayRef.current = liveRunway;
          setActiveRunway(liveRunway);
        }
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

  const bootAircraft = (plane, runway, { tutorial = false, selectFirst = false } = {}) => {
    activeRunwayRef.current = runway;
    setActiveRunway(runway);
    aircraftCountRef.current = 1;
    aircraftRef.current = [plane];
    activePairsRef.current = new Set();
    separationRef.current = 0;
    emergencyRef.current = null;
    endedRef.current = false;
    landedPendingRef.current = false;
    statsRef.current = { ...EMPTY_STATS };
    tutorialIndexRef.current = tutorial ? 0 : -1;
    setTutorialIndex(tutorial ? 0 : -1);
    setTutorialComplete(false);
    setAircraft([plane]);
    setSelectedId(selectFirst ? plane.id : null);
    selectedIdRef.current = selectFirst ? plane.id : null;
    setTime(0);
    setScore(0);
    setLandings(0);
    setSeparationCount(0);
    setEmergency(null);
    setEndReason("");
    setRadioLog([]);
    setCommandFeedback(null);
    setHelpOpen(false);
    gameStateRef.current = GAME_STATE.ACTIVE;
    setGameState(GAME_STATE.ACTIVE);
  };

  const startGame = () => {
    const field = airportRef.current;
    const runway = selectActiveRunway(field, windRef.current) || field?.runways?.[0];
    const first = createInboundAircraft(0, field, runway, 24);
    bootAircraft(first, runway, { selectFirst: false });
    addRadioLog("ATC", `${first.callsign} is inbound runway ${runway}.`);
  };

  const startTutorial = async () => {
    const field = getAirport("KLAX");
    const runway = field.runways[0];
    const created = await api.entities.ATCSession.create({
      status: "active",
      difficulty: field.difficulty,
      level: field.level,
      max_aircraft: 1,
      airport_id: field.id,
      successful_landings: 0,
      failed_landings: 0,
      emergencies_handled: 0,
      collisions: 0,
      separationViolations: 0,
      score: 0,
      tutorial: true,
    });
    sessionRef.current = { ...created, airport: field };
    airportRef.current = field;
    setSession(sessionRef.current);
    setAirport(field);
    setTutorialOffer(false);
    markTutorialStatus(typeof localStorage === "undefined" ? null : localStorage, "started");
    const plane = createTutorialAircraft(field, runway);
    bootAircraft(plane, runway, { tutorial: true });
    addRadioLog("ATC", `${plane.callsign} is your lesson arrival, runway ${runway}.`);
  };

  const dismissTutorialOffer = () => {
    markTutorialStatus(typeof localStorage === "undefined" ? null : localStorage, "skipped");
    setTutorialOffer(false);
  };

  const finishAndLeave = () => {
    const lessonExit = tutorialIndexRef.current >= 0 && statsRef.current.successful_landings === 0;
    if (lessonExit) {
      publishSession({ status: "completed", score: 0 });
    } else if (gameStateRef.current === GAME_STATE.ACTIVE || gameStateRef.current === GAME_STATE.PAUSED) {
      scoreSession("completed");
    }
    endedRef.current = true;
    tutorialIndexRef.current = -1;
    setTutorialIndex(-1);
    setTutorialComplete(false);
    gameStateRef.current = GAME_STATE.SETUP;
    setGameState(GAME_STATE.SETUP);
  };

  const exitTutorial = () => {
    if (!tutorialComplete) {
      markTutorialStatus(typeof localStorage === "undefined" ? null : localStorage, "skipped");
    }
    finishAndLeave();
  };

  const continueFreeFlight = () => {
    const field = airportRef.current;
    const runway = activeRunwayRef.current || field?.runways?.[0];
    tutorialIndexRef.current = -1;
    setTutorialIndex(-1);
    setTutorialComplete(false);
    const arrival = createInboundAircraft(aircraftCountRef.current, field, runway, 24);
    aircraftCountRef.current += 1;
    aircraftRef.current = [arrival];
    setAircraft([arrival]);
    setSelectedId(arrival.id);
    selectedIdRef.current = arrival.id;
    addRadioLog("ATC", `${arrival.callsign} is inbound runway ${runway}. Free flight.`);
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
          clearedToLand: plane.tutorialFinal ? plane.clearedToLand : false,
          status: plane.tutorialFinal ? plane.status : (plane.status === "final" ? "inbound" : plane.status),
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
        applyToAircraft(target.id, (plane) => {
          const next = { ...plane, status: "final", clearedToLand: true, runway };
          if (tutorialIndexRef.current >= 0) {
            const parked = placeOnExtendedCenterline(runway, 8, airportRef.current?.elevation || 0);
            next.x = parked.x;
            next.y = parked.y;
            next.heading = parked.heading;
            next.actualHeading = parked.heading;
            next.desiredHeading = parked.heading;
            next.timeScale = 24;
            next.tutorialFinal = true;
            next.desiredSpeed = Math.min(next.desiredSpeed || 150, 160);
          }
          return next;
        });
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
    advanceTutorialEvent({ type: "command", command: cmd });
  };

  const handleVoiceCommand = (cmd, parsedResult) => {
    if (parsedResult) setCommandFeedback(parsedResult);
    if (!cmd) return;
    addRadioLog("VOICE", `${cmd.callsign || "UNK"} ${cmd.type}`);
    handleCommand(cmd);
    if (parsedResult?.readback) addRadioLog("READBACK", parsedResult.readback);
    advanceTutorialEvent({ type: "voice-command" });
  };

  const submitTypedCommand = (event) => {
    event.preventDefault();
    const text = commandText.trim();
    if (!text) return;
    const selected = aircraftRef.current.find((plane) => plane.id === selectedIdRef.current) || null;
    const lessonStep = TUTORIAL_STEPS[tutorialIndexRef.current];
    const parsed = parseATCCommand(text, aircraftRef.current, selected, {
      runway: selected?.runway || activeRunwayRef.current,
      callsign: selected?.callsign,
      example: exampleFor(lessonStep, { callsign: selected?.callsign, runway: selected?.runway || activeRunwayRef.current }),
    });
    setCommandFeedback(parsed);
    addRadioLog("PILOT", text);
    if (parsed.command) {
      handleCommand(parsed.command);
      addRadioLog("READBACK", parsed.readback);
    } else {
      addRadioLog("ATC", parsed.readback || "Say again.");
    }
    setCommandText("");
  };

  commandRef.current = handleCommand;

  useEffect(() => {
    const typing = (event) => {
      const tag = event.target?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON" || event.target?.isContentEditable;
    };
    const onKeyDown = (event) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || typing(event)) return;
      if (gameStateRef.current !== GAME_STATE.ACTIVE && gameStateRef.current !== GAME_STATE.PAUSED) return;
      const plane = aircraftRef.current.find((item) => item.id === selectedIdRef.current);
      if (!plane) return;
      const shift = event.shiftKey;
      let command = null;
      switch (event.code) {
        case "ArrowLeft":
          command = headingCommand(plane, shift ? -30 : -10);
          break;
        case "ArrowRight":
          command = headingCommand(plane, shift ? 30 : 10);
          break;
        case "ArrowUp":
          command = altitudeCommand(plane, 1000);
          break;
        case "ArrowDown":
          command = altitudeCommand(plane, -1000);
          break;
        case "Minus":
        case "NumpadSubtract":
          command = speedCommand(plane, -20);
          break;
        case "Equal":
        case "NumpadAdd":
          command = speedCommand(plane, 20);
          break;
        case "KeyL":
          command = { type: "cleared_to_land", runway: plane.runway || activeRunwayRef.current };
          break;
        case "KeyG":
          command = { type: "go_around" };
          break;
        default:
          return;
      }
      event.preventDefault();
      commandRef.current?.(command);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
    return (
      <ATCSetup
        onSessionCreated={handleSessionCreated}
        showTutorialOffer={tutorialOffer}
        onStartTutorial={startTutorial}
        onDismissTutorial={dismissTutorialOffer}
      />
    );
  }

  const speechExample = exampleFor(TUTORIAL_STEPS[tutorialIndex], {
    callsign: aircraft.find((plane) => plane.tutorialLesson)?.callsign || selected?.callsign || aircraft[0]?.callsign,
    runway: aircraft.find((plane) => plane.tutorialLesson)?.runway || selected?.runway || activeRunway,
  });

  return (
    <SpeechProvider
      onCommand={handleVoiceCommand}
      aircraft={aircraft}
      selectedPlane={selected}
      activeRunway={activeRunway}
      example={speechExample || ""}
    >
    <div className="atc-v2-container" data-testid="game-shell">
      <div
        data-testid="atc-telemetry"
        data-score={score}
        data-landings={landings}
        data-state={gameState}
        data-active-runway={activeRunway}
        data-tutorial-step={tutorialComplete ? "complete" : (TUTORIAL_STEPS[tutorialIndex]?.id || "off")}
        data-aircraft={JSON.stringify(telemetry)}
        hidden
      />
      {emergency && (
        <div className="emergency-alert" data-testid="emergency-banner">
          <span className="alert-title">EMERGENCY</span>
          <span>{emergency.message}</span>
        </div>
      )}
      {touchdown && (
        <div className="touchdown-banner" data-testid="touchdown-banner">{touchdown.callsign} TOUCHDOWN</div>
      )}

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
          <div className="stat stat-optional"><span className="label">TIME</span><span className="value">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}</span></div>
          <div className="stat stat-optional"><span className="label">AIRCRAFT</span><span className="value">{aircraft.length}/{session?.max_aircraft}</span></div>
          <div className="stat stat-optional"><span className="label">SEP LOSS</span><span className="value">{separationCount}/3</span></div>
        </div>
        <div className="header-right">
          <button type="button" className="btn-help" data-testid="help-button" onClick={() => setHelpOpen(true)}>HELP</button>
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
            onSelectPlane={(id) => {
              if (scopeClickConsumedRef.current) {
                scopeClickConsumedRef.current = false;
                setSelectedId(null);
                selectedIdRef.current = null;
                return;
              }
              setSelectedId(id);
              selectedIdRef.current = id;
              advanceTutorialEvent({ type: "select" });
            }}
            onScopeClick={() => {
              const before = tutorialIndexRef.current;
              advanceTutorialEvent({ type: "scope-click" });
              scopeClickConsumedRef.current = before === 0 && tutorialIndexRef.current !== before;
            }}
            weatherEffects={weatherEffects}
            airport={airport}
            activeRunway={activeRunway}
            touchdown={touchdown}
          />
          <AltitudeLadder selectedPlane={selected} />
        </div>

        <div className="control-section">
          <CommandPad
            selectedPlane={selected}
            activeRunway={activeRunway}
            onCommand={handleCommand}
            commandText={commandText}
            onCommandText={setCommandText}
            onSubmit={submitTypedCommand}
            feedback={commandFeedback}
            lastRadio={radioLog[radioLog.length - 1] || null}
          />
        </div>
      </div>

      {(tutorialIndex >= 0 || tutorialComplete) && (
        <TutorialCoach
          stepIndex={tutorialIndex}
          complete={tutorialComplete}
          example={exampleFor(TUTORIAL_STEPS[tutorialIndex], {
            callsign: aircraft.find((plane) => plane.tutorialLesson)?.callsign || selected?.callsign || aircraft[0]?.callsign,
            runway: aircraft.find((plane) => plane.tutorialLesson)?.runway || selected?.runway || activeRunway,
          })}
          feedback={commandFeedback}
          onSkipVoice={() => advanceTutorialEvent({ type: "voice-skip" })}
          onExit={exitTutorial}
          onFinish={finishAndLeave}
          onPlayFree={continueFreeFlight}
        />
      )}

      <HelpSheet
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        onReplay={() => {
          setHelpOpen(false);
          startTutorial();
        }}
      />

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
    </SpeechProvider>
  );
}
