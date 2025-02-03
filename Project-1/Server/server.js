import {WebSocketServer} from 'ws';

const PORT = 8000;

const serverSock = new WebSocketServer({port:PORT});

serverSock.on('connection', (client) => {
    console.log("New client connected");

    client.on('error', (error) => {
        console.error("Client error: ", error);
    });

    client.on('message', (data) => {
        console.log("Reiceved message:", data.toString());
        // Broadcast the message to all clients
        serverSock.clients.forEach((otherClient) => {
            if(otherClient !== client && otherClient.readyState === client.OPEN) {
                otherClient.send(data);
            }
        });
    });
});

console.log( (new Date()) + " Server is listening on port " + PORT);
