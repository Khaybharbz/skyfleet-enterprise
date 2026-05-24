
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "fleet-system",
  brokers: ["localhost:9092"],
  retry: { retries: 5 },
});

/**
 * PRODUCERS
 */
export const gpsProducer =
  kafka.producer();

export const dispatchProducer =
  kafka.producer();

/**
 * CONSUMERS
 */
export const gpsConsumer =
  kafka.consumer({
    groupId: "gps-consumers",
  });

export const dispatchConsumer =
  kafka.consumer({
    groupId: "dispatch-consumers",
  });

export async function initKafka() {
  await gpsProducer.connect();
  await dispatchProducer.connect();

  await gpsConsumer.connect();
  await dispatchConsumer.connect();
}

/**
 * SAFE SHUTDOWN
 */
export async function closeKafka() {
  await gpsProducer.disconnect();
  await dispatchProducer.disconnect();

  await gpsConsumer.disconnect();
  await dispatchConsumer.disconnect();
}