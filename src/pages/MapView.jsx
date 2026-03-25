import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from "react-leaflet";
import { generateDrone, updateDrone } from "../lib/droneSimulator";
import { Badge } from "@/components/ui/badge";
import { Navigation, ArrowUp, Gauge, Signal } from "lucide-react";
import "leaflet/dist/leaflet.css";

const CENTER = [40.7128, -74.006];

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
  const lastUpdateRef = useRef(Date.now());

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
          center={CENTER}
          zoom={14}
          className="h-full w-full"
          style={{ background: "hsl(222, 47%, 6%)" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          />

          {/* Your position */}
          <Circle
            center={CENTER}
            radius={200}
            pathOptions={{ color: "hsl(199, 89%, 48%)", fillColor: "hsl(199, 89%, 48%)", fillOpacity: 0.05, weight: 1 }}
          />
          <CircleMarker
            center={CENTER}
            radius={6}
            pathOptions={{ color: "hsl(199, 89%, 48%)", fillColor: "hsl(199, 89%, 48%)", fillOpacity: 0.8, weight: 2 }}
          >
            <Popup>
              <div className="font-mono text-xs p-1">
                <div className="font-bold">YOUR POSITION</div>
                <div className="text-gray-500">{CENTER[0].toFixed(4)}, {CENTER[1].toFixed(4)}</div>
              </div>
            </Popup>
          </CircleMarker>

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