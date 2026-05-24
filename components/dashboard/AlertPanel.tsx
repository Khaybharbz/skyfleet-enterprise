"use client";

import Card from "@/components/ui/Card";

export default function AlertPanel({ alerts }: any) {
  return (
    <Card title="🚨 Alerts">
      <div className="space-y-2 max-h-[240px] overflow-auto">

        {alerts?.length === 0 && (
          <div className="text-sm text-zinc-500">
            No active alerts
          </div>
        )}

        {alerts?.map((a: any, i: number) => (
          <div
            key={i}
            className="bg-zinc-800 p-2 rounded text-sm"
          >
            Node {a.nodeId} —{" "}
            {a.inside
              ? "Inside Geofence"
              : "Outside Zone"}
          </div>
        ))}

      </div>
    </Card>
  );
}