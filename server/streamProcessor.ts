
import {
  gpsConsumer,
  dispatchProducer,
} from "./kafka";

import { FleetStore } from "./redis";

import { worldModel } from "@/lib/ai/logisticsWorldModel";

let processing = false;

/**
 * SAFE STREAM PROCESSOR (BACKPRESSURE CONTROL)
 */
export async function startStreamProcessor() {
  await gpsConsumer.subscribe({
    topic: "gps-stream",
  });

  await gpsConsumer.run({
    eachMessage: async ({ message }) => {
      if (processing) return; // prevents overload
      processing = true;

      try {
        const data = JSON.parse(
          message.value!.toString()
        );

        /**
         * UPDATE REDIS STATE
         */
        await FleetStore.updateDriver(
          data.id,
          data.lat,
          data.lng
        );

        const nodes =
          await FleetStore.getAllNodes();

        /**
         * RUN AI WORLD MODEL
         */
        const result =
          worldModel.step({
            nodes,
            timestamp: Date.now(),
          });

        /**
         * EMIT DISPATCH RESULT
         */
        await dispatchProducer.send({
          topic: "dispatch-updates",
          messages: [
            {
              value: JSON.stringify(
                result
              ),
            },
          ],
        });
      } finally {
        processing = false;
      }
    },
  });
}