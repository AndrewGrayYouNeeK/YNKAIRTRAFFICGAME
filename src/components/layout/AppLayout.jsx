import React from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar />
      <main className="ml-64 flex-1 min-h-screen flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}