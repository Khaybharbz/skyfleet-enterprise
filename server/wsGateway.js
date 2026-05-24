import { WebSocketServer } from "ws";
import { redis } from "../lib/redis";
import { CHANNEL } from "../lib/eventBus";

/**
 * =========================================
 * WS SERVER
 * =========================================
 */

const wss = new WebSocketServer({
  port: 8080,
});

console.log(
  "🚀 WS Gateway running on :8080"
);

/**
 * =========================================
 * REDIS SUBSCRIBER
 * =========================================
 */

redis.subscribe(CHANNEL);

redis.on("message", (channel, msg) => {
  if (channel !== CHANNEL) return;

  /**
   * BROADCAST TO ALL CLIENTS
   */

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(msg);
    }
  });
});