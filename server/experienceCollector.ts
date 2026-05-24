
import { gpsConsumer } from "./kafka";
import { redis } from "./redis";
import { KAFKA_TOPICS } from "./kafkaTopics";

/**
 * =========================================================
 * EXPERIENCE FORMAT (STRICT CONTRACT)
 * =========================================================
 */

export type Experience = {
  state: any;
  action: any;
  reward: number;
  timestamp: number;
};

/**
 * =========================================================
 * COLLECTOR
 * =========================================================
 */

export async function startExperienceCollector() {
  await gpsConsumer.subscribe({
    topic: KAFKA_TOPICS.DISPATCH_EVENTS,
  });

  await gpsConsumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(
        message.value!.toString()
      );

      /**
       * ONLY STORE VALID RL SIGNALS
       */
      if (!event?.rewardEvent) return;

      const experience: Experience = {
        state: event.state,
        action: event.action,
        reward: event.reward,
        timestamp: Date.now(),
      };

      /**
       * PUSH INTO REDIS REPLAY BUFFER
       */
      await redis.lpush(
        "rl:buffer",
        JSON.stringify(experience)
      );

      /**
       * LIMIT BUFFER SIZE (STABILITY)
       */
      await redis.ltrim(
        "rl:buffer",
        0,
        20000
      );
    },
  });
}