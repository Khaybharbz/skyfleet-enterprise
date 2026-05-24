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
};

export type Shipment = {
  id: string;
  latitude: number;
  longitude: number;
  priority?: number;
};

/**
 * =========================
 * EACH DRIVER = POLICY AGENT
 * =========================
 * policy[driverId] = preference weight
 */

const policy: Record<string, number> = {};

/**
 * =========================
 * INITIALIZE DRIVER POLICY
 * =========================
 */

function initDriver(driverId: string) {
  if (policy[driverId] === undefined) {
    policy[driverId] = Math.random() * 0.5;
  }
}

/**
 * =========================
 * STATE ENCODING
 * =========================
 */

function encodeState(
  driver: Driver,
  shipment: Shipment
) {
  return `${driver.id}_${shipment.id}`;
}

/**
 * =========================
 * ACTOR SELECTION (MULTI-AGENT SOFTMAX)
 * =========================
 */

export function selectDriverMAPPO(
  drivers: Driver[],
  shipment: Shipment
): Driver | null {
  if (!drivers.length) return null;

  const scores = drivers.map((d) => {
    initDriver(d.id);

    const state = encodeState(d, shipment);

    return {
      driver: d,
      score: policy[d.id],
      state,
    };
  });

  const exp = scores.map((s) =>
    Math.exp(s.score)
  );

  const sum = exp.reduce(
    (a, b) => a + b,
    0
  );

  const probs = exp.map((v) => v / sum);

  let r = Math.random();

  let acc = 0;

  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];

    if (r <= acc) {
      return scores[i].driver;
    }
  }

  return scores[0].driver;
}

/**
 * =========================
 * CENTRALIZED CRITIC (GLOBAL EVALUATION)
 * =========================
 */

async function evaluateGlobalReward(
  driver: Driver,
  shipment: Shipment
) {
  const route = await getHybridRoute(
    driver,
    shipment,
    shipment
  );

  /**
   * GLOBAL REWARD FUNCTION
   */
  const reward =
    -route.duration -
    route.trafficCost * 80 +
    (shipment.priority || 1) * 30;

  return reward;
}

/**
 * =========================
 * PPO-STYLE POLICY UPDATE (CLIPPED)
 * =========================
 */

function updatePolicy(
  driverId: string,
  reward: number
) {
  initDriver(driverId);

  const old = policy[driverId];

  const learningRate = 0.08;

  const delta = reward - old;

  /**
   * CLIPPING (PPO stability core)
   */
  const clipped = Math.max(
    -1,
    Math.min(1, delta)
  );

  policy[driverId] =
    old + learningRate * clipped;
}

/**
 * =========================
 * MAIN MAPPO DISPATCH ENGINE
 * =========================
 */

export async function generateMAPPODispatch(
  drivers: Driver[],
  shipment: Shipment
) {
  if (!drivers.length) {
    return {
      shipmentId: shipment.id,
      driverId: null,
      status: "NO_AGENTS",
      score: 0,
    };
  }

  /**
   * 1. multi-agent selection (exploration)
   */
  const selected =
    selectDriverMAPPO(drivers, shipment);

  if (!selected) {
    return {
      shipmentId: shipment.id,
      driverId: null,
      status: "FAILED",
      score: 0,
    };
  }

  /**
   * 2. centralized critic evaluation
   */
  const reward = await evaluateGlobalReward(
    selected,
    shipment
  );

  /**
   * 3. update ONLY selected agent
   */
  updatePolicy(selected.id, reward);

  return {
    shipmentId: shipment.id,
    driverId: selected.id,
    score: reward,
    status: "ASSIGNED_MAPPO",
  };
}