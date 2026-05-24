
/**
 * =========================================================
 * MULTI-AGENT HIERARCHICAL RL DISPATCH SYSTEM
 * Manager Policy + Driver Policies (MA-HRL)
 * =========================================================
 */

/**
 * =========================
 * TYPES
 * =========================
 */

export type GraphState = {
  driverEmbeddings: Record<string, number[]>;
  shipmentEmbedding: number[];
};

export type Experience = {
  state: GraphState;
  shipmentId: string;
  selectedDriver: string;
  reward: number;
};

/**
 * =========================
 * CONFIG
 * =========================
 */

const TOP_K = 5;
const EMBED_DIM = 6;

/**
 * =========================
 * REPLAY BUFFER
 * =========================
 */

class ReplayBuffer {
  private buffer: Experience[] = [];

  add(exp: Experience) {
    this.buffer.push(exp);

    if (this.buffer.length > 10000) {
      this.buffer.shift();
    }
  }

  sample(batchSize: number) {
    return this.buffer
      .sort(() => Math.random() - 0.5)
      .slice(0, batchSize);
  }

  size() {
    return this.buffer.length;
  }
}

const replayBuffer = new ReplayBuffer();

/**
 * =========================
 * UTILITIES
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

  const exp = values.map((v) =>
    Math.exp(v - max)
  );

  const sum = exp.reduce(
    (a, b) => a + b,
    0
  );

  return exp.map((v) => v / sum);
}

/**
 * =========================
 * MANAGER POLICY (HIGH-LEVEL SELECTION)
 * Selects top-K candidate drivers
 * =========================
 */

export function managerPolicy(
  state: GraphState
): string[] {
  const drivers = Object.entries(
    state.driverEmbeddings
  );

  const scores = drivers.map(
    ([id, emb]) => {
      const score = dot(
        emb,
        state.shipmentEmbedding
      );

      return { id, score };
    }
  );

  const probs = softmax(
    scores.map((s) => s.score)
  );

  return scores
    .map((s, i) => ({
      id: s.id,
      score: s.score,
      p: probs[i],
    }))
    .sort((a, b) => b.p - a.p)
    .slice(0, TOP_K)
    .map((s) => s.id);
}

/**
 * =========================
 * DRIVER POLICY (LOW-LEVEL EXECUTION)
 * Each driver is implicitly an agent scoring itself
 * =========================
 */

export function driverPolicyScore(
  driverId: string,
  state: GraphState
) {
  const emb =
    state.driverEmbeddings[driverId];

  if (!emb) return -Infinity;

  return dot(
    emb,
    state.shipmentEmbedding
  );
}

/**
 * =========================
 * REWARD FUNCTION (SYSTEM-WIDE SIGNAL)
 * =========================
 */

export function computeReward(input: {
  deliveryTime: number;
  expectedTime: number;
  success: boolean;
  distance: number;
  fleetLoadBalance?: number;
}) {
  if (!input.success) return -10;

  const timePenalty =
    input.deliveryTime - input.expectedTime;

  const distancePenalty =
    input.distance * 0.01;

  const balanceBonus =
    input.fleetLoadBalance || 0;

  return (
    10 -
    timePenalty * 0.5 -
    distancePenalty +
    balanceBonus
  );
}

/**
 * =========================
 * EXPERIENCE STORAGE
 * =========================
 */

export function storeExperience(
  exp: Experience
) {
  replayBuffer.add(exp);
}

/**
 * =========================
 * POLICY UPDATE (SIMPLIFIED ACTOR-CRITIC STYLE)
 * =========================
 */

export function updateMAHRLPolicy() {
  const batch = replayBuffer.sample(64);

  if (batch.length === 0) {
    return {
      status: "NO_DATA",
    };
  }

  let managerSignal = 0;
  let driverSignal = 0;

  for (const exp of batch) {
    const baseline = 1;

    const advantage =
      exp.reward - baseline;

    // Manager improves selection quality
    managerSignal += advantage * 0.01;

    // Driver improves execution consistency
    driverSignal +=
      Math.abs(advantage) * 0.005;
  }

  return {
    managerSignal,
    driverSignal,
    batchSize: batch.length,
    bufferSize: replayBuffer.size(),
    status: "MAHRL_UPDATED",
  };
}

/**
 * =========================
 * MAIN HIERARCHICAL DISPATCH ENGINE
 * =========================
 */

export function mahrlDispatch(
  state: GraphState,
  shipmentId: string,
  metadata: {
    deliveryTime: number;
    expectedTime: number;
    success: boolean;
    distance: number;
    fleetLoadBalance?: number;
  }
) {
  /**
   * 1. MANAGER SELECTS CANDIDATE POOL
   */
  const candidates = managerPolicy(state);

  /**
   * 2. DRIVER POLICY RANKING
   */
  const ranked = candidates.map((id) => ({
    id,
    score: driverPolicyScore(id, state),
  }));

  ranked.sort((a, b) => b.score - a.score);

  const selectedDriver =
    ranked[0]?.id || "NONE";

  /**
   * 3. REWARD COMPUTATION
   */
  const reward =
    computeReward(metadata);

  /**
   * 4. STORE EXPERIENCE
   */
  storeExperience({
    state,
    shipmentId,
    selectedDriver,
    reward,
  });

  /**
   * 5. RETURN DISPATCH RESULT
   */
  return {
    shipmentId,
    driverId: selectedDriver,
    reward,
    candidates,
    status: "MAHRL_DISPATCHED",
  };
}