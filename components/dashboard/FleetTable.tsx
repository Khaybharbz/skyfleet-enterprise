"use client";

import Card from "@/components/ui/Card";

export default function FleetTable({ nodes }: any) {
  return (
    <Card title="🚚 Fleet Status Table">
      <div className="overflow-auto">

        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-400 border-b border-zinc-800">
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Speed</th>
              <th className="text-left p-2">Battery</th>
            </tr>
          </thead>

          <tbody>
            {nodes?.map((node: any) => (
              <tr
                key={node.id}
                className="border-b border-zinc-800"
              >
                <td className="p-2">{node.id}</td>
                <td className="p-2">{node.type}</td>
                <td className="p-2">
                  {node.speed || 0} km/h
                </td>
                <td className="p-2">
                  {node.battery || 100}%
                </td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </Card>
  );
}