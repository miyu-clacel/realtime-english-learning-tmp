import { createServer } from "http";
import { parse } from "url";
import next from "next";
import {
  attachWebSocketServer,
  createWebSocketServer,
} from "./src/lib/ws-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
const wsPort = process.env.WS_PORT
  ? parseInt(process.env.WS_PORT, 10)
  : null;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  if (wsPort) {
    createWebSocketServer(wsPort);
  } else {
    attachWebSocketServer(server);
  }

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    if (!wsPort) {
      console.log("> WebSocket available on the same port");
    }
  });
});
