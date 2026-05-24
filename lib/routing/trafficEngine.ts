type LatLng = {
  lat: number;
  lng: number;
};

/**
 * 🚦 TRAFFIC ZONES (SIMPLIFIED MODEL)
 */
function trafficZoneFactor(
  point: LatLng
): number {
  const { lat, lng } = point;

  /**
   * Lagos-like congestion zones
   */

  const isIkeja =
    lat > 6.55 && lng > 3.32;

  const isIsland =
    lat < 6.45 && lng > 3.38;

  if (isIsland) return 1.8; // heavy traffic
  if (isIkeja) return 1.5; // medium traffic

  return 1.1; // normal
}

/**
 * 🚦 ROUTE TRAFFIC MULTIPLIER
 */
export function computeTrafficCost(
  route: LatLng[]
) {
  if (!route.length) return 0;

  let cost = 0;

  for (const p of route) {
    cost += trafficZoneFactor(p);
  }

  return cost / route.length;
}