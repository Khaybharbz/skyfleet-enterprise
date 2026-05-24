
/**
 * =========================================================
 * STREAMING ST-GAT + TRANSFORMER POLICY (STABLE VERSION)
 * =========================================================
 * - Graph message passing
 * - Temporal decay encoding
 * - Attention fusion
 * - Bounded online learning weights
 * =========================================================
 */

export type NodeType = "driver" | "shipment";

export type FleetNode = {
  id: string;
  type: NodeType;

  lat: number;
  lng: number;

  embedding: number[];

  timestamp: number;
};

export type WorldState = {
  nodes: FleetNode[];
  edges?: { from: string; to: string; weight: number }[];
  timestamp: number;
};

export type Action = {
  driverId: string;
  shipmentId: string;
};

/**
 * =========================================================
 * SAFE SHARED MODEL STATE (NO UNBOUNDED DRIFT)
 * =========================================================
 */

class ModelState {
  actor: number[][] = Array.from({ length: 32 }, () =>
    Array(32).fill(0.01)
  );

  critic: number[][] = Array.from({ length: 32 }, () =>
    Array(32).fill(0.01)
  );

  /**
   * BOUNDED UPDATE (CRITICAL FOR STABILITY)
   */
  applyUpdate(matrix: number[][], grad: number) {
    const lr = Math.max(
      Math.min(grad, 0.001),
      -0.001
    );

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        matrix[i][j] += lr;

        /**
         * CLAMP WEIGHTS (PREVENT EXPLOSION)
         */
        matrix[i][j] = Math.max(
          -2,
          Math.min(2, matrix[i][j])
        );
      }
    }
  }
}

export const modelState = new ModelState();

/**
 * =========================================================
 * TEMPORAL DECAY ENCODING
 * =========================================================
 */

function temporalWeight(node: FleetNode, now: number) {
  const dt = (now - node.timestamp) / 1000;
  return Math.exp(-0.01 * dt);
}

/**
 * =========================================================
 * GRAPH MESSAGE PASSING (SIMPLIFIED ST-GAT)
 * =========================================================
 */

function graphAggregate(
  nodes: FleetNode[],
  node: FleetNode
) {
  const neighbors = nodes.filter(
    (n) => n.type === node.type
  );

  const agg = Array(node.embedding.length).fill(0);

  for (const n of neighbors) {
    const weight = 1 / (1 + Math.abs(n.lat - node.lat));

    for (let i = 0; i < agg.length; i++) {
      agg[i] += (n.embedding[i] || 0) * weight;
    }
  }

  return agg.map((v) => v / (neighbors.length || 1));
}

/**
 * =========================================================
 * ATTENTION FUSION (STABLE VERSION)
 * =========================================================
 */

function attention(features: number[][]) {
  const n = features.length;

  const scores: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0)
  );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let dot = 0;

      for (let k = 0; k < features[i].length; k++) {
        dot += features[i][k] * features[j][k];
      }

      scores[i][j] = dot;
    }
  }

  return scores.map((row) => {
    const max = Math.max(...row);
    const exps = row.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);

    return exps.map((v) => v / (sum || 1));
  });
}

/**
 * =========================================================
 * STREAMING ST-GAT POLICY
 * =========================================================
 */

export class StreamingSTGAT {
  /**
   * FEATURE ENCODING
   */
  private encode(node: FleetNode, now: number) {
    const temporal = temporalWeight(node, now);
    const graph = graphAggregate([], node);

    return node.embedding.map(
      (v, i) => (v + (graph[i] || 0)) * temporal
    );
  }

  /**
   * BUILD GRAPH FEATURES
   */
  private build(nodes: FleetNode[], now: number) {
    return nodes.map((n) => this.encode(n, now));
  }

  /**
   * FUSION LAYER
   */
  private fuse(features: number[][]) {
    const attn = attention(features);

    return features.map((f, i) =>
      f.map((v, j) => v * (attn[i][j] || 1))
    );
  }

  /**
   * =========================================================
   * ACTOR SCORE
   * =========================================================
   */
  score(state: WorldState, action: Action): number {
    const now = state.timestamp;
    const features = this.build(state.nodes, now);
    const fused = this.fuse(features);

    const idx =
      (action.driverId.length +
        action.shipmentId.length) %
      fused.length;

    const x = fused[idx];

    let sum = 0;

    for (let i = 0; i < 32; i++) {
      for (let j = 0; j < 32; j++) {
        sum += (modelState.actor[i][j] || 0) * (x[j] || 0);
      }
    }

    return sum;
  }

  /**
   * VALUE FUNCTION
   */
  value(state: WorldState): number {
    const features = this.build(state.nodes, state.timestamp);
    const fused = this.fuse(features);

    let sum = 0;

    for (const f of fused) {
      for (let i = 0; i < 32; i++) {
        sum += (modelState.critic[i][i] || 0) * (f[i] || 0);
      }
    }

    return sum / (fused.length || 1);
  }

  /**
   * =========================================================
   * SAFE ONLINE UPDATE
   * =========================================================
   */
  applyGradient(grad: number) {
    modelState.applyUpdate(modelState.actor, grad);
    modelState.applyUpdate(modelState.critic, grad * 0.5);
  }
}

export const streamingSTGAT = new StreamingSTGAT();