"use client";

export default function AIControlPanel() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">

      <h2 className="text-lg font-bold mb-4">
        🤖 AI Dispatch Engine
      </h2>

      <div className="space-y-3 text-sm">

        <div className="flex justify-between">
          <span>Optimization</span>
          <span className="text-green-400">
            ACTIVE
          </span>
        </div>

        <div className="flex justify-between">
          <span>Routing ML</span>
          <span className="text-green-400">
            RUNNING
          </span>
        </div>

        <div className="flex justify-between">
          <span>ETA Engine</span>
          <span className="text-green-400">
            LIVE
          </span>
        </div>

        <div className="flex justify-between">
          <span>Auto Dispatch</span>
          <span className="text-yellow-400">
            ENABLED
          </span>
        </div>

      </div>

    </div>
  );
}