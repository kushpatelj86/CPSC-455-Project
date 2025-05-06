const ws = new WebSocket('wss://localhost:8000');
let currentUsername = "";

ws.onopen = () => console.log("WebSocket connected.");

ws.onmessage = async (msg) => {
  const data = JSON.parse(msg.data);
  console.log("Received:", data);

  const msgBox = document.getElementById("messages");
  const isSender = data.username === currentUsername;

  if (data.type === "login" || data.type === "registration") {
    alert(data.message);
    alert(data.islimited);
    if (data.status === "success" && !data.islimited) {
      document.getElementById("authBox").style.display = "none";
      document.getElementById("chatBox").style.display = "block";
      document.getElementById("currentUser").textContent = currentUsername;
      joinChat();
    }
  }

  if (data.type === "message") {


    //this checks to see if it the message is encrypted or not
    if(typeof data.message !== 'object')
    {
      alert(data.message)
    }
    else
    {
      try {
        const decrypted = await decrypt(data.message);
        const msg = document.createElement("div");
        if (isSender) {
          msg.className = "msg msg-sender";
        } 
        else {
          msg.className = "msg msg-receiver";
        }
        msg.textContent = `${data.username}: ${decrypted}`;
        msgBox.appendChild(msg);
      } catch (err) {
        const errMsg = document.createElement("div");
        errMsg.className = "msg notify";
        errMsg.textContent = `Error Failed to decrypt: ${err.message}`;
        msgBox.appendChild(errMsg);
      }
      msgBox.scrollTop = msgBox.scrollHeight;
    }

    
  }

  if (data.type === "notification") {
    const note = document.createElement("div");
    note.className = "msg notify";
    try {
      note.textContent = `Notification: ${await decrypt(data.message)}`;
    } catch (err) {
      note.textContent = `Error Failed to decrypt: ${err.message}`;
    }
    msgBox.appendChild(note);
    msgBox.scrollTop = msgBox.scrollHeight;
  }
};


let generatedCaptcha = "";

function generateCaptcha() {
  const canvas = document.getElementById("captchaCanvas");
  const ctx = canvas.getContext("2d");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  generatedCaptcha = "";

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 6; i++) {
    const char = chars.charAt(Math.floor(Math.random() * chars.length));
    generatedCaptcha += char;
    const x = 20 + i * 20;
    const y = 35;
    ctx.fillText(char, x, y);
  }
}

function checkCaptcha() {
  const userInput = document.getElementById("captchaInput").value.trim();
  return userInput === generatedCaptcha;
}


function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const captchaCode = document.getElementById("captchaInput").value;

  // Check CAPTCHA
  if (!checkCaptcha()) {
    alert("Incorrect CAPTCHA. Please try again.");
    generateCaptcha();
    return;
  }

  currentUsername = username;
  ws.send(JSON.stringify({ type: "login", username, password, captchaCode }));
}

function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const captchaCode = document.getElementById("captchaInput").value;

  // Check CAPTCHA
  if (!checkCaptcha()) {
    alert("Incorrect CAPTCHA. Please try again.");
    generateCaptcha();
    return;
  }

  currentUsername = username;
  ws.send(JSON.stringify({ type: "registration", username, password, captchaCode }));
}

function joinChat() {
  ws.send(JSON.stringify({ type: "join", username: currentUsername }));
}

function sendMessage() {
  const message = document.getElementById("msgInput").value;
  const receiver = document.getElementById("receiver").value || "All";
  ws.send(JSON.stringify({ type: "message", username: currentUsername, reciever: receiver, message }));
  document.getElementById("msgInput").value = "";
}

//used a similiar algorithm for this https://stackoverflow.com/questions/14603205/how-to-convert-hex-string-into-a-bytes-array-and-a-bytes-array-in-the-hex-strin
//Converts a value from hex to bytes
function hexToBytes(hex) {
  const result = [];
  for (let i = 0; i < hex.length; i += 2) {
    result.push(parseInt(hex.substring(i, i + 2), 16));
  }

  const bytes = new Uint8Array(result);
  return bytes;
}


//Fetches the external key
async function fetchKey() {
  const res = await fetch('/aes-key.pem');
  if (!res.ok) throw new Error("Failed to fetch key");
  const hex = (await res.text()).trim();
  const keyBytes = hexToBytes(hex);
  if (keyBytes.length !== 32) throw new Error("Invalid key length (expected 32 bytes)");
  return keyBytes;
}


//used this website for key https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm
const SECRET_KEY = fetchKey();

async function importAesGcmKey(rawKey) {
  return await crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, true, ["decrypt"]);
}



async function decrypt(encryptedObject) {
  const ivBytes = hexToBytes(encryptedObject.iv);
  const ctBytes = hexToBytes(encryptedObject.ciphertext);
  const tagBytes = hexToBytes(encryptedObject.authTag);
  const combined = new Uint8Array([...ctBytes, ...tagBytes]);
  const keyBytes = await SECRET_KEY;
  const key = await importAesGcmKey(keyBytes);

  try {
    const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivBytes, tagLength: 128 }, key, combined);
    return new TextDecoder().decode(plainBuffer);
  } catch (e) {
    throw new Error("Decryption failed");
  }
}


window.onload = generateCaptcha;