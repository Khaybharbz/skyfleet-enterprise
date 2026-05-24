
import { gpsConsumer } from "./kafka";
import { streamingSTGAT } from "@/lib/ai/streamingSTGAT";
import { KAFKA_TOPICS } from "./kafkaTopics";

/**
 * =========================================================
 * STREAMING RL LEARNER (STABLE VERSION)
 * =========================================================
 */

export async function startKafkaLearner() {
  await gpsConsumer.subscribe({
    topic: KAFKA_TOPICS.REWARD_EVENTS,
  });

  await gpsConsumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(
        message.value!.toString()
      );

      if (!event?.reward) return;

      const state = event.state;
      const action = event.action;
      const reward = event.reward;

      /**
       * BASELINE REDUCTION (STABILITY)
       */
      const baseline = 0.3;
      const advantage = reward - baseline;

      const score = streamingSTGAT.score(
        state,
        action
      );

      const error = advantage - score;

      /**
       * CLAMP GRADIENT (CRITICAL FOR STABILITY)
       */
      const gradient = Math.max(
        Math.min(error * 0.0001, 0.001),
        -0.001
      );

      streamingSTGAT.applyGradient(gradient);
    },
  });
}