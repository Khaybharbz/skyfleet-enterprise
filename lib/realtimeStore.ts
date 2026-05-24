import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const subscribeShipments = (cb: (data: any[]) => void) => {
  const ref = collection(db, "shipments");

  const unsub = onSnapshot(ref, (snap) => {
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("🌐 LIVE SNAPSHOT:", data.length);

    cb(data);
  });

  return unsub;
};