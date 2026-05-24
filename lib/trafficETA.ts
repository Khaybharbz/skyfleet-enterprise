type Coord = {
  lat: number;
  lng: number;
};

/**
 * =========================================
 * DISTANCE (KM)
 * =========================================
 */

function haversine(a: Coord, b: Coord) {
  const R = 6371;

  const dLat =
    ((b.lat - a.lat) * Math.PI) / 180;
  const dLng =
    ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 =
    (a.lat * Math.PI) / 180;
  const lat2 =
    (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(x),
      Math.sqrt(1 - x)
    );

  return R * c;
}

/**
 * =========================================
 * TRAFFIC MODEL (SIMULATED REAL WORLD)
 * Lagos-style congestion zones:
 * - 1.0 = free flow
 * - 1.8 = heavy traffic
 * =========================================
 */

function trafficFactor(
  hour: number,
  isUrban: boolean
) {
  // rush hours
  const rush =
    (hour >= 7 && hour <= 10) ||
    (hour >= 16 && hour <= 20);

  if (isUrban && rush) return 1.8;
  if (isUrban) return 1.4;
  if (rush) return 1.3;

  return 1.0;
}

/**
 * =========================================
 * BASE ETA ENGINE
 * =========================================
 */

export function calculateETA(params: {
  route: Coord[];
  speedKmh: number;
  isUrban?: boolean;
}) {
  const { route, speedKmh, isUrban } =
    params;

  if (!route || route.length < 2)
    return 0;

  let distance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    distance += haversine(
      route[i],
      route[i + 1]
    );
  }

  const hour =
    new Date().getHours();

  const traffic =
    trafficFactor(hour, !!isUrban);

  const adjustedSpeed =
    speedKmh * (1 / traffic);

  const etaHours =
    distance / adjustedSpeed;

  return Math.round(etaHours * 60);
}