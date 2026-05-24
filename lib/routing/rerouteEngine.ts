import { getOSRMRoute } from "./osrmClient";

import { computeTrafficCost } from "./trafficEngine";

type LatLng = {
  lat: number;
  lng: number;
};

type ActiveTrip = {
  driverId: string;
  shipmentId: string;
  currentRoute: LatLng[];
  lastRerouteAt?: number;
};

/**
 * ⏱ COOLDOWN (avoid spam reroutes)
 */
const REROUTE_COOLDOWN = 15000; // 15s

/**
 * 🧠 CHECK IF REROUTE IS NEEDED
 */
function shouldReroute(
  trip: ActiveTrip,
  newTrafficScore: number
) {
  const now = Date.now();

  if (
    trip.lastRerouteAt &&
    now - trip.lastRerouteAt <
      REROUTE_COOLDOWN
  ) {
    return false;
  }

  /**
   * trigger if traffic is bad
   */
  return newTrafficScore > 1.4;
}

/**
 * 🚨 CORE REROUTE ENGINE
 */
export async function evaluateReroute(
  trip: ActiveTrip,
  driver: LatLng,
  destination: LatLng
) {
  const route = await getOSRMRoute(
    driver,
    destination
  );

  const trafficScore =
    computeTrafficCost(route.coords);

  const need = shouldReroute(
    trip,
    trafficScore
  );

  if (!need) {
    return null;
  }

  trip.lastRerouteAt = Date.now();

  return {
    type: "ROUTE_UPDATE",
    payload: {
      driverId: trip.driverId,
      shipmentId: trip.shipmentId,
      newRoute: route.coords,
      eta: route.duration / 60,
      trafficScore,
    },
  };
}