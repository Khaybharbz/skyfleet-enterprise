"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

import {
  Package,
  Truck,
  Search,
  PlusCircle,
} from "lucide-react";

export default function Home() {
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");

  const [searchId, setSearchId] = useState("");
  const [result, setResult] = useState<any>(null);
 
  const [shipments, setShipments] = useState<any[]>([]);

  const generateTrackingId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "SKY-";

    for (let i = 0; i < 6; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }

    return id;
  };

  const createShipment = async () => {
    if (!status || !location) return;

    const trackingId = generateTrackingId();

    await addDoc(collection(db, "shipments"), {
      trackingId,
      status,
      location,
      createdAt: new Date(),
    });

    alert(`Shipment created: ${trackingId}`);

    setStatus("");
    setLocation("");
  };

  const trackShipment = async () => {
    const q = query(
      collection(db, "shipments"),
      where("trackingId", "==", searchId)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      setResult(snapshot.docs[0].data());
    } else {
      setResult({
        status: "Not Found",
        location: "Invalid Tracking ID",
      });
    }
  };

  const updateShipmentStatus = async (id: string, newStatus: string, newLocation: string) => {
  const q = query(collection(db, "shipments"));
  const snapshot = await getDocs(q);

  snapshot.forEach(async (docSnap) => {
    if (docSnap.id === id) {
      await addDoc(collection(db, "shipments"), {
        trackingId: docSnap.data().trackingId,
        status: newStatus,
        location: newLocation,
        createdAt: docSnap.data().createdAt,
      });
    }
  });
};

  useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "shipments"),
    (snapshot) => {
      const shipmentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setShipments(shipmentData);
    }
  );

  return () => unsubscribe();
}, []);

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-black text-white p-6">
        <h1 className="text-2xl font-bold mb-10">
          Skyfleet
        </h1>

        <nav className="space-y-6">
          <div className="flex items-center gap-3">
            <Package size={20} />
            <span>Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <Truck size={20} />
            <span>Shipments</span>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10">

        <h2 className="text-3xl font-bold mb-8">
          Logistics Dashboard
        </h2>

        {/* CREATE SHIPMENT CARD */}
        <div className="bg-white p-6 rounded-2xl shadow mb-10">

          <div className="flex items-center gap-2 mb-4">
            <PlusCircle />
            <h3 className="text-xl font-semibold">
              Create Shipment
            </h3>
          </div>

          <div className="grid gap-4">

            <input
              placeholder="Shipment Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border p-3 rounded-lg"
            />

            <input
              placeholder="Current Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border p-3 rounded-lg"
            />

            <button
              onClick={createShipment}
              className="bg-black text-white py-3 rounded-lg hover:bg-gray-800"
            >
              Create Shipment
            </button>
          </div>
        </div>

        {/* TRACK SHIPMENT CARD */}
        <div className="bg-white p-6 rounded-2xl shadow">

          <div className="flex items-center gap-2 mb-4">
            <Search />
            <h3 className="text-xl font-semibold">
              Track Shipment
            </h3>
          </div>

          <div className="grid gap-4">

            <input
              placeholder="Enter Tracking ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="border p-3 rounded-lg"
            />

            <button
              onClick={trackShipment}
              className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              Track Shipment
            </button>
          </div>

          {result && (
            <div className="mt-6 border-t pt-6">

              <p className="mb-2">
                <strong>Status:</strong> {result.status}
              </p>

              <p>
                <strong>Location:</strong> {result.location}
              </p>

            </div>
          )}
        </div>

        {/* SHIPMENT TABLE */}
<div className="bg-white p-6 rounded-2xl shadow mt-10">

  <h3 className="text-2xl font-semibold mb-6">
    All Shipments
  </h3>

  <div className="overflow-x-auto">

    <table className="w-full border-collapse">

      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="p-3">Tracking ID</th>
          <th className="p-3">Status</th>
          <th className="p-3">Location</th>
        </tr>
      </thead>

      <tbody>
        {shipments.map((shipment) => (
         <tr key={shipment.id} className="border-b">
  <td className="p-3 font-medium">{shipment.trackingId}</td>
  <td className="p-3">{shipment.status}</td>
  <td className="p-3">{shipment.location}</td>

  <td className="p-3">
    <button
      onClick={() =>
        updateShipmentStatus(
          shipment.id,
          "In Transit",
          shipment.location
        )
      }
      className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
    >
      Mark In Transit
    </button>

    <button
      onClick={() =>
        updateShipmentStatus(
          shipment.id,
          "Delivered",
          shipment.location
        )
      }
      className="bg-green-600 text-white px-3 py-1 rounded"
    >
      Mark Delivered
    </button>
  </td>
</tr>
        ))}
      </tbody>

    </table>

  </div>
</div>

      </main>
    </div>
  );
}