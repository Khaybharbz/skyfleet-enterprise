"use client";

import { useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [unsubscribe, setUnsubscribe] = useState<any>(null);

  const trackShipment = () => {
    if (!trackingId.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    // cleanup previous listener
    if (unsubscribe) unsubscribe();

    const q = query(
      collection(db, "shipments"),
      where("trackingId", "==", trackingId.trim())
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setLoading(false);

        if (snapshot.empty) {
          setResult({ notFound: true });
          return;
        }

        setResult({
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        });
      },
      () => {
        setLoading(false);
        setError("Tracking error. Try again.");
      }
    );

    setUnsubscribe(() => unsub);
  };

  const getSteps = (status: string) => {
    const steps = ["Created", "Processing", "In Transit", "Delivered"];

    let index = 0;
    const s = status?.toLowerCase() || "";

    if (s.includes("processing")) index = 1;
    else if (s.includes("transit")) index = 2;
    else if (s.includes("delivered")) index = 3;

    return steps.map((step, i) => ({
      name: step,
      done: i <= index,
    }));
  };

  const getETA = (status: string) => {
    const s = status?.toLowerCase() || "";

    if (s.includes("processing")) return "4–6 days";
    if (s.includes("transit")) return "1–3 days";
    if (s.includes("delivered")) return "Delivered";

    return "3–5 days";
  };

  const getMap = (lat: number, lng: number) => {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${
      lng - 0.01
    },${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  };

  const safeResult =
    result && !result.notFound
      ? {
          ...result,
          latitude: result.latitude ?? 6.5244,
          longitude: result.longitude ?? 3.3792,
        }
      : null;

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>Track Shipment</h1>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          style={{ flex: 1, padding: 10 }}
          placeholder="Enter Tracking ID"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
        />

        <button onClick={trackShipment}>Track</button>
      </div>

      <hr />

      {loading && <p>Searching...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {result?.notFound && <p>Shipment not found</p>}

      {safeResult && (
        <div style={{ border: "1px solid #ddd", padding: 15, marginTop: 10 }}>
          <p>
            <b>Tracking ID:</b> {safeResult.trackingId}
          </p>

          <p>
            <b>Status:</b> {safeResult.status}
          </p>

          <p>
            <b>ETA:</b> {getETA(safeResult.status)}
          </p>

          <p>
            <b>Location:</b> {safeResult.location}
          </p>

          <hr />

          <h3>Progress</h3>
          {getSteps(safeResult.status).map((step, i) => (
            <div key={i}>
              {step.done ? "✔" : "○"} {step.name}
            </div>
          ))}

          <hr />

          <h3>Live Map</h3>
          <iframe
            src={getMap(safeResult.latitude, safeResult.longitude)}
            width="100%"
            height="250"
            style={{ border: 0 }}
          />
        </div>
      )}
    </div>
  );
}