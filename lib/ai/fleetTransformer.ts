
/**
 * =========================================================
 * GLOBAL FLEET TRANSFORMER (SPATIO-TEMPORAL MODEL CORE)
 * =========================================================
 * - Fleet tokens = drivers + shipments
 * - Temporal memory = sliding window history
 * - Self-attention = global fleet interaction modeling
 * =========================================================
 */

/**
 * =========================
 * TYPES
 * =========================
 */

export type FleetNode = {
  id: string;
  type: "driver" | "shipment";

  lat: number;
  lng: number;

  embedding: number[];
  velocity?: number;
};

export type FleetSnapshot = {
  timestamp: number;
  nodes: FleetNode[];
};

/**
 * =========================
 * CONFIG
 * =========================
 */

const EMBED_DIM = 6;
const MAX_HISTORY = 30;

/**
 * =========================
 * TEMPORAL ENCODING
 * =========================
 */

function temporalEncoding(t: number): number[] {
  const enc = new Array(EMBED_DIM).fill(0);

  for (let i = 0; i < EMBED_DIM; i++) {
    const freq = Math.pow(10000, i / EMBED_DIM);
    enc[i] = Math.sin(t / freq);
  }

  return enc;
}

/**
 * =========================
 * UTILS
 * =========================
 */

function dot(a: number[], b: number[]) {
  let sum = 0;

  for (let i = 0; i < EMBED_DIM; i++) {
    sum += (a[i] || 0) * (b[i] || 0);
  }

  return sum;
}

function softmax(values: number[]) {
  const max = Math.max(...values);

  const exps = values.map(v =>
    Math.exp(v - max)
  );

  const total = exps.reduce(
    (a, b) => a + b,
    0
  );

  return exps.map(v => v / total);
}

/**
 * =========================
 * FLEET TRANSFORMER CORE
 * =========================
 */

export class FleetTransformer {
  private history: FleetSnapshot[] = [];

  /**
   * Add new fleet snapshot (streaming ingestion)
   */
  push(snapshot: FleetSnapshot) {
    this.history.push(snapshot);

    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }
  }

  /**
   * Build spatio-temporal token sequence
   */
  private buildTokens(): FleetNode[] {
    const tokens: FleetNode[] = [];

    for (const snap of this.history) {
      const tEnc = temporalEncoding(
        snap.timestamp
      );

      for (const node of snap.nodes) {
        const enrichedEmbedding = node.embedding.map(
          (v, i) => v + (tEnc[i] || 0)
        );

        tokens.push({
          ...node,
          embedding: enrichedEmbedding,
        });
      }
    }

    return tokens;
  }

  /**
   * SELF-ATTENTION OVER FLEET TOKENS
   */
  private selfAttention(tokens: FleetNode[]) {
    const n = tokens.length;

    const attentionMatrix: number[][] = [];

    for (let i = 0; i < n; i++) {
      attentionMatrix[i] = [];

      for (let j = 0; j < n; j++) {
        const score = dot(
          tokens[i].embedding,
          tokens[j].embedding
        );

        attentionMatrix[i].push(score);
      }
    }

    const weights = attentionMatrix.map(row =>
      softmax(row)
    );

    const updated: FleetNode[] = [];

    for (let i = 0; i < n; i++) {
      const newEmbedding = new Array(EMBED_DIM).fill(0);

      for (let j = 0; j < n; j++) {
        for (let k = 0; k < EMBED_DIM; k++) {
          newEmbedding[k] +=
            tokens[j].embedding[k] *
            weights[i][j];
        }
      }

      updated.push({
        ...tokens[i],
        embedding: newEmbedding.map(v =>
          Math.tanh(v)
        ),
      });
    }

    return updated;
  }

  /**
   * FULL FORWARD PASS
   * Produces contextual fleet representation
   */
  forward() {
    const tokens = this.buildTokens();

    if (tokens.length === 0) return [];

    return this.selfAttention(tokens);
  }

  /**
   * EXTRACT DRIVER EMBEDDINGS ONLY
   */
  getDriverEmbeddings() {
    const context = this.forward();

    const drivers = context.filter(
      n => n.type === "driver"
    );

    const map: Record<string, number[]> = {};

    for (const d of drivers) {
      map[d.id] = d.embedding;
    }

    return map;
  }

  /**
   * GET SHIPMENT EMBEDDING
   */
  getShipmentEmbedding(shipmentId: string) {
    const context = this.forward();

    return (
      context.find(
        n =>
          n.type === "shipment" &&
          n.id === shipmentId
      )?.embedding || null
    );
  }
}

/**
 * =========================
 * DISPATCH HEAD (USES TRANSFORMER CONTEXT)
 * =========================
 */

export function transformerDispatch(
  model: FleetTransformer,
  shipmentId: string
) {
  const context = model.forward();

  const shipment = context.find(
    n =>
      n.type === "shipment" &&
      n.id === shipmentId
  );

  const drivers = context.filter(
    n => n.type === "driver"
  );

  if (!shipment) {
    return {
      status: "NO_SHIPMENT_FOUND",
    };
  }

  const scored = drivers.map(driver => {
    let score = 0;

    for (let i = 0; i < EMBED_DIM; i++) {
      score +=
        (driver.embedding[i] || 0) *
        (shipment.embedding[i] || 0);
    }

    return {
      driverId: driver.id,
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    shipmentId,
    driverId: scored[0]?.driverId,
    score: scored[0]?.score,
    status: "TRANSFORMER_DISPATCHED",
  };
}

/**
 * =========================
 * OPTIONAL: DEMAND FORECASTING HEAD
 * =========================
 */

export function forecastDemand(
  model: FleetTransformer
) {
  const context = model.forward();

  const grid: Record<string, number> = {};

  for (const node of context) {
    const key = `${Math.round(
      node.lat
    )},${Math.round(node.lng)}`;

    grid[key] = (grid[key] || 0) + 1;
  }

  return Object.entries(grid).map(
    ([zone, value]) => ({
      zone,
      predictedDemand: value,
    })
  );
}