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

  h: number[]; // hidden embedding vector
};

/**
 * =========================
 * INITIAL EMBEDDING DIMENSION
 * =========================
 */

const DIM = 6;

/**
 * =========================
 * NODE INITIALIZATION (FEATURE ENCODER)
 * =========================
 */

function initDriverNode(d: Driver): Node {
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

function initShipmentNode(s: Shipment): Node {
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
 * GRAPH STRUCTURE UTILITIES
 * =========================
 */

function distance(a: Node, b: Node) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;
  return Math.sqrt(dx * dx + dy * dy);
}

function edgeWeight(a: Node, b: Node) {
  const d = distance(a, b);
  return 1 / (1 + d);
}

/**
 * =========================
 * MESSAGE FUNCTION (MPNN STYLE)
 * =========================
 */

function message(sender: Node, receiver: Node) {
  const w = edgeWeight(sender, receiver);

  const msg = new Array(DIM).fill(0);

  for (let i = 0; i < DIM; i++) {
    msg[i] = (sender.h[i] || 0) * w;
  }

  return msg;
}

/**
 * =========================
 * NORMALIZED AGGREGATION (IMPORTANT FIX)
 * =========================
 */

function aggregate(messages: number[][]) {
  const out = new Array(DIM).fill(0);

  if (!messages.length) return out;

  for (const msg of messages) {
    for (let i = 0; i < DIM; i++) {
      out[i] += msg[i];
    }
  }

  // normalize (prevents exploding embeddings)
  for (let i = 0; i < DIM; i++) {
    out[i] /= messages.length;
  }

  return out;
}

/**
 * =========================
 * UPDATE FUNCTION (RESIDUAL GNN STYLE)
 * =========================
 */

function update(oldH: number[], agg: number[]) {
  const next = new Array(DIM);

  for (let i = 0; i < DIM; i++) {
    const transformed = agg[i] ?? 0;

    // residual + non-linearity (stable GNN trick)
    next[i] = Math.tanh(oldH[i] + 0.6 * transformed);
  }

  return next;
}

/**
 * =========================
 * ONE GNN LAYER
 * =========================
 */

function runGNNLayer(nodes: Node[]) {
  const updated: Node[] = [];

  for (const node of nodes) {
    const msgs: number[][] = [];

    for (const other of nodes) {
      if (node.id === other.id) continue;

      msgs.push(message(other, node));
    }

    const agg = aggregate(msgs);

    updated.push({
      ...node,
      h: update(node.h, agg),
    });
  }

  return updated;
}

/**
 * =========================
 * MULTI-LAYER PROPAGATION
 * =========================
 */

function runGNN(nodes: Node[], layers = 2) {
  let current = nodes;

  for (let i = 0; i < layers; i++) {
    current = runGNNLayer(current);
  }

  return current;
}

/**
 * =========================
 * DECISION HEAD
 * =========================
 */

function score(node: Node) {
  // stable scoring projection
  return node.h.reduce((a, b) => a + b, 0);
}

/**
 * =========================
 * MAIN GNN DISPATCH ENGINE
 * =========================
 */

export async function generateGNNDispatch(
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
    initShipmentNode(shipment);

  const driverNodes =
    drivers.map(initDriverNode);

  const graphNodes = [
    ...driverNodes,
    shipmentNode,
  ];

  /**
   * =========================
   * MESSAGE PASSING PHASE
   * =========================
   */
  const learned =
    runGNN(graphNodes, 2);

  /**
   * =========================
   * DRIVER RANKING
   * =========================
   */
  const scored = learned
    .filter((n) => n.type === "driver")
    .map((n) => ({
      driverId: n.id,
      score: score(n),
    }));

  /**
   * =========================
   * SOFTMAX SELECTION
   * =========================
   */

  const exp = scored.map((s) =>
    Math.exp(s.score)
  );

  const sum = exp.reduce(
    (a, b) => a + b,
    0
  );

  const probs = exp.map((v) => v / sum);

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
   * =========================
   * REAL ROUTING VALIDATION (OSRM + TRAFFIC)
   * =========================
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
    status: "ASSIGNED_GNN_V2",
  };
}