"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

/**
 * =========================
 * CLIENT-SAFE MAP IMPORT
 * =========================
 * Leaflet must NOT run on SSR in Next.js
 */
const MapInner = dynamic(
  () => import("./MapInner"),
  {
    ssr: false,
  }
);

/**
 * =========================
 * TYPE
 * =========================
 */
type FleetNode = {
  id: string;

  lat: number;
  lng: number;

  speed?: number;

  etaSeconds?: number;

  battery?: number;

  distanceMeters?: number;

  path?: {
    lat: number;
    lng: number;
    timestamp?: number;
  }[];
};

type Props = {
  nodes: FleetNode[];
};

/**
 * =========================
 * MAIN COMPONENT
 * =========================
 */
export default function FleetMap({
  nodes,
}: Props) {
  /**
   * MEMOIZATION:
   * prevents full map re-render on minor state updates
   */
  const stableNodes = useMemo(() => {
    return nodes?.map((n) => ({
      ...n,

      /**
       * safety fallback for route trails
       */
      path: n.path || [],
    }));
  }, [nodes]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      <MapInner nodes={stableNodes} />
    </div>
  );
}