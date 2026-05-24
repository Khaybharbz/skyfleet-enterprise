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
  speed?: number;
  status?: string;
};

export type Shipment = {
  id: string;
  latitude: number;
  longitude: number;
  priority?: number;
};

/**
 * =========================
 * EMBEDDING STORE (SIMULATED)
 * =========================
 */

const driverEmbeddings: Record<string, number[]> = {};
const shipmentEmbeddings: Record<string, number[]> = {};

/**
 * =========================
 * SIMPLE FEATURE EMBEDDING
 * =========================
 */

function embedDriver(d: Driver) {
  if (!driverEmbeddings[d.id]) {
    driverEmbeddings[d.id] = [
      Math.random(),
      d.lat,
      d.lng,
      d.speed || 1,
    ];
  }

  return driverEmbeddings[d.id];
}

function embedShipment(s: Shipment) {
  if (!shipmentEmbeddings[s.id]) {
    shipmentEmbeddings[s.id] = [
      Math.random(),
      s.latitude,
      s.longitude,
      s.priority || 1,
    ];
  }

  return shipmentEmbeddings[s.id];
}

/**
 * =========================
 * ATTENTION SCORE (CORE TRANSFORMER IDEA)
 * =========================
 */

function attentionScore(
  driverVec: number[],
  shipmentVec: number[]
) {
  let score = 0;

  for (let i = 0; i < driverVec.length; i++) {
    score += driverVec[i] * shipmentVec[i];
  }

  return score;
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
 * TRANSFORMER DISPATCH CORE
 * =========================
 */

export async function generateTransformerDispatch(
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

  const sVec = embedShipment(shipment);

  const scores = drivers.map((d) => {
    const dVec = embedDriver(d);

    return {
      driver: d,
      score: attentionScore(
        dVec,
        sVec
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
   * =========================
   * ROUTE VALIDATION (REAL WORLD COST)
   * =========================
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
    status: "ASSIGNED_TRANSFORMER",
  };
}