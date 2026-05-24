import { getHybridRoute } from "../routing/hybridRouter";

/**
 * =========================
 * TYPES
 * =========================
 */

export type Driver = {
  id: string;
  lat: number;
  lng: number;
  history?: { lat: number; lng: number }[];
};

export type Shipment = {
  id: string;
  latitude: number;
  longitude: number;
  priority?: number;
};

/**
 * =========================
 * GRAPH STATE
 * =========================
 */

type NodeFeature = {
  id: string;
  type: "driver" | "shipment";

  lat: number;
  lng: number;

  timeFeature: number;

  trafficBias: number;
};

/**
 * =========================
 * TEMPORAL ENCODING
 * =========================
 */

function temporalEncode(
  history?: { lat: number; lng: number }[]
) {
  if (!history || history.length < 2)
    return 1;

  const last = history[history.length - 1];
  const prev = history[history.length - 2];

  const dx = last.lat - prev.lat;
  const dy = last.lng - prev.lng;

  const movement = Math.sqrt(
    dx * dx + dy * dy
  );

  return movement || 1;
}

/**
 * =========================
 * SPATIAL DISTANCE (GRAPH EDGE WEIGHT)
 * =========================
 */

function distance(
  a: NodeFeature,
  b: NodeFeature
) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * =========================
 * GRAPH ATTENTION SCORE
 * =========================
 */

function attention(
  driver: NodeFeature,
  shipment: NodeFeature
) {
  const dist = distance(driver, shipment);

  const temporal =
    driver.timeFeature * 0.5;

  const traffic =
    driver.trafficBias * 0.7;

  /**
   * lower is better → invert
   */
  return (
    1 /
    (1 +
      dist +
      traffic -
      temporal)
  );
}

/**
 * =========================
 * SOFTMAX
 * =========================
 */

function softmax(values: number[]) {
  const exp = values.map((v) =>
    Math.exp(v)
  );

  const sum = exp.reduce(
    (a, b) => a + b,
    0
  );

  return exp.map((v) => v / sum);
}

/**
 * =========================
 * BUILD NODE FEATURES
 * =========================
 */

function buildDriverNode(d: Driver): NodeFeature {
  return {
    id: d.id,
    type: "driver",
    lat: d.lat,
    lng: d.lng,
    timeFeature: temporalEncode(d.history),
    trafficBias: Math.random(), // placeholder (replace with live traffic API later)
  };
}

function buildShipmentNode(s: Shipment): NodeFeature {
  return {
    id: s.id,
    type: "shipment",
    lat: s.latitude,
    lng: s.longitude,
    timeFeature: s.priority || 1,
    trafficBias: 0,
  };
}

/**
 * =========================
 * MAIN ST-GRAPH TRANSFORMER
 * =========================
 */

export async function generateSTGraphDispatch(
  drivers: Driver[],
  shipment: Shipment
) {
  if (!drivers.length) {
    return {
      shipmentId: shipment.id,
      driverId: null,
      status: "NO_DRIVERS",
    };
  }

  const shipmentNode =
    buildShipmentNode(shipment);

  const driverNodes = drivers.map((d) =>
    buildDriverNode(d)
  );

  /**
   * GRAPH ATTENTION SCORES
   */
  const scores = driverNodes.map((d) => {
    return {
      driver: d,
      score: attention(
        d,
        shipmentNode
      ),
    };
  });

  const probs = softmax(
    scores.map((s) => s.score)
  );

  let r = Math.random();
  let acc = 0;

  let selected = scores[0].driver;

  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];

    if (r <= acc) {
      selected = scores[i].driver;
      break;
    }
  }

  /**
   * REAL ROUTE VALIDATION (OSRM + traffic hybrid)
   */
  const route = await getHybridRoute(
    selected,
    shipment,
    shipment
  );

  return {
    shipmentId: shipment.id,
    driverId: selected.id,
    score: route.score,
    eta: route.duration / 60,
    status: "ASSIGNED_ST_GRAPH",
  };
}