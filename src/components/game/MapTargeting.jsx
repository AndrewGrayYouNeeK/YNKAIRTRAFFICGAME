import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, useMap, useMapEvents } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { X, Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";

export default function MapTargeting({ session, onStrike, onCancel }) {
  const [targetLat, setTargetLat] = useState(null);
  const [targetLng, setTargetLng] = useState(null);

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setTargetLat(e.latlng.lat);
        setTargetLng(e.latlng.lng);
      },
    });
    return null;
  }

  function MapUpdater() {
    const map = useMap();
    useEffect(() => {
      map.setView([session.player_lat, session.player_lng], 15);
    }, [map]);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl space-y-3">
        <div className="flex items-center justify-between bg-card border border-border rounded-t-xl p-4">
          <div>
            <h3 className="font-mono text-sm font-bold text-foreground">AIR STRIKE TARGETING</h3>
            <p className="text-[10px] text-muted-foreground mt-1">Click on the map to select target coordinates</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-card border border-border rounded-b-xl overflow-hidden" style={{ height: "400px" }}>
          <MapContainer
            center={[session.player_lat, session.player_lng]}
            zoom={15}
            className="h-full w-full"
            style={{ background: "hsl(222, 47%, 6%)" }}
          >
            <MapUpdater />
            <MapClickHandler />
            <TileLayer
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            />

            {/* Player position */}
            <CircleMarker
              center={[session.player_lat, session.player_lng]}
              radius={6}
              pathOptions={{ color: "hsl(199, 89%, 48%)", fillColor: "hsl(199, 89%, 48%)", fillOpacity: 0.8, weight: 2 }}
            />

            {/* Strike radius preview */}
            {targetLat && targetLng && (
              <>
                <Circle
                  center={[targetLat, targetLng]}
                  radius={300}
                  pathOptions={{ color: "hsl(0, 72%, 51%)", fillColor: "hsl(0, 72%, 51%)", fillOpacity: 0.1, weight: 2, dashArray: "5,5" }}
                />
                <CircleMarker
                  center={[targetLat, targetLng]}
                  radius={8}
                  pathOptions={{ color: "hsl(0, 72%, 51%)", fillColor: "hsl(0, 72%, 51%)", fillOpacity: 0.8, weight: 2 }}
                />
              </>
            )}
          </MapContainer>
        </div>

        {/* Target info and confirmation */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {targetLat && targetLng ? (
            <div className="space-y-3">
              <div className="bg-secondary/30 p-3 rounded-lg text-center">
                <div className="text-[10px] font-mono text-muted-foreground mb-1">TARGET COORDINATES</div>
                <div className="text-xs font-mono font-bold text-foreground">{targetLat.toFixed(4)}, {targetLng.toFixed(4)}</div>
                <div className="text-[10px] text-muted-foreground mt-1">300m blast radius</div>
              </div>
              <Button
                onClick={() => onStrike(targetLat, targetLng)}
                size="lg"
                className="w-full font-mono text-sm bg-red-600 hover:bg-red-700 gap-2"
              >
                <Crosshair className="w-4 h-4" />
                CONFIRM STRIKE
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground font-mono">Click on the map to select strike location</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}