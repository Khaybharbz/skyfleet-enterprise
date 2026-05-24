"use client";

import { useEffect, useState } from "react";

/**
 * Smooth interpolation hook
 * prevents teleporting markers
 */

export function useSmoothPosition(
  target:
    | { lat: number; lng: number }
    | null
) {
  const [pos, setPos] = useState<
    | {
        lat: number;
        lng: number;
      }
    | null
  >(target);

  useEffect(() => {
    if (!target) return;

    let frame: number;

    const animate = () => {
      setPos((prev) => {
        if (!prev) return target;

        const lat =
          prev.lat +
          (target.lat -
            prev.lat) *
            0.15;

        const lng =
          prev.lng +
          (target.lng -
            prev.lng) *
            0.15;

        return { lat, lng };
      });

      frame = requestAnimationFrame(
        animate
      );
    };

    animate();

    return () =>
      cancelAnimationFrame(frame);
  }, [target?.lat, target?.lng]);

  return pos;
}