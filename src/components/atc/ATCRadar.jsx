import React, { useMemo } from "react";

export default function ATCRadar({ aircraft }) {
  const radarSize = 400;
  const center = radarSize / 2;
  const maxRange = 50; // nm

  const getPosition = (heading, distance) => {
    const angle = (heading - 90) * (Math.PI / 180);
    const x = center + (distance / maxRange) * (center * 0.8) * Math.cos(angle);
    const y = center + (distance / maxRange) * (center * 0.8) * Math.sin(angle);
    return { x, y };
  };

  const getColor = (status) => {
    switch (status) {
      case "emergency":
        return "#ef4444";
      case "landing":
        return "#84cc16";
      case "cruising":
        return "#06b6d4";
      default:
        return "#8b5cf6";
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg overflow-hidden">
      <svg width={radarSize} height={radarSize} className="drop-shadow-lg">
        {/* Background */}
        <circle cx={center} cy={center} r={center * 0.95} fill="#1a1a2e" stroke="#00ff88" strokeWidth="2" />

        {/* Range rings */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={center}
            cy={center}
            r={center * 0.8 * scale}
            fill="none"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {/* Cardinal directions */}
        <text x={center} y="15" textAnchor="middle" className="text-[12px] fill-[#00ff88] font-mono font-bold">
          N
        </text>
        <text x={radarSize - 10} y={center + 5} textAnchor="end" className="text-[12px] fill-[#00ff88] font-mono font-bold">
          E
        </text>
        <text x={center} y={radarSize - 5} textAnchor="middle" className="text-[12px] fill-[#00ff88] font-mono font-bold">
          S
        </text>
        <text x="10" y={center + 5} className="text-[12px] fill-[#00ff88] font-mono font-bold">
          W
        </text>

        {/* Crosshair */}
        <line x1={center} y1={center - 30} x2={center} y2="0" stroke="#00ff88" strokeWidth="1" opacity="0.5" />
        <line x1={center + 30} y1={center} x2={radarSize} y2={center} stroke="#00ff88" strokeWidth="1" opacity="0.5" />
        <line x1={center} y1={center + 30} x2={center} y2={radarSize} stroke="#00ff88" strokeWidth="1" opacity="0.5" />
        <line x1={center - 30} y1={center} x2="0" y2={center} stroke="#00ff88" strokeWidth="1" opacity="0.5" />

        {/* Aircraft */}
        {aircraft.map((plane) => {
          const pos = getPosition(plane.heading || 0, plane.latitude + plane.longitude || 10);
          const color = getColor(plane.status);

          return (
            <g key={plane.id}>
              {/* Aircraft symbol */}
              <circle cx={pos.x} cy={pos.y} r="4" fill={color} stroke="#fff" strokeWidth="1" />
              
              {/* Trail */}
              <line
                x1={pos.x}
                y1={pos.y}
                x2={pos.x + Math.cos(plane.heading * Math.PI / 180) * 15}
                y2={pos.y + Math.sin(plane.heading * Math.PI / 180) * 15}
                stroke={color}
                strokeWidth="1"
                opacity="0.5"
              />

              {/* Callsign label */}
              <text
                x={pos.x + 8}
                y={pos.y - 8}
                className="text-[10px] fill-[#fff] font-mono font-bold"
              >
                {plane.callsign}
              </text>

              {/* Altitude */}
              <text
                x={pos.x + 8}
                y={pos.y + 8}
                className="text-[9px] fill-[#fff] font-mono"
              >
                {Math.round(plane.altitude / 100)}00ft
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}