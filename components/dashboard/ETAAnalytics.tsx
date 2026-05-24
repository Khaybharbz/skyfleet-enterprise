"use client";

export default function ETAAnalytics({
  nodes,
}: {
  nodes: any[];
}) {
  const avgETA =
    nodes.length > 0
      ? Math.round(
          nodes.reduce(
            (a, b) => a + (b.eta || 0),
            0
          ) / nodes.length
        )
      : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 h-full">

      <h2 className="text-lg font-bold mb-4">
        ⏱ ETA Intelligence
      </h2>

      <div className="space-y-3">

        <div>
          <p className="text-zinc-400 text-sm">
            Average ETA
          </p>

          <p className="text-3xl font-bold text-cyan-400">
            {avgETA}m
          </p>
        </div>

      </div>

    </div>
  );
}