import { getHybridRoute } from "../routing/hybridRouter";

import {
  storeExperience,
  sampleBatch,
} from "./replayBuffer";

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
 * NEURAL PARAMETERS (SIMULATED ACTOR/CRITIC)
 * =========================
 */

const actorWeights: Record<string, number> = {};
const criticWeights: Record<string, number> = {};

/**
 * =========================
 * FEATURE ENCODER
 * =========================
 */

function encodeState(
  driver: Driver,
  shipment: Shipment
) {
  const dx = driver.lat - shipment.latitude;
  const dy = driver.lng - shipment.longitude;

  return {
    distance: Math.sqrt(dx * dx + dy * dy),
    priority: shipment.priority || 1,
  };
}

/**
 * =========================
 * ACTOR FORWARD PASS (π)
 * =========================
 */

function actorScore(
  driverId: string,
  features: any
) {
  if (actorWeights[driverId] === undefined) {
    actorWeights[driverId] =
      Math.random() * 0.5;
  }

  return (
    actorWeights[driverId] *
    (1 / (1 + features.distance))
  );
}

/**
 * =========================
 * CRITIC FORWARD PASS (V)
 * =========================
 */

function criticValue(features: any) {
  const key = JSON.stringify(features);

  if (criticWeights[key] === undefined) {
    criticWeights[key] = Math.random() * 0.5;
  }

  return criticWeights[key];
}

/**
 * =========================
 * SOFTMAX DRIVER SELECTION
 * =========================
 */

export function selectDriverDeepPPO(
  drivers: Driver[],
  shipment: Shipment
): Driver | null {
  if (!drivers.length) return null;

  const scored = drivers.map((d) => {
    const features = encodeState(
      d,
      shipment
    );

    return {
      driver: d,
      score: actorScore(d.id, features),
      features,
    };
  });

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

  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];

    if (r <= acc) {
      return scored[i].driver;
    }
  }

  return scored[0].driver;
}

/**
 * =========================
 * REWARD FUNCTION (OSRM + TRAFFIC)
 * =========================
 */

async function computeReward(
  driver: Driver,
  shipment: Shipment
) {
  const route = await getHybridRoute(
    driver,
    shipment,
    shipment
  );

  return (
    -route.duration -
    route.trafficCost * 80 +
    (shipment.priority || 1) * 40
  );
}

/**
 * =========================
 * EXPERIENCE STORAGE
 * =========================
 */

async function logExperience(
  driver: Driver,
  shipment: Shipment,
  reward: number
) {
  const features = encodeState(
    driver,
    shipment
  );

  const value = criticValue(features);

  storeExperience({
    state: JSON.stringify(features),
    driverId: driver.id,
    shipmentId: shipment.id,
    reward,
    value,
  });
}

/**
 * =========================
 * PPO UPDATE STEP (CLIPPED ADVANTAGE)
 * =========================
 */

function updateFromBatch() {
  const batch = sampleBatch(32);

  if (!batch.length) return;

  for (const exp of batch) {
    const advantage =
      exp.reward - exp.value;

    const clipped = Math.max(
      -1,
      Math.min(1, advantage)
    );

    /**
     * ACTOR UPDATE
     */
    actorWeights[exp.driverId] =
      (actorWeights[exp.driverId] ??
        0) +
      0.03 * clipped;

    /**
     * CRITIC UPDATE
     */
    criticWeights[exp.state] =
      (criticWeights[exp.state] ??
        0) +
      0.05 * clipped;
  }
}

/**
 * =========================
 * MAIN DISPATCH FUNCTION
 * =========================
 */

export async function generateDeepPPO(
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

  /**
   * 1. Select driver (policy)
   */
  const selected =
    selectDriverDeepPPO(drivers, shipment);

  if (!selected) {
    return {
      shipmentId: shipment.id,
      driverId: null,
      status: "FAILED_SELECTION",
    };
  }

  /**
   * 2. Compute reward (real-world routing cost)
   */
  const reward = await computeReward(
    selected,
    shipment
  );

  /**
   * 3. Log experience (for replay buffer)
   */
  await logExperience(
    selected,
    shipment,
    reward
  );

  return {
    shipmentId: shipment.id,
    driverId: selected.id,
    reward,
    status: "ASSIGNED_DEEP_PPO",
  };
}

/**
 * =========================
 * BACKGROUND TRAINING LOOP
 * =========================
 */

export function startDeepPPOTrainingLoop() {
  setInterval(() => {
    updateFromBatch();
  }, 5000);
}