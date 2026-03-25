import React from "react";
import { Radar, ShieldCheck, AlertTriangle, Activity } from "lucide-react";

export default function StatsBar({ drones, scanning }) {
  const activeCount = drones.length;
  const threats = drones.filter(d => d.threatLevel === "high" || d.threatLevel === "critical").length;
  const avgDistance = activeCount > 0 
    ? Math.round(drones.reduce((sum, d) => sum + d.distance, 0) / activeCount) 
    : 0;
  const maxAlt = activeCount > 0 
    ? Math.max(...drones.map(d => d.altitude)) 
    : 0;

  const stats = [
    { 
      icon: Radar, 
      label: "Scanning", 
      value: scanning ? "ACTIVE" : "PAUSED", 
      color: scanning ? "text-primary" : "text-muted-foreground" 
    },
    { 
      icon: Activity, 
      label: "Detected", 
      value: activeCount, 
      color: "text-foreground" 
    },
    { 
      icon: AlertTriangle, 
      label: "Threats", 
      value: threats, 
      color: threats > 0 ? "text-orange-400" : "text-green-400" 
    },
    { 
      icon: ShieldCheck, 
      label: "Avg Distance", 
      value: `${avgDistance}m`, 
      color: "text-foreground" 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3"
        >
          <div className="p-2 rounded-md bg-primary/5">
            <stat.icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </div>
            <div className={`text-sm font-mono font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}