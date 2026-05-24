import { Kafka } from "kafkajs";
import {
  upsertNode,
  getAllNodes,
} from "../redis/graphStore";

const kafka = new Kafka({
  clientId: "stgat-worker",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: "stgat-group",
});

const DIM = 6;

/**
 * SIMPLE ATTENTION SCORE
 */
function attention(a: any, b: any) {
  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;

  const dist = Math.sqrt(dx * dx + dy * dy);

  let dot = 0;
  for (let i = 0; i < DIM; i++) {
    dot += (a.h?.[i] || 0) * (b.h?.[i] || 0);
  }

  return dot / (1 + dist);
}

/**
 * LOCAL GAT UPDATE
 */
function updateNode(node: any, neighbors: any[]) {
  const weights = neighbors.map((n) =>
    attention(n, node)
  );

  const sum = weights.reduce(
    (a, b) => a + b,
    0
  );

  const norm =
    sum === 0
      ? weights.map(() => 1)
      : weights.map((w) => w / sum);

  const agg = new Array(DIM).fill(0);

  neighbors.forEach((n, i) => {
    for (let j = 0; j < DIM; j++) {
      agg[j] +=
        (n.h?.[j] || 0) * norm[i];
    }
  });

  node.h = node.h.map((v: number, i: number) =>
    Math.tanh(v + 0.5 * agg[i])
  );

  return node;
}

async function process() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "driver-gps-events",
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(
        message.value!.toString()
      );

      /**
       * 1. LOAD CURRENT GRAPH
       */
      const nodes = await getAllNodes();

      /**
       * 2. UPDATE DRIVER NODE
       */
      let driver = nodes.find(
        (n: any) =>
          n.id === event.driverId
      );

      if (!driver) {
        driver = {
          id: event.driverId,
          type: "driver",
          lat: event.lat,
          lng: event.lng,
          h: [0, 0, 0, 0, 0, 0],
        };
      } else {
        driver.lat = event.lat;
        driver.lng = event.lng;
      }

      /**
       * 3. NEIGHBORHOOD UPDATE (LOCALIZED)
       */
      const updated = updateNode(
        driver,
        nodes.filter(
          (n: any) => n.id !== driver.id
        )
      );

      /**
       * 4. PERSIST BACK TO REDIS
       */
      await upsertNode(
        driver.id,
        updated
      );
    },
  });
}

process();