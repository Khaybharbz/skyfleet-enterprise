import { runEnterpriseDispatch } from "./enterpriseAI";
import { runPredictiveAI } from "./predictiveAI";
import { runSelfHealingSystem } from "./selfHealingAI";

/**
 * 🧠 MASTER AI ORCHESTRATOR
 * This runs all intelligence layers safely in sequence
 */
export const runLogisticsAI = async (shipments: any[]) => {
  try {
    // 1. Dispatch optimization
    await runEnterpriseDispatch();

    // 2. Prediction engine
    await runPredictiveAI(shipments);

    // 3. Self-healing layer
    await runSelfHealingSystem();
  } catch (err) {
    console.error("AI system error:", err);
  }
};