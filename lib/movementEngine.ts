import { calculateETA } from "./trafficETA";

type Coord = {
  lat: number;
  lng: number;
};

export type Shipment = {
  id: string;

  latitude: number;
  longitude: number;

  route?: Coord[];

  routeIndex?: number;

  speedKmh?: number;

  status?: "Moving" | "Delivered" | "Delayed";

  etaMinutes?: number;

  progress?: number;
};

/**
 * =========================================
 * SAFE ETA UPDATE
 * =========================================
 */

function computeETA(shipment: Shipment): number {
  if (!shipment.route) return 0;

  return calculateETA({
    route: shipment.route,
    speedKmh: shipment.speedKmh || 30,
    isUrban: true,
  });
}

/**
 * =========================================
 * MOVE SHIPMENT ALONG OSRM ROUTE
 * =========================================
 */

export function moveShipment(
  shipment: Shipment
): Shipment {
  if (!shipment.route?.length) {
    return shipment;
  }

  const nextIndex =
    (shipment.routeIndex || 0) + 1;

  /**
   * DELIVERY COMPLETED
   */

  if (nextIndex >= shipment.route.length) {
    return {
      ...shipment,
      routeIndex:
        shipment.route.length - 1,
      latitude:
        shipment.route[
          shipment.route.length - 1
        ].lat,
      longitude:
        shipment.route[
          shipment.route.length - 1
        ].lng,
      status: "Delivered",
      progress: 100,
      etaMinutes: 0,
    };
  }

  const current =
    shipment.route[nextIndex];

  const progress = Math.floor(
    (nextIndex /
      shipment.route.length) *
      100
  );

  const updated: Shipment = {
    ...shipment,

    latitude: current.lat,
    longitude: current.lng,

    routeIndex: nextIndex,

    status: "Moving",

    progress,

    /**
     * LIVE ETA RECALC
     */
    etaMinutes: computeETA({
      ...shipment,
      routeIndex: nextIndex,
    }),
  };

  return updated;
}

/**
 * =========================================
 * ENGINE LOOP (SIMULATION / PROD SAFE)
 * =========================================
 */

export function startMovementEngine(
  shipments: Shipment[],
  onUpdate: (s: Shipment[]) => void,
  interval = 2000
) {
  const timer = setInterval(() => {
    const updated = shipments.map(
      (s) => moveShipment(s)
    );

    onUpdate(updated);
  }, interval);

  return () => clearInterval(timer);
}