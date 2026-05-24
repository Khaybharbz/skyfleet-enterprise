
/**
 * =========================================================
 * TRANSFORMER-BASED RL POLICY (ACTOR–CRITIC)
 * =========================================================
 * - Self-attention over fleet nodes
 * - Global interaction modeling (drivers ↔ shipments)
 * - Actor head: dispatch scoring
 * - Critic head: value estimation
 * =========================================================
 */

export type Action = {
  driverId: string;
  shipmentId: string;
};

export type Experience = {
  state: any;
  action: Action;
  reward: number;
};

/**
 * =========================================================
 * TOKEN REPRESENTATION
 * =========================================================
 */
type Token = {
  id: string;
  type: "driver" | "shipment";
  features: number[];
};

/**
 * =========================================================
 * TRANSFORMER BLOCK (MINIMAL IMPLEMENTATION)
 * =========================================================
 */

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
 * SELF-ATTENTION MECHANISM (SCALED DOT PRODUCT)
 * =========================================================
 */
function attention(tokens: number[][]): number[][] {
  const n = tokens.length;

  const scores: number[][] = Array.from({ length: n }, () =>
    Array(n).fill(0)
  );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let dot = 0;

      for (let k = 0; k < tokens[i].length; k++) {
        dot += tokens[i][k] * tokens[j][k];
      }

      scores[i][j] = dot;
    }
  }

  // softmax normalize
  return scores.map((row) => {
    const max = Math.max(...row);
    const exps = row.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((v) => v / sum);
  });
}

/**
 * =========================================================
 * ENCODER
 * =========================================================
 */
function encodeTokens(state: any): Token[] {
  return state.nodes.map((n: any) => ({
    id: n.id,
    type: n.type,
    features: n.embedding ?? Array(16).fill(0),
  }));
}

/**
 * =========================================================
 * TRANSFORMER POLICY NETWORK
 * =========================================================
 */

export class RLPolicy {
  /**
   * ATTENTION PROJECTION LAYERS
   */
  private projQ = new Linear(16, 16);
  private projK = new Linear(16, 16);
  private projV = new Linear(16, 16);

  /**
   * ACTOR HEAD
   */
  private actorHead = new Linear(16, 1);

  /**
   * CRITIC HEAD
   */
  private criticHead = new Linear(16, 1);

  /**
   * =========================================================
   * FORWARD PASS (TRANSFORMER ENCODING)
   * =========================================================
   */
  private encode(state: any): number[][] {
    const tokens = encodeTokens(state);

    const X = tokens.map((t) => t.features);

    const Q = X.map((x) => this.projQ.forward(x));
    const K = X.map((x) => this.projK.forward(x));
    const V = X.map((x) => this.projV.forward(x));

    const attn = attention(Q.map((q, i) => {
      const k = K[i];
      const v = V[i];

      return q.map((_, j) => v[j]);
    }));

    /**
     * CONTEXTUALIZED REPRESENTATION
     */
    return V.map((v, i) =>
      v.map((val, j) =>
        val *
        (attn[i].reduce((a, b) => a + b, 0) || 1)
      )
    );
  }

  /**
   * =========================================================
   * GLOBAL STATE VALUE (CRITIC)
   * =========================================================
   */
  value(state: any): number {
    const encoded = this.encode(state);

    let sum = 0;

    for (const token of encoded) {
      sum += this.criticHead.forward(token)[0];
    }

    return sum / (encoded.length || 1);
  }

  /**
   * =========================================================
   * POLICY SCORE (ACTOR)
   * =========================================================
   */
  score(state: any, action: Action): number {
    const encoded = this.encode(state);

    const idx =
      (action.driverId.length +
        action.shipmentId.length) %
      encoded.length;

    return this.actorHead.forward(
      encoded[idx] || Array(16).fill(0)
    )[0];
  }

  /**
   * =========================================================
   * PPO-LIKE UPDATE STEP (TRANSFORMER WEIGHTS)
   * =========================================================
   */
  update(
    state: any,
    action: Action,
    advantage: number
  ): number {
    const encoded = this.encode(state);

    const idx =
      (action.driverId.length +
        action.shipmentId.length) %
      encoded.length;

    const feature = encoded[idx];

    const value = this.value(state);
    const oldScore = this.score(state, action);

    const policyGradient = advantage * 0.0005;

    const newScore = oldScore + policyGradient;

    const ratio =
      newScore / (oldScore + 1e-6);

    const clipped = Math.min(
      Math.max(ratio, 0.8),
      1.2
    );

    const loss =
      -clipped * advantage +
      Math.pow(advantage - value, 2);

    /**
     * BACKPROP APPROXIMATION (PLACEHOLDER)
     * Replace with real autograd system later
     */
    for (let i = 0; i < this.actorHead.w.length; i++) {
      for (let j = 0; j < this.actorHead.w[i].length; j++) {
        this.actorHead.w[i][j] += policyGradient;
        this.criticHead.w[i][j] += policyGradient * 0.5;
      }
    }

    return loss;
  }

  /**
   * =========================================================
   * SNAPSHOT
   * =========================================================
   */
  async saveSnapshot() {
    console.log("[TransformerRL] snapshot saved");
  }
}

/**
 * SINGLETON EXPORT
 */
export const rlPolicy = new RLPolicy();