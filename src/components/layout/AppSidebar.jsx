import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Radar, Map, Clock, Shield, BarChart2, Eye, AlertTriangle, Crosshair, Gamepad2 } from "lucide-react";

const navGroups = [
  {
    label: "GAME",
    items: [
      { path: "/game", icon: Gamepad2, label: "Paranormal Defense", description: "AR survival game" },
    ],
  },
  {
    label: "MONITORING",
    items: [
      { path: "/", icon: Radar, label: "Live Scanner", description: "Real-time radar feed" },
      { path: "/map", icon: Map, label: "Map View", description: "Geographic tracking" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { path: "/geofence", icon: Crosshair, label: "Geofence", description: "Security zones" },
      { path: "/watchlist", icon: Eye, label: "Watchlist", description: "Flagged targets" },
      { path: "/incidents", icon: AlertTriangle, label: "Incidents", description: "Event log" },
    ],
  },
  {
    label: "REPORTS",
    items: [
      { path: "/analytics", icon: BarChart2, label: "Analytics", description: "Detection trends" },
      { path: "/history", icon: Clock, label: "History", description: "Past detections" },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col z-30">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-foreground leading-none">AirSentinel</h1>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5 tracking-wider">DRONE DEFENSE SYSTEM</p>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-mono font-semibold text-muted-foreground/50 tracking-widest uppercase">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                      isActive
                        ? "bg-primary/12 text-primary border border-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "group-hover:text-foreground"}`} />
                    <div className="min-w-0">
                      <div className={`text-sm font-medium leading-none ${isActive ? "text-primary" : ""}`}>
                        {item.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{item.description}</div>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Status */}
      <div className="px-5 py-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 blip-animate shrink-0" />
            <span className="text-xs font-mono text-muted-foreground">SYSTEM ONLINE</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/40">v2.4</span>
        </div>
      </div>
    </aside>
  );
}