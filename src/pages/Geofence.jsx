import React, { useState } from "react";
import { MapContainer, TileLayer, Circle, Polygon, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Edit3, AlertTriangle, Lock } from "lucide-react";
import "leaflet/dist/leaflet.css";

const CENTER = [40.7128, -74.006];

const ZONE_PRESETS = [
  { label: "Critical Zone", radius: 200, color: "#ef4444", threat: "critical", description: "No-fly restricted perimeter" },
  { label: "Restricted Zone", radius: 500, color: "#f97316", threat: "high", description: "Authorized personnel only" },
  { label: "Warning Zone", radius: 1000, color: "#eab308", threat: "medium", description: "Monitoring boundary" },
  { label: "Awareness Zone", radius: 2000, color: "#22c55e", threat: "low", description: "Outer detection perimeter" },
];

const defaultZones = [
  { id: 1, name: "Headquarters Perimeter", radius: 200, color: "#ef4444", threat: "critical", lat: 40.7128, lng: -74.006, active: true },
  { id: 2, name: "Restricted Airspace", radius: 600, color: "#f97316", threat: "high", lat: 40.7128, lng: -74.006, active: true },
  { id: 3, name: "Outer Warning Ring", radius: 1200, color: "#eab308", threat: "medium", lat: 40.7128, lng: -74.006, active: true },
];

const threatStyles = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/10 text-green-400 border-green-500/30",
};

export default function Geofence() {
  const [zones, setZones] = useState(defaultZones);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [placing, setPlacing] = useState(false);

  const handleAddZone = (preset) => {
    setSelectedPreset(preset);
    setPlacing(true);
  };

  const handleMapClick = (latlng) => {
    if (!placing || !selectedPreset) return;
    const newZone = {
      id: Date.now(),
      name: selectedPreset.label,
      radius: selectedPreset.radius,
      color: selectedPreset.color,
      threat: selectedPreset.threat,
      lat: latlng.lat,
      lng: latlng.lng,
      active: true,
    };
    setZones((prev) => [...prev, newZone]);
    setPlacing(false);
    setSelectedPreset(null);
  };

  const toggleZone = (id) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, active: !z.active } : z)));
  };

  const deleteZone = (id) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  function MapClickHandler() {
    useMapEvents({ click: (e) => handleMapClick(e.latlng) });
    return null;
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Geofence Manager</h2>
          <p className="text-xs font-mono text-muted-foreground">Define & manage protected airspace zones</p>
        </div>
        {placing && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-primary blip-animate" />
            <span className="text-xs font-mono text-primary">Click map to place {selectedPreset?.label}</span>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setPlacing(false); setSelectedPreset(null); }}>Cancel</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map */}
        <div className="lg:col-span-8 bg-card border border-border rounded-xl overflow-hidden" style={{ height: 520 }}>
          <MapContainer center={CENTER} zoom={14} className="h-full w-full" style={{ cursor: placing ? "crosshair" : "grab" }}>
            <TileLayer
              attribution='&copy; Stadia Maps'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            />
            <MapClickHandler />
            {zones.filter((z) => z.active).map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.radius}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: zone.threat === "critical" ? undefined : "6 4",
                }}
              />
            ))}
          </MapContainer>
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 space-y-4">
          {/* Add Zone Presets */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-primary" /> ADD ZONE
            </h3>
            <div className="space-y-2">
              {ZONE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleAddZone(preset)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                    selectedPreset?.label === preset.label
                      ? "border-primary/40 bg-primary/5"
                      : "border-border hover:border-border/80 hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                    <span className="text-xs font-mono font-semibold">{preset.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{preset.radius}m</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 ml-4">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Active Zones */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="font-mono text-xs font-semibold tracking-wider text-foreground/80">ACTIVE ZONES</h3>
              <span className="text-[10px] font-mono text-muted-foreground">{zones.filter(z => z.active).length}/{zones.length}</span>
            </div>
            <div className="p-3 space-y-2">
              {zones.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No zones defined</p>
              ) : (
                zones.map((zone) => (
                  <div key={zone.id} className={`rounded-lg border px-3 py-2.5 transition-all ${zone.active ? "bg-secondary/20 border-border" : "border-border/30 opacity-40"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                        <span className="text-xs font-mono font-medium">{zone.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleZone(zone.id)} className={`p-1 rounded transition-colors ${zone.active ? "text-primary hover:text-primary/70" : "text-muted-foreground"}`}>
                          <Shield className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteZone(zone.id)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 ml-4">
                      <Badge variant="outline" className={`text-[9px] ${threatStyles[zone.threat]}`}>{zone.threat.toUpperCase()}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{zone.radius}m radius</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}