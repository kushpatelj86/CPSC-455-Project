import WebSocket from 'ws';
import promptSync from 'prompt-sync'
import fs from 'fs'
import readline from 'readline';

const prompt = promptSync();
const userName = prompt("Enter Username: ");
const password = prompt.hide('Enter a password: ');

// Check if the file exists, if not creates an empty array
const usersFile = 'users.json';
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
}

function JSONData() {
    const data = fs.readFileSync(usersFile);
    const json_data = JSON.parse(data);
    return json_data;
}

function UserExist() {
    const currentUsers = JSONData();
    return currentUsers.some(user => user.username === userName);
}

function checkValidPassword(){
    const currentObject = JSONData();
    return currentObject.some(user => user.username === userName && user.password === password);
}

if(!UserExist()) {
    var currentObject = JSONData();
    const newUser = {
        
        "username" : userName,
        "password" : password
        
    };
    currentObject.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify (currentObject, null, 2));
    console.log("User created");
}

if (!UserExist() || !checkValidPassword()) {
    console.log("Invalid password");
    process.exit(1);
}

const serverAddress = "ws://localhost:8000";
const cliSocket = new WebSocket(serverAddress);
// Create a readline interface to read from the console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Your message: '
});

cliSocket.on('error', console.error);

cliSocket.on('open', () => {
    console.log("Connected to server. Type your message and press enter (or type 'exit' to quit):");
    rl.prompt();
});
// When the client receives a message from the server, it will print it to the console
cliSocket.on('message', (data) => {
    try {
        const received = JSON.parse(data);
        console.log(`\nReceived from ${received.username}: ${received.message}`);
    } catch (e) {
        console.error(`\nReceived: ${data.toString()}`);
    }
    rl.prompt();
});
//JSON stringifies the message and sends it to the server includes the username.
rl.on('line', (line) => {
    if (line.trim().toLowerCase() === 'exit') {
        cliSocket.close();
        rl.close();
        process.exit(0);
    }
    const msg = {
        username: userName,
        message: line
    };
    cliSocket.send(JSON.stringify(msg));
    rl.prompt();
});

