import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Navigation, ArrowUp, Gauge, Signal, Radio, Compass, Clock, MapPin, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const threatBadgeStyles = {
  none:     "bg-green-500/10 text-green-400 border-green-500/30",
  low:      "bg-green-500/10 text-green-400 border-green-500/30",
  medium:   "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  high:     "bg-orange-500/10 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
};

function formatTimeSince(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s ago`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
}

export default function DroneDetailPanel({ drone, onClose }) {
  if (!drone) return null;

  const signalStrength = Math.min(100, Math.max(0, ((drone.signal + 95) / 80) * 100));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card border border-border rounded-xl p-5 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-4 h-4 text-primary" />
              <h3 className="font-mono text-sm font-bold tracking-wider">{drone.callsign}</h3>
              <Badge variant="outline" className={`text-[10px] font-mono ${threatBadgeStyles[drone.threatLevel]}`}>
                {drone.threatLevel.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-foreground/80">{drone.model}</p>
            <p className="text-xs text-muted-foreground font-mono">
              {drone.icao} · {drone.category} · {drone.wake} wake turbulence
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-3">
          <DetailItem icon={ArrowUp}    label="Altitude"  value={`${drone.altitude.toLocaleString()} ft MSL`} />
          <DetailItem icon={Gauge}      label="Speed"     value={`${drone.speed} kts IAS`} />
          <DetailItem icon={Compass}    label="Heading"   value={`${drone.heading}° true`} />
          <DetailItem icon={Navigation} label="Distance"  value={`${drone.distance}m`} />
          <DetailItem icon={Radio}      label="Squawk"    value={`${drone.squawk}`} />
          <DetailItem icon={Radio}      label="Frequency" value={drone.frequency} />
          <DetailItem icon={MapPin}     label="Position"  value={`${drone.lat.toFixed(4)}, ${drone.lng.toFixed(4)}`} />
          <DetailItem icon={Clock}      label="Contact"   value={formatTimeSince(drone.firstDetected)} />
        </div>

        {/* Transponder Signal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Transponder Signal</span>
            </div>
            <span className="font-mono text-xs text-foreground">{drone.signal} dBm</span>
          </div>
          <Progress value={signalStrength} className="h-1.5" />
        </div>

        {/* ATC Radio Log */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Radio Traffic</p>
          <div className="bg-black/30 rounded-lg p-3 space-y-2">
            <div>
              <span className="text-[9px] font-mono text-cyan-500 tracking-wider">ATC ▶</span>
              <p className="text-[11px] font-mono text-cyan-300 mt-0.5 leading-relaxed">{drone.atcRadio}</p>
            </div>
            <div className="border-t border-border/30 pt-2">
              <span className="text-[9px] font-mono text-green-500 tracking-wider">PILOT ▶</span>
              <p className="text-[11px] font-mono text-green-300 mt-0.5 leading-relaxed">{drone.pilotRadio}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="bg-secondary/50 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xs font-mono font-medium text-foreground">{value}</div>
    </div>
  );
}