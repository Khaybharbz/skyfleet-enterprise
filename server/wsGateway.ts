import { WebSocketServer } from "ws";
import { createClient } from "redis";

import { kafkaConsumer } from "./kafka";
import { KAFKA_TOPICS } from "./kafkaTopics";

/**
 * =========================
 * REDIS
 * =========================
 */

const redis = createClient();

await redis.connect();

const fleetKey = "fleet:latest";

/**
 * =========================
 * TYPES
 * =========================
 */

type FleetNode = {
  id: string;
  type: string;
  lat: number;
  lng: number;
  speed: number;
  eta?: number;
  utilization?: number;
  congestion?: number;
  healthScore?: number;
  routeTrail?: number[][];
  timestamp?: number;
};

type FleetState = {
  nodes: FleetNode[];
  assignments: Record<string, string>;
  alerts: any[];
};

/**
 * =========================
 * AI ETA ENGINE
 * =========================
 */

function predictETA(node: FleetNode) {
  const congestionFactor =
    node.congestion || 1;

  const speed =
    Math.max(node.speed, 15);

  return Math.round(
    (120 / speed) * congestionFactor
  );
}

/**
 * =========================
 * HEALTH ENGINE
 * =========================
 */

function computeHealth(node: FleetNode) {
  let score = 100;

  if (node.speed < 10) score -= 15;

  if ((node.congestion || 0) > 0.7)
    score -= 25;

  return Math.max(score, 0);
}

/**
 * =========================
 * AI DISPATCH ENGINE
 * =========================
 */

function assignVehicle(
  shipmentId: string,
  state: FleetState
) {
  if (!state.nodes.length) return null;

  const best = [...state.nodes]
    .sort((a, b) => {
      const aScore =
        (a.healthScore || 0) -
        (a.eta || 0);

      const bScore =
        (b.healthScore || 0) -
        (b.eta || 0);

      return bScore - aScore;
    })[0];

  state.assignments[shipmentId] =
    best.id;

  return best.id;
}

/**
 * =========================
 * START WS GATEWAY
 * =========================
 */

export async function startWsGateway(
  server: any
) {
  const wss = new WebSocketServer({
    server,
  });

  console.log(
    "🚀 Enterprise WS Gateway Started"
  );

  /**
   * LOAD STATE
   */
  async function getFleetState(): Promise<FleetState> {
    const data =
      await redis.get(fleetKey);

    return data
      ? JSON.parse(data)
      : {
          nodes: [],
          assignments: {},
          alerts: [],
        };
  }

  /**
   * SAVE STATE
   */
  async function saveState(
    state: FleetState
  ) {
    await redis.set(
      fleetKey,
      JSON.stringify(state)
    );
  }

  /**
   * CLIENT CONNECTION
   */
  wss.on("connection", async (ws) => {
    console.log(
      "🟢 Client Connected"
    );

    const state =
      await getFleetState();

    ws.send(
      JSON.stringify({
        type: "INIT_STATE",
        payload: state,
      })
    );
  });

  /**
   * =========================
   * GPS STREAM
   * =========================
   */

  await kafkaConsumer.subscribe({
    topic: KAFKA_TOPICS.GPS_STREAM,
  });

  await kafkaConsumer.run({
    eachMessage: async ({
      message,
    }) => {
      try {
        const gps = JSON.parse(
          message.value!.toString()
        );

        const state =
          await getFleetState();

        const idx =
          state.nodes.findIndex(
            (n) =>
              n.id === gps.driverId
          );

        const previous =
          idx >= 0
            ? state.nodes[idx]
            : null;

        /**
         * ROUTE TRAILS
         */
        const trail =
          previous?.routeTrail || [];

        trail.push([
          gps.lat,
          gps.lng,
        ]);

        if (trail.length > 50) {
          trail.shift();
        }

        /**
         * ENRICH NODE
         */
        const updatedNode: FleetNode =
          {
            id: gps.driverId,
            type: "driver",
            lat: gps.lat,
            lng: gps.lng,
            speed: gps.speed,
            congestion:
              Math.random(),
            utilization:
              Math.floor(
                Math.random() * 100
              ),
            routeTrail: trail,
            timestamp:
              gps.timestamp,
          };

        /**
         * AI ENGINES
         */
        updatedNode.eta =
          predictETA(updatedNode);

        updatedNode.healthScore =
          computeHealth(updatedNode);

        /**
         * UPDATE STATE
         */
        if (idx >= 0) {
          state.nodes[idx] =
            updatedNode;
        } else {
          state.nodes.push(
            updatedNode
          );
        }

        /**
         * AUTO DISPATCH
         */
        assignVehicle(
          "SHIPMENT-001",
          state
        );

        /**
         * SAVE
         */
        await saveState(state);

        /**
         * BROADCAST
         */
        const payload =
          JSON.stringify({
            type: "NODE_UPDATE",
            payload: updatedNode,
          });

        wss.clients.forEach(
          (client: any) => {
            if (
              client.readyState === 1
            ) {
              client.send(payload);
            }
          }
        );
      } catch (err) {
        console.error(
          "WS Stream Error",
          err
        );
      }
    },
  });
}