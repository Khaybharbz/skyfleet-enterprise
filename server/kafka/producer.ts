import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "fleet-system",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

export async function sendGPSUpdate(event: {
  driverId: string;
  lat: number;
  lng: number;
  speed: number;
}) {
  await producer.connect();

  await producer.send({
    topic: "driver-gps-events",
    messages: [
      {
        key: event.driverId,
        value: JSON.stringify(event),
      },
    ],
  });
}