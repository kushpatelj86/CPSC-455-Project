import { applyRateLimit } from './ratelimiting.js'; // ✅ Import rate limiting

// Handle User Joining
export function handleJoin(client, username, wss) {
    client.username = username;
    console.log(`${username} joined the chat.`);

    const joinNotification = JSON.stringify({
        type: "notification",
        message: `${username} joined the chat.`
    });

    broadcast(joinNotification, wss, client);

    // Send user list
    const userList = Array.from(wss.clients)
        .map(c => c.username)
        .filter(name => name !== "Anonymous")
        .join(", ");

    client.send(JSON.stringify({ type: "userList", message: `Users in chat: ${userList}` }));
}

// Handle a user sending a message
export function handleMessage(client, username, message, wss) {
    if (!applyRateLimit(client)) {
        return;
    }

    console.log(`Message from ${username}: ${message}`);

    const outgoingMessage = JSON.stringify({
        type: "message",
        username: username,
        message: message
    });

    broadcast(outgoingMessage, wss, client);
}

// Handle a user disconnecting from the chat
export function handleDisconnect(client, wss) {
    console.log(`${client.username} disconnected.`);

    const disconnectMsg = JSON.stringify({
        type: "notification",
        message: `${client.username} disconnected from chat.`
    });

    broadcast(disconnectMsg, wss, client);
}

// Broadcast a message to all connected clients (except sender)
function broadcast(message, wss, sender = null) {
    if (!wss || !wss.clients) {
        console.error("WebSocket server (wss) is undefined.");
        return;
    }

    wss.clients.forEach(client => {
        if (client !== sender && client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}
