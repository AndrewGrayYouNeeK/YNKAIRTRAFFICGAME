import React, { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Radar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RadarDisplay from "../components/radar/RadarDisplay";
import ThreatBanner from "../components/radar/ThreatBanner";
import DroneCard from "../components/radar/DroneCard";
import StatsBar from "../components/radar/StatsBar";
import ScanControls from "../components/radar/ScanControls";
import DroneDetailPanel from "../components/radar/DroneDetailPanel";
import ActivityLog from "../components/radar/ActivityLog";
import { generateDrone, updateDrone } from "../lib/droneSimulator";
import { ScrollArea } from "@/components/ui/scroll-area";
import RemoteIDPanel from "../components/radar/RemoteIDPanel";
import SignalStrengthBar from "../components/radar/SignalStrengthBar";
import PageHeader from "../components/layout/PageHeader";

export default function Dashboard() {
  const [drones, setDrones] = useState([]);
  const [scanning, setScanning] = useState(true);
  const [scanAngle, setScanAngle] = useState(0);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [events, setEvents] = useState([]);
  const frameRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  const addEvent = useCallback((type, message) => {
    setEvents((prev) => [
      { type, message, timestamp: Date.now() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // Save a drone detection to the database
  const saveDetection = useCallback(async (drone) => {
    base44.entities.DroneDetection.create({
      drone_id: drone.id,
      model: drone.model,
      brand: drone.brand,
      category: drone.category,
      threat_level: drone.threatLevel,
      max_distance: drone.distance,
      max_altitude: drone.altitude,
      max_speed: drone.speed,
      frequency: drone.frequency,
      duration_seconds: 0,
      lat: drone.lat,
      lng: drone.lng,
    });
  }, []);

  // Initial drones
  useEffect(() => {
    const initial = Array.from({ length: 4 }, (_, i) => generateDrone(i));
    setDrones(initial);
    initial.forEach((d) => {
      addEvent("detected", `Contact: ${d.callsign} (${d.model}) at ${d.altitude.toLocaleString()}ft, ${d.speed}kts`);
      saveDetection(d);
    });
  }, [addEvent, saveDetection]);

  // Animation loop
  useEffect(() => {
    if (!scanning) return;

    let animFrame;
    const animate = () => {
      setScanAngle((prev) => (prev + 1.5) % 360);

      const now = Date.now();
      if (now - lastUpdateRef.current > 2000) {
        lastUpdateRef.current = now;

        setDrones((prev) => {
          let updated = prev.map(updateDrone);

          // Randomly add/remove drones
          if (Math.random() < 0.15 && updated.length < 10) {
            const newDrone = generateDrone(updated.length);
            updated = [...updated, newDrone];
            addEvent("detected", `New contact: ${newDrone.callsign} (${newDrone.model}) FL${Math.round(newDrone.altitude/100)}, ${newDrone.speed}kts`);
            saveDetection(newDrone);
          }

          if (Math.random() < 0.08 && updated.length > 2) {
            const removedIdx = Math.floor(Math.random() * updated.length);
            const removed = updated[removedIdx];
            addEvent("lost", `Signal lost: ${removed.id}`);
            updated = updated.filter((_, i) => i !== removedIdx);
          }

          // Check for threat escalation
          updated.forEach((drone) => {
            const old = prev.find((d) => d.id === drone.id);
            if (old && old.threatLevel !== drone.threatLevel) {
              if (["high", "critical"].includes(drone.threatLevel)) {
                addEvent("alert", `⚠ ${drone.id} threat level: ${drone.threatLevel.toUpperCase()} (${drone.distance}m)`);
              }
            }
          });

          return updated;
        });
      }

      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [scanning, addEvent]);

  // Update selected drone reference
  useEffect(() => {
    if (selectedDrone) {
      const updated = drones.find((d) => d.id === selectedDrone.id);
      if (updated) setSelectedDrone(updated);
      else setSelectedDrone(null);
    }
  }, [drones]);

  const highestThreat = drones.reduce((highest, d) => {
    const levels = ["none", "low", "medium", "high", "critical"];
    return levels.indexOf(d.threatLevel) > levels.indexOf(highest) ? d.threatLevel : highest;
  }, "none");

  const threatDroneCount = drones.filter(
    (d) => d.threatLevel === "medium" || d.threatLevel === "high" || d.threatLevel === "critical"
  ).length;

  return (
    <div className="p-6 space-y-5 max-w-[1600px]">
      <PageHeader
        title="Live Scanner"
        subtitle="Real-time aircraft tracking, transponder & RF monitoring"
        icon={Radar}
        actions={
          <ScanControls
            scanning={scanning}
            onToggleScan={() => setScanning(!scanning)}
            onReset={() => {
              setDrones([]);
              setEvents([]);
              setSelectedDrone(null);
              addEvent("signal", "Scanner reset — cleared all contacts");
            }}
          />
        }
      />

      {/* Threat Banner */}
      {(highestThreat === "medium" || highestThreat === "high" || highestThreat === "critical") && (
        <ThreatBanner highestThreat={highestThreat} droneCount={threatDroneCount} />
      )}

      {/* Stats */}
      <StatsBar drones={drones} scanning={scanning} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Radar */}
        <div className="lg:col-span-5 bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">
              RADAR VIEW
            </h3>
            <span className="text-[10px] font-mono text-primary blip-animate">● SCANNING</span>
          </div>
          <RadarDisplay drones={drones} scanAngle={scanAngle} />
        </div>

        {/* Drone Feed */}
        <div className="lg:col-span-4">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">
                LIVE FEED
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">
                {drones.length} contacts
              </span>
            </div>
            <ScrollArea className="h-[500px]">
              <div className="p-3 space-y-2">
                <AnimatePresence>
                  {drones
                    .sort((a, b) => a.distance - b.distance)
                    .map((drone) => (
                      <DroneCard
                        key={drone.id}
                        drone={drone}
                        isSelected={selectedDrone?.id === drone.id}
                        onClick={() =>
                          setSelectedDrone(selectedDrone?.id === drone.id ? null : drone)
                        }
                      />
                    ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Detail & Log */}
        <div className="lg:col-span-3 space-y-4">
          {selectedDrone ? (
            <DroneDetailPanel
              drone={selectedDrone}
              onClose={() => setSelectedDrone(null)}
            />
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="w-10 h-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-3">
                <div className="w-2 h-2 rounded-full bg-primary/40" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">Select an aircraft from the feed</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">to view detailed information</p>
            </div>
          )}

          <ActivityLog events={events} />
        </div>
      </div>

      {/* Bottom Row: RF Signal + Remote ID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SignalStrengthBar drones={drones} />
        <RemoteIDPanel drones={drones} />
      </div>
    </div>
  );
}