"use client";

import {
  LayoutDashboard,
  Truck,
  Brain,
  MapPin,
  Bell,
  Settings,
} from "lucide-react";

const items = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Fleet", icon: Truck },
  { label: "AI Dispatch", icon: Brain },
  { label: "Geofencing", icon: MapPin },
  { label: "Alerts", icon: Bell },
  { label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="p-5 font-bold text-xl border-b border-zinc-800">
        🚀 SkyFleet AI
      </div>

      <div className="flex-1 p-3 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-900 cursor-pointer"
            >
              <Icon size={18} />
              <span className="text-sm">{item.label}</span>
            </div>
          );
        })}
      </div>

      <div className="p-4 text-xs text-zinc-500 border-t border-zinc-800">
        Control Tower v1.0
      </div>
    </div>
  );
}