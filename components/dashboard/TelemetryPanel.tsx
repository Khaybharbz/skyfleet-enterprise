"use client";

export default function TelemetryPanel({
  nodes,
}: {
  nodes: any[];
}) {
  const avgHealth =
    nodes.length > 0
      ? Math.round(
          nodes.reduce(
            (a, b) =>
              a + (b.healthScore || 0),
            0
          ) / nodes.length
        )
      : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">

      <h2 className="text-lg font-bold mb-4">
        📡 Fleet Telemetry
      </h2>

      <div className="space-y-3">

        <div>
          <p className="text-zinc-400 text-sm">
            Fleet Health
          </p>

          <p className="text-2xl font-bold text-green-400">
            {avgHealth}%
          </p>
        </div>

        <div>
          <p className="text-zinc-400 text-sm">
            Active Vehicles
          </p>

          <p className="text-2xl font-bold">
            {nodes.length}
          </p>
        </div>

      </div>

    </div>
  );
}