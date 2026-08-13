import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from "react-leaflet";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { generateDrone, updateDrone } from "../lib/droneSimulator";
import { Badge } from "@/components/ui/badge";
import { Navigation, ArrowUp, Gauge, Signal } from "lucide-react";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [40.7128, -74.006];

const threatColors = {
  none: "#22c55e",
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapView() {
  const [drones, setDrones] = useState([]);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const lastUpdateRef = useRef(Date.now());

  // Fetch active game sessions to get real player locations
  const { data: gameSessions = [] } = useQuery({
    queryKey: ["active-game-sessions"],
    queryFn: () => api.entities.GameSession.filter({ status: "active" }, "-created_date", 10),
    refetchInterval: 5000,
  });

  // Set map center to first active player or default
  useEffect(() => {
    if (gameSessions.length > 0 && gameSessions[0].player_lat && gameSessions[0].player_lng) {
      setCenter([gameSessions[0].player_lat, gameSessions[0].player_lng]);
    }
  }, [gameSessions]);

  useEffect(() => {
    setDrones(Array.from({ length: 5 }, (_, i) => generateDrone(i)));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDrones((prev) => {
        let updated = prev.map(updateDrone);
        if (Math.random() < 0.1 && updated.length < 10) {
          updated = [...updated, generateDrone(updated.length)];
        }
        if (Math.random() < 0.05 && updated.length > 2) {
          updated = updated.filter((_, i) => i !== Math.floor(Math.random() * updated.length));
        }
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Map View</h2>
        <p className="text-xs font-mono text-muted-foreground">
          Geographic drone position tracking
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
        <MapContainer
          center={center}
          zoom={14}
          className="h-full w-full"
          style={{ background: "hsl(222, 47%, 6%)" }}
        >
          <MapUpdater center={center} />
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          />

          {/* Active player positions */}
          {gameSessions.map((session) => {
            const playerPos = [session.player_lat, session.player_lng];
            return (
              <React.Fragment key={session.id}>
                <Circle
                  center={playerPos}
                  radius={200}
                  pathOptions={{ color: "hsl(199, 89%, 48%)", fillColor: "hsl(199, 89%, 48%)", fillOpacity: 0.05, weight: 1 }}
                />
                <CircleMarker
                  center={playerPos}
                  radius={6}
                  pathOptions={{ color: "hsl(199, 89%, 48%)", fillColor: "hsl(199, 89%, 48%)", fillOpacity: 0.8, weight: 2 }}
                >
                  <Popup>
                    <div className="font-mono text-xs p-1 min-w-[180px]">
                      <div className="font-bold">PLAYER DEFENDING</div>
                      <div className="text-gray-500 text-[10px] mb-1">{playerPos[0].toFixed(4)}, {playerPos[1].toFixed(4)}</div>
                      <div className="text-[10px] space-y-0.5 border-t border-gray-600 pt-1 mt-1">
                        <div className="flex justify-between"><span>Wave:</span><span>{session.current_wave}/{session.total_waves}</span></div>
                        <div className="flex justify-between"><span>Health:</span><span>{session.health}%</span></div>
                        <div className="flex justify-between"><span>Status:</span><span>{session.status}</span></div>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}

          {/* Drone markers */}
          {drones.map((drone) => (
            <CircleMarker
              key={drone.id}
              center={[drone.lat, drone.lng]}
              radius={8}
              pathOptions={{
                color: threatColors[drone.threatLevel],
                fillColor: threatColors[drone.threatLevel],
                fillOpacity: 0.6,
                weight: 2,
              }}
            >
              <Popup>
                <div className="font-mono text-xs p-1 min-w-[160px]">
                  <div className="font-bold text-sm mb-2">{drone.id}</div>
                  <div className="text-gray-600 mb-2">{drone.model}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Distance:</span>
                      <span className="font-medium">{drone.distance}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Altitude:</span>
                      <span className="font-medium">{drone.altitude}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Speed:</span>
                      <span className="font-medium">{drone.speed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Threat:</span>
                      <span className="font-medium" style={{ color: threatColors[drone.threatLevel] }}>
                        {drone.threatLevel.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}