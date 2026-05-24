import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

/**
 * 🧠 Estimate movement speed trend
 */
const estimateSpeed = (shipment: any) => {
  const path = shipment.path || [];

  if (path.length < 2) return 1;

  const recent = path.slice(-5);

  const distances = [];

  for (let i = 1; i < recent.length; i++) {
    const a = recent[i - 1];
    const b = recent[i];

    const d = Math.sqrt(
      Math.pow(b.lat - a.lat, 2) +
      Math.pow(b.lng - a.lng, 2)
    );

    distances.push(d);
  }

  const avg =
    distances.reduce((a, b) => a + b, 0) /
    (distances.length || 1);

  return avg || 1;
};

/**
 * 🚨 PREDICT DELAY RISK
 */
const calculateRisk = (shipment: any) => {
  const progress = shipment.progress || 0;

  const remaining = 100 - progress;

  const eta = shipment.remainingMinutes || 1;

  const speed = estimateSpeed(shipment);

  // risk score formula (simple but effective)
  const riskScore =
    remaining * 0.4 + eta * 0.4 + (1 / speed) * 20;

  if (riskScore > 70) return "HIGH";
  if (riskScore > 40) return "MEDIUM";
  return "LOW";
};

/**
 * ⏱ ADAPTIVE ETA ENGINE
 */
const adaptiveETA = (shipment: any) => {
  const base = shipment.remainingMinutes || 0;

  const speed = estimateSpeed(shipment);

  const adjustment = speed < 0.5 ? 1.4 : speed < 1 ? 1.2 : 1;

  return Math.max(1, Math.round(base * adjustment));
};

/**
 * 🧠 MAIN PREDICTIVE ENGINE
 */
export const runPredictiveAI = async (shipments: any[]) => {
  for (const s of shipments) {
    if (!s.latitude || !s.longitude) continue;

    const risk = calculateRisk(s);
    const eta = adaptiveETA(s);

    await updateDoc(doc(db, "shipments", s.id), {
      slaRisk: risk,
      remainingMinutes: eta,

      // optional future trigger hooks
      interventionRequired: risk === "HIGH",
    });
  }
};