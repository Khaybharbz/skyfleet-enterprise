import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

// 🧠 detect stuck or abnormal shipments
const detectAnomalies = (shipments: any[]) => {
  return shipments.filter((s) => {
    const noProgress = (s.progress || 0) < 10;
    const highRisk = s.slaRisk === "HIGH";
    const noMovement = !s.latitude || !s.longitude;

    return noProgress || highRisk || noMovement;
  });
};

// 🔁 reroute logic (simplified)
const rerouteShipment = async (shipment: any) => {
  await updateDoc(doc(db, "shipments", shipment.id), {
    status: "Reassigned",
    reroutedAt: Date.now(),
    intervention: true,
  });
};

// ⚡ force recovery
const recoverShipment = async (shipment: any) => {
  await updateDoc(doc(db, "shipments", shipment.id), {
    status: "Dispatched",
    progress: shipment.progress || 0,
    recoveryTriggered: true,
  });
};

// 🧠 MAIN SELF-HEALING ENGINE
export const runSelfHealingSystem = async () => {
  const snap = await getDocs(collection(db, "shipments"));

  const shipments = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const anomalies = detectAnomalies(shipments);

  for (const s of anomalies) {
    // HIGH RISK → reroute
    if (s.slaRisk === "HIGH") {
      await rerouteShipment(s);
      continue;
    }

    // STUCK → recover
    if ((s.progress || 0) < 10) {
      await recoverShipment(s);
      continue;
    }

    // MISSING DATA → safe fallback
    if (!s.latitude || !s.longitude) {
      await rerouteShipment(s);
      continue;
    }
  }
};