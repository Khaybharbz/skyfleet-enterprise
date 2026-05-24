"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  async function login() {
    if (!email) return;

    /**
     * DEMO ROLE RULES
     */
    const role =
      email.includes("admin") ? "admin" : "user";

    /**
     * CALL API ROUTE (REAL AUTH)
     */
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });

    if (res.ok) {
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-[380px] p-6 border border-zinc-800 rounded-xl">

        <h1 className="text-xl font-bold mb-4">
          🔐 SkyFleet Login
        </h1>

        <input
          className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full bg-white text-black py-3 rounded"
        >
          Login
        </button>

      </div>
    </div>
  );
}