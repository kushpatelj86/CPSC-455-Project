import { applyRateLimit } from './ratelimiting.js';
import { encrypt } from './encryption.js';
import { logMessage, logSystemEvent } from './logger.js';

let userList = [];

function addUser(username) {
  userList.push(username);
}

function removeUser(username) {
  const index = userList.indexOf(username);
  if (index > -1) {
    userList.splice(index, 1); // Remove 1 element at the found index
  }
}

// Handle User Joining
export async function handleJoin(client, username, wss) {
  client.username = username;
  console.log(`${username} joined the chat.`);
  await logSystemEvent(`${username} joined the chat.`);
  
  addUser(username);
  console.log("here is the list ", userList);
  
  // Initialize rate limiting data for this client
  client.rateLimitData = {
    timestamps: [],
    fileTimestamps: [],
    exceedCount: 0,
    lastViolationTime: 0,
    timeoutEnd: 0
  };
  
  // Legacy encryption for notifications
  const notification = JSON.stringify({
    type: "notification",
    username,
    userList,
    message: encrypt(`${username} joined the chat.`)
  });
  
  broadcast(notification, wss);
}

// Handle Messages with appropriate encryption
export async function handleMessage(client, username, message, reciever, wss) {
  // Apply rate limiting - if this returns false, exit the function early
  // Pass the wss object to allow for timeout notifications
  if (!applyRateLimit(client, 'message', wss)) {
    console.log(`Rate limit applied to user ${username}. Message rejected.`);
    return;
  }
  
  console.log(`Message from ${username} to ${reciever}: ${message}`);
  await logMessage('message', username, message, reciever);
  
  // Encrypt the message using the existing encryption function
  const encryptedMessage = encrypt(message);
  
  const outgoing = JSON.stringify({ 
    type: "message", 
    username, 
    reciever, 
    message: encryptedMessage 
  });

  if (reciever === "All") {
    // Broadcast to everyone
    broadcast(outgoing, wss);
  } else {
    // Send only to the sender and the specific recipient
    wss.clients.forEach(c => {
      if (c.readyState === c.OPEN && (c.username === reciever || c.username === username)) {
        c.send(outgoing);
      }
    });
  }
}

// Handles file sharing with recipient support
export async function handleFile(client, username, sentfilename, sentfiletype, contents, reciever, wss) {
  // Apply rate limiting
  // Pass the wss object to allow for timeout notifications
  if (!applyRateLimit(client, 'file', wss)) {
    console.log(`Rate limit applied to user ${username}. File upload rejected.`);
    return;
  }
  
  console.log(`File from ${username} to ${reciever}: ${sentfilename}`);
  await logMessage('file', username, `File: ${sentfilename}`, reciever);
  
  // Use the existing encryption function
  const encryptedContents = encrypt(contents);

  const outgoing = JSON.stringify({ 
    type: "file", 
    username, 
    reciever,
    filename: sentfilename,
    filetype: sentfiletype, 
    data: encryptedContents 
  });
  
  if (reciever === "All") {
    broadcast(outgoing, wss);
  } else {
    // Send only to the sender and the designated recipient
    wss.clients.forEach(c => {
      if (c.readyState === c.OPEN && (c.username === reciever || c.username === username)) {
        c.send(outgoing);
      }
    });
  }
}

// Handle User Disconnecting
export async function handleDisconnect(client, wss) {
  if (!client.username) return;
  
  removeUser(client.username);
  console.log(`${client.username} disconnected.`);
  console.log("here is the list ", userList);
  await logSystemEvent(`${client.username} disconnected.`);

  const disconnectMsg = JSON.stringify({
    type: "notification",
    userList,
    message: encrypt(`${client.username} disconnected.`)
  });

  broadcast(disconnectMsg, wss);
}

// Broadcast Message
function broadcast(message, wss) {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

// Send a system notification to the chat
export function sendSystemNotification(wss, message) {
  const encryptedMessage = encrypt(message);
  const notification = JSON.stringify({
    type: "notification",
    message: encryptedMessage
  });
  
  broadcast(notification, wss);
}