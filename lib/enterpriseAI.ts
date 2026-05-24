import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

// 📍 DISTANCE
const distance = (a: any, b: any) => {
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

// 🧠 SCORE ENGINE (COST + EFFICIENCY)
const scoreRoute = (vehicle: any, shipment: any) => {
  const dist = distance(
    {
      lat: vehicle.latitude,
      lng: vehicle.longitude,
    },
    {
      lat: shipment.latitude || 6.5244,
      lng: shipment.longitude || 3.3792,
    }
  );

  const loadPenalty = vehicle.load || 0;

  const etaPenalty = shipment.remainingMinutes || 0;

  return dist + loadPenalty * 2 + etaPenalty * 0.5;
};

// 🧠 CLUSTERING ENGINE (SIMPLIFIED)
const clusterShipments = (shipments: any[]) => {
  const clusters: any[][] = [];

  shipments.forEach((s) => {
    let placed = false;

    for (const cluster of clusters) {
      const center = cluster[0];

      const d = distance(
        {
          lat: center.latitude,
          lng: center.longitude,
        },
        {
          lat: s.latitude || 6.5244,
          lng: s.longitude || 3.3792,
        }
      );

      if (d < 5) {
        cluster.push(s);
        placed = true;
        break;
      }
    }

    if (!placed) clusters.push([s]);
  });

  return clusters;
};

// 🚀 ENTERPRISE DISPATCH ENGINE
export const runEnterpriseDispatch = async () => {
  const snap = await getDocs(collection(db, "shipments"));

  const shipments = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const pending = shipments.filter(
    (s: any) => s.status === "Processing"
  );

  const activeVehicles = shipments.filter(
    (s: any) => s.status === "In Transit"
  );

  const clusters = clusterShipments(pending);

  for (const cluster of clusters) {
    const shipment = cluster[0];

    let best: any = null;
    let bestScore = Infinity;

    for (const vehicle of activeVehicles) {
      const score = scoreRoute(vehicle, shipment);

      if (score < bestScore) {
        bestScore = score;
        best = vehicle;
      }
    }

    if (best) {
      const risk =
        shipment.remainingMinutes > 60 ? "HIGH" : "LOW";

      await updateDoc(doc(db, "shipments", shipment.id), {
        status: "Dispatched",
        assignedVehicle: best.id,

        // 📊 enterprise analytics
        dispatchScore: bestScore,
        slaRisk: risk,
      });
    }
  }
};