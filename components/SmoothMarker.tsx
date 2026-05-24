"use client";

import { Marker } from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";

type Props = {
  position: [number, number];
};

export default function SmoothMarker({
  position,
}: Props) {
  const markerRef = useRef<any>(null);

  /**
   * SMOOTH ANIMATION CORE
   */

  useEffect(() => {
    const marker =
      markerRef.current;

    if (!marker) return;

    const start = marker.getLatLng();

    const end = L.latLng(
      position[0],
      position[1]
    );

    const duration = 1200; // ms
    const startTime = performance.now();

    function animate(time: number) {
      const t = Math.min(
        1,
        (time - startTime) / duration
      );

      const lat =
        start.lat +
        (end.lat - start.lat) * t;

      const lng =
        start.lng +
        (end.lng - start.lng) * t;

      marker.setLatLng([lat, lng]);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [position]);

  return (
    <Marker
      ref={markerRef}
      position={position}
    />
  );
}