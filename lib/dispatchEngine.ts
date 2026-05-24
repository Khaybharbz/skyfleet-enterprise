type DriverNode = {
  id: string;
  lat: number;
  lng: number;
  speed?: number;
  battery?: number;
};

type Shipment = {
  id: string;
  lat: number;
  lng: number;
  priority?: number; // 1-5
};

type Assignment = {
  driverId: string;
  shipmentId: string;
  score: number;
};

/**
 * =========================
 * DISTANCE (HAVERSINE)
 * =========================
 */
function distance(a: DriverNode, b: Shipment) {
  const R = 6371;

  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;

  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) *
      Math.sin(dLng / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * =========================
 * AI SCORING FUNCTION
 * =========================
 */
function scoreDriver(
  driver: DriverNode,
  shipment: Shipment
) {
  const dist = distance(driver, shipment);

  const speed = driver.speed || 30;
  const battery = driver.battery || 100;
  const priority = shipment.priority || 3;

  /**
   * Weighted AI scoring model
   */
  const score =
    priority * 3 -
    dist * 1.2 +
    speed * 0.5 +
    battery * 0.2;

  return score;
}

/**
 * =========================
 * MAIN OPTIMIZER
 * =========================
 */
export function optimizeDispatch(
  drivers: DriverNode[],
  shipments: Shipment[]
): Assignment[] {
  const assignments: Assignment[] = [];

  const usedDrivers = new Set<string>();

  for (const shipment of shipments) {
    let best: Assignment | null = null;

    for (const driver of drivers) {
      if (usedDrivers.has(driver.id)) continue;

      const score = scoreDriver(
        driver,
        shipment
      );

      if (!best || score > best.score) {
        best = {
          driverId: driver.id,
          shipmentId: shipment.id,
          score,
        };
      }
    }

    if (best) {
      assignments.push(best);
      usedDrivers.add(best.driverId);
    }
  }

  return assignments;
}