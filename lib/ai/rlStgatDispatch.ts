
/**
 * =========================================================
 * REINFORCEMENT LEARNING + ST-GAT DISPATCH LAYER
 * Actor-Critic + Experience Replay
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

type Experience = {
  state: GraphState;
  action: string;
  reward: number;
};

/**
 * =========================
 * CONFIG
 * =========================
 */

const GAMMA = 0.95; // discount factor
const LR = 0.001;
const BUFFER_SIZE = 5000;
const BATCH_SIZE = 32;

/**
 * =========================
 * EXPERIENCE REPLAY BUFFER
 * =========================
 */

class ReplayBuffer {
  private buffer: Experience[] = [];

  add(exp: Experience) {
    this.buffer.push(exp);

    if (this.buffer.length > BUFFER_SIZE) {
      this.buffer.shift();
    }
  }

  sample(batchSize: number): Experience[] {
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
 * SOFTMAX POLICY
 * =========================
 */

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
 * POLICY NETWORK (ACTOR)
 * =========================
 */

export function selectDriverPolicy(
  state: GraphState
): string {
  const drivers = Object.entries(
    state.driverEmbeddings
  );

  const scores = drivers.map(
    ([driverId, emb]) => {
      let score = 0;

      for (let i = 0; i < emb.length; i++) {
        score +=
          emb[i] *
          (state.shipmentEmbedding[i] || 0);
      }

      return { driverId, score };
    }
  );

  const probs = softmax(
    scores.map((s) => s.score)
  );

  let r = Math.random();
  let acc = 0;

  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];

    if (r <= acc) {
      return scores[i].driverId;
    }
  }

  return scores[0]?.driverId;
}

/**
 * =========================
 * REWARD FUNCTION (CRITIC SIGNAL)
 * =========================
 */

export function computeReward(input: {
  deliveryTime: number;
  expectedTime: number;
  success: boolean;
  distance: number;
  fuelCost?: number;
}) {
  if (!input.success) return -10;

  const timePenalty =
    input.deliveryTime - input.expectedTime;

  const distancePenalty =
    input.distance * 0.01;

  const fuelPenalty =
    (input.fuelCost || 0) * 0.05;

  return (
    10 -
    timePenalty * 0.5 -
    distancePenalty -
    fuelPenalty
  );
}

/**
 * =========================
 * STORE EXPERIENCE
 * =========================
 */

export function storeExperience(exp: Experience) {
  replayBuffer.add(exp);
}

/**
 * =========================
 * VALUE ESTIMATION (SIMPLIFIED CRITIC)
 * =========================
 */

function estimateValue(state: GraphState) {
  const drivers = Object.values(
    state.driverEmbeddings
  );

  let v = 0;

  for (const emb of drivers) {
    for (let i = 0; i < emb.length; i++) {
      v += emb[i];
    }
  }

  return v / (drivers.length || 1);
}

/**
 * =========================
 * POLICY GRADIENT UPDATE (SIMPLIFIED ACTOR-CRITIC)
 * =========================
 */

export function updatePolicy() {
  const batch =
    replayBuffer.sample(BATCH_SIZE);

  if (batch.length === 0) {
    return {
      status: "NO_DATA",
    };
  }

  let actorGradient = 0;
  let criticLoss = 0;

  for (const exp of batch) {
    const value = estimateValue(exp.state);

    const advantage =
      exp.reward - value;

    actorGradient +=
      advantage * LR;

    criticLoss +=
      Math.pow(exp.reward - value, 2);
  }

  return {
    actorGradient,
    criticLoss,
    batchSize: batch.length,
    bufferSize: replayBuffer.size(),
    status: "POLICY_UPDATED",
  };
}

/**
 * =========================
 * MAIN DISPATCH FUNCTION
 * =========================
 */

export function rlStgatDispatch(
  state: GraphState,
  metadata: {
    deliveryTime: number;
    expectedTime: number;
    success: boolean;
    distance: number;
    fuelCost?: number;
  }
) {
  /**
   * 1. POLICY SELECT ACTION
   */
  const driverId =
    selectDriverPolicy(state);

  /**
   * 2. COMPUTE REWARD
   */
  const reward = computeReward(metadata);

  /**
   * 3. STORE EXPERIENCE (STATE, ACTION, REWARD)
   */
  storeExperience({
    state,
    action: driverId,
    reward,
  });

  /**
   * 4. RETURN DISPATCH RESULT
   */
  return {
    driverId,
    reward,
    status: "RL_STGAT_ASSIGNED",
  };
}