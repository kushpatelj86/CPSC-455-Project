import fs from 'fs';
import path from 'path';
import express from 'express';
import https from 'https'; 
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { rateLimitMap, resetRateLimit,rateLimit } from './protections/rateLimiting.js';  // Import from the external file
import { resetLoginLimit ,limitLogin, loginAttempts} from './protections/loginlimiting.js';
import { encrypt } from './protections/encryption.js';

//stored encryption,ratelimiting and login limiting in a seprate folder
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
// MongoDB connection URI

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express Server
const app = express();
const STATIC_DIR = path.join(__dirname, './public');
//the front end is located in the public folder
app.use(express.static(STATIC_DIR));
app.use(express.json());



// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

//Generated Certificates with  "openssl req -nodes -new -x509 -keyout certifications/key.pem -out certifications/certification.pem -days 365"
const CERT_PATH = path.join(__dirname, './certifications');


// Create HTTPS server
/*const server = https.createServer({
  key: fs.readFileSync(path.join(CERT_PATH, 'key.pem')),
  cert: fs.readFileSync(path.join(CERT_PATH, 'certification.pem'))
}, app);*/

// Initialize server
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`[${new Date().toISOString()}] Server running on https://kush-in-tech-chat.onrender.com`);
})

// Create WebSocket server
const wss = new WebSocketServer({ server });

//Mongodb url
const uri = process.env.MONGODB_URI;
// Connect to MongoDB




//Connects to database

async function connectDB() {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
}
connectDB();

// User schema for MongoDB
const userDB = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userDB);



function checkValidPassword(password) {
  // Check length (minimum 8 characters)
  if (password.length < 8) {
    return false;
  }

  let hasUpperCase = false;
  let hasLowerCase = false;
  let hasNumber = false;
  let hasSpecialChar = false;
  const specialChars = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?";

  // Check each character in the password
  for (let i = 0; i < password.length; i++) {
    const char = password[i];

    if (char >= 'A' && char <= 'Z') {
      hasUpperCase = true;
    } 
    else if (char >= 'a' && char <= 'z') {
      hasLowerCase = true;
    } 
    else if (char >= '0' && char <= '9') {
      hasNumber = true;
    } 
    else if (specialChars.includes(char)) {
      hasSpecialChar = true;
    }
  }

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return false;
  }

  return true;
}


// Send authentication response
function sendAuthenticationResponse(client,type, status, message = "",islimited=false) {
  client.send(JSON.stringify({
    type: type,
    status,
    message,
    islimited
  }));
}

// Send error response
function sendError(client, error = "") {
  client.send(JSON.stringify({
    type: "login",
    status: "fail",
    error
  }));
}



let userList = [];

//adds user to global list
function addUser(username) {
  userList.push(username);
}

function removeUser(username) {
  const index = userList.indexOf(username);
  if (index > -1) {
    userList.splice(index, 1);
  }
}

function getUserList() {
  return [...userList];
}

function sendEncryptedNotification(wss, messageText, username = null) {
  const encryptedMessage = encrypt(messageText);
  const payload = {
    type: "notification",
    message: encryptedMessage
  };
  if (username) {
    payload.username = username;
    payload.userList = getUserList();
  }
  broadcast(JSON.stringify(payload), wss);
}


function broadcast(message, wss) {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

function sendToIndividual(sender, recipient, message, wss) {
  wss.clients.forEach(c => {
    if (c.readyState === c.OPEN && (c.username === sender || c.username === recipient)) {
      c.send(message);
    }
  });
}



// Handle WebSocket connections
wss.on('connection', (client, req) => {
  console.log("New client connected.");


  client.on('message', async (data) => {
    try {
      console.log("Server received raw data:", data);
      const parsedData = JSON.parse(data);
      console.log("Received:", parsedData);
      console.log("reciver:", parsedData.reciever);
      const { type, username, password, reciever, message, captchaCode } = parsedData;
      let isLoginLimited = false;
      if (parsedData.type === "login") {
        console.log("captchaCode ", captchaCode)
        if (!parsedData.username || !parsedData.password) {
              sendAuthenticationResponse(client,parsedData.type , "fail", "Username and password required.",isLoginLimited);
        }

        // Apply login limit check before proceeding with authentication
        if (!limitLogin(client)) {
          isLoginLimited = true;
          const LOCK_TIME = 10 * 6000;
          const timeRemaining = LOCK_TIME - (Date.now() - client.attemptData.lastViolationTime);
          sendAuthenticationResponse(client,parsedData.type , "fail", `Account locked. Try again in ${Math.ceil(timeRemaining / 1000)} seconds.`,isLoginLimited);
        }

        if (!captchaCode) {
          sendAuthenticationResponse(client,parsedData.type , "fail", "No captchaCode code provided.",isLoginLimited);
        }

        let user = null;

        try {
          // Check if the user exists in MongoDB
          user = await User.findOne({ username });

          if (!user) {
            console.log('User does not exist.');
            sendAuthenticationResponse(client, parsedData.type ,"fail", "User does not exist.",isLoginLimited);

          } 
          else {
            console.log('User:', user);
          }
        } catch (err) {
          console.error('Error querying MongoDB:', err);
          sendError(client, "Server error.");

        }

        try {
          // Check the password only if the user exists
          const isPasswordCorrect = await bcrypt.compare(password, user.password);

          if (isPasswordCorrect && !isLoginLimited) {
            sendAuthenticationResponse(client, parsedData.type ,"success", "Login successful.",isLoginLimited);
          } 
          else {
            sendAuthenticationResponse(client,parsedData.type , "fail", "Incorrect password.",isLoginLimited);
          }
        } catch (error) {
          console.error("Error during password comparison:", error);
          sendError(client, "Error during authentication.");
        }        
      } 
      else if (parsedData.type === "registration") 
      {
        if (!username || !password) {
             sendAuthenticationResponse(client,parsedData.type , "fail", "Username and password required.",isLoginLimited);
          }   
          // Checks for password strength
          const passwordValidation = checkValidPassword(password);
          if (!passwordValidation) 
          {
            sendAuthenticationResponse(client,parsedData.type , "fail", "Password must be at least 8 characters long, with an uppercase letter, a lowercase letter, a number, and a special character.",isLoginLimited);
          }
        
          try {
            // Check if the username already exists in MongoDB
            const existingUser = await User.findOne({ username });
            if (existingUser) {
              sendAuthenticationResponse(client,parsedData.type , "fail", "Username already exists.",isLoginLimited);
            }
        
            // Hash the password and create a new user
            const hash = await bcrypt.hash(password, 10);
            const newUser = new User({ username, password: hash });
            await newUser.save();
        
            console.log(`Created new user account for ${username}`);
        
            // Send success response
            sendAuthenticationResponse(client,parsedData.type , "success", "User registered successfully.",isLoginLimited);
            
          } catch (err) {
            console.error("Error during registration:", err);
            sendError(client, "Server error.");
          }
      } 
      else if (parsedData.type === "join") 
      {
        client.username = username;
        addUser(username);

        console.log(`${username} joined the chat.`);
        console.log("User list:", userList);

        sendEncryptedNotification(wss, `${username} joined the chat.`, username);
      } 
      else if (parsedData.type === "message") 
      {
        if (!rateLimit(client, 'message', wss)) 
        {
          console.log(`${username} has been rate limited`)
          return;
        }
        
          const encryptedMessage = encrypt(message);
          console.log("enceypted message ", encryptedMessage)
          const newMessage = JSON.stringify({
            type: "message",
            username,
            reciever,
            message: encryptedMessage
          });
        
          if (reciever === "All") 
          {
            broadcast(newMessage, wss);
          } 
          else 
          {
            sendToIndividual(username, reciever, newMessage, wss);
          }
      } 
      else 
      {
        client.send(JSON.stringify({ type: "error", error: "Unknown message type." }));
      }
      
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  client.on('close', () => {
    console.log("Client disconnected.");
    if (!client.username) return;

    removeUser(client.username);
    console.log(`${client.username} disconnected.`);
    console.log("User list:", userList);

    sendEncryptedNotification(wss, `${client.username} disconnected.`);
    });
});
setInterval(() => {
  const now = Date.now();

  wss.clients.forEach(client => {
    const key = client.username || client._socket.remoteAddress;
    let rateLimitData = rateLimitMap.get(key);

    if (rateLimitData) {
      if (now - rateLimitData.windowStart > 60 * 1000) { // 60 seconds window
        resetRateLimit(client);
      }
    }

    let loginInAtemmptData = loginAttempts.get(key);
    if (loginInAtemmptData) {
      if (now - loginInAtemmptData.lastViolationTime > 60 * 1000) { // 60 seconds window
        resetLoginLimit(client);
      }
    }
  });
}, 60000); // every 10 seconds