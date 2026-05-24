type Driver = {
  id: string;
  lat: number;
  lng: number;
};

type Shipment = {
  id: string;
  latitude: number;
  longitude: number;
  priority?: number;
  trafficFactor?: number;
};

/**
 * =========================================
 * POLICY MEMORY (π)
 * driver preference weights per state
 * =========================================
 */

const policy: Record<string, number> = {};

/**
 * STATE ENCODER
 * simple deterministic hash of environment
 */
function encodeState(
  shipment: Shipment,
  driver: Driver
) {
  return `${shipment.id}_${driver.id}`;
}

/**
 * =========================================
 * POLICY FORWARD PASS
 * =========================================
 */

function getPolicyScore(
  state: string
) {
  return policy[state] ?? 0;
}

/**
 * =========================================
 * SOFTMAX ACTION SELECTION
 * (PPO stochastic policy)
 * =========================================
 */

export function selectDriverPPO(
  drivers: Driver[],
  shipment: Shipment
): Driver | null {
  if (!drivers.length) return null;

  const scores = drivers.map((d) => {
    const s = encodeState(
      shipment,
      d
    );

    return {
      driver: d,
      score: getPolicyScore(s),
    };
  });

  /**
   * softmax sampling (stochastic policy)
   */
  const expScores = scores.map(
    (s) => Math.exp(s.score)
  );

  const sum = expScores.reduce(
    (a, b) => a + b,
    0
  );

  const probs = expScores.map(
    (v) => v / sum
  );

  const rand = Math.random();

  let acc = 0;

  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];

    if (rand <= acc) {
      return scores[i].driver;
    }
  }

  return scores[0].driver;
}

/**
 * =========================================
 * PPO-LIKE UPDATE (CLIPPED LEARNING)
 * =========================================
 */

export function updatePolicy(
  shipment: Shipment,
  driver: Driver,
  reward: number
) {
  const state = encodeState(
    shipment,
    driver
  );

  const old = policy[state] ?? 0;

  const learningRate = 0.1;

  /**
   * CLIPPED UPDATE (PPO idea)
   */
  const delta = reward - old;

  const clipped =
    Math.max(-1, Math.min(1, delta));

  policy[state] =
    old + learningRate * clipped;
}