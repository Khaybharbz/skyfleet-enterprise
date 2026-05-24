
/**
 * =========================================================
 * SPATIO-TEMPORAL GRAPH TRANSFORMER POLICY
 * (ST-GAT + TRANSFORMER FUSION)
 * =========================================================
 *
 * Combines:
 * - Graph structure (fleet connectivity)
 * - Temporal dynamics (movement over time)
 * - Transformer self-attention (global reasoning)
 *
 * Used for:
 * - dispatch decisions
 * - route influence scoring
 * - congestion-aware assignment
 * =========================================================
 */

export type NodeType = "driver" | "shipment";

export type FleetNode = {
  id: string;
  type: NodeType;

  lat: number;
  lng: number;

  timestamp: number;

  embedding: number[];
};

export type Edge = {
  from: string;
  to: string;
  weight: number;
};

export type WorldState = {
  nodes: FleetNode[];
  edges?: Edge[];
  timestamp: number;
};

export type Action = {
  driverId: string;
  shipmentId: string;
};

class Linear {
  w: number[][];
  b: number[];

  constructor(inSize: number, outSize: number) {
    this.w = Array.from({ length: outSize }, () =>
      Array.from({ length: inSize }, () => Math.random() * 0.01)
    );
    this.b = Array(outSize).fill(0);
  }

  forward(x: number[]): number[] {
    return this.w.map((row, i) => {
      let sum = this.b[i];

      for (let j = 0; j < x.length; j++) {
        sum += row[j] * x[j];
      }

      return sum;
    });
  }
}

/**
 * =========================================================
 * TEMPORAL ENCODING
 * =========================================================
 */
function temporalEncoding(node: FleetNode, now: number): number {
  const dt = (now - node.timestamp) / 1000; // seconds
  return Math.exp(-0.01 * dt); // decay factor
}

/**
 * =========================================================
 * GRAPH MESSAGE PASSING (ST-GAT CORE)
 * =========================================================
 */
function aggregateNeighbors(
  nodes: FleetNode[],
  edges: Edge[],
  nodeId: string
) {
  const incoming = edges.filter((e) => e.to === nodeId);

  const messages: number[][] = [];

  for (const e of incoming) {
    const node = nodes.find((n) => n.id === e.from);
    if (!node) continue;

    const msg = node.embedding.map(
      (v) => v * e.weight
    );

    messages.push(msg);
  }

  if (messages.length === 0) {
    return Array(nodes[0].embedding.length).fill(0);
  }

  const dim = messages[0].length;
  const out = Array(dim).fill(0);

  for (const m of messages) {
    for (let i = 0; i < dim; i++) {
      out[i] += m[i];
    }
  }

  return out.map((v) => v / messages.length);
}

/**
 * =========================================================
 * SELF-ATTENTION FUSION (GLOBAL CONTEXT)
 * =========================================================
 */
function attentionFusion(features: number[][]): number[][] {
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

  // softmax normalize per row
  return scores.map((row) => {
    const max = Math.max(...row);
    const exps = row.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);

    return exps.map((v) => v / sum);
  });
}

/**
 * =========================================================
 * MAIN ST-GAT + TRANSFORMER POLICY
 * =========================================================
 */

export class STGTransformerPolicy {
  private actor = new Linear(32, 1);
  private critic = new Linear(32, 1);

  /**
   * BUILD SPATIO-TEMPORAL NODE REPRESENTATIONS
   */
  private buildFeatures(state: WorldState): number[][] {
    const { nodes, edges = [], timestamp } = state;

    return nodes.map((node) => {
      const graphMsg = aggregateNeighbors(
        nodes,
        edges,
        node.id
      );

      const temporal = temporalEncoding(node, timestamp);

      const fused = node.embedding.map(
        (v, i) =>
          (v + (graphMsg[i] || 0)) * temporal
      );

      return fused;
    });
  }

  /**
   * GLOBAL TRANSFORMER CONTEXT
   */
  private fuse(features: number[][]): number[][] {
    const attn = attentionFusion(features);

    return features.map((f, i) =>
      f.map((v, j) => v * attn[i][j] || v)
    );
  }

  /**
   * INFERENCE VALUE FUNCTION
   */
  value(state: WorldState): number {
    const features = this.buildFeatures(state);
    const fused = this.fuse(features);

    let sum = 0;

    for (const f of fused) {
      sum += this.critic.forward(f)[0];
    }

    return sum / fused.length;
  }

  /**
   * DISPATCH SCORING (ACTOR)
   */
  score(state: WorldState, action: Action): number {
    const features = this.buildFeatures(state);
    const fused = this.fuse(features);

    const idx =
      (action.driverId.length +
        action.shipmentId.length) %
      fused.length;

    return this.actor.forward(
      fused[idx] || Array(32).fill(0)
    )[0];
  }

  /**
   * PPO-STYLE UPDATE (SIMPLIFIED)
   */
  update(state: WorldState, action: Action, advantage: number) {
    const features = this.buildFeatures(state);
    const fused = this.fuse(features);

    const idx =
      (action.driverId.length +
        action.shipmentId.length) %
      fused.length;

    const x = fused[idx];

    const lr = 0.0005;
    const grad = advantage * lr;

    for (let i = 0; i < this.actor.w.length; i++) {
      for (let j = 0; j < this.actor.w[i].length; j++) {
        this.actor.w[i][j] += grad;
        this.critic.w[i][j] += grad * 0.5;
      }
    }
  }
}

/**
 * SINGLETON EXPORT
 */
export const stgTransformerPolicy =
  new STGTransformerPolicy();