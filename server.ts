import { createServer } from "http";
import { parse } from "url";
import next from "next";
import {
  attachWebSocketServer,
  createWebSocketServer,
} from "./src/lib/ws-server";

const dev = process.env.NODE_ENV !== "production";
const bindHost = process.env.BIND_HOST || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
const wsPort = process.env.WS_PORT
  ? parseInt(process.env.WS_PORT, 10)
  : null;

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  server.requestTimeout = 0;
  server.headersTimeout = 0;
  server.keepAliveTimeout = 0;

  if (wsPort) {
    createWebSocketServer(wsPort);
  } else {
    attachWebSocketServer(server);
  }

  server.listen(port, bindHost, () => {
    console.log(`> Ready on http://${bindHost}:${port}`);
    if (!wsPort) {
      console.log("> WebSocket available at /ws");
    }
  });
});
