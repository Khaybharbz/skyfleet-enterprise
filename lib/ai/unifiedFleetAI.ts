
/**
 * =========================================================
 * UNIFIED FLEET AI SYSTEM
 * ST-GAT + TRANSFORMER + MAHRL (Production Clean Version)
 * =========================================================
 */

/**
 * =========================
 * TYPES
 * =========================
 */

export type NodeType = "driver" | "shipment";

export type FleetNode = {
  id: string;
  type: NodeType;

  lat: number;
  lng: number;

  embedding: number[];
};

export type FleetState = {
  nodes: FleetNode[];
  timestamp: number;
};

export type Experience = {
  state: FleetState;
  shipmentId: string;
  selectedDriver: string;
  reward: number;
};

/**
 * =========================
 * CONFIG
 * =========================
 */

const EMBED_DIM = 6;
const TOP_K = 5;
const MEMORY_SIZE = 10000;

/**
 * =========================
 * MEMORY BUFFER
 * =========================
 */

const memory: Experience[] = [];

/**
 * =========================
 * UTILS
 * =========================
 */

function dot(a: number[], b: number[]) {
  let s = 0;

  for (let i = 0; i < EMBED_DIM; i++) {
    s += (a[i] || 0) * (b[i] || 0);
  }

  return s;
}

function softmax(values: number[]) {
  const max = Math.max(...values);

  const exps = values.map(v =>
    Math.exp(v - max)
  );

  const sum = exps.reduce(
    (a, b) => a + b,
    0
  );

  return exps.map(v => v / sum);
}

/**
 * =========================
 * ST-GAT LAYER (SPATIAL GRAPH ENCODING)
 * =========================
 */

export function stgatEncode(nodes: FleetNode[]) {
  const n = nodes.length;

  const weights: number[][] = [];

  for (let i = 0; i < n; i++) {
    weights[i] = [];

    for (let j = 0; j < n; j++) {
      const spatialDist = Math.hypot(
        nodes[i].lat - nodes[j].lat,
        nodes[i].lng - nodes[j].lng
      );

      const similarity = dot(
        nodes[i].embedding,
        nodes[j].embedding
      );

      weights[i].push(similarity - spatialDist);
    }
  }

  const normWeights = weights.map(softmax);

  return nodes.map((node, i) => {
    const newEmb = new Array(EMBED_DIM).fill(0);

    for (let j = 0; j < n; j++) {
      for (let k = 0; k < EMBED_DIM; k++) {
        newEmb[k] +=
          nodes[j].embedding[k] *
          normWeights[i][j];
      }
    }

    return {
      ...node,
      embedding: newEmb.map(v =>
        Math.tanh(v)
      ),
    };
  });
}

/**
 * =========================
 * TRANSFORMER LAYER (GLOBAL CONTEXT MIXING)
 * =========================
 */

export function transformerEncode(nodes: FleetNode[]) {
  const updated: FleetNode[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const emb = new Array(EMBED_DIM).fill(0);

    for (let j = 0; j < nodes.length; j++) {
      const influence = 0.1;

      for (let k = 0; k < EMBED_DIM; k++) {
        emb[k] +=
          nodes[j].embedding[k] * influence;
      }
    }

    updated.push({
      ...nodes[i],
      embedding: emb.map(v =>
        Math.tanh(v)
      ),
    });
  }

  return updated;
}

/**
 * =========================
 * MAHRL POLICY LAYER
 * =========================
 */

export function managerPolicy(nodes: FleetNode[]) {
  const drivers = nodes.filter(
    n => n.type === "driver"
  );

  const shipments = nodes.filter(
    n => n.type === "shipment"
  );

  const map: Record<string, string[]> = {};

  for (const shipment of shipments) {
    const scored = drivers.map(driver => {
      const score = dot(
        driver.embedding,
        shipment.embedding
      );

      return {
        id: driver.id,
        score,
      };
    });

    scored.sort(
      (a, b) => b.score - a.score
    );

    map[shipment.id] = scored
      .slice(0, TOP_K)
      .map(s => s.id);
  }

  return map;
}

export function driverPolicy(
  candidates: string[],
  nodes: FleetNode[],
  shipmentId: string
) {
  const shipment = nodes.find(
    n => n.id === shipmentId
  );

  if (!shipment) return null;

  let best = {
    id: "",
    score: -Infinity,
  };

  for (const id of candidates) {
    const driver = nodes.find(
      n => n.id === id
    );

    if (!driver) continue;

    const score = dot(
      driver.embedding,
      shipment.embedding
    );

    if (score > best.score) {
      best = { id, score };
    }
  }

  return best.id;
}

/**
 * =========================
 * REWARD FUNCTION
 * =========================
 */

export function computeReward(input: {
  success: boolean;
  deliveryTime: number;
  expectedTime: number;
  distance: number;
}) {
  if (!input.success) return -10;

  const timePenalty =
    input.deliveryTime -
    input.expectedTime;

  const distancePenalty =
    input.distance * 0.01;

  return (
    10 -
    timePenalty * 0.5 -
    distancePenalty
  );
}

/**
 * =========================
 * MEMORY STORE
 * =========================
 */

export function store(exp: Experience) {
  memory.push(exp);

  if (memory.length > MEMORY_SIZE) {
    memory.shift();
  }
}

/**
 * =========================
 * MAIN UNIFIED AI ENGINE
 * =========================
 */

export function unifiedFleetAI(
  state: FleetState,
  shipmentId: string,
  metadata: {
    success: boolean;
    deliveryTime: number;
    expectedTime: number;
    distance: number;
  }
) {
  /**
   * 1. ST-GAT SPATIAL ENCODING
   */
  const spatial = stgatEncode(
    state.nodes
  );

  /**
   * 2. TRANSFORMER GLOBAL CONTEXT
   */
  const context =
    transformerEncode(spatial);

  /**
   * 3. MAHRL MANAGER SELECTION
   */
  const assignments =
    managerPolicy(context);

  const candidates =
    assignments[shipmentId] || [];

  /**
   * 4. DRIVER POLICY SELECTION
   */
  const selectedDriver =
    driverPolicy(
      candidates,
      context,
      shipmentId
    );

  /**
   * 5. REWARD COMPUTATION
   */
  const reward =
    computeReward(metadata);

  /**
   * 6. STORE EXPERIENCE
   */
  store({
    state,
    shipmentId,
    selectedDriver: selectedDriver || "",
    reward,
  });

  /**
   * 7. OUTPUT
   */
  return {
    shipmentId,
    driverId: selectedDriver,
    reward,
    candidates,
    status: "UNIFIED_FLEET_AI_OK",
  };
}

/**
 * =========================
 * OPTIONAL DEBUG VIEW
 * =========================
 */

export function getMemorySize() {
  return memory.length;
}