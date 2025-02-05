//client.js
import WebSocket from 'ws';
import promptSync from 'prompt-sync'
import fs from 'fs'
import readline from 'readline';
import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

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

async function comparePassword(plainPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return isMatch;  
    } catch (err) {
        console.error('Error comparing password:', err);
    }
}

 async function checkValidPassword(){
    const currentObject = JSONData();
    let isValid = false;
    for (const key in currentObject) {
        
        console.log(currentObject[key].password === password)
        console.log(currentObject[key].username === userName)
        console.log(currentObject[key].password) 
        console.log(password) 
        const ismatch = await comparePassword(password, currentObject[key].password);

        console.log(ismatch) 
        console.log("checking")
        console.log("checking if true or false ", currentObject[key].username === userName && ismatch)
        if(currentObject[key].username === userName && ismatch)
        {
            isValid = true;
            break;
        }
  
    }
    console.log("is valid ", isValid)
    return isValid;


    /*const object =  currentObject.some(async user => {
        const ismatch = await bcrypt.compare(password,user.password );
        console.log(user.password) 
        console.log(password) 
        console.log(ismatch) 
        console.log("checking")
        console.log(user.username === userName && ismatch)
        
        const valid = user.username === userName && ismatch;
        return valid
    });
    console.log("ptiny oject");
    console.log(object);

    return true;*/
}

if(!UserExist()) {
    var currentObject = JSONData();

    const salt =   bcrypt.genSaltSync(randomInt((password.length)));
    const hash =  await bcrypt.hash(password, salt);
    
    const newUser = {
        
        "username" : userName,
        "password" : hash
        
    };
    currentObject.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify (currentObject, null, 2));
    console.log("User created");
}
console.log("debugging");
const promise = await checkValidPassword();
console.log("checkign password ", promise)
console.log(UserExist() === false)

if (UserExist() === false || promise === false) {
    console.log("Invalid password");
    process.exit(1);
}

const serverAddress = "wss://localhost:8000";
const cliSocket = new WebSocket(serverAddress);

// Create a readline interface to read from the console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Your message: '
});

cliSocket.on('error', console.error);

cliSocket.on('open', () => {
    console.log("Connected to server");
    
    const joinMsg = {type: "join", username: userName};
    cliSocket.send(JSON.stringify(joinMsg));

    console.log("Type your message and press enter (or type 'exit' to quit):");
    rl.prompt();
});

// When the client receives a message from the server, it will print it to the console
cliSocket.on('message', (data) => {
    try {
        const received = JSON.parse(data.toString());
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        if (received.type === "notification" || received.type === "userList") {
          console.log(received.message);
        } else if (received.error) {
          console.log(`Error: ${received.error}`);
        } else {
          console.log(`Received from ${received.username}: ${received.message}`);
        }
    } catch (e) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.error(`Received: ${data.toString()}`);
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
    const msg = {username: userName,message: line};
    cliSocket.send(JSON.stringify(msg));
    rl.prompt();
});

cliSocket.on('close', () => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log("Connection to server closed.");
    process.exit(0);
});