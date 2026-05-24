"use client";

export default function Topbar() {
  return (
    <div className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6">
      <div className="font-semibold">
        Autonomous Logistics Control Tower
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-zinc-400">
          System Online
        </span>
      </div>
    </div>
  );
}