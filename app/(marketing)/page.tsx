import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* NAV */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-zinc-900">
        <div className="font-bold text-lg">
          🚚 SkyFleet
        </div>

        <div className="flex gap-6 text-sm text-zinc-400">
          <Link href="#features">Features</Link>
          <Link href="#pricing">Pricing</Link>
          <Link href="/login">Login</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center py-28 px-6">
        <h1 className="text-5xl font-bold leading-tight">
          Real-Time Fleet Intelligence <br />
          Powered by AI Dispatch
        </h1>

        <p className="text-zinc-400 mt-6 max-w-2xl mx-auto">
          Track vehicles, optimize routes, and automate dispatch decisions
          with live AI-powered logistics infrastructure.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold"
          >
            Get Started
          </Link>

          <Link
            href="/admin"
            className="px-6 py-3 border border-zinc-700 rounded-lg"
          >
            Open Control Tower
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section
        id="features"
        className="grid md:grid-cols-3 gap-6 px-10 py-20"
      >
        <Feature
          title="Live Tracking"
          desc="Real-time GPS updates with smooth animation engine."
        />
        <Feature
          title="AI Dispatch"
          desc="Automatically assigns best driver per shipment."
        />
        <Feature
          title="Predictive ETA"
          desc="Forecast delivery times using dynamic routing logic."
        />
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-zinc-600 py-10 border-t border-zinc-900">
        © {new Date().getFullYear()} SkyFleet Logistics. All rights reserved.
      </footer>
    </main>
  );
}

function Feature({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-zinc-400 mt-2 text-sm">{desc}</p>
    </div>
  );
}