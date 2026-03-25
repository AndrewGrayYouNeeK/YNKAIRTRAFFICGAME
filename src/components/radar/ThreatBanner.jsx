import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, Radio } from "lucide-react";

const threatConfig = {
  critical: {
    bg: "bg-destructive/10 border-destructive/40",
    text: "text-destructive",
    icon: ShieldAlert,
    label: "CRITICAL THREAT",
    description: "Unidentified drone in restricted proximity",
  },
  high: {
    bg: "bg-orange-500/10 border-orange-500/40",
    text: "text-orange-400",
    icon: AlertTriangle,
    label: "HIGH ALERT",
    description: "Drone detected within 200m radius",
  },
  medium: {
    bg: "bg-yellow-500/10 border-yellow-500/40",
    text: "text-yellow-400",
    icon: Radio,
    label: "PROXIMITY WARNING",
    description: "Drone approaching detection zone",
  },
};

export default function ThreatBanner({ highestThreat, droneCount }) {
  const config = threatConfig[highestThreat];

  if (!config) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${config.bg} border rounded-lg px-4 py-3 flex items-center gap-3`}
      >
        <config.icon className={`w-5 h-5 ${config.text} shrink-0 blip-animate`} />
        <div className="flex-1 min-w-0">
          <div className={`font-mono text-xs font-bold tracking-widest ${config.text}`}>
            {config.label}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {config.description} — {droneCount} active target{droneCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className={`font-mono text-xs ${config.text} shrink-0`}>
          ● LIVE
        </div>
      </motion.div>
    </AnimatePresence>
  );
}