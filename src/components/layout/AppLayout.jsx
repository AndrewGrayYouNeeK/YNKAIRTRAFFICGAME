import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Menu } from "lucide-react";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar open={sidebarOpen} />
      <main className={`flex-1 min-h-screen flex flex-col ${sidebarOpen ? "ml-64" : ""}`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-40 p-2 hover:bg-secondary rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Outlet />
      </main>
    </div>
  );
}