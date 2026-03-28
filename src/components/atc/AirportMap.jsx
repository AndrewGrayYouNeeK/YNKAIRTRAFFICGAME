import React, { useEffect, useRef } from "react";

// Leaflet-based airport map with satellite tiles (no Google Maps API key needed)
// Uses Esri World Imagery which is free for non-commercial use

export default function AirportMap({ airport, aircraft = [], weatherEffects }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically load leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then((L) => {
      // Destroy existing map
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapRef.current, {
        center: [airport.lat, airport.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // Satellite imagery (Esri World Imagery — free, no API key)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri", maxZoom: 19 }
      ).addTo(map);

      // Airport marker
      const airportIcon = L.divIcon({
        html: `<div style="background:#00ccff;border:2px solid #fff;border-radius:50% 50% 50% 0;width:14px;height:14px;transform:rotate(-45deg)"></div>`,
        iconSize: [14, 14],
        className: "",
      });
      L.marker([airport.lat, airport.lng], { icon: airportIcon })
        .addTo(map)
        .bindTooltip(`<b>${airport.id}</b> ${airport.name}`, { permanent: false });

      leafletMapRef.current = map;
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [airport.id]);

  // Update aircraft markers
  useEffect(() => {
    if (!leafletMapRef.current) return;
    import("leaflet").then((L) => {
      const map = leafletMapRef.current;
      if (!map) return;

      // Clear old markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      aircraft.forEach((plane) => {
        if (!plane.latitude || !plane.longitude) return;
        const color = plane.status === "emergency" ? "#ef4444" : plane.status === "final" ? "#84cc16" : "#06b6d4";
        const icon = L.divIcon({
          html: `<div style="color:${color};font-size:16px;transform:rotate(${plane.heading || 0}deg)">✈</div>`,
          iconSize: [20, 20],
          className: "",
        });
        const marker = L.marker([plane.latitude, plane.longitude], { icon })
          .addTo(map)
          .bindTooltip(`<b>${plane.callsign}</b><br>${plane.altitude?.toLocaleString()}ft · ${plane.speed}kts`, {
            permanent: false,
          });
        markersRef.current[plane.id] = marker;
      });
    });
  }, [aircraft]);

  // Overlay fog based on weather
  const fogOpacity = weatherEffects ? Math.max(0, Math.min(0.85, 1 - weatherEffects.visibility / 10)) : 0;

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: 280 }} />

      {/* Weather overlay */}
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
      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
        <span className="font-mono text-[9px] text-cyan-400">{airport.id} · {airport.city}</span>
      </div>

      {/* Vis readout */}
      {weatherEffects && (
        <div className={`absolute top-2 right-2 rounded px-2 py-1 backdrop-blur-sm font-mono text-[9px] ${
          weatherEffects.lowVis ? "bg-red-900/80 text-red-300" : "bg-black/70 text-green-400"
        }`}>
          VIS {weatherEffects.visibility?.toFixed(1)}nm
        </div>
      )}
    </div>
  );
}