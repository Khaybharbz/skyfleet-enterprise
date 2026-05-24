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
};

export type Shipment = {
  id: string;
  latitude: number;
  longitude: number;
  priority?: number;
};

type Node = {
  id: string;
  type: "driver" | "shipment";
  lat: number;
  lng: number;
  h: number[];
};

/**
 * =========================
 * CONFIG
 * =========================
 */

const DIM = 6;

/**
 * =========================
 * INITIAL EMBEDDINGS
 * =========================
 */

function initDriver(d: Driver): Node {
  return {
    id: d.id,
    type: "driver",
    lat: d.lat,
    lng: d.lng,
    h: [
      Math.random(),
      d.lat,
      d.lng,
      d.speed || 1,
      0,
      0,
    ],
  };
}

function initShipment(s: Shipment): Node {
  return {
    id: s.id,
    type: "shipment",
    lat: s.latitude,
    lng: s.longitude,
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
 * DISTANCE FUNCTION
 * =========================
 */

function distance(a: Node, b: Node) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * =========================
 * ATTENTION MECHANISM (GAT CORE)
 * =========================
 */

function attentionScore(
  a: Node,
  b: Node
) {
  const dist = distance(a, b);

  let dot = 0;

  for (let i = 0; i < DIM; i++) {
    dot += (a.h[i] || 0) * (b.h[i] || 0);
  }

  // learned similarity + spatial bias
  return dot / (1 + dist);
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
 * ATTENTION WEIGHT MATRIX
 * =========================
 */

function computeAttentionWeights(
  nodes: Node[],
  target: Node
) {
  const scores = nodes.map((n) =>
    attentionScore(n, target)
  );

  return softmax(scores);
}

/**
 * =========================
 * AGGREGATION WITH ATTENTION
 * =========================
 */

function aggregate(
  nodes: Node[],
  weights: number[]
) {
  const out = new Array(DIM).fill(0);

  for (let i = 0; i < nodes.length; i++) {
    const w = weights[i];

    for (let j = 0; j < DIM; j++) {
      out[j] += (nodes[i].h[j] || 0) * w;
    }
  }

  return out;
}

/**
 * =========================
 * UPDATE FUNCTION (RESIDUAL + NONLINEAR)
 * =========================
 */

function update(oldH: number[], agg: number[]) {
  return oldH.map((v, i) =>
    Math.tanh(v + 0.7 * agg[i])
  );
}

/**
 * =========================
 * GAT LAYER
 * =========================
 */

function runGATLayer(nodes: Node[]) {
  const updated: Node[] = [];

  for (const target of nodes) {
    const others = nodes.filter(
      (n) => n.id !== target.id
    );

    const weights =
      computeAttentionWeights(
        others,
        target
      );

    const agg = aggregate(
      others,
      weights
    );

    updated.push({
      ...target,
      h: update(target.h, agg),
    });
  }

  return updated;
}

/**
 * =========================
 * MULTI-LAYER GAT
 * =========================
 */

function runGAT(nodes: Node[], layers = 2) {
  let current = nodes;

  for (let i = 0; i < layers; i++) {
    current = runGATLayer(current);
  }

  return current;
}

/**
 * =========================
 * SCORING HEAD
 * =========================
 */

function score(node: Node) {
  return node.h.reduce(
    (a, b) => a + b,
    0
  );
}

/**
 * =========================
 * MAIN DISPATCH ENGINE
 * =========================
 */

export async function generateGATDispatch(
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
    initShipment(shipment);

  const driverNodes =
    drivers.map(initDriver);

  const graph = [
    ...driverNodes,
    shipmentNode,
  ];

  /**
   * 1. ATTENTION-BASED MESSAGE PASSING
   */
  const learned =
    runGAT(graph, 2);

  /**
   * 2. SCORE ONLY DRIVERS
   */
  const scored = learned
    .filter((n) => n.type === "driver")
    .map((n) => ({
      driverId: n.id,
      score: score(n),
    }));

  /**
   * 3. SOFTMAX SELECTION
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
   * 4. REAL ROUTE VALIDATION (OSRM + TRAFFIC)
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
    status: "ASSIGNED_GAT",
  };
}