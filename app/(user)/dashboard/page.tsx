"use client";

export default function UserDashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-2xl font-bold">
        👤 User Dashboard
      </h1>

      <div className="grid grid-cols-3 gap-4 mt-6">

        <Card title="My Shipments" value="3 Active" />
        <Card title="ETA Updates" value="Live" />
        <Card title="Delivery Status" value="On Track" />

      </div>

      <div className="mt-6 p-6 border border-zinc-800 rounded-xl">
        📍 Live tracking will appear here
      </div>

    </div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
      <div className="text-zinc-400 text-sm">
        {title}
      </div>
      <div className="text-xl font-bold mt-2">
        {value}
      </div>
    </div>
  );
}