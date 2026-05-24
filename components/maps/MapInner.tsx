"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
} from "react-leaflet";

type Node = {
  id: string;
  lat: number;
  lng: number;
  speed?: number;
};

export default function MapInner({ nodes }: { nodes: Node[] }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const center: [number, number] = [6.5244, 3.3792];

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* MARKERS */}
      {nodes?.map((node) => (
        <Marker
          key={node.id}
          position={[node.lat, node.lng]}
        />
      ))}

      {/* ROUTE TRAIL (simple polyline) */}
      {nodes?.length > 1 && (
        <Polyline
          positions={nodes.map((n) => [n.lat, n.lng])}
        />
      )}
    </MapContainer>
  );
}