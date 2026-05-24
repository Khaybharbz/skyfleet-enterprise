import { WebSocketServer } from "ws";

const wss = new WebSocketServer({
  port: 8080,
});

console.log("🚀 Skyfleet WS Server running on :8080");

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (data) => {
    console.log("Received:", data.toString());
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

/**
 * =========================================
 * GLOBAL BROADCAST FUNCTION
 * =========================================
 */

export function broadcast(payload) {
  const message = JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}