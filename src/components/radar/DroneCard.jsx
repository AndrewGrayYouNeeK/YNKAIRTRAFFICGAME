import React from "react";
import { motion } from "framer-motion";
import { 
  Navigation, 
  ArrowUp, 
  Gauge, 
  Signal, 
  Radio,
  Compass,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const threatBadgeStyles = {
  none: "bg-green-500/10 text-green-400 border-green-500/30",
  low: "bg-green-500/10 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
};

function formatTimeSince(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function DroneCard({ drone, isSelected, onClick }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      className={`rounded-lg border p-3 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "bg-primary/5 border-primary/40"
          : "bg-card border-border hover:border-primary/20 hover:bg-card/80"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary blip-animate" />
          <span className="font-mono text-xs font-semibold text-foreground tracking-wide">
            {drone.id}
          </span>
        </div>
        <Badge variant="outline" className={`text-[10px] font-mono ${threatBadgeStyles[drone.threatLevel]}`}>
          {drone.threatLevel.toUpperCase()}
        </Badge>
      </div>

      {/* Model */}
      <div className="text-sm font-medium text-foreground/80 mb-1">{drone.model}</div>
      <div className="text-[10px] text-muted-foreground font-mono mb-3">
        {drone.brand} · {drone.category}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <StatItem icon={Navigation} label="Distance" value={`${drone.distance}m`} />
        <StatItem icon={ArrowUp} label="Altitude" value={`${drone.altitude}m`} />
        <StatItem icon={Gauge} label="Speed" value={`${drone.speed} km/h`} />
        <StatItem icon={Compass} label="Bearing" value={`${drone.bearing}°`} />
        <StatItem icon={Signal} label="Signal" value={`${drone.signal} dBm`} />
        <StatItem icon={Radio} label="Freq" value={drone.frequency} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-mono">
          Detected {formatTimeSince(drone.firstDetected)}
        </span>
      </div>
    </motion.div>
  );
}

function StatItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-mono text-foreground/90 ml-auto">{value}</span>
    </div>
  );
}