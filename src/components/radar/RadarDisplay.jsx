import React, { useMemo } from "react";
import { motion } from "framer-motion";

const RINGS = [0.25, 0.5, 0.75, 1.0];
const RANGE_LABELS = ["500m", "1km", "1.5km", "2km"];

const threatColors = {
  none: "#22c55e",
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

export default function RadarDisplay({ drones, scanAngle }) {
  const radarSize = "100%";

  const droneBlips = useMemo(() => {
    return drones.map((drone) => {
      const cx = 50 + drone.x * 45;
      const cy = 50 - drone.y * 45;
      return { ...drone, cx, cy };
    });
  }, [drones]);

  return (
    <div className="relative w-full aspect-square max-w-[500px] mx-auto">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 0 20px hsla(199, 89%, 48%, 0.15))" }}
      >
        {/* Background */}
        <circle cx="50" cy="50" r="46" fill="hsl(222, 47%, 6%)" stroke="hsl(215, 25%, 16%)" strokeWidth="0.3" />
        
        {/* Range rings */}
        {RINGS.map((ring, i) => (
          <g key={i}>
            <circle
              cx="50" cy="50" r={ring * 45}
              fill="none"
              stroke="hsl(199, 89%, 48%)"
              strokeWidth="0.15"
              opacity="0.25"
            />
            <text
              x={50 + ring * 45 + 1}
              y="49"
              fill="hsl(199, 89%, 48%)"
              fontSize="2"
              opacity="0.5"
              fontFamily="var(--font-mono)"
            >
              {RANGE_LABELS[i]}
            </text>
          </g>
        ))}

        {/* Crosshairs */}
        <line x1="5" y1="50" x2="95" y2="50" stroke="hsl(199, 89%, 48%)" strokeWidth="0.1" opacity="0.2" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="hsl(199, 89%, 48%)" strokeWidth="0.1" opacity="0.2" />
        <line x1="18" y1="18" x2="82" y2="82" stroke="hsl(199, 89%, 48%)" strokeWidth="0.08" opacity="0.12" />
        <line x1="82" y1="18" x2="18" y2="82" stroke="hsl(199, 89%, 48%)" strokeWidth="0.08" opacity="0.12" />

        {/* Cardinal directions */}
        {[
          { label: "N", x: 50, y: 4 },
          { label: "S", x: 50, y: 98 },
          { label: "E", x: 97, y: 51 },
          { label: "W", x: 3, y: 51 },
        ].map((d) => (
          <text
            key={d.label}
            x={d.x}
            y={d.y}
            fill="hsl(199, 89%, 48%)"
            fontSize="3"
            fontWeight="600"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            opacity="0.6"
          >
            {d.label}
          </text>
        ))}

        {/* Sweep line */}
        <line
          x1="50"
          y1="50"
          x2={50 + Math.cos((scanAngle * Math.PI) / 180) * 45}
          y2={50 - Math.sin((scanAngle * Math.PI) / 180) * 45}
          stroke="hsl(199, 89%, 48%)"
          strokeWidth="0.4"
          opacity="0.7"
        />

        {/* Sweep gradient trail */}
        <defs>
          <linearGradient id="sweepGrad" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(199, 89%, 48%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M 50 50 L ${50 + Math.cos((scanAngle * Math.PI) / 180) * 45} ${50 - Math.sin((scanAngle * Math.PI) / 180) * 45} A 45 45 0 0 0 ${50 + Math.cos(((scanAngle - 30) * Math.PI) / 180) * 45} ${50 - Math.sin(((scanAngle - 30) * Math.PI) / 180) * 45} Z`}
          fill="url(#sweepGrad)"
        />

        {/* Center point */}
        <circle cx="50" cy="50" r="1.2" fill="hsl(199, 89%, 48%)" opacity="0.8" />
        <circle cx="50" cy="50" r="2" fill="none" stroke="hsl(199, 89%, 48%)" strokeWidth="0.2" opacity="0.4" />

        {/* Drone blips */}
        {droneBlips.map((drone) => (
          <g key={drone.id}>
            {/* Pulse ring for threats */}
            {drone.threatLevel !== "none" && drone.threatLevel !== "low" && (
              <circle
                cx={drone.cx}
                cy={drone.cy}
                r="2.5"
                fill="none"
                stroke={threatColors[drone.threatLevel]}
                strokeWidth="0.3"
                opacity="0.4"
                className="pulse-ring"
              />
            )}
            {/* Main blip */}
            <circle
              cx={drone.cx}
              cy={drone.cy}
              r="1"
              fill={threatColors[drone.threatLevel]}
              className="blip-animate"
              style={{ animationDelay: `${Math.random() * 1.5}s` }}
            />
            {/* Blip glow */}
            <circle
              cx={drone.cx}
              cy={drone.cy}
              r="1.8"
              fill={threatColors[drone.threatLevel]}
              opacity="0.15"
            />
            {/* Label */}
            <text
              x={drone.cx + 2}
              y={drone.cy - 1.5}
              fill={threatColors[drone.threatLevel]}
              fontSize="1.6"
              fontFamily="var(--font-mono)"
              opacity="0.8"
            >
              {drone.id}
            </text>
            <text
              x={drone.cx + 2}
              y={drone.cy + 0.5}
              fill="hsl(210, 40%, 70%)"
              fontSize="1.3"
              fontFamily="var(--font-mono)"
              opacity="0.6"
            >
              {drone.distance}m
            </text>
          </g>
        ))}
      </svg>

      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full border border-primary/20 pointer-events-none" />
    </div>
  );
}