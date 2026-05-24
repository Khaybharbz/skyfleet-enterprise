import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

// 📍 DISTANCE CALC
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

// 🧠 AI DISPATCH ENGINE
export const runAutoDispatch = async () => {
  const snap = await getDocs(collection(db, "shipments"));

  const shipments = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));

  const pending = shipments.filter(
    (s: any) => s.status === "Processing"
  );

  const active = shipments.filter(
    (s: any) => s.status === "In Transit"
  );

  for (const shipment of pending) {
    let bestMatch: any = null;
    let bestScore = Infinity;

    for (const vehicle of active) {
      const score = distance(
        {
          lat: vehicle.latitude,
          lng: vehicle.longitude,
        },
        {
          lat: shipment.latitude || 6.5244,
          lng: shipment.longitude || 3.3792,
        }
      );

      if (score < bestScore) {
        bestScore = score;
        bestMatch = vehicle;
      }
    }

    if (bestMatch) {
      await updateDoc(doc(db, "shipments", shipment.id), {
        status: "Dispatched",
        assignedVehicle: bestMatch.id,
      });
    }
  }
};