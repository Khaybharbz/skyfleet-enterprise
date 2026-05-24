import { useEffect, useRef, useState } from "react";

type LatLng = {
  lat: number;
  lng: number;
};

/**
 * Smooth GPS interpolation hook
 */
export function useSmoothPosition(
  target: LatLng | null
) {
  const [position, setPosition] =
    useState<LatLng | null>(target);

  const frameRef = useRef<number | null>(null);
  const currentRef = useRef<LatLng | null>(target);

  useEffect(() => {
    if (!target) return;

    const start = currentRef.current;
    const end = target;

    const duration = 1000; // smooth speed
    const startTime = performance.now();

    function animate(time: number) {
      const t = Math.min(
        1,
        (time - startTime) / duration
      );

      if (!start) {
        currentRef.current = end;
        setPosition(end);
        return;
      }

      const lat =
        start.lat +
        (end.lat - start.lat) * t;

      const lng =
        start.lng +
        (end.lng - start.lng) * t;

      const next = { lat, lng };

      setPosition(next);

      if (t < 1) {
        frameRef.current =
          requestAnimationFrame(animate);
      } else {
        currentRef.current = end;
      }
    }

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current =
      requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target]);

  return position;
}