import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function createShipment({
  location,
  latitude,
  longitude,
}: {
  location: string;
  latitude: number;
  longitude: number;
}) {
  await addDoc(collection(db, "shipments"), {
    trackingId: "TRK-" + Date.now(),

    status: "Processing",

    location,

    latitude,
    longitude,

    routeIndex: 0,
    progress: 0,

    etaMinutes: 0,
    speedKmh: 0,
    confidence: "Low",
    riskLevel: "Low",

    createdAt: Date.now(),
  });
}