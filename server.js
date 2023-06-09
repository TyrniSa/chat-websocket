///////////////////////////////////////////////
///////////// IMPORTS + VARIABLES /////////////
///////////////////////////////////////////////

const http = require("http");
const CONSTANTS = require("./utils/constants.js");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const { PORT, CLIENT, SERVER } = CONSTANTS;

///////////////////////////////////////////////
///////////// HTTP SERVER LOGIC ///////////////
///////////////////////////////////////////////

// Create the HTTP server
const server = http.createServer((req, res) => {
  // get the file path from req.url, or '/public/index.html' if req.url is '/'
  const filePath = req.url === "/" ? "/public/index.html" : req.url;

  // determine the contentType by the file extension
  const extname = path.extname(filePath);
  let contentType = "text/html";
  if (extname === ".js") contentType = "text/javascript";
  else if (extname === ".css") contentType = "text/css";

  // pipe the proper file to the res object
  res.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(`${__dirname}/${filePath}`, "utf8").pipe(res);
});

///////////////////////////////////////////////
////////////////// WS LOGIC ///////////////////
///////////////////////////////////////////////

// Create the WebSocket Server using the HTTP server
const wsServer = new WebSocket.Server({ server: server });

wsServer.on("connection", (socket) => {

  // Broadcast client messages to all other clients
  socket.on("message", (data) => {

    const { type, payload } = JSON.parse(data);

    switch (type) {
      case CLIENT.MESSAGE.NEW_MESSAGE:
        broadcast(data, socket);
        break;
      case CLIENT.MESSAGE.NEW_USER:
        const time = new Date().toLocaleString();
        payload.time = time;
        const dataWithTime = {
          type: SERVER.BROADCAST.NEW_USER_WITH_TIME,
          payload
        }
        broadcast(JSON.stringify(dataWithTime));
        break;
      default:
        break;
    }

    
  });
});

///////////////////////////////////////////////
////////////// HELPER FUNCTIONS ///////////////
///////////////////////////////////////////////

// Implementing the broadcast pattern
function broadcast(data, socketToOmit) {
  wsServer.clients.forEach((connectedClient) => {
    if (
      connectedClient.readyState === WebSocket.OPEN &&
      connectedClient !== socketToOmit
    ) {
      connectedClient.send(data);
    }
  });
}

// Start the server listening on localhost:8080
server.listen(PORT, () => {
  console.log(`Listening on: http://localhost:${server.address().port}`);
});
