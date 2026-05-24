"use client";

import Card from "@/components/ui/Card";

export default function KPIGrid({ fleet }: any) {
  return (
    <div className="grid grid-cols-4 gap-4">

      <Card title="Active Fleet Nodes">
        <div className="text-2xl font-bold">
          {fleet.nodes.length}
        </div>
      </Card>

      <Card title="AI Assignments">
        <div className="text-2xl font-bold">
          {Object.keys(fleet.assignments || {}).length}
        </div>
      </Card>

      <Card title="Alerts">
        <div className="text-2xl font-bold">
          {fleet.alerts.length}
        </div>
      </Card>

      <Card title="System Health">
        <div className="text-2xl font-bold text-green-400">
          98%
        </div>
      </Card>

    </div>
  );
}