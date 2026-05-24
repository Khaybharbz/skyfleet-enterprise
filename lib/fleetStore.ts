import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

let cache: any[] = [];
let listeners: ((data: any[]) => void)[] = [];

export const subscribeFleet = (callback: (data: any[]) => void) => {
  listeners.push(callback);

  const unsub = onSnapshot(collection(db, "shipments"), (snap) => {
    cache = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    listeners.forEach((fn) => fn([...cache]));
  });

  return () => {
    listeners = listeners.filter((l) => l !== callback);
    unsub();
  };
};