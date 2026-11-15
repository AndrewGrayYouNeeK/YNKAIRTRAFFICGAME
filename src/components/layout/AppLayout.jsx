import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import AppSidebar from "./AppSidebar";
import { Menu } from "lucide-react";

function useCompactViewport() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1100px), (max-height: 760px)");
    const apply = () => setCompact(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return compact;
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const compact = useCompactViewport();
  const onScope = useLocation().pathname === "/";
  const immersive = onScope && compact;

  if (Capacitor.isNativePlatform()) {
    return (
      <div className="native-shell min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {!immersive && <AppSidebar open={sidebarOpen} />}
      <main className={`flex-1 min-h-screen flex flex-col ${sidebarOpen && !immersive ? "ml-64" : ""}`}>
        {!immersive && (
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed top-4 left-4 z-40 p-2 hover:bg-secondary rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Outlet />
      </main>
    </div>
  );
}