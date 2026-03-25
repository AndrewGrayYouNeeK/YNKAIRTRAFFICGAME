import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Radar, Map, Clock, Shield, Settings } from "lucide-react";

const navItems = [
  { path: "/", icon: Radar, label: "Scanner" },
  { path: "/map", icon: Map, label: "Map View" },
  { path: "/history", icon: Clock, label: "History" },
];

export default function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-16 md:w-56 bg-card border-r border-border flex flex-col z-30">
      {/* Logo */}
      <div className="p-3 md:p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-sm tracking-tight text-foreground">AirGuard</h1>
            <p className="text-[10px] font-mono text-muted-foreground tracking-wider">DRONE DETECTION</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 md:p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span className="text-sm font-medium hidden md:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-3 md:p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 blip-animate" />
          <span className="text-[10px] font-mono text-muted-foreground hidden md:block">SYSTEM ONLINE</span>
        </div>
      </div>
    </aside>
  );
}