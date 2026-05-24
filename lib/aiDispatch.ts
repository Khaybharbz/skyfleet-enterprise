import { selectDriverPPO } from "./rl/ppoPolicy";
import { getHybridRoute } from "./routing/hybridRouter";

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
  trafficFactor?: number;
};

/**
 * =========================
 * ROUTE + REWARD EVALUATION
 * =========================
 */

async function evaluateDriver(
  driver: Driver,
  shipment: Shipment
) {
  const route = await getHybridRoute(
    driver,
    shipment,
    shipment
  );

  /**
   * Reward definition:
   * lower cost = better reward
   */
  const reward =
    -(
      route.duration +
      route.trafficCost * 100 -
      (shipment.priority || 1) * 20
    );

  return {
    driverId: driver.id,
    reward,
    eta: route.duration / 60,
    score: route.score,
  };
}

/**
 * =========================
 * MAIN PPO DISPATCH ENGINE
 * =========================
 */

export async function generateDispatch(
  drivers: Driver[],
  shipment: Shipment
) {
  if (!drivers.length) {
    return {
      shipmentId: shipment.id,
      driverId: null,
      status: "NO_DRIVER_AVAILABLE",
      score: 0,
    };
  }

  /**
   * 1. PPO policy selects candidate driver (stochastic)
   */
  const selectedDriver =
    selectDriverPPO(drivers, shipment);

  if (!selectedDriver) {
    return {
      shipmentId: shipment.id,
      driverId: null,
      status: "FAILED_NO_SELECTION",
      score: 0,
    };
  }

  /**
   * 2. Evaluate real-world route cost
   */
  const result = await evaluateDriver(
    selectedDriver,
    shipment
  );

  /**
   * 3. Return dispatch decision
   */
  return {
    shipmentId: shipment.id,
    driverId: result.driverId,
    score: result.reward,
    eta: result.eta,
    status: "ASSIGNED_PPO",
  };
}

/**
 * =========================
 * ONLINE LEARNING FEEDBACK LOOP
 * =========================
 * Call this AFTER delivery completion
 */

import { updatePolicy } from "./rl/ppoPolicy";

export function trainFromOutcome(
  shipment: Shipment,
  driver: Driver,
  actualReward: number
) {
  /**
   * Update PPO policy with real-world outcome
   */
  updatePolicy(
    shipment,
    driver,
    actualReward
  );
}

/**
 * =========================
 * OPTIONAL: AUTO REWARD BUILDER
 * (use when delivery completes)
 * =========================
 */

export function computeDeliveryReward(
  durationMinutes: number,
  expectedMinutes: number,
  trafficPenalty: number = 0
) {
  const delay =
    expectedMinutes - durationMinutes;

  return (
    delay * 2 - trafficPenalty * 5
  );
}