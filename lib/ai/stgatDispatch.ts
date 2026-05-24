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
 * CONFIG
 * =========================
 */

const DIM = 6;

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

  const recent = history.slice(-3);

  let motion = 0;

  for (let i = 1; i < recent.length; i++) {
    const dx =
      recent[i].lat - recent[i - 1].lat;
    const dy =
      recent[i].lng - recent[i - 1].lng;

    motion += Math.sqrt(dx * dx + dy * dy);
  }

  return motion || 1;
}

/**
 * =========================
 * NODE BUILDING
 * =========================
 */

type Node = {
  id: string;
  type: "driver" | "shipment";
  lat: number;
  lng: number;
  h: number[];
  temporal: number;
};

function buildDriver(d: Driver): Node {
  return {
    id: d.id,
    type: "driver",
    lat: d.lat,
    lng: d.lng,
    temporal: temporalEncode(d.history),
    h: [
      Math.random(),
      d.lat,
      d.lng,
      d.history?.length || 1,
      0,
      0,
    ],
  };
}

function buildShipment(s: Shipment): Node {
  return {
    id: s.id,
    type: "shipment",
    lat: s.latitude,
    lng: s.longitude,
    temporal: s.priority || 1,
    h: [
      Math.random(),
      s.latitude,
      s.longitude,
      s.priority || 1,
      0,
      0,
    ],
  };
}

/**
 * =========================
 * DISTANCE (SPATIAL LAYER)
 * =========================
 */

function distance(a: Node, b: Node) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * =========================
 * ATTENTION SCORE (SPATIO-TEMPORAL)
 * =========================
 */

function attention(a: Node, b: Node) {
  const dist = distance(a, b);

  const temporalBias =
    a.temporal * 0.4 + b.temporal * 0.6;

  let dot = 0;

  for (let i = 0; i < DIM; i++) {
    dot += (a.h[i] || 0) * (b.h[i] || 0);
  }

  return dot / (1 + dist + temporalBias);
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
 * TEMPORAL FUSION (KEY ST-GAT STEP)
 * =========================
 */

function fuseTemporal(
  current: number[],
  previous: number[]
) {
  return current.map(
    (v, i) => 0.7 * v + 0.3 * (previous[i] || 0)
  );
}

/**
 * =========================
 * SINGLE GAT LAYER
 * =========================
 */

function runGATLayer(nodes: Node[]) {
  const updated: Node[] = [];

  for (const target of nodes) {
    const others = nodes.filter(
      (n) => n.id !== target.id
    );

    const scores = others.map((n) =>
      attention(n, target)
    );

    const weights = softmax(scores);

    const agg = new Array(DIM).fill(0);

    for (let i = 0; i < others.length; i++) {
      for (let j = 0; j < DIM; j++) {
        agg[j] +=
          (others[i].h[j] || 0) * weights[i];
      }
    }

    const updatedH = target.h.map(
      (v, i) => Math.tanh(v + agg[i])
    );

    updated.push({
      ...target,
      h: updatedH,
    });
  }

  return updated;
}

/**
 * =========================
 * MULTI-TIME STEP SIMULATION
 * =========================
 */

function runSTGAT(nodes: Node[]) {
  let t1 = runGATLayer(nodes);
  let t2 = runGATLayer(t1);

  // temporal fusion across time steps
  return t2.map((node, i) => ({
    ...node,
    h: fuseTemporal(node.h, t1[i].h),
  }));
}

/**
 * =========================
 * SCORING HEAD
 * =========================
 */

function score(n: Node) {
  return n.h.reduce((a, b) => a + b, 0);
}

/**
 * =========================
 * MAIN ENGINE
 * =========================
 */

export async function generateSTGATDispatch(
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

  const nodes = [
    ...drivers.map(buildDriver),
    buildShipment(shipment),
  ];

  /**
   * 1. SPATIO-TEMPORAL GAT PROCESSING
   */
  const learned = runSTGAT(nodes);

  const scored = learned
    .filter((n) => n.type === "driver")
    .map((n) => ({
      driverId: n.id,
      score: score(n),
    }));

  /**
   * 2. SOFTMAX SELECTION
   */
  const probs = softmax(
    scored.map((s) => s.score)
  );

  let r = Math.random();
  let acc = 0;

  let selected = scored[0].driverId;

  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];

    if (r <= acc) {
      selected = scored[i].driverId;
      break;
    }
  }

  /**
   * 3. REAL ROUTE VALIDATION (OSRM + TRAFFIC)
   */
  const driver = drivers.find(
    (d) => d.id === selected
  )!;

  const route = await getHybridRoute(
    driver,
    shipment,
    shipment
  );

  return {
    shipmentId: shipment.id,
    driverId: selected,
    score: route.score,
    eta: route.duration / 60,
    status: "ASSIGNED_STGAT",
  };
}