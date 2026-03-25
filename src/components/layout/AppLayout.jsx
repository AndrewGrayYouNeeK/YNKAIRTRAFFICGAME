import React from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="ml-16 md:ml-56 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}