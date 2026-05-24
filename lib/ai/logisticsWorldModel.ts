
/**
 * =========================================================
 * LOGISTICS WORLD MODEL (CLEAN DISTRIBUTED CORE)
 * =========================================================
 * - Stateless inference engine
 * - RL-ready hooks (external training pipeline)
 * - Safe for Kafka / worker scaling
 * =========================================================
 */

export type NodeType = "driver" | "shipment";

export type FleetNode = {
  id: string;
  type: NodeType;

  lat: number;
  lng: number;

  embedding: number[];
};

export type WorldState = {
  nodes: FleetNode[];
  timestamp: number;
};

export type DispatchAction = {
  shipmentId: string;
  driverId: string;
  score: number;
};

export type WorldOutput = {
  timestamp: number;
  nodes: FleetNode[];
  actions: DispatchAction[];
};

export type Experience = {
  state: WorldState;
  action: DispatchAction;
  reward: number;
};

/**
 * =========================================================
 * WORLD MODEL ENGINE
 * =========================================================
 */
export class LogisticsWorldModel {
  /**
   * MAIN INFERENCE STEP
   */
  step(state: WorldState): WorldOutput {
    const nodes = state.nodes;

    const drivers = nodes.filter(
      (n) => n.type === "driver"
    );

    const shipments = nodes.filter(
      (n) => n.type === "shipment"
    );

    const actions: DispatchAction[] = [];

    for (const shipment of shipments) {
      let bestDriver = "";
      let bestScore = -Infinity;

      for (const driver of drivers) {
        const score = this.dot(
          driver.embedding,
          shipment.embedding
        );

        if (score > bestScore) {
          bestScore = score;
          bestDriver = driver.id;
        }
      }

      actions.push({
        shipmentId: shipment.id,
        driverId: bestDriver,
        score: bestScore,
      });
    }

    return {
      timestamp: Date.now(),
      nodes,
      actions,
    };
  }

  /**
   * =========================================================
   * REINFORCEMENT SIGNAL ENTRY (EXTERNAL PIPELINE HOOK)
   * =========================================================
   */
  observe(_exp: Experience): void {
    /**
     * Intentionally empty:
     * RL training should be handled by:
     * - offline trainer (batch)
     * - or streaming learner service
     *
     * Keeps inference layer stable.
     */
  }

  /**
   * DOT PRODUCT SIMILARITY
   */
  private dot(a: number[], b: number[]): number {
    let s = 0;

    const len = Math.min(a.length, b.length);

    for (let i = 0; i < len; i++) {
      s += (a[i] || 0) * (b[i] || 0);
    }

    return s;
  }
}

/**
 * SINGLETON INSTANCE (SAFE FOR WORKERS)
 */
export const worldModel = new LogisticsWorldModel();