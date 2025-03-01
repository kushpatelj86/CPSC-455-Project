import {WebSocketServer} from 'ws';
import fs from "fs";
import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

const usersFile = "users.json";

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
        let parsedData;
        parsedData = JSON.parse(data);

        /*try {
            parsedData = JSON.parse(data);
            if (parsedData.type === "login") 
            {
                handleLogin(client, parsedData.username, parsedData.password);
            } 
        } catch(e) {
            console.error("Failed to parse message.", e);
            return;
        }*/

        if(parsedData.type === "login")
        {
            console.log(parsedData.username);
            handleLogin(client, parsedData.username, parsedData.password);

        }

        else if(parsedData.type === "message" ) {
            /*client.username = parsedData.username;
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
            return;*/
            console.log(parsedData.user)

            sendMessage(client,parsedData.user ,parsedData.message);











        }
        //Rate limiting logic
        /*const now = Date.now();
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
        console.log(`Reiceved message from ${client.username}: ${parsedData.message}`);
        // Broadcast the message to all clients
        const outgoing = JSON.stringify({username: client.username, message: parsedData.message});
        serverSock.clients.forEach((otherClient) => {
            if(otherClient !== client && otherClient.readyState === client.OPEN) {
                otherClient.send(outgoing);
            }
        });*/
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
                otherClient.send(disconnectMsg);
            }
        });
    })
});


async function comparePassword(plainPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;  
    } catch (err) {
        console.error('Error comparing password:', err);
    }
}



    async function handleLogin(client, username, password) 
    {
        if (!fs.existsSync(usersFile)) {
            fs.writeFileSync(usersFile, JSON.stringify([]));
        }

        const salt =   bcrypt.genSaltSync(randomInt((password.length)));
        const hash =  await bcrypt.hash(password, salt);
            











        let users = JSON.parse(fs.readFileSync(usersFile));




        const userExists = users.some(user => user.username === username );


        if(!userExists)
        {
            const newUser = {
            
                "username" : username,
                "password" : hash
                
            };
            users.push(newUser);
            fs.writeFileSync(usersFile, JSON.stringify (users, null, 2));
            console.log("User created");
        }

    let isValid = false;
    for (const key in users) {
        
         
        const ismatch = await comparePassword(password, users[key].password);

        console.log(ismatch) 
        console.log("checking")
        console.log("checking if true or false ", users[key].username === username && ismatch)
        if(users[key].username === username && ismatch)
        {
            isValid = true;
            break;
        }
  
    }









        const isValidUser = users.some(user => user.username === username && isValid);

        client.send(JSON.stringify({ type: "login", status: isValidUser ? "success" : "fail" }));
}


function sendMessage(sender, user, message) {


    let striuser = `${user}`
    serverSock.clients.forEach((client) => {
        if (client.readyState === sender.OPEN) {
            client.send(JSON.stringify({ type: "message", username: striuser, message }));
        }
    });



}








console.log( (new Date()) + " Server is listening on port " + PORT);