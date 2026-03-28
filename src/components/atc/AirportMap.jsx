import React from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function makeIcon(html) {
  return L.divIcon({ html, iconSize: [20, 20], className: "" });
}

export default function AirportMap({ airport, aircraft = [], weatherEffects }) {
  const fogOpacity = weatherEffects
    ? Math.max(0, Math.min(0.85, 1 - weatherEffects.visibility / 10))
    : 0;

  const airportIcon = makeIcon(
    `<div style="background:#00ccff;border:2px solid #fff;border-radius:50% 50% 50% 0;width:14px;height:14px;transform:rotate(-45deg)"></div>`
  );

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden" style={{ minHeight: 280 }}>
      <MapContainer
        key={airport.id}
        center={[airport.lat, airport.lng]}
        zoom={14}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%", minHeight: 280 }}
      >
        {/* Esri satellite imagery — free, no API key */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />

        {/* Airport pin */}
        <Marker position={[airport.lat, airport.lng]} icon={airportIcon}>
          <Tooltip permanent={false}>{airport.id} — {airport.name}</Tooltip>
        </Marker>

        {/* Aircraft */}
        {aircraft.map((plane) => {
          if (!plane.latitude || !plane.longitude) return null;
          const color = plane.status === "emergency" ? "#ef4444" : plane.status === "final" ? "#84cc16" : "#06b6d4";
          const icon = makeIcon(
            `<div style="color:${color};font-size:18px;transform:rotate(${plane.heading || 0}deg);line-height:1">✈</div>`
          );
          return (
            <Marker key={plane.id} position={[plane.latitude, plane.longitude]} icon={icon}>
              <Tooltip>
                <b>{plane.callsign}</b> — {plane.altitude?.toLocaleString()}ft · {plane.speed}kts
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Fog overlay */}
      {fogOpacity > 0.1 && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-1000"
          style={{
            background: `rgba(180,200,220,${fogOpacity})`,
            backdropFilter: `blur(${fogOpacity * 6}px)`,
          }}
        />
      )}

      {/* Airport badge */}
      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 pointer-events-none">
        <span className="font-mono text-[9px] text-cyan-400">{airport.id} · {airport.city}</span>
      </div>

      {/* Vis readout */}
      {weatherEffects && (
        <div className={`absolute top-2 right-2 rounded px-2 py-1 backdrop-blur-sm font-mono text-[9px] pointer-events-none ${
          weatherEffects.lowVis ? "bg-red-900/80 text-red-300" : "bg-black/70 text-green-400"
        }`}>
          VIS {weatherEffects.visibility?.toFixed(1)}nm
        </div>
      )}
    </div>
  );
}