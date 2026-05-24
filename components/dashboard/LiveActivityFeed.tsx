"use client";

export default function LiveActivityFeed() {
  const events = [
    "Vehicle DR-102 entered geofence",
    "AI rerouted shipment SH-220",
    "Traffic congestion detected",
    "Dispatch optimization complete",
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-full">

      <h2 className="text-lg font-bold mb-4">
        ⚡ Live Operations Feed
      </h2>

      <div className="space-y-3">

        {events.map((e, i) => (
          <div
            key={i}
            className="text-sm border-b border-zinc-800 pb-2"
          >
            {e}
          </div>
        ))}

      </div>

    </div>
  );
}