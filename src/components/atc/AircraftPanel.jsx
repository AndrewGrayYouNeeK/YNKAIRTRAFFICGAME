import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export default function AircraftPanel({ aircraft, session }) {
  const statusColor = {
    cruising: "text-cyan-400",
    descending: "text-yellow-400",
    landing: "text-green-400",
    landed: "text-gray-400",
    emergency: "text-red-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-black/30 border rounded p-2 ${
        aircraft.status === "emergency" ? "border-red-500" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {aircraft.status === "emergency" && (
              <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
            )}
            <p className={`text-xs font-mono font-bold ${statusColor[aircraft.status]}`}>
              {aircraft.callsign}
            </p>
            <span className="text-[9px] font-mono text-muted-foreground">
              {aircraft.status.toUpperCase()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-muted-foreground">
            <div>ALT: {Math.round(aircraft.altitude / 100)}00 ft</div>
            <div>HDG: {Math.round(aircraft.heading)}°</div>
            <div>SPD: {Math.round(aircraft.speed)} kts</div>
            <div>DST: {aircraft.destination || "—"}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}