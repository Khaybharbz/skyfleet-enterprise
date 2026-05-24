import { getOSRMRoute } from "./osrm";

type Coordinate = {
  lat: number;
  lng: number;
};

const routeCache = new Map<string, Coordinate[]>();

function key(a: Coordinate, b: Coordinate) {
  return `${a.lat},${a.lng}->${b.lat},${b.lng}`;
}

/**
 * =========================================
 * SMART ROUTE ENGINE (WITH CACHE)
 * =========================================
 */

export async function getSmartRoute(
  start: Coordinate,
  end: Coordinate
) {
  const k = key(start, end);

  if (routeCache.has(k)) {
    return routeCache.get(k)!;
  }

  const route = await getOSRMRoute(
    start,
    end
  );

  routeCache.set(k, route);

  return route;
}