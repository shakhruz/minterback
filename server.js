import app from "./app";
const _ = require("lodash");

const port = process.env.PORT || "3333";
app.listen(port);
console.log(`Listening on port ${port}`);

const WebSocketServer = require("ws").Server;
//const wss = new WebSocketServer({ server: server });
const wss = new WebSocketServer({ port: 9090 });

wss.on("connection", ws => {
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });
  ws.ping(_.noop);
  ws.on("error", e => {
    console.error(new Date(), "[WS] connection error:", e);
  });
});

setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) {
      console.log(new Date(), "[WS] stale websocket client, terminiating..");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(_.noop);
  });
}, 10 * 1000);

// broadcast function
exports.broadcast = function(data) {
  console.log("broadcast: ", data);
  if (_.isEmpty(data)) {
    return;
  }

  const payload = JSON.stringify(data);

  wss.clients.forEach(ws => {
    ws.send(payload, err => {
      if (err) {
        console.log(new Date(), "[WS] unable to send data to client:", err);
      }
    });
  });
};
