import http from "http";

import { startWsGateway } from "./wsGateway";

/**
 * =========================
 * HTTP SERVER
 * =========================
 */

const server = http.createServer(
  (req, res) => {
    res.writeHead(200);

    res.end(
      "SkyFleet Enterprise WS Running"
    );
  }
);

/**
 * =========================
 * START WS GATEWAY
 * =========================
 */

startWsGateway(server);

/**
 * =========================
 * START SERVER
 * =========================
 */

server.listen(4000, () => {
  console.log(
    "🚀 Enterprise Realtime Server Running on 4000"
  );
});