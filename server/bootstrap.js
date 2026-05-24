import { startEngine } from "./movementEngine";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../lib/firebase";

/**
 * LOAD ALL SHIPMENTS AND START ENGINE
 */

async function bootstrap() {
  const snap = await getDocs(
    collection(db, "shipments")
  );

  snap.forEach((doc) => {
    const data = doc.data();

    if (
      data.status !== "Delivered"
    ) {
      startEngine(doc.id, data);
    }
  });
}

bootstrap();