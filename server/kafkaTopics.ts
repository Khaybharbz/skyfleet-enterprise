
/**
 * =========================================================
 * KAFKA TOPICS (SYSTEM CONTRACT LAYER)
 * =========================================================
 */

export const KAFKA_TOPICS = {
  GPS_STREAM: "gps-stream",

  DISPATCH_DECISIONS: "dispatch-decisions",

  DISPATCH_EVENTS: "dispatch-events",

  REWARD_EVENTS: "reward-events",

  RL_UPDATES: "rl-updates",
} as const;



export const KAFKA_TOPICS = {
  GPS_STREAM: "gps-stream",
  DISPATCH_EVENTS: "dispatch-events",
} as const;


export type KafkaTopic =
  (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];