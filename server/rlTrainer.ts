
import { redis } from "./redis";
import { rlPolicy } from "@/lib/ai/rlPolicy";

/**
 * =========================================================
 * EXPERIENCE TYPE
 * =========================================================
 */

type Experience = {
  state: any;
  action: any;
  reward: number;
  timestamp: number;
};

/**
 * =========================================================
 * ADVANTAGE ESTIMATION (SIMPLE BASELINE)
 * =========================================================
 */

function computeAdvantages(rewards: number[]) {
  const mean =
    rewards.reduce((a, b) => a + b, 0) /
    (rewards.length || 1);

  return rewards.map((r) => r - mean);
}

/**
 * =========================================================
 * TRAINING LOOP
 * =========================================================
 */

export async function trainPolicyBatch() {
  const raw = await redis.lrange(
    "rl:buffer",
    0,
    5000
  );

  if (raw.length < 100) return;

  const batch: Experience[] = raw.map((r) =>
    JSON.parse(r)
  );

  const rewards = batch.map(
    (b) => b.reward
  );

  const advantages =
    computeAdvantages(rewards);

  let totalLoss = 0;

  /**
   * PPO-LIKE UPDATE STEP (SIMPLIFIED)
   */
  for (let i = 0; i < batch.length; i++) {
    const exp = batch[i];

    totalLoss += rlPolicy.update(
      exp.state,
      exp.action,
      advantages[i]
    );
  }

  console.log(
    "[RL TRAIN]",
    "loss:",
    totalLoss
  );

  /**
   * SAVE POLICY SNAPSHOT
   */
  await rlPolicy.saveSnapshot();
}