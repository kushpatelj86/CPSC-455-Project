
const PORT = 8000;

// Rate limiting settings: 5 messages per 5-second window.
const RATE_LIMIT_WINDOW_MS = 5000;
const MAX_MESSAGES_PER_WINDOW = 5;
const RESET_VIOLATION_WINDOW_MS = 60000;
const serverSock = new WebSocketServer({port:PORT});

serverSock.on('connection', (client) => {
    console.log("New client connected");

    client.username = "Anonymous";
    client.rateLimitData = {
        timestamps: [],
        exceedCount: 0,
        lastViolationTime: 0,
        timeoutEnd: 0
    };
    client.on('error', console.error);

    client.on('message', (data) => {
        // Parse the incoming message
        let parsed;
        try {
            parsed = JSON.parse(data.toString());
        } catch(e) {
            client.error("Failed to parse message.", e);
            return;
        }
        //If the message is a join message, set the client's username
        if(parsed.type && parsed.type === "join") {
            client.username = parsed.username;
            console.log(`${client.username} joined the chat.`);
            const joinNotification = JSON.stringify({
                type: "notification",
                message: `${client.username} joined the chat.`
            });
            serverSock.clients.forEach((otherClient) => {
                if(otherClient !== client && otherClient.readyState === client.OPEN) {
                    otherClient.send(joinNotification);
                }
            });
            //Building a list of all the usernames in the chat
            const userList = Array.from(serverSock.clients)
                .map(c => c.username)
                .filter(name => name && name !== "Anonymous")
                .join(", ");
            const userListMsg = JSON.stringify({
                type: "userList",
                message: `Users in chat: ${userList}`
            });
            client.send(userListMsg);
            return;
        }
        //Rate limiting logic
        const now = Date.now();
        if(now < client.rateLimitData.timeoutEnd) {
            const remaining = Math.ceil((client.rateLimitData.timeoutEnd - now) / 1000);
            client.send(JSON.stringify({ error: `Rate limit exceeded. You are timed out for ${remaining} more seconds.` }));
            console.log(`Client is still timed out. Message rejected.`);
            return;
        }
        // Remove timestamps older than the rate limit window
        client.rateLimitData.timestamps = client.rateLimitData.timestamps.filter((timestamp) =>
           now - timestamp < RATE_LIMIT_WINDOW_MS
        );
        // Reset the violation count if the last violation was more than a minute ago
        if(now - client.rateLimitData.lastViolationTime > RESET_VIOLATION_WINDOW_MS) {
            client.rateLimitData.exceedCount = 0;
        }
        // If the client has exceeded the rate limit, send an error message and return
        if(client.rateLimitData.timestamps.length >= MAX_MESSAGES_PER_WINDOW) {
            client.rateLimitData.exceedCount++;
            client.rateLimitData.lastViolationTime = now;
            const timeoutDuration = client.rateLimitData.exceedCount * 10000;
            client.rateLimitData.timeoutEnd = now + timeoutDuration;
            client.send(JSON.stringify({ error: `Rate limit exceeded. You are timed out for ${timeoutDuration / 1000} seconds.` }));
            console.log(`Rate limit exceeded. Client timed out for ${timeoutDuration / 1000} seconds (Violation count: ${client.rateLimitData.exceedCount}).`);
            return;
        }
        client.rateLimitData.timestamps.push(now);
        console.log(`Reiceved message from ${client.username}: ${parsed.message}`);
        // Broadcast the message to all clients
        const outgoing = JSON.stringify({username: client.username, message: parsed.message});
        serverSock.clients.forEach((otherClient) => {
            if(otherClient !== client && otherClient.readyState === client.OPEN) {
                otherClient.send(outgoing);
            }
        });
    });
    
    //Helps out with client disconnection
    client.on('close', () => {
        const disconnectMsg = JSON.stringify({
            type: "notification",
            message: `${client.username} disconnected from chat.`
        });
        console.log(`${client.username} disconnected from chat.`);
        serverSock.clients.forEach((otherClient) => {
            if(otherClient !== client && otherClient.readyState === client.OPEN) {
                otherClient.send(disconnectNotification);
            }
        });
    })
});

console.log( (new Date()) + " Server is listening on port " + PORT);