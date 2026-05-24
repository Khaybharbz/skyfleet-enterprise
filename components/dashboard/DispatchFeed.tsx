"use client";

import Card from "@/components/ui/Card";

export default function DispatchFeed({
  assignments,
}: any) {
  return (
    <Card title="🧠 AI Dispatch Engine">
      <div className="space-y-2 max-h-[240px] overflow-auto">

        {assignments &&
        Object.keys(assignments).length > 0 ? (
          Object.entries(assignments).map(
            ([shipmentId, data]: any) => (
              <div
                key={shipmentId}
                className="bg-zinc-800 p-2 rounded text-sm"
              >
                <div>
                  Shipment: {shipmentId}
                </div>
                <div>
                  Driver: {data.driverId}
                </div>
                <div className="text-zinc-400 text-xs">
                  Score: {data.score}
                </div>
              </div>
            )
          )
        ) : (
          <div className="text-sm text-zinc-500">
            No active dispatches
          </div>
        )}

      </div>
    </Card>
  );
}