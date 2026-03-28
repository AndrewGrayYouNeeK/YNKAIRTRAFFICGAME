import React, { useMemo } from "react";

export default function ATCRadar({ aircraft, airport, weatherEffects }) {
  const radarSize = 420;
  const center = radarSize / 2;
  const maxRange = 50; // nm

  const getPosition = (lat, lng) => {
    if (!airport || !lat || !lng) {
      // fallback: spread randomly around center
      return { x: center + (Math.random() - 0.5) * 200, y: center + (Math.random() - 0.5) * 200 };
    }
    const scale = (center * 0.8) / 0.5; // 0.5° ≈ 30nm
    const x = center + (lng - airport.lng) * scale;
    const y = center - (lat - airport.lat) * scale;
    return { x, y };
  };

  const getColor = (status) => {
    switch (status) {
      case "emergency": return "#ef4444";
      case "final":     return "#84cc16";
      case "approach":  return "#facc15";
      case "landed":    return "#6b7280";
      default:          return "#06b6d4";
    }
  };

  // Weather visibility affects radar noise
  const fogLevel = weatherEffects ? Math.max(0, 1 - weatherEffects.visibility / 15) : 0;
  const turbulence = weatherEffects?.turbulence || 0;

  // Static noise dots for turbulence effect
  const noiseBlips = useMemo(() => {
    if (turbulence < 0.3) return [];
    return Array.from({ length: Math.round(turbulence * 30) }, (_, i) => ({
      id: i,
      x: Math.random() * radarSize,
      y: Math.random() * radarSize,
      r: Math.random() * 1.5 + 0.5,
    }));
  }, [turbulence]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/30 rounded-lg overflow-hidden relative">
      <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`} className="drop-shadow-lg max-w-full max-h-full">
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#0a1f0a" />
            <stop offset="100%" stopColor="#010a01" />
          </radialGradient>
          <radialGradient id="sweepGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00ff88" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
          </radialGradient>
          {fogLevel > 0 && (
            <filter id="blur">
              <feGaussianBlur stdDeviation={fogLevel * 4} />
            </filter>
          )}
        </defs>

        {/* Radar background */}
        <circle cx={center} cy={center} r={center * 0.97} fill="url(#radarBg)" stroke="#00ff88" strokeWidth="1.5" />

        {/* Range rings */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <g key={scale}>
            <circle cx={center} cy={center} r={center * 0.85 * scale} fill="none" stroke="#00ff88" strokeWidth="0.8" opacity="0.25" />
            <text x={center + 3} y={center - center * 0.85 * scale + 4} fontSize="7" fill="#00ff88" opacity="0.4" fontFamily="monospace">
              {[10, 20, 30, 40][i]}nm
            </text>
          </g>
        ))}

        {/* Cardinal crosshair */}
        {[
          [center, 8, center, 20],
          [center, radarSize - 8, center, radarSize - 20],
          [8, center, 20, center],
          [radarSize - 8, center, radarSize - 20, center],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00ff88" strokeWidth="1" opacity="0.5" />
        ))}
        <text x={center} y="14" textAnchor="middle" fontSize="10" fill="#00ff88" fontFamily="monospace" fontWeight="bold">N</text>
        <text x={center} y={radarSize - 4} textAnchor="middle" fontSize="10" fill="#00ff88" fontFamily="monospace" fontWeight="bold">S</text>
        <text x="10" y={center + 4} fontSize="10" fill="#00ff88" fontFamily="monospace" fontWeight="bold">W</text>
        <text x={radarSize - 10} y={center + 4} textAnchor="end" fontSize="10" fill="#00ff88" fontFamily="monospace" fontWeight="bold">E</text>

        {/* Airport marker */}
        <g>
          <circle cx={center} cy={center} r="5" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          <line x1={center - 8} y1={center} x2={center + 8} y2={center} stroke="#ffffff" strokeWidth="1" />
          <line x1={center} y1={center - 8} x2={center} y2={center + 8} stroke="#ffffff" strokeWidth="1" />
          <text x={center + 7} y={center - 6} fontSize="8" fill="#fff" fontFamily="monospace" opacity="0.8">
            {airport?.id}
          </text>
        </g>

        {/* Turbulence noise blips */}
        {noiseBlips.map((b) => (
          <circle key={b.id} cx={b.x} cy={b.y} r={b.r} fill="#ff8800" opacity={0.15 + Math.random() * 0.15} />
        ))}

        {/* Fog / low vis overlay */}
        {fogLevel > 0 && (
          <circle
            cx={center}
            cy={center}
            r={center * 0.97}
            fill={`rgba(180,220,255,${fogLevel * 0.25})`}
            filter="url(#blur)"
          />
        )}

        {/* Aircraft blips */}
        {aircraft.map((plane) => {
          const pos = getPosition(plane.latitude, plane.longitude);
          const color = getColor(plane.status);
          const hdg = (plane.heading || 0) * (Math.PI / 180);

          return (
            <g key={plane.id} filter={fogLevel > 0.5 ? "url(#blur)" : undefined}>
              {/* Heading vector */}
              <line
                x1={pos.x}
                y1={pos.y}
                x2={pos.x + Math.sin(hdg) * 20}
                y2={pos.y - Math.cos(hdg) * 20}
                stroke={color}
                strokeWidth="1"
                opacity="0.7"
              />
              {/* Aircraft dot */}
              <circle cx={pos.x} cy={pos.y} r="4" fill={color} stroke="#fff" strokeWidth="1" />

              {/* Callsign */}
              <text x={pos.x + 7} y={pos.y - 6} fontSize="9" fill="#ffffff" fontFamily="monospace" fontWeight="bold">
                {plane.callsign}
              </text>
              {/* FL + speed */}
              <text x={pos.x + 7} y={pos.y + 7} fontSize="8" fill={color} fontFamily="monospace">
                FL{Math.round((plane.altitude || 0) / 100)} {plane.speed}kt
              </text>
            </g>
          );
        })}
      </svg>

      {/* Weather overlay label */}
      {weatherEffects?.windSpeed > 0 && (
        <div className="absolute bottom-2 left-2 font-mono text-[9px] text-green-400/60">
          WND {String(weatherEffects.windDir).padStart(3, "0")}°/{weatherEffects.windSpeed}KT
        </div>
      )}
    </div>
  );
}