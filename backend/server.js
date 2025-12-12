// server.js
import express from 'express';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Controllers
import { handleLogin, handleRegistration } from './controllers/authController.js';
import { handleMessage, handleJoin, removeUser, sendEncryptedNotification, getUserList } from './controllers/chatController.js';

// Protections
import { rateLimitMap, resetRateLimit } from './protections/rateLimiting.js';
import { resetLoginLimit, loginAttempts } from './protections/loginlimiting.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Enable CORS for React dev server
app.use(cors({
  origin: 'http://localhost:3000', // React dev server
  credentials: true
}));

// MongoDB setup
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatapp';
mongoose.connect(uri)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Optional: Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
  });
}

// Start HTTP server
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (client) => {
  console.log("New WebSocket client connected");

  client.on('message', async (data) => {
    try {
      const parsedData = JSON.parse(data);
      const { type, username, password, captchaCode } = parsedData;

      switch(type) {
        case 'login':
          await handleLogin(client, username, password, type, captchaCode);
          break;

        case 'registration':
          await handleRegistration(client, username, password, type);
          break;

        case 'join':
          handleJoin(client, wss, parsedData);
          break;

        case 'message':
          handleMessage(client, wss, parsedData);
          break;

        default:
          client.send(JSON.stringify({ type: "error", error: "Unknown message type." }));
      }
    } catch (err) {
      console.error("Error processing message:", err);
      client.send(JSON.stringify({ type: "error", error: "Server error" }));
    }
  });

  client.on('close', () => {
    console.log("Client disconnected");
    if (!client.username) return;

    removeUser(client.username);
    console.log(`${client.username} disconnected.`);
    console.log("User list:", getUserList());

    sendEncryptedNotification(wss, `${client.username} disconnected.`);
  });
});

// Reset rate limits and login attempts every minute
setInterval(() => {
  const now = Date.now();

  wss.clients.forEach(client => {
    const key = client.username || client._socket.remoteAddress;

    // Rate limit reset
    const rateLimitData = rateLimitMap.get(key);
    if (rateLimitData && now - rateLimitData.windowStart > 60 * 1000) {
      resetRateLimit(client);
    }

    // Login attempt reset
    const loginAttemptData = loginAttempts.get(key);
    if (loginAttemptData && now - loginAttemptData.lastViolationTime > 60 * 1000) {
      resetLoginLimit(client);
    }
  });
}, 60000); // every 60 seconds
