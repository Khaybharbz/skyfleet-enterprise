import { getOSRMRoute } from "./osrmClient";

import { computeTrafficCost } from "./trafficEngine";

type LatLng = {
  lat: number;
  lng: number;
};

type Shipment = {
  id: string;
  latitude: number;
  longitude: number;
  priority?: number;
};

/**
 * 🧠 HYBRID ROUTE ENGINE
 */
export async function getHybridRoute(
  start: LatLng,
  end: LatLng,
  shipment?: Shipment
) {
  const osrm = await getOSRMRoute(
    start,
    end
  );

  const trafficCost =
    computeTrafficCost(osrm.coords);

  const priority =
    shipment?.priority || 1;

  /**
   * FINAL SCORE (LOWER IS BETTER)
   */
  const cost =
    osrm.duration +
    trafficCost * 100 -
    priority * 20;

  return {
    distance: osrm.distance,
    duration: osrm.duration,
    trafficCost,
    score: cost,
    route: osrm.coords,
  };
}