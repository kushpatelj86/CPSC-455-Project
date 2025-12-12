import { encrypt } from '../protections/encryption.js';
import { santize } from '../protections/sanitization.js';
import { rateLimit } from '../protections/rateLimiting.js';

let userList = [];

//adds user to global list
export function addUser(username) {
  userList.push(username);
}

export function removeUser(username) {
  const index = userList.indexOf(username);
  if (index > -1) {
    userList.splice(index, 1);
  }
}

export function getUserList() {
  return [...userList];
}

export function sendEncryptedNotification(wss, messageText, username = null) {
  const santizedMessage = santize(messageText);
  const encryptedMessage = encrypt(santizedMessage);
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


export function broadcast(message, wss) {
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

export function handleMessage(client, wss, parsedData) {
  const { username, reciever, message } = parsedData;

   if (!rateLimit(client, 'message', wss)) 
   {
        console.log(`${username} has been rate limited`)
        return;
   }
  
    const santizedMessage = santize(message)
    const encryptedMessage = encrypt(santizedMessage);
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

export function handleJoin(client, wss, parsedData) {

  const { username, reciever, message } = parsedData;

    client.username = username;
    addUser(username);

    console.log(`${username} joined the chat.`);
    console.log("User list:", userList);

    sendEncryptedNotification(wss, `${username} joined the chat.`, username);

}
