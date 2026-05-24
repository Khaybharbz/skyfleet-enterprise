import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

let listeners: any[] = [];

export function subscribeShipments(callback: (data: any[]) => void) {
  const unsub = onSnapshot(collection(db, "shipments"), (snap) => {
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(data);
  });

  listeners.push(unsub);

  return unsub;
}