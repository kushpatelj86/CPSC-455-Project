import https from 'https';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';

import { handleLogin } from './auth.js';
import { handleMessage, handleJoin, handleDisconnect, handleFile } from './chat.js';

// Paths & Directories Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SSL/TLS Certificates
const CERT_PATH = path.join(__dirname, '../certs');
const serverOptions = {
  key: fs.readFileSync(path.join(CERT_PATH, 'key.pem')),
  cert: fs.readFileSync(path.join(CERT_PATH, 'cert.pem'))
};

// Express Server
const app = express();
const STATIC_DIR = path.join(__dirname, '../client');
app.use(express.static(STATIC_DIR));

app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'login.html'));
});

// Create HTTPS Server
const httpsServer = https.createServer(serverOptions, app);
const wss = new WebSocketServer({ server: httpsServer });

console.log(`[${new Date().toISOString()}] Server running on https://0.0.0.0:8001`); //Change to IP, for debugging connection DONT COMMIT IP

wss.on('connection', (client) => {
  console.log("New client connected.");

  client.authenticated = false;

  client.on('message', async (data) => {
    try {
      console.log(data);
      const parsedData = JSON.parse(data);
      console.log("Received:", parsedData);
      console.log("Server received raw data:", data);

      switch (parsedData.type) {
        case "login":
          // Handle login on this connection.
          const success = await handleLogin(client, parsedData.username, parsedData.password);
          client.authenticated = success;
          client.send(JSON.stringify({ type: "login", status: success ? "success" : "fail" }));
          break;

        case "join":
          // For chat connections, mark them as authenticated
          client.authenticated = true;
          handleJoin(client, parsedData.username, wss);
          break;

        case "message":
          if (!client.authenticated) {
            client.send(JSON.stringify({ type: "error", error: "You must be logged in to send messages." }));
            return;
          }
          // Note: Pass the reciever field along to the handler.
          handleMessage(client, parsedData.username, parsedData.message, parsedData.reciever, wss);
          break;

        case "file":
          if (!client.authenticated) {
            client.send(JSON.stringify({ type: "error", error: "You must be logged in to send messages." }));
            return;
          }
          handleFile(client, parsedData.username, parsedData.filename, parsedData.filetype, parsedData.data, parsedData.reciever, wss);
          break;
          


      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  client.on('close', () => {
    console.log("Client disconnected.");
    handleDisconnect(client, wss);
  });
});

httpsServer.listen(8001, () => console.log(`HTTPS running on https://0.0.0.0:8001`)); //Change to IP, for debugging connection DONT COMMIT IT
