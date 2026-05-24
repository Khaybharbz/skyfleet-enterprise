"use client";

import { useState } from "react";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

import FleetMap from "@/components/maps/FleetMap";

import KPIGrid from "@/components/dashboard/KPIGrid";
import AlertPanel from "@/components/dashboard/AlertPanel";
import DispatchFeed from "@/components/dashboard/DispatchFeed";
import FleetTable from "@/components/dashboard/FleetTable";

import TelemetryPanel from "@/components/dashboard/TelemetryPanel";
import ETAAnalytics from "@/components/dashboard/ETAAnalytics";
import AIControlPanel from "@/components/dashboard/AIControlPanel";
import LiveActivityFeed from "@/components/dashboard/LiveActivityFeed";

import { useFleetSocket } from "@/hooks/useFleetSocket";

export default function AdminPage() {
  const [fleet, setFleet] = useState({
    nodes: [],
    assignments: {},
    alerts: [],
  });

  useFleetSocket((state: any) => {
    setFleet(state);
  });

  return (
    <div className="h-screen flex bg-[#050816] text-white overflow-hidden">

      {/* =========================
          SIDEBAR
      ========================= */}
      <Sidebar />

      {/* =========================
          MAIN AREA
      ========================= */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR */}
        <Topbar />

        {/* CONTENT */}
        <div className="flex-1 overflow-auto p-4 space-y-4">

          {/* KPI GRID */}
          <KPIGrid fleet={fleet} />

          {/* =========================
              MAIN OPERATIONS GRID
          ========================= */}
          <div className="grid grid-cols-12 gap-4">

            {/* ================= MAP ================= */}
            <div className="col-span-8">

              <div className="h-[680px] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
                <FleetMap nodes={fleet.nodes} />
              </div>

            </div>

            {/* ================= RIGHT OPS PANEL ================= */}
            <div className="col-span-4 flex flex-col gap-4">

              <AIControlPanel />

              <TelemetryPanel nodes={fleet.nodes} />

              <AlertPanel alerts={fleet.alerts} />

            </div>

          </div>

          {/* =========================
              ANALYTICS GRID
          ========================= */}
          <div className="grid grid-cols-12 gap-4">

            {/* ETA */}
            <div className="col-span-4">
              <ETAAnalytics nodes={fleet.nodes} />
            </div>

            {/* DISPATCH */}
            <div className="col-span-4">
              <DispatchFeed
                assignments={fleet.assignments}
              />
            </div>

            {/* LIVE EVENTS */}
            <div className="col-span-4">
              <LiveActivityFeed />
            </div>

          </div>

          {/* =========================
              FLEET TABLE
          ========================= */}
          <FleetTable nodes={fleet.nodes} />

        </div>
      </div>
    </div>
  );
}